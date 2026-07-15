import { prisma } from "@/lib/prisma";
import type { CreateTransaction } from "@/server/schemas/transaction";

const accountSelect = { id: true, name: true, currency: true } as const;

export async function listTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: {
      balanceAccount: { select: accountSelect },
      toBalanceAccount: { select: accountSelect },
    },
    orderBy: { date: "desc" },
  });
}

export async function getTransaction(userId: string, id: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      balanceAccount: { select: accountSelect },
      toBalanceAccount: { select: accountSelect },
    },
  });
}

export async function createTransaction(
  userId: string,
  input: CreateTransaction,
) {
  const {
    type,
    amount,
    adminFee,
    balanceAccountId,
    toBalanceAccountId,
    ...rest
  } = input;

  return prisma.$transaction(async (tx) => {
    const source = await tx.balanceAccount.findFirst({
      where: { id: balanceAccountId, userId },
    });
    if (!source) throw new Error("Account not found");

    let dest = null;
    if (type === "transfer") {
      if (!toBalanceAccountId) throw new Error("Destination account required");
      dest = await tx.balanceAccount.findFirst({
        where: { id: toBalanceAccountId, userId },
      });
      if (!dest) throw new Error("Destination account not found");
    }

    if (type === "expense" && source.balance - amount < 0) {
      throw new Error("Insufficient balance");
    }
    if (type === "transfer" && source.balance - (amount + adminFee) < 0) {
      throw new Error("Insufficient balance");
    }

    const txn = await tx.transaction.create({
      data: {
        ...rest,
        type,
        amount,
        adminFee,
        balanceAccountId,
        toBalanceAccountId: toBalanceAccountId ?? null,
        userId,
      },
      include: {
        balanceAccount: { select: accountSelect },
        toBalanceAccount: { select: accountSelect },
      },
    });

    if (type === "income") {
      await tx.balanceAccount.update({
        where: { id: balanceAccountId },
        data: { balance: { increment: amount } },
      });
    } else if (type === "expense") {
      await tx.balanceAccount.update({
        where: { id: balanceAccountId },
        data: { balance: { decrement: amount } },
      });
    } else if (type === "transfer" && dest) {
      await tx.balanceAccount.update({
        where: { id: balanceAccountId },
        data: { balance: { decrement: amount + adminFee } },
      });
      await tx.balanceAccount.update({
        where: { id: toBalanceAccountId! },
        data: { balance: { increment: amount } },
      });
    }

    return txn;
  });
}

export async function deleteTransaction(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.findFirst({ where: { id, userId } });
    if (!txn) throw new Error("Not found");

    if (txn.balanceAccountId) {
      if (txn.type === "income") {
        const source = await tx.balanceAccount.findFirst({
          where: { id: txn.balanceAccountId, userId },
        });
        if (source && source.balance - txn.amount < 0) {
          throw new Error("Insufficient balance");
        }
        await tx.balanceAccount.update({
          where: { id: txn.balanceAccountId },
          data: { balance: { decrement: txn.amount } },
        });
      } else if (txn.type === "expense") {
        await tx.balanceAccount.update({
          where: { id: txn.balanceAccountId },
          data: { balance: { increment: txn.amount } },
        });
      } else if (
        txn.type === "transfer" &&
        txn.toBalanceAccountId
      ) {
        await tx.balanceAccount.update({
          where: { id: txn.balanceAccountId },
          data: { balance: { increment: txn.amount + txn.adminFee } },
        });
        const dest = await tx.balanceAccount.findFirst({
          where: { id: txn.toBalanceAccountId, userId },
        });
        if (dest && dest.balance - txn.amount < 0) {
          throw new Error("Insufficient balance");
        }
        await tx.balanceAccount.update({
          where: { id: txn.toBalanceAccountId },
          data: { balance: { decrement: txn.amount } },
        });
      }
    }

    await tx.transaction.delete({ where: { id } });
    return txn;
  });
}
