import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatRupiah, formatDate } from "@/lib/format";
import { nextBillingDate } from "@/lib/budget";
import type { SubscriptionRow } from "@/components/subscription-list";

const deleteMock = vi.fn();
const refreshMock = vi.fn();

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

import { SubscriptionList } from "@/components/subscription-list";

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

const inactive: SubscriptionRow = {
  ...subscription,
  id: "sub-2",
  name: "Spotify",
  active: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  deleteMock.mockResolvedValue(new Response(null, { status: 204 }));
});

describe("SubscriptionList — empty state", () => {
  it("renders the empty state with copy and the add trigger", () => {
    render(
      <SubscriptionList subscriptions={[]} addTrigger={<button>Add sub</button>} />,
    );
    expect(screen.getByText("No subscriptions yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Add your recurring charges to see when the next payment is due/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add sub" })).toBeInTheDocument();
  });

  it("does not crash with an empty list", () => {
    render(<SubscriptionList subscriptions={[]} addTrigger={null} />);
    expect(screen.getByText("No subscriptions yet")).toBeInTheDocument();
  });
});

describe("SubscriptionList — rows", () => {
  it("renders name, category, period, amount and next billing date", () => {
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText(/Entertainment · Monthly/)).toBeInTheDocument();
    expect(screen.getByText(formatRupiah(149000))).toBeInTheDocument();
    expect(
      screen.getByText(`Next ${formatDate(nextBillingDate(subscription.startDate, 30))}`),
    ).toBeInTheDocument();
  });

  it("shows the Inactive badge for inactive subscriptions", () => {
    render(<SubscriptionList subscriptions={[inactive]} addTrigger={null} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("does not show an Inactive badge for active subscriptions", () => {
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
  });

  it("computes the next billing date from startDate and periodDays", () => {
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    const expected = formatDate(nextBillingDate("2026-01-15T00:00:00.000Z", 30));
    expect(screen.getByText(`Next ${expected}`)).toBeInTheDocument();
  });
});

describe("SubscriptionList — detail sheet interaction", () => {
  it("opens the detail sheet when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    await user.click(screen.getByRole("button", { name: /netflix/i }));
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("Delete subscription")).toBeInTheDocument();
    expect(screen.getAllByText("Netflix")).not.toHaveLength(0);
  });

  it("closes the detail sheet via the close button", async () => {
    const user = userEvent.setup();
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    await user.click(screen.getByRole("button", { name: /netflix/i }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Delete subscription")).not.toBeInTheDocument();
  });

  it("deletes the subscription from the sheet and refreshes the router", async () => {
    const user = userEvent.setup();
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    await user.click(screen.getByRole("button", { name: /netflix/i }));
    await user.click(screen.getByText("Delete subscription"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith({ param: { id: "sub-1" } });
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("surfaces the API error when deletion fails", async () => {
    deleteMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );
    const user = userEvent.setup();
    render(<SubscriptionList subscriptions={[subscription]} addTrigger={null} />);
    await user.click(screen.getByRole("button", { name: /netflix/i }));
    await user.click(screen.getByText("Delete subscription"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
