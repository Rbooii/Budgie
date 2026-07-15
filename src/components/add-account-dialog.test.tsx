import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const postMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    "balance-accounts": {
      $post: (...args: unknown[]) => postMock(...args),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

import { AddAccountDialog } from "@/components/add-account-dialog";

function okResponse(): Response {
  return new Response(JSON.stringify({ id: "acc-1" }), {
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

async function openDialog() {
  const user = userEvent.setup();
  const { container } = render(<AddAccountDialog />);
  await user.click(screen.getByRole("button", { name: "Add Account" }));
  await waitFor(() => {
    expect(container.querySelector(".fixed.inset-0")).not.toBeNull();
  });
  return { user, container };
}

describe("AddAccountDialog", () => {
  it("renders the trigger button with default label 'Add Account'", () => {
    render(<AddAccountDialog />);
    expect(screen.getByRole("button", { name: "Add Account" })).toBeInTheDocument();
  });

  it("renders the trigger with a custom label", () => {
    render(<AddAccountDialog triggerLabel="Create Account" />);
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("opens the dialog when the trigger is clicked", async () => {
    const { container } = await openDialog();
    expect(container.querySelector(".fixed.inset-0")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Add Account" })).toBeInTheDocument();
  });

  it("renders the form fields (Name, Type, Currency, Balance)", async () => {
    await openDialog();
    expect(screen.getByPlaceholderText("e.g. Bank BCA")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("submits the form and calls api.$post with the correct payload", async () => {
    const { user, container } = await openDialog();

    await user.type(screen.getByPlaceholderText("e.g. Bank BCA"), "BCA");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    const call = postMock.mock.calls[0][0] as { json: Record<string, unknown> };
    expect(call.json).toMatchObject({
      name: "BCA",
      currency: "IDR",
      type: "bank",
    });
    expect(call.json.balance).toBe(0);
  });

  it("closes the dialog and calls router.refresh() on success", async () => {
    const { user, container } = await openDialog();
    await user.type(screen.getByPlaceholderText("e.g. Bank BCA"), "BCA");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const dialogs = container.querySelectorAll(".fixed.inset-0");
      expect(dialogs.length).toBe(0);
    });
  });

  it("shows an error callout when the API returns an error", async () => {
    postMock.mockResolvedValue(errorResponse("Name already exists"));
    const { user } = await openDialog();
    await user.type(screen.getByPlaceholderText("e.g. Bank BCA"), "BCA");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(screen.getByText("Name already exists")).toBeInTheDocument();
    });
  });

  it("shows a generic error when the API returns non-JSON", async () => {
    postMock.mockResolvedValue(
      new Response("Internal error", { status: 500 }),
    );
    const { user } = await openDialog();
    await user.type(screen.getByPlaceholderText("e.g. Bank BCA"), "BCA");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeInTheDocument();
    });
  });

  it("closes the dialog when Cancel is clicked", async () => {
    const { user, container } = await openDialog();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(container.querySelector(".fixed.inset-0")).toBeNull();
    });
  });
});
