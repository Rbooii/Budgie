import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AssetGrowthCard from "@/components/asset-growth-card";

const SHORT_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL_LABELS = [
  "January 2026",
  "February 2026",
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
];

const defaultProps = {
  shortLabels: SHORT_LABELS,
  fullLabels: FULL_LABELS,
  rangeLabel: "2026",
  changeLabel: "YTD",
  data: [
    { month: 0, value: 1000000 },
    { month: 1, value: 1100000 },
    { month: 2, value: 1050000 },
  ],
  startingValue: 900000,
  currentTotal: 1050000,
  currentMonth: 2,
  hasTransactions: true,
  activeMonths: [true, true, true, false, false, false, false, false, false, false, false, false],
};

describe("AssetGrowthCard", () => {
  it("renders the 'Asset Growth' label and year", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    expect(screen.getByText("Asset Growth")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("does not render the Sparkles symbol", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    expect(container.querySelector(".lucide-sparkles")).toBeNull();
  });

  it("renders the signed YTD change", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    expect(screen.getByText("YTD")).toBeInTheDocument();
    expect(screen.getByText("+Rp 150.000.00")).toBeInTheDocument();
  });

  it("shows a positive YTD value in green", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    const value = screen.getByText("+Rp 150.000.00");
    expect(value.className).toContain("text-brand");
  });

  it("shows a negative YTD value in red", () => {
    render(
      <AssetGrowthCard
        {...defaultProps}
        startingValue={2000000}
        currentTotal={1000000}
        data={[{ month: 0, value: 1000000 }]}
      />,
    );
    const value = screen.getByText("-Rp 1.000.000.00");
    expect(value.className).toContain("text-expense");
  });

  it("renders all 12 month slots as single-letter labels", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    const labels = container.querySelectorAll("text");
    expect(labels.length).toBe(12);
    expect(Array.from(labels).map((l) => l.textContent)).toEqual(
      SHORT_LABELS,
    );
  });

  it("renders a 6px placeholder bar for every future month", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects.length).toBe(12);
    const future = rects.filter((r) => r.getAttribute("opacity") === "0.35");
    expect(future.length).toBe(9);
    for (const bar of future) {
      expect(bar.getAttribute("height")).toBe("6");
      expect(bar.getAttribute("fill")).toBe("var(--chart-placeholder)");
    }
  });

  it("scales recorded bars from a zero baseline", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    const rects = Array.from(container.querySelectorAll("rect"));
    const firstBar = rects[0];
    const bottom = Number(firstBar.getAttribute("y")) + Number(firstBar.getAttribute("height"));
    expect(bottom).toBeCloseTo(100, 5);
  });

  it("treats sub-cent month-over-month moves as stable (iOS parity)", () => {
    const { container } = render(
      <AssetGrowthCard
        {...defaultProps}
        data={[
          { month: 0, value: 1000000 },
          { month: 1, value: 1000000.004 },
        ]}
        currentMonth={1}
        activeMonths={[true, true, false, false, false, false, false, false, false, false, false, false]}
      />,
    );
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects[1].getAttribute("fill")).toBe("var(--stagnant)");
  });

  it("ignores hover on future months", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    const groups = Array.from(container.querySelectorAll("g"));
    const future = groups[11];
    future.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(container.querySelector(".absolute")).toBeNull();
  });

  it("shows an empty-state caption when hasTransactions is false", () => {
    render(
      <AssetGrowthCard
        {...defaultProps}
        hasTransactions={false}
        data={[]}
        activeMonths={new Array(12).fill(false)}
      />,
    );
    expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
  });

  it("renders a text-only legend without status dots", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
    expect(screen.getByText("Decline")).toBeInTheDocument();
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
  });

  it("does not render the legend when hasTransactions is false", () => {
    render(
      <AssetGrowthCard
        {...defaultProps}
        hasTransactions={false}
        data={[]}
        activeMonths={new Array(12).fill(false)}
      />,
    );
    expect(screen.queryByText("Growth")).not.toBeInTheDocument();
  });

  it("renders an SVG bar chart", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders bar elements for recorded months", () => {
    const { container } = render(<AssetGrowthCard {...defaultProps} />);
    const bars = container.querySelectorAll("rect");
    expect(bars.length).toBeGreaterThan(0);
  });
});
