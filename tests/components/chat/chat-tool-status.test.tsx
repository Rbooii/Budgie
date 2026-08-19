import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatToolStatus } from "@/components/chat/chat-tool-status";

describe("ChatToolStatus", () => {
  it("renders the running label", () => {
    render(<ChatToolStatus running="Looking up your accounts…" />);
    expect(screen.getByText("Looking up your accounts…")).toBeInTheDocument();
  });

  it("renders a spinner", () => {
    const { container } = render(<ChatToolStatus running="Working…" />);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });
});