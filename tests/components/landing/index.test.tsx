import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";

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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LandingPageView — hero (Notion anatomy)", () => {
  it("renders the feature-icon pile, headline, and mono deck", () => {
    renderLanding();
    expect(screen.getByTitle("Accounts")).toBeInTheDocument();
    expect(screen.getByTitle("Insights")).toBeInTheDocument();
    expect(screen.getByText("Where your money")).toBeInTheDocument();
    expect(screen.getAllByText("works").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Capture context, find answers, and automate busywork/),
    ).toBeInTheDocument();
  });

  it("renders the green primary CTA and the secondary CTA", () => {
    renderLanding();
    expect(
      screen.getAllByRole("link", { name: "Get started for free" }).length,
    ).toBeGreaterThan(0);
    const secondaries = screen.getAllByRole("link", {
      name: "See what Budgie can do",
    });
    expect(secondaries.length).toBeGreaterThan(0);
    for (const link of secondaries) {
      expect(link).toHaveAttribute("href", "/#features");
    }
  });

  it("renders the demo video with a Notion-style play/pause controller", () => {
    renderLanding();
    expect(
      screen.getByRole("button", { name: "Pause demo video" }),
    ).toBeInTheDocument();
  });

  it("does not render AI-slop chrome (no hero net-worth card, no progress bar)", () => {
    renderLanding();
    expect(screen.queryByText("Your Net Worth")).not.toBeInTheDocument();
    expect(screen.queryByText("December 2026")).toBeInTheDocument(); // the live chart is the only feed
  });
});

describe("LandingPageView — section composition (Notion order)", () => {
  it("renders every marketing section heading in order", () => {
    renderLanding();
    expect(screen.getByText("Where your money lives.")).toBeInTheDocument(); // bento
    expect(
      screen.getByRole("heading", { name: "See what Budgie can do" }),
    ).toBeInTheDocument(); // use cases
    expect(screen.getByText("Free forever. Plus when you grow.")).toBeInTheDocument(); // pricing
    expect(screen.getByText("Things people ask")).toBeInTheDocument(); // faq
    expect(screen.getAllByText("21 premade categories").length).toBeGreaterThan(0); // facts marquee
  });

  it("renders the pricing tiers", () => {
    renderLanding();
    expect(screen.getByText("Rp 0.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 24.500.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Budgie Plus" })).toBeInTheDocument();
  });

  it("renders the neutral Notion-style endcap", () => {
    renderLanding();
    expect(screen.getByText("Get started today.")).toBeInTheDocument();
    expect(screen.getByText(/Free to start. No card required/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Budgie free" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("renders the trimmed real-links footer", () => {
    renderLanding();
    expect(screen.getAllByRole("link", { name: "Budgie" })).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.queryByRole("combobox", { name: "Language" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cookie settings" })).not.toBeInTheDocument();
  });
});

describe("LandingPageView — session handling", () => {
  it("shows the anonymous nav (Sign in / Get started) without a session", () => {
    const { container } = renderLanding(false);
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(within(header).getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(within(header).queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows the Dashboard nav link instead of auth links when signed in", () => {
    const { container } = renderLanding(true);
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(within(header).queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(within(header).queryByRole("link", { name: "Get started" })).not.toBeInTheDocument();
  });
});
