import { tool } from "ai";
import { z } from "zod";
import { listBalanceAccounts } from "@/server/services/balance-accounts";
import {
  createBudget,
  getBudget,
  listBudgetsWithSpent,
  updateBudget,
} from "@/server/services/budgets";
import {
  createSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
} from "@/server/services/subscriptions";
import {
  createTransaction,
  listTransactions,
} from "@/server/services/transactions";
import { getFinancialInsights } from "@/server/services/insights";
import {
  getBudgetStatus,
  getCashflowTrend,
  getFinancialOverview,
  getLargestTransactions,
  getNetWorthHistory,
  getSpendingBreakdown,
  getUpcomingBills,
} from "@/server/services/analytics";
import { categoryLabel } from "@/lib/categories";
import { nextBillingDate, periodLabel } from "@/lib/budget";
import {
  CreateBudgetToolSchema,
  CreateSubscriptionToolSchema,
  CreateTransactionToolSchema,
  GetCashflowTrendToolSchema,
  GetLargestTransactionsToolSchema,
  GetNetWorthHistoryToolSchema,
  GetSpendingBreakdownToolSchema,
  GetTransactionsToolSchema,
  GetUpcomingBillsToolSchema,
  UpdateBudgetToolSchema,
  UpdateSubscriptionToolSchema,
} from "@/server/chat/schemas";
import type { CreateTransaction } from "@/server/schemas/transaction";
import type { UpdateBudget } from "@/server/schemas/budget";
import type { UpdateSubscription } from "@/server/schemas/subscription";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function parseFrom(value?: string): Date | undefined {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function parseTo(value?: string): Date | undefined {
  return value ? new Date(`${value}T23:59:59`) : undefined;
}

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
        const limit = input.limit ?? 10;

        // Filtering + limiting happen in Postgres, never load the full
        // history into the function just to slice 10 rows off the top.
        const { items: rows } = await listTransactions(userId, {
          limit,
          type: input.type,
          category: input.category,
          from: parseFrom(input.from),
          to: parseTo(input.to),
          search: input.query,
        });

        const items = rows.map((t) => ({
          id: t.id,
          name: t.name,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date.toISOString(),
          adminFee: t.adminFee,
          account: t.balanceAccount?.name ?? null,
          toAccount: t.toBalanceAccount?.name ?? null,
        }));

        return { count: items.length, items };
      },
    }),

    get_financial_overview: tool({
      description:
        "One-call snapshot of the user's whole financial picture: net worth, account balances, this month's income/expense/net, budgets (including overspending), upcoming bills, top expense categories and recent transactions. Prefer this for broad questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const overview = await getFinancialOverview(userId);
        return {
          ...overview,
          upcoming: {
            ...overview.upcoming,
            items: overview.upcoming.items.map((item) => ({
              ...item,
              nextBillingDate: item.nextBillingDate.toISOString(),
            })),
          },
        };
      },
    }),

    get_insights: tool({
      description:
        "Compact highlight: net worth, current month income and expenses, and the top expense categories this month.",
      inputSchema: z.object({}),
      execute: async () => getFinancialInsights(userId),
    }),

    get_cashflow_trend: tool({
      description:
        "Monthly income, expense, transfer fees and net for the last N months, plus totals and the best/worst month. Use for trend, savings-rate and 'how is my spending changing' questions.",
      inputSchema: GetCashflowTrendToolSchema,
      execute: async (input) => getCashflowTrend(userId, { months: input.months }),
    }),

    get_spending_breakdown: tool({
      description:
        "Expense totals grouped by category or merchant/name for a date range, with share, transaction count and change versus the previous equal-length period. Defaults to this month.",
      inputSchema: GetSpendingBreakdownToolSchema,
      execute: async (input) =>
        getSpendingBreakdown(userId, {
          from: parseFrom(input.from),
          to: parseTo(input.to),
          groupBy: input.groupBy,
          limit: input.limit,
        }),
    }),

    get_net_worth_history: tool({
      description:
        "Rolling monthly net-worth series for the last N months, with the current net worth and total change.",
      inputSchema: GetNetWorthHistoryToolSchema,
      execute: async (input) =>
        getNetWorthHistory(userId, { months: input.months }),
    }),

    get_budget_status: tool({
      description:
        "Every budget with its limit, current spend, remaining/over amount, percent used, and a pace-based projected spend. Use for budget questions and overspending checks.",
      inputSchema: z.object({}),
      execute: async () => getBudgetStatus(userId),
    }),

    get_upcoming_bills: tool({
      description:
        "Active subscriptions that will be charged within the next N days, with amounts and dates.",
      inputSchema: GetUpcomingBillsToolSchema,
      execute: async (input) => {
        const result = await getUpcomingBills(userId, { days: input.days });
        return {
          ...result,
          items: result.items.map((item) => ({
            ...item,
            nextBillingDate: item.nextBillingDate.toISOString(),
          })),
        };
      },
    }),

    get_largest_transactions: tool({
      description:
        "Largest transactions in a period, optionally filtered by type. Use for 'biggest purchase', 'largest income' and anomaly questions.",
      inputSchema: GetLargestTransactionsToolSchema,
      execute: async (input) =>
        getLargestTransactions(userId, {
          type: input.type,
          from: parseFrom(input.from),
          to: parseTo(input.to),
          limit: input.limit,
        }),
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
          adminFeeBearer: parsed.data.adminFeeBearer ?? "source",
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
          return { ok: false, error: errorMessage(err) };
        }
      },
    }),

    create_budget: tool({
      description:
        "Create a category budget. Only call after the user explicitly asked to create it and confirmed the category, limit and period.",
      inputSchema: CreateBudgetToolSchema,
      execute: async (input) => {
        try {
          const budget = await createBudget(userId, input);
          return {
            ok: true,
            budget: {
              id: budget.id,
              category: budget.category,
              categoryLabel: categoryLabel(budget.category),
              amount: budget.amount,
              periodDays: budget.periodDays,
              period: periodLabel(budget.periodDays),
            },
          };
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },
    }),

    update_budget: tool({
      description:
        "Update the limit or period of an existing budget. Get the id from get_budgets or get_budget_status first. Only call after explicit user confirmation.",
      inputSchema: UpdateBudgetToolSchema,
      execute: async (input) => {
        const existing = await getBudget(userId, input.budgetId);
        if (!existing) return { ok: false, error: "Budget not found" };
        try {
          const budget = await updateBudget(userId, input.budgetId, {
            // Budgets are created with expense categories only; the stored
            // column is the wider Prisma enum.
            category: existing.category as UpdateBudget["category"],
            amount: input.amount ?? existing.amount,
            periodDays: input.periodDays ?? existing.periodDays,
          });
          return {
            ok: true,
            budget: {
              id: budget.id,
              category: budget.category,
              categoryLabel: categoryLabel(budget.category),
              amount: budget.amount,
              periodDays: budget.periodDays,
              period: periodLabel(budget.periodDays),
            },
          };
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },
    }),

    create_subscription: tool({
      description:
        "Add a recurring subscription. Only call after the user explicitly asked to add it and confirmed the name, amount and billing cycle.",
      inputSchema: CreateSubscriptionToolSchema,
      execute: async (input) => {
        try {
          const subscription = await createSubscription(userId, {
            name: input.name,
            amount: input.amount,
            currency: "IDR",
            category: input.category,
            periodDays: input.periodDays,
            startDate: input.startDate
              ? new Date(`${input.startDate}T00:00:00`)
              : new Date(),
            active: input.active ?? true,
          });
          return {
            ok: true,
            subscription: {
              id: subscription.id,
              name: subscription.name,
              amount: subscription.amount,
              category: subscription.category,
              categoryLabel: categoryLabel(subscription.category),
              periodDays: subscription.periodDays,
              period: periodLabel(subscription.periodDays),
              nextBillingDate: nextBillingDate(
                subscription.startDate,
                subscription.periodDays,
              ).toISOString(),
            },
          };
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },
    }),

    update_subscription: tool({
      description:
        "Update an existing subscription (amount, cycle, name, category, start date or active). Get the id from get_subscriptions first. Only call after explicit user confirmation.",
      inputSchema: UpdateSubscriptionToolSchema,
      execute: async (input) => {
        const existing = await getSubscription(userId, input.subscriptionId);
        if (!existing) return { ok: false, error: "Subscription not found" };
        try {
          const subscription = await updateSubscription(
            userId,
            input.subscriptionId,
            {
              name: input.name ?? existing.name,
              amount: input.amount ?? existing.amount,
              currency: existing.currency,
              category:
                input.category ??
                (existing.category as UpdateSubscription["category"]),
              periodDays: input.periodDays ?? existing.periodDays,
              startDate: input.startDate
                ? new Date(`${input.startDate}T00:00:00`)
                : existing.startDate,
              active: input.active ?? existing.active,
            },
          );
          return {
            ok: true,
            subscription: {
              id: subscription.id,
              name: subscription.name,
              amount: subscription.amount,
              category: subscription.category,
              categoryLabel: categoryLabel(subscription.category),
              periodDays: subscription.periodDays,
              period: periodLabel(subscription.periodDays),
              nextBillingDate: nextBillingDate(
                subscription.startDate,
                subscription.periodDays,
              ).toISOString(),
            },
          };
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },
    }),
  };
}

export type ChatTools = ReturnType<typeof createChatTools>;
