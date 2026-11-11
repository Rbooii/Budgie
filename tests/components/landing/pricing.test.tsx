import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pricing } from "@/components/landing/pricing";

describe("Pricing", () => {
  it("renders the honest section heading", () => {
    render(<Pricing />);
    expect(
      screen.getByText("Free to use. Plus if you want to keep it going."),
    ).toBeInTheDocument();
  });

  it("shows the Free tier with Rp 0.00 and every feature", () => {
    render(<Pricing />);
    expect(screen.getByText("Rp 0.00")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(
      screen.getByText(/Every Budgie feature: accounts, transactions, budgets/),
    ).toBeInTheDocument();
  });

  it("shows the Plus first-month price and the regular price", () => {
    render(<Pricing />);
    expect(screen.getByText("Rp 24.500.00")).toBeInTheDocument();
    const regular = screen.getByText("Rp 49.000.00");
    expect(regular).toBeInTheDocument();
    expect(regular.className).toContain("line-through");
    expect(
      screen.getByText("First month, then Rp 49.000.00 per month."),
    ).toBeInTheDocument();
  });

  it("only claims what Plus actually gives you", () => {
    render(<Pricing />);
    expect(screen.getByText("A Plus badge on your profile")).toBeInTheDocument();
    expect(screen.getByText("Support independent development")).toBeInTheDocument();
    expect(screen.getByText("Cancel anytime. No lock-in.")).toBeInTheDocument();
  });

  it("does not repeat the old fake gated perks", () => {
    render(<Pricing />);
    expect(screen.queryByText("Up to 3 accounts")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unlimited accounts, budgets, and subscriptions"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Asset-growth and cashflow insights")).not.toBeInTheDocument();
    expect(screen.queryByText("Priority PDF exports")).not.toBeInTheDocument();
  });

  it("links both CTAs to /sign-in", () => {
    render(<Pricing />);
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Support Budgie" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
