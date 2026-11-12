import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stubResizeObserver } from "@/test-utils/browser-mocks";
import { QuickInsightView } from "@/components/quick-insight";
import { BalanceVisibilityProvider } from "@/components/balance-visibility";

const SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL = SHORT.map((_, index) => `Month ${index + 1} 2026`);

const CASHFLOW = [
  {
    id: "this-month",
    label: "This month",
    dateLabel: "November 2026",
    income: 8_000_000,
    expense: 3_240_000,
  },
  {
    id: "last-month",
    label: "Last month",
    dateLabel: "October 2026",
    income: 6_000_000,
    expense: 2_500_000,
  },
];

const GROWTH = [
  {
    id: "this-year",
    label: "This year",
    rangeLabel: "2026",
    changeLabel: "YTD",
    shortLabels: SHORT,
    fullLabels: FULL,
    data: [
      { month: 0, value: 1000 },
      { month: 1, value: 1100 },
    ],
    startingValue: 900,
    currentTotal: 1100,
    currentMonth: 1,
    hasTransactions: true,
    activeMonths: [true, true, ...new Array(10).fill(false)],
  },
  {
    id: "last-year",
    label: "Last year",
    rangeLabel: "2025",
    changeLabel: "Year",
    shortLabels: SHORT,
    fullLabels: FULL.map((label) => label.replace("2026", "2025")),
    data: [{ month: 0, value: 800 }],
    startingValue: 800,
    currentTotal: 900,
    currentMonth: 11,
    hasTransactions: true,
    activeMonths: [true, ...new Array(11).fill(false)],
  },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("QuickInsightView", () => {
  it("switches the cashflow period", async () => {
    stubResizeObserver();
    const user = userEvent.setup();
    render(
      <QuickInsightView cashflowPeriods={CASHFLOW} growthPeriods={GROWTH} />,
    );
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", { name: "Cashflow period" }),
    );
    await user.click(screen.getByRole("option", { name: "Last month" }));

    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(screen.queryByText("November 2026")).not.toBeInTheDocument();
  });

  it("masks cashflow and growth values when balance visibility is hidden", () => {
    stubResizeObserver();
    const { container } = render(
      <BalanceVisibilityProvider>
        <QuickInsightView cashflowPeriods={CASHFLOW} growthPeriods={GROWTH} />
      </BalanceVisibilityProvider>,
    );
    expect(container.textContent).not.toContain("8.000.000");
    expect(container.textContent).not.toContain("+Rp 200.00");
    expect(container.textContent).toContain("•");
  });

  it("switches the asset growth period", async () => {
    stubResizeObserver();
    const user = userEvent.setup();
    render(
      <QuickInsightView cashflowPeriods={CASHFLOW} growthPeriods={GROWTH} />,
    );
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("YTD")).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", { name: "Growth period" }),
    );
    await user.click(screen.getByRole("option", { name: "Last year" }));

    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
  });
});
