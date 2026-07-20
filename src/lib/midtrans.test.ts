import { describe, it, expect, beforeEach } from "vitest";
import {
  createQrisTransaction,
  getTransactionStatus,
  simulatePayment,
  verifyWebhookSignature,
  parseWebhookNotification,
  __resetMockTransactions,
} from "@/lib/midtrans";

beforeEach(() => {
  __resetMockTransactions();
});

describe("createQrisTransaction", () => {
  it("returns a pending transaction with a QR string", async () => {
    const txn = await createQrisTransaction({
      orderId: "ORDER-1",
      amount: 24500,
    });
    expect(txn.orderId).toBe("ORDER-1");
    expect(txn.amount).toBe(24500);
    expect(txn.status).toBe("pending");
    expect(txn.fraudStatus).toBeNull();
    expect(txn.qrString).toBeTruthy();
    expect(txn.qrString.startsWith("000201")).toBe(true);
    expect(txn.expiresAt).toBeInstanceOf(Date);
  });

  it("generates a unique QR string per order (encodes orderId)", async () => {
    const a = await createQrisTransaction({ orderId: "AAA", amount: 1000 });
    const b = await createQrisTransaction({ orderId: "BBB", amount: 1000 });
    expect(a.qrString).not.toBe(b.qrString);
    expect(a.qrString).toContain("AAA");
    expect(b.qrString).toContain("BBB");
  });

  it("encodes the amount in the QR string", async () => {
    const txn = await createQrisTransaction({ orderId: "X", amount: 24500 });
    expect(txn.qrString).toContain("24500.00");
  });
});

describe("getTransactionStatus", () => {
  it("returns null for an unknown order", async () => {
    const result = await getTransactionStatus("UNKNOWN");
    expect(result).toBeNull();
  });

  it("returns the pending status after creation", async () => {
    await createQrisTransaction({ orderId: "ORDER-2", amount: 1000 });
    const result = await getTransactionStatus("ORDER-2");
    expect(result?.status).toBe("pending");
  });

  it("returns settlement after simulatePayment", async () => {
    await createQrisTransaction({ orderId: "ORDER-3", amount: 1000 });
    await simulatePayment("ORDER-3");
    const result = await getTransactionStatus("ORDER-3");
    expect(result?.status).toBe("settlement");
    expect(result?.fraudStatus).toBe("accept");
  });
});

describe("simulatePayment", () => {
  it("returns null for an unknown order", async () => {
    const result = await simulatePayment("UNKNOWN");
    expect(result).toBeNull();
  });

  it("transitions pending → settlement", async () => {
    await createQrisTransaction({ orderId: "ORDER-4", amount: 1000 });
    const result = await simulatePayment("ORDER-4");
    expect(result?.status).toBe("settlement");
    expect(result?.fraudStatus).toBe("accept");
  });

  it("does not re-transition an already-settled order", async () => {
    await createQrisTransaction({ orderId: "ORDER-5", amount: 1000 });
    await simulatePayment("ORDER-5");
    const result = await simulatePayment("ORDER-5");
    expect(result?.status).toBe("settlement");
  });
});

describe("verifyWebhookSignature", () => {
  it("returns true (mock always accepts)", async () => {
    const result = await verifyWebhookSignature({}, "");
    expect(result).toBe(true);
  });
});

describe("parseWebhookNotification", () => {
  it("parses a Midtrans-shaped notification body", () => {
    const result = parseWebhookNotification({
      order_id: "ORDER-6",
      transaction_status: "settlement",
      fraud_status: "accept",
    });
    expect(result.orderId).toBe("ORDER-6");
    expect(result.transactionStatus).toBe("settlement");
    expect(result.fraudStatus).toBe("accept");
  });

  it("defaults transaction_status to pending when missing", () => {
    const result = parseWebhookNotification({ order_id: "X" });
    expect(result.transactionStatus).toBe("pending");
  });

  it("defaults fraud_status to null when missing", () => {
    const result = parseWebhookNotification({
      order_id: "X",
      transaction_status: "pending",
    });
    expect(result.fraudStatus).toBeNull();
  });
});
