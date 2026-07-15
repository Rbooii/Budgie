import { describe, it, expect } from "vitest";
import { CreateBudgetSchema, UpdateBudgetSchema } from "@/server/schemas/budget";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

describe("CreateBudgetSchema", () => {
  it("accepts a valid budget with an expense category", () => {
    const parsed = CreateBudgetSchema.parse({
      title: "Groceries",
      amount: 500000,
      category: "Food & Drink",
    });
    expect(parsed.title).toBe("Groceries");
    expect(parsed.amount).toBe(500000);
    expect(parsed.category).toBe("Food & Drink");
  });

  it("rejects a non-expense category (e.g. Salary is income)", () => {
    expect(() =>
      CreateBudgetSchema.parse({ title: "Pay", amount: 100, category: "Salary" }),
    ).toThrow();
  });

  it("rejects an arbitrary category not in the enum", () => {
    expect(() =>
      CreateBudgetSchema.parse({ title: "X", amount: 1, category: "Hobbies" }),
    ).toThrow();
  });

  it("rejects missing title", () => {
    expect(() =>
      CreateBudgetSchema.parse({ amount: 1, category: "Rent" }),
    ).toThrow();
  });

  it("rejects missing amount", () => {
    expect(() =>
      CreateBudgetSchema.parse({ title: "Rent", category: "Rent" }),
    ).toThrow();
  });

  it("rejects missing category", () => {
    expect(() =>
      CreateBudgetSchema.parse({ title: "Rent", amount: 1 }),
    ).toThrow();
  });

  it("accepts every expense category", () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(() =>
        CreateBudgetSchema.parse({ title: "B", amount: 1, category }),
      ).not.toThrow();
    }
  });
});

describe("UpdateBudgetSchema", () => {
  it("accepts a full update payload", () => {
    const parsed = UpdateBudgetSchema.parse({
      title: "Updated",
      amount: 2000,
      category: "Rent",
    });
    expect(parsed.title).toBe("Updated");
    expect(parsed.amount).toBe(2000);
  });

  it("rejects a partial update (all fields required)", () => {
    expect(() =>
      UpdateBudgetSchema.parse({ title: "Only title" }),
    ).toThrow();
  });

  it("rejects a non-expense category on update", () => {
    expect(() =>
      UpdateBudgetSchema.parse({ title: "X", amount: 1, category: "Salary" }),
    ).toThrow();
  });

  it("rejects missing amount on update", () => {
    expect(() =>
      UpdateBudgetSchema.parse({ title: "X", category: "Rent" }),
    ).toThrow();
  });
});
