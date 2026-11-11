import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
} from "@/test-utils/browser-mocks";
import { MoneySnapshot } from "@/components/landing/money-snapshot";

describe("MoneySnapshot", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    stubIntersectionObserver();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the initial income and summary cards", () => {
    render(<MoneySnapshot />);
    expect(screen.getByText("Money in")).toBeInTheDocument();
    expect(screen.getByText("This Month's Cashflow")).toBeInTheDocument();
    expect(screen.queryByText("Money out")).not.toBeInTheDocument();
  });

  it("keeps the stage inert and the canvas decorative", () => {
    const { container } = render(<MoneySnapshot />);
    const slot = container.querySelector(".hero-card-slot");
    expect(slot).not.toBeNull();
    expect(slot).toHaveAttribute("inert");
    expect(slot?.className).toContain("pointer-events-none");

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });

  it("builds a new random composition after the cycle", () => {
    vi.useFakeTimers();
    const io = stubIntersectionObserver();
    const { container } = render(<MoneySnapshot />);

    const stage = container.firstElementChild as Element;
    act(() => io.trigger(stage, true));

    const slot = container.querySelector(".hero-card-slot");
    expect(slot).toHaveAttribute("data-composition", "0");

    act(() => vi.advanceTimersByTime(4600));
    expect(slot).toHaveAttribute("data-composition", "1");

    const cards = container.querySelectorAll(".hero-card");
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(cards.length).toBeLessThanOrEqual(3);
  });

  it("shows the initial composition statically under reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    const { container } = render(<MoneySnapshot />);

    expect(screen.getByText("Money in")).toBeInTheDocument();
    expect(screen.getByText("This Month's Cashflow")).toBeInTheDocument();

    const slot = container.querySelector(".hero-card-slot");
    act(() => vi.advanceTimersByTime(4600));
    expect(slot).toHaveAttribute("data-composition", "0");

    expect(screen.queryByText("A clearer month")).not.toBeInTheDocument();
    expect(screen.queryByText("Left after spending")).not.toBeInTheDocument();
  });
});
