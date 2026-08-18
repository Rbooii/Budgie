import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatThinking } from "@/components/chat/chat-thinking";

describe("ChatThinking", () => {
  it("shows a spinning thinking state while streaming", () => {
    render(<ChatThinking part={{ type: "reasoning", text: "", state: "streaming" }} />);
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });

  it("shows a collapsed toggle once the reasoning is done", () => {
    render(
      <ChatThinking part={{ type: "reasoning", text: "Let me check.", state: "done" }} />,
    );
    expect(screen.getByText("Thought for a moment")).toBeInTheDocument();
    expect(screen.queryByText("Let me check.")).not.toBeInTheDocument();
  });

  it("expands and collapses the reasoning text on click", async () => {
    render(
      <ChatThinking part={{ type: "reasoning", text: "Let me check.", state: "done" }} />,
    );

    await userEvent.click(screen.getByText("Thought for a moment"));
    expect(screen.getByText("Let me check.")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Thought for a moment"));
    expect(screen.queryByText("Let me check.")).not.toBeInTheDocument();
  });

  it("does not expand while streaming", async () => {
    render(<ChatThinking part={{ type: "reasoning", text: "hidden", state: "streaming" }} />);
    await userEvent.click(screen.getByText("Thinking…"));
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
  });

  it("hides the chevron while streaming", () => {
    render(<ChatThinking part={{ type: "reasoning", text: "", state: "streaming" }} />);
    expect(screen.queryByRole("button", { name: /chevron/i })).toBeNull();
  });
});