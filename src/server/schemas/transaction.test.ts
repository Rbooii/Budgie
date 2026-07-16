import { describe, it, expect } from "vitest";
import { CreateTransactionSchema } from "@/server/schemas/transaction";
import { CATEGORIES_BY_TYPE } from "@/lib/categories";

const validBase = {
  name: "Grocery shopping",
  amount: 50000,
  type: "expense" as const,
  category: "FoodAndDrink",
  date: "2026-07-15T10:30:00.000Z",
  adminFee: 0,
  balanceAccountId: "acc-1",
  toBalanceAccountId: null,
};

describe("CreateTransactionSchema — valid cases", () => {
  it("accepts a valid income transaction", () => {
    const parsed = CreateTransactionSchema.parse({
      ...validBase,
      type: "income",
      category: "Salary",
    });
    expect(parsed.type).toBe("income");
    expect(parsed.category).toBe("Salary");
  });

  it("accepts a valid expense transaction", () => {
    const parsed = CreateTransactionSchema.parse({ ...validBase });
    expect(parsed.type).toBe("expense");
  });

  it("accepts a valid transfer with distinct source and destination", () => {
    const parsed = CreateTransactionSchema.parse({
      ...validBase,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-2",
    });
    expect(parsed.type).toBe("transfer");
    expect(parsed.toBalanceAccountId).toBe("acc-2");
  });
});

describe("CreateTransactionSchema — type enum", () => {
  it("rejects a type outside the enum", () => {
    expect(() =>
      CreateTransactionSchema.parse({ ...validBase, type: "refund" }),
    ).toThrow();
  });

  it("rejects a missing type", () => {
    expect(() => {
      const { type: _omit, ...rest } = validBase;
      CreateTransactionSchema.parse(rest);
    }).toThrow();
  });
});

describe("CreateTransactionSchema — category enum", () => {
  it("rejects a category not in ALL_CATEGORIES", () => {
    expect(() =>
      CreateTransactionSchema.parse({ ...validBase, category: "Hobbies" }),
    ).toThrow();
  });

  it("rejects a missing category", () => {
    expect(() => {
      const { category: _omit, ...rest } = validBase;
      CreateTransactionSchema.parse(rest);
    }).toThrow();
  });
});

describe("CreateTransactionSchema — transfer refine", () => {
  it("rejects a transfer without a destination account", () => {
    expect(() =>
      CreateTransactionSchema.parse({
        ...validBase,
        type: "transfer",
        category: "AccountTransfer",
        toBalanceAccountId: null,
      }),
    ).toThrow();
  });

  it("rejects a transfer where source equals destination", () => {
    expect(() =>
      CreateTransactionSchema.parse({
        ...validBase,
        type: "transfer",
        category: "AccountTransfer",
        toBalanceAccountId: "acc-1",
      }),
    ).toThrow();
  });

  it("does not require toBalanceAccountId for non-transfer types", () => {
    expect(() =>
      CreateTransactionSchema.parse({
        ...validBase,
        type: "expense",
        toBalanceAccountId: null,
      }),
    ).not.toThrow();
  });
});

describe("CreateTransactionSchema — per-type category refine", () => {
  it("rejects an income category paired with expense type", () => {
    expect(() =>
      CreateTransactionSchema.parse({ ...validBase, type: "expense", category: "Salary" }),
    ).toThrow();
  });

  it("rejects an expense category paired with income type", () => {
    expect(() =>
      CreateTransactionSchema.parse({
        ...validBase,
        type: "income",
        category: "FoodAndDrink",
      }),
    ).toThrow();
  });

  it("rejects a transfer category paired with income type", () => {
    expect(() =>
      CreateTransactionSchema.parse({
        ...validBase,
        type: "income",
        category: "AccountTransfer",
      }),
    ).toThrow();
  });

  it("accepts every category for its matching type", () => {
    for (const [type, cats] of Object.entries(CATEGORIES_BY_TYPE)) {
      for (const category of cats) {
        const payload = {
          ...validBase,
          type: type as "income" | "expense" | "transfer",
          category,
          toBalanceAccountId:
            type === "transfer" ? "acc-2" : null,
        };
        expect(() => CreateTransactionSchema.parse(payload)).not.toThrow();
      }
    }
  });
});

describe("CreateTransactionSchema — date coercion", () => {
  it("coerces an ISO string into a Date", () => {
    const parsed = CreateTransactionSchema.parse({ ...validBase });
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("accepts a Date instance", () => {
    const parsed = CreateTransactionSchema.parse({
      ...validBase,
      date: new Date("2026-01-01T00:00:00Z"),
    });
    expect(parsed.date).toBeInstanceOf(Date);
  });
});

describe("CreateTransactionSchema — adminFee", () => {
  it("defaults adminFee to 0 when omitted", () => {
    const { adminFee: _omit, ...rest } = validBase;
    const parsed = CreateTransactionSchema.parse(rest);
    expect(parsed.adminFee).toBe(0);
  });

  it("rejects a negative adminFee", () => {
    expect(() =>
      CreateTransactionSchema.parse({ ...validBase, adminFee: -1 }),
    ).toThrow();
  });

  it("accepts a positive adminFee", () => {
    const parsed = CreateTransactionSchema.parse({
      ...validBase,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-2",
      adminFee: 2500,
    });
    expect(parsed.adminFee).toBe(2500);
  });
});

describe("CreateTransactionSchema — balanceAccountId", () => {
  it("rejects an empty balanceAccountId", () => {
    expect(() =>
      CreateTransactionSchema.parse({ ...validBase, balanceAccountId: "" }),
    ).toThrow();
  });

  it("rejects a missing balanceAccountId", () => {
    expect(() => {
      const { balanceAccountId: _omit, ...rest } = validBase;
      CreateTransactionSchema.parse(rest);
    }).toThrow();
  });
});

describe("CreateTransactionSchema — name", () => {
  it("rejects an empty name", () => {
    expect(() =>
      CreateTransactionSchema.parse({ ...validBase, name: "" }),
    ).toThrow();
  });
});
