import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/generated/prisma/client";
import { PageShell } from "@/components/page-shell";
import { AccountTab } from "@/components/account-tab";
import { BudgetSummaryCards } from "@/components/budget-summary-cards";
import { SpendingStreamsChart } from "@/components/spending-streams-chart";
import { BudgetsList, type BudgetRow } from "@/components/budgets-list";
import { AddBudgetDialog } from "@/components/add-budget-dialog";
import {
  SubscriptionList,
  type SubscriptionRow,
} from "@/components/subscription-list";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import { startOfMonth, startOfToday, periodStartDate } from "@/lib/budget";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [budgets, subscriptions, monthExpenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        amount: true,
        currency: true,
        periodDays: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        category: true,
        periodDays: true,
        startDate: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: startOfMonth() } },
      select: { category: true, amount: true },
    }),
  ]);

  const monthExpenseByCategory: Record<string, number> = {};
  for (const t of monthExpenses) {
    monthExpenseByCategory[t.category] =
      (monthExpenseByCategory[t.category] ?? 0) + t.amount;
  }

  const spentByBudgetCategory: Record<string, number> = {};
  await Promise.all(
    budgets.map(async (b) => {
      const periodStart = periodStartDate(b.periodDays);
      const agg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          category: b.category as Category,
          date: { gte: periodStart },
        },
        _sum: { amount: true },
      });
      spentByBudgetCategory[b.category] = agg._sum.amount ?? 0;
    }),
  );

  const monthlyBudgets = budgets.filter((b) => b.periodDays === 30);
  const dailyBudgets = budgets.filter((b) => b.periodDays === 1);

  const monthlyTotal = monthlyBudgets.reduce((s, b) => s + b.amount, 0);
  const monthlySpent = monthlyBudgets.reduce(
    (s, b) => s + (spentByBudgetCategory[b.category] ?? 0),
    0,
  );
  const dailyTotal = dailyBudgets.reduce((s, b) => s + b.amount, 0);
  const dailySpent = dailyBudgets.reduce(
    (s, b) => s + (spentByBudgetCategory[b.category] ?? 0),
    0,
  );

  const streamsData = Object.entries(monthExpenseByCategory)
    .map(([category, spent]) => ({ category, spent }))
    .filter((d) => d.spent > 0);

  const streamsBudgets = budgets.map((b) => ({
    category: b.category,
    amount: b.amount,
  }));

  const usedCategories = budgets.map((b) => b.category);

  const monthLabel = new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const budgetRows = budgets as unknown as BudgetRow[];
  const subscriptionRows = subscriptions as unknown as SubscriptionRow[];

  return (
    <PageShell>
      <AccountTab userName={session.user.name} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 md:mt-8">
        Budgets
      </h1>

      <BudgetSummaryCards
        monthly={{ total: monthlyTotal, spent: monthlySpent }}
        daily={{ total: dailyTotal, spent: dailySpent }}
      />

      <div className="mt-6">
        <SpendingStreamsChart
          data={streamsData}
          budgets={streamsBudgets}
          monthLabel={monthLabel}
        />
      </div>

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-xl font-bold text-black">Your Budgets</h2>
        <AddBudgetDialog usedCategories={usedCategories} />
      </div>
      <BudgetsList
        budgets={budgetRows}
        spentByCategory={spentByBudgetCategory}
        addTrigger={<AddBudgetDialog usedCategories={usedCategories} />}
      />

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-xl font-bold text-black">Subscriptions</h2>
        <AddSubscriptionDialog />
      </div>
      <SubscriptionList
        subscriptions={subscriptionRows}
        addTrigger={<AddSubscriptionDialog />}
      />
    </PageShell>
  );
}
