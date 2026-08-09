import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TiltCard } from "@/components/landing/tilt";

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

describe("TiltCard", () => {
  it("renders its children", () => {
    render(<TiltCard>Preview</TiltCard>);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("wraps the child in a perspective container", () => {
    const { container } = render(<TiltCard>Preview</TiltCard>);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.style.perspective).toBe("1200px");
  });

  it("tilts toward the cursor on pointer move", () => {
    const { container } = render(<TiltCard>Preview</TiltCard>);
    const wrap = container.firstElementChild as HTMLElement;
    const inner = wrap.firstElementChild as HTMLElement;
    stubRect(wrap, 200, 100);
    // cursor at 75% x, 75% y → rotateX = (0.5-0.75)*12 = -3deg, rotateY = (0.75-0.5)*12 = 3deg
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 150,
      clientY: 75,
    });
    expect(wrap.style.getPropertyValue("--tilt-x")).toBe("-3.00deg");
    expect(wrap.style.getPropertyValue("--tilt-y")).toBe("3.00deg");
    expect(wrap.style.getPropertyValue("--tilt-scale")).toBe("1.015");
    // the inner transform consumes the CSS vars (jsdom does not resolve them)
    expect(inner.style.transform).toContain("rotateX(var(--tilt-x, 0deg))");
    expect(inner.style.transform).toContain("rotateY(var(--tilt-y, 0deg))");
    expect(inner.style.transform).toContain("scale(var(--tilt-scale, 1))");
  });

  it("tilts toward the other corner from the top-left", () => {
    const { container } = render(<TiltCard>Preview</TiltCard>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 200, 100);
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 50,
      clientY: 25,
    });
    expect(wrap.style.getPropertyValue("--tilt-x")).toBe("3.00deg");
    expect(wrap.style.getPropertyValue("--tilt-y")).toBe("-3.00deg");
  });

  it("resets the tilt on pointer leave", () => {
    const { container } = render(<TiltCard>Preview</TiltCard>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 200, 100);
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 150,
      clientY: 75,
    });
    fireEvent.pointerLeave(wrap);
    expect(wrap.style.getPropertyValue("--tilt-x")).toBe("0deg");
    expect(wrap.style.getPropertyValue("--tilt-y")).toBe("0deg");
    expect(wrap.style.getPropertyValue("--tilt-scale")).toBe("1");
  });

  it("ignores touch pointers", () => {
    const { container } = render(<TiltCard>Preview</TiltCard>);
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 200, 100);
    fireEvent.pointerMove(wrap, {
      pointerType: "touch",
      clientX: 150,
      clientY: 75,
    });
    expect(wrap.style.getPropertyValue("--tilt-x")).toBe("");
  });

  it("respects custom maxTilt and hoverScale", () => {
    const { container } = render(
      <TiltCard maxTilt={10} hoverScale={1.05}>
        Preview
      </TiltCard>,
    );
    const wrap = container.firstElementChild as HTMLElement;
    stubRect(wrap, 200, 100);
    fireEvent.pointerMove(wrap, {
      pointerType: "mouse",
      clientX: 200,
      clientY: 100,
    });
    expect(wrap.style.getPropertyValue("--tilt-x")).toBe("-10.00deg");
    expect(wrap.style.getPropertyValue("--tilt-y")).toBe("10.00deg");
    expect(wrap.style.getPropertyValue("--tilt-scale")).toBe("1.05");
  });
});
