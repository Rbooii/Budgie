import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    chatThread: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  clearChatThreads,
  createChatThread,
  deleteChatThread,
  getChatThread,
  listChatThreads,
  pruneExpiredChatThreads,
  saveChatThreadMessages,
} from "@/server/services/chat-threads";

const USER_ID = "user-1";
const NOW = new Date("2026-08-18T12:00:00.000Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "thread-1",
    title: "Spending this month",
    model: "gemini-2.5-flash",
    messageCount: 4,
    createdAt: new Date("2026-08-18T10:00:00.000Z"),
    updatedAt: new Date("2026-08-18T11:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.chatThread.deleteMany.mockResolvedValue({ count: 0 });
});

describe("chat threads service", () => {
  it("prunes threads older than two days", async () => {
    await pruneExpiredChatThreads(USER_ID, NOW);

    const where = prismaMock.chatThread.deleteMany.mock.calls[0][0].where;
    expect(where.userId).toBe(USER_ID);
    expect(where.updatedAt.lt).toEqual(
      new Date("2026-08-16T12:00:00.000Z"),
    );
  });

  it("lists only non-empty threads and maps dates to ISO strings", async () => {
    prismaMock.chatThread.findMany.mockResolvedValue([row()]);

    const threads = await listChatThreads(USER_ID);

    expect(threads).toEqual([
      {
        id: "thread-1",
        title: "Spending this month",
        model: "gemini-2.5-flash",
        messageCount: 4,
        createdAt: "2026-08-18T10:00:00.000Z",
        updatedAt: "2026-08-18T11:00:00.000Z",
      },
    ]);
    expect(prismaMock.chatThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, messageCount: { gt: 0 } },
      }),
    );
  });

  it("gets a thread only when it belongs to the user", async () => {
    prismaMock.chatThread.findFirst.mockResolvedValue(
      row({ messages: [{ id: "m1" }] }),
    );

    const thread = await getChatThread(USER_ID, "thread-1", NOW);
    expect(thread?.messages).toEqual([{ id: "m1" }]);
    expect(prismaMock.chatThread.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "thread-1",
          userId: USER_ID,
          updatedAt: { gte: new Date("2026-08-16T12:00:00.000Z") },
        },
      }),
    );
  });

  it("returns null for a missing thread", async () => {
    prismaMock.chatThread.findFirst.mockResolvedValue(null);
    expect(await getChatThread(USER_ID, "missing")).toBeNull();
  });

  it("normalizes the title on create", async () => {
    prismaMock.chatThread.create.mockImplementation(
      ({ data }: { data: { title: string; model: string | null } }) =>
        Promise.resolve(row({ title: data.title, model: data.model })),
    );

    const title = "x".repeat(120);
    const thread = await createChatThread(USER_ID, {
      title,
      model: "gemini-2.5-flash",
    });

    expect(thread.title.length).toBeLessThanOrEqual(60);
    expect(thread.title.endsWith("...")).toBe(true);
  });

  it("caps saved messages at 200 and updates the count", async () => {
    prismaMock.chatThread.updateMany.mockResolvedValue({ count: 1 });
    const messages = Array.from({ length: 250 }, (_, i) => ({ id: `m${i}` }));

    await saveChatThreadMessages(USER_ID, "thread-1", messages);

    const data = prismaMock.chatThread.updateMany.mock.calls[0][0].data;
    expect((data.messages as unknown[]).length).toBe(200);
    expect(data.messageCount).toBe(200);
  });

  it("throws when saving to a thread that is not owned", async () => {
    prismaMock.chatThread.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      saveChatThreadMessages(USER_ID, "missing", []),
    ).rejects.toThrow("Not found");
  });

  it("throws when deleting a thread that is not owned", async () => {
    prismaMock.chatThread.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteChatThread(USER_ID, "missing")).rejects.toThrow(
      "Not found",
    );
  });

  it("clears every thread for the user", async () => {
    await clearChatThreads(USER_ID);
    expect(prismaMock.chatThread.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
  });
});
