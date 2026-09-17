-- Optimize hot query paths (list, aggregates, budget windows, account deletes).
-- Every app query is scoped by "userId" first, so composite leading-userId
-- indexes replace the old single-column ones (Postgres can no longer need
-- "transaction_userId_idx" / "transaction_date_idx" / "transaction_type_idx",
-- and "budget_userId_idx" / "subscription_userId_idx" were redundant with the
-- (userId, ...) unique constraints).

-- Drop superseded / low-selectivity indexes.
DROP INDEX IF EXISTS "transaction_userId_idx";
DROP INDEX IF EXISTS "transaction_date_idx";
DROP INDEX IF EXISTS "transaction_type_idx";
DROP INDEX IF EXISTS "budget_userId_idx";
DROP INDEX IF EXISTS "subscription_userId_idx";
DROP INDEX IF EXISTS "balance_account_userId_idx";

-- transaction: newest-first list + type/category time windows per user.
-- The trailing "id DESC" keeps cursor pagination stable on equal dates.
CREATE INDEX "transaction_userId_date_id_idx" ON "transaction"("userId", "date" DESC, "id" DESC);
CREATE INDEX "transaction_userId_type_date_idx" ON "transaction"("userId", "type", "date");
CREATE INDEX "transaction_userId_category_date_idx" ON "transaction"("userId", "category", "date");

-- transaction: relation lookups (onDelete: SetNull + account delete cascade).
CREATE INDEX "transaction_balanceAccountId_idx" ON "transaction"("balanceAccountId");
CREATE INDEX "transaction_toBalanceAccountId_idx" ON "transaction"("toBalanceAccountId");

-- balance_account: list is `where userId orderBy createdAt desc`.
CREATE INDEX "balance_account_userId_createdAt_idx" ON "balance_account"("userId", "createdAt" DESC);
