import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BudgetRow } from "@/components/budgets-list";
import { BudgetDetailSheet } from "@/components/budget-detail-sheet";

const deleteMock = vi.fn();
const refreshMock = vi.fn();
const onCloseMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    budgets: {
      ":id": {
        $delete: (...args: unknown[]) => deleteMock(...args),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const budget: BudgetRow = {
  id: "bud-1",
  category: "Rent",
  amount: 2000000,
  currency: "IDR",
  periodDays: 30,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function okResponse(): Response {
  return new Response(null, { status: 204 });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteMock.mockResolvedValue(okResponse());
});

describe("BudgetDetailSheet — null state", () => {
  it("renders nothing when no budget is selected", () => {
    render(<BudgetDetailSheet budget={null} spent={0} onClose={onCloseMock} />);
    expect(screen.queryByText("Budget limit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete budget")).not.toBeInTheDocument();
  });
});

describe("BudgetDetailSheet — display", () => {
  it("renders the category, limit, spent and period", () => {
    render(<BudgetDetailSheet budget={budget} spent={400000} onClose={onCloseMock} />);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Budget limit")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 2.000.000.00")).not.toHaveLength(0);
    expect(screen.getByText("Rp 400.000.00 spent · Monthly")).toBeInTheDocument();
  });

  it("shows detail rows for Period, Limit, Spent and Remaining", () => {
    render(<BudgetDetailSheet budget={budget} spent={400000} onClose={onCloseMock} />);
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("Limit")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
  });

  it("computes the remaining amount", () => {
    render(<BudgetDetailSheet budget={budget} spent={400000} onClose={onCloseMock} />);
    expect(screen.getByText("Rp 1.600.000.00")).toBeInTheDocument();
  });

  it("shows Rp 0.00 remaining when over budget", () => {
    render(<BudgetDetailSheet budget={budget} spent={2500000} onClose={onCloseMock} />);
    expect(screen.getAllByText("Rp 0.00")).not.toHaveLength(0);
  });

  it("renders the progress bar at the capped percentage", () => {
    const { container } = render(
      <BudgetDetailSheet budget={budget} spent={1000000} onClose={onCloseMock} />,
    );
    const bar = container.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("50%");
  });

  it("colors the progress bar red when over budget", () => {
    const { container } = render(
      <BudgetDetailSheet budget={budget} spent={2500000} onClose={onCloseMock} />,
    );
    const bar = container.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.className).toContain("bg-[#D8000C]");
    expect(bar.style.width).toBe("100%");
  });
});

describe("BudgetDetailSheet — close behavior", () => {
  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(document.querySelector(".fixed.inset-0") as HTMLElement);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

describe("BudgetDetailSheet — delete flow", () => {
  it("opens the confirm dialog, deletes via the API and refreshes", async () => {
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByText("Delete budget"));
    expect(screen.getByText("Delete budget?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith({ param: { id: "bud-1" } });
      expect(onCloseMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("cancelling the confirm dialog does not call the API", async () => {
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete budget?")).not.toBeInTheDocument();
  });

  it("shows the API error message when deletion fails", async () => {
    deleteMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    deleteMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText("Failed to delete budget"),
    ).toBeInTheDocument();
  });

  it("disables the dialog buttons while the delete is in flight", async () => {
    let resolveDelete!: (r: Response) => void;
    deleteMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    resolveDelete(okResponse());
    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it("renders a non-Error rejection as a generic message", async () => {
    deleteMock.mockRejectedValue("network down");
    const user = userEvent.setup();
    render(<BudgetDetailSheet budget={budget} spent={0} onClose={onCloseMock} />);
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });
});
