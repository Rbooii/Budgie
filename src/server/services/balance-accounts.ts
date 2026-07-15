import { prisma } from "@/lib/prisma";
import type { CreateBalanceAccount, UpdateBalanceAccount } from "@/server/schemas/balance-account";

export async function listBalanceAccounts(userId: string) {
  return prisma.balanceAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBalanceAccount(userId: string, id: string) {
  return prisma.balanceAccount.findFirst({ where: { id, userId } });
}

export async function createBalanceAccount(
  userId: string,
  input: CreateBalanceAccount,
) {
  return prisma.balanceAccount.create({ data: { ...input, userId } });
}

export async function updateBalanceAccount(
  userId: string,
  id: string,
  input: UpdateBalanceAccount,
) {
  const owned = await prisma.balanceAccount.findFirst({
    where: { id, userId },
  });
  if (!owned) throw new Error("Not found");
  return prisma.balanceAccount.update({ where: { id }, data: input });
}

export async function deleteBalanceAccount(userId: string, id: string) {
  const owned = await prisma.balanceAccount.findFirst({
    where: { id, userId },
  });
  if (!owned) throw new Error("Not found");
  return prisma.balanceAccount.delete({ where: { id } });
}