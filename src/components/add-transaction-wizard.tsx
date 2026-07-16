"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/button";
import {
  ArrowLeft,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertCircle,
} from "lucide-react";
import {
  formatBalanceInput,
  formatRupiah,
  formatDate,
  formatTime,
  formatDateTimeLocalValue,
} from "@/lib/format";
import { dynamicFontSize } from "@/lib/font-size";
import { CATEGORIES_BY_TYPE, categoryLabel } from "@/lib/categories";

type TxType = "income" | "expense" | "transfer";
type Step = 1 | 2 | 3;

type Account = {
  id: string;
  name: string;
  currency: string;
  type: string;
  balance: number;
};

interface AddTransactionWizardProps {
  accounts: Account[];
}

const TYPES: {
  key: TxType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  text: string;
  ring: string;
}[] = [
  {
    key: "income",
    label: "Income",
    desc: "Money in",
    icon: <ArrowDownLeft className="w-5 h-5" />,
    text: "text-[#1F9B29]",
    ring: "border-[#A0FFA8] bg-[#A0FFA8]/15",
  },
  {
    key: "expense",
    label: "Expense",
    desc: "Money out",
    icon: <ArrowUpRight className="w-5 h-5" />,
    text: "text-[#D8000C]",
    ring: "border-[#FFBABA] bg-[#FFBABA]/20",
  },
  {
    key: "transfer",
    label: "Transfer",
    desc: "Between accounts",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    text: "text-[#B25B00]",
    ring: "border-[#FFD9A0] bg-[#FFD9A0]/20",
  },
];

const AMOUNT_TYPE_TEXT: Record<TxType, string> = {
  income: "text-[#1F9B29]",
  expense: "text-[#D8000C]",
  transfer: "text-[#B25B00]",
};

const SIGN: Record<TxType, string> = {
  income: "+",
  expense: "-",
  transfer: "",
};

