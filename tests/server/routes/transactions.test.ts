import { describe, it, expect, beforeEach, vi } from "vitest";
import { webcrypto } from "node:crypto";

const { mockListTransactions } = vi.hoisted(() => ({
  mockListTransactions: vi.fn(),
}));

vi.mock("@/server/services/transactions", () => ({
  listTransactions: mockListTransactions,
  getTransaction: vi.fn(),
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi
        .fn()
        .mockResolvedValue({ user: { id: "user-1" }, session: { id: "s-1" } }),
    },
    $Infer: { Session: {} },
  },
}));

import { transactions } from "@/server/routes/transactions";

const USER_ID = "user-1";

// jsdom's `crypto` has no SubtleCrypto, which the ETag middleware needs.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListTransactions.mockResolvedValue({ items: [], nextCursor: null });
});

function get(path: string, headers: Record<string, string> = {}) {
  // The sub-app is mounted at "/" (see src/server/index.ts) — request it directly.
  return transactions.request(`http://localhost/${path}`, { headers });
}

describe("GET /transactions (iOS-facing contract)", () => {
  it("keeps the legacy bare-array body when no pagination params are sent", async () => {
    const items = [{ id: "txn-1", name: "Lunch" }];
    mockListTransactions.mockResolvedValue({ items, nextCursor: null });

    const res = await get("");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(items);
    expect(mockListTransactions).toHaveBeenCalledWith(USER_ID, {
      limit: undefined,
      cursor: undefined,
    });
  });

  it("exposes pagination through headers only (no shape change)", async () => {
    mockListTransactions.mockResolvedValue({
      items: [{ id: "txn-1" }],
      nextCursor: "txn-1",
    });

    const res = await get("?limit=1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "txn-1" }]);
    expect(res.headers.get("X-Has-More")).toBe("true");
    expect(res.headers.get("X-Next-Cursor")).toBe("txn-1");
    expect(mockListTransactions).toHaveBeenCalledWith(USER_ID, {
      limit: 1,
      cursor: undefined,
    });
  });

  it("marks the response private and revalidatable so shared caches never mix users", async () => {
    const res = await get("");
    expect(res.headers.get("Cache-Control")).toBe("private, no-cache");
  });

  it("answers 304 for a matching If-None-Match", async () => {
    mockListTransactions.mockResolvedValue({
      items: [{ id: "txn-1", name: "Lunch" }],
      nextCursor: null,
    });

    const first = await get("");
    const etag = first.headers.get("ETag");
    expect(etag).toBeTruthy();

    const second = await get("", { "If-None-Match": etag! });

    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
  });

  it("rejects an out-of-range limit with 400 before touching the service", async () => {
    const res = await get("?limit=100000");
    expect(res.status).toBe(400);
    expect(mockListTransactions).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never);

    const res = await get("");
    expect(res.status).toBe(401);
  });
});
