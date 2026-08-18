import { tool } from "ai";
import { z } from "zod";
import { listBalanceAccounts } from "@/server/services/balance-accounts";
import { listBudgetsWithSpent } from "@/server/services/budgets";
import { listSubscriptions } from "@/server/services/subscriptions";
import {
  createTransaction,
  listTransactions,
} from "@/server/services/transactions";
import { getFinancialInsights } from "@/server/services/insights";
import { categoryLabel } from "@/lib/categories";
import { nextBillingDate } from "@/lib/budget";
import {
  CreateTransactionToolSchema,
  GetTransactionsToolSchema,
} from "@/server/chat/schemas";
import type { CreateTransaction } from "@/server/schemas/transaction";

export function createChatTools(userId: string) {
  return {
    get_balance_accounts: tool({
      description:
        "List the user's balance accounts and their current balances. Use this before creating a transaction to find the real account id.",
      inputSchema: z.object({}),
      execute: async () => {
        const accounts = await listBalanceAccounts(userId);
        return {
          totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
          currency: accounts[0]?.currency ?? "IDR",
          accounts: accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: a.balance,
          })),
        };
      },
    }),

    get_transactions: tool({
      description:
        "Search the user's transactions with optional filters (type, category, keyword, date range). Returns newest first, capped at `limit`.",
      inputSchema: GetTransactionsToolSchema,
      execute: async (input) => {
        const all = await listTransactions(userId);
        const from = input.from ? new Date(`${input.from}T00:00:00`) : undefined;
        const to = input.to ? new Date(`${input.to}T23:59:59`) : undefined;
        const q = input.query?.trim().toLowerCase();

        const filtered = all.filter((t) => {
          if (input.type && t.type !== input.type) return false;
          if (input.category && t.category !== input.category) return false;
          if (from && new Date(t.date) < from) return false;
          if (to && new Date(t.date) > to) return false;
          if (
            q &&
            !t.name.toLowerCase().includes(q) &&
            !categoryLabel(t.category).toLowerCase().includes(q)
          ) {
            return false;
          }
          return true;
        });

        const items = filtered.slice(0, input.limit ?? 10).map((t) => ({
          name: t.name,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date.toISOString(),
          account: t.balanceAccount?.name ?? null,
        }));

        return { count: filtered.length, items };
      },
    }),

    get_budgets: tool({
      description:
        "List the user's budgets with how much has been spent so far in the current period.",
      inputSchema: z.object({}),
      execute: async () => {
        const budgets = await listBudgetsWithSpent(userId);
        return {
          budgets: budgets.map((b) => ({
            id: b.id,
            category: b.category,
            categoryLabel: categoryLabel(b.category),
            amount: b.amount,
            periodDays: b.periodDays,
            spent: b.spent,
          })),
        };
      },
    }),

    get_subscriptions: tool({
      description:
        "List the user's recurring subscriptions with the next billing date.",
      inputSchema: z.object({}),
      execute: async () => {
        const subscriptions = await listSubscriptions(userId);
        return {
          subscriptions: subscriptions.map((s) => ({
            id: s.id,
            name: s.name,
            amount: s.amount,
            category: s.category,
            categoryLabel: categoryLabel(s.category),
            periodDays: s.periodDays,
            active: s.active,
            nextBillingDate: nextBillingDate(
              s.startDate,
              s.periodDays,
            ).toISOString(),
          })),
        };
      },
    }),

    get_insights: tool({
      description:
        "Get a high-level financial summary: net worth, current month income and expenses, and the top expense categories this month.",
      inputSchema: z.object({}),
      execute: async () => {
        return getFinancialInsights(userId);
      },
    }),

    create_transaction: tool({
      description:
        "Record (create) an expense, income, or transfer transaction for the user and update the account balance. Only call after the user explicitly asked to add it.",
      inputSchema: CreateTransactionToolSchema,
      execute: async (input) => {
        const parsed = CreateTransactionToolSchema.safeParse(input);
        if (!parsed.success) {
          return {
            ok: false,
            error: parsed.error.issues.map((i) => i.message).join("; "),
          };
        }

        const body: CreateTransaction = {
          name: parsed.data.name,
          amount: parsed.data.amount,
          type: parsed.data.type,
          category: parsed.data.category,
          date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
          adminFee: parsed.data.adminFee ?? 0,
          balanceAccountId: parsed.data.balanceAccountId,
          toBalanceAccountId: parsed.data.toBalanceAccountId ?? null,
        };

        try {
          const created = await createTransaction(userId, body);
          return {
            ok: true,
            transaction: {
              id: created.id,
              name: created.name,
              amount: created.amount,
              type: created.type,
              category: created.category,
              date: created.date.toISOString(),
              account: created.balanceAccount?.name ?? null,
            },
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          return { ok: false, error: message };
        }
      },
    }),
  };
}

export type ChatTools = ReturnType<typeof createChatTools>;