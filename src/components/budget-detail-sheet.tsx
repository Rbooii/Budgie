"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { AlertCircle, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icon";
import { periodLabel } from "@/lib/budget";
import type { BudgetRow } from "@/components/budgets-list";

interface BudgetDetailSheetProps {
  budget: BudgetRow | null;
  spent: number;
  onClose: () => void;
}

export function BudgetDetailSheet({
  budget,
  spent,
  onClose,
}: BudgetDetailSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!budget) return null;

  const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
  const over = spent > budget.amount;
  const remaining = Math.max(budget.amount - spent, 0);

  async function handleDelete() {
    if (!budget) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.budgets[":id"].$delete({
        param: { id: budget.id },
      });
      if (!res.ok) {
        let msg = "Failed to delete budget";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      setConfirmOpen(false);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <div
          className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 shadow-2xl animate-[sheetIn_0.2s_ease-out] flex flex-col gap-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1.5 rounded-full bg-black/10 mx-auto sm:hidden" />

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[20px] bg-[#FFBABA] text-[#D8000C]">
              {categoryIcon(budget.category, "w-4 h-4")}
              {categoryLabel(budget.category)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-black/40 hover:bg-[#F2F2F2] hover:text-black transition"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col items-center text-center gap-1 py-2">
            <p className="text-sm text-black/40">Budget limit</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums text-black">
              {formatRupiah(budget.amount)}
            </p>
            <p className="text-xs text-black/40 tabular-nums mt-0.5">
              {formatRupiah(spent)} spent · {periodLabel(budget.periodDays)}
            </p>
          </div>

          <div className="h-2 w-full bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                over ? "bg-[#D8000C]" : "bg-[#00C610]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex flex-col rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]">
            <DetailRow label="Period" value={periodLabel(budget.periodDays)} />
            <DetailRow label="Limit" value={formatRupiah(budget.amount)} />
            <DetailRow label="Spent" value={formatRupiah(spent)} />
            <DetailRow
              label="Remaining"
              value={over ? formatRupiah(0) : formatRupiah(remaining)}
              last
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setConfirmOpen(true);
            }}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-[35px] bg-[#FFBABA] text-[#D8000C] hover:bg-[#FF9A9A] active:scale-[0.98] transition text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            Delete budget
          </button>

          <style>{`
            @keyframes sheetIn {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!loading) {
            setError(null);
            setConfirmOpen(o);
          }
        }}
      >
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-medium">Delete budget?</h2>
            <p className="text-sm text-black/40 mt-1">
              Deleting the{" "}
              <span className="font-medium text-black/70">
                {categoryLabel(budget.category)}
              </span>{" "}
              budget ({formatRupiah(budget.amount)}) cannot be undone.
            </p>
          </div>
          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="softred"
              size="md"
              loading={loading}
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={loading}
              onClick={() => {
                setError(null);
                setConfirmOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 ${last ? "py-3.5" : "py-3"}`}>
      <span className="text-xs text-black/40">{label}</span>
      <span className="text-sm text-black font-medium text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}
