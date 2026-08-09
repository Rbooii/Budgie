import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroHeadline } from "@/components/landing/hero-headline";

describe("HeroHeadline", () => {
  it("renders both headline lines", () => {
    render(<HeroHeadline />);
    expect(screen.getByText("Your money,")).toBeInTheDocument();
    expect(screen.getByText("Control")).toBeInTheDocument();
  });

  it("accents 'Control' in brand green", () => {
    render(<HeroHeadline />);
    const accent = screen.getByText("Control");
    expect(accent.className).toContain("text-[#00C610]");
  });

  it("keeps the leading and size classes from the hero spec", () => {
    const { container } = render(<HeroHeadline />);
    const h1 = container.querySelector("h1") as HTMLElement;
    expect(h1.className).toContain("text-4xl");
    expect(h1.className).toContain("lg:text-6xl");
    expect(h1.className).toContain("leading-[1.05]");
  });

  it("animates each line with a staggered mask reveal", () => {
    const { container } = render(<HeroHeadline />);
    const lines = container.querySelectorAll(".overflow-hidden > span");
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.className).toContain("animate-[headlineReveal");
      expect(line.className).toContain("motion-reduce:animate-none");
    }
  });

  it("delays the second line so the reveal staggers", () => {
    const { container } = render(<HeroHeadline />);
    const lines = container.querySelectorAll(".overflow-hidden > span");
    expect(lines[0].className).not.toContain("0.08s");
    expect(lines[1].className).toContain("0.08s");
  });

  it("defines the reveal keyframes", () => {
    const { container } = render(<HeroHeadline />);
    const styleTag = container.querySelector("style") as HTMLElement;
    expect(styleTag.textContent).toContain("@keyframes headlineReveal");
  });
});
