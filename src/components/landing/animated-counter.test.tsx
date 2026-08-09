import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
  stubRequestAnimationFrame,
  type IOController,
} from "@/test-utils/browser-mocks";
import { AnimatedCounter } from "@/components/landing/animated-counter";

describe("AnimatedCounter", () => {
  let io: IOController;

  beforeEach(() => {
    io = stubIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts at 0", () => {
    render(<AnimatedCounter value={18650000} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("stays at 0 when IntersectionObserver is unavailable", () => {
    vi.unstubAllGlobals();
    const { container } = render(<AnimatedCounter value={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    const wrap = container.firstElementChild as HTMLElement;
    io.trigger(wrap, true);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("jumps straight to the final value under reduced motion", () => {
    stubMatchMedia(true);
    const { container } = render(<AnimatedCounter value={18650000} />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    expect(screen.getByText("18.650.000")).toBeInTheDocument();
  });

  it("animates towards the final value with eased frames", () => {
    stubMatchMedia(false);
    const raf = stubRequestAnimationFrame();
    const { container } = render(<AnimatedCounter value={1000} duration={1000} />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    // first frame: t=0 → display 0
    act(() => raf.tickAll(0));
    expect(screen.getByText("0")).toBeInTheDocument();
    // halfway: t=0.5 → eased = 1 - 0.5^3 = 0.875 → display 875 (still animating)
    act(() => raf.tickAll(500));
    expect(screen.getByText("875")).toBeInTheDocument();
    // final: t=1 → exact value, no further frames scheduled
    act(() => raf.tickAll(1000));
    expect(screen.getByText("1.000")).toBeInTheDocument();
    expect(raf.callbacks).toHaveLength(0);
  });

  it("applies prefix, suffix and decimals formatting", () => {
    stubMatchMedia(true);
    const { container } = render(
      <AnimatedCounter
        value={18650000}
        prefix="Rp\u00A0"
        suffix="+"
        decimals={2}
      />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    // matcher receives normalized text; NBSP is collapsed so match loosely
    expect(
      screen.getByText((text) => text.includes("18.650.000,00") && text.includes("+")),
    ).toBeInTheDocument();
  });

  it("observes once and unobserves after intersecting", () => {
    const { container } = render(<AnimatedCounter value={10} />);
    const wrap = container.firstElementChild as HTMLElement;
    const inst = io.instances[0];
    expect(inst.observed).toContain(wrap);
    act(() => io.trigger(wrap, true));
    expect(inst.observed).not.toContain(wrap);
  });

  it("cancels the animation frame on cleanup", () => {
    stubMatchMedia(false);
    const raf = stubRequestAnimationFrame();
    const { container, unmount } = render(
      <AnimatedCounter value={100} duration={1000} />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    unmount();
    expect(raf.cancelSpy).toHaveBeenCalled();
  });
});
