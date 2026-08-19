import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddBudgetDialog } from "@/components/add-budget-dialog";

const postMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    budgets: {
      $post: (...args: unknown[]) => postMock(...args),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function okResponse(): Response {
  return new Response(JSON.stringify({ id: "bud-1" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 409,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  postMock.mockResolvedValue(okResponse());
});

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add budget" }));
}

describe("AddBudgetDialog — trigger and step 1", () => {
  it("renders the trigger with the default label", () => {
    render(<AddBudgetDialog usedCategories={[]} />);
    expect(screen.getByRole("button", { name: "Add budget" })).toBeInTheDocument();
  });

  it("renders the trigger with a custom label", () => {
    render(<AddBudgetDialog usedCategories={[]} triggerLabel="Set budget" />);
    expect(screen.getByRole("button", { name: "Set budget" })).toBeInTheDocument();
  });

  it("opens the dialog showing 'Add Budget' and step 1 of 3", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    expect(screen.getByText("Add Budget")).toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    expect(screen.getByText(/Choose a budget period/)).toBeInTheDocument();
  });

  it("renders all four period options", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("keeps Continue disabled until a period is selected", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    await user.click(screen.getByText("Monthly"));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("advances to step 2 after selecting a period", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    await user.click(screen.getByText("Weekly"));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Select category")).toBeInTheDocument();
  });

  it("rejects invalid custom-day input and clamps to 1 day minimum", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    await user.click(screen.getByText("Custom"));
    const input = screen.getByPlaceholderText("e.g. 14");
    await user.type(input, "0");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.selectOptions(screen.getByRole("combobox"), "FoodAndDrink");
    await user.type(screen.getByPlaceholderText("0"), "100000");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: "Confirm and Add" }));
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith({
        json: { category: "FoodAndDrink", amount: 100000, periodDays: 1 },
      });
    });
  });

  it("strips non-digit characters from the custom days input", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    await user.click(screen.getByText("Custom"));
    const input = screen.getByPlaceholderText("e.g. 14") as HTMLInputElement;
    await user.type(input, "14abc");
    expect(input.value).toBe("14");
  });

  it("cancels (closes) when Back is pressed on step 1", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Add Budget")).not.toBeInTheDocument();
  });
});

describe("AddBudgetDialog — step 2", () => {
  async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
    await openDialog(user);
    await user.click(screen.getByText("Monthly"));
    await user.click(screen.getByRole("button", { name: /continue/i }));
  }

  it("lists every expense category except used ones", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={["FoodAndDrink"]} />);
    await goToStep2(user);
    const select = screen.getByRole("combobox");
    expect(select).toHaveTextContent("Rent");
    expect(select).not.toHaveTextContent("Food & Drink");
    expect(select).not.toHaveTextContent("Salary");
  });

  it("shows the hint when all categories already have budgets", async () => {
    const user = userEvent.setup();
    render(
      <AddBudgetDialog
        usedCategories={[
          "FoodAndDrink", "Rent", "Entertainment", "Transportation",
          "Shopping", "Utilities", "Healthcare", "Education", "Travel",
          "OtherExpense",
        ]}
      />,
    );
    await goToStep2(user);
    expect(
      screen.getByText("All expense categories already have budgets."),
    ).toBeInTheDocument();
  });

  it("keeps Continue disabled until both category and amount are set", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep2(user);
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox"), "FoodAndDrink");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("0"), "500000");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("formats the amount with thousand separators as the user types", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep2(user);
    const input = screen.getByPlaceholderText("0") as HTMLInputElement;
    await user.type(input, "1500000");
    expect(input.value).toBe("1.500.000");
  });

  it("preserves a lone minus sign but blocks submission on negative amounts", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep2(user);
    const input = screen.getByPlaceholderText("0") as HTMLInputElement;
    await user.type(input, "-");
    expect(input.value).toBe("-");
    await user.selectOptions(screen.getByRole("combobox"), "FoodAndDrink");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    await user.type(input, "500000");
    expect(input.value).toBe("-500.000");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("returns to step 1 with Back", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep2(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });
});

describe("AddBudgetDialog — step 3 and submit", () => {
  async function goToStep3(user: ReturnType<typeof userEvent.setup>) {
    await openDialog(user);
    await user.click(screen.getByText("Monthly"));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.selectOptions(screen.getByRole("combobox"), "FoodAndDrink");
    await user.type(screen.getByPlaceholderText("0"), "500000");
    await user.click(screen.getByRole("button", { name: /continue/i }));
  }

  it("shows the review summary with category, period and limit", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep3(user);
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    expect(screen.getAllByText("Food & Drink")).not.toHaveLength(0);
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 500.000.00")).not.toHaveLength(0);
  });

  it("shows 'Confirm and Add' as the CTA on step 3", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep3(user);
    expect(screen.getByRole("button", { name: "Confirm and Add" })).toBeInTheDocument();
  });

  it("posts the validated payload and closes + refreshes on success", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep3(user);
    await user.click(screen.getByRole("button", { name: "Confirm and Add" }));
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith({
        json: { category: "FoodAndDrink", amount: 500000, periodDays: 30 },
      });
      expect(refreshMock).toHaveBeenCalled();
    });
    expect(screen.queryByText("Add Budget")).not.toBeInTheDocument();
  });

  it("shows the API error message on failure and stays open", async () => {
    postMock.mockResolvedValue(errorResponse("Budget for this category already exists"));
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep3(user);
    await user.click(screen.getByRole("button", { name: "Confirm and Add" }));
    expect(
      await screen.findByText("Budget for this category already exists"),
    ).toBeInTheDocument();
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    postMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep3(user);
    await user.click(screen.getByRole("button", { name: "Confirm and Add" }));
    expect(await screen.findByText("Failed to create budget")).toBeInTheDocument();
  });

  it("resets the wizard when closed and reopened", async () => {
    const user = userEvent.setup();
    render(<AddBudgetDialog usedCategories={[]} />);
    await goToStep3(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await openDialog(user);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});
