import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockServices } = vi.hoisted(() => ({
  mockServices: {
    listBalanceAccounts: vi.fn(),
    listBudgetsWithSpent: vi.fn(),
    createBudget: vi.fn(),
    getBudget: vi.fn(),
    updateBudget: vi.fn(),
    listSubscriptions: vi.fn(),
    createSubscription: vi.fn(),
    getSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    listTransactions: vi.fn(),
    createTransaction: vi.fn(),
    getFinancialInsights: vi.fn(),
    getFinancialOverview: vi.fn(),
    getCashflowTrend: vi.fn(),
    getSpendingBreakdown: vi.fn(),
    getNetWorthHistory: vi.fn(),
    getBudgetStatus: vi.fn(),
    getUpcomingBills: vi.fn(),
    getLargestTransactions: vi.fn(),
  },
}));

vi.mock("@/server/services/balance-accounts", () => ({
  listBalanceAccounts: mockServices.listBalanceAccounts,
}));
vi.mock("@/server/services/budgets", () => ({
  listBudgetsWithSpent: mockServices.listBudgetsWithSpent,
  createBudget: mockServices.createBudget,
  getBudget: mockServices.getBudget,
  updateBudget: mockServices.updateBudget,
}));
vi.mock("@/server/services/subscriptions", () => ({
  listSubscriptions: mockServices.listSubscriptions,
  createSubscription: mockServices.createSubscription,
  getSubscription: mockServices.getSubscription,
  updateSubscription: mockServices.updateSubscription,
}));
vi.mock("@/server/services/transactions", () => ({
  listTransactions: mockServices.listTransactions,
  createTransaction: mockServices.createTransaction,
}));
vi.mock("@/server/services/insights", () => ({
  getFinancialInsights: mockServices.getFinancialInsights,
}));
vi.mock("@/server/services/analytics", () => ({
  getFinancialOverview: mockServices.getFinancialOverview,
  getCashflowTrend: mockServices.getCashflowTrend,
  getSpendingBreakdown: mockServices.getSpendingBreakdown,
  getNetWorthHistory: mockServices.getNetWorthHistory,
  getBudgetStatus: mockServices.getBudgetStatus,
  getUpcomingBills: mockServices.getUpcomingBills,
  getLargestTransactions: mockServices.getLargestTransactions,
}));

import { createChatTools } from "@/server/chat/tools";

const USER_ID = "user-1";

type AnyTool = { execute: (input: unknown, options: unknown) => unknown };

async function run<O>(tool: unknown, input: Record<string, unknown> = {}) {
  const t = tool as AnyTool;
  return (await t.execute(input, {})) as O;
}

type AccountsResult = {
  totalBalance: number;
  currency: string;
  accounts: { id: string; name: string; type: string; balance: number }[];
};

type TransactionsResult = {
  count: number;
  items: {
    id: string;
    name: string;
    amount: number;
    type: string;
    category: string;
    date: string;
    adminFee: number;
    account: string | null;
    toAccount: string | null;
  }[];
};

type BudgetsResult = {
  budgets: {
    id: string;
    category: string;
    categoryLabel: string;
    amount: number;
    periodDays: number;
    spent: number;
  }[];
};

type SubscriptionsResult = {
  subscriptions: {
    id: string;
    name: string;
    amount: number;
    category: string;
    categoryLabel: string;
    periodDays: number;
    active: boolean;
    nextBillingDate: string;
  }[];
};

type InsightsResult = {
  netWorth: number;
  monthIncome: number;
  monthExpense: number;
  topCategories: { category: string; amount: number }[];
};

type CreateTransactionResult =
  | {
      ok: true;
      transaction: {
        id: string;
        name: string;
        amount: number;
        type: string;
        category: string;
        date: string;
        account: string | null;
      };
    }
  | { ok: false; error: string };

