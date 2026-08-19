import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { HeroHeadline } from "@/components/landing/hero-headline";

describe("HeroHeadline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Notion-style headline with the rotating pill", () => {
    stubMatchMedia(false);
    render(<HeroHeadline />);
    expect(screen.getByText("Where your money")).toBeInTheDocument();
    expect(screen.getAllByText("works").length).toBeGreaterThan(0);
  });

  it("uses Notion's exact hero title typography (clamp size, semibold, tight tracking)", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroHeadline />);
    const h1 = container.querySelector("h1") as HTMLElement;
    expect(h1.className).toContain("text-[clamp(2.625rem,11.25vw-25.5px,6rem)]");
    expect(h1.className).toContain("font-semibold");
    expect(h1.className).toContain("leading-[clamp(3rem,10.83vw-17px,6.25rem)]");
    expect(h1.className).toContain("tracking-[clamp(-0.2875rem,-0.6458vw+2.375px,-0.09375rem)]");
  });

  it("animates each line with a staggered mask reveal", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroHeadline />);
    const lines = container.querySelectorAll(".overflow-hidden.block > span");
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.className).toContain("animate-[headlineReveal");
      expect(line.className).toContain("motion-reduce:animate-none");
    }
  });

  it("delays the second line so the reveal staggers", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroHeadline />);
    const lines = container.querySelectorAll(".overflow-hidden.block > span");
    expect(lines[0].className).not.toContain("0.08s");
    expect(lines[1].className).toContain("0.08s");
  });

  it("defines the reveal keyframes", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroHeadline />);
    const styleTags = container.querySelectorAll("style");
    const css = Array.from(styleTags).map((s) => s.textContent).join("\n");
    expect(css).toContain("@keyframes headlineReveal");
  });
});
