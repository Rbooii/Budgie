import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { LiveSpending } from "@/components/landing/live-spending";
import {
  LIVE_TICK_MS,
  MOCK_LIVE_EXPENSE_EVENTS,
} from "@/components/landing/mock-data";

const BASE_TOTAL = "Rp 3.060.000.00";

describe("LiveSpending — the budget panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders the base month total without any legend or live badge", () => {
    stubMatchMedia(false);
    render(<LiveSpending />);
    expect(screen.getByText("Spent in December")).toBeInTheDocument();
    expect(screen.getByText(BASE_TOTAL)).toBeInTheDocument();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    expect(screen.queryByText("Budget limit")).not.toBeInTheDocument();
  });

  it("uses the ledger anatomy: caption row + left-to-spend footer", () => {
    stubMatchMedia(false);
    render(<LiveSpending />);
    expect(screen.getByText("Left to spend")).toBeInTheDocument();
    expect(screen.getByText("Rp 890.000.00")).toBeInTheDocument();
  });

  it("accumulates one expense event per tick", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<LiveSpending />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS);
    });
    expect(screen.getByText("Rp 3.146.500.00")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS);
    });
    expect(screen.getByText("Rp 3.170.500.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 779.500.00")).toBeInTheDocument(); // left to spend
  });

  it("loops back to the base month after every event has landed", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<LiveSpending />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS * (MOCK_LIVE_EXPENSE_EVENTS.length + 1));
    });
    expect(screen.getByText(BASE_TOTAL)).toBeInTheDocument();
  });

  it("freezes on the base month under reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<LiveSpending />);
    act(() => {
      vi.advanceTimersByTime(LIVE_TICK_MS * 4);
    });
    expect(screen.getByText(BASE_TOTAL)).toBeInTheDocument();
  });
});