const account = {
  id: "acc-1",
  name: "Mandiri",
  balance: 1500000,
  currency: "IDR",
  type: "bank",
  userId: USER_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const transaction = {
  id: "tx-1",
  name: "Lunch",
  amount: 45000,
  type: "expense",
  category: "FoodAndDrink",
  adminFee: 0,
  date: new Date("2026-08-01T10:00:00Z"),
  userId: USER_ID,
  balanceAccountId: "acc-1",
  toBalanceAccountId: null,
  createdAt: new Date("2026-08-01"),
  updatedAt: new Date("2026-08-01"),
  balanceAccount: { id: "acc-1", name: "Mandiri", currency: "IDR" },
  toBalanceAccount: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("get_balance_accounts", () => {
  it("lists the user's accounts with total balance", async () => {
    mockServices.listBalanceAccounts.mockResolvedValue([account]);
    const tools = createChatTools(USER_ID);
    const result = await run<AccountsResult>(tools.get_balance_accounts);

    expect(mockServices.listBalanceAccounts).toHaveBeenCalledWith(USER_ID);
    expect(result).toEqual({
      totalBalance: 1500000,
      currency: "IDR",
      accounts: [{ id: "acc-1", name: "Mandiri", type: "bank", balance: 1500000 }],
    });
  });

  it("defaults currency to IDR when there are no accounts", async () => {
    mockServices.listBalanceAccounts.mockResolvedValue([]);
    const tools = createChatTools(USER_ID);
    const result = await run<AccountsResult>(tools.get_balance_accounts);
    expect(result).toEqual({ totalBalance: 0, currency: "IDR", accounts: [] });
  });
});

describe("get_transactions", () => {
  const tools = createChatTools(USER_ID);

  beforeEach(() => {
    mockServices.listTransactions.mockResolvedValue({
      items: [transaction],
      nextCursor: null,
    });
  });

  it("defaults to the newest 10 with no filters", async () => {
    const result = await run<TransactionsResult>(tools.get_transactions);

    // filtering + limiting are pushed into the query, not done in JS
    expect(mockServices.listTransactions).toHaveBeenCalledWith(USER_ID, {
      limit: 10,
      type: undefined,
      category: undefined,
      from: undefined,
      to: undefined,
      search: undefined,
    });
    expect(result.count).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: "tx-1",
      name: "Lunch",
      type: "expense",
      category: "FoodAndDrink",
      account: "Mandiri",
      adminFee: 0,
      toAccount: null,
    });
  });

  it("forwards the type filter to the query", async () => {
    await run<TransactionsResult>(tools.get_transactions, { type: "income" });
    expect(mockServices.listTransactions).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ type: "income" }),
    );
  });

  it("forwards the category filter to the query", async () => {
    await run<TransactionsResult>(tools.get_transactions, {
      category: "FoodAndDrink",
    });
    expect(mockServices.listTransactions).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ category: "FoodAndDrink" }),
    );
  });

  it("forwards the keyword as a server-side search", async () => {
    await run<TransactionsResult>(tools.get_transactions, { query: "lunch" });
    expect(mockServices.listTransactions).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ search: "lunch" }),
    );
  });

  it("forwards the date range with a full-day upper bound", async () => {
    await run<TransactionsResult>(tools.get_transactions, {
      from: "2026-08-01",
      to: "2026-08-31",
    });

    const options = mockServices.listTransactions.mock.calls.at(-1)?.[1];
    expect(options?.from).toEqual(new Date("2026-08-01T00:00:00"));
    expect(options?.to).toEqual(new Date("2026-08-31T23:59:59"));
  });

  it("forwards the requested limit", async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...transaction,
      id: `tx-${i}`,
    }));
    mockServices.listTransactions.mockResolvedValue({
      items: many,
      nextCursor: "tx-4",
    });

    const result = await run<TransactionsResult>(tools.get_transactions, {
      limit: 5,
    });

    expect(mockServices.listTransactions).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ limit: 5 }),
    );
    expect(result.count).toBe(5);
    expect(result.items).toHaveLength(5);
  });
});

