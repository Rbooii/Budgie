import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/services/budgets", () => ({
  listBudgets: vi.fn(),
  getBudget: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
}));

import {
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/server/services/budgets";
import * as controller from "@/server/controllers/budgets";

const USER_ID = "user-1";

function mockContext(params: Record<string, string> = {}, body?: unknown) {
  return {
    get: vi.fn((key: string) => {
      if (key === "user") return { id: USER_ID };
      return undefined;
    }),
    req: {
      param: vi.fn((key: string) => params[key]),
      valid: vi.fn((target: string) => (target === "json" ? body : undefined)),
    },
    json: vi.fn((data: unknown, status?: number) => ({ data, status })),
    body: vi.fn((data: unknown, status?: number) => ({ data, status })),
  } as unknown as Parameters<typeof controller.list>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("list controller", () => {
  it("calls listBudgets with the user id and returns json", async () => {
    const items = [{ id: 1, title: "A" }];
    vi.mocked(listBudgets).mockResolvedValue(items as never);
    const c = mockContext();

    await controller.list(c);

    expect(listBudgets).toHaveBeenCalledWith(USER_ID);
    expect(c.json).toHaveBeenCalledWith(items);
  });
});

describe("getOne controller", () => {
  it("returns 400 when the id is not a number", async () => {
    const c = mockContext({ id: "abc" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(getBudget).not.toHaveBeenCalled();
  });

  it("returns 404 when the budget is not found", async () => {
    vi.mocked(getBudget).mockResolvedValue(null as never);
    const c = mockContext({ id: "99" });
    await controller.getOne(c);
    expect(getBudget).toHaveBeenCalledWith(USER_ID, 99);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the budget as json when found", async () => {
    const budget = { id: 1, title: "A" };
    vi.mocked(getBudget).mockResolvedValue(budget as never);
    const c = mockContext({ id: "1" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith(budget);
  });
});

describe("create controller", () => {
  it("passes validated body to createBudget and returns 201", async () => {
    const body = { title: "New", amount: 100, category: "Rent" };
    const created = { id: 1, ...body };
    vi.mocked(createBudget).mockResolvedValue(created as never);
    const c = mockContext({}, body);

    await controller.create(c);

    expect(c.req.valid).toHaveBeenCalledWith("json");
    expect(createBudget).toHaveBeenCalledWith(USER_ID, body);
    expect(c.json).toHaveBeenCalledWith(created, 201);
  });
});

describe("update controller", () => {
  it("returns 400 when the id is not a number", async () => {
    const c = mockContext({ id: "xyz" }, { title: "X", amount: 1, category: "Rent" });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(updateBudget).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws 'Not found'", async () => {
    vi.mocked(updateBudget).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "1" }, { title: "X", amount: 1, category: "Rent" });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the updated budget when successful", async () => {
    const updated = { id: 1, title: "Updated" };
    vi.mocked(updateBudget).mockResolvedValue(updated as never);
    const c = mockContext({ id: "1" }, { title: "Updated", amount: 2, category: "Rent" });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith(updated);
  });
});

describe("remove controller", () => {
  it("returns 400 when the id is not a number", async () => {
    const c = mockContext({ id: "???" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(deleteBudget).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws", async () => {
    vi.mocked(deleteBudget).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "1" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns 204 with null body on success", async () => {
    vi.mocked(deleteBudget).mockResolvedValue(undefined as never);
    const c = mockContext({ id: "1" });
    await controller.remove(c);
    expect(c.body).toHaveBeenCalledWith(null, 204);
  });
});
