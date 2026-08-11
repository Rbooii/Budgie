import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { Bento } from "@/components/landing/bento";

describe("Bento", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the section heading and deck", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.getByText("Where your money lives.")).toBeInTheDocument();
    expect(screen.getByText(/Three quiet superpowers/)).toBeInTheDocument();
  });

  it("renders the three card eyebrows and Notion-style titles", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.getByText("Capture every rupiah")).toBeInTheDocument();
    expect(screen.getByText("One system of record for your money.")).toBeInTheDocument();
    expect(screen.getByText("Find answers")).toBeInTheDocument();
    expect(screen.getByText("Instantly, with every detail.")).toBeInTheDocument();
    expect(screen.getByText("Automate busywork")).toBeInTheDocument();
    expect(screen.getByText("Budgets that keep watch, 24/7.")).toBeInTheDocument();
  });

  it("uses the 22px bold card-title typography", () => {
    stubMatchMedia(false);
    render(<Bento />);
    const title = screen.getByText("One system of record for your money.");
    expect(title.className).toContain("text-[22px]");
    expect(title.className).toContain("font-bold");
  });

  it("shows the Capture media: a live recent-transactions feed", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getAllByText("Live").length).toBeGreaterThan(0);
    // also rendered by the Find card's default list — assert presence, not uniqueness
    expect(screen.getAllByText("Monthly Salary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Groceries").length).toBeGreaterThan(0);
  });

  it("renders the interactive Find search card", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(
      screen.getByRole("searchbox", { name: "Search your transactions" }),
    ).toBeInTheDocument();
  });

  it("shows the Automate media: a live spending streams chart", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.getByText("December 2026")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
  });
});
