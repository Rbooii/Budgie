import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UseCases } from "@/components/landing/use-cases";

describe("UseCases", () => {
  it("renders the 'See what Budgie can do' header", () => {
    render(<UseCases />);
    expect(screen.getByText("See what Budgie can do")).toBeInTheDocument();
  });

  it("renders all five use-case links pointing at /sign-in", () => {
    render(<UseCases />);
    for (const title of [
      "Tally the month\u2019s income",
      "Catch a spending leak",
      "Stay under every budget",
      "Never miss a renewal",
      "Export records to PDF",
    ]) {
      expect(screen.getByRole("link", { name: title })).toHaveAttribute(
        "href",
        "/sign-in",
      );
    }
  });

  it("uses 16px bold titles (Notion card-summary type)", () => {
    render(<UseCases />);
    const title = screen.getByText("Catch a spending leak");
    expect(title.className).toContain("text-base");
    expect(title.className).toContain("font-bold");
  });
});
