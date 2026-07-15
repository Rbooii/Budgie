"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/badge";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import { AuthInput } from "@/components/auth-input";
import { MaskedBalance } from "@/components/balance-visibility";
import { formatRupiah, formatBalanceInput } from "@/lib/format";
import { dynamicFontSize } from "@/lib/font-size";
import { Pencil, Trash2, AlertCircle } from "lucide-react";

type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
};

interface AccountCardProps {
  account: Account;
}

const TYPES = ["bank", "digital wallet", "cash", "credit", "investment"];

export function AccountCard({ account }: AccountCardProps) {
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
        onClick={() => {
          setEditing(false);
          setOpen(true);
        }}
        className="w-full h-[180px] sm:h-[200px] bg-white text-black border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-10px_rgba(0,0,0,0.12)] rounded-[35px] px-5 py-5 sm:px-[22px] sm:py-[20px] flex flex-col justify-between cursor-pointer transition transform duration-200"
      >
        <div className="flex items-center justify-between">
          <p className="text-lg sm:text-xl font-bold">{account.name}</p>
          <Badge variant="soft">{account.type}</Badge>
        </div>

        <div>
          <p className="text-xs font-medium text-black/40 mt-1">Available Balance</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight">
            <MaskedBalance value={account.balance} mask="short" />
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        {editing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Edit Account</h2>
              <Badge variant="soft">{account.type}</Badge>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-black/50">Name</span>
              <AuthInput
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-black/50">Currency</span>
              <AuthInput
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
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
              <Badge variant="soft">{account.type}</Badge>
            </div>
            <p className="text-sm text-black/50">{account.currency}</p>
            <p className="text-3xl font-bold tracking-tight mt-4">
              {formatRupiah(account.balance)}
            </p>

            {error && (
              <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5 mt-2">
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
                leadingIcon={<Trash2 className="w-4 h-4 text-red-600" />}
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
            <p className="text-sm text-black/40 mt-1">
              Deleting <span className="font-medium text-black/70">{account.name}</span> ({formatRupiah(account.balance)}) will remove this account. Its transactions will be kept but unlinked from any account. This cannot be undone.
            </p>
          </div>
          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
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