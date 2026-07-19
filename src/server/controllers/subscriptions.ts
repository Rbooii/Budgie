import type { Context } from "hono";
import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
} from "@/server/services/subscriptions";
import type {
  CreateSubscription,
  UpdateSubscription,
} from "@/server/schemas/subscription";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function list(c: Context<AppEnv>) {
  const user = c.get("user");
  const items = await listSubscriptions(user.id);
  return c.json(items);
}

export async function getOne(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const item = await getSubscription(user.id, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
}

export async function create(c: ValidatedContext<CreateSubscription>) {
  const user = c.get("user");
  const body = c.req.valid("json");
  try {
    const created = await createSubscription(user.id, body);
    return c.json(created, 201);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Subscription with this name already exists"
    ) {
      return c.json({ error: err.message }, 409);
    }
    throw err;
  }
}

export async function update(c: ValidatedContext<UpdateSubscription>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const body = c.req.valid("json");
  try {
    const updated = await updateSubscription(user.id, id, body);
    return c.json(updated);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Subscription with this name already exists"
    ) {
      return c.json({ error: err.message }, 409);
    }
    return c.json({ error: "Not found" }, 404);
  }
}

export async function remove(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  try {
    await deleteSubscription(user.id, id);
    return c.body(null, 204);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}
