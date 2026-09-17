import { prisma } from "@/lib/prisma";
import { startOfMonth } from "@/lib/budget";

export async function getFinancialInsights(userId: string) {
  const monthStart = startOfMonth();

  const [accounts, monthIncome, monthExpense, topRows] = await Promise.all([
    prisma.balanceAccount.aggregate({
      where: { userId },
      _sum: { balance: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    // Grouped + sorted + limited in the database: constant-size payload
    // regardless of how many transactions the month has.
    prisma.transaction.groupBy({
      by: ["category"],
      where: { userId, type: "expense", date: { gte: monthStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
  ]);

  return {
    netWorth: accounts._sum.balance ?? 0,
    monthIncome: monthIncome._sum.amount ?? 0,
    monthExpense: monthExpense._sum.amount ?? 0,
    topCategories: topRows.map((row) => ({
      category: row.category,
      amount: row._sum.amount ?? 0,
    })),
  };
}
