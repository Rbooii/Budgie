import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Showcase } from "@/components/landing/showcase";
import {
  MOCK_CASHFLOW,
  MOCK_GROWTH,
  MOCK_TRANSACTIONS,
} from "@/components/landing/mock-data";
import { formatRupiah } from "@/lib/format";

describe("Showcase", () => {
  it("renders all three showcase sections with their titles", () => {
    render(<Showcase />);
    expect(screen.getByText("Every rupiah, in its place")).toBeInTheDocument();
    expect(screen.getByText("Limits that keep you honest")).toBeInTheDocument();
    expect(screen.getByText("See where you're headed")).toBeInTheDocument();
  });

  it("renders the transaction showcase bullets", () => {
    render(<Showcase />);
    expect(
      screen.getByText("Balances update automatically on create and delete"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Transfers move between accounts/),
    ).toBeInTheDocument();
    expect(screen.getByText("Search, group, and export to PDF for your records")).toBeInTheDocument();
  });

  it("renders the mock transactions in the recent activity list", () => {
    render(<Showcase />);
    for (const t of MOCK_TRANSACTIONS) {
      expect(screen.getAllByText(t.name)).not.toHaveLength(0);
    }
  });

  it("renders the net-this-month amount from the mock cashflow", () => {
    render(<Showcase />);
    const net = MOCK_CASHFLOW.income - MOCK_CASHFLOW.expense;
    expect(screen.getByText("Net this month")).toBeInTheDocument();
    expect(screen.getAllByText(formatRupiah(net))).not.toHaveLength(0);
  });

  it("renders the spending streams chart with mock data", () => {
    render(<Showcase />);
    expect(screen.getAllByText("Spending Streams")).not.toHaveLength(0);
    expect(screen.getAllByText("December 2026")).not.toHaveLength(0);
    expect(screen.getAllByText("Food & Drink")).not.toHaveLength(0);
  });

  it("renders the growth chart totals from the mock data", () => {
    render(<Showcase />);
    expect(screen.getByText(formatRupiah(MOCK_GROWTH.currentTotal))).toBeInTheDocument();
  });

  it("anchors the budgets and insights rows", () => {
    const { container } = render(<Showcase />);
    expect(container.querySelector("#showcase-budgets")).not.toBeNull();
    expect(container.querySelector("#insights")).not.toBeNull();
  });
});
