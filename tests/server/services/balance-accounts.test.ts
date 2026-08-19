import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    balanceAccount: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    }
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  listBalanceAccounts,
  getBalanceAccount,
  createBalanceAccount,
  updateBalanceAccount,
  deleteBalanceAccount,
} from "@/server/services/balance-accounts";
import { balanceAccounts } from "@/server/routes/balance-accounts";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const ACCOUNT_ID = "acc-1";

const mockAccount = {
  id: ACCOUNT_ID,
  name: "BCA",
  balance: 1500000,
  currency: "IDR",
  type: "bank",
  userId: USER_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listBalanceAccounts", () => {
  it("scopes the query by userId", async () => {
    mockPrisma.balanceAccount.findMany.mockResolvedValue([mockAccount]);
    await listBalanceAccounts(USER_ID);
    expect(mockPrisma.balanceAccount.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getBalanceAccount", () => {
  it("filters by both id and userId (ownership scoping)", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockAccount);
    await getBalanceAccount(USER_ID, ACCOUNT_ID);
    expect(mockPrisma.balanceAccount.findFirst).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID, userId: USER_ID },
    });
  });
});

describe("createBalanceAccount", () => {
  it("injects userId from the session, never trusts the input", async () => {
    mockPrisma.balanceAccount.create.mockResolvedValue(mockAccount);
    await createBalanceAccount(USER_ID, {
      name: "BCA",
      balance: 1500000,
      currency: "IDR",
      type: "bank",
    });
    expect(mockPrisma.balanceAccount.create).toHaveBeenCalledWith({
      data: {
        name: "BCA",
        balance: 1500000,
        currency: "IDR",
        type: "bank",
        userId: USER_ID,
      },
    });
  });
});

describe("updateBalanceAccount", () => {
  it("throws 'Not found' when the account is not owned by the user", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(null);
    await expect(
      updateBalanceAccount(OTHER_USER_ID, ACCOUNT_ID, {
        name: "Renamed",
        balance: 2000,
        currency: "IDR",
        type: "bank",
      }),
    ).rejects.toThrow("Not found");
    expect(mockPrisma.balanceAccount.update).not.toHaveBeenCalled();
  });

  it("updates when ownership is confirmed", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockAccount);
    mockPrisma.balanceAccount.update.mockResolvedValue({ ...mockAccount, name: "Renamed" });
    await updateBalanceAccount(USER_ID, ACCOUNT_ID, {
      name: "Renamed",
      balance: 2000,
      currency: "IDR",
      type: "bank",
    });
    expect(mockPrisma.balanceAccount.update).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID },
      data: {
        name: "Renamed",
        balance: 2000,
        currency: "IDR",
        type: "bank",
      },
    });
  });
});

describe("deleteBalanceAccount", () => {
  it("throws 'Not found' when the account is not owned by the user (prevents cross-user delete)", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(null);
    await expect(deleteBalanceAccount(OTHER_USER_ID, ACCOUNT_ID)).rejects.toThrow("Not found");
    expect(mockPrisma.balanceAccount.delete).not.toHaveBeenCalled();
  });

  it("checks ownership with findFirst({ where: { id, userId } }) before deleting", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockAccount);
    mockPrisma.balanceAccount.delete.mockResolvedValue(mockAccount);
    await deleteBalanceAccount(USER_ID, ACCOUNT_ID);
    expect(mockPrisma.balanceAccount.findFirst).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID, userId: USER_ID },
    });
    expect(mockPrisma.transaction.deleteMany).toHaveBeenCalledWith({
      where : { balanceAccountId : ACCOUNT_ID }
    })
    expect(mockPrisma.balanceAccount.delete).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID },
    });
  });

  it("deletes by id only (userId already validated via findFirst)", async () => {
    mockPrisma.balanceAccount.findFirst.mockResolvedValue(mockAccount);
    mockPrisma.balanceAccount.delete.mockResolvedValue(mockAccount);
    await deleteBalanceAccount(USER_ID, ACCOUNT_ID);
    const deleteCall = mockPrisma.balanceAccount.delete.mock.calls[0][0] as {
      where: { id?: string; userId?: string };
    };
    expect(deleteCall.where).toEqual({ id: ACCOUNT_ID });
    expect(deleteCall.where.userId).toBeUndefined();
  });
});
