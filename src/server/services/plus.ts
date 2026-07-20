import { prisma } from "@/lib/prisma";
import {
  createQrisTransaction,
  getTransactionStatus,
  simulatePayment,
  verifyWebhookSignature,
  parseWebhookNotification,
  type WebhookNotification,
} from "@/lib/midtrans";
import type { CheckoutResponse, StatusResponse } from "@/server/schemas/plus";

// Mock pricing. === MOCK === — replace with a real plan/config when wiring
// Midtrans. First month 50% off, then full price monthly.
const FIRST_MONTH_PRICE = 24500;
const REGULAR_PRICE = 49000;

function generateOrderId(): string {
  return `BUDGIE-PLUS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createCheckout(
  userId: string,
): Promise<CheckoutResponse> {
  const orderId = generateOrderId();
  const txn = await createQrisTransaction({
    orderId,
    amount: FIRST_MONTH_PRICE,
  });
  await prisma.plusOrder.create({
    data: {
      orderId: txn.orderId,
      userId,
      amount: txn.amount,
      status: txn.status,
    },
  });
  return {
    orderId: txn.orderId,
    qrString: txn.qrString,
    status: "pending",
    expiresAt: txn.expiresAt.toISOString(),
  };
}

export async function getStatus(
  userId: string,
  orderId: string,
): Promise<StatusResponse | null> {
  const owned = await prisma.plusOrder.findFirst({
    where: { orderId, userId },
    select: { id: true },
  });
  if (!owned) return null;

  const txn = await getTransactionStatus(orderId);
  if (!txn) return null;

  // Sync the PlusOrder row with Midtrans' view of the status (in real
  // integration, this is a fallback to the webhook — the webhook is the
  // source of truth, polling is a backup).
  if (txn.status !== "pending") {
    await prisma.plusOrder.updateMany({
      where: { orderId, status: { not: txn.status } },
      data: {
        status: txn.status,
        paidAt: txn.status === "settlement" ? new Date() : null,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plus: true },
  });

  return {
    transactionStatus: txn.status,
    plus: user?.plus ?? false,
  };
}

// === MOCK ONLY === — simulates the user paying via e-wallet. Real integration
// removes this endpoint entirely; the webhook handler below replaces it.
export async function simulatePaymentForOrder(
  userId: string,
  orderId: string,
): Promise<{ transactionStatus: string } | null> {
  const owned = await prisma.plusOrder.findFirst({
    where: { orderId, userId },
    select: { id: true },
  });
  if (!owned) return null;

  const txn = await simulatePayment(orderId);
  if (!txn) return null;

  await prisma.plusOrder.update({
    where: { orderId },
    data: { status: txn.status, paidAt: new Date() },
  });

  // Grant Plus on settlement.
  if (txn.status === "settlement") {
    await prisma.user.update({
      where: { id: userId },
      data: { plus: true },
      select: { plus: true },
    });
  }

  return { transactionStatus: txn.status };
}

// === Webhook handler — the real integration entry point. ===
// Midtrans POSTs a notification here when the user pays. We verify the
// signature (mock: always true — replace with real verification!), parse the
// body, and on settlement mark the order paid + grant Plus.
export async function handleWebhook(
  headers: Record<string, string>,
  rawBody: string,
  parsedBody: unknown,
): Promise<void> {
  const valid = await verifyWebhookSignature(headers, rawBody);
  if (!valid) return; // silently reject — don't tip off an attacker

  const notification: WebhookNotification = parseWebhookNotification(parsedBody);
  const { orderId, transactionStatus, fraudStatus } = notification;

  const order = await prisma.plusOrder.findUnique({
    where: { orderId },
    select: { id: true, userId: true },
  });
  if (!order) return; // unknown order, ignore

  // Only settle if fraud check passed. capture (card) also counts but we only
  // use QRIS, so settlement is the success path.
  const isSuccess =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept");

  await prisma.plusOrder.update({
    where: { orderId },
    data: {
      status: transactionStatus,
      paidAt: isSuccess ? new Date() : null,
    },
  });

  if (isSuccess) {
    await prisma.user.update({
      where: { id: order.userId },
      data: { plus: true },
      select: { plus: true },
    });
  }
}

// Exported for tests / future use.
export const PLUS_PRICING = {
  firstMonth: FIRST_MONTH_PRICE,
  regular: REGULAR_PRICE,
};
