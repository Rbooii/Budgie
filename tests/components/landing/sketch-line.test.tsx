import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SketchLine } from "@/components/landing/sketch-line";

describe("SketchLine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a labelled line chart with a target line", () => {
    render(
      <SketchLine
        values={[3.2, 3.8, 4.1, 4.9, 5.6, 6.1]}
        target={7}
        targetLabel="target"
        startLabel="12 months ago"
        endLabel="now"
        ariaLabel="Savings history"
      />,
    );
    expect(screen.getByRole("img", { name: "Savings history" })).toBeInTheDocument();
    expect(screen.getByText("target")).toBeInTheDocument();
    expect(screen.getByText("12 months ago")).toBeInTheDocument();
    expect(screen.getByText("now")).toBeInTheDocument();
  });

  it("draws the line with a sketch reveal and no paper grid", () => {
    const { container } = render(
      <SketchLine values={[1, 2, 3, 4]} ariaLabel="Balance history" />,
    );
    expect(container.querySelector("path")).not.toBeNull();
    expect(container.querySelectorAll("line")).toHaveLength(1);
    expect(container.querySelector("circle")).not.toBeNull();
    expect(container.querySelector(".sketch-reveal")).not.toBeNull();
  });

  it("does not use a decorative image", () => {
    const { container } = render(
      <SketchLine values={[1, 2, 3]} ariaLabel="Balance history" />,
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
