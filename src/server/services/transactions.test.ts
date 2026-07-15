import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    balanceAccount: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  listTransactions,
  getTransaction,
  createTransaction,
  deleteTransaction,
} from "@/server/services/transactions";
import type { CreateTransaction } from "@/server/schemas/transaction";

const USER_ID = "user-1";
const TXN_ID = "txn-1";
const SOURCE_ID = "acc-1";
const DEST_ID = "acc-2";

const accountSelect = { id: true, name: true, currency: true } as const;

const mockSource = {
  id: SOURCE_ID,
  name: "BCA",
  balance: 1000000,
  currency: "IDR",
  type: "bank",
  userId: USER_ID,
};
const mockDest = {
  id: DEST_ID,
  name: "GoPay",
  balance: 500000,
  currency: "IDR",
  type: "digital wallet",
  userId: USER_ID,
};
const mockTxn = {
  id: TXN_ID,
  name: "Salary",
  amount: 500000,
  type: "income",
  category: "Salary",
  date: new Date("2026-07-15"),
  adminFee: 0,
  balanceAccountId: SOURCE_ID,
  toBalanceAccountId: null,
  userId: USER_ID,
  balanceAccount: { id: SOURCE_ID, name: "BCA", currency: "IDR" },
  toBalanceAccount: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(
    async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
  );
});

describe("listTransactions", () => {
  it("scopes by userId, includes balanceAccount and toBalanceAccount, orders by date desc", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([mockTxn]);
    await listTransactions(USER_ID);
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      include: {
        balanceAccount: { select: accountSelect },
        toBalanceAccount: { select: accountSelect },
      },
      orderBy: { date: "desc" },
    });
  });
});

describe("getTransaction", () => {
  it("filters by both id and userId with includes", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    await getTransaction(USER_ID, TXN_ID);
    expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: TXN_ID, userId: USER_ID },
      include: {
        balanceAccount: { select: accountSelect },
        toBalanceAccount: { select: accountSelect },
      },
    });
  });
});

describe("createTransaction", () => {
  const incomeInput: CreateTransaction = {
    name: "Salary",
    amount: 500000,
    type: "income",
    category: "Salary",
    date: new Date("2026-07-15"),
    adminFee: 0,
    balanceAccountId: SOURCE_ID,
    toBalanceAccountId: null,
  };

  it("throws 'Account not found' when source account does not exist", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(null);

    await expect(createTransaction(USER_ID, incomeInput)).rejects.toThrow("Account not found");
  });

  it("creates an income transaction and increments the source balance", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockSource);
    mockPrisma.transaction.create.mockResolvedValue(mockTxn);
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);

    const result = await createTransaction(USER_ID, incomeInput);

    expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
      data: {
        name: "Salary",
        amount: 500000,
        type: "income",
        category: "Salary",
        date: expect.any(Date),
        adminFee: 0,
        balanceAccountId: SOURCE_ID,
        toBalanceAccountId: null,
        userId: USER_ID,
      },
      include: {
        balanceAccount: { select: accountSelect },
        toBalanceAccount: { select: accountSelect },
      },
    });
    expect(mockPrisma.balanceAccount.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { balance: { increment: 500000 } },
    });
    expect(result).toEqual(mockTxn);
  });

  it("creates an expense transaction and decrements the source balance", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockSource);
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "expense" });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "expense",
      category: "Food & Drink",
      amount: 200000,
    });

    expect(mockPrisma.balanceAccount.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { balance: { decrement: 200000 } },
    });
  });

  it("throws 'Insufficient balance' for an expense that would push balance below 0", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockSource, balance: 100 });

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "expense",
        category: "Food & Drink",
        amount: 200,
      }),
    ).rejects.toThrow("Insufficient balance");
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  it("allows an expense that exactly empties the balance", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockSource, balance: 200 });
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "expense" });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "expense",
      category: "Food & Drink",
      amount: 200,
    });

    expect(mockPrisma.transaction.create).toHaveBeenCalled();
  });

  it("throws 'Destination account required' for a transfer without toBalanceAccountId", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockSource);

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "transfer",
        category: "Account Transfer",
        toBalanceAccountId: null,
      }),
    ).rejects.toThrow("Destination account required");
  });

  it("throws 'Destination account not found' when dest does not exist", async () => {
    mockPrisma.balanceAccount.findFirst
      .mockResolvedValueOnce(mockSource)
      .mockResolvedValueOnce(null);

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "transfer",
        category: "Account Transfer",
        toBalanceAccountId: DEST_ID,
      }),
    ).rejects.toThrow("Destination account not found");
  });

  it("throws 'Insufficient balance' for a transfer where source - (amount + adminFee) < 0", async () => {
    mockPrisma.balanceAccount.findFirst
      .mockResolvedValueOnce({ ...mockSource, balance: 300 })
      .mockResolvedValueOnce(mockDest);

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "transfer",
        category: "Account Transfer",
        amount: 250,
        adminFee: 100,
        toBalanceAccountId: DEST_ID,
      }),
    ).rejects.toThrow("Insufficient balance");
  });

  it("creates a transfer: decrements source by (amount + adminFee), increments dest by amount", async () => {
    mockPrisma.balanceAccount.findFirst
      .mockResolvedValueOnce(mockSource)
      .mockResolvedValueOnce(mockDest);
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "transfer" });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "transfer",
      category: "Account Transfer",
      amount: 300000,
      adminFee: 5000,
      toBalanceAccountId: DEST_ID,
    });

    expect(mockPrisma.balanceAccount.update).toHaveBeenNthCalledWith(1, {
      where: { id: SOURCE_ID },
      data: { balance: { decrement: 305000 } },
    });
    expect(mockPrisma.balanceAccount.update).toHaveBeenNthCalledWith(2, {
      where: { id: DEST_ID },
      data: { balance: { increment: 300000 } },
    });
  });
});

