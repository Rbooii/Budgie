import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountTabView, getInitials } from "@/components/account-tab";

describe("getInitials", () => {
  it("returns first two initials uppercased", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("uses only the first name initial when single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("uses first two words for initials", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("uppercases lowercase input", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

describe("AccountTabView", () => {
  it("renders the user name", () => {
    render(<AccountTabView userName="John Doe" plus={false} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders the initials in a circle", () => {
    render(<AccountTabView userName="John Doe" plus={false} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders the Get Budgie Plus button when plus is false", () => {
    render(<AccountTabView userName="John" plus={false} />);
    expect(screen.getByText("Get Budgie Plus")).toBeInTheDocument();
  });

  it("hides the Get Budgie Plus button when plus is true", () => {
    render(<AccountTabView userName="John" plus={true} />);
    expect(screen.queryByText("Get Budgie Plus")).not.toBeInTheDocument();
  });

  it("links the avatar to /profile", () => {
    render(<AccountTabView userName="John" plus={false} />);
    const link = screen.getByRole("link", { name: /john/i });
    expect(link.getAttribute("href")).toBe("/profile");
  });

  it("links the Get Budgie Plus button to /profile", () => {
    render(<AccountTabView userName="John" plus={false} />);
    const link = screen.getByRole("link", { name: /get budgie plus/i });
    expect(link.getAttribute("href")).toBe("/profile");
  });
});
