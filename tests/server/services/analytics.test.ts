import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, serviceMocks } = vi.hoisted(() => ({
  prismaMock: {
    transaction: { findMany: vi.fn() },
    balanceAccount: { aggregate: vi.fn() },
  },
  serviceMocks: {
    listBalanceAccounts: vi.fn(),
    listBudgetsWithSpent: vi.fn(),
    listSubscriptions: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/balance-accounts", () => ({
  listBalanceAccounts: serviceMocks.listBalanceAccounts,
}));
vi.mock("@/server/services/budgets", () => ({
  listBudgetsWithSpent: serviceMocks.listBudgetsWithSpent,
}));
vi.mock("@/server/services/subscriptions", () => ({
  listSubscriptions: serviceMocks.listSubscriptions,
}));

import {
  getBudgetStatus,
  getCashflowTrend,
  getNetWorthHistory,
  getSpendingBreakdown,
  getUpcomingBills,
} from "@/server/services/analytics";

const USER_ID = "user-1";
const NOW = new Date("2026-08-15T12:00:00");

function txn(
  type: "income" | "expense" | "transfer",
  amount: number,
  date: string,
  adminFee = 0,
) {
  return { type, amount, adminFee, date: new Date(date) };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getCashflowTrend", () => {
  it("buckets income, expenses and transfer fees by month", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([
      txn("income", 1000, "2026-06-10T00:00:00"),
      txn("expense", 400, "2026-06-11T00:00:00"),
      txn("expense", 200, "2026-07-01T00:00:00"),
      txn("transfer", 500, "2026-07-02T00:00:00", 50),
      txn("income", 3000, "2026-08-03T00:00:00"),
    ]);

    const result = await getCashflowTrend(USER_ID, { months: 3, now: NOW });

    expect(result.months.map((month) => month.month)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(result.months[0]).toMatchObject({ income: 1000, expense: 400, net: 600 });
    expect(result.months[1]).toMatchObject({
      income: 0,
      expense: 200,
      transferFees: 50,
      net: -250,
    });
    expect(result.months[2]).toMatchObject({ income: 3000, net: 3000 });
    expect(result.totals).toEqual({
      income: 4000,
      expense: 600,
      transferFees: 50,
      net: 3350,
    });
  });
});

describe("getNetWorthHistory", () => {
  it("builds a rolling net-worth series", async () => {
    prismaMock.balanceAccount.aggregate.mockResolvedValue({
      _sum: { balance: 5000 },
    });
    prismaMock.transaction.findMany.mockResolvedValue([
      txn("income", 500, "2026-06-10T00:00:00"),
      txn("expense", 200, "2026-07-10T00:00:00"),
      txn("income", 100, "2026-08-10T00:00:00"),
    ]);

    const result = await getNetWorthHistory(USER_ID, {
      months: 3,
      now: NOW,
    });

    expect(result.netWorth).toBe(5000);
    expect(result.series.map((point) => point.value)).toEqual([5100, 4900, 5000]);
    expect(result.change).toBe(-100);
  });
});

describe("getBudgetStatus", () => {
  it("reports remaining amounts and a pace projection", async () => {
    serviceMocks.listBudgetsWithSpent.mockResolvedValue([
      {
        id: "b1",
        category: "FoodAndDrink",
        amount: 1000,
        periodDays: 30,
        spent: 400,
        currency: "IDR",
      },
      {
        id: "b2",
        category: "Shopping",
        amount: 700,
        periodDays: 7,
        spent: 900,
        currency: "IDR",
      },
    ]);

    const result = await getBudgetStatus(USER_ID, NOW);

    const food = result.budgets.find((budget) => budget.id === "b1");
    expect(food).toMatchObject({
      remaining: 600,
      over: false,
      spentPct: 40,
      daysElapsed: 15,
      projectedSpend: 800,
      projectedOver: false,
    });

    const shopping = result.budgets.find((budget) => budget.id === "b2");
    expect(shopping).toMatchObject({ over: true, remaining: -200 });
    expect(shopping?.projectedOver).toBe(true);
  });
});

describe("getSpendingBreakdown", () => {
  it("groups expenses and compares with the previous period", async () => {
    prismaMock.transaction.findMany
      .mockResolvedValueOnce([
        { name: "Lunch", category: "FoodAndDrink", amount: 100 },
        { name: "Dinner", category: "FoodAndDrink", amount: 50 },
        { name: "Shoes", category: "Shopping", amount: 50 },
      ])
      .mockResolvedValueOnce([
        { name: "Old lunch", category: "FoodAndDrink", amount: 100 },
      ]);
    serviceMocks.listBudgetsWithSpent.mockResolvedValue([
      {
        id: "b1",
        category: "FoodAndDrink",
        amount: 500,
        periodDays: 30,
        spent: 150,
      },
    ]);

    const result = await getSpendingBreakdown(USER_ID, {
      from: new Date("2026-08-01T00:00:00"),
      to: new Date("2026-08-15T00:00:00"),
      now: NOW,
    });

    expect(result.total).toBe(200);
    expect(result.items[0]).toMatchObject({
      key: "FoodAndDrink",
      amount: 150,
      count: 2,
      share: 75,
      previousAmount: 100,
      deltaPct: 50,
      budget: 500,
    });
  });
});

describe("getUpcomingBills", () => {
  it("keeps active bills inside the window", async () => {
    serviceMocks.listSubscriptions.mockResolvedValue([
      {
        id: "s1",
        name: "Netflix",
        amount: 149000,
        category: "Entertainment",
        periodDays: 30,
        startDate: new Date("2026-07-20T00:00:00"),
        active: true,
        currency: "IDR",
      },
      {
        id: "s2",
        name: "Old gym",
        amount: 300000,
        category: "Healthcare",
        periodDays: 30,
        startDate: new Date("2026-03-01T00:00:00"),
        active: false,
        currency: "IDR",
      },
    ]);

    const result = await getUpcomingBills(USER_ID, { days: 10, now: NOW });

    expect(result.total).toBe(149000);
    expect(result.items.map((item) => item.name)).toEqual(["Netflix"]);
  });
});
