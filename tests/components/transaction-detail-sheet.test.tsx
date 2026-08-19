import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TransactionRow } from "@/components/transaction-item";

const deleteMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    transactions: {
      ":id": {
        $delete: (...args: unknown[]) => deleteMock(...args),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

import { TransactionDetailSheet } from "@/components/transaction-detail-sheet";

const incomeTxn: TransactionRow = {
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

function okResponse(): Response {
  return new Response(null, { status: 204 });
}

function errorResponse(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteMock.mockResolvedValue(okResponse());
});

describe("TransactionDetailSheet", () => {
  it("renders nothing when transaction is null", () => {
    const { container } = render(
      <TransactionDetailSheet transaction={null} onClose={() => {}} />,
    );
    expect(container.querySelector(".fixed.inset-0")).toBeNull();
  });

  it("renders the transaction name and amount when provided", () => {
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />);
    expect(screen.getAllByText("Salary").length).toBeGreaterThan(0);
    expect(screen.getByText(/Rp.*500\.000/)).toBeInTheDocument();
  });

  it("renders the type pill with capitalized type", () => {
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />);
    expect(screen.getByText("income")).toBeInTheDocument();
  });

  it("renders detail rows (Bank, Category, Date, Time)", () => {
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />);
    expect(screen.getByText("Bank")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("shows the bank account name for non-transfer", () => {
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />);
    expect(screen.getByText("BCA")).toBeInTheDocument();
  });

  it("shows 'Deleted account' when balanceAccount is null", () => {
    render(
      <TransactionDetailSheet
        transaction={{ ...incomeTxn, balanceAccount: null }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Deleted account")).toBeInTheDocument();
  });

  it("shows admin fee for transfers with adminFee > 0", () => {
    render(
      <TransactionDetailSheet
        transaction={{
          ...incomeTxn,
          type: "transfer",
          amount: 100000,
          adminFee: 5000,
          toBalanceAccountId: "acc-2",
          toBalanceAccount: { id: "acc-2", name: "GoPay", currency: "IDR" },
        }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Admin fee/)).toBeInTheDocument();
  });

  it("does not show admin fee for transfers with adminFee = 0", () => {
    render(
      <TransactionDetailSheet
        transaction={{
          ...incomeTxn,
          type: "transfer",
          amount: 100000,
          adminFee: 0,
          toBalanceAccountId: "acc-2",
          toBalanceAccount: { id: "acc-2", name: "GoPay", currency: "IDR" },
        }}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByText(/Admin fee/)).not.toBeInTheDocument();
  });

  it("renders a 'Delete transaction' button", () => {
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />);
    expect(screen.getByText("Delete transaction")).toBeInTheDocument();
  });

  it("opens a confirm dialog when Delete transaction is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />,
    );
    await user.click(screen.getByText("Delete transaction"));
    await waitFor(() => {
      expect(screen.getByText("Delete transaction?")).toBeInTheDocument();
    });
  });

  it("calls api.$delete and router.refresh on confirm", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={onClose} />);
    await user.click(screen.getByText("Delete transaction"));
    await waitFor(() => screen.getByText("Delete transaction?"));
    const confirmBtns = screen.getAllByRole("button", { name: /^delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith({ param: { id: "txn-1" } }));
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });

  it("shows an error when delete fails", async () => {
    deleteMock.mockResolvedValue(errorResponse("Insufficient balance"));
    const user = userEvent.setup();
    render(<TransactionDetailSheet transaction={incomeTxn} onClose={() => {}} />);
    await user.click(screen.getByText("Delete transaction"));
    await waitFor(() => screen.getByText("Delete transaction?"));
    const confirmBtns = screen.getAllByRole("button", { name: /^delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
    });
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <TransactionDetailSheet transaction={incomeTxn} onClose={onClose} />,
    );
    const backdrop = container.querySelector(".fixed.inset-0") as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
