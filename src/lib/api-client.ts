import { hc } from "hono/client";
import type { App } from "@/server";

const baseURL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") + "/api"
    : "/api";

export const api = hc<App>(baseURL);
