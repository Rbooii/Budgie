import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/balance-accounts";
import {
  CreateBalanceAccountSchema,
  UpdateBalanceAccountSchema,
} from "@/server/schemas/balance-account";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const balanceAccounts = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.list)
  .get("/:id", controller.getOne)
  .post("/", zValidator("json", CreateBalanceAccountSchema), controller.create)
  .patch(
    "/:id",
    zValidator("json", UpdateBalanceAccountSchema),
    (c) => controller.update(c),
  )
  .delete("/:id", controller.remove);