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

export type SparklineTrend = "up" | "down" | "flat";

function accountDelta(t: YearTxn, accountId: string): number {
  if (t.type === "income") return t.balanceAccountId === accountId ? t.amount : 0;
  if (t.type === "expense") return t.balanceAccountId === accountId ? -t.amount : 0;
  let value = 0;
  if (t.balanceAccountId === accountId) value -= t.amount + t.adminFee;
  if (t.toBalanceAccountId === accountId) value += t.amount;
  return value;
}

/**
 * Reconstructs an account's balance history backwards from its current
 * balance using its transactions, then downsamples to `maxPoints` (port of
 * the iOS `SparklineMath.series`).
 */
export function computeAccountSeries(
  transactions: YearTxn[],
  accountId: string,
  balance: number,
  maxPoints = 24,
): number[] {
  const relevant = transactions
    .filter(
      (t) => t.balanceAccountId === accountId || t.toBalanceAccountId === accountId,
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (relevant.length === 0) return [];

  const total = relevant.reduce((sum, t) => sum + accountDelta(t, accountId), 0);
  let running = balance - total;
  const values: number[] = [running];
  for (const t of relevant) {
    running += accountDelta(t, accountId);
    values.push(running);
  }

  if (values.length <= maxPoints) return values;
  const step = (values.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => values[Math.round(i * step)]);
}

/**
 * Overall direction of the series (last vs first) with a small relative
 * threshold so tiny changes count as stagnant.
 */
export function computeSparklineTrend(values: number[]): SparklineTrend {
  if (values.length === 0) return "flat";
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const threshold = Math.max(Math.abs(first) * 0.001, 1);
  if (Math.abs(delta) < threshold) return "flat";
  return delta > 0 ? "up" : "down";
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Today's net change percentage for one account (nil when there is no
 * activity today or the previous balance was not positive).
 */
export function computeTodayChangePercent(
  transactions: YearTxn[],
  accountId: string,
  balance: number,
): number | null {
  const now = new Date();
  const net = transactions
    .filter(
      (t) =>
        (t.balanceAccountId === accountId || t.toBalanceAccountId === accountId) &&
        isSameDay(new Date(t.date), now),
    )
    .reduce((sum, t) => sum + accountDelta(t, accountId), 0);
  if (net === 0) return null;
  const previous = balance - net;
  if (previous <= 0) return null;
  return (net / previous) * 100;
}
