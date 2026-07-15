import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockBalanceVisibility } = vi.hoisted(() => ({
  mockBalanceVisibility: {
    hidden: true,
    toggleCount: 0,
    toggle: vi.fn(),
  },
}));

vi.mock("@/components/balance-visibility", () => ({
  BalanceVisibilityProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useBalanceVisibility: () => mockBalanceVisibility,
  MaskedBalance: ({ value }: { value: number }) => (
    <span data-testid="masked">{mockBalanceVisibility.hidden ? "Rp ••••••" : `Rp ${value}`}</span>
  ),
}));

import { BalanceSection } from "@/components/balance-section";

beforeEach(() => {
  vi.clearAllMocks();
  mockBalanceVisibility.hidden = true;
  mockBalanceVisibility.toggleCount = 0;
});

describe("BalanceSection", () => {
  it("renders 'Your Net Worth' label", () => {
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    expect(screen.getByText("Your Net Worth")).toBeInTheDocument();
  });

  it("renders a toggle button with aria-label 'Show balance' when hidden", () => {
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    expect(screen.getByLabelText("Show balance")).toBeInTheDocument();
  });

  it("renders a toggle button with aria-label 'Hide balance' when not hidden", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    expect(screen.getByLabelText("Hide balance")).toBeInTheDocument();
  });

  it("shows the percentage delta text when deltaPct is provided and not hidden", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={5.2} deltaAbsolute={50000} />);
    expect(screen.getByText(/\+5\.2% From last Month/)).toBeInTheDocument();
  });

  it("shows the absolute delta text when deltaPct is null and not hidden", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={null} deltaAbsolute={50000} />);
    expect(screen.getByText(/\+Rp/)).toBeInTheDocument();
    expect(screen.getByText(/this month/)).toBeInTheDocument();
  });

  it("uses green color for positive delta", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    const deltaEl = screen.getByText(/From last Month/);
    expect(deltaEl.className.includes("text-[#00C610]")).toBe(true);
  });

  it("uses red color for negative delta", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={-5} deltaAbsolute={-50000} />);
    const deltaEl = screen.getByText(/From last Month/);
    expect(deltaEl.className.includes("text-[#D8000C]")).toBe(true);
  });

  it("masks the delta text when hidden", () => {
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    expect(screen.getByText(/•••• From last Month/)).toBeInTheDocument();
  });

  it("renders the MaskedBalance component", () => {
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    expect(screen.getByTestId("masked")).toBeInTheDocument();
  });
});
