import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import { periodLabel } from "@/lib/budget";
import { netEffect } from "@/lib/dashboard";
import { listBalanceAccounts } from "@/server/services/balance-accounts";
import { listBudgetsWithSpent } from "@/server/services/budgets";
import { listSubscriptions } from "@/server/services/subscriptions";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_MONTHS = 12;
const MAX_BREAKDOWN_ROWS = 20;

type TxnLite = {
  name: string;
  amount: number;
  type: string;
  category: string;
  date: Date;
  adminFee: number;
  balanceAccountId: string | null;
  toBalanceAccountId: string | null;
};

function clampInt(value: number | undefined, min: number, max: number, fallback: number) {
  const n = Number.isFinite(value) ? Math.trunc(value as number) : fallback;
  return Math.min(Math.max(n, min), max);
}

function startOfMonthAt(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function nextMonthStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Same math as `nextBillingDate`, but relative to the provided `now`. */
function nextBillingAfter(
  startDate: Date,
  periodDays: number,
  now: Date,
): Date {
  if (startDate.getTime() >= now.getTime()) return startDate;
  const elapsedDays = (now.getTime() - startDate.getTime()) / DAY_MS;
  const periodsElapsed = Math.floor(elapsedDays / periodDays);
  const next = new Date(startDate);
  next.setDate(next.getDate() + (periodsElapsed + 1) * periodDays);
  return next;
}

function isoMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sumByType(
  transactions: TxnLite[],
  start: Date,
  end: Date,
): { income: number; expense: number; transferFees: number; net: number } {
  let income = 0;
  let expense = 0;
  let transferFees = 0;
  for (const t of transactions) {
    if (t.date < start || t.date >= end) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
    else if (t.type === "transfer") transferFees += t.adminFee;
  }
  return { income, expense, transferFees, net: income - expense - transferFees };
}

function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

async function monthTransactions(userId: string, now: Date): Promise<TxnLite[]> {
  return prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfMonthAt(now), lt: nextMonthStart(now) },
    },
    select: {
      name: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      adminFee: true,
      balanceAccountId: true,
      toBalanceAccountId: true,
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
}

export type FinancialOverview = Awaited<ReturnType<typeof getFinancialOverview>>;

/**
 * One compact snapshot the assistant can reason about without a tool call.
 * Every read is userId-scoped; the payload is capped so the system prompt and
 * tool result stay small.
 */
export async function getFinancialOverview(userId: string, now = new Date()) {
  const monthStart = startOfMonthAt(now);
  const monthEnd = nextMonthStart(now);

  const [accounts, budgets, subscriptions, txns, recent] = await Promise.all([
    listBalanceAccounts(userId),
    listBudgetsWithSpent(userId),
    listSubscriptions(userId),
    monthTransactions(userId, now),
    prisma.transaction.findMany({
      where: { userId },
      select: {
        name: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        balanceAccount: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: 5,
    }),
  ]);

  const cashflow = sumByType(txns, monthStart, monthEnd);
  const netWorth = accounts.reduce((sum, account) => sum + account.balance, 0);

  const categoryTotals = new Map<string, { amount: number; count: number }>();
  for (const t of txns) {
    if (t.type !== "expense") continue;
    const current = categoryTotals.get(t.category) ?? { amount: 0, count: 0 };
    current.amount += t.amount;
    current.count += 1;
    categoryTotals.set(t.category, current);
  }

  const topCategories = [...categoryTotals]
    .map(([category, value]) => ({
      category,
      categoryLabel: categoryLabel(category),
      amount: value.amount,
      count: value.count,
      share: percentage(value.amount, cashflow.expense),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const budgetRows = budgets
    .map((budget) => {
      const remaining = budget.amount - budget.spent;
      return {
        id: budget.id,
        category: budget.category,
        categoryLabel: categoryLabel(budget.category),
        periodDays: budget.periodDays,
        period: periodLabel(budget.periodDays),
        limit: budget.amount,
        spent: budget.spent,
        remaining,
        over: remaining < 0,
        spentPct: percentage(budget.spent, budget.amount),
      };
    })
    .sort((a, b) => Number(b.over) - Number(a.over) || b.spentPct - a.spentPct);

  const upcoming = subscriptions
    .filter((subscription) => subscription.active)
    .map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      category: subscription.category,
      categoryLabel: categoryLabel(subscription.category),
      periodDays: subscription.periodDays,
      period: periodLabel(subscription.periodDays),
      nextBillingDate: nextBillingAfter(
        subscription.startDate,
        subscription.periodDays,
        now,
      ),
    }))
    .filter((subscription) => {
      const days = (subscription.nextBillingDate.getTime() - now.getTime()) / DAY_MS;
      return days >= 0 && days <= 30;
    })
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

  return {
    asOf: now.toISOString(),
    currency: accounts[0]?.currency ?? "IDR",
    netWorth,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
    })),
    month: {
      label: monthLabel(monthStart),
      ...cashflow,
      savingsRate:
        cashflow.income > 0
          ? percentage(cashflow.income - cashflow.expense - cashflow.transferFees, cashflow.income)
          : 0,
      transactionCount: txns.length,
    },
    budgets: {
      total: budgetRows.length,
      overCount: budgetRows.filter((budget) => budget.over).length,
      items: budgetRows.slice(0, MAX_BREAKDOWN_ROWS),
    },
    upcoming: {
      withinDays: 30,
      total: upcoming.reduce((sum, item) => sum + item.amount, 0),
      items: upcoming.slice(0, MAX_BREAKDOWN_ROWS),
    },
    topCategories,
    recent: recent.map((transaction) => ({
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      categoryLabel: categoryLabel(transaction.category),
      date: transaction.date.toISOString(),
      account: transaction.balanceAccount?.name ?? null,
    })),
  };
}

