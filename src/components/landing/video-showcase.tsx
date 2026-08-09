import { AutoVideo } from "./auto-video";
import { Reveal } from "./reveal";

export function VideoShowcase() {
  return (
    <section
      id="motion"
      aria-labelledby="motion-title"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28"
    >
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold text-[#00C610]">See it in motion</p>
        <h2
          id="motion-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2"
        >
          Watch your money settle into focus
        </h2>
        <p className="text-base text-black/45 mt-3 leading-relaxed">
          One quiet dashboard, three clean transaction types, automatic balances,
          and charts that read themselves. A walkthrough in sixty seconds.
        </p>
      </Reveal>

      <Reveal delay={120}>
        <AutoVideo
          webm="/videos/brand.webm"
          mp4="https://9a9a9kybzrewury8.public.blob.vercel-storage.com/BudgieDemo"
          label="Budgie app walkthrough, sixty seconds, silent"
          glyphSize="w-16 h-16"
          posterClassName="bg-[#FAFAFA]"
          frameClassName="mt-10 aspect-[16/9] rounded-[35px] border border-black/[0.06] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)]"
        />
      </Reveal>
    </section>
  );
}