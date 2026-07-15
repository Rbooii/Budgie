import { prisma } from "@/lib/prisma";
import type { CreateBudget, UpdateBudget } from "@/server/schemas/budget";

export async function listBudgets(userId: string) {
  return prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBudget(userId: string, id: number) {
  return prisma.budget.findFirst({ where: { id, userId } });
}

export async function createBudget(userId: string, input: CreateBudget) {
  return prisma.budget.create({ data: { ...input, userId } });
}

export async function updateBudget(
  userId: string,
  id: number,
  input: UpdateBudget,
) {
  const owned = await prisma.budget.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Not found");
  return prisma.budget.update({ where: { id }, data: input });
}

export async function deleteBudget(userId: string, id: number) {
  const owned = await prisma.budget.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Not found");
  return prisma.budget.delete({ where: { id } });
}