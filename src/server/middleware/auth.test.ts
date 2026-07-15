import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    api: {
      getSession: vi.fn(),
    },
    $Infer: {
      Session: {
        user: {},
        session: {},
      },
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

import { requireAuth } from "@/server/middleware/auth";

const mockUser = { id: "user-1", name: "Test", email: "test@test.com" };
const mockSession = { id: "sess-1", userId: "user-1", token: "tok" };

function mockContext(headers: Headers) {
  const setFn = vi.fn();
  const nextFn = vi.fn();
  return {
    context: {
      req: { raw: { headers } },
      set: setFn,
      json: vi.fn((data: unknown, status?: number) => ({ data, status })),
      next: nextFn,
    } as unknown as Parameters<typeof requireAuth>[0],
    setFn,
    nextFn,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth middleware", () => {
  it("returns 401 Unauthorized when no session is found", async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const { context, setFn, nextFn } = mockContext(new Headers());

    const result = await requireAuth(context, nextFn);

    expect(result).toEqual({ data: { error: "Unauthorized" }, status: 401 });
    expect(setFn).not.toHaveBeenCalled();
    expect(nextFn).not.toHaveBeenCalled();
  });

  it("sets user and session on the context and calls next() when a session exists", async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: mockUser, session: mockSession });
    const { context, setFn, nextFn } = mockContext(new Headers());

    await requireAuth(context, nextFn);

    expect(mockAuth.api.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    expect(setFn).toHaveBeenCalledWith("user", mockUser);
    expect(setFn).toHaveBeenCalledWith("session", mockSession);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it("reads headers from the raw request", async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const headers = new Headers();
    headers.set("cookie", "better-auth.session_token=abc");
    const { context } = mockContext(headers);

    await requireAuth(context, vi.fn());

    expect(mockAuth.api.getSession).toHaveBeenCalledWith({ headers });
  });
});
