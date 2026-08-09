import { Reveal } from "./reveal";

type Tint = "income" | "expense" | "transfer";

const DOT_CLASS: Record<Tint, string> = {
  income: "bg-[#1F9B29]",
  expense: "bg-[#D8000C]",
  transfer: "bg-[#B25B00]",
};

interface Pill {
  label: string;
  tint: Tint;
}

const PILLS: Pill[] = [
  { label: "Accounts", tint: "income" },
  { label: "Transactions", tint: "income" },
  { label: "Budgets", tint: "expense" },
  { label: "Subscriptions", tint: "transfer" },
  { label: "Cashflow donut", tint: "income" },
  { label: "Asset growth", tint: "transfer" },
  { label: "Spending streams", tint: "expense" },
  { label: "Per-character balance reveal", tint: "income" },
  { label: "QRIS Plus", tint: "expense" },
  { label: "Rupiah native", tint: "income" },
  { label: "PDF export", tint: "transfer" },
  { label: "21 premade categories", tint: "expense" },
];

function Row() {
  return (
    <ul
      className="flex shrink-0 items-center gap-2 pr-2"
      aria-hidden="true"
    >
      {PILLS.map((p) => (
        <li
          key={p.label}
          className="group flex items-center gap-2 rounded-full bg-[#F2F2F2] px-5 py-2.5 whitespace-nowrap transition-colors duration-150 motion-safe:hover:bg-[#00C610]"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[p.tint]} transition-colors duration-150 motion-safe:group-hover:bg-white`} />
          <span className="text-sm font-medium text-black/70 transition-colors duration-150 motion-safe:group-hover:text-white">
            {p.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Marquee() {
  return (
    <section
      aria-label="Budgie feature highlights"
      className="border-y border-black/[0.04] bg-white py-6 sm:py-8"
    >
      <Reveal>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max animate-[marquee_42s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
            <Row />
            <Row />
          </div>
        </div>
      </Reveal>
    </section>
  );
}