import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Request-scoped session lookup. `React.cache` dedupes every call inside one
 * render/request, and better-auth's session cookie cache means the common path
 * never touches Postgres. Always call this instead of `auth.api.getSession`
 * from Server Components.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
