import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Dynamic + Node.js runtime by default under `cacheComponents`.

export const { GET, POST } = toNextJsHandler(auth);
