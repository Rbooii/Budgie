import type { Context } from "hono";
import {
  createCheckout,
  getStatus,
  simulatePaymentForOrder,
  handleWebhook,
} from "@/server/services/plus";
import { WebhookNotificationSchema } from "@/server/schemas/plus";
import type { AppEnv } from "@/server/middleware/auth";

export async function checkout(c: Context<AppEnv>) {
  const user = c.get("user");
  try {
    const result = await createCheckout(user.id);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "Not found") {
      return c.json({ error: "Not found" }, 404);
    }
    throw err;
  }
}

export async function status(c: Context<AppEnv>) {
  const user = c.get("user");
  const orderId = c.req.param("orderId");
  if (!orderId) return c.json({ error: "Invalid order id" }, 400);

  const result = await getStatus(user.id, orderId);
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
}

export async function simulatePayment(c: Context<AppEnv>) {
  const user = c.get("user");
  const orderId = c.req.param("orderId");
  if (!orderId) return c.json({ error: "Invalid order id" }, 400);

  try {
    const result = await simulatePaymentForOrder(user.id, orderId);
    if (!result) return c.json({ error: "Not found" }, 404);
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Not found") {
      return c.json({ error: "Not found" }, 404);
    }
    throw err;
  }
}

// Webhook — public endpoint, NO requireAuth. Midtrans calls this server-to-
// server. Signature verification happens inside the service.
export async function webhook(c: Context<AppEnv>) {
  const rawBody = await c.req.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const validation = WebhookNotificationSchema.safeParse(parsed);
  if (!validation.success) {
    return c.json({ error: "Invalid notification" }, 400);
  }

  const headers = Object.fromEntries(c.req.raw.headers.entries());
  await handleWebhook(headers, rawBody, validation.data);
  return c.json({ ok: true });
}
