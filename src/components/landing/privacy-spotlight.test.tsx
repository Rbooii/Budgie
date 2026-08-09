import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrivacySpotlight } from "@/components/landing/privacy-spotlight";

describe("PrivacySpotlight", () => {
  it("renders the heading and kicker", () => {
    render(<PrivacySpotlight />);
    expect(screen.getByText("Privacy by default")).toBeInTheDocument();
    expect(screen.getByText("Your balance stays private")).toBeInTheDocument();
  });

  it("renders all three privacy bullets", () => {
    render(<PrivacySpotlight />);
    expect(screen.getByText("Hidden by default on every device")).toBeInTheDocument();
    expect(
      screen.getByText("Per-character reveal capped at 260ms"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Honors your reduced-motion setting"),
    ).toBeInTheDocument();
  });

  it("shows the masked balance", () => {
    render(<PrivacySpotlight />);
    expect(screen.getByText(/Rp.*••••••••/)).toBeInTheDocument();
  });

  it("shows the revealed balance example in rupiah format", () => {
    render(<PrivacySpotlight />);
    expect(screen.getByText("Rp 18.650.000.00")).toBeInTheDocument();
  });

  it("shows the reveal hint copy", () => {
    render(<PrivacySpotlight />);
    expect(
      screen.getByText("Tap to reveal — tap again to hide"),
    ).toBeInTheDocument();
  });
});
