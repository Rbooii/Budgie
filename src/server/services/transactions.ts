import { prisma } from "@/lib/prisma";
import type { CreateTransaction } from "@/server/schemas/transaction";
import type { Category, Prisma } from "@/generated/prisma/client";
import { MAX_TRANSACTION_LIMIT } from "@/lib/limits";
import { ALL_CATEGORIES, categoryLabel } from "@/lib/categories";

const accountSelect = { id: true, name: true, currency: true } as const;

export type TransactionType = "income" | "expense" | "transfer";

export type ListTransactionsOptions = {
  /** Max rows to return. Omit for the legacy "everything" behaviour. */
  limit?: number;
  /** Row id to resume after (`X-Next-Cursor` from the previous page). */
  cursor?: string;
  type?: TransactionType;
  category?: Category;
  /** Inclusive lower bound on `date`. */
  from?: Date;
  /** Inclusive upper bound on `date`. */
  to?: Date;
  /** Case-insensitive keyword matched against name + category label. */
  search?: string;
};

export type TransactionPage = {
  items: Awaited<ReturnType<typeof findTransactions>>;
  nextCursor: string | null;
};

/**
 * Translate a keyword into the categories whose display label matches, so
 * filtering happens in Postgres instead of after loading every row into the
 * serverless function.
 */
function matchingCategories(search: string): Category[] {
  const q = search.toLowerCase();
  return ALL_CATEGORIES.filter((category) =>
    categoryLabel(category).toLowerCase().includes(q),
  ) as Category[];
}

function buildWhere(userId: string, options: ListTransactionsOptions) {
  const { type, category, from, to, search } = options;
  const where: Prisma.TransactionWhereInput = { userId };
  if (type) where.type = type;
  if (category) where.category = category;
  if (from || to) {
    where.date = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  const q = search?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { in: matchingCategories(q) } },
    ];
  }
  return where;
}

function findTransactions(
  userId: string,
  options: ListTransactionsOptions,
  take?: number,
) {
  const { limit, cursor } = options;
  return prisma.transaction.findMany({
    where: buildWhere(userId, options),
    include: {
      balanceAccount: { select: accountSelect },
      toBalanceAccount: { select: accountSelect },
    },
    // Stable ordering (date desc, id desc) matches
    // `transaction_userId_date_id_idx` so pagination never skips/duplicates.
    orderBy: [{ date: "desc" }, { id: "desc" }],
    ...(limit ? { take } : {}),
    ...(cursor && limit ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

/**
 * List transactions. Without `limit` this preserves the original unbounded
 * shape (bare array). With `limit`/`cursor` it returns a page plus the next
 * cursor — one extra row is read to know whether more data exists.
 */
export async function listTransactions(userId: string, options: ListTransactionsOptions = {}) {
  const limit = options.limit
    ? Math.min(Math.max(Math.trunc(options.limit), 1), MAX_TRANSACTION_LIMIT)
    : undefined;

  if (!limit) {
    const items = await findTransactions(userId, options);
    return { items, nextCursor: null };
  }

  const rows = await findTransactions(userId, options, limit + 1);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function getTransaction(userId: string, id: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      balanceAccount: { select: accountSelect },
      toBalanceAccount: { select: accountSelect },
    },
  });
}

/**
 * Distinguish "account missing / not owned" from "balance too low" — only
 * called on the failure path so the happy path stays read-free.
 */
async function describeBalanceFailure(
  tx: Prisma.TransactionClient,
  userId: string,
  accountId: string,
) {
  const account = await tx.balanceAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  return new Error(account ? "Insufficient balance" : "Account not found");
}

export async function createTransaction(
  userId: string,
  input: CreateTransaction,
) {
  const {
    type,
    amount,
    adminFee,
    balanceAccountId,
    toBalanceAccountId,
    ...rest
  } = input;

  return prisma.$transaction(async (tx) => {
    if (type === "transfer") {
      if (!toBalanceAccountId) throw new Error("Destination account required");

      // One read validates both accounts and keeps the original error
      // precedence (source → destination → balance).
      const owned = await tx.balanceAccount.findMany({
        where: { id: { in: [balanceAccountId, toBalanceAccountId] }, userId },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((a) => a.id));
      if (!ownedIds.has(balanceAccountId)) throw new Error("Account not found");
      if (!ownedIds.has(toBalanceAccountId)) {
        throw new Error("Destination account not found");
      }

      const moved = amount + adminFee;
      const source = await tx.balanceAccount.updateMany({
        where: { id: balanceAccountId, userId, balance: { gte: moved } },
        data: { balance: { decrement: moved } },
      });
      if (source.count === 0) {
        throw await describeBalanceFailure(tx, userId, balanceAccountId);
      }
      await tx.balanceAccount.updateMany({
        where: { id: toBalanceAccountId, userId },
        data: { balance: { increment: amount } },
      });
    } else if (type === "expense") {
      const debited = await tx.balanceAccount.updateMany({
        where: { id: balanceAccountId, userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (debited.count === 0) {
        throw await describeBalanceFailure(tx, userId, balanceAccountId);
      }
    } else {
      const credited = await tx.balanceAccount.updateMany({
        where: { id: balanceAccountId, userId },
        data: { balance: { increment: amount } },
      });
      if (credited.count === 0) throw new Error("Account not found");
    }

    return tx.transaction.create({
      data: {
        ...rest,
        type,
        amount,
        adminFee,
        balanceAccountId,
        toBalanceAccountId: toBalanceAccountId ?? null,
        userId,
      },
      include: {
        balanceAccount: { select: accountSelect },
        toBalanceAccount: { select: accountSelect },
      },
    });
  });
}

export async function deleteTransaction(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.findFirst({ where: { id, userId } });
    if (!txn) throw new Error("Not found");

    if (txn.balanceAccountId) {
      if (txn.type === "income") {
        const reverted = await tx.balanceAccount.updateMany({
          where: {
            id: txn.balanceAccountId,
            userId,
            balance: { gte: txn.amount },
          },
          data: { balance: { decrement: txn.amount } },
        });
        if (reverted.count === 0) {
          const exists = await tx.balanceAccount.findFirst({
            where: { id: txn.balanceAccountId, userId },
            select: { id: true },
          });
          if (exists) throw new Error("Insufficient balance");
        }
      } else if (txn.type === "expense") {
        await tx.balanceAccount.updateMany({
          where: { id: txn.balanceAccountId, userId },
          data: { balance: { increment: txn.amount } },
        });
      } else if (txn.type === "transfer" && txn.toBalanceAccountId) {
        await tx.balanceAccount.updateMany({
          where: { id: txn.balanceAccountId, userId },
          data: { balance: { increment: txn.amount + txn.adminFee } },
        });
        const reverted = await tx.balanceAccount.updateMany({
          where: {
            id: txn.toBalanceAccountId,
            userId,
            balance: { gte: txn.amount },
          },
          data: { balance: { decrement: txn.amount } },
        });
        if (reverted.count === 0) {
          const exists = await tx.balanceAccount.findFirst({
            where: { id: txn.toBalanceAccountId, userId },
            select: { id: true },
          });
          if (exists) throw new Error("Insufficient balance");
        }
      }
    }

    await tx.transaction.delete({ where: { id } });
    return txn;
  });
}
