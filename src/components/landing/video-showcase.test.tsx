import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { VideoShowcase } from "@/components/landing/video-showcase";

describe("VideoShowcase", () => {
  beforeEach(() => {
    stubMatchMedia(false); // AutoVideo reads matchMedia on mount
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the section heading and kicker", () => {
    render(<VideoShowcase />);
    expect(screen.getByText("See it in motion")).toBeInTheDocument();
    expect(
      screen.getByText("Watch your money settle into focus"),
    ).toBeInTheDocument();
  });

  it("anchors the section at #motion", () => {
    const { container } = render(<VideoShowcase />);
    const section = container.querySelector("#motion");
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-labelledby")).toBe("motion-title");
  });

  it("renders the poster frame with the play glyph (video stays lazy)", () => {
    const { container } = render(<VideoShowcase />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
