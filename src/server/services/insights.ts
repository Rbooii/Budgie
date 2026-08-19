import { prisma } from "@/lib/prisma";
import { startOfMonth } from "@/lib/budget";

export async function getFinancialInsights(userId: string) {
  const [accounts, monthIncome, monthExpense, monthExpenses] = await Promise.all([
    prisma.balanceAccount.findMany({
      where: { userId },
      select: { id: true, balance: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: startOfMonth() } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfMonth() } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: startOfMonth() } },
      select: { category: true, amount: true },
    }),
  ]);

  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const byCategory: Record<string, number> = {};
  for (const t of monthExpenses) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  return {
    netWorth,
    monthIncome: monthIncome._sum.amount ?? 0,
    monthExpense: monthExpense._sum.amount ?? 0,
    topCategories,
  };
}