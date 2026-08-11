"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { formatRupiah, formatTime } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

export type TransactionRow = {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  adminFee: number;
  balanceAccountId: string | null;
  toBalanceAccountId: string | null;
  balanceAccount: { id: string; name: string; currency: string } | null;
  toBalanceAccount: { id: string; name: string; currency: string } | null;
};

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string }
> = {
  income: {
    icon: <ArrowDownLeft className="w-5 h-5" />,
    bg: "bg-[#A0FFA8]/30",
    text: "text-[#1F9B29]",
  },
  expense: {
    icon: <ArrowUpRight className="w-5 h-5" />,
    bg: "bg-[#FFBABA]/40",
    text: "text-[#D8000C]",
  },
  transfer: {
    icon: <ArrowLeftRight className="w-5 h-5" />,
    bg: "bg-[#FFD9A0]/40",
    text: "text-[#B25B00]",
  },
};

interface TransactionItemProps {
  transaction: TransactionRow;
  onClick?: (t: TransactionRow) => void;
  /** Non-interactive contexts (marketing previews) drop the trailing chevron. */
  hideChevron?: boolean;
}

export function TransactionItem({
  transaction,
  onClick,
  hideChevron = false,
}: TransactionItemProps) {
  const meta = TYPE_META[transaction.type] ?? TYPE_META.expense;
  const sign =
    transaction.type === "income"
      ? "+"
      : transaction.type === "expense"
        ? "-"
        : "";

  const subtitle = `${
    transaction.type === "transfer"
      ? transaction.balanceAccount && transaction.toBalanceAccount
        ? `${transaction.balanceAccount.name} · ${transaction.toBalanceAccount.name}`
        : "—"
      : (transaction.balanceAccount?.name ?? "Deleted account")
  } • ${categoryLabel(transaction.category)}`;

  return (
    <button
      type="button"
      onClick={() => onClick?.(transaction)}
      className="group w-full flex items-center gap-3.5 px-3.5 py-3.5 text-left rounded-2xl hover:bg-[#FAFAFA] transition"
    >
      <span
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}
      >
        {meta.icon}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-black truncate">
          {transaction.name}
        </p>
        <p className="text-sm text-black/45 truncate">{subtitle}</p>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <p className={`text-lg font-semibold tabular-nums ${meta.text}`}>
          {sign}
          {formatRupiah(transaction.amount)}
        </p>
        <p className="text-xs text-black/35">{formatTime(transaction.date)}</p>
      </div>

      {!hideChevron && (
        <ChevronRight className="w-5 h-5 text-black/15 group-hover:text-black/30 transition shrink-0 hidden sm:block" />
      )}
    </button>
  );
}