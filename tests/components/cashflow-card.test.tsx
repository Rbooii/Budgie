import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CashflowCard from "@/components/cashflow-card";
import { BalanceVisibilityProvider } from "@/components/balance-visibility";

describe("CashflowCard", () => {
  it("renders the title", () => {
    render(<CashflowCard title="This Month" date="July 2026" income={1000} expense={500} />);
    expect(screen.getByText("This Month")).toBeInTheDocument();
  });

  it("renders the date", () => {
    render(<CashflowCard title="T" date="July 2026" income={1000} expense={500} />);
    expect(screen.getByText("July 2026")).toBeInTheDocument();
  });

  it("shows the signed net in Rupiah", () => {
    render(<CashflowCard title="T" date="D" income={3000000} expense={1000000} />);
    expect(screen.getByText("+Rp 2.000.000.00")).toBeInTheDocument();
  });

  it("shows a negative net when expense > income", () => {
    render(<CashflowCard title="T" date="D" income={500000} expense={1500000} />);
    expect(screen.getByText("-Rp 1.000.000.00")).toBeInTheDocument();
  });

  it("renders income and expense rows without status dots", () => {
    const { container } = render(
      <CashflowCard title="T" date="D" income={1000} expense={500} />,
    );
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
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
    expect(screen.getAllByText("0%")).toHaveLength(2);
  });

  it("renders a quiet placeholder ring when nothing moved", () => {
    const { container } = render(
      <CashflowCard title="T" date="D" income={0} expense={0} />,
    );
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
    expect(circles[0].getAttribute("stroke")).toBe("var(--chart-placeholder)");
  });

  it("leaves a visible gap between the income and expense arcs", () => {
    const { container } = render(
      <CashflowCard title="T" date="D" income={750} expense={250} />,
    );
    const income = Array.from(container.querySelectorAll("circle")).find(
      (circle) => circle.getAttribute("stroke") === "var(--income)",
    );
    const dash = Number(
      income?.getAttribute("stroke-dasharray")?.split(" ")[0],
    );
    // 75% of the ring minus the 26px dash space: a 10px visible hole plus the
    // 16px the round caps paint past each end.
    expect(dash).toBeCloseTo(0.75 * 2 * Math.PI * 64 - 26, 3);
  });

  it("masks the net and both amounts when balance visibility is hidden", () => {
    const { container } = render(
      <BalanceVisibilityProvider>
        <CashflowCard title="T" date="D" income={3000000} expense={1000000} />
      </BalanceVisibilityProvider>,
    );
    expect(container.textContent).not.toContain("2.000.000");
    expect(container.textContent).not.toContain("3.000.000");
    expect(container.textContent).not.toContain("1.000.000");
    expect(container.textContent).toContain("•");
  });

  it("shows values outside a visibility provider", () => {
    render(<CashflowCard title="T" date="D" income={1000} expense={500} />);
    expect(screen.getByText("Rp 1.000.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 500.00")).toBeInTheDocument();
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
