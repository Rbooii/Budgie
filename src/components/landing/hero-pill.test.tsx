import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { HeroPill } from "@/components/landing/hero-pill";

/**
 * The offscreen word measurer duplicates the visible label's text, so every
 * word query uses `getAllByText` (first hit = the visible label).
 */
function visibleWord(word: string): HTMLElement {
  return screen.getAllByText(word)[0];
}

describe("HeroPill", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders the first word in a pastel capsule with a colored dot", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroPill />);
    expect(screen.getAllByText("works").length).toBeGreaterThan(0);
    const dot = container.querySelector("span[aria-hidden='true']") as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.style.backgroundColor).toBe("rgb(26, 174, 57)");
  });

  it("uses Notion proportions (0.75em of the title, medium, rounded-rect)", () => {
    stubMatchMedia(false);
    render(<HeroPill />);
    const label = visibleWord("works");
    const pill = label.parentElement?.parentElement as HTMLElement;
    expect(pill.className).toContain("text-[0.75em]");
    expect(pill.className).toContain("font-medium");
    expect(pill.className).toContain("rounded-[0.22em]");
    expect(pill.style.backgroundColor).toBe("rgb(208, 244, 216)");
  });

  it("rotates to the next word after the interval", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<HeroPill />);
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(visibleWord("grows")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(visibleWord("rests")).toBeInTheDocument();
  });

  it("wraps back around to the first word", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<HeroPill />);
    act(() => {
      vi.advanceTimersByTime(2200 * 5);
    });
    expect(visibleWord("works")).toBeInTheDocument();
  });

  it("stays static under reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<HeroPill />);
    act(() => {
      vi.advanceTimersByTime(2200 * 5);
    });
    const label = visibleWord("works");
    const pill = label.parentElement?.parentElement as HTMLElement;
    expect(pill.style.backgroundColor).toBe("rgb(208, 244, 216)");
  });

  it("measures every word offscreen for the width animation", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroPill />);
    const hidden = container.querySelectorAll("span[aria-hidden='true']");
    const measurer = hidden[1] as HTMLElement;
    const words = Array.from(measurer.children);
    expect(words.map((w) => w.textContent)).toEqual([
      "works",
      "grows",
      "rests",
      "flows",
      "stays",
    ]);
  });

  it("defines the word-swap keyframes gated by motion-reduce", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroPill />);
    const styleTag = container.querySelector("style") as HTMLElement;
    expect(styleTag.textContent).toContain("@keyframes heroPillWord");
    const label = visibleWord("works");
    expect(label.className).toContain("animate-[heroPillWord_0.2s_ease-out]");
    expect(label.className).toContain("motion-reduce:animate-none");
  });
});
