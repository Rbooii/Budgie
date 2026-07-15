import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { QuickInsightEmptyState } from "@/components/quick-insight-empty-state";

describe("QuickInsightEmptyState", () => {
  it("renders the 'No insight yet' title", () => {
    render(<QuickInsightEmptyState />);
    expect(screen.getByText("No insight yet")).toBeInTheDocument();
  });

  it("renders the helper description", () => {
    render(<QuickInsightEmptyState />);
    expect(
      screen.getByText(/Add a transaction to see your cashflow/),
    ).toBeInTheDocument();
  });

  it("renders an 'Add transaction' button", () => {
    render(<QuickInsightEmptyState />);
    expect(screen.getByRole("button", { name: /add transaction/i })).toBeInTheDocument();
  });

  it("navigates to /transactions/add when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<QuickInsightEmptyState />);
    await user.click(screen.getByRole("button", { name: /add transaction/i }));
    expect(pushMock).toHaveBeenCalledWith("/transactions/add");
  });
});
