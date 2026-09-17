import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Session data is signed into a short-lived cookie, so `getSession` (called
    // by every page and by `requireAuth` on every API request) no longer costs
    // a database round trip. Revocations/upgrades land within `maxAge`.
    // (`refreshCache` is intentionally omitted — better-auth disables it for
    // database-backed setups.)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "compact",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
});
