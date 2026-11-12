import type { Context } from "hono";
import {
  deleteChatProvider,
  getChatProviderPublic,
  saveChatProvider,
  testChatProvider,
} from "@/server/services/chat-provider";
import type {
  SaveChatProvider,
  TestChatProvider,
} from "@/server/schemas/chat-provider";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

export async function get(c: Context<AppEnv>) {
  const user = c.get("user");
  return c.json(await getChatProviderPublic(user.id));
}

export async function save(c: ValidatedContext<SaveChatProvider>) {
  const user = c.get("user");
  try {
    const config = await saveChatProvider(user.id, c.req.valid("json"));
    return c.json(config);
  } catch (err) {
    return c.json({ error: messageOf(err) }, 400);
  }
}

export async function remove(c: Context<AppEnv>) {
  const user = c.get("user");
  await deleteChatProvider(user.id);
  return c.body(null, 204);
}

export async function test(c: ValidatedContext<TestChatProvider>) {
  const user = c.get("user");
  try {
    await testChatProvider(user.id, c.req.valid("json"));
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: messageOf(err) }, 400);
  }
}
