// === MOCK Midtrans client ===
// This module mocks the Midtrans QRIS payment flow so the frontend can be built
// and demoed end-to-end without real credentials. Every function below mirrors
// the real Midtrans Snap-Bi / Core API contract — when integrating for real,
// replace each function body with the corresponding `midtrans-client` call
// (see https://docs.midtrans.com). The signatures and return shapes are
// intentionally close to the real SDK so swap-over is mechanical.
//
// Real integration outline:
//   bun add midtrans-client
//   import midtransClient from "midtrans-client";
//   const snapBi = new midtransClient.SnapBi({ ... });
//   snapBi.qris().withBody(body).createPayment(externalId)

export type TransactionStatus =
  | "pending"
  | "capture"
  | "settlement"
  | "expire"
  | "cancel"
  | "deny"
  | "refund";

export type FraudStatus = "accept" | "challenge" | "deny" | null;

export interface QrisTransaction {
  orderId: string;
  amount: number;
  status: TransactionStatus;
  fraudStatus: FraudStatus;
  qrString: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateQrisArgs {
  orderId: string;
  amount: number;
  customer?: { firstName?: string; lastName?: string; email?: string };
}

export interface WebhookNotification {
  orderId: string;
  transactionStatus: TransactionStatus;
  fraudStatus: FraudStatus;
}

// In-memory transaction store. === MOCK === — real integration persists via
// Midtrans notifications + a DB table (PlusOrder in our case). The mock keeps
// this Map so getTransactionStatus/simulatePayment can read/mutate state
// across calls without a round-trip to Midtrans.
const transactions = new Map<string, QrisTransaction>();

// Build a QRIS-compliant-looking string. === MOCK === — real integration
// receives `qr_string` directly from Midtrans' createPayment response and
// passes it through unchanged. The mock generates an EMVCo-style payload
// (starts with `00020101021226...`) so the QR renders as a real, scannable
// code (qrcode.react encodes whatever string it's given).
function buildQrString(orderId: string, amount: number): string {
  const amountStr = amount.toFixed(2);
  // EMVCo QRIS structure (simplified, not a real merchant). Encodes order id
  // + amount so each scan is unique. qrcode.react will render this as a
  // scannable QR; a real e-wallet would reject it (no real merchant), but the
  // mock flow uses simulatePayment() to mark it paid.
  const merchant = "BUDGIE-MOCK-MERCHANT";
  return [
    "00020101021226", // QRIS format + point-of-sale method
    "52" + len(merchant) + merchant, // merchant category
    "53" + "03" + "360", // currency: IDR (360)
    "54" + len(amountStr) + amountStr, // transaction amount
    "58" + "02" + "ID", // country code
    "62" + len(orderId) + orderId, // additional data: order id
    "6304", // CRC placeholder (real QRIS computes a CRC16)
  ].join("");
}

function len(s: string): string {
  return s.length.toString().padStart(2, "0");
}

// === MOCK: replace with midtransClient.SnapBi.qris().withBody(body).createPayment(externalId) ===
export async function createQrisTransaction(
  args: CreateQrisArgs,
): Promise<QrisTransaction> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min validity
  const txn: QrisTransaction = {
    orderId: args.orderId,
    amount: args.amount,
    status: "pending",
    fraudStatus: null,
    qrString: buildQrString(args.orderId, args.amount),
    createdAt: now,
    expiresAt,
  };
  transactions.set(args.orderId, txn);
  return { ...txn };
}

// === MOCK: replace with midtransClient.SnapBi.qris().withBody(body).getStatus(externalId) ===
export async function getTransactionStatus(
  orderId: string,
): Promise<QrisTransaction | null> {
  const txn = transactions.get(orderId);
  if (!txn) return null;
  // Auto-expire if past validity period (mirrors Midtrans behaviour).
  if (txn.status === "pending" && new Date() > txn.expiresAt) {
    txn.status = "expire";
  }
  return { ...txn };
}

// === MOCK ONLY — no real Midtrans equivalent. Real flow: the user scans the
// QR with an e-wallet, pays, and Midtrans sends a webhook (see
// verifyWebhookSignature + parseWebhookNotification). The mock has no real
// payment rail, so this function simulates the "user paid" event. REMOVE this
// function when wiring real Midtrans — the webhook handler replaces it. ===
export async function simulatePayment(orderId: string): Promise<QrisTransaction | null> {
  const txn = transactions.get(orderId);
  if (!txn) return null;
  if (txn.status === "pending") {
    txn.status = "settlement";
    txn.fraudStatus = "accept";
  }
  return { ...txn };
}

// === MOCK: replace with midtransClient.SnapBi.notification().withSignature(...).isWebhookNotificationVerified() ===
// Real integration: verify the X-Signature header against Midtrans' public key
// using the SnapBi notification helper. The mock always returns true — NEVER
// ship this in production (an attacker could forge a "settlement" webhook and
// grant themselves Plus for free).
export async function verifyWebhookSignature(
  _headers: Record<string, string>,
  _rawBody: string,
): Promise<boolean> {
  return true;
}

// === MOCK: shape mirrors Midtrans' notification JSON. Real integration uses
// midtransClient.transaction.notification(notificationJson) to parse. ===
export function parseWebhookNotification(body: unknown): WebhookNotification {
  const b = body as Record<string, unknown>;
  return {
    orderId: String(b["order_id"] ?? ""),
    transactionStatus: String(
      b["transaction_status"] ?? "pending",
    ) as TransactionStatus,
    fraudStatus: (b["fraud_status"] ?? null) as FraudStatus,
  };
}

// Test helper: clear the in-memory store between tests. === MOCK ONLY ===
export function __resetMockTransactions(): void {
  transactions.clear();
}
