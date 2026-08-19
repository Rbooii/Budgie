import { describe, it, expect } from "vitest";
import {
  computeMonthlyNet,
  computeYearNetEffect,
  computeStartingAssets,
  computeGrowthData,
  computeActiveMonths,
  computeAccountNetThisMonth,
  computeNetWorthDelta,
  type YearTxn,
} from "@/lib/dashboard";

function txn(
  overrides: Partial<YearTxn> & { date: Date },
): YearTxn {
  return {
    type: "income",
    amount: 1000,
    adminFee: 0,
    balanceAccountId: "acc-1",
    toBalanceAccountId: null,
    ...overrides,
  };
}

describe("computeMonthlyNet", () => {
  it("returns 12 zeros for no transactions", () => {
    expect(computeMonthlyNet([])).toEqual(new Array(12).fill(0));
  });

  it("adds income amounts to the correct month", () => {
    const result = computeMonthlyNet([
      txn({ type: "income", amount: 500, date: new Date(2026, 0, 15) }),
      txn({ type: "income", amount: 300, date: new Date(2026, 5, 20) }),
    ]);
    expect(result[0]).toBe(500);
    expect(result[5]).toBe(300);
    expect(result[1]).toBe(0);
  });

  it("subtracts expense amounts from the correct month", () => {
    const result = computeMonthlyNet([
      txn({ type: "expense", amount: 200, date: new Date(2026, 2, 10) }),
    ]);
    expect(result[2]).toBe(-200);
  });

  it("subtracts adminFee (not amount) for transfers", () => {
    const result = computeMonthlyNet([
      txn({ type: "transfer", amount: 10000, adminFee: 500, date: new Date(2026, 3, 5) }),
    ]);
    expect(result[3]).toBe(-500);
  });

  it("handles multiple transactions in the same month", () => {
    const result = computeMonthlyNet([
      txn({ type: "income", amount: 500, date: new Date(2026, 0, 1) }),
      txn({ type: "expense", amount: 200, date: new Date(2026, 0, 15) }),
    ]);
    expect(result[0]).toBe(300);
  });

  it("ignores transactions with out-of-range months gracefully", () => {
    const result = computeMonthlyNet([
      txn({ type: "income", amount: 999, date: new Date(2026, 0, 1) }),
    ]);
    expect(result).toHaveLength(12);
    expect(result[0]).toBe(999);
  });
});

