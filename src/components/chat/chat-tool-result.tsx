"use client";

import type { ReactNode } from "react";
import {
  CheckCircle2,
  Receipt,
  Repeat,
  Target,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icon";
import { periodLabel } from "@/lib/budget";
import {
  TransactionItem,
  type TransactionRow,
} from "@/components/transaction-item";
import type {
  ChatAccountsResult,
  ChatBudgetsResult,
  ChatCreateTransactionResult,
  ChatInsightsResult,
  ChatSubscriptionsResult,
  ChatTransactionsResult,
} from "@/components/chat/types";

function ListHeader({ children }: { children: ReactNode }) {
  return (
    <p className="px-3.5 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-black/35">
      {children}
    </p>
  );
}

function RowIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className: string;
}) {
  return (
    <span
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${className}`}
    >
      <Icon className="w-5 h-5" />
    </span>
  );
}

function RowContainer({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[92%] flex flex-col animate-[stepReveal_0.2s_ease-out]">
      {children}
    </div>
  );
}

function AccountsResult({ data }: { data: ChatAccountsResult }) {
  return (
    <RowContainer>
      <div className="flex items-baseline justify-between px-3.5 pt-1 pb-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-black/35">
          Accounts
        </p>
        <p className="text-lg font-semibold tabular-nums text-black">
          {formatRupiah(data.totalBalance)}
        </p>
      </div>
      <div className="flex flex-col">
        {data.accounts.map((a) => (
          <div
            key={a.id}
            className="w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl hover:bg-[#FAFAFA] transition"
          >
            <RowIcon
              icon={Wallet}
              className="bg-[#A0FFA8]/30 text-[#1F9B29]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-black truncate">
                {a.name}
              </p>
              <p className="text-sm text-black/45 capitalize truncate">
                {a.type}
              </p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-black shrink-0">
              {formatRupiah(a.balance)}
            </p>
          </div>
        ))}
      </div>
    </RowContainer>
  );
}

function toTransactionRow(
  t: ChatTransactionsResult["items"][number],
): TransactionRow {
  return {
    id: t.id,
    name: t.name,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    adminFee: t.adminFee,
    balanceAccountId: null,
    toBalanceAccountId: null,
    balanceAccount: t.account
      ? { id: t.id, name: t.account, currency: "IDR" }
      : null,
    toBalanceAccount: t.toAccount
      ? { id: t.id, name: t.toAccount, currency: "IDR" }
      : null,
  };
}

function TransactionsResult({ data }: { data: ChatTransactionsResult }) {
  if (data.items.length === 0) {
    return (
      <RowContainer>
        <div className="flex items-center gap-3.5 px-3.5 py-3">
          <RowIcon icon={Receipt} className="bg-[#F2F2F2] text-black/40" />
          <p className="text-sm text-black/55">No transactions found.</p>
        </div>
      </RowContainer>
    );
  }

  return (
    <RowContainer>
      <ListHeader>
        {data.count} transaction{data.count === 1 ? "" : "s"}
      </ListHeader>
      <div className="flex flex-col gap-1.5">
        {data.items.slice(0, 8).map((t) => (
          <TransactionItem
            key={t.id}
            transaction={toTransactionRow(t)}
            hideChevron
          />
        ))}
      </div>
      {data.items.length > 8 && (
        <p className="px-3.5 pt-1 text-xs text-black/40">
          and {data.items.length - 8} more
        </p>
      )}
    </RowContainer>
  );
}

function BudgetsResult({ data }: { data: ChatBudgetsResult }) {
  if (data.budgets.length === 0) {
    return (
      <RowContainer>
        <div className="flex items-center gap-3.5 px-3.5 py-3">
          <RowIcon icon={Target} className="bg-[#FFBABA]/40 text-[#D8000C]" />
          <p className="text-sm text-black/55">No budgets yet.</p>
        </div>
      </RowContainer>
    );
  }

  return (
    <RowContainer>
      <ListHeader>Budgets</ListHeader>
      <div className="flex flex-col gap-1.5">
        {data.budgets.map((b) => {
          const pct =
            b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
          const over = b.spent > b.amount;
          return (
            <div
              key={b.id}
              className="w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl hover:bg-[#FAFAFA] transition"
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#FFBABA]/40 text-[#D8000C]">
                {categoryIcon(b.category, "w-5 h-5")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-black truncate">
                  {b.categoryLabel}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-black/40 shrink-0">
                    {periodLabel(b.periodDays)}
                  </span>
                  <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden min-w-[40px]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        over ? "bg-[#D8000C]" : "bg-[#00C610]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <p className="text-lg font-semibold tabular-nums text-black">
                  {formatRupiah(b.amount)}
                </p>
                <p className="text-xs text-black/35 tabular-nums">
                  {formatRupiah(b.spent)} spent
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </RowContainer>
  );
}

function SubscriptionsResult({ data }: { data: ChatSubscriptionsResult }) {
  if (data.subscriptions.length === 0) {
    return (
      <RowContainer>
        <div className="flex items-center gap-3.5 px-3.5 py-3">
          <RowIcon icon={Repeat} className="bg-[#FFD9A0]/40 text-[#B25B00]" />
          <p className="text-sm text-black/55">No subscriptions yet.</p>
        </div>
      </RowContainer>
    );
  }

  return (
    <RowContainer>
      <ListHeader>Subscriptions</ListHeader>
      <div className="flex flex-col gap-1.5">
        {data.subscriptions.map((s) => (
          <div
            key={s.id}
            className="w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl hover:bg-[#FAFAFA] transition"
          >
            <RowIcon icon={Repeat} className="bg-[#FFD9A0]/40 text-[#B25B00]" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-black truncate">
                {s.name}
              </p>
              <p className="text-sm text-black/45 truncate">
                {s.categoryLabel} · {periodLabel(s.periodDays)}
                {!s.active ? " · Inactive" : ""}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <p className="text-lg font-semibold tabular-nums text-black">
                {formatRupiah(s.amount)}
              </p>
              <p className="text-xs text-black/35">
                Next {new Date(s.nextBillingDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </RowContainer>
  );
}

function InsightsResult({ data }: { data: ChatInsightsResult }) {
  const maxTop = data.topCategories[0]?.amount ?? 0;

  return (
    <RowContainer>
      <div className="flex items-baseline justify-between px-3.5 pt-1 pb-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-black/35">
          Insights
        </p>
        <p className="text-lg font-semibold tabular-nums text-black">
          {formatRupiah(data.netWorth)}
        </p>
      </div>
      <div className="px-3.5 grid grid-cols-2 gap-2 mt-1.5">
        <div className="rounded-2xl bg-[#A0FFA8]/30 px-3 py-2">
          <p className="text-[11px] font-medium text-[#1F9B29]">
            Income this month
          </p>
          <p className="text-sm font-semibold tabular-nums text-[#1F9B29]">
            {formatRupiah(data.monthIncome)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#FFBABA]/40 px-3 py-2">
          <p className="text-[11px] font-medium text-[#D8000C]">
            Expenses this month
          </p>
          <p className="text-sm font-semibold tabular-nums text-[#D8000C]">
            {formatRupiah(data.monthExpense)}
          </p>
        </div>
      </div>
      {data.topCategories.length > 0 && (
        <>
          <p className="px-3.5 pt-3 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-black/35">
            Top categories
          </p>
          <div className="flex flex-col">
            {data.topCategories.map((tc) => (
              <div
                key={tc.category}
                className="flex items-center gap-3 px-3.5 py-2.5"
              >
                <span className="text-sm text-black/60 w-32 truncate">
                  {categoryLabel(tc.category)}
                </span>
                <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FFBABA]"
                    style={{
                      width: `${maxTop > 0 ? (tc.amount / maxTop) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm tabular-nums text-black/60 w-24 text-right">
                  {formatRupiah(tc.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </RowContainer>
  );
}

function CreateTransactionResult({
  data,
}: {
  data: ChatCreateTransactionResult;
}) {
  if (!data.ok) {
    return (
      <div className="w-full max-w-[92%] rounded-[20px] border border-[#FFBABA] bg-[#FFBABA]/30 px-4 py-3 animate-[stepReveal_0.2s_ease-out]">
        <div className="flex items-start gap-2">
          <XCircle className="w-4 h-4 text-[#D8000C] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#D8000C]">
              Couldn&apos;t add the transaction
            </p>
            <p className="text-xs text-[#D8000C]/80 mt-0.5">{data.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const t = data.transaction;
  const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";
  const color =
    t.type === "income"
      ? "text-[#1F9B29]"
      : t.type === "expense"
        ? "text-[#D8000C]"
        : "text-[#B25B00]";
  const iconBg =
    t.type === "income"
      ? "bg-[#A0FFA8]/30 text-[#1F9B29]"
      : t.type === "expense"
        ? "bg-[#FFBABA]/40 text-[#D8000C]"
        : "bg-[#FFD9A0]/40 text-[#B25B00]";

  return (
    <RowContainer>
      <p className="px-3.5 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-[#1F9B29]">
        Transaction added
      </p>
      <div className="w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl hover:bg-[#FAFAFA] transition">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-black truncate">{t.name}</p>
          <p className="text-sm text-black/45 truncate">
            {categoryLabel(t.category)}
            {t.account ? ` · ${t.account}` : ""}
          </p>
        </div>
        <p className={`text-lg font-semibold tabular-nums shrink-0 ${color}`}>
          {sign}
          {formatRupiah(t.amount)}
        </p>
      </div>
    </RowContainer>
  );
}

export function ChatToolResult({
  toolName,
  output,
}: {
  toolName: string;
  output: unknown;
}) {
  switch (toolName) {
    case "get_balance_accounts":
      return <AccountsResult data={output as ChatAccountsResult} />;
    case "get_transactions":
      return <TransactionsResult data={output as ChatTransactionsResult} />;
    case "get_budgets":
      return <BudgetsResult data={output as ChatBudgetsResult} />;
    case "get_subscriptions":
      return <SubscriptionsResult data={output as ChatSubscriptionsResult} />;
    case "get_insights":
      return <InsightsResult data={output as ChatInsightsResult} />;
    case "create_transaction":
      return (
        <CreateTransactionResult data={output as ChatCreateTransactionResult} />
      );
    default:
      return null;
  }
}