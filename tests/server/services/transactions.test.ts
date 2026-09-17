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
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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
const OK = { count: 1 } as const;
const NONE = { count: 0 } as const;

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
  mockPrisma.balanceAccount.updateMany.mockResolvedValue(OK);
});

describe("listTransactions", () => {
  it("scopes by userId, includes both accounts and orders newest-first (stable id tiebreak)", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([mockTxn]);
    const result = await listTransactions(USER_ID);
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      include: {
        balanceAccount: { select: accountSelect },
        toBalanceAccount: { select: accountSelect },
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });
    expect(result).toEqual({ items: [mockTxn], nextCursor: null });
  });

  it("reads one extra row to detect the next page and clamps the limit", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([
      { ...mockTxn, id: "a" },
      { ...mockTxn, id: "b" },
      { ...mockTxn, id: "c" },
    ]);

    const page = await listTransactions(USER_ID, { limit: 2 });

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
    expect(page.items.map((t) => t.id)).toEqual(["a", "b"]);
    expect(page.nextCursor).toBe("b");
  });

  it("resumes after the cursor with skip: 1", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([{ ...mockTxn, id: "c" }]);

    await listTransactions(USER_ID, { limit: 2, cursor: "b" });

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: "b" }, skip: 1 }),
    );
  });

  it("pushes type/category/date/keyword filters into the query", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);

    await listTransactions(USER_ID, {
      limit: 5,
      type: "expense",
      category: "FoodAndDrink",
      from: new Date("2026-07-01"),
      to: new Date("2026-07-31"),
      search: "food",
    });

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: USER_ID,
          type: "expense",
          category: "FoodAndDrink",
          date: { gte: new Date("2026-07-01"), lte: new Date("2026-07-31") },
          OR: [
            { name: { contains: "food", mode: "insensitive" } },
            { category: { in: ["FoodAndDrink"] } },
          ],
        },
      }),
    );
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
    mockPrisma.balanceAccount.updateMany.mockResolvedValue(NONE);

    await expect(createTransaction(USER_ID, incomeInput)).rejects.toThrow("Account not found");
  });

  it("scopes the source account update by id and userId", async () => {
    mockPrisma.transaction.create.mockResolvedValue(mockTxn);

    await createTransaction(USER_ID, incomeInput);

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenCalledWith({
      where: { id: SOURCE_ID, userId: USER_ID },
      data: { balance: { increment: 500000 } },
    });
  });

  it("throws 'Account not found' for an account owned by another user", async () => {
    mockPrisma.balanceAccount.updateMany.mockResolvedValue(NONE);

    await expect(createTransaction(USER_ID, incomeInput)).rejects.toThrow(
      "Account not found",
    );
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  it("creates an income transaction and increments the source balance", async () => {
    mockPrisma.transaction.create.mockResolvedValue(mockTxn);

    const result = await createTransaction(USER_ID, incomeInput);

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenCalledWith({
      where: { id: SOURCE_ID, userId: USER_ID },
      data: { balance: { increment: 500000 } },
    });
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
    expect(result).toEqual(mockTxn);
  });

  it("creates an expense transaction with a guarded (gte) balance decrement", async () => {
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "expense" });

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "expense",
      category: "FoodAndDrink",
      amount: 200000,
    });

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenCalledWith({
      where: { id: SOURCE_ID, userId: USER_ID, balance: { gte: 200000 } },
      data: { balance: { decrement: 200000 } },
    });
  });

  it("throws 'Insufficient balance' for an expense that would push balance below 0", async () => {
    mockPrisma.balanceAccount.updateMany.mockResolvedValue(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ id: SOURCE_ID });

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "expense",
        category: "FoodAndDrink",
        amount: 200,
      }),
    ).rejects.toThrow("Insufficient balance");
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  it("throws 'Account not found' when the guarded decrement matches no owned account", async () => {
    mockPrisma.balanceAccount.updateMany.mockResolvedValue(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(null);

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "expense",
        category: "FoodAndDrink",
        amount: 200,
      }),
    ).rejects.toThrow("Account not found");
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  it("allows an expense that exactly empties the balance", async () => {
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "expense" });

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "expense",
      category: "FoodAndDrink",
      amount: 200,
    });

    expect(mockPrisma.transaction.create).toHaveBeenCalled();
  });

  it("throws 'Destination account required' for a transfer without toBalanceAccountId", async () => {
    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "transfer",
        category: "AccountTransfer",
        toBalanceAccountId: null,
      }),
    ).rejects.toThrow("Destination account required");
  });

  it("throws 'Destination account not found' when dest does not exist", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([{ id: SOURCE_ID }]);

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "transfer",
        category: "AccountTransfer",
        toBalanceAccountId: DEST_ID,
      }),
    ).rejects.toThrow("Destination account not found");
  });

  it("throws 'Insufficient balance' for a transfer where source - (amount + adminFee) < 0", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([
      { id: SOURCE_ID },
      { id: DEST_ID },
    ]);
    mockPrisma.balanceAccount.updateMany.mockResolvedValueOnce(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ id: SOURCE_ID });

    await expect(
      createTransaction(USER_ID, {
        ...incomeInput,
        type: "transfer",
        category: "AccountTransfer",
        amount: 250,
        adminFee: 100,
        toBalanceAccountId: DEST_ID,
      }),
    ).rejects.toThrow("Insufficient balance");
  });

  it("creates a transfer: decrements source by (amount + adminFee), increments dest by amount", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([
      { id: SOURCE_ID },
      { id: DEST_ID },
    ]);
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "transfer" });

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "transfer",
      category: "AccountTransfer",
      amount: 300000,
      adminFee: 5000,
      toBalanceAccountId: DEST_ID,
    });

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: SOURCE_ID, userId: USER_ID, balance: { gte: 305000 } },
      data: { balance: { decrement: 305000 } },
    });
    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: DEST_ID, userId: USER_ID },
      data: { balance: { increment: 300000 } },
    });
  });

  it("allows a transfer that exactly empties the source (amount + adminFee == balance)", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([
      { id: SOURCE_ID },
      { id: DEST_ID },
    ]);
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "transfer" });

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "transfer",
      category: "AccountTransfer",
      amount: 300000,
      adminFee: 5000,
      toBalanceAccountId: DEST_ID,
    });

    expect(mockPrisma.transaction.create).toHaveBeenCalled();
  });

  it("scopes both account lookups by id and userId in a single query", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([
      { id: SOURCE_ID },
      { id: DEST_ID },
    ]);
    mockPrisma.transaction.create.mockResolvedValue({ ...mockTxn, type: "transfer" });

    await createTransaction(USER_ID, {
      ...incomeInput,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: DEST_ID,
    });

    expect(mockPrisma.balanceAccount.findMany).toHaveBeenCalledWith({
      where: { id: { in: [SOURCE_ID, DEST_ID] }, userId: USER_ID },
      select: { id: true },
    });
  });
});

