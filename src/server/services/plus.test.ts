import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma, mockMidtrans } = vi.hoisted(() => ({
  mockPrisma: {
    plusOrder: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockMidtrans: {
    createQrisTransaction: vi.fn(),
    getTransactionStatus: vi.fn(),
    simulatePayment: vi.fn(),
    verifyWebhookSignature: vi.fn(),
    parseWebhookNotification: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/midtrans", () => mockMidtrans);

import {
  createCheckout,
  getStatus,
  simulatePaymentForOrder,
  handleWebhook,
  PLUS_PRICING,
} from "@/server/services/plus";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const ORDER_ID = "BUDGIE-PLUS-123";

const mockTxn = {
  orderId: ORDER_ID,
  amount: 24500,
  status: "pending" as const,
  fraudStatus: null,
  qrString: "00020101021226...",
  createdAt: new Date("2026-07-20"),
  expiresAt: new Date("2026-07-20T12:15:00Z"),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createCheckout", () => {
  it("creates a Midtrans transaction and persists a PlusOrder", async () => {
    mockMidtrans.createQrisTransaction.mockResolvedValue(mockTxn);
    mockPrisma.plusOrder.create.mockResolvedValue({});

    const result = await createCheckout(USER_ID);

    expect(mockMidtrans.createQrisTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: PLUS_PRICING.firstMonth }),
    );
    expect(mockPrisma.plusOrder.create).toHaveBeenCalledWith({
      data: {
        orderId: mockTxn.orderId,
        userId: USER_ID,
        amount: mockTxn.amount,
        status: "pending",
      },
    });
    expect(result.orderId).toBe(mockTxn.orderId);
    expect(result.qrString).toBe(mockTxn.qrString);
    expect(result.status).toBe("pending");
    expect(result.expiresAt).toBe(mockTxn.expiresAt.toISOString());
  });

  it("generates a unique orderId (BUDGIE-PLUS- prefix)", async () => {
    mockMidtrans.createQrisTransaction.mockImplementation((args: { orderId: string }) =>
      Promise.resolve({ ...mockTxn, orderId: args.orderId }),
    );
    mockPrisma.plusOrder.create.mockResolvedValue({});
    await createCheckout(USER_ID);
    const callArgs = mockMidtrans.createQrisTransaction.mock.calls[0][0];
    expect(callArgs.orderId).toMatch(/^BUDGIE-PLUS-/);
  });
});

describe("getStatus", () => {
  it("returns null when the order is not owned by the user", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue(null);
    const result = await getStatus(OTHER_USER_ID, ORDER_ID);
    expect(result).toBeNull();
    expect(mockMidtrans.getTransactionStatus).not.toHaveBeenCalled();
  });

  it("returns the transaction status and plus flag", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue({ id: "order-1" });
    mockMidtrans.getTransactionStatus.mockResolvedValue({
      ...mockTxn,
      status: "settlement",
    });
    mockPrisma.user.findUnique.mockResolvedValue({ plus: true });

    const result = await getStatus(USER_ID, ORDER_ID);
    expect(result).toEqual({ transactionStatus: "settlement", plus: true });
  });

  it("returns plus: false when user is not plus", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue({ id: "order-1" });
    mockMidtrans.getTransactionStatus.mockResolvedValue(mockTxn);
    mockPrisma.user.findUnique.mockResolvedValue({ plus: false });

    const result = await getStatus(USER_ID, ORDER_ID);
    expect(result).toEqual({ transactionStatus: "pending", plus: false });
  });

  it("returns null when Midtrans has no record of the order", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue({ id: "order-1" });
    mockMidtrans.getTransactionStatus.mockResolvedValue(null);
    const result = await getStatus(USER_ID, ORDER_ID);
    expect(result).toBeNull();
  });

  it("syncs the PlusOrder status when Midtrans reports a non-pending status", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue({ id: "order-1" });
    mockMidtrans.getTransactionStatus.mockResolvedValue({
      ...mockTxn,
      status: "settlement",
    });
    mockPrisma.user.findUnique.mockResolvedValue({ plus: true });

    await getStatus(USER_ID, ORDER_ID);
    expect(mockPrisma.plusOrder.updateMany).toHaveBeenCalled();
  });
});

