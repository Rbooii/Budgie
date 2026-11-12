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

  it("accepts a destination-bearer transfer fee", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-2",
      amount: 100000,
      adminFee: 4000,
      adminFeeBearer: "destination",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a destination-bearer fee larger than the amount", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-2",
      amount: 1000,
      adminFee: 4000,
      adminFeeBearer: "destination",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown admin fee bearer", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      adminFeeBearer: "bank",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown keys", () => {
    const parsed = CreateTransactionToolSchema.safeParse({
      ...valid,
      userId: "attacker",
    });
    expect(parsed.success).toBe(false);
  });
});
describe("analytics tool schemas", () => {
  it("bounds the cashflow trend window", async () => {
    const {
      GetCashflowTrendToolSchema,
      GetNetWorthHistoryToolSchema,
      GetUpcomingBillsToolSchema,
    } = await import("@/server/chat/schemas");

    expect(GetCashflowTrendToolSchema.safeParse({}).success).toBe(true);
    expect(GetCashflowTrendToolSchema.safeParse({ months: 6 }).success).toBe(true);
    expect(GetCashflowTrendToolSchema.safeParse({ months: 13 }).success).toBe(false);
    expect(GetNetWorthHistoryToolSchema.safeParse({ months: 12 }).success).toBe(true);
    expect(GetNetWorthHistoryToolSchema.safeParse({ months: 0 }).success).toBe(false);
    expect(GetUpcomingBillsToolSchema.safeParse({ days: 30 }).success).toBe(true);
    expect(GetUpcomingBillsToolSchema.safeParse({ days: 91 }).success).toBe(false);
  });

  it("accepts a spending breakdown range", async () => {
    const { GetSpendingBreakdownToolSchema } = await import(
      "@/server/chat/schemas"
    );

    expect(
      GetSpendingBreakdownToolSchema.safeParse({
        from: "2026-08-01",
        to: "2026-08-31",
        groupBy: "merchant",
        limit: 10,
      }).success,
    ).toBe(true);
    expect(
      GetSpendingBreakdownToolSchema.safeParse({ groupBy: "store" }).success,
    ).toBe(false);
  });

  it("requires at least one field to update a budget", async () => {
    const { UpdateBudgetToolSchema } = await import("@/server/chat/schemas");

    expect(
      UpdateBudgetToolSchema.safeParse({ budgetId: "b1", amount: 1000 }).success,
    ).toBe(true);
    expect(
      UpdateBudgetToolSchema.safeParse({ budgetId: "b1" }).success,
    ).toBe(false);
  });

  it("restricts budgets and subscriptions to expense categories", async () => {
    const { CreateBudgetToolSchema, CreateSubscriptionToolSchema } =
      await import("@/server/chat/schemas");

    expect(
      CreateBudgetToolSchema.safeParse({
        category: "FoodAndDrink",
        amount: 1000000,
        periodDays: 30,
      }).success,
    ).toBe(true);
    expect(
      CreateBudgetToolSchema.safeParse({
        category: "Salary",
        amount: 1000000,
        periodDays: 30,
      }).success,
    ).toBe(false);
    expect(
      CreateSubscriptionToolSchema.safeParse({
        name: "Netflix",
        amount: 149000,
        category: "Entertainment",
        periodDays: 30,
      }).success,
    ).toBe(true);
  });

  it("requires at least one field to update a subscription", async () => {
    const { UpdateSubscriptionToolSchema } = await import(
      "@/server/chat/schemas"
    );

    expect(
      UpdateSubscriptionToolSchema.safeParse({
        subscriptionId: "s1",
        amount: 2000,
      }).success,
    ).toBe(true);
    expect(
      UpdateSubscriptionToolSchema.safeParse({ subscriptionId: "s1" }).success,
    ).toBe(false);
  });
});
