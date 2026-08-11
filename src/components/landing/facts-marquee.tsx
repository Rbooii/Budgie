import {
  LayoutGrid,
  SlidersHorizontal,
  QrCode,
  BadgePercent,
  BarChart3,
  FileDown,
  EyeOff,
} from "lucide-react";
import { Reveal } from "./reveal";

/**
 * The stats marquee — Notion's `statsMarquee` anatomy in the same spot
 * (between the last content section and the endcap). Unlike Notion's company
 * stats, every item here is a true, verifiable Budgie product fact — no
 * invented social proof.
 */
const FACTS = [
  { icon: <LayoutGrid className="w-4 h-4" />, label: "21 premade categories" },
  { icon: <SlidersHorizontal className="w-4 h-4" />, label: "3 transaction types, zero math" },
  { icon: <QrCode className="w-4 h-4" />, label: "QRIS-native Plus checkout" },
  { icon: <BadgePercent className="w-4 h-4" />, label: "Rp-first id-ID formatting" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "12 months of asset history" },
  { icon: <FileDown className="w-4 h-4" />, label: "PDF exports for any date range" },
  { icon: <EyeOff className="w-4 h-4" />, label: "Hidden-by-default balances" },
] as const;

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-10 pr-10"
      aria-hidden={ariaHidden}
    >
      {FACTS.map((f) => (
        <li
          key={f.label}
          className="inline-flex items-center gap-2.5 text-sm font-medium text-[#615d59] whitespace-nowrap"
        >
          <span className="text-black/35">{f.icon}</span>
          {f.label}
        </li>
      ))}
    </ul>
  );
}

export function FactsMarquee() {
  return (
    <section
      aria-label="Budgie product facts"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-16 sm:py-20 overflow-hidden"
    >
      <Reveal>
        <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-[marquee_38s_linear_infinite] motion-reduce:animate-none">
            <Row />
            <Row ariaHidden />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
