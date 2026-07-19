"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import {
  Check,
  CalendarDays,
  CalendarRange,
  Calendar,
  CalendarClock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  categoryLabel,
} from "@/lib/categories";
import { formatBalanceInput, formatRupiah } from "@/lib/format";
import { dynamicFontSize } from "@/lib/font-size";
import { periodLabel } from "@/lib/budget";

type Step = 1 | 2 | 3;

const PERIODS: {
  key: string;
  label: string;
  desc: string;
  days: number | null;
  icon: React.ReactNode;
}[] = [
  {
    key: "daily",
    label: "Daily",
    desc: "Resets every day",
    days: 1,
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    key: "weekly",
    label: "Weekly",
    desc: "Resets every 7 days",
    days: 7,
    icon: <CalendarRange className="w-5 h-5" />,
  },
  {
    key: "monthly",
    label: "Monthly",
    desc: "Resets every 30 days",
    days: 30,
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    key: "custom",
    label: "Custom",
    desc: "Pick your own period",
    days: null,
    icon: <CalendarClock className="w-5 h-5" />,
  },
];

interface AddBudgetDialogProps {
  usedCategories: string[];
  triggerLabel?: string;
}

export function AddBudgetDialog({
  usedCategories,
  triggerLabel = "Add budget",
}: AddBudgetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [periodKey, setPeriodKey] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !usedCategories.includes(c),
  );

  const periodDays =
    periodKey === "custom"
      ? Math.max(1, Number(customDays.replace(/[^0-9]/g, "") || 0))
      : PERIODS.find((p) => p.key === periodKey)?.days ?? 0;

  const amountNum = Number(amount.replace(/[^0-9-]/g, "") || 0);
  const formattedAmount = formatBalanceInput(amount);
  const amountFont = dynamicFontSize(formattedAmount || "0");

  const step1Valid = !!periodKey && periodDays > 0;
  const step2Valid = !!category && amountNum > 0;

  function reset() {
    setStep(1);
    setPeriodKey(null);
    setCustomDays("");
    setCategory("");
    setAmount("");
    setError(null);
  }

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) {
      reset();
    }
  }

  function goNext() {
    setError(null);
    if (step === 1 && !step1Valid) return;
    if (step === 2 && !step2Valid) return;
    setStep((s) => (s + 1) as Step);
  }
  function goBack() {
    setError(null);
    if (step === 1) {
      handleOpenChange(false);
      return;
    }
    setStep((s) => (s - 1) as Step);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.budgets.$post({
        json: { category, amount: amountNum, periodDays },
      });
      if (!res.ok) {
        let msg = "Failed to create budget";
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

  const ctaLabel = step === 3 ? "Confirm and Add" : "Continue";
  const ctaDisabled =
    (step === 1 && !step1Valid) ||
    (step === 2 && !step2Valid) ||
    (step === 3 && loading);
  const ctaLoading = step === 3 && loading;

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
        <div className="flex flex-col text-left">
          <div className="flex items-center justify-between pr-8">
            <h2 className="text-2xl font-medium">Add Budget</h2>
            <span className="text-xs font-medium text-black/40">
              {step} of 3
            </span>
          </div>

          <div className="h-0.5 w-full bg-black/[0.06] mt-4 mb-5">
            <div
              className="h-full bg-[#00C610] transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-black/40">Choose a budget period.</p>
              <div className="flex flex-col gap-2">
                {PERIODS.map((p) => {
                  const active = periodKey === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setPeriodKey(p.key);
                        setError(null);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-[20px] border transition active:scale-[0.98] ${
                        active
                          ? "border-[#A0FFA8] bg-[#A0FFA8]/15"
                          : "border-black/10 hover:border-black/20 hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <span className="w-10 h-10 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/60">
                        {p.icon}
                      </span>
                      <span className="flex-1 text-left">
                        <span className="block text-sm font-semibold text-black">
                          {p.label}
                        </span>
                        <span className="block text-xs text-black/40">
                          {p.desc}
                        </span>
                      </span>
                      {active && (
                        <Check className="w-4 h-4 shrink-0 text-black" />
                      )}
                    </button>
                  );
                })}
              </div>

              {periodKey === "custom" && (
                <label className="flex flex-col gap-1 mt-1">
                  <span className="text-xs font-medium text-black/50">
                    Period length (days)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="e.g. 14"
                    value={customDays}
                    onChange={(e) =>
                      setCustomDays(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full h-11 text-lg bg-white text-black px-[17px] py-[6px] rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
                  />
                </label>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-black/50">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 text-lg bg-white text-black px-[17px] py-[6px] rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
                {availableCategories.length === 0 && (
                  <span className="text-xs text-black/40 mt-1">
                    All expense categories already have budgets.
                  </span>
                )}
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-black/50">Amount</span>
                <div className="flex items-center justify-center gap-2 py-4">
                  <span className={`${amountFont} text-gray-400 font-semibold`}>
                    IDR
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="0"
                    value={formattedAmount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9-]/g, ""))
                    }
                    className={`${amountFont} text-gray-400 font-semibold bg-transparent text-center focus:outline-none placeholder:text-gray-300 w-full max-w-[240px] tabular-nums`}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center gap-1 py-3">
                <p className="text-sm text-black/40">
                  {categoryLabel(category)}
                </p>
                <p className="text-3xl font-bold tracking-tight tabular-nums text-black">
                  {formatRupiah(amountNum)}
                </p>
              </div>

              <div className="flex flex-col rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]">
                <ReviewRow label="Category" value={categoryLabel(category)} />
                <ReviewRow label="Period" value={periodLabel(periodDays)} />
                <ReviewRow
                  label="Limit"
                  value={formatRupiah(amountNum)}
                  last
                />
              </div>

              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          )}

          {step !== 3 && error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5 mt-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex gap-2 mt-5">
            <Button
              type="button"
              variant="success"
              size="md"
              disabled={ctaDisabled}
              loading={ctaLoading}
              onClick={step === 3 ? handleSubmit : goNext}
              trailingIcon={
                step === 3 ? <Check className="w-4 h-4" /> : undefined
              }
            >
              {ctaLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={goBack}
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function ReviewRow({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 ${
        last ? "py-3.5" : "py-3"
      }`}
    >
      <span className="text-xs font-medium text-black/40">{label}</span>
      <span className="text-sm text-black font-medium text-right">{value}</span>
    </div>
  );
}
