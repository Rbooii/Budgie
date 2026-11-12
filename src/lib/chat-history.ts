/** Chat history is intentionally short-lived: the last 2 days only. */
export const CHAT_HISTORY_DAYS = 2;
export const MAX_THREAD_MESSAGES = 200;
export const MAX_THREADS = 50;
export const MAX_THREAD_TITLE = 60;

export type ChatThreadSummary = {
  id: string;
  title: string;
  model: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatThreadDetail = ChatThreadSummary & {
  messages: unknown[];
};

/** First user message -> a short, single-line thread title. */
export function threadTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "New chat";
  if (normalized.length <= MAX_THREAD_TITLE) return normalized;
  return `${normalized.slice(0, MAX_THREAD_TITLE - 3).trimEnd()}...`;
}
