"use client";

import { Reveal, WordsReveal } from "@/app/_garden/motion";
import { Chips, PillarCards } from "@/app/_garden/program";
import { Draw, Pill, Star } from "@/app/_garden/ui";
import { HS_FRIDAY, HS_SCHEDULE, HS_WHY } from "./content";

/**
 * Homeschool Drop-In sections shared by /homeschool and the apply page's
 * Homeschool tab. `className` sets the section background.
 */

const TIER_NOTES = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];

/** Flexible scheduling: the 1x / 2x / 3x tiers as sticky notes. */
export function ScheduleTiers({ className = "" }: { className?: string }) {
  return (
    <section className={`py-24 lg:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sage">🗓️ {HS_SCHEDULE.badge}</Pill>
          <WordsReveal text={HS_SCHEDULE.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{HS_SCHEDULE.subtitle}</p>
        </div>
        <Reveal className="mt-14 grid gap-8 sm:grid-cols-3" stagger={0.12} y={50}>
          {HS_SCHEDULE.tiers.map((t, i) => (
            <div
              key={t.title}
              className="sf-wiggle relative rounded-md p-7 pt-9 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]"
              style={{ background: TIER_NOTES[i % TIER_NOTES.length], rotate: `${[-2, 1.5, -1][i % 3]}deg` }}
            >
              <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
              <p className="sf-hand text-2xl text-[var(--sf-coral-deep)]">{t.days}</p>
              <h3 className="sf-display mt-2 text-3xl">{t.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--sf-ink)]/75">{t.description}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/** Field Day Fridays: heading, body and theme chips. */
export function FieldDayFridays({ className = "bg-[var(--sf-butter)]/50" }: { className?: string }) {
  return (
    <section className={`relative overflow-hidden py-24 lg:py-32 ${className}`}>
      <Draw className="absolute right-[8%] top-[18%] hidden w-12 lg:block">
        <Star />
      </Draw>
      <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">
        <Pill tint="coral">🎉 {HS_FRIDAY.badge}</Pill>
        <h2 className="sf-display mt-5 text-5xl md:text-7xl">
          <span className="text-[var(--sf-coral-deep)]">{HS_FRIDAY.headingHighlight}</span> {HS_FRIDAY.headingAfter}
        </h2>
        <Reveal>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{HS_FRIDAY.body}</p>
        </Reveal>
        <Chips items={HS_FRIDAY.chips} className="mt-10" />
      </div>
    </section>
  );
}

/** Why microschool for homeschoolers: copy beside the four pillar cards. */
export function WhyMicroschool({ className = "" }: { className?: string }) {
  return (
    <section className={`py-24 lg:py-32 ${className}`}>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:items-center lg:px-16">
        <div>
          <Pill tint="lav">🌟 {HS_WHY.badge}</Pill>
          <WordsReveal text={HS_WHY.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{HS_WHY.subtitle}</p>
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">{HS_WHY.body}</p>
          </Reveal>
        </div>
        <PillarCards pillars={HS_WHY.pillars} />
      </div>
    </section>
  );
}
