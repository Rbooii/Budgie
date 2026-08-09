import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marquee } from "@/components/landing/marquee";

const EXPECTED_PILLS = [
  "Accounts",
  "Transactions",
  "Budgets",
  "Subscriptions",
  "Cashflow donut",
  "Asset growth",
  "Spending streams",
  "Per-character balance reveal",
  "QRIS Plus",
  "Rupiah native",
  "PDF export",
  "21 premade categories",
];

describe("Marquee", () => {
  it("labels the section as feature highlights", () => {
    render(<Marquee />);
    expect(screen.getByLabelText("Budgie feature highlights")).toBeInTheDocument();
  });

  it("renders every feature pill", () => {
    render(<Marquee />);
    for (const pill of EXPECTED_PILLS) {
      expect(screen.getAllByText(pill)).not.toHaveLength(0);
    }
  });

  it("renders the marquee track twice for a seamless loop", () => {
    const { container } = render(<Marquee />);
    const rows = container.querySelectorAll("ul");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.querySelectorAll("li")).toHaveLength(EXPECTED_PILLS.length);
    }
  });

  it("marks the duplicated track as decorative", () => {
    const { container } = render(<Marquee />);
    for (const row of container.querySelectorAll("ul")) {
      expect(row.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("gives every pill a tinted dot", () => {
    const { container } = render(<Marquee />);
    const dots = container.querySelectorAll("li > span:first-child");
    expect(dots).toHaveLength(EXPECTED_PILLS.length * 2);
    for (const dot of dots) {
      expect(
        /bg-\[#(1F9B29|D8000C|B25B00)\]/.test(dot.getAttribute("class") ?? ""),
      ).toBe(true);
    }
  });
});
