import { cache } from "react";
import { listBalanceAccounts } from "@/server/services/balance-accounts";
import { getPlusStatus } from "@/server/services/user";

/**
 * Server-side data helpers for Server Components.
 *
 * These call the services in-process instead of issuing an HTTP request to
 * `/api/*`, which removes a whole extra serverless invocation + network hop
 * from every page render. `React.cache` dedupes repeated reads inside a
 * single request (e.g. `AccountTab` on a page that already loaded accounts).
 */
export const getAccountsForUser = cache(async (userId: string) => {
  return listBalanceAccounts(userId);
});

export const getPlusForUser = cache(async (userId: string) => {
  const status = await getPlusStatus(userId);
  return status?.plus ?? false;
});
