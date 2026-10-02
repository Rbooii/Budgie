import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { ThemeProvider } from "@/components/theme-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/transactions",
}));

vi.mock("@/app/dashboard/sign-out-button", () => ({
  SignOutButton: () => <button data-testid="sign-out">Sign out</button>,
}));

import { Sidebar } from "@/components/sidebar";

function renderSidebar() {
  return render(
    <ThemeProvider>
      <Sidebar />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Sidebar", () => {
  it("renders the Budgie brand title", () => {
    renderSidebar();
    expect(screen.getByText("Budgie")).toBeInTheDocument();
  });

  it("renders all four navigation items (desktop + mobile = 2 each)", () => {
    renderSidebar();
    expect(screen.getAllByText("Home")).toHaveLength(2);
    expect(screen.getAllByText("Chat")).toHaveLength(2);
    expect(screen.getAllByText("Transactions")).toHaveLength(2);
    expect(screen.getAllByText("Budget")).toHaveLength(2);
  });

  it("renders navigation links with correct hrefs", () => {
    renderSidebar();
    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    expect(homeLinks.every((l) => l.getAttribute("href") === "/dashboard")).toBe(true);
    const txLinks = screen.getAllByRole("link", { name: /transactions/i });
    expect(txLinks.every((l) => l.getAttribute("href") === "/transactions")).toBe(true);
  });

  it("highlights the active link (Transactions) with bg color", () => {
    renderSidebar();
    const activeLinks = screen.getAllByRole("link", { name: /transactions/i });
    expect(
      activeLinks.some((l) => l.className.split(" ").includes("bg-surface")),
    ).toBe(true);
  });

  it("does not highlight inactive links", () => {
    renderSidebar();
    const inactiveLinks = screen.getAllByRole("link", { name: /home/i });
    expect(
      inactiveLinks.every((l) => !l.className.split(" ").includes("bg-surface")),
    ).toBe(true);
  });


  it("renders both desktop sidebar and mobile tab bar", () => {
    const { container } = renderSidebar();
    const desktopAside = container.querySelector("aside");
    const mobileNav = container.querySelector("nav.md\\:hidden");
    expect(desktopAside).not.toBeNull();
    expect(mobileNav).not.toBeNull();
  });

  it("clears the iOS safe area on the mobile tab bar", () => {
    const { container } = renderSidebar();
    const mobileNav = container.querySelector("nav.md\\:hidden")!;
    expect(mobileNav.hasAttribute("data-mobile-tabbar")).toBe(true);
    expect(mobileNav.className).toContain("h-[var(--app-tabbar-h)]");
    expect(mobileNav.className).toContain("pb-[env(safe-area-inset-bottom,0px)]");
  });

  it("marks the active mobile tab and leaves the others quiet", () => {
    const { container } = renderSidebar();
    const mobileNav = container.querySelector("nav.md\\:hidden")!;
    const links = Array.from(mobileNav.querySelectorAll("a"));
    const active = links.find((l) => l.getAttribute("href") === "/transactions")!;
    const inactive = links.find((l) => l.getAttribute("href") === "/dashboard")!;
    expect(active.getAttribute("aria-current")).toBe("page");
    expect(active.textContent).toContain("Transactions");
    expect(active.querySelector("span")!.className).toContain("bg-brand-tint");
    expect(inactive.getAttribute("aria-current")).toBeNull();
    expect(inactive.querySelector("span")!.className).not.toContain("bg-brand-tint");
  });

  it("toggles the theme from the sidebar row", async () => {
    renderSidebar();
    const toggle = screen.getByRole("button", { name: /switch to dark theme/i });
    await userEvent.click(toggle);

    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true),
    );
    expect(window.localStorage.getItem("budgie.theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });
});
