"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  PieChart,
  Plus,
  Repeat,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import type {
  ChatAccountsResult,
  ChatBudgetsResult,
  ChatCreateTransactionResult,
  ChatInsightsResult,
  ChatSubscriptionsResult,
  ChatTransactionsResult,
} from "@/components/chat/types";

const TOOL_ICONS: Record<string, LucideIcon> = {
  get_balance_accounts: Wallet,
  get_transactions: ArrowLeftRight,
  get_budgets: Target,
  get_subscriptions: Repeat,
  get_insights: PieChart,
  create_transaction: Plus,
};

const TOOL_TITLES: Record<string, string> = {
  get_balance_accounts: "Accounts",
  get_transactions: "Transactions",
  get_budgets: "Budgets",
  get_subscriptions: "Subscriptions",
  get_insights: "Insights",
  create_transaction: "Transaction",
};

function ToolCard({
  toolName,
  children,
}: {
  toolName: string;
  children: ReactNode;
}) {
  const Icon = TOOL_ICONS[toolName] ?? Plus;
  return (
    <div className="w-full max-w-[310px] rounded-[16px] border border-black/[0.06] bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-2.5 animate-[stepReveal_0.2s_ease-out]">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-black/45" />
        <p className="text-[13px] font-semibold text-black">
          {TOOL_TITLES[toolName] ?? toolName}
        </p>
      </div>
      {children}
    </div>
  );
}

function AccountsResult({ data }: { data: ChatAccountsResult }) {
  return (
    <>
      <div>
        <p className="text-[11px] text-black/35">Total balance</p>
        <p className="text-lg font-bold tabular-nums text-black">
          {formatRupiah(data.totalBalance)}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {data.accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-black truncate">{a.name}</p>
            <p className="text-[13px] font-semibold tabular-nums text-black shrink-0">
              {formatRupiah(a.balance)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function TransactionsResult({ data }: { data: ChatTransactionsResult }) {
  if (data.items.length === 0) {
    return <p className="text-[13px] text-black/45">No transactions found.</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {data.items.slice(0, 6).map((t) => {
          const tint =
            t.type === "income"
              ? "text-[#1F9B29]"
              : t.type === "transfer"
                ? "text-[#B25B00]"
                : "text-[#D8000C]";
          return (
            <div key={t.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-black truncate">
                  {t.name}
                </p>
                <p className="text-[11px] text-black/35 truncate">
                  {categoryLabel(t.category)} · {t.account ?? "Deleted account"}
                </p>
              </div>
              <p
                className={`text-[13px] font-semibold tabular-nums shrink-0 ${tint}`}
              >
                {formatRupiah(t.amount)}
              </p>
            </div>
          );
        })}
      </div>
      {data.items.length > 6 && (
        <p className="text-xs font-medium text-black/45">
          +{data.items.length - 6} more
        </p>
      )}
    </>
  );
}

function BudgetsResult({ data }: { data: ChatBudgetsResult }) {
  if (data.budgets.length === 0) {
    return <p className="text-[13px] text-black/45">No budgets yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.budgets.map((b) => {
        const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
        const over = b.spent > b.amount;
        return (
          <div key={b.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-black truncate">
                {b.categoryLabel}
              </p>
              <p
                className={`text-xs font-semibold tabular-nums shrink-0 ${
                  over ? "text-[#D8000C]" : "text-black/45"
                }`}
              >
                {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  over ? "bg-[#D8000C]" : "bg-[#00C610]"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubscriptionsResult({ data }: { data: ChatSubscriptionsResult }) {
  if (data.subscriptions.length === 0) {
    return <p className="text-[13px] text-black/45">No subscriptions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.subscriptions.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-black truncate">
              {s.name}
            </p>
            <p className="text-[11px] text-black/35 truncate">
              Next{" "}
              {new Date(s.nextBillingDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
          <p className="text-[13px] font-semibold tabular-nums text-[#B25B00] shrink-0">
            {formatRupiah(s.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function InsightsResult({ data }: { data: ChatInsightsResult }) {
  return (
    <>
      <p className="text-lg font-bold tabular-nums text-black">
        {formatRupiah(data.netWorth)}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <p className="text-[10px] text-black/35">Income</p>
          <p className="text-xs font-semibold tabular-nums text-[#1F9B29]">
            {formatRupiah(data.monthIncome)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-black/35">Expense</p>
          <p className="text-xs font-semibold tabular-nums text-[#D8000C]">
            {formatRupiah(data.monthExpense)}
          </p>
        </div>
      </div>

      {data.topCategories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.topCategories.slice(0, 5).map((tc) => (
            <div key={tc.category} className="flex items-center justify-between gap-3">
              <p className="text-xs text-black/45 truncate">
                {categoryLabel(tc.category)}
              </p>
              <p className="text-xs font-semibold tabular-nums text-black shrink-0">
                {formatRupiah(tc.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CreateTransactionResult({
  data,
}: {
  data: ChatCreateTransactionResult;
}) {
  if (!data.ok) {
    return (
      <div className="flex items-start gap-2 text-[#D8000C]">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p className="text-[13px] font-medium">{data.error}</p>
      </div>
    );
  }

  const t = data.transaction;
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-[#1F9B29] shrink-0" />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-black truncate">{t.name}</p>
        <p className="text-[11px] text-black/35 truncate">
          {formatRupiah(t.amount)}
          {t.account ? ` · ${t.account}` : ""}
        </p>
      </div>
    </div>
  );
}

export function ChatToolResult({
  toolName,
  output,
}: {
  toolName: string;
  output: unknown;
}) {
  let content: ReactNode = null;

  switch (toolName) {
    case "get_balance_accounts":
      content = <AccountsResult data={output as ChatAccountsResult} />;
      break;
    case "get_transactions":
      content = <TransactionsResult data={output as ChatTransactionsResult} />;
      break;
    case "get_budgets":
      content = <BudgetsResult data={output as ChatBudgetsResult} />;
      break;
    case "get_subscriptions":
      content = <SubscriptionsResult data={output as ChatSubscriptionsResult} />;
      break;
    case "get_insights":
      content = <InsightsResult data={output as ChatInsightsResult} />;
      break;
    case "create_transaction":
      content = (
        <CreateTransactionResult data={output as ChatCreateTransactionResult} />
      );
      break;
  }

  if (!content) return null;

  return <ToolCard toolName={toolName}>{content}</ToolCard>;
}
