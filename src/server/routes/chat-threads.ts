import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/chat-threads";
import {
  CreateChatThreadSchema,
  UpdateChatThreadSchema,
} from "@/server/schemas/chat-thread";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const chatThreads = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.list)
  .post("/", zValidator("json", CreateChatThreadSchema), controller.create)
  .delete("/", controller.clear)
  .get("/:id", controller.getOne)
  .patch(
    "/:id",
    zValidator("json", UpdateChatThreadSchema),
    (c) => controller.update(c),
  )
  .delete("/:id", controller.remove);
