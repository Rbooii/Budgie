import { describe, it, expect } from "vitest";
import { WebhookNotificationSchema } from "@/server/schemas/plus";

describe("WebhookNotificationSchema", () => {
  it("accepts a valid settlement notification", () => {
    const parsed = WebhookNotificationSchema.parse({
      order_id: "ORDER-1",
      transaction_status: "settlement",
      fraud_status: "accept",
    });
    expect(parsed.order_id).toBe("ORDER-1");
    expect(parsed.transaction_status).toBe("settlement");
  });

  it("accepts a pending notification without fraud_status", () => {
    const parsed = WebhookNotificationSchema.parse({
      order_id: "ORDER-2",
      transaction_status: "pending",
    });
    expect(parsed.fraud_status).toBeUndefined();
  });

  it("accepts extra fields (passthrough — Midtrans adds fields)", () => {
    const parsed = WebhookNotificationSchema.parse({
      order_id: "ORDER-3",
      transaction_status: "settlement",
      status_code: "200",
      signature_key: "abc123",
      gross_amount: "24500.00",
    });
    expect(parsed.order_id).toBe("ORDER-3");
    expect(parsed.status_code).toBe("200");
  });

  it("rejects missing order_id", () => {
    expect(() =>
      WebhookNotificationSchema.parse({ transaction_status: "settlement" }),
    ).toThrow();
  });

  it("rejects missing transaction_status", () => {
    expect(() =>
      WebhookNotificationSchema.parse({ order_id: "ORDER-4" }),
    ).toThrow();
  });

  it("rejects an invalid transaction_status", () => {
    expect(() =>
      WebhookNotificationSchema.parse({
        order_id: "ORDER-5",
        transaction_status: "completed",
      }),
    ).toThrow();
  });

  it("accepts all valid transaction statuses", () => {
    const valid = [
      "capture",
      "settlement",
      "pending",
      "deny",
      "cancel",
      "expire",
      "refund",
    ];
    for (const status of valid) {
      expect(() =>
        WebhookNotificationSchema.parse({
          order_id: "X",
          transaction_status: status,
        }),
      ).not.toThrow();
    }
  });
});
