"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Dialog } from "@/components/dialog";
import { Button, type Variant, type Size } from "@/components/button";
import { AuthInput } from "@/components/auth-input";
import { dynamicFontSize } from "@/lib/font-size";
import { formatBalanceInput } from "@/lib/format";
import { AlertCircle } from "lucide-react";

const TYPES = ["bank", "digital wallet", "cash", "credit", "investment"];

export function AddAccountDialog({
  triggerVariant = "soft",
  triggerSize = "md",
  triggerFullWidth = false,
  triggerLabel = "Add Account",
}: {
  triggerVariant?: Variant;
  triggerSize?: Size;
  triggerFullWidth?: boolean;
  triggerLabel?: string;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [type, setType] = useState("bank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedBalance = formatBalanceInput(balance);
  const balanceFont = dynamicFontSize(formattedBalance);

  function reset() {
    setName("");
    setBalance("");
    setCurrency("IDR");
    setType("bank");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api["balance-accounts"].$post({
        json: {
          name,
          balance: balance === "" ? 0 : Number(balance.replace(/[^0-9-]/g, "") || 0),
          currency,
          type,
        },
      });
      if (!res.ok) {
        let msg = "Failed to create account";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {
          // keep default message
        }
        throw new Error(msg);
      }
      setOpen(false);
      reset();
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
        variant={triggerVariant}
        size={triggerSize}
        fullWidth={triggerFullWidth}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-medium">Add Account</h2>
            <p className="text-sm text-gray-500">Adding an account card is optional, but it can help provide a more complete and accurate overview of your finances.</p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Name</span>
            <AuthInput
              type="text"
              placeholder="e.g. Bank BCA"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-11 text-lg bg-white text-black px-[17px] py-[6px] rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Currency</span>
            <AuthInput
              type="text"
              placeholder="IDR"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-black/50">Balance</span>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`${balanceFont} text-gray-400 font-semibold`}>{currency}</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={formattedBalance}
                onChange={(e) => setBalance(e.target.value.replace(/[^0-9-]/g, ""))}
                className={`${balanceFont} text-gray-400 font-semibold bg-transparent text-center focus:outline-none placeholder:text-gray-300 w-full max-w-[280px] tabular-nums`}
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
            <Button type="submit" variant="success" size="md" loading={loading} className="px-3">
              Add
            </Button>
            <Button
              type="button"
              variant="soft"
              size="md"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}