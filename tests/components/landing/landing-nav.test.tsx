import { describe, it, expect, afterEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { setWindowScrollY } from "@/test-utils/browser-mocks";
import { LandingNav } from "@/components/landing/landing-nav";

const NAV_LINKS = [
  ["Product", "/#live"],
  ["Pricing", "/#pricing"],
  ["Questions", "/#faq"],
] as const;

describe("LandingNav — anonymous", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the wordmark link to the home page", () => {
    render(<LandingNav session={false} />);
    expect(screen.getByRole("link", { name: "Budgie" })).toHaveAttribute("href", "/");
  });

  it("renders the old Budgie logo next to the wordmark", () => {
    const { container } = render(<LandingNav session={false} />);
    const logo = container.querySelector("img");
    expect(logo?.getAttribute("src")).toContain("android-chrome-192x192");
    expect(logo?.getAttribute("alt")).toBe("");
  });

  it("renders every anchor nav link", () => {
    render(<LandingNav session={false} />);
    for (const [label, href] of NAV_LINKS) {
      const links = screen.getAllByRole("link", { name: label });
      expect(links.some((l) => l.getAttribute("href") === href)).toBe(true);
    }
  });

  it("shows Sign in and Start free for anonymous visitors", () => {
    render(<LandingNav session={false} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("starts transparent and gains the paper background after scrolling", () => {
    setWindowScrollY(0);
    const { container } = render(<LandingNav session={false} />);
    const header = container.querySelector("header") as HTMLElement;
    expect(header.className).toContain("bg-transparent");
    setWindowScrollY(50);
    fireEvent.scroll(window);
    expect(header.className).toContain("bg-paper/85");
  });
});

describe("LandingNav — signed in", () => {
  it("shows Open Budgie instead of auth links", () => {
    render(<LandingNav session={true} />);
    expect(screen.getByRole("link", { name: "Open Budgie" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start free" })).not.toBeInTheDocument();
  });

  it("still renders the anchor nav links when signed in", () => {
    render(<LandingNav session={true} />);
    expect(screen.getByRole("link", { name: "Product" })).toHaveAttribute(
      "href",
      "/#live",
    );
  });
});
