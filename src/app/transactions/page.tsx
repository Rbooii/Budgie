import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageShell } from "@/components/page-shell";
import { AccountTab } from "@/components/account-tab";
import { TransactionsView } from "@/components/transactions-view";
import type { TransactionRow } from "@/components/transaction-item";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await api.transactions.$get(
    {},
    { headers: Object.fromEntries(await headers()) },
  );

  if (res.status === 401) {
    redirect("/sign-in");
  }

  let transactions: TransactionRow[] = [];
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[transactions] API error", res.status, body);
  } else {
    const data = await res.json();
    transactions = Array.isArray(data) ? (data as TransactionRow[]) : [];
  }

  return (
    <PageShell>
      <AccountTab userName={session.user.name} />
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 md:mt-8">
        Transactions
      </h1>
      {!res.ok ? (
        <p className="text-sm text-black/40 mt-3">
          Couldn&rsquo;t load transactions (API {res.status}). Check the server
          logs, then try again.
        </p>
      ) : (
        <TransactionsView transactions={transactions} />
      )}
    </PageShell>
  );
}
