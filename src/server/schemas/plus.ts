import { z } from "zod";

// Mirrors Midtrans' transaction notification JSON shape (the fields we use).
// Real integration: midtransClient.transaction.notification(notificationJson)
// parses + verifies the full payload; this schema is what we accept on
// /api/plus/webhook. Keep it loose (extra fields allowed) so Midtrans can add
// fields without breaking us.
export const WebhookNotificationSchema = z
  .object({
    order_id: z.string().min(1),
    transaction_status: z.enum([
      "capture",
      "settlement",
      "pending",
      "deny",
      "cancel",
      "expire",
      "refund",
    ]),
    fraud_status: z.enum(["accept", "challenge", "deny"]).nullable().optional(),
    status_code: z.string().optional(),
    signature_key: z.string().optional(),
  })
  .passthrough();

export type WebhookNotification = z.infer<typeof WebhookNotificationSchema>;

// Checkout response shape (returned to the frontend by POST /api/plus/checkout).
export interface CheckoutResponse {
  orderId: string;
  qrString: string;
  status: "pending";
  expiresAt: string; // ISO string
}

// Status response shape (returned by GET /api/plus/status/:orderId).
export interface StatusResponse {
  transactionStatus: string;
  plus: boolean;
}