describe("computeYearNetEffect", () => {
  it("sums all monthly values", () => {
    const monthly = [100, -50, 0, 200, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(computeYearNetEffect(monthly)).toBe(250);
  });

  it("returns 0 for all zeros", () => {
    expect(computeYearNetEffect(new Array(12).fill(0))).toBe(0);
  });
});

describe("computeStartingAssets", () => {
  it("subtracts year net effect from net worth", () => {
    const monthly = [100, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(computeStartingAssets(1000, monthly)).toBe(950);
  });

  it("returns net worth when there are no transactions", () => {
    expect(computeStartingAssets(5000, new Array(12).fill(0))).toBe(5000);
  });
});

describe("computeGrowthData", () => {
  it("produces cumulative values from startingAssets through currentMonth", () => {
    const monthly = [100, -50, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = computeGrowthData(monthly, 1000, 2);
    expect(result).toEqual([
      { month: 0, value: 1100 },
      { month: 1, value: 1050 },
      { month: 2, value: 1250 },
    ]);
  });

  it("returns only month 0 when currentMonth is 0", () => {
    const monthly = new Array(12).fill(0);
    monthly[0] = 100;
    const result = computeGrowthData(monthly, 500, 0);
    expect(result).toEqual([{ month: 0, value: 600 }]);
  });

  it("returns all 12 months when currentMonth is 11", () => {
    const result = computeGrowthData(new Array(12).fill(0), 1000, 11);
    expect(result).toHaveLength(12);
    expect(result[11]).toEqual({ month: 11, value: 1000 });
  });
});

describe("computeActiveMonths", () => {
  it("returns all false for no transactions", () => {
    expect(computeActiveMonths([])).toEqual(new Array(12).fill(false));
  });

  it("marks months that have transactions as true", () => {
    const result = computeActiveMonths([
      txn({ date: new Date(2026, 0, 1) }),
      txn({ date: new Date(2026, 5, 15) }),
      txn({ date: new Date(2026, 11, 31) }),
    ]);
    expect(result[0]).toBe(true);
    expect(result[5]).toBe(true);
    expect(result[11]).toBe(true);
    expect(result[1]).toBe(false);
  });
});

describe("computeAccountNetThisMonth", () => {
  it("returns empty object for no transactions", () => {
    expect(computeAccountNetThisMonth([], 0)).toEqual({});
  });

  it("skips transactions not in the current month", () => {
    const result = computeAccountNetThisMonth(
      [txn({ type: "income", amount: 500, balanceAccountId: "a1", date: new Date(2026, 1, 1) })],
      0,
    );
    expect(result).toEqual({});
  });

  it("adds income to the source account", () => {
    const result = computeAccountNetThisMonth(
      [txn({ type: "income", amount: 500, balanceAccountId: "a1", date: new Date(2026, 0, 1) })],
      0,
    );
    expect(result["a1"]).toBe(500);
  });

  it("subtracts expense from the source account", () => {
    const result = computeAccountNetThisMonth(
      [txn({ type: "expense", amount: 200, balanceAccountId: "a1", date: new Date(2026, 0, 1) })],
      0,
    );
    expect(result["a1"]).toBe(-200);
  });

  it("subtracts (amount + adminFee) from source and adds amount to dest for transfers", () => {
    const result = computeAccountNetThisMonth(
      [
        txn({
          type: "transfer",
          amount: 1000,
          adminFee: 100,
          balanceAccountId: "a1",
          toBalanceAccountId: "a2",
          date: new Date(2026, 0, 1),
        }),
      ],
      0,
    );
    expect(result["a1"]).toBe(-1100);
    expect(result["a2"]).toBe(1000);
  });

  it("handles multiple transactions across accounts in the same month", () => {
    const result = computeAccountNetThisMonth(
      [
        txn({ type: "income", amount: 500, balanceAccountId: "a1", date: new Date(2026, 0, 1) }),
        txn({ type: "expense", amount: 200, balanceAccountId: "a1", date: new Date(2026, 0, 15) }),
        txn({ type: "income", amount: 300, balanceAccountId: "a2", date: new Date(2026, 0, 10) }),
      ],
      0,
    );
    expect(result["a1"]).toBe(300);
    expect(result["a2"]).toBe(300);
  });

  it("skips null balanceAccountId for income/expense", () => {
    const result = computeAccountNetThisMonth(
      [txn({ type: "income", amount: 500, balanceAccountId: null, date: new Date(2026, 0, 1) })],
      0,
    );
    expect(result).toEqual({});
  });
});

describe("computeNetWorthDelta", () => {
  it("computes absolute change and delta percentage", () => {
    const accounts = [{ id: "a1", balance: 1100 }];
    const accountNet = { a1: 100 };
    const { absoluteChange, deltaPct } = computeNetWorthDelta(accounts, accountNet, 1100);
    expect(absoluteChange).toBe(100);
    expect(deltaPct).toBeCloseTo(10, 1);
  });

  it("returns null deltaPct when last month net worth is 0", () => {
    const accounts = [{ id: "a1", balance: 100 }];
    const accountNet = { a1: 100 };
    const { deltaPct } = computeNetWorthDelta(accounts, accountNet, 100);
    expect(deltaPct).toBeNull();
  });

  it("returns null deltaPct when last month net worth is negative", () => {
    const accounts = [{ id: "a1", balance: 50 }];
    const accountNet = { a1: 100 };
    const { deltaPct } = computeNetWorthDelta(accounts, accountNet, 50);
    expect(deltaPct).toBeNull();
  });

  it("handles multiple accounts", () => {
    const accounts = [
      { id: "a1", balance: 1100 },
      { id: "a2", balance: 2100 },
    ];
    const accountNet = { a1: 100, a2: 200 };
    const { absoluteChange } = computeNetWorthDelta(accounts, accountNet, 3200);
    expect(absoluteChange).toBe(300);
  });

  it("handles accounts with no transactions this month (accountNet = 0)", () => {
    const accounts = [{ id: "a1", balance: 1000 }];
    const { absoluteChange, deltaPct } = computeNetWorthDelta(accounts, {}, 1000);
    expect(absoluteChange).toBe(0);
    expect(deltaPct).toBe(0);
  });
});
