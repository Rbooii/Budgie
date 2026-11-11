import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
} from "@/test-utils/browser-mocks";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

import { LandingPageView } from "@/components/landing";

function renderLanding(session: boolean = false) {
  return render(<LandingPageView session={session} />);
}

beforeEach(() => {
  stubMatchMedia(false);
  stubIntersectionObserver();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LandingPageView — Anthropic-style hero", () => {
  it("renders the mixed sans/serif statement", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", {
        name: /Money, made clearer\. See what you have/,
      }),
    ).toBeInTheDocument();
  });

  it("renders one primary CTA and the product anchor", () => {
    renderLanding();
    expect(
      screen.getAllByRole("link", { name: "Start free" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "See how it works" }),
    ).toHaveAttribute("href", "/#live");
  });

  it("renders the nanite account composition instead of a video", () => {
    const { container } = renderLanding();
    const stage = container.querySelector(".hero-card-slot") as HTMLElement;
    expect(within(stage).getByText("Money in")).toBeInTheDocument();
    expect(within(stage).getByText("This Month's Cashflow")).toBeInTheDocument();
    expect(within(stage).queryByText("Money out")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pause demo video" }),
    ).not.toBeInTheDocument();
  });

  it("does not render Claude, mascot, or badge chrome", () => {
    renderLanding();
    expect(
      screen.queryByRole("img", { name: /hand-drawn character/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Where your money")).not.toBeInTheDocument();
    expect(screen.queryByText("Fig. 01")).not.toBeInTheDocument();
    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  });
});

describe("LandingPageView — editorial composition", () => {
  it("renders every section heading", () => {
    renderLanding();
    expect(screen.getByText("See it work.")).toBeInTheDocument();
    expect(screen.getByText("Balance, budget, and the next step.")).toBeInTheDocument();
    expect(
      screen.getByText("Saving is easier when you can see the line move."),
    ).toBeInTheDocument();
    expect(screen.getByText("Money words, made plain.")).toBeInTheDocument();
    expect(
      screen.getByText("Free to use. Plus if you want to keep it going."),
    ).toBeInTheDocument();
    expect(screen.getByText("Questions, answered.")).toBeInTheDocument();
    expect(screen.getByText("Start with what you have.")).toBeInTheDocument();
  });

  it("renders the real product story and three sketch-line cards", () => {
    renderLanding();
    expect(screen.getAllByText("See your balance.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Give the month a shape.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("See where it went.").length).toBeGreaterThan(0);
    expect(screen.getByText("Every account, one line.")).toBeInTheDocument();
    expect(screen.getByText("Savings, in motion.")).toBeInTheDocument();
    expect(screen.getByText("Spending, without the guesswork.")).toBeInTheDocument();
    expect(screen.getAllByText("Monthly budget").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Month's Cashflow").length,
    ).toBeGreaterThan(0);
  });

  it("renders the honest pricing tiers", () => {
    renderLanding();
    expect(screen.getAllByText("Rp 0.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Rp 24.500.00")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Support Budgie" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Priority PDF exports")).not.toBeInTheDocument();
  });

  it("renders the real-links footer", () => {
    renderLanding();
    expect(screen.getAllByRole("link", { name: "Budgie" }).length).not.toBe(0);
    expect(
      screen
        .getAllByRole("link", { name: "How it works" })
        .some((link) => link.getAttribute("href") === "/#live"),
    ).toBe(true);
    expect(
      screen.queryByRole("combobox", { name: "Language" }),
    ).not.toBeInTheDocument();
  });
});

describe("LandingPageView — session handling", () => {
  it("shows the anonymous nav (Sign in / Start free) without a session", () => {
    const { container } = renderLanding(false);
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(
      within(header).getByRole("link", { name: "Start free" }),
    ).toHaveAttribute("href", "/sign-in");
    expect(
      within(header).queryByRole("link", { name: "Open Budgie" }),
    ).not.toBeInTheDocument();
  });

  it("shows Open Budgie instead of auth links when signed in", () => {
    const { container } = renderLanding(true);
    const header = container.querySelector("header") as HTMLElement;
    expect(
      within(header).getByRole("link", { name: "Open Budgie" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(header).queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole("link", { name: "Start free" }),
    ).not.toBeInTheDocument();
  });
});
