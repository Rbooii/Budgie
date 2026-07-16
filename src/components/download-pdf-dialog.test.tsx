import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TransactionRow } from "@/components/transaction-item";

const { saveMock, autoTableMock } = vi.hoisted(() => ({
  saveMock: vi.fn(),
  autoTableMock: vi.fn(),
}));

vi.mock("jspdf", () => ({
  jsPDF: class MockJsPDF {
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = vi.fn();
    save = saveMock;
    lastAutoTable = { finalY: 100 };
  },
}));

vi.mock("jspdf-autotable", () => ({
  default: autoTableMock,
}));

import { DownloadPdfDialog } from "@/components/download-pdf-dialog";

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

const sampleTxns: TransactionRow[] = [
  makeTxn({ id: "t1", name: "Salary", amount: 500000, type: "income", category: "Salary" }),
  makeTxn({ id: "t2", name: "Groceries", amount: 200000, type: "expense", category: "FoodAndDrink" }),
  makeTxn({
    id: "t3",
    name: "Transfer",
    amount: 100000,
    type: "transfer",
    category: "AccountTransfer",
    toBalanceAccountId: "acc-2",
    toBalanceAccount: { id: "acc-2", name: "GoPay", currency: "IDR" },
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

async function openDialog() {
  const user = userEvent.setup();
  const { container } = render(
    <DownloadPdfDialog allTransactions={sampleTxns} filteredTransactions={sampleTxns} />,
  );
  await user.click(screen.getByRole("button", { name: /download/i }));
  await waitFor(() => {
    expect(container.querySelector(".fixed.inset-0")).not.toBeNull();
  });
  return { user, container };
}

describe("DownloadPdfDialog", () => {
  it("renders the Download trigger button", () => {
    render(<DownloadPdfDialog allTransactions={[]} filteredTransactions={[]} />);
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });

  it("opens the dialog when Download is clicked", async () => {
    const { container } = await openDialog();
    expect(screen.getByRole("heading", { name: "Download PDF" })).toBeInTheDocument();
  });

  it("shows three scope options (All, Filtered, Date range)", async () => {
    await openDialog();
    expect(screen.getByText("All transactions")).toBeInTheDocument();
    expect(screen.getByText("Filtered by search")).toBeInTheDocument();
    expect(screen.getByText("Date range")).toBeInTheDocument();
  });

  it("shows date range inputs when 'Date range' is selected", async () => {
    const { user } = await openDialog();
    await user.click(screen.getByText("Date range"));
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
  });

  it("calls jsPDF and saves the PDF when Download PDF is clicked", async () => {
    const { user } = await openDialog();
    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
  });

  it("closes the dialog when Cancel is clicked", async () => {
    const { user, container } = await openDialog();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(container.querySelector(".fixed.inset-0")).toBeNull();
    });
  });

  it("guards against non-array allTransactions prop", async () => {
    expect(() =>
      render(
        <DownloadPdfDialog
          allTransactions={null as unknown as TransactionRow[]}
          filteredTransactions={[]}
        />,
      ),
    ).not.toThrow();
  });
});
