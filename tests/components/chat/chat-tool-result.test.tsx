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

    expect(screen.getByText("2 transactions")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
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

  it("caps the rendered transaction list at eight with a summary", () => {
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

    expect(screen.getByText("and 2 more")).toBeInTheDocument();
    expect(screen.queryByText("Txn 9")).not.toBeInTheDocument();
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
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.000.000.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 45.000.00 spent")).toBeInTheDocument();

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
    expect(screen.getByText("Entertainment · Monthly")).toBeInTheDocument();
    expect(screen.getAllByText(/Next .*/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Inactive/i)).toBeInTheDocument();
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
    expect(screen.getByText("Income this month")).toBeInTheDocument();
    expect(screen.getByText("Expenses this month")).toBeInTheDocument();
    expect(screen.getByText("Top categories")).toBeInTheDocument();
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

    expect(screen.getByText("Transaction added")).toBeInTheDocument();
    expect(screen.getByText("Lunch at Warung")).toBeInTheDocument();
    expect(screen.getByText("-Rp 45.000.00")).toBeInTheDocument();
  });

  it("renders a failed create_transaction result with the reason", () => {
    render(
      <ChatToolResult
        toolName="create_transaction"
        output={{ ok: false, error: "Insufficient balance" }}
      />,
    );

    expect(screen.getByText("Couldn't add the transaction")).toBeInTheDocument();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
  });

  it("returns null for unknown tools", () => {
    const { container } = render(
      <ChatToolResult toolName="mystery_tool" output={{}} />,
    );
    expect(container.firstChild).toBeNull();
  });
});