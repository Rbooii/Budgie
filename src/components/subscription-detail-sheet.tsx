"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { AlertCircle, Trash2, Repeat } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { periodLabel, nextBillingDate } from "@/lib/budget";
import type { SubscriptionRow } from "@/components/subscription-list";

interface SubscriptionDetailSheetProps {
  subscription: SubscriptionRow | null;
  onClose: () => void;
}

export function SubscriptionDetailSheet({
  subscription,
  onClose,
}: SubscriptionDetailSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!subscription) return null;

  const next = nextBillingDate(subscription.startDate, subscription.periodDays);

  async function handleDelete() {
    if (!subscription) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.subscriptions[":id"].$delete({
        param: { id: subscription.id },
      });
      if (!res.ok) {
        let msg = "Failed to delete subscription";
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[20px] bg-[#FFD9A0] text-[#B25B00]">
              <Repeat className="w-4 h-4" />
              Subscription
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
            <p className="text-sm text-black/40">{subscription.name}</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums text-black">
              {formatRupiah(subscription.amount)}
            </p>
            <p className="text-xs text-black/40 tabular-nums mt-0.5">
              {periodLabel(subscription.periodDays)} · next {formatDate(next)}
            </p>
          </div>

          <div className="flex flex-col rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]">
            <DetailRow label="Name" value={subscription.name} />
            <DetailRow
              label="Category"
              value={categoryLabel(subscription.category)}
            />
            <DetailRow label="Amount" value={formatRupiah(subscription.amount)} />
            <DetailRow
              label="Period"
              value={periodLabel(subscription.periodDays)}
            />
            <DetailRow
              label="Started"
              value={formatDate(subscription.startDate)}
            />
            <DetailRow label="Next billing" value={formatDate(next)} />
            <DetailRow
              label="Status"
              value={subscription.active ? "Active" : "Inactive"}
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
            Delete subscription
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
            <h2 className="text-2xl font-medium">Delete subscription?</h2>
            <p className="text-sm text-black/40 mt-1">
              Deleting{" "}
              <span className="font-medium text-black/70">
                {subscription.name}
              </span>{" "}
              ({formatRupiah(subscription.amount)}/
              {periodLabel(subscription.periodDays).toLowerCase()}) cannot be
              undone.
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
      <span className="text-sm text-black font-medium text-right">{value}</span>
    </div>
  );
}
