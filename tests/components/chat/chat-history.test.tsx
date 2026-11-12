import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ChatHistoryRail,
  ChatHistorySheet,
} from "@/components/chat/chat-history";
import type { ChatThreadSummary } from "@/lib/chat-history";

function thread(
  id: string,
  title: string,
  ageDays: number,
): ChatThreadSummary {
  const date = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
  return {
    id,
    title,
    model: "gemini-2.5-flash",
    messageCount: 2,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
  };
}

const THREADS = [
  thread("today", "Spending today", 0),
  thread("yesterday", "Budget review", 1),
];

const baseProps = {
  threads: THREADS,
  activeId: "today",
  onSelect: vi.fn(),
  onDelete: vi.fn(),
};

describe("ChatHistoryRail", () => {
  it("groups threads by Today and Yesterday", () => {
    render(<ChatHistoryRail {...baseProps} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    expect(screen.getByText("Spending today")).toBeInTheDocument();
    expect(screen.getByText("Budget review")).toBeInTheDocument();
    expect(screen.getByText("History is kept for 2 days.")).toBeInTheDocument();
  });

  it("marks the active thread and selects another", async () => {
    const onSelect = vi.fn();
    render(<ChatHistoryRail {...baseProps} onSelect={onSelect} />);

    expect(screen.getByText("Spending today").closest("button")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await userEvent.click(screen.getByText("Budget review"));
    expect(onSelect).toHaveBeenCalledWith("yesterday");
  });

  it("has no duplicate New chat action", () => {
    render(<ChatHistoryRail {...baseProps} />);
    expect(screen.queryByRole("button", { name: "New chat" })).toBeNull();
  });

  it("deletes a thread", async () => {
    const onDelete = vi.fn();
    render(<ChatHistoryRail {...baseProps} onDelete={onDelete} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete Spending today" }),
    );
    expect(onDelete).toHaveBeenCalledWith("today");
  });

  it("shows the empty state", () => {
    render(<ChatHistoryRail {...baseProps} threads={[]} />);
    expect(screen.getByText(/No chats yet/)).toBeInTheDocument();
  });
});

describe("ChatHistorySheet", () => {
  it("renders a right-side modal dialog and closes on Escape", () => {
    const onClose = vi.fn();
    render(<ChatHistorySheet {...baseProps} open onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: "Chat history" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.className).toContain("right-0");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("has no New chat action", () => {
    render(<ChatHistorySheet {...baseProps} open onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "New chat" })).toBeNull();
  });
});
