import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureGrid } from "@/components/landing/feature-grid";

const FEATURES = [
  "Transactions",
  "Budgets",
  "Subscriptions",
  "Multiple accounts",
  "Insights",
  "Privacy first",
] as const;

const DESCRIPTIONS = [
  "Log income, expenses, and transfers.",
  "Set category-level spending limits",
  "Track recurring charges",
  "Bank, e-wallet, and cash accounts",
  "Cashflow donuts, asset-growth bars",
  "Balances hide by default",
] as const;

describe("FeatureGrid", () => {
  it("renders the section heading and kicker", () => {
    render(<FeatureGrid />);
    expect(screen.getByText("Everything in one place")).toBeInTheDocument();
    expect(screen.getByText("A calm home for your money")).toBeInTheDocument();
  });

  it("renders all six feature titles", () => {
    render(<FeatureGrid />);
    for (const title of FEATURES) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders every feature description", () => {
    render(<FeatureGrid />);
    for (const desc of DESCRIPTIONS) {
      expect(
        screen.getByText((text) => text.startsWith(desc)),
      ).toBeInTheDocument();
    }
  });

  it("anchors the section at #features", () => {
    const { container } = render(<FeatureGrid />);
    const section = container.querySelector("#features");
    expect(section).not.toBeNull();
  });
});
