import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearActiveThreadId,
  clearChat,
  clearLegacyChatMessages,
  loadActiveThreadId,
  loadChatDraft,
  loadChatModel,
  loadLegacyChatMessages,
  saveActiveThreadId,
  saveChatDraft,
  saveChatModel,
} from "@/lib/chat-storage";

const message = (id: string) => ({
  id,
  role: "assistant" as const,
  parts: [{ type: "text" as const, text: `hello ${id}` }],
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("chat-storage", () => {
  it("round-trips the draft for a user", () => {
    saveChatDraft("user-1", "half typed");
    expect(loadChatDraft("user-1")).toBe("half typed");
  });

  it("keeps drafts isolated per user", () => {
    saveChatDraft("user-1", "mine");
    expect(loadChatDraft("user-2")).toBe("");
  });

  it("round-trips the active thread id", () => {
    saveActiveThreadId("user-1", "thread-1");
    expect(loadActiveThreadId("user-1")).toBe("thread-1");

    clearActiveThreadId("user-1");
    expect(loadActiveThreadId("user-1")).toBeNull();
  });

  it("reads legacy messages once and caps them at 200", () => {
    const many = Array.from({ length: 250 }, (_, i) => message(`m${i}`));
    window.localStorage.setItem(
      "budgie.chat.user-1.messages",
      JSON.stringify(many),
    );

    const legacy = loadLegacyChatMessages("user-1");
    expect(legacy).toHaveLength(200);
    expect((legacy[0] as { id: string }).id).toBe("m50");

    clearLegacyChatMessages("user-1");
    expect(loadLegacyChatMessages("user-1")).toEqual([]);
  });

  it("returns empty for absent or corrupt legacy data", () => {
    expect(loadLegacyChatMessages("user-1")).toEqual([]);
    window.localStorage.setItem("budgie.chat.user-1.messages", "{not json");
    expect(loadLegacyChatMessages("user-1")).toEqual([]);
    window.localStorage.setItem("budgie.chat.user-1.messages", '"nope"');
    expect(loadLegacyChatMessages("user-1")).toEqual([]);
  });

  it("clears draft, legacy messages and active thread but keeps the model", () => {
    saveChatDraft("user-1", "draft");
    saveActiveThreadId("user-1", "thread-1");
    window.localStorage.setItem(
      "budgie.chat.user-1.messages",
      JSON.stringify([message("a")]),
    );
    saveChatModel("user-1", "gemini-3.5-flash-lite");

    clearChat("user-1");

    expect(loadChatDraft("user-1")).toBe("");
    expect(loadActiveThreadId("user-1")).toBeNull();
    expect(loadLegacyChatMessages("user-1")).toEqual([]);
    expect(loadChatModel("user-1")).toBe("gemini-3.5-flash-lite");
  });
});

describe("chat-storage model", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips the saved model", () => {
    saveChatModel("user-1", "gemini-3.5-flash-lite");
    expect(loadChatModel("user-1")).toBe("gemini-3.5-flash-lite");
  });

  it("defaults to the primary model when nothing is saved", () => {
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash");
  });

  it("ignores unknown or corrupt model values", () => {
    window.localStorage.setItem(
      "budgie.chat.user-1.model",
      JSON.stringify({ model: "gpt-4o", savedAt: Date.now() }),
    );
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash");

    window.localStorage.setItem("budgie.chat.user-1.model", "{bad json");
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash");
  });

  it("expires a saved built-in model after 12 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T00:00:00"));
    saveChatModel("user-1", "gemini-3.5-flash-lite");

    vi.setSystemTime(new Date("2026-08-18T11:59:00"));
    expect(loadChatModel("user-1")).toBe("gemini-3.5-flash-lite");

    vi.setSystemTime(new Date("2026-08-18T12:01:00"));
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash");
  });

  it("keeps a custom model selection without expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T00:00:00"));
    saveChatModel("user-1", "custom");

    vi.setSystemTime(new Date("2026-08-20T00:00:00"));
    expect(loadChatModel("user-1")).toBe("custom");
  });
});
