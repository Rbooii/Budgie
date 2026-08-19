import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";

const postMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    subscriptions: {
      $post: (...args: unknown[]) => postMock(...args),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function okResponse(): Response {
  return new Response(JSON.stringify({ id: "sub-1" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

function todayValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  postMock.mockResolvedValue(okResponse());
});

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add subscription" }));
}

describe("AddSubscriptionDialog — trigger and form basics", () => {
  it("renders the trigger with the default label", () => {
    render(<AddSubscriptionDialog />);
    expect(
      screen.getByRole("button", { name: "Add subscription" }),
    ).toBeInTheDocument();
  });

  it("renders the trigger with a custom label", () => {
    render(<AddSubscriptionDialog triggerLabel="Track subscription" />);
    expect(
      screen.getByRole("button", { name: "Track subscription" }),
    ).toBeInTheDocument();
  });

  it("opens the dialog with the heading and description", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    expect(screen.getByText("Add Subscription")).toBeInTheDocument();
    expect(
      screen.getByText(/Track recurring charges so you always know what/),
    ).toBeInTheDocument();
  });

  it("renders Name, Category, Billing cycle, Start date and Amount fields", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Billing cycle")).toBeInTheDocument();
    expect(screen.getByText("Start date")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("defaults the billing cycle to Monthly (30 days)", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    expect(screen.getByRole("combobox", { name: /billing cycle/i })).toHaveValue("30");
  });

  it("defaults the start date to today", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    const dateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    expect(dateInput.value).toBe(todayValue());
  });

  it("lists all expense categories in the category select", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    const select = screen.getByRole("combobox", { name: /category/i });
    expect(select).toHaveTextContent("Food & Drink");
    expect(select).toHaveTextContent("Rent");
    expect(select).not.toHaveTextContent("Salary");
  });
});

describe("AddSubscriptionDialog — validation", () => {
  it("keeps Add disabled until name, amount, category and date are filled", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("e.g. Netflix, Spotify"), "Netflix");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    await user.selectOptions(
      screen.getByRole("combobox", { name: /category/i }),
      "Entertainment",
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("0"), "149000");
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });

  it("rejects whitespace-only names", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    await user.type(screen.getByPlaceholderText("e.g. Netflix, Spotify"), "   ");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /category/i }),
      "Entertainment",
    );
    await user.type(screen.getByPlaceholderText("0"), "149000");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("rejects a zero amount", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    await user.type(screen.getByPlaceholderText("e.g. Netflix, Spotify"), "Netflix");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /category/i }),
      "Entertainment",
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("formats the amount with thousand separators as the user types", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    const input = screen.getByPlaceholderText("0") as HTMLInputElement;
    await user.type(input, "149000");
    expect(input.value).toBe("149.000");
  });

  it("preserves a leading minus sign but keeps Add disabled", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await openDialog(user);
    const input = screen.getByPlaceholderText("0") as HTMLInputElement;
    await user.type(input, "-50000");
    expect(input.value).toBe("-50.000");
    await user.type(screen.getByPlaceholderText("e.g. Netflix, Spotify"), "Netflix");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /category/i }),
      "Entertainment",
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });
});

describe("AddSubscriptionDialog — submit", () => {
  async function fillForm(
    user: ReturnType<typeof userEvent.setup>,
    options: { startDate?: string } = {},
  ) {
    await openDialog(user);
    await user.type(screen.getByPlaceholderText("e.g. Netflix, Spotify"), "Netflix");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /category/i }),
      "Entertainment",
    );
    await user.type(screen.getByPlaceholderText("0"), "149000");
    if (options.startDate) {
      const dateInput = screen.getByLabelText(/start date/i);
      await user.clear(dateInput);
      await user.type(dateInput, options.startDate);
    }
  }

  it("posts the payload with trimmed name, ISO start date and active: true", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith({
        json: {
          name: "Netflix",
          amount: 149000,
          category: "Entertainment",
          periodDays: 30,
          startDate: expect.any(String),
          active: true,
        },
      });
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("uses the selected billing cycle in the payload", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /billing cycle/i }),
      "365",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => {
      const payload = postMock.mock.calls[0][0] as {
        json: { periodDays: number };
      };
      expect(payload.json.periodDays).toBe(365);
    });
  });

  it("sends the chosen start date as an ISO string", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user, { startDate: "2026-08-01" });
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => {
      const payload = postMock.mock.calls[0][0] as {
        json: { startDate: string };
      };
      expect(payload.json.startDate).toBe("2026-08-01T00:00:00.000Z");
    });
  });

  it("closes the dialog and refreshes on success", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => {
      expect(screen.queryByText("Add Subscription")).not.toBeInTheDocument();
    });
  });

  it("shows the API error message on failure and stays open", async () => {
    postMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Subscription with this name already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(
      await screen.findByText("Subscription with this name already exists"),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Subscription")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("falls back to a generic message on non-JSON errors", async () => {
    postMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Failed to create subscription")).toBeInTheDocument();
  });

  it("resets the form when cancelled and reopened", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionDialog />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await openDialog(user);
    expect(screen.getByPlaceholderText("e.g. Netflix, Spotify")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });
});
