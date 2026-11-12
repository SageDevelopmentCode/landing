"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { CtaCard } from "@/app/_garden/program";
import { PHOTO_POOL } from "@/app/_home/content";
import { Magnetic, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Arrow, Draw, Leaf, Pill, Star, btnOutline, btnPop, type Tint } from "@/app/_garden/ui";
import {
  ACADEMIC_YEAR_LABEL,
  HOLIDAYS,
  KEY_DATES,
  parseIsoDate,
  type AcademicSeason,
} from "@/app/lib/academic-calendar-data";

/** Season → card wash, Pill tint and a decorative emoji. */
const SEASON: Record<AcademicSeason, { card: string; tint: Tint; emoji: string }> = {
  summer: { card: "bg-[var(--sf-butter)]/60", tint: "butter", emoji: "☀️" },
  fall: { card: "bg-[var(--sf-peach)]/70", tint: "coral", emoji: "🍂" },
  winter: { card: "bg-[var(--sf-sky)]/55", tint: "sky", emoji: "❄️" },
  spring: { card: "bg-[var(--sf-mint)]/60", tint: "sage", emoji: "🌷" },
};

const CARD_TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5, 1.2, -1.2];

/** The public Academic Calendar page, built with the Garden design system (app/_garden). */
export default function CalendarPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>📅 Academic Calendar</>}
        tint="sage"
        before={ACADEMIC_YEAR_LABEL}
        highlight="Student Calendar"
        body="Sage Field Private School · Round Rock, Texas"
        photos={[PHOTO_POOL[1], PHOTO_POOL[5], PHOTO_POOL[9]]}
      />
      <KeyDates />
      <Holidays />
      <Cta />
    </GardenShell>
  );
}

function KeyDates() {
  const days = [
    { ...KEY_DATES.firstDay, bg: "bg-[var(--sf-butter)]", tilt: -2 },
    { ...KEY_DATES.lastDay, bg: "bg-[var(--sf-mint)]", tilt: 2 },
  ];
  return (
    <section className="relative bg-[var(--sf-butter)]/40 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <WordsReveal text="Key School Year Dates" className="sf-display text-center text-5xl md:text-7xl" />

        <div className="relative mt-14">
          <Reveal className="grid gap-10 md:grid-cols-2 md:gap-16" stagger={0.15} y={60}>
            {days.map((d) => {
              const date = parseIsoDate(d.iso);
              return (
                <div key={d.iso}>
                  <DateTicket
                    label={d.label}
                    monthDay={d.monthDay}
                    year={d.year}
                    month={date.toLocaleString("en-US", { month: "short" })}
                    day={date.getDate()}
                    bg={d.bg}
                    tilt={d.tilt}
                  />
                </div>
              );
            })}
          </Reveal>
          <Draw className="pointer-events-none absolute left-1/2 top-1/2 hidden w-16 -translate-x-1/2 -translate-y-1/2 md:block" delay={0.6}>
            <Arrow />
          </Draw>
        </div>
      </div>
    </section>
  );
}

function DateTicket({
  label,
  monthDay,
  year,
  month,
  day,
  bg,
  tilt,
}: {
  label: string;
  monthDay: string;
  year: string;
  month: string;
  day: number;
  bg: string;
  tilt: number;
}) {
  return (
    <article
      className="mx-auto max-w-md transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:!rotate-0"
      style={{ rotate: `${tilt}deg` }}
    >
      <div className={`sf-ticket flex rounded-[24px] ${bg} shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)]`}>
        {/* Tear-off stub: a little calendar page, decorative (the real date is read out on the right). */}
        <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-white/45 py-8 pl-3 sm:w-36" aria-hidden="true">
          <span className="rounded-full bg-[var(--sf-coral)] px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-white">
            {month}
          </span>
          <span className="sf-display mt-1 text-6xl leading-none sm:text-7xl">{day}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center border-l-2 border-dashed border-[var(--sf-ink)]/25 py-8 pl-6 pr-8 sm:pl-8">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--sf-ink)]/60 sm:text-sm">{label}</p>
          <p className="sf-display mt-2 text-3xl leading-tight sm:text-4xl">
            {monthDay}
            <br />
            {year}
          </p>
        </div>
      </div>
    </article>
  );
}

function Holidays() {
  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      <Draw className="absolute right-[6%] top-20 hidden w-14 lg:block" delay={0.4}>
        <Leaf />
      </Draw>
      <Draw className="absolute left-[5%] top-28 hidden w-10 lg:block" delay={0.7}>
        <Star />
      </Draw>
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <WordsReveal text="Holiday & Break Schedule" className="sf-display text-5xl md:text-7xl" />
          <Reveal>
            <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">School is closed on the following dates.</p>
          </Reveal>
        </div>

        <Reveal as="ul" className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07} y={50}>
          {HOLIDAYS.map((h, i) => {
            const s = SEASON[h.season];
            return (
              <li key={h.name}>
                <article
                  className={`group relative flex h-full flex-col gap-4 rounded-[28px] p-6 pt-8 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:!rotate-0 ${s.card}`}
                  style={{ rotate: `${CARD_TILTS[i % CARD_TILTS.length]}deg` }}
                >
                  <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 rounded-sm bg-white/80" aria-hidden="true" />
                  <div>
                    <Pill tint={s.tint} className="text-xs uppercase tracking-wide">
                      <span aria-hidden="true">{s.emoji}</span>
                      {h.season}
                    </Pill>
                  </div>
                  <div>
                    <h3 className="sf-display text-2xl leading-tight">{h.name}</h3>
                    <p className="mt-1 font-bold text-[var(--sf-soft)]">{h.dates}</p>
                  </div>
                  <span className="mt-auto self-start rounded-full border-2 border-dashed border-[var(--sf-ink)]/20 bg-white/60 px-3 py-0.5 text-xs font-extrabold text-[var(--sf-soft)]">
                    {h.note}
                  </span>
                </article>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

function Cta() {
  const { openWaitlist, openContact } = useDialogs();
  return (
    <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <CtaCard heading="Ready to join us?" body={`Enrollment for School Year ${ACADEMIC_YEAR_LABEL} is now open.`}>
          <Magnetic>
            <button type="button" onClick={openWaitlist} className={btnPop}>
              Enroll Now
            </button>
          </Magnetic>
          <button type="button" onClick={openContact} className={btnOutline}>
            Contact Us
          </button>
        </CtaCard>
      </div>
    </section>
  );
}
