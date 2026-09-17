import { etag } from "hono/etag";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@/server/middleware/auth";

/**
 * Per-user read policy: `private` so no shared cache can ever serve one
 * user's rows to another, `no-cache` so clients always revalidate — which
 * turns repeat GETs into free `304 Not Modified` responses via the ETag.
 */
export const privateNoCache: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  if (c.req.method === "GET" && c.res.ok) {
    c.header("Cache-Control", "private, no-cache");
  }
};
