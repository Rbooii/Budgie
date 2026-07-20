import type { Context } from "hono";
import { getPlusStatus, updatePlusStatus } from "@/server/services/user";
import type { UpdateUser } from "@/server/schemas/user";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function getStatus(c: Context<AppEnv>) {
  const user = c.get("user");
  const status = await getPlusStatus(user.id);
  if (!status) return c.json({ error: "Not found" }, 404);
  return c.json(status);
}

export async function update(c: ValidatedContext<UpdateUser>) {
  const user = c.get("user");
  const body = c.req.valid("json");
  try {
    const updated = await updatePlusStatus(user.id, body);
    return c.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "Not found") {
      return c.json({ error: "Not found" }, 404);
    }
    throw err;
  }
}
