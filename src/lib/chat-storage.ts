import type { UIMessage } from "ai";
import {
  CUSTOM_MODEL_ID,
  isCustomModel,
  resolveChatModel,
  resolveModel,
  type ChatModelSelection,
} from "@/lib/chat-models";

const MESSAGES_KEY = (userId: string) => `budgie.chat.${userId}.messages`;
const DRAFT_KEY = (userId: string) => `budgie.chat.${userId}.draft`;
const MODEL_KEY = (userId: string) => `budgie.chat.${userId}.model`;
const ACTIVE_THREAD_KEY = (userId: string) => `budgie.chat.${userId}.activeThread`;

const MODEL_VALID_MS = 12 * 60 * 60 * 1000;

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / privacy-mode failures
  }
}

function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Legacy single-conversation storage. Read once so the first visit after the
 * history release can keep the old messages as an unsaved draft conversation.
 */
export function loadLegacyChatMessages(userId: string): UIMessage[] {
  const raw = readRaw(MESSAGES_KEY(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-200) as UIMessage[];
  } catch {
    return [];
  }
}

export function clearLegacyChatMessages(userId: string) {
  removeKey(MESSAGES_KEY(userId));
}

export function loadChatDraft(userId: string): string {
  return readRaw(DRAFT_KEY(userId)) ?? "";
}

export function saveChatDraft(userId: string, text: string) {
  writeRaw(DRAFT_KEY(userId), text);
}

export function loadChatModel(userId: string): ChatModelSelection {
  const raw = readRaw(MODEL_KEY(userId));
  if (!raw) return resolveModel(undefined);
  try {
    const parsed = JSON.parse(raw) as { model?: unknown; savedAt?: unknown };
    if (typeof parsed.model !== "string") return resolveModel(undefined);
    const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;

    // The 12h expiry exists for the Gemini free-tier daily reset. A custom
    // provider selection is a deliberate user choice and should persist.
    if (parsed.model === CUSTOM_MODEL_ID) return CUSTOM_MODEL_ID;
    const resolved = resolveChatModel(parsed.model);
    if (isCustomModel(resolved)) return resolved;
    if (Date.now() - savedAt > MODEL_VALID_MS) return resolveModel(undefined);
    return resolved;
  } catch {
    return resolveModel(undefined);
  }
}

export function saveChatModel(userId: string, model: ChatModelSelection) {
  writeRaw(
    MODEL_KEY(userId),
    JSON.stringify({ model, savedAt: Date.now() }),
  );
}

export function loadActiveThreadId(userId: string): string | null {
  return readRaw(ACTIVE_THREAD_KEY(userId));
}

export function saveActiveThreadId(userId: string, threadId: string) {
  writeRaw(ACTIVE_THREAD_KEY(userId), threadId);
}

export function clearActiveThreadId(userId: string) {
  removeKey(ACTIVE_THREAD_KEY(userId));
}

/** New chat: drop the draft, legacy messages and active pointer, keep the model. */
export function clearChat(userId: string) {
  removeKey(MESSAGES_KEY(userId));
  removeKey(DRAFT_KEY(userId));
  removeKey(ACTIVE_THREAD_KEY(userId));
}
