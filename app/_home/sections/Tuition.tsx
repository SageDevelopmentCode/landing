"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TUITION, type PriceOption } from "@/app/_home/content";
import { useDialogs } from "@/app/_garden/GardenShell";
import { CountUp, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Pill, btnOutline, btnPop, btnSage } from "@/app/_garden/ui";

const STICKERS = ["bg-[var(--sf-butter)]", "bg-[var(--sf-mint)]", "bg-[var(--sf-sky)]"];

/** The home page tuition section. Its parts are exported for program pages. */
export default function Tuition() {
  const { openWaitlist } = useDialogs();
  const { full, homeschool } = TUITION;

  return (
    <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tint="coral">💛 {TUITION.badge}</Pill>
          <WordsReveal text={TUITION.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mt-5 text-lg text-[var(--sf-soft)]">{TUITION.body}</p>
          </Reveal>
        </div>

        <FullEnrollment
          className="mt-14"
          actions={
            <>
              <button onClick={openWaitlist} className={btnOutline}>
                {full.interested}
              </button>
              <Link href="/apply" className={btnPop}>
                {full.enroll}
              </Link>
            </>
          }
        />

        <Packages className="mt-8" />

        <DropInPricing
          className="mt-16"
          badge={homeschool.badge}
          heading={homeschool.heading}
          sub={homeschool.sub}
          bands={homeschool.bands}
          seasons={[{ label: "School Year", options: homeschool.options }]}
          actions={
            <>
              <Link href="/apply" className={btnPop}>
                {homeschool.getStarted}
              </Link>
              <Link href="/homeschool" className={btnSage}>
                {homeschool.learnMore}
              </Link>
            </>
          }
        />
      </div>
    </section>
  );
}

// ─── Full enrollment: photo + sticker prices ─────────────────────────────────

export function FullEnrollment({
  data = TUITION.full,
  actions,
  footnote,
  headingAs: H = "h3",
  className = "",
}: {
  data?: typeof TUITION.full;
  /** Heading level for the title (h2 when there is no section heading above). */
  headingAs?: "h2" | "h3";
  /** Buttons under the fees line; each page wires its own. */
  actions: ReactNode;
  /** Small print under the buttons. */
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={className} y={60}>
      <article className="relative grid overflow-hidden rounded-[36px] bg-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] lg:grid-cols-2">
        <div className="relative min-h-[300px]">
          <Image src={data.image} alt={data.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="p-8 md:p-12">
          <Pill tint="sage">🗓️ {data.schedule}</Pill>
          <H className="sf-display mt-4 text-4xl md:text-5xl">{data.title}</H>
          <div className="mt-8 flex flex-wrap gap-6">
            {data.tiers.map((t, i) => (
              <div key={t.label} className={`flex h-44 w-44 flex-col items-center justify-center rounded-full text-center shadow-[0_10px_0_0_rgba(43,42,38,0.08)] ${STICKERS[i]}`} style={{ rotate: `${i ? 6 : -6}deg` }}>
                <p className="text-xs font-extrabold uppercase tracking-wide">{t.label}</p>
                <p className="sf-display text-4xl">
                  <CountUp value={t.price} prefix="$" />
                </p>
                <p className="text-xs font-bold">
                  {t.unit} · {t.note}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--sf-soft)]">
            <strong className="text-[var(--sf-ink)]">{data.feesLabel}</strong> {data.fees}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">{actions}</div>
          {footnote && <p className="mt-5 text-sm italic text-[var(--sf-soft)]">{footnote}</p>}
        </div>
      </article>
    </Reveal>
  );
}

// ─── Extended Learning + Field Day Friday packages ───────────────────────────

type Package = { title: string; image: string; time: string; options: PriceOption[] };

export function Packages({
  packages = [TUITION.aftercare, TUITION.fieldDay],
  className = "",
}: {
  packages?: Package[];
  className?: string;
}) {
  return (
    <Reveal className={`grid gap-8 md:grid-cols-2 ${className}`} stagger={0.12}>
      {packages.map((pkg, k) => (
        <article key={pkg.title} className="overflow-hidden rounded-[32px] bg-white shadow-[0_24px_50px_-35px_rgba(43,42,38,0.55)]">
          <div className="relative h-52">
            <Image src={pkg.image} alt={pkg.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <span className="absolute left-5 top-5">
              <Pill tint={k ? "butter" : "sky"}>⏰ {pkg.time}</Pill>
            </span>
          </div>
          <div className="p-7">
            <h3 className="sf-display text-3xl">{pkg.title}</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {pkg.options.map((o) => (
                <div key={o.label} className="rounded-2xl border-2 border-dashed border-[var(--sf-ink)]/15 p-4">
                  <p className="font-extrabold">{o.label}</p>
                  <p className="sf-display text-3xl">
                    <CountUp value={o.price} prefix="$" />
                    <span className="text-base text-[var(--sf-soft)]">{o.unit}</span>
                  </p>
                  {o.note && <p className="text-xs text-[var(--sf-soft)]">{o.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </Reveal>
  );
}

// ─── Homeschool drop-in: dark panel with grade-band (and season) toggles ─────

export type DropInOption = {
  title: string;
  /** Small label under the title, e.g. "Part-Time". */
  kind?: string;
  note?: string;
  /** Prices per grade band, in the same order as `bands`. */
  prices: [number, number];
  /** Defaults to "/mo". */
  unit?: string;
};
export type DropInSeason = { label: string; options: DropInOption[] };

const DAY_WORDS = ["one day", "two days", "three days"];

export function DropInPricing({
  badge,
  heading,
  sub,
  bands,
  seasons,
  actions,
  headingAs: H = "h3",
  className = "",
}: {
  headingAs?: "h2" | "h3";
  badge: string;
  heading: string;
  sub: string;
  bands: readonly [string, string];
  /** One season shows no season toggle. */
  seasons: DropInSeason[];
  actions?: ReactNode;
  className?: string;
}) {
  const [band, setBand] = useState(0);
  const [season, setSeason] = useState(0);
  const options = seasons[season].options;
  const Sub = H === "h2" ? "h3" : "h4";

  return (
    <Reveal className={className} y={50}>
      <div className="rounded-[36px] bg-[var(--sf-ink)] p-8 md:p-12 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Pill tint="butter">🏡 {badge}</Pill>
            <H className="sf-display mt-4 text-4xl md:text-5xl">{heading}</H>
            <p className="mt-1 text-white/70">{sub}</p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            {seasons.length > 1 && (
              <Toggle label="Program" items={seasons.map((s) => s.label)} active={season} onChange={setSeason} layoutId="sf-season" pill="bg-[var(--sf-coral)]" activeText="text-white" />
            )}
            <Toggle label="Grade band" items={bands} active={band} onChange={setBand} layoutId="sf-band" pill="bg-[var(--sf-butter)]" activeText="text-[var(--sf-ink)]" />
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {options.map((o, i) => (
            <div key={i} className="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10">
              <span className="sf-hand text-lg text-[var(--sf-butter)]" aria-hidden="true">
                {DAY_WORDS[i]}
              </span>
              <Sub className="sf-display mt-1 text-2xl">{o.title}</Sub>
              {o.kind && <p className="text-xs font-bold uppercase tracking-wide text-white/50">{o.kind}</p>}
              {o.note && <p className="mt-1 text-sm text-white/60">{o.note}</p>}
              <div className="mt-5 h-14 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={`${season}-${band}`}
                    initial={{ y: 40, opacity: 0, rotate: -6 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="sf-display text-5xl"
                  >
                    ${o.prices[band]}
                    <span className="text-lg text-white/50">{o.unit ?? "/mo"}</span>
                  </motion.p>
                </AnimatePresence>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">{bands[band]}</p>
            </div>
          ))}
        </div>
        {actions && <div className="mt-10 flex flex-wrap gap-4">{actions}</div>}
      </div>
    </Reveal>
  );
}

function Toggle({
  label,
  items,
  active,
  onChange,
  layoutId,
  pill,
  activeText,
}: {
  label: string;
  items: readonly string[];
  active: number;
  onChange: (i: number) => void;
  layoutId: string;
  pill: string;
  activeText: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap rounded-full bg-white/10 p-1.5">
      {items.map((b, i) => (
        <button
          key={b}
          role="tab"
          aria-selected={active === i}
          onClick={() => onChange(i)}
          className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-extrabold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${active === i ? activeText : "text-white/70 hover:text-white"}`}
        >
          {active === i && <motion.span layoutId={layoutId} className={`absolute inset-0 -z-10 rounded-full ${pill}`} transition={{ type: "spring", bounce: 0.35, duration: 0.6 }} />}
          {b}
        </button>
      ))}
    </div>
  );
}
