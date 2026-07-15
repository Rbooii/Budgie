import type { Context } from "hono";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
} from "@/server/services/transactions";
import type { CreateTransaction } from "@/server/schemas/transaction";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function list(c: Context<AppEnv>) {
  const user = c.get("user");
  const items = await listTransactions(user.id);
  return c.json(items);
}

export async function getOne(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const item = await getTransaction(user.id, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
}

export async function create(c: ValidatedContext<CreateTransaction>) {
  const user = c.get("user");
  const body = c.req.valid("json");
  try {
    const created = await createTransaction(user.id, body);
    return c.json(created, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    if (msg.toLowerCase().includes("not found")) return c.json({ error: msg }, 404);
    return c.json({ error: msg }, 400);
  }
}

export async function remove(c: Context<AppEnv>) {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Invalid id" }, 400);

  try {
    await deleteTransaction(user.id, id);
    return c.body(null, 204);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    if (msg.toLowerCase().includes("not found")) return c.json({ error: msg }, 404);
    return c.json({ error: msg }, 400);
  }
}
