import { describe, it, expect } from "vitest";
import type { UIMessage } from "ai";
import { prepareMessagesForApi } from "@/server/chat/prepare";

function message(
  id: string,
  role: "user" | "assistant",
  parts: UIMessage["parts"],
): UIMessage {
  return { id, role, parts };
}

const textPart = { type: "text" as const, text: "hello" };
const toolPart = {
  type: "tool-get_balance_accounts" as const,
  toolCallId: "t1",
  state: "output-available" as const,
  input: {},
  output: { totalBalance: 1 },
};
const reasoningPart = {
  type: "reasoning" as const,
  text: "thinking…",
  state: "done" as const,
};

describe("prepareMessagesForApi", () => {
  it("trims the history to the last 10 messages", () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      message(`m${i}`, "user", [textPart]),
    );
    const result = prepareMessagesForApi(many);
    expect(result).toHaveLength(10);
    expect(result[0].id).toBe("m5");
  });

  it("keeps tool parts in the last two messages", () => {
    const messages = [
      message("old", "assistant", [toolPart]),
      message("recent-a", "assistant", [toolPart]),
      message("recent-b", "assistant", [toolPart]),
    ];
    const result = prepareMessagesForApi(messages);

    expect(result[0].parts).not.toContainEqual(toolPart);
    expect(result[1].parts).toContainEqual(toolPart);
    expect(result[2].parts).toContainEqual(toolPart);
  });

  it("keeps text parts of old messages", () => {
    const messages = [
      message("old", "assistant", [toolPart, textPart]),
      message("mid", "assistant", [toolPart]),
      message("recent", "assistant", [toolPart]),
    ];
    const result = prepareMessagesForApi(messages);
    expect(result[0].parts).toEqual([textPart]);
    expect(result[1].parts).toContainEqual(toolPart);
    expect(result[2].parts).toContainEqual(toolPart);
  });

  it("strips reasoning parts older than the last message", () => {
    const messages = [
      message("old", "assistant", [reasoningPart, textPart]),
      message("recent", "assistant", [reasoningPart]),
    ];
    const result = prepareMessagesForApi(messages);
    expect(result[0].parts).toEqual([textPart]);
    expect(result[1].parts).toContainEqual(reasoningPart);
  });

  it("returns messages unchanged when under the window", () => {
    const messages = [message("a", "user", [textPart])];
    expect(prepareMessagesForApi(messages)).toEqual(messages);
  });

  it("returns an empty array for empty input", () => {
    expect(prepareMessagesForApi([])).toEqual([]);
  });
});