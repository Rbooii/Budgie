import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TransactionRow } from "@/components/transaction-item";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("@/components/download-pdf-dialog", () => ({
  DownloadPdfDialog: () => <button data-testid="download-pdf">Download</button>,
}));

vi.mock("@/components/transaction-detail-sheet", () => ({
  TransactionDetailSheet: ({ transaction }: { transaction: TransactionRow | null }) =>
    transaction ? (
      <div data-testid="detail-sheet">{transaction.name}</div>
    ) : null,
}));

import { TransactionsView } from "@/components/transactions-view";

function makeTxn(overrides: Partial<TransactionRow> = {}): TransactionRow {
  return {
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
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TransactionsView — empty state", () => {
  it("shows 'No transactions yet' when the list is empty", () => {
    render(<TransactionsView transactions={[]} />);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("shows an Add transaction button in the empty state", () => {
    render(<TransactionsView transactions={[]} />);
    const addBtns = screen.getAllByRole("button", { name: /add transaction/i });
    expect(addBtns.length).toBeGreaterThan(0);
  });

  it("navigates to /transactions/add when the empty-state Add button is clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={[]} />);
    const addBtns = screen.getAllByRole("button", { name: /add transaction/i });
    await user.click(addBtns[0]);
    expect(pushMock).toHaveBeenCalledWith("/transactions/add");
  });
});

describe("TransactionsView — with transactions", () => {
  const txns: TransactionRow[] = [
    makeTxn({ id: "t1", name: "Salary", category: "Salary", type: "income", date: "2026-07-15T14:30:00" }),
    makeTxn({ id: "t2", name: "Groceries", category: "FoodAndDrink", type: "expense", date: "2026-07-15T09:00:00" }),
  ];

  it("renders all transactions", () => {
    render(<TransactionsView transactions={txns} />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<TransactionsView transactions={txns} />);
    expect(screen.getByPlaceholderText("Search transactions")).toBeInTheDocument();
  });

  it("renders the Add button and Download button", () => {
    render(<TransactionsView transactions={txns} />);
    expect(screen.getByText("Add")).toBeInTheDocument();
    expect(screen.getByTestId("download-pdf")).toBeInTheDocument();
  });
});

describe("TransactionsView — search filtering", () => {
  const txns: TransactionRow[] = [
    makeTxn({ id: "t1", name: "Salary", category: "Salary", type: "income" }),
    makeTxn({ id: "t2", name: "Groceries", category: "FoodAndDrink", type: "expense" }),
  ];

  it("filters transactions by name", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={txns} />);
    await user.type(screen.getByPlaceholderText("Search transactions"), "salary");
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
  });

  it("filters transactions by category", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={txns} />);
    await user.type(screen.getByPlaceholderText("Search transactions"), "food");
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
  });

  it("filters transactions by type", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={txns} />);
    await user.type(screen.getByPlaceholderText("Search transactions"), "expense");
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
  });

  it("shows 'No transactions found' when search has no matches", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={txns} />);
    await user.type(screen.getByPlaceholderText("Search transactions"), "xyz");
    expect(screen.getByText("No transactions found")).toBeInTheDocument();
  });

  it("shows the search keyword in the no-results message", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={txns} />);
    await user.type(screen.getByPlaceholderText("Search transactions"), "xyz");
    expect(screen.getByText(/xyz/)).toBeInTheDocument();
  });
});

describe("TransactionsView — Array.isArray guard", () => {
  it("does not crash when transactions is not an array (malformed prop)", () => {
    expect(() =>
      render(<TransactionsView transactions={null as unknown as TransactionRow[]} />),
    ).not.toThrow();
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("does not crash when transactions is an object", () => {
    expect(() =>
      render(
        <TransactionsView transactions={{ error: "bad" } as unknown as TransactionRow[]} />,
      ),
    ).not.toThrow();
  });
});

describe("TransactionsView — detail sheet interaction", () => {
  it("opens the detail sheet when a transaction item is clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsView transactions={[makeTxn()]} />);
    await user.click(screen.getByText("Salary"));
    await waitFor(() => {
      expect(screen.getByTestId("detail-sheet")).toBeInTheDocument();
    });
  });
});
