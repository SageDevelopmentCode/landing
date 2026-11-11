"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Reveal, WordsReveal } from "@/app/_garden/motion";
import { LIVE_SUMMER_WEEKS, SCHOOL_YEAR_WEEKS } from "@/app/lib/highlights/weeks";
import WeekCards from "./_shared/WeekCards";
import { HIGHLIGHTS_HERO, HIGHLIGHT_GROUPS } from "./content";

const GROUPS = [
  { ...HIGHLIGHT_GROUPS.schoolYear, weeks: SCHOOL_YEAR_WEEKS, key: "school-year", emoji: "🍎", bg: "bg-white" },
  { ...HIGHLIGHT_GROUPS.summer, weeks: LIVE_SUMMER_WEEKS, key: "summer", emoji: "☀️", bg: "bg-[var(--sf-butter)]/35" },
];

/** The Highlights index, built with the Garden design system (app/_garden). */
export default function HighlightsPage() {
  const covers = SCHOOL_YEAR_WEEKS.filter((w) => w.coverImage).slice(0, 3).map((w) => w.coverImage!);
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>📸 {HIGHLIGHTS_HERO.badge}</>}
        tint="lav"
        highlight={HIGHLIGHTS_HERO.heading}
        body={HIGHLIGHTS_HERO.body}
        photos={covers}
        note="scroll back through the weeks ↓"
      />
      {GROUPS.map((g) => (
        <section key={g.key} className={`py-24 lg:py-28 ${g.bg}`}>
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
            <div className="mb-14">
              <span className="text-4xl" aria-hidden="true">
                {g.emoji}
              </span>
              <WordsReveal text={g.title} className="sf-display mt-2 text-4xl md:text-6xl" />
              <Reveal>
                <p className="mt-3 text-lg text-[var(--sf-soft)]">{g.sub}</p>
              </Reveal>
            </div>
            <WeekCards weeks={g.weeks} sectionKey={g.key} />
          </div>
        </section>
      ))}
    </GardenShell>
  );
}
