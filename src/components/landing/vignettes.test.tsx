import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { Vignettes } from "@/components/landing/vignettes";

describe("Vignettes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    stubMatchMedia(false); // AutoVideo reads matchMedia on mount
  });

  it("renders the section heading and kicker", () => {
    render(<Vignettes />);
    expect(screen.getByText("In real moments")).toBeInTheDocument();
    expect(screen.getByText("Short films of the calm")).toBeInTheDocument();
  });

  it("anchors the section at #stories", () => {
    const { container } = render(<Vignettes />);
    const section = container.querySelector("#stories");
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-labelledby")).toBe("stories-title");
  });

  it("renders all three vignette titles and descriptions", () => {
    render(<Vignettes />);
    expect(screen.getByText("A budget that knows your month")).toBeInTheDocument();
    expect(screen.getByText("Hide it in a heartbeat")).toBeInTheDocument();
    expect(screen.getByText("Never miss a renewal")).toBeInTheDocument();
  });

  it("renders the kicker chips as poster content", () => {
    render(<Vignettes />);
    expect(screen.getByText("Budgets")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
  });
});
