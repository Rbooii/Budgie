import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Target,
  CalendarClock,
  FileDown,
} from "lucide-react";
import { Reveal } from "./reveal";

interface UseCase {
  icon: React.ReactNode;
  tint: string;
  title: string;
}

const USE_CASES: UseCase[] = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    tint: "bg-income-tint text-income",
    title: "Tally the month\u2019s income",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    tint: "bg-expense-tint text-expense",
    title: "Catch a spending leak",
  },
  {
    icon: <Target className="w-5 h-5" />,
    tint: "bg-transfer-tint text-transfer",
    title: "Stay under every budget",
  },
  {
    icon: <CalendarClock className="w-5 h-5" />,
    tint: "bg-income-tint text-brand",
    title: "Never miss a renewal",
  },
  {
    icon: <FileDown className="w-5 h-5" />,
    tint: "bg-surface text-ink/70",
    title: "Export records to PDF",
  },
];

/**
 * "See what Notion can do" → "See what Budgie can do": Notion's compact link
 * cards (quiet header, icon + title per card), with no decorative arrows.
 */
export function UseCases() {
  return (
    <section
      id="use-cases"
      aria-labelledby="usecases-title"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28 scroll-mt-24"
    >
      <Reveal>
        <h2
          id="usecases-title"
          className="text-sm font-normal text-ink/60"
        >
          See what Budgie can do
        </h2>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {USE_CASES.map((uc, i) => (
          <Reveal key={uc.title} delay={(i % 5) * 60} className="h-full">
            <Link
              href="/sign-in"
              className="group flex items-center gap-4 h-full rounded-[20px] border border-hairline bg-card p-5 transition-colors duration-200 hover:bg-hover active:scale-[0.98] motion-reduce:transition-none"
            >
              <span
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100 ${uc.tint}`}
              >
                {uc.icon}
              </span>
              <span className="text-base font-bold leading-6 text-ink">
                {uc.title}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
