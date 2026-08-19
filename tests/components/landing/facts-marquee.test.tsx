import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FactsMarquee } from "@/components/landing/facts-marquee";

const FACTS = [
  "21 premade categories",
  "3 transaction types, zero math",
  "QRIS-native Plus checkout",
  "Rp-first id-ID formatting",
  "12 months of asset history",
  "PDF exports for any date range",
  "Hidden-by-default balances",
] as const;

describe("FactsMarquee", () => {
  it("renders every product fact", () => {
    render(<FactsMarquee />);
    for (const fact of FACTS) {
      expect(screen.getAllByText(fact).length).toBeGreaterThan(0);
    }
  });

  it("repeats the row once for the infinite loop (aria-hidden duplicate)", () => {
    const { container } = render(<FactsMarquee />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(2);
    expect(lists[1].getAttribute("aria-hidden")).toBe("true");
  });

  it("drifts with the marquee keyframe gated by motion-reduce", () => {
    const { container } = render(<FactsMarquee />);
    const track = container.querySelector(".animate-\\[marquee_38s_linear_infinite\\]");
    expect(track).not.toBeNull();
    expect(track?.getAttribute("class")).toContain("motion-reduce:animate-none");
  });
});
