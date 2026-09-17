import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
/**
 * Neon's WebSocket driver only speaks to Neon's proxy (`wss://<host>/v2`), so a
 * local/plain Postgres URL would fail. Pick the adapter by host:
 *  - Neon (`*.neon.tech` / `*.neon.build`) → `PrismaNeon` (serverless, WS).
 *  - Anything else (local Postgres, self-hosted) → `PrismaPg` (node-postgres).
 * Both are Prisma 7 driver adapters, so the client API is identical.
 */
function isNeonHost(url: string) {
  return /neon\.(tech|build)/i.test(url);
}

function poolMax() {
  const raw = Number(process.env.PRISMA_POOL_MAX);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adapter = isNeonHost(url)
    ? new PrismaNeon(
        {
          connectionString: url,
          // One multiplexed WS connection per function instance: Neon
          // pipelines queries over it, so a larger pool only risks exhausting
          // connections.
          max: poolMax(),
          idleTimeoutMillis: 10_000,
          allowExitOnIdle: true,
        },
        {
          onPoolError: (err) => console.error("[prisma] neon pool error", err),
          onConnectionError: (err) =>
            console.error("[prisma] neon connection error", err),
        },
      )
    : new PrismaPg({ connectionString: url, max: poolMax() });

  return new PrismaClient({
    adapter,
    // Fail fast instead of pinning a serverless invocation open.
    transactionOptions: { maxWait: 3_000, timeout: 10_000 },
  });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  // Constructed on first property access, never at import time: `next build`
  // and unit tests can import modules that transitively reference Prisma
  // without a DATABASE_URL present.
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const client = globalForPrisma.prisma;
    const value = Reflect.get(client as object, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
