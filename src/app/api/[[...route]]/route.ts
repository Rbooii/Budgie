import { handle } from "hono/vercel";
import { app } from "@/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
