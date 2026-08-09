import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BudgetRow } from "@/components/budgets-list";

const deleteMock = vi.fn();
const refreshMock = vi.fn();

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

import { BudgetsList } from "@/components/budgets-list";

const budget: BudgetRow = {
  id: "bud-1",
  category: "FoodAndDrink",
  amount: 500000,
  currency: "IDR",
  periodDays: 30,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const overBudget: BudgetRow = {
  ...budget,
  id: "bud-2",
  category: "Shopping",
  amount: 100000,
};

function okResponse(): Response {
  return new Response(null, { status: 204 });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteMock.mockResolvedValue(okResponse());
});

describe("BudgetsList — empty state", () => {
  it("renders the empty state with copy and the add trigger", () => {
    render(<BudgetsList budgets={[]} spentByCategory={{}} addTrigger={<button>Add</button>} />);
    expect(screen.getByText("No budgets yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Set a limit per category to track spending and stay on plan/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("does not crash when there are no budgets", () => {
    render(<BudgetsList budgets={[]} spentByCategory={{}} addTrigger={null} />);
    expect(screen.getByText("No budgets yet")).toBeInTheDocument();
  });
});

describe("BudgetsList — rows", () => {
  it("renders category label, period label, limit and spent", () => {
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 120000 }}
        addTrigger={null}
      />,
    );
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Rp 500.000.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 120.000.00 spent")).toBeInTheDocument();
  });

  it("treats a missing spentByCategory entry as 0 spent", () => {
    render(
      <BudgetsList budgets={[budget]} spentByCategory={{}} addTrigger={null} />,
    );
    expect(screen.getByText("Rp 0.00 spent")).toBeInTheDocument();
  });

  it("colors the progress bar red when over budget", () => {
    render(
      <BudgetsList
        budgets={[overBudget]}
        spentByCategory={{ Shopping: 150000 }}
        addTrigger={null}
      />,
    );
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.className).toContain("bg-[#D8000C]");
  });

  it("clamps the progress bar width to 100%", () => {
    render(
      <BudgetsList
        budgets={[overBudget]}
        spentByCategory={{ Shopping: 999999 }}
        addTrigger={null}
      />,
    );
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("100%");
  });

  it("colors the progress bar green when under budget", () => {
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 100000 }}
        addTrigger={null}
      />,
    );
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.className).toContain("bg-[#00C610]");
  });

  it("keeps the bar at 0% when the budget has no spend", () => {
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 0 }}
        addTrigger={null}
      />,
    );
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("0%");
  });
});

describe("BudgetsList — detail sheet interaction", () => {
  it("opens the detail sheet when a row is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 120000 }}
        addTrigger={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /food & drink/i }));
    expect(screen.getByText("Budget limit")).toBeInTheDocument();
    expect(screen.getByText("Delete budget")).toBeInTheDocument();
  });

  it("closes the detail sheet via the close button", async () => {
    const user = userEvent.setup();
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 120000 }}
        addTrigger={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /food & drink/i }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Budget limit")).not.toBeInTheDocument();
  });

  it("deletes the budget from the sheet and refreshes the router", async () => {
    const user = userEvent.setup();
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 120000 }}
        addTrigger={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /food & drink/i }));
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith({ param: { id: "bud-1" } });
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("surfaces the API error message when deletion fails", async () => {
    deleteMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );
    const user = userEvent.setup();
    render(
      <BudgetsList
        budgets={[budget]}
        spentByCategory={{ FoodAndDrink: 120000 }}
        addTrigger={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /food & drink/i }));
    await user.click(screen.getByText("Delete budget"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
