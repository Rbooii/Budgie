import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AssetGrowthCard from "@/components/asset-growth-card";

const defaultProps = {
  year: 2026,
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

  it("renders the hero number (currentTotal)", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    expect(screen.getByText(/Rp.*1\.050\.000/)).toBeInTheDocument();
  });

  it("renders a YTD percentage pill", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    expect(screen.getByText(/YTD/)).toBeInTheDocument();
  });

  it("shows a positive YTD pill when currentTotal > startingValue", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    const pill = screen.getByText(/YTD/);
    expect(pill.className.includes("text-[#1F9B29]")).true;
  });

  it("shows a negative YTD pill when currentTotal < startingValue", () => {
    render(
      <AssetGrowthCard
        {...defaultProps}
        startingValue={2000000}
        currentTotal={1000000}
        data={[{ month: 0, value: 1000000 }]}
      />,
    );
    const pill = screen.getByText(/YTD/);
    expect(pill.className.includes("text-[#D8000C]")).true;
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

  it("renders the legend when hasTransactions is true", () => {
    render(<AssetGrowthCard {...defaultProps} />);
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
    expect(screen.getByText("Decline")).toBeInTheDocument();
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
