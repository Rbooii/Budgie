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
    expect(
      screen.getByText(/One ledger for every account, transaction, and budget/),
    ).toBeInTheDocument();
  });

  it("renders the ledger panel with its quiet live caption", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Updating live")).toBeInTheDocument();
    expect(screen.getAllByText("Monthly Salary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Groceries").length).toBeGreaterThan(0);
  });

  it("renders the interactive search panel", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(
      screen.getByRole("searchbox", { name: "Search transactions" }),
    ).toBeInTheDocument();
  });

  it("renders the budget panel", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.getByText("Spent in December")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
  });

  it("keeps the eyebrow-label chrome out", () => {
    stubMatchMedia(false);
    render(<Bento />);
    expect(screen.queryByText("Capture every rupiah")).not.toBeInTheDocument();
    expect(screen.queryByText("Find answers")).not.toBeInTheDocument();
    expect(screen.queryByText("Automate busywork")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent activity")).not.toBeInTheDocument();
  });
});
