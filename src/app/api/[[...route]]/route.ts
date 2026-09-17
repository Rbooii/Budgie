import { handle } from "hono/vercel";
import { app } from "@/server";

// No `runtime`/`dynamic` segment config: with `cacheComponents` enabled,
// Route Handlers are dynamic by default and the Node.js runtime is implied.

const stripApiPrefix = (handler: (req: Request) => Response | Promise<Response>) =>
  (req: Request) => {
    const url = new URL(req.url);
    url.pathname = url.pathname.replace(/^\/api/, "") || "/";
    return handler(new Request(url, req));
  };

const honoHandler = stripApiPrefix(handle(app));

export const GET = honoHandler;
export const POST = honoHandler;
export const PUT = honoHandler;
export const PATCH = honoHandler;
export const DELETE = honoHandler;
export const OPTIONS = honoHandler;
