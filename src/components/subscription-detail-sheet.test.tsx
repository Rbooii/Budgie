import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatRupiah, formatDate } from "@/lib/format";
import { nextBillingDate } from "@/lib/budget";
import type { SubscriptionRow } from "@/components/subscription-list";
import { SubscriptionDetailSheet } from "@/components/subscription-detail-sheet";

const deleteMock = vi.fn();
const refreshMock = vi.fn();
const onCloseMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    subscriptions: {
      ":id": {
        $delete: (...args: unknown[]) => deleteMock(...args),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const subscription: SubscriptionRow = {
  id: "sub-1",
  name: "Netflix",
  amount: 149000,
  currency: "IDR",
  category: "Entertainment",
  periodDays: 30,
  startDate: "2026-01-15T00:00:00.000Z",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  deleteMock.mockResolvedValue(new Response(null, { status: 204 }));
});

describe("SubscriptionDetailSheet — null state", () => {
  it("renders nothing when no subscription is selected", () => {
    render(<SubscriptionDetailSheet subscription={null} onClose={onCloseMock} />);
    expect(screen.queryByText("Delete subscription")).not.toBeInTheDocument();
    expect(screen.queryByText("Subscription")).not.toBeInTheDocument();
  });
});

describe("SubscriptionDetailSheet — display", () => {
  it("renders the subscription badge, name, amount and billing info", () => {
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getAllByText("Netflix")).not.toHaveLength(0);
    expect(screen.getAllByText(formatRupiah(149000))).not.toHaveLength(0);
  });

  it("renders all detail rows with correct values", () => {
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    const next = formatDate(nextBillingDate(subscription.startDate, 30));
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Entertainment")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Started")).toBeInTheDocument();
    expect(screen.getByText(formatDate(subscription.startDate))).toBeInTheDocument();
    expect(screen.getByText("Next billing")).toBeInTheDocument();
    expect(screen.getByText(next)).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Status Inactive for an inactive subscription", () => {
    render(
      <SubscriptionDetailSheet
        subscription={{ ...subscription, active: false }}
        onClose={onCloseMock}
      />,
    );
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
});

describe("SubscriptionDetailSheet — close behavior", () => {
  it("calls onClose via the close button", async () => {
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("calls onClose via the backdrop", async () => {
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(document.querySelector(".fixed.inset-0") as HTMLElement);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

describe("SubscriptionDetailSheet — delete flow", () => {
  it("confirms, deletes via the API and refreshes on success", async () => {
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(screen.getByText("Delete subscription"));
    expect(screen.getByText("Delete subscription?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith({ param: { id: "sub-1" } });
      expect(onCloseMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows the confirmation copy with the name and amount", async () => {
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(screen.getByText("Delete subscription"));
    expect(screen.getByText("Delete subscription?")).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(screen.getAllByText("Netflix")).not.toHaveLength(0);
    expect(screen.getAllByText(formatRupiah(149000))).not.toHaveLength(0);
  });

  it("cancelling the confirmation does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(screen.getByText("Delete subscription"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete subscription?")).not.toBeInTheDocument();
  });

  it("shows the API error message when deletion fails", async () => {
    deleteMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(screen.getByText("Delete subscription"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it("falls back to a generic message on non-JSON errors", async () => {
    deleteMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const user = userEvent.setup();
    render(
      <SubscriptionDetailSheet subscription={subscription} onClose={onCloseMock} />,
    );
    await user.click(screen.getByText("Delete subscription"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText("Failed to delete subscription"),
    ).toBeInTheDocument();
  });
});
