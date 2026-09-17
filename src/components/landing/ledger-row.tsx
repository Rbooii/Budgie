import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { formatRupiah, formatTime } from "@/lib/format";
import {
  transactionSubtitle,
  type TransactionRow,
} from "@/components/transaction-item";

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; tint: string; text: string }
> = {
  income: {
    icon: <ArrowDownLeft className="w-4 h-4" />,
    tint: "bg-[#A0FFA8]/30",
    text: "text-[#1F9B29]",
  },
  expense: {
    icon: <ArrowUpRight className="w-4 h-4" />,
    tint: "bg-[#FFBABA]/40",
    text: "text-[#D8000C]",
  },
  transfer: {
    icon: <ArrowLeftRight className="w-4 h-4" />,
    tint: "bg-[#FFD9A0]/40",
    text: "text-[#B25B00]",
  },
};

/**
 * The marketing ledger row — the app's transaction row set one step quieter:
 * a 32px tinted tile instead of 40px, 15px type instead of 18px, no hover
 * background, no chevron. Rows sit directly on the panel surface and are
 * separated by hairlines owned by the parent list.
 */
export function LedgerRow({ transaction }: { transaction: TransactionRow }) {
  const meta = TYPE_META[transaction.type] ?? TYPE_META.expense;
  const sign =
    transaction.type === "income"
      ? "+"
      : transaction.type === "expense"
        ? "-"
        : "";

  return (
    <div className="flex w-full items-center gap-3.5 py-3.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.tint} ${meta.text}`}
      >
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-black">
          {transaction.name}
        </p>
        <p className="truncate text-[13px] text-black/45">
          {transactionSubtitle(transaction)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-[15px] font-semibold tabular-nums ${meta.text}`}>
          {sign}
          {formatRupiah(transaction.amount)}
        </p>
        <p className="text-xs text-black/35">{formatTime(transaction.date)}</p>
      </div>
    </div>
  );
}
