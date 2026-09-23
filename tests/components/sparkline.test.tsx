import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { Sparkline } from "@/components/sparkline";
import { stubResizeObserver } from "@/test-utils/browser-mocks";

afterEach(() => {
  vi.unstubAllGlobals();
});

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
  });

  it("never uses a dash-based draw (regression: dotted sparkline)", () => {
    const { container } = render(
      <Sparkline values={[10, 20, 15]} color="#00C610" />,
    );
    const svg = container.querySelector("svg")!;
    const path = svg.querySelector("path")!;
    expect(svg.getAttribute("class")).toContain("spark-reveal");
    expect(svg.hasAttribute("pathLength")).toBe(false);
    expect(path.hasAttribute("pathLength")).toBe(false);
    expect(path.getAttribute("vector-effect")).toBeNull();
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

  it("redraws in the measured container width", () => {
    const ro = stubResizeObserver();
    const { container } = render(
      <Sparkline values={[10, 20]} color="#00C610" className="h-11" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      width: 240,
    } as DOMRect);
    act(() => ro.trigger(wrapper));

    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 240 44");
    expect(container.querySelector("path")!.getAttribute("d")).toContain("237.50");
  });

  it("is hidden from assistive tech", () => {
    const { container } = render(<Sparkline values={[1, 2]} color="#00C610" />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
