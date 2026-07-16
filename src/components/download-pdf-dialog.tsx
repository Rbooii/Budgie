"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import { Download, FileDown, Search, CalendarRange } from "lucide-react";
import type { TransactionRow } from "@/components/transaction-item";
import { formatRupiah, formatDate, formatTime } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

type Scope = "all" | "filtered" | "range";

interface DownloadPdfDialogProps {
  allTransactions: TransactionRow[];
  filteredTransactions: TransactionRow[];
}

export function DownloadPdfDialog({
  allTransactions,
  filteredTransactions,
}: DownloadPdfDialogProps) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [generating, setGenerating] = useState(false);

  const safeAll = Array.isArray(allTransactions) ? allTransactions : [];
  const safeFiltered = Array.isArray(filteredTransactions)
    ? filteredTransactions
    : [];

  function resolveTransactions(): TransactionRow[] {
    if (scope === "filtered") return safeFiltered;
    if (scope === "range") {
      const f = from ? new Date(from + "T00:00:00") : null;
      const t = to ? new Date(to + "T23:59:59") : null;
      return safeAll.filter((tx) => {
        const d = new Date(tx.date);
        if (f && d < f) return false;
        if (t && d > t) return false;
        return true;
      });
    }
    return safeAll;
  }

  function buildPdf() {
    setGenerating(true);
    try {
      const items = resolveTransactions();
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(17, 17, 17);
      doc.text("Budgie — Transactions Report", 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const scopeLabel =
        scope === "filtered"
          ? "Filtered by search"
          : scope === "range"
            ? `Date range: ${from || "…"} → ${to || "…"}`
            : "All transactions";
      doc.text(`${scopeLabel} • ${items.length} item(s)`, 14, 25);
      doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 14, 30);

      const income = items
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = items
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const transfer = items
        .filter((t) => t.type === "transfer")
        .reduce((s, t) => s + t.amount, 0);

      autoTable(doc, {
        startY: 36,
        head: [["Date", "Name", "Bank", "Type", "Category", "Amount"]],
        body: items.map((t) => [
          `${formatDate(t.date)} ${formatTime(t.date)}`,
          t.name,
          t.type === "transfer"
            ? t.balanceAccount && t.toBalanceAccount
              ? `${t.balanceAccount.name} → ${t.toBalanceAccount.name}`
              : "—"
            : (t.balanceAccount?.name ?? "—"),
          t.type,
          categoryLabel(t.category),
          (t.type === "income" ? "+" : t.type === "expense" ? "-" : "") +
            formatRupiah(t.amount),
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [17, 17, 17], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const afterY =
        (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY ?? 40;

      doc.setFontSize(10);
      doc.setTextColor(17, 17, 17);
      doc.text(
        `Summary — Income: ${formatRupiah(income)}   Expense: ${formatRupiah(
          expense,
        )}   Transfer: ${formatRupiah(transfer)}`,
        14,
        afterY + 10,
      );

      doc.save("transactions.pdf");
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  }

  const options: { key: Scope; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: "all",
      label: "All transactions",
      desc: "Export everything",
      icon: <FileDown className="w-4 h-4" />,
    },
    {
      key: "filtered",
      label: "Filtered by search",
      desc: `${filteredTransactions.length} from current search`,
      icon: <Search className="w-4 h-4" />,
    },
    {
      key: "range",
      label: "Date range",
      desc: "Pick a from–to window",
      icon: <CalendarRange className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="md"
        leadingIcon={<Download className="w-4 h-4" />}
        onClick={() => setOpen(true)}
      >
        Download
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold">Download PDF</h2>
            <p className="text-sm text-black/50 mt-1">
              Choose which transactions to include in the report.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setScope(opt.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] border text-left transition ${
                  scope === opt.key
                    ? "border-black/30 bg-[#F2F2F2]"
                    : "border-black/10 hover:bg-[#F8F8F8]"
                }`}
              >
                <span className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/60 shrink-0">
                  {opt.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-black">
                    {opt.label}
                  </span>
                  <span className="block text-xs text-black/40">
                    {opt.desc}
                  </span>
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 transition ${
                    scope === opt.key
                      ? "border-black bg-black"
                      : "border-black/20"
                  }`}
                />
              </button>
            ))}
          </div>

          {scope === "range" && (
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-xs font-medium text-black/50">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full h-11 text-sm bg-white text-black px-3 py-2 rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-xs font-medium text-black/50">To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full h-11 text-sm bg-white text-black px-3 py-2 rounded-[20px] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition"
                />
              </label>
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <Button
              type="button"
              variant="soft"
              size="md"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={generating}
              fullWidth
              onClick={buildPdf}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
