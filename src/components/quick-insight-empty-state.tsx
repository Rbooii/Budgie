"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/button";

export function QuickInsightEmptyState() {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col items-center justify-center text-center py-20 px-4">
      <p className="text-base font-semibold text-ink">No insight yet</p>
      <p className="text-sm text-ink/40 mt-1 max-w-xs">
        Add a transaction to see your cashflow and asset growth here.
      </p>
      <div className="mt-5">
        <Button
          type="button"
          variant="success"
          size="md"
          leadingIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/transactions/add")}
        >
          Add transaction
        </Button>
      </div>
    </div>
  );
}