/** Monthly income, expense, net and transfer fees for a rolling window. */
export async function getCashflowTrend(
  userId: string,
  input: { months?: number; now?: Date } = {},
) {
  const now = input.now ?? new Date();
  const months = clampInt(input.months, 1, MAX_MONTHS, 6);
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const end = nextMonthStart(now);

  const txns = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { type: true, amount: true, adminFee: true, date: true },
  });

  const rows = Array.from({ length: months }, (_, index) => {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + index + 1, 1);
    const value = sumByType(
      txns.map((t) => ({
        ...t,
        name: "",
        category: "",
        balanceAccountId: null,
        toBalanceAccountId: null,
      })),
      monthStart,
      monthEnd,
    );
    return {
      month: isoMonth(monthStart),
      label: monthLabel(monthStart),
      ...value,
    };
  });

  const totals = rows.reduce(
    (sum, row) => ({
      income: sum.income + row.income,
      expense: sum.expense + row.expense,
      transferFees: sum.transferFees + row.transferFees,
      net: sum.net + row.net,
    }),
    { income: 0, expense: 0, transferFees: 0, net: 0 },
  );

  const sorted = [...rows].sort((a, b) => b.net - a.net);
  return {
    currency: "IDR",
    months: rows,
    totals,
    averageNet: Math.round(totals.net / Math.max(rows.length, 1)),
    bestMonth: sorted[0]?.month ?? null,
    worstMonth: sorted[sorted.length - 1]?.month ?? null,
  };
}

