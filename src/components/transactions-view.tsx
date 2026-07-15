"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Receipt, SearchX } from "lucide-react";
import { Button } from "@/components/button";
import {
  TransactionItem,
  type TransactionRow,
} from "@/components/transaction-item";
import { DownloadPdfDialog } from "@/components/download-pdf-dialog";
import { TransactionDetailSheet } from "@/components/transaction-detail-sheet";
import { formatDate } from "@/lib/format";

interface TransactionsViewProps {
  transactions: TransactionRow[];
}

const TODAY = new Date();
const YESTERDAY = new Date();
YESTERDAY.setDate(TODAY.getDate() - 1);
const todayKey = todayKeyOf(TODAY);
const yKey = todayKeyOf(YESTERDAY);

function todayKeyOf(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const k = todayKeyOf(d);
  if (k === todayKey) return "Today";
  if (k === yKey) return "Yesterday";
  return formatDate(d);
}

export function TransactionsView({ transactions }: TransactionsViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TransactionRow | null>(null);

  const list = useMemo(
    () => (Array.isArray(transactions) ? transactions : []),
    [transactions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => {
      const bank =
        t.type === "transfer"
          ? t.balanceAccount && t.toBalanceAccount
            ? `${t.balanceAccount.name} ${t.toBalanceAccount.name}`
            : ""
          : (t.balanceAccount?.name ?? "");
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        bank.toLowerCase().includes(q) ||
        formatDate(t.date).toLowerCase().includes(q)
      );
    });
  }, [query, list]);

  const grouped = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, TransactionRow[]>();
    for (const t of filtered) {
      const label = dayLabel(t.date);
      if (!map.has(label)) {
        map.set(label, []);
        order.push(label);
      }
      map.get(label)!.push(t);
    }
    return order.map((label) => ({ label, items: map.get(label)! }));
  }, [filtered]);

  const hasAny = list.length > 0;
  const hasResults = grouped.length > 0;
  const isSearching = query.trim().length > 0;

  return (
    <>
      <div className="w-full mt-2 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions"
              className="w-full h-11 pl-10 pr-4 text-sm bg-[#F2F2F2] text-black rounded-full placeholder:text-black/40 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/15 transition"
            />
          </div>

          <div className="flex gap-2">
            <DownloadPdfDialog
              allTransactions={list}
              filteredTransactions={filtered}
            />
            <Button
              type="button"
              variant="soft"
              size="md"
              onClick={() => router.push("/transactions/add")}
            >
              Add
            </Button>
          </div>
        </div>

        {!hasAny ? null : (
          <div className="flex flex-col gap-3">
            {grouped.map(({ label, items }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <p className="px-3.5 pt-2 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-black/35">
                  {label}
                </p>
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onClick={setSelected}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {!hasAny ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title="No transactions yet"
          desc="Your recorded income, expenses, and transfers will appear here."
          action={
            <Button
              type="button"
              variant="success"
              size="md"
              leadingIcon={<Plus className="w-4 h-4" />}
              onClick={() => router.push("/transactions/add")}
            >
              Add transaction
            </Button>
          }
        />
      ) : !hasResults ? (
        <EmptyState
          icon={<SearchX className="w-6 h-6" />}
          title="No transactions found"
          desc={
            isSearching
              ? `Nothing matches "${query.trim()}". Try a different keyword.`
              : "Nothing here."
          }
        />
      ) : null}

      <TransactionDetailSheet
        transaction={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/30 mb-4">
        {icon}
      </div>
      <p className="text-base font-semibold text-black">{title}</p>
      <p className="text-sm text-black/40 mt-1 max-w-xs">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}