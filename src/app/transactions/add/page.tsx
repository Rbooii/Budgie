import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { AddTransactionWizard } from "@/components/add-transaction-wizard";
import { AddAccountDialog } from "@/components/add-account-dialog";
import Link from "next/link";
import { Button } from "@/components/button";

export const dynamic = "force-dynamic";

export default async function AddTransactionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await api["balance-accounts"].$get(
    {},
    { headers: Object.fromEntries(await headers()) },
  );

  if (res.status === 401) {
    redirect("/sign-in");
  }

  let accounts: {
    id: string;
    name: string;
    currency: string;
    type: string;
    balance: number;
  }[] = [];
  if (res.ok) {
    const data = await res.json();
    accounts = Array.isArray(data) ? data : [];
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full flex flex-col items-center justify-center min-h-screen py-8 md:py-10 px-4 sm:px-6 pb-20 md:pb-10">
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
                <Button 
                variant="outline"
                className="w-full"
                >Cancel</Button>
              </Link>
            </div>
          </div>
        ) : (
          <AddTransactionWizard accounts={accounts} />
        )}
      </div>
    </main>
  );
}
