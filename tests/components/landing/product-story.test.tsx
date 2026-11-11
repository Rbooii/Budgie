import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
} from "@/test-utils/browser-mocks";
import { ProductStory } from "@/components/landing/product-story";

describe("ProductStory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the section heading and all three steps", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    render(<ProductStory />);
    expect(screen.getByText("See it work.")).toBeInTheDocument();
    expect(screen.getAllByText("See your balance.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Give the month a shape.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("See where it went.").length).toBeGreaterThan(0);
  });

  it("renders the real app components, not fake live cards", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    render(<ProductStory />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Monthly budget")).toBeInTheDocument();
    expect(screen.getByText("Spending Streams")).toBeInTheDocument();
    expect(screen.getByText("This Month's Cashflow")).toBeInTheDocument();
  });

  it("keeps the balance privacy toggle from the real component", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    render(<ProductStory />);
    expect(screen.getByRole("button", { name: "Show balance" })).toBeInTheDocument();
  });

  it("makes every showcase panel non-interactive", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    const { container } = render(<ProductStory />);
    const sheets = container.querySelectorAll(".paper-sheet");
    expect(sheets).toHaveLength(3);
    sheets.forEach((sheet) => {
      expect(sheet).toHaveAttribute("inert");
    });
  });

  it("reveals the real balance once without a click", async () => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    render(<ProductStory />);
    expect(
      await screen.findByRole("button", { name: "Hide balance" }),
    ).toBeInTheDocument();
  });

  it("does not show the removed deck copy", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    render(<ProductStory />);
    expect(
      screen.queryByText("Real screens from Budgie, not a mockup."),
    ).not.toBeInTheDocument();
  });
});