/** Expense totals by category or merchant name with a period-over-period delta. */
export async function getSpendingBreakdown(
  userId: string,
  input: {
    from?: Date;
    to?: Date;
    groupBy?: "category" | "merchant";
    limit?: number;
    now?: Date;
  } = {},
) {
  const now = input.now ?? new Date();
  const to = input.to ?? now;
  const from =
    input.from ??
    new Date(now.getFullYear(), now.getMonth(), 1);
  if (from > to) throw new Error("Invalid date range");

  const duration = to.getTime() - from.getTime();
  const previousFrom = new Date(from.getTime() - duration);
  const groupBy = input.groupBy === "merchant" ? "merchant" : "category";
  const limit = clampInt(input.limit, 1, MAX_BREAKDOWN_ROWS, 10);

  const [currentRows, previousRows, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: from, lte: to } },
      select: { name: true, category: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        date: { gte: previousFrom, lt: from },
      },
      select: { name: true, category: true, amount: true },
    }),
    listBudgetsWithSpent(userId),
  ]);

  const keyOf = (row: { name: string; category: string }) =>
    groupBy === "merchant"
      ? row.name.trim().toLowerCase() || "unknown"
      : row.category;
  const labelOf = (row: { name: string; category: string }) =>
    groupBy === "merchant" ? row.name : categoryLabel(row.category);

  const current = new Map<string, { label: string; amount: number; count: number }>();
  for (const row of currentRows) {
    const key = keyOf(row);
    const existing = current.get(key) ?? { label: labelOf(row), amount: 0, count: 0 };
    existing.amount += row.amount;
    existing.count += 1;
    current.set(key, existing);
  }

  const previous = new Map<string, number>();
  for (const row of previousRows) {
    const key = keyOf(row);
    previous.set(key, (previous.get(key) ?? 0) + row.amount);
  }

  const budgetByCategory = new Map<string, { limit: number; spent: number }>(
    budgets.map((budget) => [
      budget.category,
      { limit: budget.amount, spent: budget.spent },
    ]),
  );
  const total = [...current.values()].reduce((sum, row) => sum + row.amount, 0);

  const items = [...current]
    .map(([key, row]) => {
      const previousAmount = previous.get(key) ?? 0;
      const budget = budgetByCategory.get(key);
      return {
        key,
        label: row.label,
        amount: row.amount,
        count: row.count,
        share: percentage(row.amount, total),
        previousAmount,
        deltaPct:
          previousAmount > 0
            ? Math.round(((row.amount - previousAmount) / previousAmount) * 1000) / 10
            : null,
        budget: budget?.limit ?? null,
        budgetSpent: budget?.spent ?? null,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  return {
    currency: "IDR",
    groupBy,
    from: from.toISOString(),
    to: to.toISOString(),
    total,
    transactionCount: currentRows.length,
    items,
  };
}

/** Rolling monthly net-worth series, oldest first. */
export async function getNetWorthHistory(
  userId: string,
  input: { months?: number; now?: Date } = {},
) {
  const now = input.now ?? new Date();
  const months = clampInt(input.months, 1, MAX_MONTHS, 12);
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const end = nextMonthStart(now);

  const [accounts, txns] = await Promise.all([
    prisma.balanceAccount.aggregate({
      where: { userId },
      _sum: { balance: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: {
        type: true,
        amount: true,
        adminFee: true,
        date: true,
        balanceAccountId: true,
        toBalanceAccountId: true,
      },
    }),
  ]);

  const netWorth = accounts._sum.balance ?? 0;
  const buckets = new Array<number>(months).fill(0);
  for (const transaction of txns) {
    const index =
      (transaction.date.getFullYear() - start.getFullYear()) * 12 +
      (transaction.date.getMonth() - start.getMonth());
    if (index < 0 || index >= months) continue;
    buckets[index] += netEffect(transaction);
  }

  let current = netWorth - buckets.reduce((sum, value) => sum + value, 0);
  const series = buckets.map((value, index) => {
    current += value;
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return {
      month: isoMonth(date),
      label: monthLabel(date),
      value: current,
      change: value,
    };
  });

  return {
    currency: "IDR",
    netWorth,
    change: netWorth - (series[0]?.value ?? netWorth),
    series,
  };
}

/** Budget limits, current spend and a simple pace projection. */
export async function getBudgetStatus(userId: string, now = new Date()) {
  const budgets = await listBudgetsWithSpent(userId);

  return {
    currency: "IDR",
    budgets: budgets
      .map((budget) => {
        let start: Date;
        if (budget.periodDays === 7) {
          start = new Date(now);
          start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
          start.setHours(0, 0, 0, 0);
        } else if (budget.periodDays === 30) {
          start = startOfMonthAt(now);
        } else if (budget.periodDays === 1) {
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(now);
          start.setDate(start.getDate() - budget.periodDays);
          start.setHours(0, 0, 0, 0);
        }

        const elapsedDays = Math.max(
          1,
          Math.ceil((now.getTime() - start.getTime()) / DAY_MS),
        );
        const projectedSpend = Math.round(
          (budget.spent / elapsedDays) * budget.periodDays,
        );
        const remaining = budget.amount - budget.spent;

        return {
          id: budget.id,
          category: budget.category,
          categoryLabel: categoryLabel(budget.category),
          periodDays: budget.periodDays,
          period: periodLabel(budget.periodDays),
          limit: budget.amount,
          spent: budget.spent,
          remaining,
          over: remaining < 0,
          spentPct: percentage(budget.spent, budget.amount),
          daysElapsed: elapsedDays,
          projectedSpend,
          projectedOver: projectedSpend > budget.amount,
        };
      })
      .sort((a, b) => Number(b.over) - Number(a.over) || b.spentPct - a.spentPct),
  };
}

/** Active subscriptions due within the next `days` days. */
export async function getUpcomingBills(
  userId: string,
  input: { days?: number; now?: Date } = {},
) {
  const now = input.now ?? new Date();
  const days = clampInt(input.days, 1, 90, 30);
  const cutoff = new Date(now.getTime() + days * DAY_MS);
  const subscriptions = await listSubscriptions(userId);

  const items = subscriptions
    .filter((subscription) => subscription.active)
    .map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      category: subscription.category,
      categoryLabel: categoryLabel(subscription.category),
      period: periodLabel(subscription.periodDays),
      nextBillingDate: nextBillingAfter(
        subscription.startDate,
        subscription.periodDays,
        now,
      ),
    }))
    .filter(
      (subscription) =>
        subscription.nextBillingDate >= now &&
        subscription.nextBillingDate <= cutoff,
    )
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

  return {
    currency: "IDR",
    withinDays: days,
    total: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

/** Largest transactions in a period (defaults to the current month). */
export async function getLargestTransactions(
  userId: string,
  input: {
    type?: "income" | "expense" | "transfer";
    from?: Date;
    to?: Date;
    limit?: number;
    now?: Date;
  } = {},
) {
  const now = input.now ?? new Date();
  const from = input.from ?? startOfMonthAt(now);
  const to = input.to ?? now;
  const limit = clampInt(input.limit, 1, 20, 10);

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      ...(input.type ? { type: input.type } : {}),
      date: { gte: from, lte: to },
    },
    select: {
      id: true,
      name: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      adminFee: true,
      balanceAccount: { select: { name: true } },
      toBalanceAccount: { select: { name: true } },
    },
    orderBy: { amount: "desc" },
    take: limit,
  });

  return {
    currency: "IDR",
    from: from.toISOString(),
    to: to.toISOString(),
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      type: row.type,
      category: row.category,
      categoryLabel: categoryLabel(row.category),
      date: row.date.toISOString(),
      adminFee: row.adminFee,
      account: row.balanceAccount?.name ?? null,
      toAccount: row.toBalanceAccount?.name ?? null,
    })),
  };
}

