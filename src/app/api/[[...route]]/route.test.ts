import { describe, it, expect, vi, beforeEach } from "vitest";

const capturedUrls: string[] = [];

vi.mock("@/server", () => ({
  app: {},
}));

vi.mock("hono/vercel", () => ({
  handle: () => (req: Request) => {
    capturedUrls.push(new URL(req.url).pathname);
    return new Response("ok", { status: 200 });
  },
}));

beforeEach(() => {
  capturedUrls.length = 0;
});

describe("catch-all route handler — stripApiPrefix", () => {
  it("strips /api from the pathname (/api/budgets -> /budgets)", async () => {
    const { GET } = await import("@/app/api/[[...route]]/route");
    await GET(new Request("http://localhost:3000/api/budgets"));
    expect(capturedUrls).toContain("/budgets");
  });

  it("falls back to '/' when the path is exactly /api", async () => {
    const { GET } = await import("@/app/api/[[...route]]/route");
    await GET(new Request("http://localhost:3000/api"));
    expect(capturedUrls).toContain("/");
  });

  it("strips /api from nested paths (/api/transactions/123 -> /transactions/123)", async () => {
    const { GET } = await import("@/app/api/[[...route]]/route");
    await GET(new Request("http://localhost:3000/api/transactions/123"));
    expect(capturedUrls).toContain("/transactions/123");
  });

  it("handles /api/balance-accounts (hyphenated resource)", async () => {
    const { GET } = await import("@/app/api/[[...route]]/route");
    await GET(new Request("http://localhost:3000/api/balance-accounts"));
    expect(capturedUrls).toContain("/balance-accounts");
  });

  it("exports all HTTP method handlers", async () => {
    const mod = await import("@/app/api/[[...route]]/route");
    expect(typeof mod.GET).toBe("function");
    expect(typeof mod.POST).toBe("function");
    expect(typeof mod.PUT).toBe("function");
    expect(typeof mod.PATCH).toBe("function");
    expect(typeof mod.DELETE).toBe("function");
    expect(typeof mod.OPTIONS).toBe("function");
  });

  it("sets runtime to nodejs", async () => {
    const mod = await import("@/app/api/[[...route]]/route");
    expect(mod.runtime).toBe("nodejs");
  });

  it("sets dynamic to force-dynamic", async () => {
    const mod = await import("@/app/api/[[...route]]/route");
    expect(mod.dynamic).toBe("force-dynamic");
  });
});
