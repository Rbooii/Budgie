import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    balanceAccount: {
      aggregate: vi.fn(),
    },
    transaction: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
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
    mockPrisma.balanceAccount.aggregate.mockResolvedValue({
      _sum: { balance: 1500000 },
    });
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 3000000 } })
      .mockResolvedValueOnce({ _sum: { amount: 1200000 } });
    mockPrisma.transaction.groupBy.mockResolvedValue([
      { category: "Rent", _sum: { amount: 900000 } },
      { category: "FoodAndDrink", _sum: { amount: 75000 } },
      { category: "Transportation", _sum: { amount: 20000 } },
    ]);

    const result = await getFinancialInsights(USER_ID);

    expect(mockPrisma.balanceAccount.aggregate).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      _sum: { balance: true },
    });
    // aggregation + top-5 slicing happens in Postgres, not in JS
    expect(mockPrisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, orderBy: { _sum: { amount: "desc" } } }),
    );
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
    mockPrisma.balanceAccount.aggregate.mockResolvedValue({ _sum: { balance: null } });
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });
    mockPrisma.transaction.groupBy.mockResolvedValue([]);

    const result = await getFinancialInsights(USER_ID);

    expect(result).toEqual({
      netWorth: 0,
      monthIncome: 0,
      monthExpense: 0,
      topCategories: [],
    });
  });

  it("caps top categories at five", async () => {
    mockPrisma.balanceAccount.aggregate.mockResolvedValue({ _sum: { balance: null } });
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });
    mockPrisma.transaction.groupBy.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        category: `Cat${i}`,
        _sum: { amount: i + 1 },
      })),
    );

    const result = await getFinancialInsights(USER_ID);
    expect(result.topCategories).toHaveLength(5);
  });
});