import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";

// the module imports the async wrapper's auth chain at load time — mock it so
// prisma is never instantiated in tests (the wrapper itself is not testable
// in jsdom, see AGENTS.md; LandingPageView is what we exercise)
vi.mock("lenis", () => ({
  default: class {
    scrollTo = vi.fn();
    raf = vi.fn();
    destroy = vi.fn();
  },
}));

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
  // AutoVideo (video showcase + vignettes) reads matchMedia on mount
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LandingPageView — hero", () => {
  it("renders the staggered headline and hero copy", () => {
    renderLanding();
    expect(screen.getByText("Your money,")).toBeInTheDocument();
    expect(screen.getByText("Control")).toBeInTheDocument();
    expect(
      screen.getByText(/minimal, distraction free dashboard/i),
    ).toBeInTheDocument();
  });

  it("renders the magnetic CTAs with the new copy", () => {
    renderLanding();
    expect(
      screen.getAllByRole("link", { name: "Get started for free" }),
    ).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "See Budgie in motion" })).toHaveAttribute(
      "href",
      "/#motion",
    );
  });

  it("does not render the stats strip (commented out)", () => {
    renderLanding();
    expect(screen.queryByText("premade categories")).not.toBeInTheDocument();
    expect(screen.queryByText("months of growth history")).not.toBeInTheDocument();
  });
});

describe("LandingPageView — section composition", () => {
  it("renders the nav and footer brand", () => {
    renderLanding();
    expect(screen.getAllByRole("link", { name: "Budgie" })).not.toHaveLength(0);
  });

  it("renders every marketing section heading in order", () => {
    renderLanding();
    expect(screen.getAllByText("Accounts")).not.toHaveLength(0); // marquee pills
    expect(screen.getByText("Watch your money settle into focus")).toBeInTheDocument();
    expect(screen.getByText("A calm home for your money")).toBeInTheDocument();
    expect(screen.getByText("Every rupiah, in its place")).toBeInTheDocument();
    expect(screen.getByText("Short films of the calm")).toBeInTheDocument();
    expect(screen.getByText("Your balance stays private")).toBeInTheDocument();
    expect(screen.getByText("Free forever. Plus when you grow.")).toBeInTheDocument();
    expect(screen.getByText("Things people ask")).toBeInTheDocument();
  });

  it("renders the pricing tiers", () => {
    renderLanding();
    expect(screen.getByText("Rp 0.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 24.500.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Budgie Plus" })).toBeInTheDocument();
  });

  it("renders the final CTA block", () => {
    renderLanding();
    expect(screen.getByText("Start tracking your money today")).toBeInTheDocument();
    expect(screen.getByText(/Free to start. No card required/)).toBeInTheDocument();
  });

  it("renders the footer credits", () => {
    renderLanding();
    expect(screen.getByText("Built with Next.js · Hono · Prisma")).toBeInTheDocument();
  });
});

describe("LandingPageView — session handling", () => {
  it("shows the anonymous nav (Sign in / Get started) without a session", () => {
    renderLanding(false);
    // nav "Sign in" + footer "Sign in" = 2; Dashboard is auth-gated
    expect(screen.getAllByRole("link", { name: "Sign in" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows the Dashboard nav link instead of auth links when signed in", () => {
    renderLanding(true);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    // nav "Sign in" is gone; only the footer's remains
    expect(screen.getAllByRole("link", { name: "Sign in" })).toHaveLength(1);
  });
});
