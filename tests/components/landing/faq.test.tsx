import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq, FAQ_ITEMS } from "@/components/landing/faq";

describe("Faq", () => {
  it("renders the section heading", () => {
    render(<Faq />);
    expect(screen.getByText("Questions, answered.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Questions, answered." }),
    ).toBeInTheDocument();
  });

  it("labels the section with the faq title id", () => {
    render(<Faq />);
    const section = screen.getByText("Questions, answered.").closest("section");
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

  it("keeps the privacy and rupiah facts", () => {
    const privacy = FAQ_ITEMS.find((i) => i.q.includes("private"));
    expect(privacy?.a).toMatch(/260ms/);
    const rupiah = FAQ_ITEMS.find((i) => i.q.includes("rupiah"));
    expect(rupiah?.a).toMatch(/QRIS/);
  });

  it("describes Plus honestly as optional support", () => {
    const plus = FAQ_ITEMS.find((i) => i.q.includes("Plus"));
    expect(plus?.a).toMatch(/optional support/i);
    expect(plus?.a).toMatch(/Every feature stays free/i);
  });
});
