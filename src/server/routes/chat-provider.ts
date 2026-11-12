import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/chat-provider";
import {
  SaveChatProviderSchema,
  TestChatProviderSchema,
} from "@/server/schemas/chat-provider";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const chatProvider = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.get)
  .put("/", zValidator("json", SaveChatProviderSchema), controller.save)
  .delete("/", controller.remove)
  .post("/test", zValidator("json", TestChatProviderSchema), controller.test);
