import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/server/services/subscriptions";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const SUB_ID = "sub-1";

const mockSubscription = {
  id: SUB_ID,
  name: "Netflix",
  amount: 149000,
  currency: "IDR",
  category: "Entertainment",
  periodDays: 30,
  startDate: new Date("2026-01-01"),
  active: true,
  userId: USER_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("listSubscriptions", () => {
  it("scopes the query by userId and orders by createdAt desc", async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([mockSubscription]);
    await listSubscriptions(USER_ID);
    expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns an empty array when the user has no subscriptions", async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([]);
    await expect(listSubscriptions(USER_ID)).resolves.toEqual([]);
  });
});

describe("getSubscription", () => {
  it("filters by both id and userId (ownership scoping)", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
    await getSubscription(USER_ID, SUB_ID);
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { id: SUB_ID, userId: USER_ID },
    });
  });

  it("returns null when the subscription belongs to another user", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    await expect(getSubscription(OTHER_USER_ID, SUB_ID)).resolves.toBeNull();
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { id: SUB_ID, userId: OTHER_USER_ID },
    });
  });
});

describe("createSubscription", () => {
  const input = {
    name: "Spotify",
    amount: 54900,
    currency: "IDR",
    category: "Entertainment" as const,
    periodDays: 30,
    startDate: new Date("2026-01-01"),
    active: true,
  };

  it("injects userId from the session, never trusts the input", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.create.mockResolvedValue(mockSubscription);
    await createSubscription(USER_ID, input);
    expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
      data: { ...input, userId: USER_ID },
    });
  });

  it("checks for an existing subscription scoped to (userId, name) before creating", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.create.mockResolvedValue(mockSubscription);
    await createSubscription(USER_ID, input);
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { userId: USER_ID, name: "Spotify" },
    });
  });

  it("throws when a subscription with the same name already exists", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
    await expect(createSubscription(USER_ID, input)).rejects.toThrow(
      "Subscription with this name already exists",
    );
    expect(mockPrisma.subscription.create).not.toHaveBeenCalled();
  });

  it("allows the same name for a different user", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.create.mockResolvedValue({
      ...mockSubscription,
      userId: OTHER_USER_ID,
    });
    await createSubscription(OTHER_USER_ID, input);
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { userId: OTHER_USER_ID, name: "Spotify" },
    });
    expect(mockPrisma.subscription.create).toHaveBeenCalledTimes(1);
  });
});

describe("updateSubscription", () => {
  const updateInput = {
    name: "Netflix Premium",
    amount: 186000,
    currency: "IDR",
    category: "Entertainment" as const,
    periodDays: 30,
    startDate: new Date("2026-01-01"),
    active: true,
  };

  it("throws 'Not found' when the subscription is not owned by the user", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    await expect(
      updateSubscription(OTHER_USER_ID, SUB_ID, updateInput),
    ).rejects.toThrow("Not found");
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("updates without a clash check when the name is unchanged", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
    mockPrisma.subscription.update.mockResolvedValue({
      ...mockSubscription,
      amount: 186000,
    });
    await updateSubscription(USER_ID, SUB_ID, {
      ...updateInput,
      name: "Netflix", // same name as owned
    });
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledTimes(1);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: SUB_ID },
      data: { ...updateInput, name: "Netflix" },
    });
  });

  it("throws when renaming to a name that belongs to another subscription", async () => {
    mockPrisma.subscription.findFirst
      .mockResolvedValueOnce(mockSubscription)
      .mockResolvedValueOnce({ ...mockSubscription, id: "sub-2", name: "Spotify" });
    await expect(
      updateSubscription(USER_ID, SUB_ID, updateInput),
    ).rejects.toThrow("Subscription with this name already exists");
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("scopes the clash check to the user and excludes self", async () => {
    mockPrisma.subscription.findFirst
      .mockResolvedValueOnce(mockSubscription)
      .mockResolvedValueOnce(null);
    mockPrisma.subscription.update.mockResolvedValue({
      ...mockSubscription,
      ...updateInput,
    });
    await updateSubscription(USER_ID, SUB_ID, updateInput);
    const clashCall = mockPrisma.subscription.findFirst.mock.calls[1][0] as {
      where: { userId: string; name: string; NOT: { id: string } };
    };
    expect(clashCall.where).toEqual({
      userId: USER_ID,
      name: "Netflix Premium",
      NOT: { id: SUB_ID },
    });
  });

  it("updates by id only (userId already validated via findFirst)", async () => {
    mockPrisma.subscription.findFirst
      .mockResolvedValueOnce(mockSubscription)
      .mockResolvedValueOnce(null);
    mockPrisma.subscription.update.mockResolvedValue(mockSubscription);
    await updateSubscription(USER_ID, SUB_ID, updateInput);
    const updateCall = mockPrisma.subscription.update.mock.calls[0][0] as {
      where: { id?: string; userId?: string };
    };
    expect(updateCall.where).toEqual({ id: SUB_ID });
    expect(updateCall.where.userId).toBeUndefined();
  });
});

describe("deleteSubscription", () => {
  it("throws 'Not found' when the subscription is not owned by the user", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    await expect(deleteSubscription(OTHER_USER_ID, SUB_ID)).rejects.toThrow(
      "Not found",
    );
    expect(mockPrisma.subscription.delete).not.toHaveBeenCalled();
  });

  it("checks ownership with findFirst before deleting", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
    mockPrisma.subscription.delete.mockResolvedValue(mockSubscription);
    await deleteSubscription(USER_ID, SUB_ID);
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { id: SUB_ID, userId: USER_ID },
    });
    expect(mockPrisma.subscription.delete).toHaveBeenCalledWith({
      where: { id: SUB_ID },
    });
  });
});
