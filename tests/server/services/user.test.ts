import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { getPlusStatus, updatePlusStatus } from "@/server/services/user";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getPlusStatus", () => {
  it("selects only the plus column and scopes by userId", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ plus: false });
    await getPlusStatus(USER_ID);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { plus: true },
    });
  });

  it("returns { plus: false } for a free user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ plus: false });
    const result = await getPlusStatus(USER_ID);
    expect(result).toEqual({ plus: false });
  });

  it("returns { plus: true } for a plus user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ plus: true });
    const result = await getPlusStatus(USER_ID);
    expect(result).toEqual({ plus: true });
  });

  it("returns null when the user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const result = await getPlusStatus(OTHER_USER_ID);
    expect(result).toBeNull();
  });

  it("does not return the full user row (no email/image leak)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ plus: true });
    const result = await getPlusStatus(USER_ID);
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("image");
    expect(result).not.toHaveProperty("name");
  });
});

describe("updatePlusStatus", () => {
  it("throws 'Not found' when the user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      updatePlusStatus(OTHER_USER_ID, { plus: true }),
    ).rejects.toThrow("Not found");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("checks ownership with findUnique({ where: { id } }) before updating", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
    mockPrisma.user.update.mockResolvedValue({ plus: true });
    await updatePlusStatus(USER_ID, { plus: true });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { id: true },
    });
  });

  it("updates by id and selects only plus", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
    mockPrisma.user.update.mockResolvedValue({ plus: true });
    await updatePlusStatus(USER_ID, { plus: true });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { plus: true },
      select: { plus: true },
    });
  });

  it("returns { plus: true } when upgrading", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
    mockPrisma.user.update.mockResolvedValue({ plus: true });
    const result = await updatePlusStatus(USER_ID, { plus: true });
    expect(result).toEqual({ plus: true });
  });

  it("returns { plus: false } when downgrading", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
    mockPrisma.user.update.mockResolvedValue({ plus: false });
    const result = await updatePlusStatus(USER_ID, { plus: false });
    expect(result).toEqual({ plus: false });
  });

  it("does not return the full user row (no email/image leak)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
    mockPrisma.user.update.mockResolvedValue({ plus: true });
    const result = await updatePlusStatus(USER_ID, { plus: true });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("image");
  });
});
