import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/user";
import { UpdateUserSchema } from "@/server/schemas/user";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const user = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.getStatus)
  .patch("/", zValidator("json", UpdateUserSchema), (c) => controller.update(c));
