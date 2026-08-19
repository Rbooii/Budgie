import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pricing } from "@/components/landing/pricing";

describe("Pricing", () => {
  it("renders the section heading", () => {
    render(<Pricing />);
    expect(screen.getByText("Free forever. Plus when you grow.")).toBeInTheDocument();
  });

  it("shows the Free tier with Rp 0.00 and its perks", () => {
    render(<Pricing />);
    expect(screen.getByText("Rp 0.00")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Up to 3 accounts")).toBeInTheDocument();
    expect(screen.getByText("Unlimited transactions")).toBeInTheDocument();
    expect(screen.getByText("Budgets and subscriptions")).toBeInTheDocument();
  });

  it("shows the Plus first-month price of Rp 24.500.00", () => {
    render(<Pricing />);
    expect(screen.getByText("Rp 24.500.00")).toBeInTheDocument();
    expect(screen.getByText("50% off first month")).toBeInTheDocument();
  });

  it("shows the crossed-out regular price of Rp 49.000.00", () => {
    render(<Pricing />);
    const regular = screen.getByText("Rp 49.000.00");
    expect(regular).toBeInTheDocument();
    expect(regular.className).toContain("line-through");
  });

  it("shows the regular price in the copy line", () => {
    render(<Pricing />);
    expect(screen.getByText("Then Rp 49.000.00 per month. Cancel anytime.")).toBeInTheDocument();
  });

  it("shows every Plus perk", () => {
    render(<Pricing />);
    expect(screen.getByText("Unlimited accounts, budgets, and subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Asset-growth and cashflow insights")).toBeInTheDocument();
    expect(screen.getByText("Priority PDF exports")).toBeInTheDocument();
    expect(screen.getByText("Cancel anytime — no lock-in")).toBeInTheDocument();
  });

  it("links both CTAs to /sign-in", () => {
    render(<Pricing />);
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Get Budgie Plus" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
