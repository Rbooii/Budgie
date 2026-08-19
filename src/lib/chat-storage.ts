import type { UIMessage } from "ai";
import { resolveModel, type ChatModelId } from "@/lib/chat-models";

const MESSAGES_KEY = (userId: string) => `budgie.chat.${userId}.messages`;
const DRAFT_KEY = (userId: string) => `budgie.chat.${userId}.draft`;
const MODEL_KEY = (userId: string) => `budgie.chat.${userId}.model`;

const MAX_MESSAGES = 200;
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

export function loadChatMessages(userId: string): UIMessage[] {
  const raw = readRaw(MESSAGES_KEY(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_MESSAGES) as UIMessage[];
  } catch {
    return [];
  }
}

export function saveChatMessages(userId: string, messages: UIMessage[]) {
  writeRaw(MESSAGES_KEY(userId), JSON.stringify(messages.slice(-MAX_MESSAGES)));
}

export function loadChatDraft(userId: string): string {
  return readRaw(DRAFT_KEY(userId)) ?? "";
}

export function saveChatDraft(userId: string, text: string) {
  writeRaw(DRAFT_KEY(userId), text);
}

export function loadChatModel(userId: string): ChatModelId {
  const raw = readRaw(MODEL_KEY(userId));
  if (!raw) return resolveModel(undefined);
  try {
    const parsed = JSON.parse(raw) as { model?: unknown; savedAt?: unknown };
    if (typeof parsed.model !== "string") return resolveModel(undefined);
    const savedAt =
      typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
    if (Date.now() - savedAt > MODEL_VALID_MS) return resolveModel(undefined);
    return resolveModel(parsed.model);
  } catch {
    return resolveModel(undefined);
  }
}

export function saveChatModel(userId: string, model: ChatModelId) {
  writeRaw(
    MODEL_KEY(userId),
    JSON.stringify({ model, savedAt: Date.now() }),
  );
}

export function clearChat(userId: string) {
  removeKey(MESSAGES_KEY(userId));
  removeKey(DRAFT_KEY(userId));
  removeKey(MODEL_KEY(userId));
}