describe("get_budgets", () => {
  it("maps budgets with spent amounts and labels", async () => {
    mockServices.listBudgetsWithSpent.mockResolvedValue([
      {
        id: "bud-1",
        category: "FoodAndDrink",
        categoryLabel: "FoodAndDrink",
        amount: 1000000,
        periodDays: 30,
        spent: 45000,
      },
    ]);
    const tools = createChatTools(USER_ID);
    const result = await run<BudgetsResult>(tools.get_budgets);

    expect(mockServices.listBudgetsWithSpent).toHaveBeenCalledWith(USER_ID);
    expect(result.budgets[0]).toMatchObject({
      id: "bud-1",
      category: "FoodAndDrink",
      categoryLabel: "Food & Drink",
      amount: 1000000,
      periodDays: 30,
      spent: 45000,
    });
  });
});

describe("get_subscriptions", () => {
  it("maps subscriptions with a next billing date", async () => {
    mockServices.listSubscriptions.mockResolvedValue([
      {
        id: "sub-1",
        name: "Netflix",
        amount: 149000,
        currency: "IDR",
        category: "Entertainment",
        periodDays: 30,
        startDate: new Date("2026-07-01"),
        active: true,
        userId: USER_ID,
        createdAt: new Date("2026-07-01"),
        updatedAt: new Date("2026-07-01"),
      },
    ]);
    const tools = createChatTools(USER_ID);
    const result = await run<SubscriptionsResult>(tools.get_subscriptions);

    expect(mockServices.listSubscriptions).toHaveBeenCalledWith(USER_ID);
    expect(result.subscriptions[0]).toMatchObject({
      name: "Netflix",
      amount: 149000,
      categoryLabel: "Entertainment",
      periodDays: 30,
      active: true,
    });
    expect(typeof result.subscriptions[0].nextBillingDate).toBe("string");
  });
});

describe("get_insights", () => {
  it("delegates to the insights service", async () => {
    mockServices.getFinancialInsights.mockResolvedValue({
      netWorth: 5000000,
      monthIncome: 3000000,
      monthExpense: 1200000,
      topCategories: [{ category: "FoodAndDrink", amount: 45000 }],
    });
    const tools = createChatTools(USER_ID);
    const result = await run<InsightsResult>(tools.get_insights);

    expect(mockServices.getFinancialInsights).toHaveBeenCalledWith(USER_ID);
    expect(result.netWorth).toBe(5000000);
  });
});

