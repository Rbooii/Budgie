import { AutoVideo } from "./auto-video";
import { Reveal } from "./reveal";

type Tint = "income" | "expense" | "transfer";

const TINT_TILE: Record<Tint, string> = {
  income: "bg-[#A0FFA8]/40",
  expense: "bg-[#FFBABA]/40",
  transfer: "bg-[#FFD9A0]/40",
};

interface Vignette {
  tint: Tint;
  kicker: string;
  title: string;
  desc: string;
  webm: string;
  mp4: string;
  label: string;
}

const VIGNETTES: Vignette[] = [
  {
    tint: "expense",
    kicker: "Budgets",
    title: "A budget that knows your month",
    desc: "Pick a category, set a limit, and watch the bar tick to the edge. It turns red the moment you slip.",
    webm: "/videos/vignette-1.webm",
    mp4: "/videos/vignette-1.mp4",
    label: "Setting a category budget in the Budgie app, fifteen seconds, silent",
  },
  {
    tint: "income",
    kicker: "Privacy",
    title: "Hide it in a heartbeat",
    desc: "Balances stay masked by default. One tap on the eye and the digits reveal, character by character.",
    webm: "/videos/vignette-2.webm",
    mp4: "/videos/vignette-2.mp4",
    label: "Toggling balance visibility in the Budgie app, fifteen seconds, silent",
  },
  {
    tint: "transfer",
    kicker: "Subscriptions",
    title: "Never miss a renewal",
    desc: "Recurring charges line up with their next billing date. No surprises, no mystery debits.",
    webm: "/videos/vignette-3.webm",
    mp4: "/videos/vignette-3.mp4",
    label: "Reviewing upcoming subscription renewals in the Budgie app, fifteen seconds, silent",
  },
];

export function Vignettes() {
  return (
    <section
      id="stories"
      aria-labelledby="stories-title"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28"
    >
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold text-[#00C610]">In real moments</p>
        <h2
          id="stories-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2"
        >
          Short films of the calm
        </h2>
        <p className="text-base text-black/45 mt-3 leading-relaxed">
          Three little motions you repeat every day. Each one is a few seconds of
          silent footage — just the app, no noise.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {VIGNETTES.map((v, i) => (
          <Reveal key={v.title} delay={(i % 3) * 80}>
            <article className="group flex flex-col">
              <AutoVideo
                webm={v.webm}
                mp4={v.mp4}
                label={v.label}
                glyphSize="w-12 h-12"
                posterClassName={TINT_TILE[v.tint]}
                frameClassName="aspect-[9/16] rounded-[28px] border border-black/[0.06] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] transition-shadow duration-200 group-hover:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.16)]"
                posterContent={
                  <span key={v.desc} className="mt-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-black/60">
                    {v.kicker}
                  </span>
                }
              />
              <h3 className="text-lg font-semibold text-black mt-4 leading-snug">
                {v.title}
              </h3>
              <p className="text-sm text-black/45 mt-1.5 leading-relaxed">
                {v.desc}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}