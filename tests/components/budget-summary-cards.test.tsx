import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetSummaryCards, periodBadgeLabel } from "@/components/budget-summary-cards";

function heroCard(title: string): HTMLElement {
  return screen.getByText(title).parentElement!.parentElement as HTMLElement;
}

describe("BudgetSummaryCards", () => {
  it("prefers the monthly group and renders its title and budget count", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 1000000, spent: 400000, count: 2 }}
        daily={{ total: 50000, spent: 10000, count: 1 }}
      />,
    );
    expect(screen.getByText("Monthly budget")).toBeInTheDocument();
    expect(screen.getByText("2 budgets")).toBeInTheDocument();
    expect(screen.queryByText("Daily budget")).not.toBeInTheDocument();
  });

  it("falls back to the daily group when there is no monthly budget", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 0, spent: 0, count: 0 }}
        daily={{ total: 100000, spent: 25000, count: 1 }}
      />,
    );
    expect(screen.getByText("Daily budget")).toBeInTheDocument();
    expect(screen.getByText("1 budget")).toBeInTheDocument();
  });

  it("renders nothing when neither group has a budget", () => {
    const { container } = render(
      <BudgetSummaryCards
        monthly={{ total: 0, spent: 0, count: 0 }}
        daily={{ total: 0, spent: 0, count: 0 }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the remaining amount, 'Left to spend' and spent-of caption", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 1000000, spent: 400000, count: 3 }}
        daily={{ total: 0, spent: 0, count: 0 }}
      />,
    );
    const card = heroCard("Monthly budget");
    expect(card).toHaveTextContent("Rp 600.000.00");
    expect(card).toHaveTextContent("Left to spend");
    expect(card).toHaveTextContent("Rp 400.000.00 spent of Rp 1.000.000.00");
  });

  it("turns red and shows 'Over budget' when spent exceeds the limit", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 500000, spent: 750000, count: 1 }}
        daily={{ total: 0, spent: 0, count: 0 }}
      />,
    );
    const card = heroCard("Monthly budget");
    expect(card.className).toContain("bg-[#D8000C]");
    expect(card).toHaveTextContent("Over budget");
    expect(card).toHaveTextContent("Rp 250.000.00");
  });

  it("stays green and shows 'Rp 0.00' when spent equals the limit (not over)", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 500000, spent: 500000, count: 1 }}
        daily={{ total: 0, spent: 0, count: 0 }}
      />,
    );
    const card = heroCard("Monthly budget");
    expect(card.className).toContain("bg-[#00C610]");
    expect(card).toHaveTextContent("Left to spend");
    expect(card).not.toHaveTextContent("Over budget");
  });

  it("computes the progress bar width from spent/total", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 200000, spent: 50000, count: 1 }}
        daily={{ total: 0, spent: 0, count: 0 }}
      />,
    );
    const bar = heroCard("Monthly budget").querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("25%");
    expect(bar.className).toContain("bg-white");
  });

  it("clamps the progress bar to 100% when over budget", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 1000, spent: 99999, count: 1 }}
        daily={{ total: 0, spent: 0, count: 0 }}
      />,
    );
    const bar = heroCard("Monthly budget").querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("100%");
  });
});

describe("periodBadgeLabel", () => {
  it("delegates to periodLabel for known periods", () => {
    expect(periodBadgeLabel(1)).toBe("Daily");
    expect(periodBadgeLabel(7)).toBe("Weekly");
    expect(periodBadgeLabel(30)).toBe("Monthly");
    expect(periodBadgeLabel(365)).toBe("Yearly");
  });

  it("delegates to periodLabel for custom periods", () => {
    expect(periodBadgeLabel(14)).toBe("Every 14 days");
  });
});
