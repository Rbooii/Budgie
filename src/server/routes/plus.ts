import { Hono } from "hono";
import * as controller from "@/server/controllers/plus";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

// Authed endpoints — the authenticated user creates/checks/simulates their
// own Plus order.
export const plus = new Hono<AppEnv>()
  .use("*", requireAuth)
  .post("/checkout", controller.checkout)
  .get("/status/:orderId", controller.status)
  .post("/simulate-payment/:orderId", controller.simulatePayment);

// Public webhook — Midtrans calls this server-to-server. NO requireAuth;
// signature verification happens inside the controller/service. Mounted at
// /api/plus/webhook in index.ts.
export const plusWebhook = new Hono<AppEnv>().post("/", controller.webhook);
