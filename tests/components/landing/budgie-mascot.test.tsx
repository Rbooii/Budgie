import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgieMascot } from "@/components/landing/budgie-mascot";

describe("BudgieMascot", () => {
  it("renders as an accessible image with the mascot name", () => {
    render(<BudgieMascot />);
    const img = screen.getByRole("img", { name: /hand-drawn character/ });
    expect(img.tagName.toLowerCase()).toBe("svg");
  });

  it("gates the blink keyframes behind prefers-reduced-motion", () => {
    const { container } = render(<BudgieMascot />);
    const style = container.querySelector("style")?.textContent ?? "";
    expect(style).toContain("@keyframes budgieBlink");
    expect(style).toContain("prefers-reduced-motion: no-preference");
    expect(container.querySelector(".budgie-eyes")).not.toBeNull();
  });
});
