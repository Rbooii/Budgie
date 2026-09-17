import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { LiveFeed } from "@/components/landing/live-feed";
import { LIVE_TICK_MS, MOCK_LIVE_TRANSACTIONS } from "@/components/landing/mock-data";

describe("LiveFeed — the ledger panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders the stable first window on the white ledger surface", () => {
    stubMatchMedia(false);
    const { container } = render(<LiveFeed />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Updating live")).toBeInTheDocument();
    expect(screen.getByText("Monthly Salary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Move to Savings")).toBeInTheDocument();
    expect(container.querySelector(".rounded-\\[35px\\]")).not.toBeNull();
  });

  it("closes the statement with today's net (transfers excluded)", () => {
    stubMatchMedia(false);
    render(<LiveFeed />);
    expect(screen.getByText("Net today")).toBeInTheDocument();
    expect(screen.getByText("Rp 10.122.510.00")).toBeInTheDocument();
  });

  it("slides the window forward after each tick", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<LiveFeed />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS);
    });
    expect(screen.getByText("Spotify")).toBeInTheDocument();
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
    expect(screen.getByText("Monthly Salary")).toBeInTheDocument();
    expect(screen.queryByText("Pay Savings")).not.toBeInTheDocument();
  });

  it("renders no chevrons and no uppercase LIVE badge", () => {
    stubMatchMedia(false);
    render(<LiveFeed />);
    expect(document.querySelector(".lucide-chevron-right")).toBeNull();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });
});
