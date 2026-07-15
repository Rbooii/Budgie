import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    budget: {
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
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/server/services/budgets";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const BUDGET_ID = 1;

const mockBudget = {
  id: BUDGET_ID,
  title: "Groceries",
  amount: 500000,
  category: "Food & Drink",
  userId: USER_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listBudgets", () => {
  it("scopes the query by userId and orders by createdAt desc", async () => {
    mockPrisma.budget.findMany.mockResolvedValue([mockBudget]);
    await listBudgets(USER_ID);
    expect(mockPrisma.budget.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getBudget", () => {
  it("filters by both id and userId (ownership scoping)", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(mockBudget);
    await getBudget(USER_ID, BUDGET_ID);
    expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith({
      where: { id: BUDGET_ID, userId: USER_ID },
    });
  });
});

describe("createBudget", () => {
  it("injects userId from the session, never trusts the input", async () => {
    mockPrisma.budget.create.mockResolvedValue(mockBudget);
    await createBudget(USER_ID, {
      title: "Groceries",
      amount: 500000,
      category: "Food & Drink",
    });
    expect(mockPrisma.budget.create).toHaveBeenCalledWith({
      data: {
        title: "Groceries",
        amount: 500000,
        category: "Food & Drink",
        userId: USER_ID,
      },
    });
  });
});

describe("updateBudget", () => {
  it("throws 'Not found' when the budget is not owned by the user", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(null);
    await expect(
      updateBudget(OTHER_USER_ID, BUDGET_ID, {
        title: "Renamed",
        amount: 2000,
        category: "Rent",
      }),
    ).rejects.toThrow("Not found");
    expect(mockPrisma.budget.update).not.toHaveBeenCalled();
  });

  it("updates when ownership is confirmed", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(mockBudget);
    mockPrisma.budget.update.mockResolvedValue({ ...mockBudget, title: "Renamed" });
    await updateBudget(USER_ID, BUDGET_ID, {
      title: "Renamed",
      amount: 2000,
      category: "Rent",
    });
    expect(mockPrisma.budget.update).toHaveBeenCalledWith({
      where: { id: BUDGET_ID },
      data: {
        title: "Renamed",
        amount: 2000,
        category: "Rent",
      },
    });
  });

  it("updates by id only (userId already validated via findFirst)", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(mockBudget);
    mockPrisma.budget.update.mockResolvedValue(mockBudget);
    await updateBudget(USER_ID, BUDGET_ID, {
      title: "X",
      amount: 1,
      category: "Rent",
    });
    const updateCall = mockPrisma.budget.update.mock.calls[0][0] as {
      where: { id?: number; userId?: string };
    };
    expect(updateCall.where).toEqual({ id: BUDGET_ID });
    expect(updateCall.where.userId).toBeUndefined();
  });
});

describe("deleteBudget", () => {
  it("throws 'Not found' when the budget is not owned by the user", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(null);
    await expect(deleteBudget(OTHER_USER_ID, BUDGET_ID)).rejects.toThrow("Not found");
    expect(mockPrisma.budget.delete).not.toHaveBeenCalled();
  });

  it("checks ownership with findFirst before deleting", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(mockBudget);
    mockPrisma.budget.delete.mockResolvedValue(mockBudget);
    await deleteBudget(USER_ID, BUDGET_ID);
    expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith({
      where: { id: BUDGET_ID, userId: USER_ID },
    });
    expect(mockPrisma.budget.delete).toHaveBeenCalledWith({
      where: { id: BUDGET_ID },
    });
  });
});
