"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icon";
import { periodLabel } from "@/lib/budget";
import type {
  ChatAccountsResult,
  ChatBudgetsResult,
  ChatCreateTransactionResult,
  ChatInsightsResult,
  ChatSubscriptionsResult,
  ChatTransactionsResult,
} from "@/components/chat/types";

const TOOL_TITLES: Record<string, string> = {
  get_balance_accounts: "Accounts",
  get_transactions: "Transactions",
  get_budgets: "Budgets",
  get_subscriptions: "Subscriptions",
  get_insights: "Insights",
  create_transaction: "Transaction",
};

const TYPE_META: Record<
  string,
  { icon: LucideIcon; bg: string; text: string; sign: string }
> = {
  income: {
    icon: ArrowDownLeft,
    bg: "bg-income-tint",
    text: "text-income",
    sign: "+",
  },
  expense: {
    icon: ArrowUpRight,
    bg: "bg-expense-tint",
    text: "text-expense",
    sign: "-",
  },
  transfer: {
    icon: ArrowLeftRight,
    bg: "bg-transfer-tint",
    text: "text-transfer",
    sign: "",
  },
};

function typeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.expense;
}

function IconCircle({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tint}`}
    >
      {children}
    </span>
  );
}

/** Quiet result panel: app section label + app list rows. */
function ToolWidget({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full max-w-[440px] flex-col rounded-[20px] border border-hairline p-2 animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none">
      <p className="px-2 pt-1 pb-0.5 text-[11px] font-medium text-ink/35">
        {title}
      </p>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-2 py-1.5 text-[13px] text-ink/45">{children}</p>;
}

function TransactionLine({
  name,
  amount,
  type,
  subtitle,
  caption,
}: {
  name: string;
  amount: number;
  type: string;
  subtitle: string;
  caption: ReactNode;
}) {
  const meta = typeMeta(type);
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <IconCircle tint={`${meta.bg} ${meta.text}`}>
        <Icon className="h-4 w-4" />
      </IconCircle>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <p className="truncate text-xs text-ink/45">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <p className={`text-sm font-semibold tabular-nums ${meta.text}`}>
          {meta.sign}
          {formatRupiah(amount)}
        </p>
        <p className="text-[11px] text-ink/35">{caption}</p>
      </div>
    </div>
  );
}

function transactionSubtitle(t: ChatTransactionsResult["items"][number]) {
  const place =
    t.type === "transfer" && t.toAccount
      ? `${t.account ?? "—"} · ${t.toAccount}`
      : (t.account ?? "Deleted account");
  return `${place} • ${categoryLabel(t.category)}`;
}

function AccountsResult({ data }: { data: ChatAccountsResult }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3 px-2 pt-0.5 pb-2">
        <p className="text-[13px] text-ink/45">Total balance</p>
        <p className="text-lg font-bold tabular-nums text-ink">
          {formatRupiah(data.totalBalance)}
        </p>
      </div>
      {data.accounts.map((a) => (
        <div key={a.id} className="flex items-center gap-3 px-2 py-2">
          <IconCircle tint="bg-surface text-ink/50">
            <Wallet className="h-4 w-4" />
          </IconCircle>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{a.name}</p>
            <p className="truncate text-xs capitalize text-ink/45">
              {a.type}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
            {formatRupiah(a.balance)}
          </p>
        </div>
      ))}
    </>
  );
}

function TransactionsResult({ data }: { data: ChatTransactionsResult }) {
  if (data.items.length === 0) {
    return <EmptyNote>No transactions found.</EmptyNote>;
  }

  return (
    <>
      {data.items.slice(0, 6).map((t) => (
        <TransactionLine
          key={t.id}
          name={t.name}
          amount={t.amount}
          type={t.type}
          subtitle={transactionSubtitle(t)}
          caption={formatDate(t.date)}
        />
      ))}
      {data.items.length > 6 && (
        <p className="px-2 pt-1 pb-0.5 text-xs font-medium text-ink/45">
          +{data.items.length - 6} more
        </p>
      )}
    </>
  );
}

function BudgetsResult({ data }: { data: ChatBudgetsResult }) {
  if (data.budgets.length === 0) {
    return <EmptyNote>No budgets yet.</EmptyNote>;
  }

  return (
    <>
      {data.budgets.map((b) => {
        const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
        const remaining = b.amount - b.spent;
        const over = remaining < 0;
        return (
          <div key={b.id} className="px-2 py-2">
            <div className="flex items-center gap-3">
              <IconCircle tint="bg-expense-tint text-expense">
                {categoryIcon(b.category, "h-4 w-4")}
              </IconCircle>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {b.categoryLabel}
                </p>
                <p className="text-xs text-ink/45">
                  {periodLabel(b.periodDays)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <p className="text-sm font-semibold tabular-nums text-ink">
                  {formatRupiah(b.amount)}
                </p>
                <p
                  className={`text-[11px] font-medium tabular-nums ${
                    over ? "text-expense" : "text-ink/40"
                  }`}
                >
                  {over
                    ? `Over ${formatRupiah(Math.abs(remaining))}`
                    : `${formatRupiah(remaining)} left`}
                </p>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline-track">
              <div
                className={`h-full rounded-full ${
                  over ? "bg-expense" : "bg-brand"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function SubscriptionsResult({ data }: { data: ChatSubscriptionsResult }) {
  if (data.subscriptions.length === 0) {
    return <EmptyNote>No subscriptions yet.</EmptyNote>;
  }

  return (
    <>
      {data.subscriptions.map((s) => (
        <div key={s.id} className="flex items-center gap-3 px-2 py-2">
          <IconCircle tint="bg-transfer-tint text-transfer">
            {categoryIcon(s.category, "h-4 w-4")}
          </IconCircle>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{s.name}</p>
            <p className="truncate text-xs text-ink/45">
              {s.categoryLabel} · {periodLabel(s.periodDays)}
            </p>
            <p className="text-[11px] text-ink/35">
              Next {formatDate(s.nextBillingDate)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <p className="text-sm font-semibold tabular-nums text-transfer">
              {formatRupiah(s.amount)}
            </p>
            {!s.active && <p className="text-[11px] text-ink/35">Inactive</p>}
          </div>
        </div>
      ))}
    </>
  );
}

function InsightsResult({ data }: { data: ChatInsightsResult }) {
  return (
    <>
      <div className="px-2 pt-0.5 pb-2">
        <p className="text-[11px] text-ink/45">Net worth</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight tabular-nums text-ink">
          {formatRupiah(data.netWorth)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-2 pb-2">
        <div>
          <p className="text-[10px] text-ink/35">Income</p>
          <p className="text-xs font-semibold tabular-nums text-income">
            {formatRupiah(data.monthIncome)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-ink/35">Expense</p>
          <p className="text-xs font-semibold tabular-nums text-expense">
            {formatRupiah(data.monthExpense)}
          </p>
        </div>
      </div>

      {data.topCategories.slice(0, 5).map((tc) => (
        <div key={tc.category} className="flex items-center gap-3 px-2 py-1.5">
          <IconCircle tint="bg-surface text-ink/50">
            {categoryIcon(tc.category, "h-4 w-4")}
          </IconCircle>
          <p className="min-w-0 flex-1 truncate text-[13px] text-ink/60">
            {categoryLabel(tc.category)}
          </p>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
            {formatRupiah(tc.amount)}
          </p>
        </div>
      ))}
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
      <div className="m-1 flex items-start gap-2 rounded-[16px] bg-expense-tint px-3.5 py-2.5 text-expense">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="text-[13px] font-medium">{data.error}</p>
      </div>
    );
  }

  const t = data.transaction;
  return (
    <TransactionLine
      name={t.name}
      amount={t.amount}
      type={t.type}
      subtitle={`${categoryLabel(t.category)}${t.account ? ` • ${t.account}` : ""}`}
      caption={<span className="font-medium text-income">Added</span>}
    />
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

  return <ToolWidget title={TOOL_TITLES[toolName] ?? toolName}>{content}</ToolWidget>;
}
