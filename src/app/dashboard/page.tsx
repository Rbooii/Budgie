import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getAccountsForUser } from "@/server/queries";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/button";
import { AccountTab } from "@/components/account-tab";
import { AccountGrid } from "@/components/account-grid";
import { BalanceSection } from "@/components/balance-section";
import { BalanceVisibilityProvider } from "@/components/balance-visibility";
import { AddAccountDialog } from "@/components/add-account-dialog";
import {
  QuickInsightView,
  type CashflowPeriod,
  type GrowthPeriod,
} from "@/components/quick-insight";
import { QuickInsightEmptyState } from "@/components/quick-insight-empty-state";
import {
  computeMonthlyNet,
  computeYearNetEffect,
  computeGrowthData,
  computeActiveMonths,
  computeAccountNetThisMonth,
  computeAccountSeries,
  computeStartingAssets,
  computeNetWorthDelta,
  computeTodayChangePercent,
  sumCashflow,
  sumNetEffect,
  monthlyNetBetween,
  activeMonthsBetween,
} from "@/lib/dashboard";

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function formatMonthShort(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function monthLabels(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return {
      short: date
        .toLocaleDateString("en-GB", { month: "short" })
        .slice(0, 1),
      full: date.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
    };
  });
}

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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const thisMonthStart = new Date(currentYear, currentMonth, 1);
  const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const last3Start = new Date(currentYear, currentMonth - 2, 1);
  const yearStart = new Date(currentYear, 0, 1);
  const nextYearStart = new Date(currentYear + 1, 0, 1);
  const lastYearStart = new Date(currentYear - 1, 0, 1);
  const rollingStart = new Date(currentYear, currentMonth - 11, 1);

  const allTxns = await prisma.transaction.findMany({
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
  });

  const yearTxns = allTxns.filter(
    (t) => t.date >= yearStart && t.date < nextYearStart,
  );

  const monthlyNet = computeMonthlyNet(yearTxns);
  const startingAssets = computeStartingAssets(netWorth, monthlyNet);

  const accountNetThisMonth = computeAccountNetThisMonth(
    yearTxns,
    currentMonth,
  );

  const accountSeries = Object.fromEntries(
    accounts.map((a) => [a.id, computeAccountSeries(allTxns, a.id, a.balance)]),
  );
  const accountTodayChanges = Object.fromEntries(
    accounts.map((a) => [
      a.id,
      computeTodayChangePercent(allTxns, a.id, a.balance),
    ]),
  );

  const growthData = computeGrowthData(
    monthlyNet,
    startingAssets,
    currentMonth,
  );

  const activeMonths = computeActiveMonths(yearTxns);

  const { absoluteChange, deltaPct: netWorthDeltaPct } = computeNetWorthDelta(
    accounts,
    accountNetThisMonth,
    netWorth,
  );

  const thisMonth = sumCashflow(allTxns, thisMonthStart, nextMonthStart);
  const lastMonth = sumCashflow(allTxns, lastMonthStart, thisMonthStart);
  const last3 = sumCashflow(allTxns, last3Start, nextMonthStart);
  const thisYear = sumCashflow(allTxns, yearStart, nextYearStart);
  const lastYear = sumCashflow(allTxns, lastYearStart, yearStart);

  const cashflowPeriods: CashflowPeriod[] = [
    {
      id: "this-month",
      label: "This month",
      dateLabel: formatMonth(thisMonthStart),
      ...thisMonth,
    },
    {
      id: "last-month",
      label: "Last month",
      dateLabel: formatMonth(lastMonthStart),
      ...lastMonth,
    },
    {
      id: "last-3-months",
      label: "Last 3 months",
      dateLabel: `${formatMonthShort(last3Start)} - ${formatMonthShort(thisMonthStart)}`,
      ...last3,
    },
    {
      id: "this-year",
      label: "This year",
      dateLabel: String(currentYear),
      ...thisYear,
    },
    {
      id: "last-year",
      label: "Last year",
      dateLabel: String(currentYear - 1),
      ...lastYear,
    },
  ];

  const thisYearLabels = monthLabels(yearStart, 12);

  const lastYearTxns = allTxns.filter(
    (t) => t.date >= lastYearStart && t.date < yearStart,
  );
  const postLastYearNet = sumNetEffect(
    allTxns,
    yearStart,
    new Date(currentYear + 100, 0, 1),
  );
  const netWorthEndLastYear = netWorth - postLastYearNet;
  const lastYearMonthlyNet = computeMonthlyNet(lastYearTxns);
  const lastYearStartingAssets =
    netWorthEndLastYear - computeYearNetEffect(lastYearMonthlyNet);
  const lastYearGrowthData = computeGrowthData(
    lastYearMonthlyNet,
    lastYearStartingAssets,
    11,
  );
  const lastYearActive = computeActiveMonths(lastYearTxns);
  const lastYearLabels = monthLabels(lastYearStart, 12);

  const rollingTxns = allTxns.filter(
    (t) => t.date >= rollingStart && t.date < nextMonthStart,
  );
  const rollingMonthlyNet = monthlyNetBetween(rollingTxns, rollingStart, 12);
  const rollingStartingAssets =
    netWorth - rollingMonthlyNet.reduce((sum, value) => sum + value, 0);
  const rollingGrowthData = computeGrowthData(
    rollingMonthlyNet,
    rollingStartingAssets,
    11,
  );
  const rollingActive = activeMonthsBetween(rollingTxns, rollingStart, 12);
  const rollingLabels = monthLabels(rollingStart, 12);

  const growthPeriods: GrowthPeriod[] = [
    {
      id: "this-year",
      label: "This year",
      rangeLabel: String(currentYear),
      changeLabel: "YTD",
      shortLabels: thisYearLabels.map((label) => label.short),
      fullLabels: thisYearLabels.map((label) => label.full),
      data: growthData,
      startingValue: startingAssets,
      currentTotal: netWorth,
      currentMonth,
      hasTransactions: yearTxns.length > 0,
      activeMonths,
    },
    {
      id: "last-year",
      label: "Last year",
      rangeLabel: String(currentYear - 1),
      changeLabel: "Year",
      shortLabels: lastYearLabels.map((label) => label.short),
      fullLabels: lastYearLabels.map((label) => label.full),
      data: lastYearGrowthData,
      startingValue: lastYearStartingAssets,
      currentTotal: netWorthEndLastYear,
      currentMonth: 11,
      hasTransactions: lastYearTxns.length > 0,
      activeMonths: lastYearActive,
    },
    {
      id: "last-12-months",
      label: "Last 12 months",
      rangeLabel: "Last 12 months",
      changeLabel: "12M",
      shortLabels: rollingLabels.map((label) => label.short),
      fullLabels: rollingLabels.map((label) => label.full),
      data: rollingGrowthData,
      startingValue: rollingStartingAssets,
      currentTotal: netWorth,
      currentMonth: 11,
      hasTransactions: rollingTxns.length > 0,
      activeMonths: rollingActive,
    },
  ];

  const accountCards = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    balance: account.balance,
    currency: account.currency,
    type: account.type,
  }));

  return (
    <BalanceVisibilityProvider>
      <AccountTab userName={session.user.name} userId={userId} />
      <BalanceSection
        value={netWorth}
        deltaPct={netWorthDeltaPct}
        deltaAbsolute={absoluteChange}
      />
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 w-full h-fit mt-4">
        <Button variant="success" size="md">
          Details
        </Button>
        <AddAccountDialog />
      </div>

      {/* Account section */}
      <h1 className="font-bold text-xl mt-8">Your Accounts</h1>
      {accounts.length === 0 ? (
        <p className="text-sm text-ink/40 mt-3">
          No accounts yet. Click &ldquo;Add Account&rdquo; to create your first
          one.
        </p>
      ) : (
        <AccountGrid
          accounts={accountCards}
          accountSeries={accountSeries}
          accountTodayChanges={accountTodayChanges}
        />
      )}

      {/* Quick insight — cashflow + asset growth */}
      <h1 className="font-bold text-xl mt-8">Quick Insight</h1>
      {allTxns.length > 0 ? (
        <QuickInsightView
          cashflowPeriods={cashflowPeriods}
          growthPeriods={growthPeriods}
        />
      ) : (
        <QuickInsightEmptyState />
      )}
    </BalanceVisibilityProvider>
  );
}
