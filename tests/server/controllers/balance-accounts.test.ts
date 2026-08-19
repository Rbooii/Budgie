import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/services/balance-accounts", () => ({
  listBalanceAccounts: vi.fn(),
  getBalanceAccount: vi.fn(),
  createBalanceAccount: vi.fn(),
  updateBalanceAccount: vi.fn(),
  deleteBalanceAccount: vi.fn(),
}));

import {
  listBalanceAccounts,
  getBalanceAccount,
  createBalanceAccount,
  updateBalanceAccount,
  deleteBalanceAccount,
} from "@/server/services/balance-accounts";
import * as controller from "@/server/controllers/balance-accounts";

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
  it("calls listBalanceAccounts with the user id and returns json", async () => {
    const items = [{ id: "acc-1", name: "BCA" }];
    vi.mocked(listBalanceAccounts).mockResolvedValue(items as never);
    const c = mockContext();

    await controller.list(c);

    expect(listBalanceAccounts).toHaveBeenCalledWith(USER_ID);
    expect(c.json).toHaveBeenCalledWith(items);
  });
});

describe("getOne controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(getBalanceAccount).not.toHaveBeenCalled();
  });

  it("returns 404 when the account is not found", async () => {
    vi.mocked(getBalanceAccount).mockResolvedValue(null as never);
    const c = mockContext({ id: "acc-x" });
    await controller.getOne(c);
    expect(getBalanceAccount).toHaveBeenCalledWith(USER_ID, "acc-x");
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the account as json when found", async () => {
    const account = { id: "acc-1", name: "BCA" };
    vi.mocked(getBalanceAccount).mockResolvedValue(account as never);
    const c = mockContext({ id: "acc-1" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith(account);
  });
});

describe("create controller", () => {
  it("passes validated body to createBalanceAccount and returns 201", async () => {
    const body = { name: "BCA", balance: 1000, currency: "IDR", type: "bank" };
    const created = { id: "acc-1", ...body };
    vi.mocked(createBalanceAccount).mockResolvedValue(created as never);
    const c = mockContext({}, body);

    await controller.create(c);

    expect(createBalanceAccount).toHaveBeenCalledWith(USER_ID, body);
    expect(c.json).toHaveBeenCalledWith(created, 201);
  });
});

describe("update controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" }, { name: "X", balance: 0, currency: "IDR", type: "bank" });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(updateBalanceAccount).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws", async () => {
    vi.mocked(updateBalanceAccount).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "acc-1" }, { name: "X", balance: 0, currency: "IDR", type: "bank" });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the updated account when successful", async () => {
    const updated = { id: "acc-1", name: "Renamed" };
    vi.mocked(updateBalanceAccount).mockResolvedValue(updated as never);
    const c = mockContext({ id: "acc-1" }, { name: "Renamed", balance: 0, currency: "IDR", type: "bank" });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith(updated);
  });
});

describe("remove controller", () => {
  it("returns 400 when the id is empty", async () => {
    const c = mockContext({ id: "" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(deleteBalanceAccount).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws", async () => {
    vi.mocked(deleteBalanceAccount).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "acc-1" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns 204 with null body on success", async () => {
    vi.mocked(deleteBalanceAccount).mockResolvedValue(undefined as never);
    const c = mockContext({ id: "acc-1" });
    await controller.remove(c);
    expect(c.body).toHaveBeenCalledWith(null, 204);
  });
});
