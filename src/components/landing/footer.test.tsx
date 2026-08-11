import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/landing/footer";

describe("Footer", () => {
  it("renders the brand wordmark linking home", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Budgie" })).toHaveAttribute("href", "/");
  });

  it("links every product section that actually exists", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "href",
      "/#features",
    );
    expect(screen.getByRole("link", { name: "Use cases" })).toHaveAttribute(
      "href",
      "/#use-cases",
    );
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/#pricing",
    );
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute(
      "href",
      "/#faq",
    );
  });

  it("links the auth entry points", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("omits invented chrome (language selector, cookie settings)", () => {
    render(<Footer />);
    expect(screen.queryByRole("combobox", { name: "Language" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cookie settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "About us" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Web Clipper" })).not.toBeInTheDocument();
  });

  it("shows the current copyright year", () => {
    render(<Footer />);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Budgie.`),
    ).toBeInTheDocument();
  });
});
