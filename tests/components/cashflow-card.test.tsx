import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CashflowCard from "@/components/cashflow-card";

describe("CashflowCard", () => {
  it("renders the title", () => {
    render(<CashflowCard title="This Month" date="July 2026" income={1000} expense={500} />);
    expect(screen.getByText("This Month")).toBeInTheDocument();
  });

  it("renders the date", () => {
    render(<CashflowCard title="T" date="July 2026" income={1000} expense={500} />);
    expect(screen.getByText("July 2026")).toBeInTheDocument();
  });

  it("computes net as income - expense and shows it in millions", () => {
    render(<CashflowCard title="T" date="D" income={3000000} expense={1000000} />);
    expect(screen.getByText(/\+.*2\.0 mil/)).toBeInTheDocument();
  });

  it("shows negative net when expense > income", () => {
    render(<CashflowCard title="T" date="D" income={500000} expense={1500000} />);
    expect(screen.getByText(/-.*1\.0 mil/)).toBeInTheDocument();
  });

  it("shows income percentage", () => {
    render(<CashflowCard title="T" date="D" income={750} expense={250} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("shows expense percentage", () => {
    render(<CashflowCard title="T" date="D" income={750} expense={250} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("handles zero income and zero expense (0% income, 0% expense)", () => {
    render(<CashflowCard title="T" date="D" income={0} expense={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders an SVG donut chart", () => {
    const { container } = render(
      <CashflowCard title="T" date="D" income={1000} expense={500} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the Income label and Expense label", () => {
    render(<CashflowCard title="T" date="D" income={1000} expense={500} />);
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
  });

  it("uses default props when none provided", () => {
    render(<CashflowCard />);
    expect(screen.getByText("Today's Cashflow")).toBeInTheDocument();
  });
});
