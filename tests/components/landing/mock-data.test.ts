import { describe, it, expect } from "vitest";
import {
  MOCK_SPENDING_STREAMS,
  MOCK_SPENDING_BUDGETS,
  MOCK_TRANSACTIONS,
  MOCK_LIVE_TRANSACTIONS,
  MOCK_LIVE_SPENDING_BASE,
  MOCK_LIVE_EXPENSE_EVENTS,
  MOCK_LIVE_SPENDING_BUDGETS,
} from "@/components/landing/mock-data";
import { ALL_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";

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

describe("MOCK_LIVE_TRANSACTIONS (capture feed)", () => {
  it("opens with the same three rows as the static pool (stable first frame)", () => {
    expect(MOCK_LIVE_TRANSACTIONS.slice(0, 3)).toEqual(
      MOCK_TRANSACTIONS.slice(0, 3),
    );
  });

  it("contains only valid transaction rows with unique ids", () => {
    const ids = MOCK_LIVE_TRANSACTIONS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of MOCK_LIVE_TRANSACTIONS) {
      expect(ALL_CATEGORIES).toContain(t.category);
      expect(t.amount).toBeGreaterThan(0);
      expect(["income", "expense", "transfer"]).toContain(t.type);
    }
  });
});

describe("MOCK_LIVE_SPENDING (automate preview)", () => {
  it("matches the base streams to their budgets by category", () => {
    const budgetCategories = new Set(
      MOCK_LIVE_SPENDING_BUDGETS.map((b) => b.category),
    );
    for (const s of MOCK_LIVE_SPENDING_BASE) {
      expect(budgetCategories.has(s.category)).toBe(true);
    }
  });

  it("uses only expense categories with positive event amounts", () => {
    for (const e of MOCK_LIVE_EXPENSE_EVENTS) {
      expect(EXPENSE_CATEGORIES).toContain(e.category);
      expect(e.amount).toBeGreaterThan(0);
    }
  });

  it("keeps every event within its category budget", () => {
    const budgetByCategory = new Map(
      MOCK_LIVE_SPENDING_BUDGETS.map((b) => [b.category, b.amount]),
    );
    for (const e of MOCK_LIVE_EXPENSE_EVENTS) {
      expect(budgetByCategory.get(e.category)).toBeGreaterThanOrEqual(e.amount);
    }
  });
});
