import { describe, it, expect } from "vitest";
import { CreateBudgetSchema, UpdateBudgetSchema } from "@/server/schemas/budget";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

describe("CreateBudgetSchema", () => {
  it("accepts a valid budget with an expense category", () => {
    const parsed = CreateBudgetSchema.parse({
      amount: 500000,
      category: "FoodAndDrink",
      periodDays: 30,
    });
    expect(parsed.amount).toBe(500000);
    expect(parsed.category).toBe("FoodAndDrink");
    expect(parsed.periodDays).toBe(30);
  });

  it("rejects a non-expense category (e.g. Salary is income)", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 100, category: "Salary", periodDays: 30 }),
    ).toThrow();
  });

  it("rejects an arbitrary category not in the enum", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, category: "Hobbies", periodDays: 30 }),
    ).toThrow();
  });

  it("rejects missing amount", () => {
    expect(() =>
      CreateBudgetSchema.parse({ category: "Rent", periodDays: 30 }),
    ).toThrow();
  });

  it("rejects missing category", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, periodDays: 30 }),
    ).toThrow();
  });

  it("rejects missing periodDays", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, category: "Rent" }),
    ).toThrow();
  });

  it("rejects non-positive amount", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 0, category: "Rent", periodDays: 30 }),
    ).toThrow();
    expect(() =>
      CreateBudgetSchema.parse({ amount: -5, category: "Rent", periodDays: 30 }),
    ).toThrow();
  });

  it("rejects non-positive periodDays", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, category: "Rent", periodDays: 0 }),
    ).toThrow();
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, category: "Rent", periodDays: -1 }),
    ).toThrow();
  });

  it("rejects non-integer periodDays", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, category: "Rent", periodDays: 1.5 }),
    ).toThrow();
  });

  it("accepts every expense category", () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(() =>
        CreateBudgetSchema.parse({ amount: 1, category, periodDays: 7 }),
      ).not.toThrow();
    }
  });
});

describe("UpdateBudgetSchema", () => {
  it("accepts a full update payload", () => {
    const parsed = UpdateBudgetSchema.parse({
      amount: 2000,
      category: "Rent",
      periodDays: 14,
    });
    expect(parsed.amount).toBe(2000);
    expect(parsed.periodDays).toBe(14);
  });

  it("rejects a non-expense category on update", () => {
    expect(() =>
      UpdateBudgetSchema.parse({ amount: 1, category: "Salary", periodDays: 30 }),
    ).toThrow();
  });

  it("rejects missing amount on update", () => {
    expect(() =>
      UpdateBudgetSchema.parse({ category: "Rent", periodDays: 30 }),
    ).toThrow();
  });

  it("rejects missing periodDays on update", () => {
    expect(() =>
      UpdateBudgetSchema.parse({ amount: 1, category: "Rent" }),
    ).toThrow();
  });
});
