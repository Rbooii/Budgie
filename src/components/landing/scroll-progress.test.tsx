import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  stubMatchMedia,
  setViewport,
  setWindowScrollY,
} from "@/test-utils/browser-mocks";
import { ScrollProgress } from "@/components/landing/scroll-progress";

function renderScrollProgress() {
  return render(<ScrollProgress />);
}

function barWidth(): string {
  const bar = document.querySelector(".fixed.top-0") as HTMLElement;
  return bar.style.width;
}

describe("ScrollProgress", () => {
  beforeEach(() => {
    // run rAF callbacks synchronously so scroll updates are immediate
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts at 0% width", () => {
    stubMatchMedia(false);
    setViewport(800, 2000);
    setWindowScrollY(0);
    renderScrollProgress();
    expect(barWidth()).toBe("0%");
  });

  it("does not react to scrolling under reduced motion", () => {
    stubMatchMedia(true);
    setViewport(800, 2000);
    setWindowScrollY(0);
    renderScrollProgress();
    fireEvent.scroll(window);
    expect(barWidth()).toBe("0%");
  });

  it("updates the width from the scroll position", () => {
    stubMatchMedia(false);
    setViewport(800, 2000);
    setWindowScrollY(0);
    renderScrollProgress();
    // scrollable = scrollHeight - innerHeight = 1200
    setWindowScrollY(600);
    fireEvent.scroll(window);
    expect(barWidth()).toBe("50%");
  });

  it("clamps the width to 100% when scrolled past the bottom", () => {
    stubMatchMedia(false);
    setViewport(800, 2000);
    setWindowScrollY(0);
    renderScrollProgress();
    setWindowScrollY(99999);
    fireEvent.scroll(window);
    expect(barWidth()).toBe("100%");
  });

  it("stays at 0% when the page cannot scroll", () => {
    stubMatchMedia(false);
    setViewport(800, 800); // scrollHeight === innerHeight → no scrollable area
    setWindowScrollY(0);
    renderScrollProgress();
    setWindowScrollY(400);
    fireEvent.scroll(window);
    expect(barWidth()).toBe("0%");
  });

  it("recomputes on resize", () => {
    stubMatchMedia(false);
    setViewport(800, 2000);
    setWindowScrollY(0);
    renderScrollProgress();
    setWindowScrollY(300);
    setViewport(1000, 2000); // scrollable becomes 1000 → 30%
    fireEvent.resize(window);
    expect(barWidth()).toBe("30%");
  });

  it("recomputes immediately on mount (initial scroll position)", () => {
    stubMatchMedia(false);
    setViewport(800, 2000);
    setWindowScrollY(900);
    act(() => renderScrollProgress());
    expect(barWidth()).toBe("75%");
  });

  it("marks the bar as decorative", () => {
    stubMatchMedia(false);
    setViewport(800, 2000);
    setWindowScrollY(0);
    const { container } = renderScrollProgress();
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
