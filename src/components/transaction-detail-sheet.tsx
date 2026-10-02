"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  formatRupiah,
  formatDate,
  formatTime,
} from "@/lib/format";
import type { TransactionRow } from "@/components/transaction-item";
import { categoryLabel } from "@/lib/categories";

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; text: string; pill: string }
> = {
  income: {
    icon: <ArrowDownLeft className="w-4 h-4" />,
    text: "text-income",
    pill: "bg-income-tint text-income",
  },
  expense: {
    icon: <ArrowUpRight className="w-4 h-4" />,
    text: "text-expense",
    pill: "bg-expense-tint text-expense",
  },
  transfer: {
    icon: <ArrowLeftRight className="w-4 h-4" />,
    text: "text-transfer",
    pill: "bg-transfer-tint text-transfer",
  },
};

interface TransactionDetailSheetProps {
  transaction: TransactionRow | null;
  onClose: () => void;
}

export function TransactionDetailSheet({
  transaction,
  onClose,
}: TransactionDetailSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!transaction) return null;

  const meta = TYPE_META[transaction.type] ?? TYPE_META.expense;
  const sign =
    transaction.type === "income"
      ? "+"
      : transaction.type === "expense"
        ? "-"
        : "";

  const bankLabel =
    transaction.type === "transfer"
      ? transaction.balanceAccount && transaction.toBalanceAccount
        ? `${transaction.balanceAccount.name} → ${transaction.toBalanceAccount.name}`
        : "—"
      : (transaction.balanceAccount?.name ?? "Deleted account");

  async function handleDelete() {
    if (!transaction) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.transactions[":id"].$delete({
        param: { id: transaction.id },
      });
      if (!res.ok) {
        let msg = "Failed to delete transaction";
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-card rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 shadow-2xl animate-[sheetIn_0.2s_ease-out] flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 rounded-full bg-ink/10 mx-auto sm:hidden" />

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[20px] capitalize ${meta.pill}`}
          >
            {meta.icon}
            {transaction.type}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink/40 hover:bg-surface hover:text-ink transition"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-1 py-2">
          <p className="text-sm text-ink/40">{transaction.name}</p>
          <p className={`text-3xl font-bold tracking-tight tabular-nums ${meta.text}`}>
            {sign}
            {formatRupiah(transaction.amount)}
          </p>
          {transaction.type === "transfer" && transaction.adminFee > 0 && (
            <p className="text-xs text-ink/40 tabular-nums mt-0.5">
              Admin fee {formatRupiah(transaction.adminFee)}
            </p>
          )}
        </div>

        <div className="flex flex-col rounded-[20px] bg-surface divide-y divide-hairline">
          <DetailRow label="Bank" value={bankLabel} />
          <DetailRow label="Category" value={categoryLabel(transaction.category)} />
          <DetailRow label="Date" value={formatDate(transaction.date)} />
          <DetailRow label="Time" value={formatTime(transaction.date)} />
        </div>

        <button
          type="button"
          onClick={() => { setError(null); setConfirmOpen(true); }}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-[35px] bg-expense-tint text-expense hover:bg-expense/20 active:scale-[0.98] transition text-sm font-semibold"
        >
          <Trash2 className="w-4 h-4" />
          Delete transaction
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
      onOpenChange={(o) => { if (!loading) { setError(null); setConfirmOpen(o); } }}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-2xl font-medium">Delete transaction?</h2>
          <p className="text-sm text-ink/40 mt-1">
            Deleting <span className="font-medium text-ink/70">{transaction.name}</span> ({sign}{formatRupiah(transaction.amount)}) will reverse its balance effect and cannot be undone.
          </p>
        </div>
        {error && (
          <p className="flex items-center gap-2 text-sm text-expense bg-expense-tint border border-expense/30 rounded-[20px] px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button type="button" variant="softred" size="md" loading={loading} onClick={handleDelete}>
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={loading}
            onClick={() => { setError(null); setConfirmOpen(false); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-ink/40">{label}</span>
      <span className="text-sm text-ink font-medium text-right">{value}</span>
    </div>
  );
}