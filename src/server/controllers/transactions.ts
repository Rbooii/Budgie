import type { Context } from "hono";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
} from "@/server/services/transactions";
import { DEFAULT_TRANSACTION_LIMIT } from "@/lib/limits";
import type {
  CreateTransaction,
  ListTransactionsQuery,
} from "@/server/schemas/transaction";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;
type ListContext = Context<AppEnv, string, { out: { query: ListTransactionsQuery } }>;

export async function list(c: ListContext) {
  const user = c.get("user");
  const { limit, cursor } = c.req.valid("query");

  const { items, nextCursor } = await listTransactions(user.id, {
    // A bare `cursor` implies the default page size.
    limit: limit ?? (cursor ? DEFAULT_TRANSACTION_LIMIT : undefined),
    cursor,
  });

  c.header("X-Has-More", nextCursor ? "true" : "false");
  if (nextCursor) c.header("X-Next-Cursor", nextCursor);
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
