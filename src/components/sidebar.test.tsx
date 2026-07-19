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
});
