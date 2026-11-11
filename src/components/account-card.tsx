"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import { AuthInput } from "@/components/auth-input";
import { MaskedBalance } from "@/components/balance-visibility";
import { Sparkline } from "@/components/sparkline";
import { formatRupiah, formatBalanceInput } from "@/lib/format";
import { dynamicFontSize } from "@/lib/font-size";
import { computeSparklineTrend } from "@/lib/dashboard";
import {
  Pencil,
  Trash2,
  AlertCircle,
  ChevronRight,
  GripVertical,
} from "lucide-react";

export type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
};

interface AccountCardProps {
  account: Account;
  series?: number[];
  todayChangePct?: number | null;
  /** dnd-kit listeners/attributes for the drag handle. */
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

const TYPES = ["bank", "digital wallet", "cash", "credit", "investment"];

export function AccountCard({
  account,
  series = [],
  todayChangePct = null,
  dragHandleProps,
  isDragging = false,
}: AccountCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(String(account.balance));
  const [currency, setCurrency] = useState(account.currency);
  const [type, setType] = useState(account.type);

  const formattedBalance = formatBalanceInput(balance);
  const balanceFont = dynamicFontSize(formattedBalance);

  const trend = computeSparklineTrend(series);
  const sparkColor =
    trend === "up"
      ? "var(--income)"
      : trend === "down"
        ? "var(--expense)"
        : "var(--stagnant)";
  const investable = ["investment", "stocks"].includes(account.type.toLowerCase());

  function startEdit() {
    setName(account.name);
    setBalance(String(account.balance));
    setCurrency(account.currency);
    setType(account.type);
    setError(null);
    setEditing(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api["balance-accounts"][":id"].$patch({
        param: { id: account.id },
        json: {
          name,
          balance: balance === "" ? 0 : Number(balance.replace(/[^0-9-]/g, "") || 0),
          currency,
          type,
        },
      });
      if (!res.ok) {
        let msg = "Failed to update account";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {
          // keep default message
        }
        throw new Error(msg);
      }
      setEditing(false);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await api["balance-accounts"][":id"].$delete({
        param: { id: account.id },
      });
      if (!res.ok) {
        let msg = "Failed to delete account";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {
          // keep default message
        }
        throw new Error(msg);
      }
      setConfirmOpen(false);
      setOpen(false);
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
        data-account-id={account.id}
        onClick={() => {
          if (isDragging) return;
          setEditing(false);
          setOpen(true);
        }}
        className={`w-full min-h-[180px] bg-card text-ink border border-hairline rounded-[28px] px-5 py-5 sm:px-[22px] sm:py-[20px] flex flex-col gap-3 cursor-pointer transition duration-200 hover:border-ink/20 ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg sm:text-xl font-bold truncate">{account.name}</p>
          <div className="flex items-center gap-1 shrink-0">
            {dragHandleProps && (
              <button
                type="button"
                aria-label="Reorder account"
                className="flex h-7 w-7 touch-none cursor-grab items-center justify-center rounded-full text-ink/25 transition-colors hover:text-ink/55 active:cursor-grabbing"
                {...dragHandleProps}
                onClick={(event) => {
                  event.stopPropagation();
                  dragHandleProps.onClick?.(event);
                }}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-ink/20 shrink-0" />
          </div>
        </div>

        <Sparkline
          values={series}
          color={sparkColor}
          variant="paper"
          className="w-full h-11 shrink-0"
        />

        <div className="mt-auto">
          <p className="text-xl sm:text-2xl font-bold tracking-tight">
            <MaskedBalance value={account.balance} mask="short" />
          </p>
          {investable && todayChangePct != null && (
            <p className="text-xs font-medium tabular-nums text-ink/50 mt-0.5">
              {todayChangePct <= 0 ? "↓" : "↑"} {Math.abs(todayChangePct).toFixed(1)}% today
            </p>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        {editing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Edit Account</h2>
              <span className="text-xs font-medium text-ink/40">
                {account.type}
              </span>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink/50">Name</span>
              <AuthInput
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink/50">Balance</span>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`${balanceFont} text-ink/40 font-semibold`}>{currency}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={formattedBalance}
                  onChange={(e) => setBalance(e.target.value.replace(/[^0-9-]/g, ""))}
                  className={`${balanceFont} text-ink/40 font-semibold bg-transparent text-center focus:outline-none placeholder:text-ink/25 w-full max-w-[280px] tabular-nums`}
                />
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink/50">Currency</span>
              <AuthInput
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink/50">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-11 text-lg bg-card text-ink px-[17px] py-[6px] rounded-[20px] border border-hairline focus:outline-none focus:ring-2 focus:ring-ink/20 transition"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <p className="flex items-center gap-2 text-sm text-expense bg-expense-tint border border-expense/30 rounded-[20px] px-4 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="softred"
                size="md"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="soft" size="md" loading={loading} fullWidth>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold">{account.name}</p>
              <span className="text-xs font-medium text-ink/40">
                {account.type}
              </span>
            </div>
            <p className="text-sm text-ink/50">{account.currency}</p>
            <p className="text-3xl font-bold tracking-tight mt-4">
              {formatRupiah(account.balance)}
            </p>

            {error && (
              <p className="flex items-center gap-2 text-sm text-expense bg-expense-tint border border-expense/30 rounded-[20px] px-4 py-2.5 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                leadingIcon={<Pencil className="w-4 h-4" />}
                onClick={startEdit}
                disabled={loading}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="softred"
                size="md"
                leadingIcon={<Trash2 className="w-4 h-4 text-expense" />}
                onClick={() => { setError(null); setConfirmOpen(true); }}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!loading) { setError(null); setConfirmOpen(o); } }}
      >
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-medium">Delete account?</h2>
            <p className="text-sm text-ink/40 mt-1">
              Deleting <span className="font-medium text-ink/70">{account.name}</span> ({formatRupiah(account.balance)}) will remove this account. Its transactions will be kept but unlinked from any account. This cannot be undone.
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