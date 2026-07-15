import type { Context } from "hono";
import {
  createBudget,
  deleteBudget,
  getBudget,
  listBudgets,
  updateBudget,
} from "@/server/services/budgets";
import type { CreateBudget, UpdateBudget } from "@/server/schemas/budget";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function list(c: Context<AppEnv>) {
  const user = c.get("user");
  const items = await listBudgets(user.id);
  return c.json(items);
}

export async function getOne(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const item = await getBudget(user.id, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
}

export async function create(c: ValidatedContext<CreateBudget>) {
  const user = c.get("user");
  const body = c.req.valid("json");
  const created = await createBudget(user.id, body);
  return c.json(created, 201);
}

export async function update(c: ValidatedContext<UpdateBudget>) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const body = c.req.valid("json");
  try {
    const updated = await updateBudget(user.id, id, body);
    return c.json(updated);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}

export async function remove(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  try {
    await deleteBudget(user.id, id);
    return c.body(null, 204);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
}