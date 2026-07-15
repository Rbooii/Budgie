import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/button";
import { AccountTab } from "@/components/account-tab";
import { AccountCard } from "@/components/account-card";
import { BalanceSection } from "@/components/balance-section";
import { BalanceVisibilityProvider } from "@/components/balance-visibility";
import { AddAccountDialog } from "@/components/add-account-dialog";
import CashflowCard from "@/components/cashflow-card";
import AssetGrowthCard from "@/components/asset-growth-card";
import { QuickInsightEmptyState } from "@/components/quick-insight-empty-state";
import { api } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const accounts = await (await api["balance-accounts"].$get(
    {},
    {headers: Object.fromEntries(await headers())},
  )).json();
  console.log(accounts);

  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const currentMonth = new Date().getMonth();

  const [incomeAgg, expenseAgg, feeAgg, yearTxns] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: "income", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: "expense", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: "transfer", date: { gte: startOfMonth } },
      _sum: { adminFee: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: yearStart } },
      select: { type: true, amount: true, adminFee: true, date: true, balanceAccountId: true, toBalanceAccountId: true },
    }),
  ]);
  const monthIncome = incomeAgg._sum.amount ?? 0;
  const monthExpense = (expenseAgg._sum.amount ?? 0) + (feeAgg._sum.adminFee ?? 0);
  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const monthlyNet = new Array(12).fill(0);
  for (const t of yearTxns) {
    const m = new Date(t.date).getMonth();
    if (m < 0 || m > 11) continue;
    if (t.type === "income") monthlyNet[m] += t.amount;
    else if (t.type === "expense") monthlyNet[m] -= t.amount;
    else if (t.type === "transfer") monthlyNet[m] -= t.adminFee;
  }
  const yearNetEffect = monthlyNet.reduce((a, b) => a + b, 0);
  const startingAssets = netWorth - yearNetEffect;

  const accountNetThisMonth: Record<string, number> = {};
  for (const t of yearTxns) {
    const tm = new Date(t.date);
    if (tm.getMonth() !== currentMonth) continue;
    if (t.type === "income" && t.balanceAccountId) {
      accountNetThisMonth[t.balanceAccountId] = (accountNetThisMonth[t.balanceAccountId] ?? 0) + t.amount;
    } else if (t.type === "expense" && t.balanceAccountId) {
      accountNetThisMonth[t.balanceAccountId] = (accountNetThisMonth[t.balanceAccountId] ?? 0) - t.amount;
    } else if (t.type === "transfer") {
      if (t.balanceAccountId) {
        accountNetThisMonth[t.balanceAccountId] = (accountNetThisMonth[t.balanceAccountId] ?? 0) - (t.amount + t.adminFee);
      }
      if (t.toBalanceAccountId) {
        accountNetThisMonth[t.toBalanceAccountId] = (accountNetThisMonth[t.toBalanceAccountId] ?? 0) + t.amount;
      }
    }
  }

  const growthData: { month: number; value: number }[] = [];
  let cumulative = startingAssets;
  for (let m = 0; m <= currentMonth; m++) {
    cumulative += monthlyNet[m];
    growthData.push({ month: m, value: cumulative });
  }

  const activeMonths: boolean[] = Array.from({ length: 12 }, (_, m) =>
    yearTxns.some((t) => new Date(t.date).getMonth() === m),
  );

  const lastMonthEndNetWorth = accounts.reduce((sum, a) => {
    return sum + a.balance - (accountNetThisMonth[a.id] ?? 0);
  }, 0);
  const absoluteChange = netWorth - lastMonthEndNetWorth;
  const netWorthDeltaPct = lastMonthEndNetWorth > 0
    ? (absoluteChange / lastMonthEndNetWorth) * 100
    : null;

  return (
    <main className="w-full min-h-screen flex flex-col md:flex-row bg-white text-black">
      <Sidebar />
      <div className="flex-1 min-h-screen py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-20 pb-20 md:pb-10">
        <AccountTab userName={session.user.name} />

        <BalanceVisibilityProvider>
          <BalanceSection value={netWorth} deltaPct={netWorthDeltaPct} deltaAbsolute={absoluteChange} />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 w-fit h-fit mt-4">
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
                <AccountCard key={account.id} account={account} />
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
      </div>
    </main>
  );
}