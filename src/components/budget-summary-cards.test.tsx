import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetSummaryCards, periodBadgeLabel } from "@/components/budget-summary-cards";

function monthlyCard(): HTMLElement {
  const heading = screen.getByText("Monthly Budget");
  return heading.closest("div")!.parentElement as HTMLElement;
}

function dailyCard(): HTMLElement {
  const heading = screen.getByText("Daily Budget");
  return heading.closest("div")!.parentElement as HTMLElement;
}

describe("BudgetSummaryCards", () => {
  it("renders both card labels", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 0, spent: 0 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    expect(screen.getByText("Monthly Budget")).toBeInTheDocument();
    expect(screen.getByText("Daily Budget")).toBeInTheDocument();
  });

  it("renders the current month caption on the monthly card", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 0, spent: 0 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("shows the budget total, remaining and spent when a budget exists", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 1000000, spent: 400000 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    const card = monthlyCard();
    expect(card).toHaveTextContent("Rp 1.000.000.00");
    expect(card).toHaveTextContent("Rp 600.000.00 remaining");
    expect(card).toHaveTextContent("Rp 400.000.00 spent");
  });

  it("shows 'X over budget' when spent exceeds the budget", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 500000, spent: 750000 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    const card = monthlyCard();
    expect(card).toHaveTextContent("Rp 250.000.00 over budget");
  });

  it("shows 'Rp 0.00 remaining' when spent equals the budget (not over)", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 500000, spent: 500000 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    const card = monthlyCard();
    expect(card).toHaveTextContent("Rp 0.00 remaining");
    expect(card).not.toHaveTextContent("over budget");
  });

  it("renders an empty state instead of numbers when no budget exists", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 0, spent: 0 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    expect(screen.getByText("No monthly budget yet")).toBeInTheDocument();
    expect(screen.getByText("No daily budget yet")).toBeInTheDocument();
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    expect(screen.queryByText(/spent/)).not.toBeInTheDocument();
  });

  it("treats a negative total as 'no budget'", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: -1, spent: 0 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    expect(screen.getByText("No monthly budget yet")).toBeInTheDocument();
  });

  it("clamps the progress bar to 100% when over budget", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 1000, spent: 99999 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    const card = monthlyCard();
    const bar = card.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("100%");
    expect(bar.className).toContain("bg-[#D8000C]");
  });

  it("colors the bar green when under budget", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 1000, spent: 500 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    const card = monthlyCard();
    const bar = card.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.className).toContain("bg-[#00C610]");
  });

  it("computes the bar width from spent/total", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 200000, spent: 50000 }}
        daily={{ total: 0, spent: 0 }}
      />,
    );
    const card = monthlyCard();
    const bar = card.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe("25%");
  });

  it("renders both cards independently (daily over, monthly under)", () => {
    render(
      <BudgetSummaryCards
        monthly={{ total: 100000, spent: 50000 }}
        daily={{ total: 100000, spent: 150000 }}
      />,
    );
    expect(monthlyCard()).toHaveTextContent("Rp 50.000.00 remaining");
    expect(dailyCard()).toHaveTextContent("Rp 50.000.00 over budget");
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
