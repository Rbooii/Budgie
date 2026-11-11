import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { HeroStatement } from "@/components/landing/hero-statement";

describe("HeroStatement", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders Anthropic's mixed typography as one accessible heading", () => {
    stubMatchMedia(false);
    render(<HeroStatement />);
    const heading = screen.getByRole("heading", {
      name: /Money, made clearer\. See what you have/,
    });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("font-serif");
    expect(heading.className).toContain("text-[clamp(1.5625rem,3vw,3rem)]");
  });

  it("uses a sans lead and a serif statement", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroStatement />);
    expect(container.querySelector(".font-sans.font-semibold")).not.toBeNull();
    expect(container.querySelector(".font-serif.font-normal")).not.toBeNull();
  });

  it("reveals word by word with staggered delays", () => {
    stubMatchMedia(false);
    const { container } = render(<HeroStatement />);
    const words = container.querySelectorAll(".hero-word");
    expect(words.length).toBeGreaterThan(5);
    expect((words[0] as HTMLElement).style.animationDelay).toBe("0ms");
    expect((words[1] as HTMLElement).style.animationDelay).toBe("18ms");
  });

  it("renders the final state under reduced motion", async () => {
    stubMatchMedia(true);
    const { container } = render(<HeroStatement />);
    await waitFor(() => {
      expect(container.querySelector(".hero-word")).toBeNull();
    });
  });
});
