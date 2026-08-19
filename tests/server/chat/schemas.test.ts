import { describe, it, expect } from "vitest";
import {
  CreateTransactionToolSchema,
  GetTransactionsToolSchema,
} from "@/server/chat/schemas";

describe("GetTransactionsToolSchema", () => {
  it("accepts an empty object", () => {
    expect(GetTransactionsToolSchema.safeParse({}).success).toBe(true);
  });

  it("accepts all filters", () => {
    const parsed = GetTransactionsToolSchema.safeParse({
      type: "expense",
      category: "FoodAndDrink",
      query: "lunch",
      from: "2026-08-01",
      to: "2026-08-31",
      limit: 25,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    expect(
      GetTransactionsToolSchema.safeParse({ type: "withdrawal" }).success,
    ).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(
      GetTransactionsToolSchema.safeParse({ category: "Nope" }).success,
    ).toBe(false);
  });

  it("rejects a limit out of range", () => {
    expect(GetTransactionsToolSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(GetTransactionsToolSchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(GetTransactionsToolSchema.safeParse({ nope: 1 }).success).toBe(false);
  });
});

describe("CreateTransactionToolSchema", () => {
  const valid = {
    name: "Lunch",
    amount: 45000,
    type: "expense",
    category: "FoodAndDrink",
    balanceAccountId: "acc-1",
  };

  it("accepts a valid expense with defaults", () => {
    const parsed = CreateTransactionToolSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.adminFee).toBeUndefined();
      expect(parsed.data.date).toBeUndefined();
    }
  });

  it("accepts a valid transfer with a distinct destination", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-2",
      adminFee: 4000,
      date: "2026-08-02",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a transfer without a destination", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      type: "transfer",
      category: "AccountTransfer",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a transfer whose destination equals the source", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-1",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a category that does not match the type", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      category: "Salary",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(
      CreateTransactionToolSchema.safeParse({ ...valid, amount: 0 }).success,
    ).toBe(false);
  });

  it("rejects a negative admin fee", () => {
    expect(
      CreateTransactionToolSchema.safeParse({
        ...valid,
        type: "transfer",
        category: "AccountTransfer",
        toBalanceAccountId: "acc-2",
        adminFee: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects unknown keys", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      userId: "attacker",
    });
    expect(parsed.success).toBe(false);
  });
});