import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PageSkeleton } from "@/components/page-skeleton";

function countClass(container: HTMLElement, token: string): number {
  return container.querySelectorAll(`[class*="${token}"]`).length;
}

describe("PageSkeleton", () => {
  it("is hidden from assistive tech and pulses (reduced-motion aware)", () => {
    const { container } = render(<PageSkeleton variant="dashboard" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
    expect(
      container.querySelector(".motion-reduce\\:animate-none"),
    ).not.toBeNull();
  });

  it("defaults to the dashboard rhythm with three account cards", () => {
    const { container } = render(<PageSkeleton />);
    expect(countClass(container, "min-h-[180px]")).toBe(3);
    expect(countClass(container, "h-[340px]")).toBe(2);
  });

  it("renders the transactions list rows", () => {
    const { container } = render(<PageSkeleton variant="transactions" />);
    expect(countClass(container, "h-[72px]")).toBe(5);
    expect(countClass(container, "h-11")).toBeGreaterThanOrEqual(3);
  });

  it("renders the budget summary, chart and list rows", () => {
    const { container } = render(<PageSkeleton variant="budget" />);
    expect(countClass(container, "h-[176px]")).toBe(1);
    expect(countClass(container, "h-[300px]")).toBe(1);
    expect(countClass(container, "h-[72px]")).toBe(5);
  });

  it("renders the profile identity cards", () => {
    const { container } = render(<PageSkeleton variant="profile" />);
    expect(countClass(container, "h-[300px]")).toBe(1);
    expect(countClass(container, "h-[240px]")).toBe(1);
  });

  it("renders the full-height chat column with composer", () => {
    const { container } = render(<PageSkeleton variant="chat" />);
    expect(countClass(container, "max-w-3xl")).toBe(1);
    expect(countClass(container, "h-[92px]")).toBe(1);
    expect(countClass(container, "h-full")).toBeGreaterThanOrEqual(1);
  });

  it("renders the add-transaction wizard card", () => {
    const { container } = render(<PageSkeleton variant="add-transaction" />);
    expect(countClass(container, "h-[440px]")).toBe(1);
    expect(countClass(container, "max-w-md")).toBe(1);
  });
});
