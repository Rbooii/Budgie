import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { LiveFeed } from "@/components/landing/live-feed";
import { LIVE_TICK_MS, MOCK_LIVE_TRANSACTIONS } from "@/components/landing/mock-data";

describe("LiveFeed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders the stable first window with the live caption", () => {
    stubMatchMedia(false);
    render(<LiveFeed />);
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Monthly Salary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Move to Savings")).toBeInTheDocument();
  });

  it("slides the window forward after each tick", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<LiveFeed />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS);
    });
    expect(screen.getByText("Freelance Payout")).toBeInTheDocument();
    expect(screen.queryByText("Monthly Salary")).not.toBeInTheDocument();
  });

  it("wraps around the circular pool", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<LiveFeed />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS * MOCK_LIVE_TRANSACTIONS.length);
    });
    expect(screen.getByText("Monthly Salary")).toBeInTheDocument();
  });

  it("freezes on the first window under reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<LiveFeed />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS * 5);
    });
    expect(screen.getByText("Move to Savings")).toBeInTheDocument();
    expect(screen.queryByText("Freelance Payout")).not.toBeInTheDocument();
  });

  it("hides the chevrons on preview rows", () => {
    stubMatchMedia(false);
    render(<LiveFeed />);
    expect(document.querySelector(".lucide-chevron-right")).toBeNull();
  });
});
