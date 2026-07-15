import type { Context } from "hono";
import {
  createBalanceAccount,
  deleteBalanceAccount,
  getBalanceAccount,
  listBalanceAccounts,
  updateBalanceAccount,
} from "@/server/services/balance-accounts";
import type {
  CreateBalanceAccount,
  UpdateBalanceAccount,
} from "@/server/schemas/balance-account";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function list(c: Context<AppEnv>) {
  const user = c.get("user");
  const items = await listBalanceAccounts(user.id);
  return c.json(items);
}

export async function getOne(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const item = await getBalanceAccount(user.id, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
}

export async function create(c: ValidatedContext<CreateBalanceAccount>) {
  const user = c.get("user");
  const body = c.req.valid("json");
  const created = await createBalanceAccount(user.id, body);
  return c.json(created, 201);
}

export async function update(c: ValidatedContext<UpdateBalanceAccount>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const body = c.req.valid("json");
  try {
    const updated = await updateBalanceAccount(user.id, id, body);
    return c.json(updated);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}

export async function remove(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  try {
    await deleteBalanceAccount(user.id, id);
    return c.body(null, 204);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}