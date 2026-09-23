import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DEFAULT_TRANSACTION_LIMIT } from "@/lib/limits";
import { listTransactions } from "@/server/services/transactions";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/page-skeleton";
import { AccountTab } from "@/components/account-tab";
import { TransactionsView } from "@/components/transactions-view";

export default function TransactionsPage() {
  return (
    <PageShell>
      <Suspense fallback={<PageSkeleton variant="transactions" />}>
        <TransactionsContent />
      </Suspense>
    </PageShell>
  );
}

async function TransactionsContent() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  // First page only — the rest streams in on demand via `?cursor=`.
  const { items, nextCursor } = await listTransactions(userId, {
    limit: DEFAULT_TRANSACTION_LIMIT,
  });

  return (
    <>
      <AccountTab userName={session.user.name} userId={userId} />
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 md:mt-8">
        Transactions
      </h1>
      <TransactionsView
        transactions={items}
        nextCursor={nextCursor}
        pageSize={DEFAULT_TRANSACTION_LIMIT}
      />
    </>
  );
}
