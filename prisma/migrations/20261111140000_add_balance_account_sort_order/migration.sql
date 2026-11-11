-- Add an explicit user-defined order for dashboard account cards.
ALTER TABLE "balance_account" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "balance_account_userId_sortOrder_idx" ON "balance_account"("userId", "sortOrder");
