import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/services/transactions", () => ({
  listTransactions: vi.fn(),
  getTransaction: vi.fn(),
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

import {
  listTransactions,
  getTransaction,
  createTransaction,
  deleteTransaction,
} from "@/server/services/transactions";
import * as controller from "@/server/controllers/transactions";

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
  it("calls listTransactions with the user id and returns json", async () => {
    const items = [{ id: "txn-1" }];
    vi.mocked(listTransactions).mockResolvedValue(items as never);
    const c = mockContext();

    await controller.list(c);

    expect(listTransactions).toHaveBeenCalledWith(USER_ID);
    expect(c.json).toHaveBeenCalledWith(items);
  });
});

describe("getOne controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(getTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the transaction is not found", async () => {
    vi.mocked(getTransaction).mockResolvedValue(null as never);
    const c = mockContext({ id: "txn-x" });
    await controller.getOne(c);
    expect(getTransaction).toHaveBeenCalledWith(USER_ID, "txn-x");
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the transaction as json when found", async () => {
    const txn = { id: "txn-1", name: "Salary" };
    vi.mocked(getTransaction).mockResolvedValue(txn as never);
    const c = mockContext({ id: "txn-1" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith(txn);
  });
});

describe("create controller", () => {
  const validBody = {
    name: "Salary",
    amount: 500000,
    type: "income",
    category: "Salary",
    date: new Date("2026-07-15"),
    adminFee: 0,
    balanceAccountId: "acc-1",
    toBalanceAccountId: null,
  };

  it("passes validated body to createTransaction and returns 201", async () => {
    const created = { id: "txn-1", ...validBody };
    vi.mocked(createTransaction).mockResolvedValue(created as never);
    const c = mockContext({}, validBody);

    await controller.create(c);

    expect(createTransaction).toHaveBeenCalledWith(USER_ID, validBody);
    expect(c.json).toHaveBeenCalledWith(created, 201);
  });

  it("returns 404 when the service throws an error containing 'not found'", async () => {
    vi.mocked(createTransaction).mockRejectedValue(new Error("Account not found") as never);
    const c = mockContext({}, validBody);

    await controller.create(c);

    expect(c.json).toHaveBeenCalledWith({ error: "Account not found" }, 404);
  });

  it("returns 400 when the service throws 'Insufficient balance'", async () => {
    vi.mocked(createTransaction).mockRejectedValue(new Error("Insufficient balance") as never);
    const c = mockContext({}, validBody);

    await controller.create(c);

    expect(c.json).toHaveBeenCalledWith({ error: "Insufficient balance" }, 400);
  });

  it("returns 400 for other non-not-found errors", async () => {
    vi.mocked(createTransaction).mockRejectedValue(new Error("Something broke") as never);
    const c = mockContext({}, validBody);

    await controller.create(c);

    expect(c.json).toHaveBeenCalledWith({ error: "Something broke" }, 400);
  });
});

describe("remove controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(deleteTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws an error containing 'not found'", async () => {
    vi.mocked(deleteTransaction).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "txn-1" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns 400 when the service throws 'Insufficient balance'", async () => {
    vi.mocked(deleteTransaction).mockRejectedValue(new Error("Insufficient balance") as never);
    const c = mockContext({ id: "txn-1" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Insufficient balance" }, 400);
  });

  it("returns 204 with null body on success", async () => {
    vi.mocked(deleteTransaction).mockResolvedValue(undefined as never);
    const c = mockContext({ id: "txn-1" });
    await controller.remove(c);
    expect(c.body).toHaveBeenCalledWith(null, 204);
  });
});
