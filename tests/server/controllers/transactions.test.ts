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

type ListCtx = Parameters<typeof controller.list>[0];

function mockContext(
  params: Record<string, string> = {},
  body?: unknown,
  query: Record<string, unknown> = {},
) {
  return {
    get: vi.fn((key: string) => {
      if (key === "user") return { id: USER_ID };
      return undefined;
    }),
    req: {
      param: vi.fn((key: string) => params[key]),
      valid: vi.fn((target: string) => {
        if (target === "query") return query;
        return target === "json" ? body : undefined;
      }),
    },
    header: vi.fn(),
    json: vi.fn((data: unknown, status?: number) => ({ data, status })),
    body: vi.fn((data: unknown, status?: number) => ({ data, status })),
  } as unknown as ListCtx;
}

/** The shared mock is intentionally loose; handlers other than `list` take a
 *  validator-specific context type, so narrow at the call site. */
function asHandlerArg<T extends (c: never) => unknown>(c: ListCtx) {
  return c as unknown as Parameters<T>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("list controller", () => {
  it("calls listTransactions with the user id and returns json", async () => {
    const items = [{ id: "txn-1" }];
    vi.mocked(listTransactions).mockResolvedValue({ items, nextCursor: null } as never);
    const c = mockContext();

    await controller.list(c);

    expect(listTransactions).toHaveBeenCalledWith(USER_ID, {
      limit: undefined,
      cursor: undefined,
    });
    expect(c.json).toHaveBeenCalledWith(items);
    expect(c.header).toHaveBeenCalledWith("X-Has-More", "false");
  });

  it("forwards limit/cursor and exposes the next cursor header", async () => {
    const items = [{ id: "txn-2" }];
    vi.mocked(listTransactions).mockResolvedValue({ items, nextCursor: "txn-2" } as never);
    const c = mockContext({}, undefined, { limit: 1 });

    await controller.list(c);

    expect(listTransactions).toHaveBeenCalledWith(USER_ID, {
      limit: 1,
      cursor: undefined,
    });
    expect(c.header).toHaveBeenCalledWith("X-Next-Cursor", "txn-2");
    expect(c.header).toHaveBeenCalledWith("X-Has-More", "true");
  });

  it("implies the default page size for a bare cursor", async () => {
    vi.mocked(listTransactions).mockResolvedValue({ items: [], nextCursor: null } as never);
    const c = mockContext({}, undefined, { cursor: "txn-9" });

    await controller.list(c);

    expect(listTransactions).toHaveBeenCalledWith(USER_ID, {
      limit: 100,
      cursor: "txn-9",
    });
  });
});

describe("getOne controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" });
    await controller.getOne(asHandlerArg<typeof controller.getOne>(c));
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(getTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the transaction is not found", async () => {
    vi.mocked(getTransaction).mockResolvedValue(null as never);
    const c = mockContext({ id: "txn-x" });
    await controller.getOne(asHandlerArg<typeof controller.getOne>(c));
    expect(getTransaction).toHaveBeenCalledWith(USER_ID, "txn-x");
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the transaction as json when found", async () => {
    const txn = { id: "txn-1", name: "Salary" };
    vi.mocked(getTransaction).mockResolvedValue(txn as never);
    const c = mockContext({ id: "txn-1" });
    await controller.getOne(asHandlerArg<typeof controller.getOne>(c));
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

    await controller.create(asHandlerArg<typeof controller.create>(c));

    expect(createTransaction).toHaveBeenCalledWith(USER_ID, validBody);
    expect(c.json).toHaveBeenCalledWith(created, 201);
  });

  it("returns 404 when the service throws an error containing 'not found'", async () => {
    vi.mocked(createTransaction).mockRejectedValue(new Error("Account not found") as never);
    const c = mockContext({}, validBody);

    await controller.create(asHandlerArg<typeof controller.create>(c));

    expect(c.json).toHaveBeenCalledWith({ error: "Account not found" }, 404);
  });

  it("returns 400 when the service throws 'Insufficient balance'", async () => {
    vi.mocked(createTransaction).mockRejectedValue(new Error("Insufficient balance") as never);
    const c = mockContext({}, validBody);

    await controller.create(asHandlerArg<typeof controller.create>(c));

    expect(c.json).toHaveBeenCalledWith({ error: "Insufficient balance" }, 400);
  });

  it("returns 400 for other non-not-found errors", async () => {
    vi.mocked(createTransaction).mockRejectedValue(new Error("Something broke") as never);
    const c = mockContext({}, validBody);

    await controller.create(asHandlerArg<typeof controller.create>(c));

    expect(c.json).toHaveBeenCalledWith({ error: "Something broke" }, 400);
  });
});

describe("remove controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" });
    await controller.remove(asHandlerArg<typeof controller.remove>(c));
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(deleteTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws an error containing 'not found'", async () => {
    vi.mocked(deleteTransaction).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "txn-1" });
    await controller.remove(asHandlerArg<typeof controller.remove>(c));
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns 400 when the service throws 'Insufficient balance'", async () => {
    vi.mocked(deleteTransaction).mockRejectedValue(new Error("Insufficient balance") as never);
    const c = mockContext({ id: "txn-1" });
    await controller.remove(asHandlerArg<typeof controller.remove>(c));
    expect(c.json).toHaveBeenCalledWith({ error: "Insufficient balance" }, 400);
  });

  it("returns 204 with null body on success", async () => {
    vi.mocked(deleteTransaction).mockResolvedValue(undefined as never);
    const c = mockContext({ id: "txn-1" });
    await controller.remove(asHandlerArg<typeof controller.remove>(c));
    expect(c.body).toHaveBeenCalledWith(null, 204);
  });
});
