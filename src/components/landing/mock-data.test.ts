import { describe, it, expect } from "vitest";
import {
  MOCK_CASHFLOW,
  MOCK_GROWTH,
  MOCK_SPENDING_STREAMS,
  MOCK_SPENDING_BUDGETS,
  MOCK_TRANSACTIONS,
  MOCK_BUDGETS,
  MOCK_BUDGETS_SPENT,
  MOCK_ACCOUNTS,
  MOCK_LIVE_POOL,
} from "@/components/landing/mock-data";
import { ALL_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";

describe("MOCK_CASHFLOW", () => {
  it("has a title and a date", () => {
    expect(MOCK_CASHFLOW.title.length).toBeGreaterThan(0);
    expect(MOCK_CASHFLOW.date).toBe("December 2026");
  });

  it("has positive income and expense with income exceeding expense", () => {
    expect(MOCK_CASHFLOW.income).toBeGreaterThan(0);
    expect(MOCK_CASHFLOW.expense).toBeGreaterThan(0);
    expect(MOCK_CASHFLOW.income).toBeGreaterThan(MOCK_CASHFLOW.expense);
  });
});

describe("MOCK_GROWTH", () => {
  it("covers twelve months of data", () => {
    expect(MOCK_GROWTH.data).toHaveLength(12);
    expect(MOCK_GROWTH.activeMonths).toHaveLength(12);
  });

  it("has data for months 0..11 in ascending order", () => {
    MOCK_GROWTH.data.forEach((point, i) => {
      expect(point.month).toBe(i);
    });
  });

  it("has positive values", () => {
    for (const point of MOCK_GROWTH.data) {
      expect(point.value).toBeGreaterThan(0);
    }
  });

  it("matches the final data point with the current total", () => {
    const last = MOCK_GROWTH.data[MOCK_GROWTH.data.length - 1];
    expect(last.value).toBe(MOCK_GROWTH.currentTotal);
  });

  it("is set for the current year with a sensible starting value", () => {
    expect(MOCK_GROWTH.year).toBe(2026);
    expect(MOCK_GROWTH.startingValue).toBeGreaterThan(0);
    expect(MOCK_GROWTH.currentTotal).toBeGreaterThan(MOCK_GROWTH.startingValue);
    expect(MOCK_GROWTH.currentMonth).toBe(11);
  });
});

describe("MOCK_SPENDING_STREAMS / BUDGETS", () => {
  it("uses only expense categories for streams", () => {
    for (const s of MOCK_SPENDING_STREAMS) {
      expect(EXPENSE_CATEGORIES).toContain(s.category);
      expect(s.spent).toBeGreaterThan(0);
    }
  });

  it("has a budget entry for every spending stream", () => {
    const budgetCategories = new Set(
      MOCK_SPENDING_BUDGETS.map((b) => b.category),
    );
    for (const s of MOCK_SPENDING_STREAMS) {
      expect(budgetCategories.has(s.category)).toBe(true);
    }
  });

  it("keeps every stream within its budget (showcase stays calm)", () => {
    const budgetByCategory = new Map(
      MOCK_SPENDING_BUDGETS.map((b) => [b.category, b.amount]),
    );
    for (const s of MOCK_SPENDING_STREAMS) {
      expect(budgetByCategory.get(s.category)).toBeGreaterThanOrEqual(s.spent);
    }
  });
});

describe("MOCK_TRANSACTIONS", () => {
  it("has unique ids", () => {
    const ids = MOCK_TRANSACTIONS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses valid types and premade categories", () => {
    for (const t of MOCK_TRANSACTIONS) {
      expect(["income", "expense", "transfer"]).toContain(t.type);
      expect(ALL_CATEGORIES).toContain(t.category);
    }
  });

  it("links transfers to a destination account and singles to none", () => {
    for (const t of MOCK_TRANSACTIONS) {
      if (t.type === "transfer") {
        expect(t.toBalanceAccount).not.toBeNull();
        expect(t.toBalanceAccountId).not.toBeNull();
      } else {
        expect(t.toBalanceAccount).toBeNull();
        expect(t.toBalanceAccountId).toBeNull();
      }
    }
  });

  it("always names the source account", () => {
    for (const t of MOCK_TRANSACTIONS) {
      expect(t.balanceAccount).not.toBeNull();
      expect(t.balanceAccountId).not.toBeNull();
    }
  });

  it("uses positive amounts and non-negative admin fees", () => {
    for (const t of MOCK_TRANSACTIONS) {
      expect(t.amount).toBeGreaterThan(0);
      expect(t.adminFee).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("MOCK_BUDGETS / MOCK_BUDGETS_SPENT", () => {
  it("uses valid expense categories with positive amounts", () => {
    for (const b of MOCK_BUDGETS) {
      expect(EXPENSE_CATEGORIES).toContain(b.category);
      expect(b.amount).toBeGreaterThan(0);
      expect(b.periodDays).toBe(30);
    }
  });

  it("has a spent figure for every budget category", () => {
    const spentKeys = Object.keys(MOCK_BUDGETS_SPENT);
    for (const b of MOCK_BUDGETS) {
      expect(spentKeys).toContain(b.category);
    }
  });

  it("keeps every spent figure within its budget", () => {
    const budgetByCategory = new Map(
      MOCK_BUDGETS.map((b) => [b.category, b.amount]),
    );
    for (const [category, spent] of Object.entries(MOCK_BUDGETS_SPENT)) {
      expect(budgetByCategory.get(category)).toBeGreaterThanOrEqual(spent);
    }
  });
});

describe("MOCK_ACCOUNTS", () => {
  it("has three accounts with unique ids", () => {
    expect(MOCK_ACCOUNTS).toHaveLength(3);
    const ids = MOCK_ACCOUNTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has positive balances in IDR", () => {
    for (const a of MOCK_ACCOUNTS) {
      expect(a.balance).toBeGreaterThan(0);
      expect(a.currency).toBe("IDR");
    }
  });
});

describe("MOCK_LIVE_POOL", () => {
  it("has at least two transactions to rotate through", () => {
    expect(MOCK_LIVE_POOL.length).toBeGreaterThanOrEqual(2);
  });

  it("contains only valid transaction rows", () => {
    for (const t of MOCK_LIVE_POOL) {
      expect(ALL_CATEGORIES).toContain(t.category);
      expect(t.amount).toBeGreaterThan(0);
      expect(["income", "expense", "transfer"]).toContain(t.type);
    }
  });

  it("has unique ids", () => {
    const ids = MOCK_LIVE_POOL.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
