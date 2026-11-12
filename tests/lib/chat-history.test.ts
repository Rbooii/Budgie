import { describe, expect, it } from "vitest";
import {
  CHAT_HISTORY_DAYS,
  MAX_THREAD_MESSAGES,
  MAX_THREAD_TITLE,
  threadTitle,
} from "@/lib/chat-history";

describe("threadTitle", () => {
  it("collapses whitespace into a single line", () => {
    expect(threadTitle("  How much\n did I \t spend?  ")).toBe(
      "How much did I spend?",
    );
  });

  it("falls back for empty input", () => {
    expect(threadTitle("   ")).toBe("New chat");
  });

  it("truncates long prompts with three dots", () => {
    const title = threadTitle("x".repeat(MAX_THREAD_TITLE + 20));
    expect(title.length).toBeLessThanOrEqual(MAX_THREAD_TITLE);
    expect(title.endsWith("...")).toBe(true);
  });

  it("keeps the two-day retention and message cap constants", () => {
    expect(CHAT_HISTORY_DAYS).toBe(2);
    expect(MAX_THREAD_MESSAGES).toBe(200);
  });
});
