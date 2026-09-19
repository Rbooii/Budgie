import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sumExpenseByBudgetCategory } from "@/server/services/budgets";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/page-skeleton";
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
import { startOfMonth } from "@/lib/budget";

export default function BudgetPage() {
  return (
    <PageShell>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <BudgetContent />
      </Suspense>
    </PageShell>
  );
}

async function BudgetContent() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [budgets, subscriptions, monthExpenseRows] = await Promise.all([
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
    prisma.transaction.groupBy({
      by: ["category"],
      where: { userId, type: "expense", date: { gte: startOfMonth() } },
      _sum: { amount: true },
    }),
  ]);

  // One grouped aggregate per distinct budget period instead of one per budget.
  const spentByCategoryMap = await sumExpenseByBudgetCategory(userId, budgets);
  const spentByBudgetCategory = Object.fromEntries(spentByCategoryMap);

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

  const streamsData = monthExpenseRows
    .map((row) => ({ category: row.category, spent: row._sum.amount ?? 0 }))
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
    <>
      <AccountTab userName={session.user.name} userId={userId} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 md:mt-8">
        Budgets
      </h1>

      <BudgetSummaryCards
        monthly={{ total: monthlyTotal, spent: monthlySpent, count: monthlyBudgets.length }}
        daily={{ total: dailyTotal, spent: dailySpent, count: dailyBudgets.length }}
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
    </>
  );
}
