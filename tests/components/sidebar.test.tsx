import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/transactions",
}));

vi.mock("@/app/dashboard/sign-out-button", () => ({
  SignOutButton: () => <button data-testid="sign-out">Sign out</button>,
}));

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  it("renders the Budgie brand title", () => {
    render(<Sidebar />);
    expect(screen.getByText("Budgie")).toBeInTheDocument();
  });

  it("renders all four navigation items (desktop + mobile = 2 each)", () => {
    render(<Sidebar />);
    expect(screen.getAllByText("Home")).toHaveLength(2);
    expect(screen.getAllByText("Chat")).toHaveLength(2);
    expect(screen.getAllByText("Transactions")).toHaveLength(2);
    expect(screen.getAllByText("Budget")).toHaveLength(2);
  });

  it("renders navigation links with correct hrefs", () => {
    render(<Sidebar />);
    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    expect(homeLinks.every((l) => l.getAttribute("href") === "/dashboard")).toBe(true);
    const txLinks = screen.getAllByRole("link", { name: /transactions/i });
    expect(txLinks.every((l) => l.getAttribute("href") === "/transactions")).toBe(true);
  });

  it("highlights the active link (Transactions) with bg color", () => {
    render(<Sidebar />);
    const activeLinks = screen.getAllByRole("link", { name: /transactions/i });
    expect(
      activeLinks.some((l) => l.className.split(" ").includes("bg-[#F2F2F2]")),
    ).toBe(true);
  });

  it("does not highlight inactive links", () => {
    render(<Sidebar />);
    const inactiveLinks = screen.getAllByRole("link", { name: /home/i });
    expect(
      inactiveLinks.every((l) => !l.className.split(" ").includes("bg-[#F2F2F2]")),
    ).toBe(true);
  });


  it("renders both desktop sidebar and mobile tab bar", () => {
    const { container } = render(<Sidebar />);
    const desktopAside = container.querySelector("aside");
    const mobileNav = container.querySelector("nav.md\\:hidden");
    expect(desktopAside).not.toBeNull();
    expect(mobileNav).not.toBeNull();
  });

  it("clears the iOS safe area on the mobile tab bar", () => {
    const { container } = render(<Sidebar />);
    const mobileNav = container.querySelector("nav.md\\:hidden")!;
    expect(mobileNav.hasAttribute("data-mobile-tabbar")).toBe(true);
    expect(mobileNav.className).toContain("h-[var(--app-tabbar-h)]");
    expect(mobileNav.className).toContain("pb-[env(safe-area-inset-bottom,0px)]");
  });

  it("marks the active mobile tab and leaves the others quiet", () => {
    const { container } = render(<Sidebar />);
    const mobileNav = container.querySelector("nav.md\\:hidden")!;
    const links = Array.from(mobileNav.querySelectorAll("a"));
    const active = links.find((l) => l.getAttribute("href") === "/transactions")!;
    const inactive = links.find((l) => l.getAttribute("href") === "/dashboard")!;
    expect(active.getAttribute("aria-current")).toBe("page");
    expect(active.textContent).toContain("Transactions");
    expect(active.querySelector("span")!.className).toContain("bg-[#00C610]/10");
    expect(inactive.getAttribute("aria-current")).toBeNull();
    expect(inactive.querySelector("span")!.className).not.toContain("bg-[#00C610]/10");
  });
});
