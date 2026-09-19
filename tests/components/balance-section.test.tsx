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

function heroCard(): HTMLElement {
  return screen.getByText("Balance").parentElement!.parentElement as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBalanceVisibility.hidden = true;
  mockBalanceVisibility.toggleCount = 0;
});

describe("BalanceSection", () => {
  it("renders the 'Balance' label inside a brand-green card", () => {
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    const card = heroCard();
    expect(card.className).toContain("bg-[#00C610]");
    expect(card.className).toContain("rounded-[35px]");
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

  it("renders the delta in white (readable on the green card)", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={5} deltaAbsolute={50000} />);
    const deltaEl = screen.getByText(/From last Month/);
    expect(deltaEl.className).toContain("text-white/95");
  });

  it("renders a negative delta without any green/red text color", () => {
    mockBalanceVisibility.hidden = false;
    render(<BalanceSection value={1000000} deltaPct={-5} deltaAbsolute={-50000} />);
    const deltaEl = screen.getByText(/From last Month/);
    expect(deltaEl.className).not.toContain("text-[#00C610]");
    expect(deltaEl.className).not.toContain("text-[#D8000C]");
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
