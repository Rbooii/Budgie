"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import { AuthInput } from "@/components/auth-input";
import { AlertCircle } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  categoryLabel,
} from "@/lib/categories";
import { formatBalanceInput, formatRupiah } from "@/lib/format";
import { dynamicFontSize } from "@/lib/font-size";
import { periodLabel } from "@/lib/budget";

const PERIOD_OPTIONS: { label: string; days: number }[] = [
  { label: periodLabel(7), days: 7 },
  { label: periodLabel(30), days: 30 },
  { label: periodLabel(365), days: 365 },
];

interface AddSubscriptionDialogProps {
  triggerLabel?: string;
}

function todayInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AddSubscriptionDialog({
  triggerLabel = "Add subscription",
}: AddSubscriptionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [periodDays, setPeriodDays] = useState(30);
  const [startDate, setStartDate] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount.replace(/[^0-9-]/g, "") || 0);
  const formattedAmount = formatBalanceInput(amount);
  const amountFont = dynamicFontSize(formattedAmount || "0");

  const valid = !!name.trim() && amountNum > 0 && !!category && !!startDate;

  function reset() {
    setName("");
    setAmount("");
    setCategory("");
    setPeriodDays(30);
    setStartDate(todayInputValue());
    setError(null);
  }

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.subscriptions.$post({
        json: {
          name: name.trim(),
          amount: amountNum,
          category,
          periodDays,
          startDate: new Date(startDate).toISOString(),
          active: true,
        },
      });
      if (!res.ok) {
        let msg = "Failed to create subscription";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="success"
        size="md"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
          <div>
            <h2 className="text-2xl font-medium">Add Subscription</h2>
            <p className="text-sm text-black/40 mt-1">
              Track recurring charges so you always know what&rsquo;s coming out.
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Name</span>
            <AuthInput
              type="text"
              placeholder="e.g. Netflix, Spotify"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full h-11 text-lg bg-white text-black px-[17px] py-[6px] rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
            >
              <option value="" disabled>
                Select category
              </option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Billing cycle</span>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="w-full h-11 text-lg bg-white text-black px-[17px] py-[6px] rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Start date</span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 text-lg bg-white text-black px-[17px] py-[6px] rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Amount</span>
            <div className="flex items-center justify-center gap-2 py-3">
              <span className={`${amountFont} text-gray-400 font-semibold`}>
                IDR
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={formattedAmount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9-]/g, ""))
                }
                className={`${amountFont} text-gray-400 font-semibold bg-transparent text-center focus:outline-none placeholder:text-gray-300 w-full max-w-[240px] tabular-nums`}
              />
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <Button
              type="submit"
              variant="success"
              size="md"
              loading={loading}
              disabled={!valid}
              className="px-3"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