describe("create_transaction", () => {
  const validInput = {
    name: "Lunch at Warung",
    amount: 45000,
    type: "expense",
    category: "FoodAndDrink",
    balanceAccountId: "acc-1",
  };

  it("creates a transaction with defaults when date/adminFee are omitted", async () => {
    mockServices.createTransaction.mockResolvedValue({
      id: "tx-new",
      name: "Lunch at Warung",
      amount: 45000,
      type: "expense",
      category: "FoodAndDrink",
      date: new Date("2026-08-01T10:00:00Z"),
      balanceAccount: { id: "acc-1", name: "Mandiri", currency: "IDR" },
    });

    const tools = createChatTools(USER_ID);
    const result = await run<CreateTransactionResult>(
      tools.create_transaction,
      validInput,
    );

    expect(mockServices.createTransaction).toHaveBeenCalledTimes(1);
    const [calledUserId, body] = mockServices.createTransaction.mock.calls[0];
    expect(calledUserId).toBe(USER_ID);
    expect(body).toMatchObject({
      name: "Lunch at Warung",
      amount: 45000,
      type: "expense",
      category: "FoodAndDrink",
      balanceAccountId: "acc-1",
      adminFee: 0,
      toBalanceAccountId: null,
    });
    expect(body.date).toBeInstanceOf(Date);
    expect(result).toMatchObject({ ok: true });
  });

  it("forwards date and destination account for transfers", async () => {
    mockServices.createTransaction.mockResolvedValue({
      id: "tx-transfer",
      name: "Transfer",
      amount: 200000,
      type: "transfer",
      category: "AccountTransfer",
      date: new Date("2026-08-02T10:00:00Z"),
      balanceAccount: { id: "acc-1", name: "Mandiri", currency: "IDR" },
      toBalanceAccount: { id: "acc-2", name: "BCA", currency: "IDR" },
    });

    const tools = createChatTools(USER_ID);
    const result = await run<CreateTransactionResult>(tools.create_transaction, {
      name: "Transfer",
      amount: 200000,
      type: "transfer",
      category: "AccountTransfer",
      balanceAccountId: "acc-1",
      toBalanceAccountId: "acc-2",
      date: "2026-08-02",
      adminFee: 4000,
    });

    const body = mockServices.createTransaction.mock.calls[0][1];
    expect(body).toMatchObject({
      toBalanceAccountId: "acc-2",
      adminFee: 4000,
      date: new Date("2026-08-02"),
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("forwards adminFeeBearer for a transfer fee charged to the destination", async () => {
    mockServices.createTransaction.mockResolvedValue({
      id: "tx-transfer",
      name: "Transfer",
      amount: 200000,
      type: "transfer",
      category: "AccountTransfer",
      date: new Date("2026-08-02T10:00:00Z"),
      balanceAccount: { id: "acc-1", name: "Mandiri", currency: "IDR" },
      toBalanceAccount: { id: "acc-2", name: "BCA", currency: "IDR" },
    });

    const tools = createChatTools(USER_ID);
    await run<CreateTransactionResult>(tools.create_transaction, {
      name: "Transfer",
      amount: 200000,
      type: "transfer",
      category: "AccountTransfer",
      balanceAccountId: "acc-1",
      toBalanceAccountId: "acc-2",
      adminFee: 4000,
      adminFeeBearer: "destination",
    });

    const body = mockServices.createTransaction.mock.calls[0][1];
    expect(body).toMatchObject({ adminFeeBearer: "destination" });
  });

  it("returns ok:false when the service throws (insufficient balance)", async () => {
    mockServices.createTransaction.mockRejectedValue(new Error("Insufficient balance"));
    const tools = createChatTools(USER_ID);
    const result = await run<CreateTransactionResult>(
      tools.create_transaction,
      validInput,
    );

    expect(result).toEqual({ ok: false, error: "Insufficient balance" });
    expect(mockServices.createTransaction).toHaveBeenCalledTimes(1);
  });

  it("returns ok:false when the category does not match the type", async () => {
    const tools = createChatTools(USER_ID);
    const result = await run<CreateTransactionResult>(tools.create_transaction, {
      ...validInput,
      category: "Salary",
    });

    expect(mockServices.createTransaction).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false });
  });

  it("returns ok:false when a transfer is missing a distinct destination", async () => {
    const tools = createChatTools(USER_ID);
    const result = await run<CreateTransactionResult>(tools.create_transaction, {
      ...validInput,
      type: "transfer",
      category: "AccountTransfer",
      toBalanceAccountId: "acc-1",
    });

    expect(mockServices.createTransaction).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false });
  });

  it("returns ok:false when required fields are missing", async () => {
    const tools = createChatTools(USER_ID);
    const result = await run<CreateTransactionResult>(tools.create_transaction, {
      name: "X",
    });

    expect(mockServices.createTransaction).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false });
  });
});
describe("analytics tools", () => {
  it("get_financial_overview serializes upcoming bill dates", async () => {
    mockServices.getFinancialOverview.mockResolvedValue({
      asOf: "2026-08-18T00:00:00.000Z",
      currency: "IDR",
      netWorth: 5000000,
      accounts: [],
      month: {
        label: "August 2026",
        income: 3000000,
        expense: 1200000,
        transferFees: 0,
        net: 1800000,
        savingsRate: 60,
        transactionCount: 12,
      },
      budgets: { total: 1, overCount: 0, items: [] },
      upcoming: {
        withinDays: 30,
        total: 149000,
        items: [
          {
            id: "sub-1",
            name: "Netflix",
            amount: 149000,
            category: "Entertainment",
            categoryLabel: "Entertainment",
            periodDays: 30,
            period: "Monthly",
            nextBillingDate: new Date("2026-08-20T00:00:00Z"),
          },
        ],
      },
      topCategories: [],
      recent: [],
    });

    const tools = createChatTools(USER_ID);
    const result = await run<{
      upcoming: { items: { nextBillingDate: string }[] };
    }>(tools.get_financial_overview);

    expect(mockServices.getFinancialOverview).toHaveBeenCalledWith(USER_ID);
    expect(result.upcoming.items[0].nextBillingDate).toBe(
      "2026-08-20T00:00:00.000Z",
    );
  });

  it("get_cashflow_trend forwards the window", async () => {
    mockServices.getCashflowTrend.mockResolvedValue({
      currency: "IDR",
      months: [],
      totals: { income: 0, expense: 0, transferFees: 0, net: 0 },
      averageNet: 0,
      bestMonth: null,
      worstMonth: null,
    });
    const tools = createChatTools(USER_ID);
    await run(tools.get_cashflow_trend, { months: 3 });
    expect(mockServices.getCashflowTrend).toHaveBeenCalledWith(USER_ID, {
      months: 3,
    });
  });

  it("get_spending_breakdown parses date-only bounds", async () => {
    mockServices.getSpendingBreakdown.mockResolvedValue({
      currency: "IDR",
      groupBy: "category",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-31T23:59:59.000Z",
      total: 0,
      transactionCount: 0,
      items: [],
    });
    const tools = createChatTools(USER_ID);
    await run(tools.get_spending_breakdown, {
      from: "2026-08-01",
      to: "2026-08-31",
      groupBy: "category",
    });

    const options = mockServices.getSpendingBreakdown.mock.calls[0][1];
    expect(options.from).toEqual(new Date("2026-08-01T00:00:00"));
    expect(options.to).toEqual(new Date("2026-08-31T23:59:59"));
  });

  it("get_net_worth_history forwards the window", async () => {
    mockServices.getNetWorthHistory.mockResolvedValue({
      currency: "IDR",
      netWorth: 5000000,
      change: 100000,
      series: [],
    });
    const tools = createChatTools(USER_ID);
    await run(tools.get_net_worth_history, { months: 6 });
    expect(mockServices.getNetWorthHistory).toHaveBeenCalledWith(USER_ID, {
      months: 6,
    });
  });

  it("get_budget_status delegates", async () => {
    mockServices.getBudgetStatus.mockResolvedValue({
      currency: "IDR",
      budgets: [],
    });
    const tools = createChatTools(USER_ID);
    await run(tools.get_budget_status);
    expect(mockServices.getBudgetStatus).toHaveBeenCalledWith(USER_ID);
  });

  it("get_upcoming_bills serializes the next date", async () => {
    mockServices.getUpcomingBills.mockResolvedValue({
      currency: "IDR",
      withinDays: 14,
      total: 149000,
      items: [
        {
          id: "sub-1",
          name: "Netflix",
          amount: 149000,
          category: "Entertainment",
          categoryLabel: "Entertainment",
          period: "Monthly",
          nextBillingDate: new Date("2026-08-20T00:00:00Z"),
        },
      ],
    });
    const tools = createChatTools(USER_ID);
    const result = await run<{ items: { nextBillingDate: string }[] }>(
      tools.get_upcoming_bills,
      { days: 14 },
    );

    expect(mockServices.getUpcomingBills).toHaveBeenCalledWith(USER_ID, {
      days: 14,
    });
    expect(result.items[0].nextBillingDate).toBe("2026-08-20T00:00:00.000Z");
  });

  it("get_largest_transactions forwards filters and parses dates", async () => {
    mockServices.getLargestTransactions.mockResolvedValue({
      currency: "IDR",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-31T23:59:59.000Z",
      items: [],
    });
    const tools = createChatTools(USER_ID);
    await run(tools.get_largest_transactions, {
      type: "expense",
      from: "2026-08-01",
      to: "2026-08-31",
      limit: 5,
    });

    expect(mockServices.getLargestTransactions).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        type: "expense",
        limit: 5,
        from: new Date("2026-08-01T00:00:00"),
        to: new Date("2026-08-31T23:59:59"),
      }),
    );
  });
});

