import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearnSection } from "@/components/landing/learn-section";

describe("LearnSection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the literacy heading, body, and a static note", () => {
    render(<LearnSection />);
    expect(screen.getByText("Money words, made plain.")).toBeInTheDocument();
    expect(
      screen.getByText(/Short notes on emergency funds/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/An emergency fund is usually three to six months/),
    ).toBeInTheDocument();
  });

  it("uses a spending line chart, not an abstract image", () => {
    const { container } = render(<LearnSection />);
    expect(
      screen.getByRole("img", {
        name: "Spending line chart against a budget line",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
