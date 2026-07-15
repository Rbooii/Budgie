import { describe, it, expect } from "vitest";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES,
  ALL_CATEGORIES,
  CATEGORIES_BY_TYPE,
  type TransactionType,
} from "@/lib/categories";

describe("category lists", () => {
  it("INCOME_CATEGORIES contains expected entries", () => {
    expect(INCOME_CATEGORIES).toContain("Salary");
    expect(INCOME_CATEGORIES).toContain("Bonus");
    expect(INCOME_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("EXPENSE_CATEGORIES contains expected entries", () => {
    expect(EXPENSE_CATEGORIES).toContain("Food & Drink");
    expect(EXPENSE_CATEGORIES).toContain("Rent");
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("TRANSFER_CATEGORIES contains expected entries", () => {
    expect(TRANSFER_CATEGORIES).toContain("Account Transfer");
    expect(TRANSFER_CATEGORIES).toContain("Savings");
    expect(TRANSFER_CATEGORIES.length).toBeGreaterThan(0);
  });
});

describe("ALL_CATEGORIES", () => {
  it("is the union of all three lists", () => {
    expect(ALL_CATEGORIES).toEqual([
      ...INCOME_CATEGORIES,
      ...EXPENSE_CATEGORIES,
      ...TRANSFER_CATEGORIES,
    ]);
  });

  it("has no duplicate entries", () => {
    const seen = new Set<string>();
    for (const c of ALL_CATEGORIES) {
      expect(seen.has(c)).toBe(false);
      seen.add(c);
    }
  });
});

describe("CATEGORIES_BY_TYPE", () => {
  it("maps income to INCOME_CATEGORIES", () => {
    expect(CATEGORIES_BY_TYPE.income).toBe(INCOME_CATEGORIES);
  });

  it("maps expense to EXPENSE_CATEGORIES", () => {
    expect(CATEGORIES_BY_TYPE.expense).toBe(EXPENSE_CATEGORIES);
  });

  it("maps transfer to TRANSFER_CATEGORIES", () => {
    expect(CATEGORIES_BY_TYPE.transfer).toBe(TRANSFER_CATEGORIES);
  });

  it("has exactly three keys matching TransactionType", () => {
    const keys = Object.keys(CATEGORIES_BY_TYPE).sort();
    expect(keys).toEqual(["expense", "income", "transfer"]);
  });
});

describe("no overlap between category lists", () => {
  it("income and expense share no categories", () => {
    const incomeSet = new Set<string>(INCOME_CATEGORIES);
    for (const c of EXPENSE_CATEGORIES) {
      expect(incomeSet.has(c)).toBe(false);
    }
  });

  it("income and transfer share no categories", () => {
    const incomeSet = new Set<string>(INCOME_CATEGORIES);
    for (const c of TRANSFER_CATEGORIES) {
      expect(incomeSet.has(c)).toBe(false);
    }
  });

  it("expense and transfer share no categories", () => {
    const expenseSet = new Set<string>(EXPENSE_CATEGORIES);
    for (const c of TRANSFER_CATEGORIES) {
      expect(expenseSet.has(c)).toBe(false);
    }
  });
});

describe("TransactionType", () => {
  it("compiles with the three valid values", () => {
    const types: TransactionType[] = ["income", "expense", "transfer"];
    expect(types).toHaveLength(3);
  });
});
