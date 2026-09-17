import { prisma } from "@/lib/prisma";
import { budgetPeriodStart, budgetPeriodEnd } from "@/lib/budget";
import type { CreateBudget, UpdateBudget } from "@/server/schemas/budget";
import type { Category } from "@/generated/prisma/client";

export async function listBudgets(userId: string) {
  return prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Spend per category for the *current* period of each given budget.
 *
 * Budgets can have different `periodDays`, so windows differ. Instead of one
 * aggregate per budget (N+1), we bucket the budgets by `periodDays` and run a
 * single grouped aggregate per distinct period — typically 1–3 queries total.
 */
export async function sumExpenseByBudgetCategory(
  userId: string,
  budgets: { category: Category; periodDays: number }[],
): Promise<Map<Category, number>> {
  const categoriesByPeriod = new Map<number, Category[]>();
  for (const budget of budgets) {
    const list = categoriesByPeriod.get(budget.periodDays);
    if (list) list.push(budget.category);
    else categoriesByPeriod.set(budget.periodDays, [budget.category]);
  }

  const end = budgetPeriodEnd();
  const spent = new Map<Category, number>();
  await Promise.all(
    [...categoriesByPeriod].map(async ([periodDays, categories]) => {
      const rows = await prisma.transaction.groupBy({
        by: ["category"],
        where: {
          userId,
          type: "expense",
          category: { in: categories },
          date: { gte: budgetPeriodStart(periodDays), lte: end },
        },
        _sum: { amount: true },
      });
      for (const row of rows) {
        spent.set(row.category, row._sum.amount ?? 0);
      }
    }),
  );
  return spent;
}

export async function listBudgetsWithSpent(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const spent = await sumExpenseByBudgetCategory(userId, budgets);
  return budgets.map((budget) => ({
    ...budget,
    spent: spent.get(budget.category) ?? 0,
  }));
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
