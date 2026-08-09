import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SpotlightCard } from "@/components/landing/spotlight";

describe("SpotlightCard", () => {
  it("renders its children", () => {
    render(<SpotlightCard>Hello card</SpotlightCard>);
    expect(screen.getByText("Hello card")).toBeInTheDocument();
  });

  it("passes className through to the card", () => {
    const { container } = render(
      <SpotlightCard className="my-card rounded-[35px]">x</SpotlightCard>,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("my-card");
    expect(card.className).toContain("rounded-[35px]");
  });

  it("renders a decorative spotlight overlay", () => {
    const { container } = render(<SpotlightCard>x</SpotlightCard>);
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("class")).toContain("pointer-events-none");
  });

  it("tracks the cursor position in CSS vars on pointer move", () => {
    const { container } = render(<SpotlightCard>x</SpotlightCard>);
    const card = container.firstElementChild as HTMLElement;
    fireEvent.pointerMove(card, {
      pointerType: "mouse",
      clientX: 120,
      clientY: 60,
    });
    expect(card.style.getPropertyValue("--spot-x")).toBe("120px");
    expect(card.style.getPropertyValue("--spot-y")).toBe("60px");
  });

  it("ignores touch pointers (spotlight is a pointer-device flourish)", () => {
    const { container } = render(<SpotlightCard>x</SpotlightCard>);
    const card = container.firstElementChild as HTMLElement;
    fireEvent.pointerMove(card, {
      pointerType: "touch",
      clientX: 120,
      clientY: 60,
    });
    expect(card.style.getPropertyValue("--spot-x")).toBe("");
  });

  it("paints the overlay with a radial green gradient from the CSS vars", () => {
    const { container } = render(<SpotlightCard radius={240}>x</SpotlightCard>);
    const overlay = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(overlay.style.background).toContain("240px circle");
    expect(overlay.style.background).toContain("var(--spot-x, 12%)");
  });
});
