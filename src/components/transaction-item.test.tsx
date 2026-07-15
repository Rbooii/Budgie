import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionItem, type TransactionRow } from "@/components/transaction-item";

const baseTxn: TransactionRow = {
  id: "txn-1",
  name: "Salary",
  amount: 500000,
  type: "income",
  category: "Salary",
  date: "2026-07-15T14:30:00",
  adminFee: 0,
  balanceAccountId: "acc-1",
  toBalanceAccountId: null,
  balanceAccount: { id: "acc-1", name: "BCA", currency: "IDR" },
  toBalanceAccount: null,
};

describe("TransactionItem", () => {
  it("renders the transaction name", () => {
    render(<TransactionItem transaction={baseTxn} onClick={() => {}} />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
  });

  it("renders the account name and category in the subtitle", () => {
    render(<TransactionItem transaction={baseTxn} onClick={() => {}} />);
    expect(screen.getByText(/BCA/)).toBeInTheDocument();
    expect(screen.getAllByText(/Salary/).length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'Deleted account' when balanceAccount is null", () => {
    render(
      <TransactionItem
        transaction={{ ...baseTxn, balanceAccount: null }}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/Deleted account/)).toBeInTheDocument();
  });

  it("shows a + prefix for income amounts", () => {
    render(<TransactionItem transaction={baseTxn} onClick={() => {}} />);
    expect(screen.getByText(/\+/)).toBeInTheDocument();
  });

  it("shows a - prefix for expense amounts", () => {
    render(
      <TransactionItem
        transaction={{ ...baseTxn, type: "expense", amount: 200 }}
        onClick={() => {}}
      />,
    );
    const amountEl = screen.getByText(/Rp/);
    expect(amountEl.textContent).toContain("-");
  });

  it("shows no sign prefix for transfer amounts", () => {
    render(
      <TransactionItem
        transaction={{
          ...baseTxn,
          type: "transfer",
          amount: 1000,
          toBalanceAccountId: "acc-2",
          toBalanceAccount: { id: "acc-2", name: "GoPay", currency: "IDR" },
        }}
        onClick={() => {}}
      />,
    );
    const amounts = screen.getAllByText(/Rp/);
    const amountText = amounts.find((el) => el.className.includes("tabular-nums"));
    expect(amountText?.textContent).not.toContain("+");
    expect(amountText?.textContent).not.toMatch(/^-/);
  });

  it("shows 'A → B' subtitle for transfers with both accounts", () => {
    render(
      <TransactionItem
        transaction={{
          ...baseTxn,
          type: "transfer",
          toBalanceAccountId: "acc-2",
          toBalanceAccount: { id: "acc-2", name: "GoPay", currency: "IDR" },
        }}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/BCA.*GoPay/)).toBeInTheDocument();
  });

  it("shows '—' subtitle for transfers with a missing account", () => {
    render(
      <TransactionItem
        transaction={{
          ...baseTxn,
          type: "transfer",
          balanceAccount: null,
          toBalanceAccountId: null,
          toBalanceAccount: null,
        }}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it("fires onClick with the transaction when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TransactionItem transaction={baseTxn} onClick={onClick} />);
    await user.click(screen.getByText("Salary"));
    expect(onClick).toHaveBeenCalledWith(baseTxn);
  });

  it("renders a button element", () => {
    const { container } = render(
      <TransactionItem transaction={baseTxn} onClick={() => {}} />,
    );
    expect(container.querySelector("button")).not.toBeNull();
  });
});
