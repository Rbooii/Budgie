export type YearTxn = {
  type: string;
  amount: number;
  adminFee: number;
  date: Date;
  balanceAccountId: string | null;
  toBalanceAccountId: string | null;
};

export type AccountRow = {
  id: string;
  balance: number;
};

export function computeMonthlyNet(yearTxns: YearTxn[]): number[] {
  const monthlyNet = new Array(12).fill(0);
  for (const t of yearTxns) {
    const m = new Date(t.date).getMonth();
    if (m < 0 || m > 11) continue;
    if (t.type === "income") monthlyNet[m] += t.amount;
    else if (t.type === "expense") monthlyNet[m] -= t.amount;
    else if (t.type === "transfer") monthlyNet[m] -= t.adminFee;
  }
  return monthlyNet;
}

export function computeYearNetEffect(monthlyNet: number[]): number {
  return monthlyNet.reduce((a, b) => a + b, 0);
}

export function computeStartingAssets(netWorth: number, monthlyNet: number[]): number {
  return netWorth - computeYearNetEffect(monthlyNet);
}

export function computeGrowthData(
  monthlyNet: number[],
  startingAssets: number,
  currentMonth: number,
): { month: number; value: number }[] {
  const growthData: { month: number; value: number }[] = [];
  let cumulative = startingAssets;
  for (let m = 0; m <= currentMonth; m++) {
    cumulative += monthlyNet[m];
    growthData.push({ month: m, value: cumulative });
  }
  return growthData;
}

export function computeActiveMonths(yearTxns: YearTxn[]): boolean[] {
  return Array.from({ length: 12 }, (_, m) =>
    yearTxns.some((t) => new Date(t.date).getMonth() === m),
  );
}

export function computeAccountNetThisMonth(
  yearTxns: YearTxn[],
  currentMonth: number,
): Record<string, number> {
  const accountNet: Record<string, number> = {};
  for (const t of yearTxns) {
    const tm = new Date(t.date);
    if (tm.getMonth() !== currentMonth) continue;
    if (t.type === "income" && t.balanceAccountId) {
      accountNet[t.balanceAccountId] = (accountNet[t.balanceAccountId] ?? 0) + t.amount;
    } else if (t.type === "expense" && t.balanceAccountId) {
      accountNet[t.balanceAccountId] = (accountNet[t.balanceAccountId] ?? 0) - t.amount;
    } else if (t.type === "transfer") {
      if (t.balanceAccountId) {
        accountNet[t.balanceAccountId] =
          (accountNet[t.balanceAccountId] ?? 0) - (t.amount + t.adminFee);
      }
      if (t.toBalanceAccountId) {
        accountNet[t.toBalanceAccountId] =
          (accountNet[t.toBalanceAccountId] ?? 0) + t.amount;
      }
    }
  }
  return accountNet;
}

export function computeNetWorthDelta(
  accounts: AccountRow[],
  accountNetThisMonth: Record<string, number>,
  netWorth: number,
): { absoluteChange: number; deltaPct: number | null } {
  const lastMonthEndNetWorth = accounts.reduce(
    (sum, a) => sum + a.balance - (accountNetThisMonth[a.id] ?? 0),
    0,
  );
  const absoluteChange = netWorth - lastMonthEndNetWorth;
  const deltaPct =
    lastMonthEndNetWorth > 0 ? (absoluteChange / lastMonthEndNetWorth) * 100 : null;
  return { absoluteChange, deltaPct };
}
