import { describe, it, expect, afterEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { setWindowScrollY } from "@/test-utils/browser-mocks";
import { LandingNav } from "@/components/landing/landing-nav";

const NAV_LINKS = [
  ["Motion", "/#motion"],
  ["Features", "/#features"],
  ["Stories", "/#stories"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
] as const;

describe("LandingNav — anonymous", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the brand link to the home page", () => {
    render(<LandingNav session={false} />);
    expect(screen.getByRole("link", { name: "Budgie" })).toHaveAttribute("href", "/");
  });

  it("renders all five anchor nav links", () => {
    render(<LandingNav session={false} />);
    for (const [label, href] of NAV_LINKS) {
      const links = screen.getAllByRole("link", { name: label });
      expect(links.some((l) => l.getAttribute("href") === href)).toBe(true);
    }
  });

  it("shows Sign in and Get started for anonymous visitors", () => {
    render(<LandingNav session={false} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("starts transparent and gains the solid background after scrolling", () => {
    setWindowScrollY(0);
    const { container } = render(<LandingNav session={false} />);
    const header = container.querySelector("header") as HTMLElement;
    expect(header.className).toContain("bg-transparent");
    setWindowScrollY(50);
    fireEvent.scroll(window);
    expect(header.className).toContain("bg-white/80");
  });
});

describe("LandingNav — signed in", () => {
  it("shows the Dashboard link instead of auth links", () => {
    render(<LandingNav session={true} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Get started" })).not.toBeInTheDocument();
  });

  it("still renders the anchor nav links when signed in", () => {
    render(<LandingNav session={true} />);
    expect(screen.getByRole("link", { name: "Motion" })).toHaveAttribute(
      "href",
      "/#motion",
    );
  });
});
