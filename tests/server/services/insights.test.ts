import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    balanceAccount: {
      findMany: vi.fn(),
    },
    transaction: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { getFinancialInsights } from "@/server/services/insights";

const USER_ID = "user-1";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getFinancialInsights", () => {
  it("computes net worth, month totals and top categories", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([
      { id: "acc-1", balance: 1000000 },
      { id: "acc-2", balance: 500000 },
    ]);
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 3000000 } })
      .mockResolvedValueOnce({ _sum: { amount: 1200000 } });
    mockPrisma.transaction.findMany.mockResolvedValue([
      { category: "FoodAndDrink", amount: 45000 },
      { category: "FoodAndDrink", amount: 30000 },
      { category: "Transportation", amount: 20000 },
      { category: "Rent", amount: 900000 },
    ]);

    const result = await getFinancialInsights(USER_ID);

    expect(mockPrisma.balanceAccount.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      select: { id: true, balance: true },
    });
    expect(result.netWorth).toBe(1500000);
    expect(result.monthIncome).toBe(3000000);
    expect(result.monthExpense).toBe(1200000);
    expect(result.topCategories).toEqual([
      { category: "Rent", amount: 900000 },
      { category: "FoodAndDrink", amount: 75000 },
      { category: "Transportation", amount: 20000 },
    ]);
  });

  it("handles a user with no data", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([]);
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });
    mockPrisma.transaction.findMany.mockResolvedValue([]);

    const result = await getFinancialInsights(USER_ID);

    expect(result).toEqual({
      netWorth: 0,
      monthIncome: 0,
      monthExpense: 0,
      topCategories: [],
    });
  });

  it("caps top categories at five", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([]);
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });
    mockPrisma.transaction.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        category: `Cat${i}`,
        amount: i + 1,
      })),
    );

    const result = await getFinancialInsights(USER_ID);
    expect(result.topCategories).toHaveLength(5);
  });
});