import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAccountsForUser } from "@/server/queries";
import { AddTransactionWizard } from "@/components/add-transaction-wizard";
import { AddAccountDialog } from "@/components/add-account-dialog";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/button";

export default function AddTransactionPage() {
  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full flex flex-col items-center justify-center min-h-screen py-8 md:py-10 px-4 sm:px-6 pb-20 md:pb-10">
        <Suspense fallback={<PageSkeleton rows={2} />}>
          <AddTransactionContent />
        </Suspense>
      </div>
    </main>
  );
}

async function AddTransactionContent() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const accounts = await getAccountsForUser(session.user.id);

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8">
        Add Transaction
      </h1>
      {accounts.length === 0 ? (
        <div className="w-full max-w-md flex flex-col items-center text-center py-20 px-4">
          <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/30 mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <p className="text-base font-semibold text-black">No accounts yet</p>
          <p className="text-sm text-black/40 mt-1 max-w-xs">
            Create an account first to start recording transactions.
          </p>
          <div className="mt-5 w-full h-fit">
            <AddAccountDialog
              triggerVariant="success"
              triggerSize="lg"
              triggerFullWidth
            />
            <Link href="/dashboard" className="mt-3 w-full block">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <AddTransactionWizard accounts={accounts} />
      )}
    </>
  );
}