describe("deleteTransaction", () => {
  it("throws 'Not found' when the transaction does not exist", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(null);

    await expect(deleteTransaction(USER_ID, TXN_ID)).rejects.toThrow("Not found");
  });

  it("deletes an income transaction and decrements the source balance (reverses)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockSource, balance: 1000000 });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { balance: { decrement: 500000 } },
    });
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: TXN_ID } });
  });

  it("throws 'Insufficient balance' when deleting income would push source below 0", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockSource, balance: 100 });

    await expect(deleteTransaction(USER_ID, TXN_ID)).rejects.toThrow("Insufficient balance");
    expect(mockPrisma.transaction.delete).not.toHaveBeenCalled();
  });

  it("deletes an expense transaction and increments the source balance (reverses)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({ ...mockTxn, type: "expense" });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.update).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { balance: { increment: 500000 } },
    });
  });

  it("deletes a transfer: increments source by (amount + adminFee), decrements dest by amount", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      ...mockTxn,
      type: "transfer",
      amount: 300000,
      adminFee: 5000,
      toBalanceAccountId: DEST_ID,
    });
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockDest, balance: 500000 });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.update).toHaveBeenNthCalledWith(1, {
      where: { id: SOURCE_ID },
      data: { balance: { increment: 305000 } },
    });
    expect(mockPrisma.balanceAccount.update).toHaveBeenNthCalledWith(2, {
      where: { id: DEST_ID },
      data: { balance: { decrement: 300000 } },
    });
  });

  it("throws 'Insufficient balance' when deleting a transfer would push dest below 0", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      ...mockTxn,
      type: "transfer",
      amount: 300000,
      toBalanceAccountId: DEST_ID,
    });
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockDest, balance: 100 });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);

    await expect(deleteTransaction(USER_ID, TXN_ID)).rejects.toThrow("Insufficient balance");
  });

  it("skips balance update but still deletes when balanceAccountId is null (account deleted)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      ...mockTxn,
      balanceAccountId: null,
    });
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.update).not.toHaveBeenCalled();
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: TXN_ID } });
  });

  it("scopes the ownership findFirst by id and userId", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ ...mockSource, balance: 1000000 });
    mockPrisma.balanceAccount.update.mockResolvedValue(mockSource);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: TXN_ID, userId: USER_ID },
    });
  });
});
