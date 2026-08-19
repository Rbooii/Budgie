import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const postMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    transactions: {
      $post: (...args: unknown[]) => postMock(...args),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { AddTransactionWizard } from "@/components/add-transaction-wizard";

const accounts = [
  { id: "acc-1", name: "BCA", currency: "IDR", type: "bank", balance: 1000000 },
  { id: "acc-2", name: "GoPay", currency: "IDR", type: "digital wallet", balance: 500000 },
];

function okResponse(): Response {
  return new Response(JSON.stringify({ id: "txn-1" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  postMock.mockResolvedValue(okResponse());
});

describe("AddTransactionWizard — step 1 (type selection)", () => {
  it("renders 'New transaction' heading on step 1", () => {
    render(<AddTransactionWizard accounts={accounts} />);
    expect(screen.getByText("New transaction")).toBeInTheDocument();
  });

  it("renders all three type options (Income, Expense, Transfer)", () => {
    render(<AddTransactionWizard accounts={accounts} />);
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });

  it("disables Transfer when there is only one account", () => {
    render(<AddTransactionWizard accounts={[accounts[0]]} />);
    const transferBtn = screen.getByText("Transfer").closest("button");
    expect(transferBtn).toBeDisabled();
  });

  it("shows '1 of 3' on step 1", () => {
    render(<AddTransactionWizard accounts={accounts} />);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("Continue button is disabled until a type is selected", () => {
    render(<AddTransactionWizard accounts={accounts} />);
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("selecting a type enables Continue and advances to step 2", async () => {
    const user = userEvent.setup();
    render(<AddTransactionWizard accounts={accounts} />);
    await user.click(screen.getByText("Income"));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });
});

describe("AddTransactionWizard — step 2 (details)", () => {
  async function goToStep2(type: "income" | "expense" | "transfer" = "income") {
    const user = userEvent.setup();
    render(<AddTransactionWizard accounts={accounts} />);
    await user.click(screen.getByText(type === "income" ? "Income" : type === "expense" ? "Expense" : "Transfer"));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    return { user };
  }

  it("renders the Amount field and Bank account field on step 2", async () => {
    await goToStep2();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Bank account")).toBeInTheDocument();
  });

  it("shows the Name field on step 2", async () => {
    await goToStep2();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows the Category field on step 2", async () => {
    await goToStep2();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows the Transfer to field only for transfer type", async () => {
    const { user } = await goToStep2("transfer");
    expect(screen.getByText("Transfer to")).toBeInTheDocument();
  });

  it("does not show Transfer to for income type", async () => {
    await goToStep2("income");
    expect(screen.queryByText("Transfer to")).not.toBeInTheDocument();
  });

  it("shows Admin fee field only for transfer type", async () => {
    await goToStep2("transfer");
    expect(screen.getByText("Admin fee")).toBeInTheDocument();
  });

  it("Continue button is disabled until all required fields are filled", async () => {
    const { user } = await goToStep2("income");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});

describe("AddTransactionWizard — step 3 (review) + submit", () => {
  async function fillAndGoToStep3() {
    const user = userEvent.setup();
    render(<AddTransactionWizard accounts={accounts} />);

    await user.click(screen.getByText("Expense"));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const amountInput = screen.getByPlaceholderText("0");
    await user.type(amountInput, "50000");

    const bankSelect = screen.getByDisplayValue("Select account") || screen.getAllByRole("combobox")[0];
    await user.selectOptions(bankSelect as HTMLElement, "acc-1");

    const nameInputs = screen.getAllByRole("textbox");
    const nameInput = nameInputs.find((el) => el.getAttribute("placeholder") === "e.g. Grocery shopping");
    if (nameInput) await user.type(nameInput, "Groceries");

    const categorySelect = screen.getAllByRole("combobox").pop()!;
    await user.selectOptions(categorySelect as HTMLElement, "FoodAndDrink");

    await user.click(screen.getByRole("button", { name: /continue/i }));
    return { user };
  }

  it("shows '3 of 3' and 'Confirm and Add' on step 3", async () => {
    await fillAndGoToStep3();
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm and add/i })).toBeInTheDocument();
  });

  it("shows the review rows (Type, Bank, Category, Date)", async () => {
    await fillAndGoToStep3();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Bank")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });
});

describe("AddTransactionWizard — back navigation", () => {
  it("navigates back from step 2 to step 1", async () => {
    const user = userEvent.setup();
    render(<AddTransactionWizard accounts={accounts} />);
    await user.click(screen.getByText("Income"));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Back"));
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("navigates to /transactions when Back is pressed on step 1", async () => {
    const user = userEvent.setup();
    render(<AddTransactionWizard accounts={accounts} />);
    await user.click(screen.getByLabelText("Back"));
    expect(pushMock).toHaveBeenCalledWith("/transactions");
  });
});

describe("AddTransactionWizard — empty accounts", () => {
  it("disables Transfer when no accounts", () => {
    render(<AddTransactionWizard accounts={[]} />);
    const transferBtn = screen.getByText("Transfer").closest("button");
    expect(transferBtn).toBeDisabled();
  });
});
