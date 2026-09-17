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
  // One atomic unit: otherwise a failure between the two writes leaves the
  // account gone while its transactions survive.
  return prisma.$transaction(async (tx) => {
    const owned = await tx.balanceAccount.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) throw new Error("Not found");
    await tx.transaction.deleteMany({ where: { balanceAccountId: id, userId } });
    return tx.balanceAccount.delete({ where: { id } });
  });
}