/** Compact markdown-ish snapshot injected into the system prompt. */
export function formatFinancialSnapshot(overview: FinancialOverview): string {
  const lines: string[] = [];
  lines.push(
    `Snapshot as of ${new Date(overview.asOf).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} (${overview.currency}). This may be stale; call tools for the latest numbers.`,
  );
  lines.push(
    `Net worth: ${formatRupiah(overview.netWorth)} across ${overview.accounts.length} account(s).`,
  );
  if (overview.accounts.length > 0) {
    lines.push(
      `Accounts: ${overview.accounts
        .map((account) => `${account.name} (${account.type}) ${formatRupiah(account.balance)}`)
        .join("; ")}.`,
    );
  } else {
    lines.push("Accounts: none yet.");
  }
  lines.push(
    `This month (${overview.month.label}): income ${formatRupiah(overview.month.income)}, expense ${formatRupiah(overview.month.expense)}, transfer fees ${formatRupiah(overview.month.transferFees)}, net ${formatRupiah(overview.month.net)}, savings rate ${overview.month.savingsRate}%.`,
  );
  if (overview.budgets.total > 0) {
    lines.push(
      `Budgets (${overview.budgets.overCount} over): ${overview.budgets.items
        .map(
          (budget) =>
            `${budget.categoryLabel} ${formatRupiah(budget.spent)}/${formatRupiah(budget.limit)}${budget.over ? " OVER" : ` (${formatRupiah(budget.remaining)} left)`}`,
        )
        .join("; ")}.`,
    );
  } else {
    lines.push("Budgets: none set.");
  }
  if (overview.upcoming.items.length > 0) {
    lines.push(
      `Upcoming bills (30 days, total ${formatRupiah(overview.upcoming.total)}): ${overview.upcoming.items
        .map(
          (item) =>
            `${item.name} ${formatRupiah(item.amount)} on ${item.nextBillingDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
        )
        .join("; ")}.`,
    );
  } else {
    lines.push("Upcoming bills (30 days): none.");
  }
  if (overview.topCategories.length > 0) {
    lines.push(
      `Top expense categories this month: ${overview.topCategories
        .map((category) => `${category.categoryLabel} ${formatRupiah(category.amount)} (${category.share}%)`)
        .join("; ")}.`,
    );
  }
  if (overview.recent.length > 0) {
    lines.push(
      `Recent transactions: ${overview.recent
        .map(
          (transaction) =>
            `${transaction.name} ${formatRupiah(transaction.amount)} ${transaction.type} ${transaction.categoryLabel}`,
        )
        .join("; ")}.`,
    );
  }
  return lines.join("\n");
}
