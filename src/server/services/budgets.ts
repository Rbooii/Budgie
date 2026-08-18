import { prisma } from "@/lib/prisma";
import { periodStartDate } from "@/lib/budget";
import type { CreateBudget, UpdateBudget } from "@/server/schemas/budget";

export async function listBudgets(userId: string) {
  return prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listBudgetsWithSpent(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const withSpent = await Promise.all(
    budgets.map(async (b) => {
      const agg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          category: b.category,
          date: { gte: periodStartDate(b.periodDays) },
        },
        _sum: { amount: true },
      });
      return { ...b, spent: agg._sum.amount ?? 0 };
    }),
  );
  return withSpent;
}

export async function getBudget(userId: string, id: string) {
  return prisma.budget.findFirst({ where: { id, userId } });
}

export async function createBudget(userId: string, input: CreateBudget) {
  const existing = await prisma.budget.findFirst({
    where: { userId, category: input.category },
  });
  if (existing) throw new Error("Budget for this category already exists");
  return prisma.budget.create({ data: { ...input, userId } });
}

export async function updateBudget(
  userId: string,
  id: string,
  input: UpdateBudget,
) {
  const owned = await prisma.budget.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Not found");
  if (owned.category !== input.category) {
    const clash = await prisma.budget.findFirst({
      where: { userId, category: input.category, NOT: { id } },
    });
    if (clash) throw new Error("Budget for this category already exists");
  }
  return prisma.budget.update({ where: { id }, data: input });
}

export async function deleteBudget(userId: string, id: string) {
  const owned = await prisma.budget.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Not found");
  return prisma.budget.delete({ where: { id } });
}
