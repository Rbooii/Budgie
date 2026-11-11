import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
  stubRequestAnimationFrame,
} from "@/test-utils/browser-mocks";
import { NaniteField } from "@/components/landing/nanite-field";

const context = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  setTransform: vi.fn(),
  globalAlpha: 1,
  fillStyle: "",
  strokeStyle: "",
};

describe("NaniteField", () => {
  beforeEach(() => {
    for (const value of Object.values(context)) {
      if (typeof value === "function" && "mockClear" in value) {
        value.mockClear();
      }
    }
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a decorative canvas", () => {
    stubMatchMedia(false);
    const { container } = render(<NaniteField className="h-full w-full" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });

  it("draws a static field under reduced motion", () => {
    stubMatchMedia(true);
    stubIntersectionObserver();
    const raf = stubRequestAnimationFrame();

    render(<NaniteField />);

    expect(context.arc).toHaveBeenCalled();
    expect(raf.callbacks).toHaveLength(0);
  });

  it("starts the animation when the canvas enters the viewport", () => {
    stubMatchMedia(false);
    const io = stubIntersectionObserver();
    const raf = stubRequestAnimationFrame();

    const { container } = render(<NaniteField />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    io.trigger(canvas as Element, true);

    expect(raf.callbacks.length).toBeGreaterThan(0);
  });
});
