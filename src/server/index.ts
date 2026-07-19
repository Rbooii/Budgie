import { Hono } from "hono";
import { logger } from "hono/logger";
import { budgets } from "@/server/routes/budgets";
import { balanceAccounts } from "@/server/routes/balance-accounts";
import { transactions } from "@/server/routes/transactions";
import { subscriptions } from "@/server/routes/subscriptions";
import type { AppEnv } from "@/server/middleware/auth";
import { user_manage } from "./routes/user-manage";

export const app = new Hono<AppEnv>()
  .use(logger())
  .get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString() }),
  )
  .route("/plus", user_manage)
  .route("/budgets", budgets)
  .route("/balance-accounts", balanceAccounts)
  .route("/transactions", transactions)
  .route("/subscriptions", subscriptions)
  .notFound((c) => c.json({ error: "Not found" }, 404))
  .onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal Server Error" }, 500);
  });

export type App = typeof app;