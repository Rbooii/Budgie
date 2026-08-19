import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/services/subscriptions", () => ({
  listSubscriptions: vi.fn(),
  getSubscription: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
}));

import {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/server/services/subscriptions";
import * as controller from "@/server/controllers/subscriptions";

const USER_ID = "user-1";
const DUP_MSG = "Subscription with this name already exists";

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

const sub = {
  id: "sub-1",
  name: "Netflix",
  amount: 149000,
  currency: "IDR",
  category: "Entertainment",
  periodDays: 30,
  startDate: new Date("2026-01-01"),
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("list controller", () => {
  it("calls listSubscriptions with the user id and returns json", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub as never]);
    const c = mockContext();
    await controller.list(c);
    expect(listSubscriptions).toHaveBeenCalledWith(USER_ID);
    expect(c.json).toHaveBeenCalledWith([sub]);
  });
});

describe("getOne controller", () => {
  it("returns 400 when the id param is missing", async () => {
    const c = mockContext();
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it("returns 404 when the subscription is not found", async () => {
    vi.mocked(getSubscription).mockResolvedValue(null as never);
    const c = mockContext({ id: "sub-99" });
    await controller.getOne(c);
    expect(getSubscription).toHaveBeenCalledWith(USER_ID, "sub-99");
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the subscription as json when found", async () => {
    vi.mocked(getSubscription).mockResolvedValue(sub as never);
    const c = mockContext({ id: "sub-1" });
    await controller.getOne(c);
    expect(c.json).toHaveBeenCalledWith(sub);
  });
});

describe("create controller", () => {
  it("passes the validated body to createSubscription and returns 201", async () => {
    const body = { name: "Netflix", amount: 149000 };
    vi.mocked(createSubscription).mockResolvedValue(sub as never);
    const c = mockContext({}, body);
    await controller.create(c);
    expect(c.req.valid).toHaveBeenCalledWith("json");
    expect(createSubscription).toHaveBeenCalledWith(USER_ID, body);
    expect(c.json).toHaveBeenCalledWith(sub, 201);
  });

  it("returns 409 when the service throws a duplicate-name error", async () => {
    vi.mocked(createSubscription).mockRejectedValue(new Error(DUP_MSG) as never);
    const c = mockContext({}, { name: "Netflix", amount: 149000 });
    await controller.create(c);
    expect(c.json).toHaveBeenCalledWith({ error: DUP_MSG }, 409);
  });

  it("rethrows unexpected errors (→ 500 via app.onError)", async () => {
    vi.mocked(createSubscription).mockRejectedValue(
      new Error("db exploded") as never,
    );
    const c = mockContext({}, { name: "Netflix", amount: 149000 });
    await expect(controller.create(c)).rejects.toThrow("db exploded");
    expect(c.json).not.toHaveBeenCalled();
  });
});

describe("update controller", () => {
  it("returns 400 when the id param is missing", async () => {
    const c = mockContext({}, { name: "Netflix", amount: 1 });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it("returns 409 when the service throws a duplicate-name error", async () => {
    vi.mocked(updateSubscription).mockRejectedValue(new Error(DUP_MSG) as never);
    const c = mockContext({ id: "sub-1" }, { name: "Netflix", amount: 1 });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: DUP_MSG }, 409);
  });

  it("returns 404 when the service throws 'Not found'", async () => {
    vi.mocked(updateSubscription).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "sub-1" }, { name: "Netflix", amount: 1 });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns 404 for any non-clash service error (current controller mapping)", async () => {
    vi.mocked(updateSubscription).mockRejectedValue(
      new Error("db exploded") as never,
    );
    const c = mockContext({ id: "sub-1" }, { name: "Netflix", amount: 1 });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns the updated subscription when successful", async () => {
    vi.mocked(updateSubscription).mockResolvedValue(sub as never);
    const c = mockContext({ id: "sub-1" }, { name: "Netflix", amount: 1 });
    await controller.update(c);
    expect(updateSubscription).toHaveBeenCalledWith(USER_ID, "sub-1", {
      name: "Netflix",
      amount: 1,
    });
    expect(c.json).toHaveBeenCalledWith(sub);
  });
});

describe("remove controller", () => {
  it("returns 400 when the id param is missing", async () => {
    const c = mockContext();
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Invalid id" }, 400);
    expect(deleteSubscription).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws", async () => {
    vi.mocked(deleteSubscription).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ id: "sub-1" });
    await controller.remove(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns 204 with null body on success", async () => {
    vi.mocked(deleteSubscription).mockResolvedValue(undefined as never);
    const c = mockContext({ id: "sub-1" });
    await controller.remove(c);
    expect(deleteSubscription).toHaveBeenCalledWith(USER_ID, "sub-1");
    expect(c.body).toHaveBeenCalledWith(null, 204);
  });
});
