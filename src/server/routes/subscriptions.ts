import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/subscriptions";
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
} from "@/server/schemas/subscription";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const subscriptions = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.list)
  .get("/:id", controller.getOne)
  .post("/", zValidator("json", CreateSubscriptionSchema), controller.create)
  .patch(
    "/:id",
    zValidator("json", UpdateSubscriptionSchema),
    (c) => controller.update(c),
  )
  .delete("/:id", controller.remove);
