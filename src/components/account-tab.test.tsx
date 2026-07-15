import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountTab } from "@/components/account-tab";

describe("AccountTab", () => {
  it("renders the user name", () => {
    render(<AccountTab userName="John Doe" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders the initials in a circle", () => {
    render(<AccountTab userName="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("uses only the first name initial when single name", () => {
    render(<AccountTab userName="John" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("uses first two words for initials", () => {
    render(<AccountTab userName="John Michael Doe" />);
    expect(screen.getByText("JM")).toBeInTheDocument();
  });

  it("uppercases the initials", () => {
    render(<AccountTab userName="john doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders the Get Budgie Plus button", () => {
    render(<AccountTab userName="John" />);
    expect(screen.getByText("Get Budgie Plus")).toBeInTheDocument();
  });
});
