import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/landing/footer";

describe("Footer", () => {
  it("renders the brand and tagline", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Budgie" })).toHaveAttribute("href", "/");
    expect(
      screen.getByText(/A calm, minimal personal-finance app/),
    ).toBeInTheDocument();
  });

  it("renders the link column headings", () => {
    render(<Footer />);
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("renders the Product links with anchor hrefs", () => {
    render(<Footer />);
    for (const [label, href] of [
      ["See it in motion", "/#motion"],
      ["Features", "/#features"],
      ["Stories", "/#stories"],
      ["Pricing", "/#pricing"],
      ["FAQ", "/#faq"],
    ] as const) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("renders the Account links pointing at /sign-in", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("shows the current copyright year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(`© ${year} Budgie. All rights reserved.`),
    ).toBeInTheDocument();
  });

  it("credits the stack", () => {
    render(<Footer />);
    expect(screen.getByText("Built with Next.js · Hono · Prisma")).toBeInTheDocument();
  });
});
