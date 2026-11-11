import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorialSection } from "@/components/landing/editorial-section";

describe("EditorialSection", () => {
  it("renders the pull statement and body", () => {
    render(<EditorialSection />);
    expect(
      screen.getByText("Saving is easier when you can see the line move."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Set a target, add what you can/),
    ).toBeInTheDocument();
  });

  it("uses a savings line chart, not an abstract image", () => {
    const { container } = render(<EditorialSection />);
    expect(
      screen.getByRole("img", {
        name: "Savings history line chart with a target line",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
