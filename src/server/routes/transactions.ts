import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/transactions";
import { CreateTransactionSchema } from "@/server/schemas/transaction";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const transactions = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.list)
  .get("/:id", controller.getOne)
  .post("/", zValidator("json", CreateTransactionSchema), controller.create)
  .delete("/:id", controller.remove);
