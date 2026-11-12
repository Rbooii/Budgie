import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  CHAT_HISTORY_DAYS,
  MAX_THREAD_MESSAGES,
  MAX_THREADS,
  threadTitle,
  type ChatThreadDetail,
  type ChatThreadSummary,
} from "@/lib/chat-history";

const DAY_MS = 24 * 60 * 60 * 1000;

const summarySelect = {
  id: true,
  title: true,
  model: true,
  messageCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toSummary(row: {
  id: string;
  title: string;
  model: string | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}): ChatThreadSummary {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    messageCount: row.messageCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function sanitizeMessages(messages: unknown[]): unknown[] {
  return messages.slice(-MAX_THREAD_MESSAGES);
}

function normalizeTitle(input: string | undefined, fallback = "New chat"): string {
  if (!input?.trim()) return fallback;
  return threadTitle(input);
}

/** Delete threads older than the 2-day window (lazy, per user). */
export async function pruneExpiredChatThreads(
  userId: string,
  now = new Date(),
): Promise<void> {
  const cutoff = new Date(now.getTime() - CHAT_HISTORY_DAYS * DAY_MS);
  await prisma.chatThread.deleteMany({
    where: { userId, updatedAt: { lt: cutoff } },
  });
}

export async function listChatThreads(
  userId: string,
): Promise<ChatThreadSummary[]> {
  await pruneExpiredChatThreads(userId);
  const rows = await prisma.chatThread.findMany({
    where: { userId, messageCount: { gt: 0 } },
    select: summarySelect,
    orderBy: { updatedAt: "desc" },
    take: MAX_THREADS,
  });
  return rows.map(toSummary);
}

export async function getChatThread(
  userId: string,
  id: string,
  now = new Date(),
): Promise<ChatThreadDetail | null> {
  const cutoff = new Date(now.getTime() - CHAT_HISTORY_DAYS * DAY_MS);
  const row = await prisma.chatThread.findFirst({
    where: { id, userId, updatedAt: { gte: cutoff } },
    select: { ...summarySelect, messages: true },
  });
  if (!row) return null;
  return {
    ...toSummary(row),
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

export async function createChatThread(
  userId: string,
  input: { title?: string; model?: string } = {},
): Promise<ChatThreadSummary> {
  const row = await prisma.chatThread.create({
    data: {
      userId,
      title: normalizeTitle(input.title),
      model: input.model?.slice(0, 120) ?? null,
      messages: [],
      messageCount: 0,
    },
    select: summarySelect,
  });
  return toSummary(row);
}

/** Save the complete UIMessage[] snapshot after a turn. */
export async function saveChatThreadMessages(
  userId: string,
  id: string,
  messages: unknown[],
  now = new Date(),
): Promise<void> {
  const items = sanitizeMessages(messages);
  const cutoff = new Date(now.getTime() - CHAT_HISTORY_DAYS * DAY_MS);
  const result = await prisma.chatThread.updateMany({
    where: { id, userId, updatedAt: { gte: cutoff } },
    data: {
      messages: items as Prisma.InputJsonValue,
      messageCount: items.length,
      updatedAt: now,
    },
  });
  if (result.count === 0) throw new Error("Not found");
}

export async function renameChatThread(
  userId: string,
  id: string,
  title: string,
  now = new Date(),
): Promise<void> {
  const cutoff = new Date(now.getTime() - CHAT_HISTORY_DAYS * DAY_MS);
  const result = await prisma.chatThread.updateMany({
    where: { id, userId, updatedAt: { gte: cutoff } },
    data: { title: normalizeTitle(title), updatedAt: now },
  });
  if (result.count === 0) throw new Error("Not found");
}

export async function deleteChatThread(
  userId: string,
  id: string,
): Promise<void> {
  const result = await prisma.chatThread.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("Not found");
}

export async function clearChatThreads(userId: string): Promise<void> {
  await prisma.chatThread.deleteMany({ where: { userId } });
}

export type { ChatThreadDetail, ChatThreadSummary };
