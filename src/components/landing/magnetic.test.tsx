import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Magnetic } from "@/components/landing/magnetic";

function stubRect(el: HTMLElement, width: number, height: number) {
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      width,
      height,
      toJSON: () => ({}),
    }),
  });
}

describe("Magnetic", () => {
  it("renders its children", () => {
    render(<Magnetic>Get started</Magnetic>);
    expect(screen.getByText("Get started")).toBeInTheDocument();
  });

  it("applies a gentle transform toward the cursor", () => {
    const { container } = render(<Magnetic>Get started</Magnetic>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 120, 40);
    // cursor just right of center → pull right; pull factor = min(1, dist/120)
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 80,
      clientY: 20,
    });
    const x = wrap.style.getPropertyValue("--mag-x");
    const y = wrap.style.getPropertyValue("--mag-y");
    expect(Number.parseFloat(x)).toBeGreaterThan(0);
    expect(Number.parseFloat(x)).toBeLessThanOrEqual(4);
    expect(Number.parseFloat(y)).toBe(0);
    expect(wrap.style.transform).toContain("translate(");
  });

  it("caps the pull at the configured strength", () => {
    const { container } = render(<Magnetic strength={4}>Get started</Magnetic>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 120, 40);
    // far outside the center → pull factor 1 → displacement vector length = 4
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 1000,
      clientY: 500,
    });
    const nx = Number.parseFloat(wrap.style.getPropertyValue("--mag-x"));
    const ny = Number.parseFloat(wrap.style.getPropertyValue("--mag-y"));
    // values are rounded to 2 decimals, so allow 2-decimal precision
    expect(Math.hypot(nx, ny)).toBeCloseTo(4, 2);
  });

  it("pulls harder with a larger strength", () => {
    const { container } = render(<Magnetic strength={8}>Get started</Magnetic>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 120, 40);
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 1000,
      clientY: 500,
    });
    const nx = Number.parseFloat(wrap.style.getPropertyValue("--mag-x"));
    const ny = Number.parseFloat(wrap.style.getPropertyValue("--mag-y"));
    expect(Math.hypot(nx, ny)).toBeCloseTo(8, 2);
  });

  it("resets on pointer leave", () => {
    const { container } = render(<Magnetic>Get started</Magnetic>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 120, 40);
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 80,
      clientY: 20,
    });
    fireEvent.pointerLeave(wrap);
    expect(wrap.style.getPropertyValue("--mag-x")).toBe("0px");
    expect(wrap.style.getPropertyValue("--mag-y")).toBe("0px");
  });

  it("ignores touch pointers", () => {
    const { container } = render(<Magnetic>Get started</Magnetic>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 120, 40);
    fireEvent.pointerMove(wrap, {
      pointerType: "touch",
      clientX: 80,
      clientY: 20,
    });
    expect(wrap.style.getPropertyValue("--mag-x")).toBe("");
  });
});
