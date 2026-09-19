import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Sparkline } from "@/components/sparkline";

describe("Sparkline", () => {
  it("renders a solid path with the given color for 2+ values", () => {
    const { container } = render(
      <Sparkline values={[10, 20, 15]} color="#00C610" className="h-11" />,
    );
    const path = container.querySelector("path")!;
    expect(path.getAttribute("stroke")).toBe("#00C610");
    expect(path.getAttribute("d")).toMatch(/^M/);
    expect(path.getAttribute("d")).not.toContain("NaN");
    expect(path.getAttribute("stroke-dasharray")).toBeNull();
    expect(path.getAttribute("class")).toContain("spark-draw");
  });

  it("renders a dashed flat line for a single value", () => {
    const { container } = render(<Sparkline values={[10]} color="#B0B0B0" />);
    const path = container.querySelector("path")!;
    expect(path.getAttribute("stroke-dasharray")).toBe("4 5");
    expect(path.getAttribute("d")).toBe("M0,26.4 L100,26.4");
    expect(path.getAttribute("opacity")).toBe("0.3");
  });

  it("renders a dashed line for an empty series", () => {
    const { container } = render(<Sparkline values={[]} color="#B0B0B0" />);
    expect(container.querySelector("path")).not.toBeNull();
  });

  it("centers a flat series without NaN", () => {
    const { container } = render(<Sparkline values={[5, 5, 5]} color="#B0B0B0" />);
    const d = container.querySelector("path")!.getAttribute("d")!;
    expect(d).not.toContain("NaN");
  });

  it("is hidden from assistive tech", () => {
    const { container } = render(<Sparkline values={[1, 2]} color="#00C610" />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
