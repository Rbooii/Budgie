import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/budgets";
import { CreateBudgetSchema, UpdateBudgetSchema } from "@/server/schemas/budget";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const budgets = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.list)
  .get("/:id", controller.getOne)
  .post("/", zValidator("json", CreateBudgetSchema), controller.create)
  .patch(
    "/:id",
    zValidator("json", UpdateBudgetSchema),
    (c) => controller.update(c),
  )
  .delete("/:id", controller.remove);