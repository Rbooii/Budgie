import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/services/user", () => ({
  getPlusStatus: vi.fn(),
  updatePlusStatus: vi.fn(),
}));

import { getPlusStatus, updatePlusStatus } from "@/server/services/user";
import * as controller from "@/server/controllers/user";

const USER_ID = "user-1";

function mockContext(body?: unknown) {
  return {
    get: vi.fn((key: string) => {
      if (key === "user") return { id: USER_ID };
      return undefined;
    }),
    req: {
      valid: vi.fn((target: string) => (target === "json" ? body : undefined)),
    },
    json: vi.fn((data: unknown, status?: number) => ({ data, status })),
  } as unknown as Parameters<typeof controller.getStatus>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getStatus controller", () => {
  it("calls getPlusStatus with the user id and returns json", async () => {
    vi.mocked(getPlusStatus).mockResolvedValue({ plus: false } as never);
    const c = mockContext();
    await controller.getStatus(c);
    expect(getPlusStatus).toHaveBeenCalledWith(USER_ID);
    expect(c.json).toHaveBeenCalledWith({ plus: false });
  });

  it("returns 404 when the service returns null", async () => {
    vi.mocked(getPlusStatus).mockResolvedValue(null as never);
    const c = mockContext();
    await controller.getStatus(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("returns { plus: true } for a plus user", async () => {
    vi.mocked(getPlusStatus).mockResolvedValue({ plus: true } as never);
    const c = mockContext();
    await controller.getStatus(c);
    expect(c.json).toHaveBeenCalledWith({ plus: true });
  });
});

describe("update controller", () => {
  it("passes validated body to updatePlusStatus and returns the result", async () => {
    vi.mocked(updatePlusStatus).mockResolvedValue({ plus: true } as never);
    const c = mockContext({ plus: true });
    await controller.update(c);
    expect(c.req.valid).toHaveBeenCalledWith("json");
    expect(updatePlusStatus).toHaveBeenCalledWith(USER_ID, { plus: true });
    expect(c.json).toHaveBeenCalledWith({ plus: true });
  });

  it("returns 404 when the service throws 'Not found'", async () => {
    vi.mocked(updatePlusStatus).mockRejectedValue(new Error("Not found") as never);
    const c = mockContext({ plus: true });
    await controller.update(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not found" }, 404);
  });

  it("rethrows non-'Not found' errors (so app.onError returns 500)", async () => {
    vi.mocked(updatePlusStatus).mockRejectedValue(new Error("DB down") as never);
    const c = mockContext({ plus: true });
    await expect(controller.update(c)).rejects.toThrow("DB down");
  });
});
