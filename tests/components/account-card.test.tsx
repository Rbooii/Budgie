import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const deleteMock = vi.fn();
const patchMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    "balance-accounts": {
      ":id": {
        $delete: (...args: unknown[]) => deleteMock(...args),
        $patch: (...args: unknown[]) => patchMock(...args),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/components/balance-visibility", () => ({
  MaskedBalance: ({ value }: { value: number }) => (
    <span data-testid="masked-balance">{`Rp ${value}`}</span>
  ),
}));

import { AccountCard } from "@/components/account-card";

const ACCOUNT = {
  id: "acc-1",
  name: "BCA Checking",
  balance: 1500000,
  currency: "IDR",
  type: "bank",
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

async function waitForDialogOpen(container: HTMLElement) {
  return await vi.waitFor(() => {
    const dialogs = container.querySelectorAll(".fixed.inset-0");
    expect(dialogs.length).toBeGreaterThan(0);
    return dialogs[dialogs.length - 1] as HTMLElement;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteMock.mockResolvedValue(okResponse());
  patchMock.mockResolvedValue(okResponse());
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AccountCard", () => {
  describe("rendering", () => {
    it("renders the account name and type badge", () => {
      render(<AccountCard account={ACCOUNT} />);
      expect(screen.getByText("BCA Checking")).toBeInTheDocument();
      expect(screen.getByText("bank")).toBeInTheDocument();
    });

    it("shows the masked balance via MaskedBalance", () => {
      render(<AccountCard account={ACCOUNT} />);
      expect(screen.getByTestId("masked-balance")).toHaveTextContent("Rp 1500000");
    });
  });

  describe("view dialog", () => {
    it("opens the view dialog with Edit and Delete actions when the card is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const dialog = await waitForDialogOpen(container);
      expect(within(dialog).getByText("BCA Checking")).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: /edit/i })).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe("delete confirm flow", () => {
    it("does NOT call $delete when Delete is clicked — instead opens the confirm dialog", async () => {
      const user = userEvent.setup();
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const viewDialog = await waitForDialogOpen(container);
      await user.click(within(viewDialog).getByRole("button", { name: /delete/i }));
      expect(deleteMock).not.toHaveBeenCalled();
      expect(await screen.findByText("Delete account?")).toBeInTheDocument();
    });

    it("shows account name and formatted balance in the confirm body", async () => {
      const user = userEvent.setup();
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const viewDialog = await waitForDialogOpen(container);
      await user.click(within(viewDialog).getByRole("button", { name: /delete/i }));
      const confirmDialog = await waitForDialogOpen(container);
      expect(within(confirmDialog).getByText("BCA Checking")).toBeInTheDocument();
      expect(within(confirmDialog).getByText(/Rp 1\.500\.000\.00/)).toBeInTheDocument();
      expect(within(confirmDialog).getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it("calls $delete with the account id, closes both dialogs, and refreshes on confirm", async () => {
      const user = userEvent.setup();
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const viewDialog = await waitForDialogOpen(container);
      await user.click(within(viewDialog).getByRole("button", { name: /delete/i }));
      const confirmDialog = await waitForDialogOpen(container);
      const confirmDeleteBtn = within(confirmDialog).getByRole("button", { name: /^delete$/i });
      await user.click(confirmDeleteBtn);
      await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith({ param: { id: ACCOUNT.id } });
      await vi.waitFor(() => {
        expect(screen.queryByText("Delete account?")).not.toBeInTheDocument();
      });
    });

    it("Cancel closes only the confirm dialog and does NOT delete", async () => {
      const user = userEvent.setup();
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const viewDialog = await waitForDialogOpen(container);
      await user.click(within(viewDialog).getByRole("button", { name: /delete/i }));
      const confirmDialog = await waitForDialogOpen(container);
      await user.click(within(confirmDialog).getByRole("button", { name: /cancel/i }));
      await vi.waitFor(() => {
        expect(screen.queryByText("Delete account?")).not.toBeInTheDocument();
      });
      expect(deleteMock).not.toHaveBeenCalled();
      expect(within(viewDialog).getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it("is guarded against Escape while a delete request is in flight", async () => {
      const user = userEvent.setup();
      let resolveDelete!: () => void;
      deleteMock.mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveDelete = () => resolve(okResponse());
        }),
      );
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const viewDialog = await waitForDialogOpen(container);
      await user.click(within(viewDialog).getByRole("button", { name: /delete/i }));
      await waitForDialogOpen(container);
      const confirmDeleteBtn = screen.getAllByRole("button", { name: /^delete$/i }).pop()!;
      await user.click(confirmDeleteBtn);
      expect(screen.getByText("Delete account?")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.getByText("Delete account?")).toBeInTheDocument();
      await act(async () => {
        resolveDelete();
      });
      await vi.waitFor(() => {
        expect(screen.queryByText("Delete account?")).not.toBeInTheDocument();
      });
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    it("shows an error callout and keeps the confirm dialog open when $delete fails", async () => {
      const user = userEvent.setup();
      deleteMock.mockResolvedValue(errorResponse("Account is referenced by a budget"));
      const { container } = render(<AccountCard account={ACCOUNT} />);
      await user.click(screen.getByText("BCA Checking"));
      const viewDialog = await waitForDialogOpen(container);
      await user.click(within(viewDialog).getByRole("button", { name: /delete/i }));
      const confirmDialog = await waitForDialogOpen(container);
      const confirmDeleteBtn = within(confirmDialog).getByRole("button", { name: /^delete$/i });
      await user.click(confirmDeleteBtn);
      await vi.waitFor(() => {
        expect(within(confirmDialog).getByText("Account is referenced by a budget")).toBeInTheDocument();
      });
      expect(within(confirmDialog).getByText("Delete account?")).toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });
});