describe("simulatePaymentForOrder", () => {
  it("returns null when the order is not owned by the user", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue(null);
    const result = await simulatePaymentForOrder(OTHER_USER_ID, ORDER_ID);
    expect(result).toBeNull();
    expect(mockMidtrans.simulatePayment).not.toHaveBeenCalled();
  });

  it("simulates payment, updates the order, and grants Plus", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue({ id: "order-1" });
    mockMidtrans.simulatePayment.mockResolvedValue({
      ...mockTxn,
      status: "settlement",
      fraudStatus: "accept",
    });
    mockPrisma.plusOrder.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({ plus: true });

    const result = await simulatePaymentForOrder(USER_ID, ORDER_ID);
    expect(result).toEqual({ transactionStatus: "settlement" });
    expect(mockPrisma.plusOrder.update).toHaveBeenCalledWith({
      where: { orderId: ORDER_ID },
      data: { status: "settlement", paidAt: expect.any(Date) },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { plus: true },
      select: { plus: true },
    });
  });

  it("does not grant Plus when simulation does not settle", async () => {
    mockPrisma.plusOrder.findFirst.mockResolvedValue({ id: "order-1" });
    mockMidtrans.simulatePayment.mockResolvedValue({
      ...mockTxn,
      status: "pending",
    });
    mockPrisma.plusOrder.update.mockResolvedValue({});

    await simulatePaymentForOrder(USER_ID, ORDER_ID);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

describe("handleWebhook", () => {
  it("does nothing when signature verification fails", async () => {
    mockMidtrans.verifyWebhookSignature.mockResolvedValue(false);
    await handleWebhook({}, "", {});
    expect(mockMidtrans.parseWebhookNotification).not.toHaveBeenCalled();
    expect(mockPrisma.plusOrder.findUnique).not.toHaveBeenCalled();
  });

  it("does nothing when the order is unknown", async () => {
    mockMidtrans.verifyWebhookSignature.mockResolvedValue(true);
    mockMidtrans.parseWebhookNotification.mockReturnValue({
      orderId: "UNKNOWN",
      transactionStatus: "settlement",
      fraudStatus: "accept",
    });
    mockPrisma.plusOrder.findUnique.mockResolvedValue(null);

    await handleWebhook({}, "", {});
    expect(mockPrisma.plusOrder.update).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("grants Plus on settlement", async () => {
    mockMidtrans.verifyWebhookSignature.mockResolvedValue(true);
    mockMidtrans.parseWebhookNotification.mockReturnValue({
      orderId: ORDER_ID,
      transactionStatus: "settlement",
      fraudStatus: "accept",
    });
    mockPrisma.plusOrder.findUnique.mockResolvedValue({ id: "o1", userId: USER_ID });
    mockPrisma.plusOrder.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({ plus: true });

    await handleWebhook({}, "", {});
    expect(mockPrisma.plusOrder.update).toHaveBeenCalledWith({
      where: { orderId: ORDER_ID },
      data: { status: "settlement", paidAt: expect.any(Date) },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { plus: true },
      select: { plus: true },
    });
  });

  it("grants Plus on capture with fraud_status accept", async () => {
    mockMidtrans.verifyWebhookSignature.mockResolvedValue(true);
    mockMidtrans.parseWebhookNotification.mockReturnValue({
      orderId: ORDER_ID,
      transactionStatus: "capture",
      fraudStatus: "accept",
    });
    mockPrisma.plusOrder.findUnique.mockResolvedValue({ id: "o1", userId: USER_ID });
    mockPrisma.plusOrder.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({ plus: true });

    await handleWebhook({}, "", {});
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it("does NOT grant Plus on capture with fraud_status challenge", async () => {
    mockMidtrans.verifyWebhookSignature.mockResolvedValue(true);
    mockMidtrans.parseWebhookNotification.mockReturnValue({
      orderId: ORDER_ID,
      transactionStatus: "capture",
      fraudStatus: "challenge",
    });
    mockPrisma.plusOrder.findUnique.mockResolvedValue({ id: "o1", userId: USER_ID });
    mockPrisma.plusOrder.update.mockResolvedValue({});

    await handleWebhook({}, "", {});
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("does NOT grant Plus on pending", async () => {
    mockMidtrans.verifyWebhookSignature.mockResolvedValue(true);
    mockMidtrans.parseWebhookNotification.mockReturnValue({
      orderId: ORDER_ID,
      transactionStatus: "pending",
      fraudStatus: null,
    });
    mockPrisma.plusOrder.findUnique.mockResolvedValue({ id: "o1", userId: USER_ID });
    mockPrisma.plusOrder.update.mockResolvedValue({});

    await handleWebhook({}, "", {});
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