describe("deleteTransaction", () => {
  it("throws 'Not found' when the transaction does not exist", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(null);

    await expect(deleteTransaction(USER_ID, TXN_ID)).rejects.toThrow("Not found");
  });

  it("deletes an income transaction with a guarded source decrement (reverses)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenCalledWith({
      where: { id: SOURCE_ID, userId: USER_ID, balance: { gte: 500000 } },
      data: { balance: { decrement: 500000 } },
    });
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: TXN_ID } });
  });

  it("throws 'Insufficient balance' when deleting income would push source below 0", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.balanceAccount.updateMany.mockResolvedValue(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ id: SOURCE_ID });

    await expect(deleteTransaction(USER_ID, TXN_ID)).rejects.toThrow("Insufficient balance");
    expect(mockPrisma.transaction.delete).not.toHaveBeenCalled();
  });

  it("still deletes income when the source account is gone", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.balanceAccount.updateMany.mockResolvedValue(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(null);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: TXN_ID } });
  });

  it("allows deleting income that exactly empties the source", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: TXN_ID },
    });
  });

  it("deletes an expense transaction and increments the source balance (reverses)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({ ...mockTxn, type: "expense" });
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenCalledWith({
      where: { id: SOURCE_ID, userId: USER_ID },
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
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: SOURCE_ID, userId: USER_ID },
      data: { balance: { increment: 305000 } },
    });
    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: DEST_ID, userId: USER_ID, balance: { gte: 300000 } },
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
    mockPrisma.balanceAccount.updateMany.mockResolvedValueOnce(OK).mockResolvedValueOnce(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue({ id: DEST_ID });

    await expect(deleteTransaction(USER_ID, TXN_ID)).rejects.toThrow("Insufficient balance");
  });

  it("still deletes a transfer whose destination account is gone (no dest balance check)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      ...mockTxn,
      type: "transfer",
      amount: 300000,
      adminFee: 5000,
      toBalanceAccountId: DEST_ID,
    });
    mockPrisma.balanceAccount.updateMany.mockResolvedValueOnce(OK).mockResolvedValueOnce(NONE);
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(null);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: SOURCE_ID, userId: USER_ID },
      data: { balance: { increment: 305000 } },
    });
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: TXN_ID },
    });
  });

  it("skips balance update but still deletes when balanceAccountId is null (account deleted)", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      ...mockTxn,
      balanceAccountId: null,
    });
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.balanceAccount.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: TXN_ID } });
  });

  it("scopes the ownership findFirst by id and userId", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(mockTxn);
    mockPrisma.transaction.delete.mockResolvedValue(mockTxn);

    await deleteTransaction(USER_ID, TXN_ID);

    expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: TXN_ID, userId: USER_ID },
    });
  });
});