describe("budget and subscription write tools", () => {
  it("create_budget maps the row", async () => {
    mockServices.createBudget.mockResolvedValue({
      id: "bud-1",
      category: "FoodAndDrink",
      amount: 1000000,
      periodDays: 30,
      currency: "IDR",
    });
    const tools = createChatTools(USER_ID);
    const result = await run<{ ok: boolean; budget: { categoryLabel: string } }>(
      tools.create_budget,
      { category: "FoodAndDrink", amount: 1000000, periodDays: 30 },
    );

    expect(mockServices.createBudget).toHaveBeenCalledWith(USER_ID, {
      category: "FoodAndDrink",
      amount: 1000000,
      periodDays: 30,
    });
    expect(result.ok).toBe(true);
    expect(result.budget.categoryLabel).toBe("Food & Drink");
  });

  it("update_budget merges the existing category and period", async () => {
    mockServices.getBudget.mockResolvedValue({
      id: "bud-1",
      category: "FoodAndDrink",
      amount: 1000000,
      periodDays: 30,
      currency: "IDR",
    });
    mockServices.updateBudget.mockResolvedValue({
      id: "bud-1",
      category: "FoodAndDrink",
      amount: 1500000,
      periodDays: 30,
      currency: "IDR",
    });

    const tools = createChatTools(USER_ID);
    const result = await run<{ ok: boolean }>(tools.update_budget, {
      budgetId: "bud-1",
      amount: 1500000,
    });

    expect(mockServices.updateBudget).toHaveBeenCalledWith(USER_ID, "bud-1", {
      category: "FoodAndDrink",
      amount: 1500000,
      periodDays: 30,
    });
    expect(result.ok).toBe(true);
  });

  it("returns ok:false when a budget is missing", async () => {
    mockServices.getBudget.mockResolvedValue(null);
    const tools = createChatTools(USER_ID);
    const result = await run<{ ok: boolean; error: string }>(
      tools.update_budget,
      { budgetId: "missing", amount: 1000 },
    );

    expect(result).toEqual({ ok: false, error: "Budget not found" });
    expect(mockServices.updateBudget).not.toHaveBeenCalled();
  });

  it("create_subscription maps the row with a next billing date", async () => {
    mockServices.createSubscription.mockResolvedValue({
      id: "sub-1",
      name: "Netflix",
      amount: 149000,
      currency: "IDR",
      category: "Entertainment",
      periodDays: 30,
      startDate: new Date("2026-07-01"),
      active: true,
    });
    const tools = createChatTools(USER_ID);
    const result = await run<{
      ok: boolean;
      subscription: { nextBillingDate: string };
    }>(tools.create_subscription, {
      name: "Netflix",
      amount: 149000,
      category: "Entertainment",
      periodDays: 30,
      startDate: "2026-07-01",
    });

    expect(mockServices.createSubscription).toHaveBeenCalledWith(USER_ID, {
      name: "Netflix",
      amount: 149000,
      currency: "IDR",
      category: "Entertainment",
      periodDays: 30,
      startDate: new Date("2026-07-01T00:00:00"),
      active: true,
    });
    expect(typeof result.subscription.nextBillingDate).toBe("string");
  });

  it("update_subscription merges existing fields", async () => {
    mockServices.getSubscription.mockResolvedValue({
      id: "sub-1",
      name: "Netflix",
      amount: 149000,
      currency: "IDR",
      category: "Entertainment",
      periodDays: 30,
      startDate: new Date("2026-07-01"),
      active: true,
    });
    mockServices.updateSubscription.mockResolvedValue({
      id: "sub-1",
      name: "Netflix",
      amount: 179000,
      currency: "IDR",
      category: "Entertainment",
      periodDays: 30,
      startDate: new Date("2026-07-01"),
      active: true,
    });

    const tools = createChatTools(USER_ID);
    const result = await run<{ ok: boolean }>(tools.update_subscription, {
      subscriptionId: "sub-1",
      amount: 179000,
    });

    expect(mockServices.updateSubscription).toHaveBeenCalledWith(
      USER_ID,
      "sub-1",
      {
        name: "Netflix",
        amount: 179000,
        currency: "IDR",
        category: "Entertainment",
        periodDays: 30,
        startDate: new Date("2026-07-01"),
        active: true,
      },
    );
    expect(result.ok).toBe(true);
  });
});
