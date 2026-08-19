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
const BUDGET_ID = "bud-1";

const mockBudget = {
  id: BUDGET_ID,
  amount: 500000,
  category: "FoodAndDrink",
  currency: "IDR",
  userId: USER_ID,
  periodDays: 30,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.resetAllMocks();
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
    mockPrisma.budget.findFirst.mockResolvedValue(null);
    mockPrisma.budget.create.mockResolvedValue(mockBudget);
    await createBudget(USER_ID, {
      amount: 500000,
      category: "FoodAndDrink",
      periodDays: 30,
    });
    expect(mockPrisma.budget.create).toHaveBeenCalledWith({
      data: {
        amount: 500000,
        category: "FoodAndDrink",
        periodDays: 30,
        userId: USER_ID,
      },
    });
  });

  it("throws when a budget for the category already exists", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(mockBudget);
    await expect(
      createBudget(USER_ID, {
        amount: 500000,
        category: "FoodAndDrink",
        periodDays: 30,
      }),
    ).rejects.toThrow("Budget for this category already exists");
    expect(mockPrisma.budget.create).not.toHaveBeenCalled();
  });

  it("checks for an existing budget scoped to the user before creating", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(null);
    mockPrisma.budget.create.mockResolvedValue(mockBudget);
    await createBudget(USER_ID, {
      amount: 1,
      category: "Rent",
      periodDays: 7,
    });
    expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith({
      where: { userId: USER_ID, category: "Rent" },
    });
  });
});

describe("updateBudget", () => {
  it("throws 'Not found' when the budget is not owned by the user", async () => {
    mockPrisma.budget.findFirst.mockResolvedValue(null);
    await expect(
      updateBudget(OTHER_USER_ID, BUDGET_ID, {
        amount: 2000,
        category: "Rent",
        periodDays: 30,
      }),
    ).rejects.toThrow("Not found");
    expect(mockPrisma.budget.update).not.toHaveBeenCalled();
  });

  it("updates when ownership is confirmed and category is unchanged", async () => {
    mockPrisma.budget.findFirst
      .mockResolvedValueOnce(mockBudget)
      .mockResolvedValueOnce(null);
    mockPrisma.budget.update.mockResolvedValue({ ...mockBudget, amount: 2000 });
    await updateBudget(USER_ID, BUDGET_ID, {
      amount: 2000,
      category: "FoodAndDrink",
      periodDays: 30,
    });
    expect(mockPrisma.budget.update).toHaveBeenCalledWith({
      where: { id: BUDGET_ID },
      data: {
        amount: 2000,
        category: "FoodAndDrink",
        periodDays: 30,
      },
    });
  });

  it("throws when changing category to one that already has a budget", async () => {
    mockPrisma.budget.findFirst
      .mockResolvedValueOnce(mockBudget)
      .mockResolvedValueOnce({ ...mockBudget, id: "bud-2", category: "Rent" });
    await expect(
      updateBudget(USER_ID, BUDGET_ID, {
        amount: 2000,
        category: "Rent",
        periodDays: 30,
      }),
    ).rejects.toThrow("Budget for this category already exists");
    expect(mockPrisma.budget.update).not.toHaveBeenCalled();
  });

  it("allows changing category when no other budget uses it", async () => {
    mockPrisma.budget.findFirst
      .mockResolvedValueOnce(mockBudget)
      .mockResolvedValueOnce(null);
    mockPrisma.budget.update.mockResolvedValue({ ...mockBudget, category: "Rent" });
    await updateBudget(USER_ID, BUDGET_ID, {
      amount: 2000,
      category: "Rent",
      periodDays: 30,
    });
    const clashCall = mockPrisma.budget.findFirst.mock.calls[1][0] as {
      where: { userId: string; category: string; NOT: { id: string } };
    };
    expect(clashCall.where).toEqual({
      userId: USER_ID,
      category: "Rent",
      NOT: { id: BUDGET_ID },
    });
  });

  it("updates by id only (userId already validated via findFirst)", async () => {
    mockPrisma.budget.findFirst
      .mockResolvedValueOnce(mockBudget)
      .mockResolvedValueOnce(null);
    mockPrisma.budget.update.mockResolvedValue(mockBudget);
    await updateBudget(USER_ID, BUDGET_ID, {
      amount: 1,
      category: "FoodAndDrink",
      periodDays: 7,
    });
    const updateCall = mockPrisma.budget.update.mock.calls[0][0] as {
      where: { id?: string; userId?: string };
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
