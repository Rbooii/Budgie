import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { budgets } from "@/server/routes/budgets";
import { balanceAccounts } from "@/server/routes/balance-accounts";
import { transactions } from "@/server/routes/transactions";
import { subscriptions } from "@/server/routes/subscriptions";
import { user } from "@/server/routes/user";
import { plus, plusWebhook } from "@/server/routes/plus";
import type { AppEnv } from "@/server/middleware/auth";

const base = new Hono<AppEnv>();

base.use(
  "*",
  secureHeaders({
    // Not meaningful for a JSON API and it can interfere with client tooling.
    contentSecurityPolicy: undefined,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

// Request logging is a dev affordance — in production it only adds latency
// and log noise (Vercel already records every request).
if (process.env.NODE_ENV !== "production") {
  base.use(logger());
}

// NOTE: keep the route registration in ONE chained expression — TypeScript
// accumulates the RPC route types through the chain, so splitting it into
// separate statements would erase every route from `typeof app`.
export const app = base
  .get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString() }),
  )
  .route("/user", user)
  .route("/plus", plus)
  .route("/plus/webhook", plusWebhook)
  .route("/budgets", budgets)
  .route("/balance-accounts", balanceAccounts)
  .route("/transactions", transactions)
  .route("/subscriptions", subscriptions)
  .notFound((c) => c.json({ error: "Not found" }, 404))
  .onError((err, c) => {
    console.error("[api] unhandled error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  });

export type App = typeof app;
