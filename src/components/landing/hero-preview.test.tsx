import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import {
  stubMatchMedia,
} from "@/test-utils/browser-mocks";
import { HeroPreview } from "@/components/landing/hero-preview";

describe("HeroPreview", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the net worth hero with the current total", () => {
    stubMatchMedia(true); // reduced motion → static value
    render(<HeroPreview />);
    expect(screen.getByText("Your Net Worth")).toBeInTheDocument();
    expect(screen.getByText("December 2026")).toBeInTheDocument();
    expect(screen.getByText("+12.4% MoM")).toBeInTheDocument();
  });

  it("renders the first live transaction by default", () => {
    stubMatchMedia(true);
    render(<HeroPreview />);
    expect(screen.getByText("Freelance Payout")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("does not rotate the live transaction under reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<HeroPreview />);
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByText("Freelance Payout")).toBeInTheDocument();
  });

  it("rotates through the live pool every 4 seconds", () => {
    stubMatchMedia(false);
    vi.useFakeTimers();
    render(<HeroPreview />);
    expect(screen.getByText("Freelance Payout")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText("Spotify")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    // 5th tick reaches the last pool entry
    act(() => vi.advanceTimersByTime(4000 * 3));
    expect(screen.getByText("Pay Savings")).toBeInTheDocument();
    // wraps around to the first entry
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText("Freelance Payout")).toBeInTheDocument();
  });
});
