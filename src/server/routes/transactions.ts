import { Hono } from "hono";
import { etag } from "hono/etag";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/transactions";
import {
  CreateTransactionSchema,
  ListTransactionsQuerySchema,
} from "@/server/schemas/transaction";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";
import { privateNoCache } from "@/server/middleware/cache";

/**
 * Pagination is opt-in so existing clients keep the bare-array response:
 *  - no `limit`/`cursor` → every transaction (legacy behaviour)
 *  - `limit`/`cursor`     → one page, with `X-Next-Cursor` / `X-Has-More`
 * `readCache` adds an ETag so repeat GETs from mobile clients are free (304).
 */
export const transactions = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get(
    "/",
    etag(), privateNoCache,
    zValidator("query", ListTransactionsQuerySchema),
    controller.list,
  )
  .get("/:id", etag(), privateNoCache, controller.getOne)
  .post("/", zValidator("json", CreateTransactionSchema), controller.create)
  .delete("/:id", controller.remove);
