import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { stubIntersectionObserver } from "@/test-utils/browser-mocks";
import { Reveal } from "@/components/landing/reveal";

describe("Reveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders its children hidden by default", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    const el = screen.getByText("Hello");
    expect(el.className).toContain("opacity-0");
    expect(el.className).toContain("blur-sm");
  });

  it("reveals its children once intersecting", () => {
    const io = stubIntersectionObserver();
    const { container } = render(<Reveal>Hello</Reveal>);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const el = screen.getByText("Hello");
    expect(el.className).toContain("opacity-100");
    expect(el.className).not.toContain("blur-sm");
  });

  it("does nothing when IntersectionObserver is unavailable", () => {
    const { container } = render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello").className).toContain("opacity-0");
    expect(container.firstElementChild?.className).toContain("opacity-0");
  });

  it("applies the transition delay when visible", () => {
    const io = stubIntersectionObserver();
    const { container } = render(<Reveal delay={120}>Hello</Reveal>);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const el = screen.getByText("Hello") as HTMLElement;
    expect(el.style.transitionDelay).toBe("120ms");
  });

  it("keeps the delay at 0ms while hidden", () => {
    render(<Reveal delay={120}>Hello</Reveal>);
    const el = screen.getByText("Hello") as HTMLElement;
    expect(el.style.transitionDelay).toBe("0ms");
  });

  it("honors the as prop for the wrapper element", () => {
    render(<Reveal as="section">Hello</Reveal>);
    expect(screen.getByText("Hello").tagName).toBe("SECTION");
  });

  it("merges custom classes with the state classes", () => {
    const io = stubIntersectionObserver();
    const { container } = render(<Reveal className="my-custom">Hello</Reveal>);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.className).toContain("my-custom");
    act(() => io.trigger(wrap, true));
    expect(wrap.className).toContain("my-custom");
    expect(wrap.className).toContain("opacity-100");
  });
});
