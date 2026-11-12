import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatToolResult } from "@/components/chat/chat-tool-result";

describe("ChatToolResult", () => {
  it("renders accounts with total balance and rows", () => {
    render(
      <ChatToolResult
        toolName="get_balance_accounts"
        output={{
          totalBalance: 1500000,
          currency: "IDR",
          accounts: [
            { id: "acc-1", name: "Mandiri", type: "bank", balance: 1000000 },
            { id: "acc-2", name: "Cash", type: "cash", balance: 500000 },
          ],
        }}
      />,
    );

    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Total balance")).toBeInTheDocument();
    expect(screen.getByText("Mandiri")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getAllByText(/^Rp /).length).toBeGreaterThan(0);
  });

  it("renders transactions with type colors and shows an empty state", () => {
    const { rerender } = render(
      <ChatToolResult
        toolName="get_transactions"
        output={{
          count: 2,
          items: [
            {
              id: "t1",
              name: "Lunch",
              amount: 45000,
              type: "expense",
              category: "FoodAndDrink",
              date: "2026-08-01T00:00:00.000Z",
              adminFee: 0,
              account: "Mandiri",
              toAccount: null,
            },
            {
              id: "t2",
              name: "Salary",
              amount: 5000000,
              type: "income",
              category: "Salary",
              date: "2026-08-02T00:00:00.000Z",
              adminFee: 0,
              account: "Mandiri",
              toAccount: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Mandiri • Food & Drink")).toBeInTheDocument();
    expect(screen.getByText("-Rp 45.000.00")).toBeInTheDocument();
    expect(screen.getByText("+Rp 5.000.000.00")).toBeInTheDocument();

    rerender(
      <ChatToolResult
        toolName="get_transactions"
        output={{ count: 0, items: [] }}
      />,
    );
    expect(screen.getByText("No transactions found.")).toBeInTheDocument();
  });

  it("caps the rendered transaction list at six with a summary", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      name: `Txn ${i}`,
      amount: 1000,
      type: "expense",
      category: "FoodAndDrink",
      date: "2026-08-01T00:00:00.000Z",
      adminFee: 0,
      account: null,
      toAccount: null,
    }));

    render(
      <ChatToolResult
        toolName="get_transactions"
        output={{ count: 10, items }}
      />,
    );

    expect(screen.getByText("+4 more")).toBeInTheDocument();
    expect(screen.queryByText("Txn 9")).not.toBeInTheDocument();
    expect(screen.queryByText("Txn 6")).not.toBeInTheDocument();
  });

  it("renders budgets with progress and an empty state", () => {
    const { rerender } = render(
      <ChatToolResult
        toolName="get_budgets"
        output={{
          budgets: [
            {
              id: "b1",
              category: "FoodAndDrink",
              categoryLabel: "Food & Drink",
              amount: 1000000,
              periodDays: 30,
              spent: 45000,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Budgets")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.000.000.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 955.000.00 left")).toBeInTheDocument();

    rerender(
      <ChatToolResult toolName="get_budgets" output={{ budgets: [] }} />,
    );
    expect(screen.getByText("No budgets yet.")).toBeInTheDocument();
  });

  it("renders subscriptions with next billing date", () => {
    render(
      <ChatToolResult
        toolName="get_subscriptions"
        output={{
          subscriptions: [
            {
              id: "s1",
              name: "Netflix",
              amount: 149000,
              category: "Entertainment",
              categoryLabel: "Entertainment",
              periodDays: 30,
              active: true,
              nextBillingDate: "2026-09-01T00:00:00.000Z",
            },
            {
              id: "s2",
              name: "Old",
              amount: 50000,
              category: "Utilities",
              categoryLabel: "Utilities",
              periodDays: 30,
              active: false,
              nextBillingDate: "2026-08-20T00:00:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getAllByText(/Next .*/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Entertainment · Monthly")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders insights with net worth, month totals and top categories", () => {
    render(
      <ChatToolResult
        toolName="get_insights"
        output={{
          netWorth: 5000000,
          monthIncome: 3000000,
          monthExpense: 1200000,
          topCategories: [{ category: "FoodAndDrink", amount: 45000 }],
        }}
      />,
    );

    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
  });

  it("renders a successful create_transaction result", () => {
    render(
      <ChatToolResult
        toolName="create_transaction"
        output={{
          ok: true,
          transaction: {
            id: "tx-new",
            name: "Lunch at Warung",
            amount: 45000,
            type: "expense",
            category: "FoodAndDrink",
            date: "2026-08-01T00:00:00.000Z",
            account: "Mandiri",
          },
        }}
      />,
    );

    expect(screen.getByText("Transaction")).toBeInTheDocument();
    expect(screen.getByText("Lunch at Warung")).toBeInTheDocument();
    expect(screen.getByText("-Rp 45.000.00")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink • Mandiri")).toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
  });

  it("renders a failed create_transaction result with the reason", () => {
    render(
      <ChatToolResult
        toolName="create_transaction"
        output={{ ok: false, error: "Insufficient balance" }}
      />,
    );

    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't add the transaction")).not.toBeInTheDocument();
  });

  it("returns null for unknown tools", () => {
    const { container } = render(
      <ChatToolResult toolName="mystery_tool" output={{}} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("ChatToolResult analytics widgets", () => {
  const overview = {
    asOf: "2026-08-18T00:00:00.000Z",
    currency: "IDR",
    netWorth: 5000000,
    accounts: [
      { id: "acc-1", name: "Mandiri", type: "bank", balance: 5000000 },
    ],
    month: {
      label: "August 2026",
      income: 3000000,
      expense: 1200000,
      transferFees: 0,
      net: 1800000,
      savingsRate: 60,
      transactionCount: 12,
    },
    budgets: { total: 2, overCount: 1, items: [] },
    upcoming: {
      withinDays: 30,
      total: 149000,
      items: [
        {
          id: "s1",
          name: "Netflix",
          amount: 149000,
          category: "Entertainment",
          categoryLabel: "Entertainment",
          period: "Monthly",
          nextBillingDate: "2026-08-20T00:00:00.000Z",
        },
      ],
    },
    topCategories: [
      {
        category: "FoodAndDrink",
        categoryLabel: "Food & Drink",
        amount: 450000,
        count: 8,
        share: 37.5,
      },
    ],
    recent: [],
  };

  it("renders the financial overview", () => {
    render(<ChatToolResult toolName="get_financial_overview" output={overview} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 5.000.000.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Mandiri")).toBeInTheDocument();
    expect(screen.getByText(/1 budget over/)).toBeInTheDocument();
    expect(screen.getByText(/bills over 30 days/)).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
  });

  it("renders the cashflow trend", () => {
    render(
      <ChatToolResult
        toolName="get_cashflow_trend"
        output={{
          currency: "IDR",
          months: [
            {
              month: "2026-07",
              label: "July 2026",
              income: 3000000,
              expense: 1000000,
              transferFees: 0,
              net: 2000000,
            },
            {
              month: "2026-08",
              label: "August 2026",
              income: 1000000,
              expense: 1500000,
              transferFees: 0,
              net: -500000,
            },
          ],
          totals: { income: 4000000, expense: 2500000, transferFees: 0, net: 1500000 },
          averageNet: 750000,
          bestMonth: "2026-07",
          worstMonth: "2026-08",
        }}
      />,
    );

    expect(screen.getByText("Cashflow")).toBeInTheDocument();
    expect(screen.getByText("July 2026")).toBeInTheDocument();
    expect(screen.getByText("+Rp 2.000.000.00")).toBeInTheDocument();
    expect(screen.getByText("-Rp 500.000.00")).toBeInTheDocument();
    expect(screen.getByText("+Rp 1.500.000.00")).toBeInTheDocument();
  });

  it("renders the spending breakdown", () => {
    render(
      <ChatToolResult
        toolName="get_spending_breakdown"
        output={{
          currency: "IDR",
          groupBy: "category",
          from: "2026-08-01T00:00:00.000Z",
          to: "2026-08-31T23:59:59.000Z",
          total: 450000,
          transactionCount: 8,
          items: [
            {
              key: "FoodAndDrink",
              label: "Food & Drink",
              amount: 450000,
              count: 8,
              share: 100,
              previousAmount: 300000,
              deltaPct: 50,
              budget: 1000000,
              budgetSpent: 450000,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Spending")).toBeInTheDocument();
    expect(screen.getAllByText("Food & Drink").length).toBeGreaterThan(0);
    expect(screen.getByText(/100% of spending, \+50% vs previous/)).toBeInTheDocument();
    expect(screen.getAllByText("Rp 450.000.00").length).toBeGreaterThan(0);
  });

  it("renders budget status with a pace projection", () => {
    render(
      <ChatToolResult
        toolName="get_budget_status"
        output={{
          currency: "IDR",
          budgets: [
            {
              id: "b1",
              category: "FoodAndDrink",
              categoryLabel: "Food & Drink",
              periodDays: 30,
              period: "Monthly",
              limit: 1000000,
              spent: 450000,
              remaining: 550000,
              over: false,
              spentPct: 45,
              daysElapsed: 10,
              projectedSpend: 1350000,
              projectedOver: true,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
    expect(screen.getByText(/Pace projects/)).toBeInTheDocument();
    expect(screen.getByText("Rp 550.000.00 left")).toBeInTheDocument();
  });

  it("renders upcoming bills", () => {
    render(
      <ChatToolResult
        toolName="get_upcoming_bills"
        output={{
          currency: "IDR",
          withinDays: 14,
          total: 149000,
          items: [
            {
              id: "s1",
              name: "Netflix",
              amount: 149000,
              category: "Entertainment",
              categoryLabel: "Entertainment",
              period: "Monthly",
              nextBillingDate: "2026-08-20T00:00:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Upcoming bills")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Total next 14 days")).toBeInTheDocument();
  });

  it("renders the largest transactions", () => {
    render(
      <ChatToolResult
        toolName="get_largest_transactions"
        output={{
          currency: "IDR",
          from: "2026-08-01T00:00:00.000Z",
          to: "2026-08-31T23:59:59.000Z",
          items: [
            {
              id: "t1",
              name: "Laptop",
              amount: 15000000,
              type: "expense",
              category: "Shopping",
              categoryLabel: "Shopping",
              date: "2026-08-02T00:00:00.000Z",
              adminFee: 0,
              account: "Mandiri",
              toAccount: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Largest transactions")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Mandiri, Shopping")).toBeInTheDocument();
  });

  it("renders budget and subscription write results", () => {
    const { rerender } = render(
      <ChatToolResult
        toolName="create_budget"
        output={{
          ok: true,
          budget: {
            id: "b1",
            category: "FoodAndDrink",
            categoryLabel: "Food & Drink",
            amount: 1000000,
            periodDays: 30,
            period: "Monthly",
          },
        }}
      />,
    );
    expect(screen.getByText("Budget saved")).toBeInTheDocument();
    expect(screen.getByText(/Food & Drink/)).toBeInTheDocument();

    rerender(
      <ChatToolResult
        toolName="create_subscription"
        output={{
          ok: true,
          subscription: {
            id: "s1",
            name: "Netflix",
            amount: 149000,
            category: "Entertainment",
            categoryLabel: "Entertainment",
            periodDays: 30,
            period: "Monthly",
            nextBillingDate: "2026-09-01T00:00:00.000Z",
          },
        }}
      />,
    );
    expect(screen.getByText("Subscription saved")).toBeInTheDocument();
    expect(screen.getByText(/Netflix/)).toBeInTheDocument();

    rerender(
      <ChatToolResult
        toolName="update_budget"
        output={{ ok: false, error: "Budget not found" }}
      />,
    );
    expect(screen.getByText("Budget not found")).toBeInTheDocument();
  });
});
