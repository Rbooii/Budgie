import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getAccountsForUser } from "@/server/queries";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/button";
import { AccountTab } from "@/components/account-tab";
import { AccountCard } from "@/components/account-card";
import { BalanceSection } from "@/components/balance-section";
import { BalanceVisibilityProvider } from "@/components/balance-visibility";
import { AddAccountDialog } from "@/components/add-account-dialog";
import CashflowCard from "@/components/cashflow-card";
import AssetGrowthCard from "@/components/asset-growth-card";
import { QuickInsightEmptyState } from "@/components/quick-insight-empty-state";
import {
  computeMonthlyNet,
  computeGrowthData,
  computeActiveMonths,
  computeAccountNetThisMonth,
  computeAccountSeries,
  computeStartingAssets,
  computeNetWorthDelta,
  computeTodayChangePercent,
} from "@/lib/dashboard";

export default function Dashboard() {
  return (
    <PageShell>
      <Suspense fallback={<PageSkeleton variant="dashboard" />}>
        <DashboardContent />
      </Suspense>
    </PageShell>
  );
}

async function DashboardContent() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const accounts = await getAccountsForUser(userId);
  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const currentMonth = new Date().getMonth();

  const [incomeAgg, expenseAgg, feeAgg, allTxns] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "transfer", date: { gte: startOfMonth } },
      _sum: { adminFee: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: {
        type: true,
        amount: true,
        adminFee: true,
        date: true,
        balanceAccountId: true,
        toBalanceAccountId: true,
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
  ]);
  const yearTxns = allTxns.filter((t) => t.date >= yearStart);
  const monthIncome = incomeAgg._sum.amount ?? 0;
  const monthExpense = (expenseAgg._sum.amount ?? 0) + (feeAgg._sum.adminFee ?? 0);
  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const monthlyNet = computeMonthlyNet(yearTxns);
  const startingAssets = computeStartingAssets(netWorth, monthlyNet);

  const accountNetThisMonth = computeAccountNetThisMonth(yearTxns, currentMonth);

  const accountSeries = Object.fromEntries(
    accounts.map((a) => [a.id, computeAccountSeries(allTxns, a.id, a.balance)]),
  );
  const accountTodayChanges = Object.fromEntries(
    accounts.map((a) => [a.id, computeTodayChangePercent(allTxns, a.id, a.balance)]),
  );

  const growthData = computeGrowthData(monthlyNet, startingAssets, currentMonth);

  const activeMonths = computeActiveMonths(yearTxns);

  const { absoluteChange, deltaPct: netWorthDeltaPct } = computeNetWorthDelta(
    accounts,
    accountNetThisMonth,
    netWorth,
  );

  return (
    <BalanceVisibilityProvider>
      <AccountTab userName={session.user.name} userId={userId} />
      <BalanceSection value={netWorth} deltaPct={netWorthDeltaPct} deltaAbsolute={absoluteChange} />
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 w-full h-fit mt-4">
        <Button variant="success" size="md">Details</Button>
        <AddAccountDialog />
      </div>

      {/* Account section */}
      <h1 className="font-bold text-xl mt-8">Your Accounts</h1>
      {accounts.length === 0 ? (
        <p className="text-sm text-black/40 mt-3">
          No accounts yet. Click &ldquo;Add Account&rdquo; to create your first one.
        </p>
      ) : (
        <div className="w-full h-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              series={accountSeries[account.id] ?? []}
              todayChangePct={accountTodayChanges[account.id] ?? null}
            />
          ))}
        </div>
      )}

      {/* Quick insight — cashflow + asset growth */}
      <h1 className="font-bold text-xl mt-8">Quick Insight</h1>
      {yearTxns.length > 0 ? (
        <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <CashflowCard
            title="This Month's Cashflow"
            date={monthLabel}
            income={monthIncome}
            expense={monthExpense}
          />
          <AssetGrowthCard
            year={new Date().getFullYear()}
            data={growthData}
            startingValue={startingAssets}
            currentTotal={netWorth}
            currentMonth={currentMonth}
            hasTransactions={yearTxns.length > 0}
            activeMonths={activeMonths}
          />
        </div>
      ) : (
        <QuickInsightEmptyState />
      )}
    </BalanceVisibilityProvider>
  );
}
