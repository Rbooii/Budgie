import type { Context } from "hono";
import {
  clearChatThreads,
  createChatThread,
  deleteChatThread,
  getChatThread,
  listChatThreads,
  renameChatThread,
  saveChatThreadMessages,
} from "@/server/services/chat-threads";
import type {
  CreateChatThread,
  UpdateChatThread,
} from "@/server/schemas/chat-thread";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function list(c: Context<AppEnv>) {
  const user = c.get("user");
  const threads = await listChatThreads(user.id);
  return c.json({ threads });
}

export async function getOne(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const thread = await getChatThread(user.id, id);
  if (!thread) return c.json({ error: "Not found" }, 404);
  return c.json({ thread });
}

export async function create(c: ValidatedContext<CreateChatThread>) {
  const user = c.get("user");
  const thread = await createChatThread(user.id, c.req.valid("json"));
  return c.json({ thread }, 201);
}

export async function update(c: ValidatedContext<UpdateChatThread>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const body = c.req.valid("json");
  try {
    if (body.messages) {
      await saveChatThreadMessages(user.id, id, body.messages);
    }
    if (body.title) {
      await renameChatThread(user.id, id, body.title);
    }
    return c.json({ ok: true });
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}

export async function remove(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  try {
    await deleteChatThread(user.id, id);
    return c.body(null, 204);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}

export async function clear(c: Context<AppEnv>) {
  const user = c.get("user");
  await clearChatThreads(user.id);
  return c.body(null, 204);
}
