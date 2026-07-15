"use client";

import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/button";

export function QuickInsightEmptyState() {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/30 mb-4">
        <Sparkles className="w-7 h-7" />
      </div>
      <p className="text-base font-semibold text-black">No insight yet</p>
      <p className="text-sm text-black/40 mt-1 max-w-xs">
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
