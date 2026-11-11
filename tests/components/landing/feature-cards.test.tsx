import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureCards } from "@/components/landing/feature-cards";

describe("FeatureCards", () => {
  it("renders the section heading and three product cards", () => {
    render(<FeatureCards />);
    expect(screen.getByText("Balance, budget, and the next step.")).toBeInTheDocument();
    expect(screen.getByText("Every account, one line.")).toBeInTheDocument();
    expect(screen.getByText("Savings, in motion.")).toBeInTheDocument();
    expect(screen.getByText("Spending, without the guesswork.")).toBeInTheDocument();
  });

  it("uses three sketch line charts instead of abstract images", () => {
    const { container } = render(<FeatureCards />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("keeps the AI-slop badges out", () => {
    render(<FeatureCards />);
    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample data")).not.toBeInTheDocument();
    expect(screen.queryByText("Fig. 01")).not.toBeInTheDocument();
  });
});
