import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/services/plus", () => ({
  createCheckout: vi.fn(),
  getStatus: vi.fn(),
  simulatePaymentForOrder: vi.fn(),
  handleWebhook: vi.fn(),
}));

import {
  createCheckout,
  getStatus,
  simulatePaymentForOrder,
  handleWebhook,
} from "@/server/services/plus";
import * as controller from "@/server/controllers/plus";

const USER_ID = "user-1";
const ORDER_ID = "ORDER-1";

function mockContext(params: Record<string, string> = {}) {
  return {
    get: vi.fn((key: string) => {
      if (key === "user") return { id: USER_ID };
      return undefined;
    }),
    req: {
      param: vi.fn((key: string) => params[key]),
      raw: { headers: new Headers() },
      text: vi.fn(async () => '{"order_id":"ORDER-1","transaction_status":"settlement","fraud_status":"accept"}'),
    },
    json: vi.fn((data: unknown, status?: number) => ({ data, status })),
  } as unknown as Parameters<typeof controller.checkout>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkout controller", () => {
  it("calls createCheckout and returns 201", async () => {
    const result = {
      orderId: ORDER_ID,
      qrString: "000201...",
      status: "pending" as const,
      expiresAt: new Date().toISOString(),
    };
    vi.mocked(createCheckout).mockResolvedValue(result as never);
    const c = mockContext();
    await controller.checkout(c);
    expect(createCheckout).toHaveBeenCalledWith(USER_ID);
    expect(c.json).toHaveBeenCalledWith(result, 201);
  });

  it("returns 404 when the service throws 'Not found'", async () => {
    vi.mocked(createCheckout).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext();
    await controller.checkout(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("rethrows non-'Not found' errors (→ 500 via app.onError)", async () => {
    vi.mocked(createCheckout).mockRejectedValue(new Error("Midtrans down") as never);
    const c = mockContext();
    await expect(controller.checkout(c)).rejects.toThrow("Midtrans down");
  });
});

describe("status controller", () => {
  it("returns 400 when orderId param is missing", async () => {
    const c = mockContext();
    await controller.status(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid order id" }, 400);
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("returns 404 when the service returns null", async () => {
    vi.mocked(getStatus).mockResolvedValue(null as never);
    const c = mockContext({ orderId: ORDER_ID });
    await controller.status(c);
    expect(getStatus).toHaveBeenCalledWith(USER_ID, ORDER_ID);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the status on success", async () => {
    vi.mocked(getStatus).mockResolvedValue({
      transactionStatus: "pending",
      plus: false,
    } as never);
    const c = mockContext({ orderId: ORDER_ID });
    await controller.status(c);
    expect(c.json).toHaveBeenCalledWith({ transactionStatus: "pending", plus: false });
  });
});

describe("simulatePayment controller", () => {
  it("returns 400 when orderId param is missing", async () => {
    const c = mockContext();
    await controller.simulatePayment(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid order id" }, 400);
    expect(simulatePaymentForOrder).not.toHaveBeenCalled();
  });

  it("returns 404 when the service returns null", async () => {
    vi.mocked(simulatePaymentForOrder).mockResolvedValue(null as never);
    const c = mockContext({ orderId: ORDER_ID });
    await controller.simulatePayment(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the transaction status on success", async () => {
    vi.mocked(simulatePaymentForOrder).mockResolvedValue({
      transactionStatus: "settlement",
    } as never);
    const c = mockContext({ orderId: ORDER_ID });
    await controller.simulatePayment(c);
    expect(c.json).toHaveBeenCalledWith({ transactionStatus: "settlement" });
  });
});

describe("webhook controller", () => {
  it("returns 400 when the body is not valid JSON", async () => {
    const c = {
      req: {
        raw: { headers: new Headers() },
        text: vi.fn(async () => "not json"),
      },
      json: vi.fn((data: unknown, status?: number) => ({ data, status })),
    } as unknown as Parameters<typeof controller.webhook>[0];
    await controller.webhook(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid JSON" }, 400);
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it("returns 400 when the body fails schema validation", async () => {
    const c = {
      req: {
        raw: { headers: new Headers() },
        text: vi.fn(async () => '{"foo":"bar"}'),
      },
      json: vi.fn((data: unknown, status?: number) => ({ data, status })),
    } as unknown as Parameters<typeof controller.webhook>[0];
    await controller.webhook(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid notification" }, 400);
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it("calls handleWebhook and returns { ok: true } on valid input", async () => {
    vi.mocked(handleWebhook).mockResolvedValue(undefined as never);
    const c = mockContext();
    await controller.webhook(c);
    expect(handleWebhook).toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith({ ok: true });
  });
});
