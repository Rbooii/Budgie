import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearChat,
  loadChatDraft,
  loadChatMessages,
  loadChatModel,
  saveChatDraft,
  saveChatMessages,
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
  it("round-trips messages and draft for a user", () => {
    saveChatMessages("user-1", [message("a"), message("b")]);
    saveChatDraft("user-1", "half typed…");

    expect(loadChatMessages("user-1").map((m) => m.id)).toEqual(["a", "b"]);
    expect(loadChatDraft("user-1")).toBe("half typed…");
  });

  it("keeps messages and drafts isolated per user", () => {
    saveChatMessages("user-1", [message("a")]);
    saveChatDraft("user-1", "mine");

    expect(loadChatMessages("user-2")).toEqual([]);
    expect(loadChatDraft("user-2")).toBe("");
  });

  it("returns empty for absent or corrupt data", () => {
    expect(loadChatMessages("user-1")).toEqual([]);
    expect(loadChatDraft("user-1")).toBe("");

    window.localStorage.setItem("budgie.chat.user-1.messages", "{not json");
    window.localStorage.setItem("budgie.chat.user-1.draft", "ok");
    expect(loadChatMessages("user-1")).toEqual([]);
  });

  it("returns empty when the stored value is not an array", () => {
    window.localStorage.setItem("budgie.chat.user-1.messages", '"nope"');
    expect(loadChatMessages("user-1")).toEqual([]);
  });

  it("caps stored messages to the latest 200", () => {
    const many = Array.from({ length: 250 }, (_, i) => message(`m${i}`));
    saveChatMessages("user-1", many);
    expect(loadChatMessages("user-1")).toHaveLength(200);
    expect(loadChatMessages("user-1")[0].id).toBe("m50");
  });

  it("clears messages and draft", () => {
    saveChatMessages("user-1", [message("a")]);
    saveChatDraft("user-1", "draft");

    clearChat("user-1");

    expect(loadChatMessages("user-1")).toEqual([]);
    expect(loadChatDraft("user-1")).toBe("");
  });
});

describe("chat-storage model", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips the saved model", () => {
    saveChatModel("user-1", "gemini-2.5-flash-lite");
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash-lite");
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

  it("expires a saved model after 12 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T00:00:00"));
    saveChatModel("user-1", "gemini-2.5-flash-lite");

    vi.setSystemTime(new Date("2026-08-18T11:59:00"));
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash-lite");

    vi.setSystemTime(new Date("2026-08-18T12:01:00"));
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash");
  });

  it("resets the model on clear", () => {
    saveChatModel("user-1", "gemini-2.5-flash-lite");
    clearChat("user-1");
    expect(loadChatModel("user-1")).toBe("gemini-2.5-flash");
  });
});