export function AddTransactionWizard({ accounts }: AddTransactionWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<TxType | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(formatDateTimeLocalValue(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTransfer = type === "transfer";
  const formattedAmount = formatBalanceInput(amount);
  const amountFont = dynamicFontSize(formattedAmount || "0");

  const source = accounts.find((a) => a.id === sourceId) ?? null;
  const dest = accounts.find((a) => a.id === destId) ?? null;
  const amountNum = Number(amount.replace(/[^0-9-]/g, "") || 0);
  const feeNum = Number(adminFee.replace(/[^0-9-]/g, "") || 0);

  const step2Valid =
    !!type &&
    !!sourceId &&
    !!name.trim() &&
    amountNum > 0 &&
    !!category &&
    !!date &&
    (!isTransfer || (!!destId && destId !== sourceId));

  function selectType(t: TxType) {
    setType(t);
    setCategory("");
    setError(null);
  }

  function goNext() {
    setError(null);
    if (step === 1 && !type) return;
    if (step === 2 && !step2Valid) return;
    setStep((s) => (s + 1) as Step);
  }
  function goBack() {
    setError(null);
    if (step === 1) {
      router.push("/transactions");
      return;
    }
    setStep((s) => (s - 1) as Step);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    if (source) {
      if (type === "expense" && amountNum > source.balance) {
        setError("Insufficient balance");
        setLoading(false);
        return;
      }
      if (type === "transfer" && amountNum + feeNum > source.balance) {
        setError("Insufficient balance");
        setLoading(false);
        return;
      }
    }
    try {
      const res = await api.transactions.$post({
        json: {
          name: name.trim(),
          amount: amountNum,
          type: type!,
          category: category.trim(),
          date: new Date(date).toISOString(),
          adminFee: isTransfer ? feeNum : 0,
          balanceAccountId: sourceId,
          toBalanceAccountId: isTransfer ? destId : null,
        },
      });
      if (!res.ok) {
        let msg = "Failed to create transaction";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const ctaLabel = step === 3 ? "Confirm and Add" : "Continue";
  const ctaDisabled =
    (step === 1 && !type) ||
    (step === 2 && !step2Valid) ||
    (step === 3 && loading);
  const ctaLoading = step === 3 && loading;

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col">
        <TopBar step={step} onBack={goBack} />
        <ProgressBar step={step} />

        <div className="px-2 sm:px-6 py-7 flex flex-col gap-6 min-h-[340px]">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-center">New transaction</h2>
              <p className="text-sm text-black/40 text-center -mt-2">
                What kind of transaction is this?
              </p>
              <div className="flex flex-col gap-2.5">
                {TYPES.map((t) => {
                  const active = type === t.key;
                  const transferDisabled = t.key === "transfer" && accounts.length < 2;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      disabled={transferDisabled}
                      onClick={() => selectType(t.key)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-[20px] border transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${
                        active
                          ? t.ring
                          : "border-black/10 hover:border-black/20 hover:bg-[#FAFAFA] disabled:hover:border-black/10 disabled:hover:bg-transparent"
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-full bg-[#F2F2F2] flex items-center justify-center ${t.text}`}
                      >
                        {t.icon}
                      </span>
                      <span className="flex-1 text-left">
                        <span className="block text-sm font-semibold text-black">
                          {t.label}
                        </span>
                        <span className="block text-xs text-black/40">
                          {transferDisabled ? "Add another account to transfer" : t.desc}
                        </span>
                      </span>
                      {active && (
                        <Check className="w-4 h-4 shrink-0 text-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <form
              id="step2-form"
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
              className="flex flex-col gap-5"
            >
              <Field label="Amount">
                <div className="flex items-center justify-center gap-2 py-6">
                  <span
                    className={`${amountFont} text-gray-400 font-semibold`}
                  >
                    {source?.currency ?? "IDR"}
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
              </Field>

              <Card>
                <CardRow label="Bank account">
                  <AccountSelect
                    value={sourceId}
                    onChange={setSourceId}
                    accounts={accounts}
                    placeholder="Select account"
                  />
                </CardRow>
                {isTransfer && (
                  <CardRow label="Transfer to">
                    <AccountSelect
                      value={destId}
                      onChange={setDestId}
                      accounts={accounts.filter((a) => a.id !== sourceId)}
                      placeholder="Select account"
                    />
                  </CardRow>
                )}
                <CardRow label="Name">
                  <InlineInput
                    value={name}
                    onChange={setName}
                    placeholder="e.g. Grocery shopping"
                  />
                </CardRow>
                <CardRow label="Category">
                  <CategorySelect
                    value={category}
                    onChange={setCategory}
                    type={type!}
                    placeholder="Select category"
                  />
                </CardRow>
                {isTransfer && (
                  <CardRow label="Admin fee">
                    <InlineInput
                      value={formatBalanceInput(adminFee)}
                      onChange={(v) =>
                        setAdminFee(v.replace(/[^0-9-]/g, ""))
                      }
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </CardRow>
                )}
                <CardRow label="Date & time" last>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent text-sm text-black focus:outline-none"
                  />
                </CardRow>
              </Card>
            </form>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-1 py-4">
                <p className="text-sm text-black/40">{name.trim()}</p>
                <p
                  className={`text-3xl font-bold tracking-tight tabular-nums ${
                    type ? AMOUNT_TYPE_TEXT[type] : ""
                  }`}
                >
                  {type ? SIGN[type] : ""}
                  {formatRupiah(amountNum)}
                </p>
                {isTransfer && feeNum > 0 && (
                  <p className="text-xs text-black/40 tabular-nums">
                    Admin fee {formatRupiah(feeNum)}
                  </p>
                )}
              </div>

              <Card>
                <ReviewRow label="Type" value={<span className="capitalize">{type}</span>} />
                <ReviewRow
                  label="Bank"
                  value={
                    isTransfer
                      ? source && dest
                        ? `${source.name} → ${dest.name}`
                        : "—"
                      : (source?.name ?? "—")
                  }
                />
                <ReviewRow label="Category" value={categoryLabel(category.trim())} />
                <ReviewRow
                  label="Date"
                  value={`${formatDate(date)} ${formatTime(date)}`}
                  last
                />
              </Card>

              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-2 sm:px-6 pb-6">
          {step !== 3 && error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}
          {step === 2 ? (
            <Button
              type="submit"
              form="step2-form"
              variant="success"
              size="lg"
              fullWidth
              disabled={ctaDisabled}
              trailingIcon={<ArrowLeftRight className="w-4 h-4 rotate-180" />}
            >
              {ctaLabel}
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              size="lg"
              fullWidth
              disabled={ctaDisabled}
              loading={ctaLoading}
              trailingIcon={
                step === 3 ? <Check className="w-4 h-4" /> : undefined
              }
              onClick={step === 3 ? handleSubmit : goNext}
            >
              {ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({ step, onBack }: { step: Step; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-black/50 hover:bg-[#F2F2F2] hover:text-black transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-medium text-black/40">
          {step} of 3
        </span>
        <span className="w-9" />
      </div>
    </>
  );
}

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="h-0.5 w-full bg-black/[0.06]">
      <div
        className="h-full bg-[#00C610] transition-all duration-300 ease-out"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-black/40 mx-auto">{label}</span>
      {children}
    </label>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-black/[0.04]">{children}</div>
  );
}

function CardRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 ${last ? "py-3.5" : "py-3"}`}>
      <span className="text-xs font-medium text-black/40 w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function InlineInput({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: "text" | "decimal";
}) {
  return (
    <input
      type="text"
      inputMode={inputMode ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-black focus:outline-none placeholder:text-black/25"
    />
  );
}

function AccountSelect({
  value,
  onChange,
  accounts,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  accounts: Account[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full bg-transparent text-sm text-black focus:outline-none appearance-none cursor-pointer"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} ({a.currency})
        </option>
      ))}
    </select>
  );
}

function CategorySelect({
  value,
  onChange,
  type,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type: TxType;
  placeholder: string;
}) {
  const options = CATEGORIES_BY_TYPE[type];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full bg-transparent text-sm text-black focus:outline-none appearance-none cursor-pointer"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((c) => (
        <option key={c} value={c}>
          {categoryLabel(c)}
        </option>
      ))}
    </select>
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
    <div className={`flex items-center justify-between gap-4 px-4 ${last ? "py-3.5" : "py-3"}`}>
      <span className="text-xs font-medium text-black/40">{label}</span>
      <span className="text-sm text-black font-medium text-right">{value}</span>
    </div>
  );
}