import { describe, it, expect, afterEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
} from "@/test-utils/browser-mocks";
import { HeroMedia } from "@/components/landing/hero-media";

describe("HeroMedia", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the play/pause controller when motion is allowed", () => {
    stubMatchMedia(false);
    render(<HeroMedia />);
    expect(
      screen.getByRole("button", { name: "Pause demo video" }),
    ).toBeInTheDocument();
  });

  it("hides the controller under reduced motion (poster stays)", () => {
    stubMatchMedia(true);
    render(<HeroMedia />);
    expect(
      screen.queryByRole("button", { name: /demo video/ }),
    ).not.toBeInTheDocument();
  });

  it("mounts the video once in view and toggles pause state on click", () => {
    stubMatchMedia(false);
    const io = stubIntersectionObserver();
    render(<HeroMedia />);

    const target = io.instances[0].observed[0];
    act(() => io.trigger(target, true));

    expect(document.querySelector("video")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Pause demo video" }));
    expect(
      screen.getByRole("button", { name: "Play demo video" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Play demo video" }));
    expect(
      screen.getByRole("button", { name: "Pause demo video" }),
    ).toBeInTheDocument();
  });
});
