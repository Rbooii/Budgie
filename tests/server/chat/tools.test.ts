import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockServices } = vi.hoisted(() => ({
  mockServices: {
    listBalanceAccounts: vi.fn(),
    listBudgetsWithSpent: vi.fn(),
    listSubscriptions: vi.fn(),
    listTransactions: vi.fn(),
    createTransaction: vi.fn(),
    getFinancialInsights: vi.fn(),
  },
}));

vi.mock("@/server/services/balance-accounts", () => ({
  listBalanceAccounts: mockServices.listBalanceAccounts,
}));
vi.mock("@/server/services/budgets", () => ({
  listBudgetsWithSpent: mockServices.listBudgetsWithSpent,
}));
vi.mock("@/server/services/subscriptions", () => ({
  listSubscriptions: mockServices.listSubscriptions,
}));
vi.mock("@/server/services/transactions", () => ({
  listTransactions: mockServices.listTransactions,
  createTransaction: mockServices.createTransaction,
}));
vi.mock("@/server/services/insights", () => ({
  getFinancialInsights: mockServices.getFinancialInsights,
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
    name: string;
    amount: number;
    type: string;
    category: string;
    date: string;
    account: string | null;
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
    mockServices.listTransactions.mockResolvedValue([transaction]);
  });

  it("lists all transactions when no filters are given", async () => {
    const result = await run<TransactionsResult>(tools.get_transactions);

    expect(mockServices.listTransactions).toHaveBeenCalledWith(USER_ID);
    expect(result.count).toBe(1);
    expect(result.items[0]).toMatchObject({
      name: "Lunch",
      type: "expense",
      category: "FoodAndDrink",
      account: "Mandiri",
    });
  });

  it("filters by type", async () => {
    const result = await run<TransactionsResult>(tools.get_transactions, {
      type: "income",
    });
    expect(result.count).toBe(0);
  });

  it("filters by category", async () => {
    const result = await run<TransactionsResult>(tools.get_transactions, {
      category: "FoodAndDrink",
    });
    expect(result.count).toBe(1);
  });

  it("filters by keyword against name and category label", async () => {
    const byName = await run<TransactionsResult>(tools.get_transactions, {
      query: "lunch",
    });
    expect(byName.count).toBe(1);

    const byLabel = await run<TransactionsResult>(tools.get_transactions, {
      query: "food",
    });
    expect(byLabel.count).toBe(1);

    const noMatch = await run<TransactionsResult>(tools.get_transactions, {
      query: "zzz",
    });
    expect(noMatch.count).toBe(0);
  });

  it("filters by date range", async () => {
    const inRange = await run<TransactionsResult>(tools.get_transactions, {
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(inRange.count).toBe(1);

    const outOfRange = await run<TransactionsResult>(tools.get_transactions, {
      from: "2027-01-01",
      to: "2027-12-31",
    });
    expect(outOfRange.count).toBe(0);
  });

  it("caps the items list at the requested limit while keeping count", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      ...transaction,
      id: `tx-${i}`,
    }));
    mockServices.listTransactions.mockResolvedValue(many);

    const result = await run<TransactionsResult>(tools.get_transactions, {
      limit: 5,
    });
    expect(result.count).toBe(30);
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