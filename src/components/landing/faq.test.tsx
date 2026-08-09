import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq, FAQ_ITEMS } from "@/components/landing/faq";

describe("Faq", () => {
  it("renders the section heading", () => {
    render(<Faq />);
    expect(screen.getByText("Things people ask")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Things people ask" })).toBeInTheDocument();
  });

  it("labels the section with the faq title id", () => {
    render(<Faq />);
    const section = screen.getByText("Things people ask").closest("section");
    expect(section?.getAttribute("aria-labelledby")).toBe("faq-title");
  });

  it("renders every question and answer", () => {
    render(<Faq />);
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.q)).toBeInTheDocument();
      expect(screen.getByText(item.a)).toBeInTheDocument();
    }
  });

  it("renders one collapsible <details> per question", () => {
    const { container } = render(<Faq />);
    expect(container.querySelectorAll("details")).toHaveLength(FAQ_ITEMS.length);
  });
});

describe("FAQ_ITEMS data", () => {
  it("has no duplicate questions", () => {
    const questions = FAQ_ITEMS.map((i) => i.q);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("has non-empty answers", () => {
    for (const item of FAQ_ITEMS) {
      expect(item.a.trim().length).toBeGreaterThan(0);
    }
  });

  it("mentions the rupiah/QRIS and the privacy behavior in the right items", () => {
    const privacy = FAQ_ITEMS.find((i) => i.q.includes("private"));
    expect(privacy?.a).toMatch(/260ms/);
    const rupiah = FAQ_ITEMS.find((i) => i.q.includes("rupiah"));
    expect(rupiah?.a).toMatch(/QRIS/);
  });
});
