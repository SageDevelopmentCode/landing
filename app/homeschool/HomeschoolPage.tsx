"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Magnetic, Reveal, Runs, WordsReveal } from "@/app/_garden/motion";
import { CtaCard, Chips, DetailNotes, PhotoScatter, PillarCards } from "@/app/_garden/program";
import { Draw, Pill, Star, btnOutline, btnPop } from "@/app/_garden/ui";
import { DropInPricing } from "@/app/_home/sections/Tuition";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import {
  HS_CTA,
  HS_DESCRIPTION,
  HS_DETAILS,
  HS_FRIDAY,
  HS_GALLERY,
  HS_HERO,
  HS_PRICING,
  HS_PROGRAM,
  HS_SCHEDULE,
  HS_SUMMARY,
  HS_WHY,
} from "./content";

const MARK = "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]";
const TIER_NOTES = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];

/** The Homeschool Drop-In page, built with the Garden design system (app/_garden). */
export default function HomeschoolPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>🏡 {HS_HERO.badge}</>}
        tint="butter"
        before={HS_HERO.headingBefore}
        highlight={HS_HERO.headingHighlight}
        after={HS_HERO.headingAfter}
        body={HS_HERO.subtitle}
        photos={HS_HERO.photos}
      >
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <Magnetic>
            <Link href="/apply" className={btnPop}>
              {HS_HERO.apply}
            </Link>
          </Magnetic>
          <Link href="/tour" className={btnOutline}>
            {HS_HERO.tour}
          </Link>
        </div>
      </PageHero>

      {/* Summary + key details */}
      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="mx-auto max-w-4xl text-center text-xl leading-relaxed text-[var(--sf-soft)] md:text-2xl md:leading-relaxed">{HS_SUMMARY}</p>
          </Reveal>
          <DetailNotes details={HS_DETAILS} className="mt-16" />
        </div>
      </section>

      {/* Description + gallery */}
      <section className="bg-[var(--sf-sky)]/35 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <Reveal className="mx-auto max-w-4xl" y={50}>
            <div className="rounded-[36px] bg-white p-8 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-12">
              {HS_DESCRIPTION.map((runs, i) => (
                <p key={i} className={`text-lg leading-relaxed text-[var(--sf-soft)] ${i ? "mt-5" : ""}`}>
                  <Runs runs={runs} highlightClassName={MARK} />
                </p>
              ))}
            </div>
          </Reveal>
          <div className="mt-20">
            <PhotoScatter photos={HS_GALLERY.photos} alt={HS_GALLERY.alt} hint="psst — you can drag these around!" />
          </div>
        </div>
      </section>

      {/* Flexible scheduling */}
      <section className="py-24 lg:py-32">
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
                style={{ background: TIER_NOTES[i], rotate: `${[-2, 1.5, -1][i]}deg` }}
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

      {/* Field Day Fridays */}
      <section className="relative overflow-hidden bg-[var(--sf-butter)]/50 py-24 lg:py-32">
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

      {/* Why microschool */}
      <section className="py-24 lg:py-32">
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

      <Program />

      {/* Pricing */}
      <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <DropInPricing
            headingAs="h2"
            badge={HS_PRICING.badge}
            heading={HS_PRICING.heading}
            sub={HS_PRICING.sub}
            bands={HS_PRICING.bands}
            seasons={HS_PRICING.seasons}
          />
        </div>
      </section>

      <DropInCta />

      <LatestRecap />
    </GardenShell>
  );
}

function Program() {
  const { openWaitlist } = useDialogs();
  const p = HS_PROGRAM;
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sage">🎒 {p.badge}</Pill>
          <WordsReveal text={p.heading} className="sf-display mt-5 text-4xl md:text-6xl" />
          <Reveal>
            <p className="mt-5 text-lg leading-relaxed text-[var(--sf-soft)]">{p.body}</p>
          </Reveal>
        </div>
        <Reveal className="mt-16" y={60}>
          <article className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative mx-auto aspect-square w-[82%] max-w-[420px]">
              <div className="sf-blob absolute inset-0 overflow-hidden">
                <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 80vw, 420px" />
              </div>
              <Link
                href="/apply"
                className="absolute -right-2 top-4 flex h-28 w-28 rotate-12 flex-col items-center justify-center gap-1 rounded-full bg-[var(--sf-butter)] p-3 text-center text-xs font-extrabold leading-tight text-[var(--sf-ink)] shadow-lg transition-transform hover:rotate-0 hover:scale-105 focus-visible:rotate-0 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--sf-sage)]" aria-hidden="true" />
                {p.enrollmentOpen} →
              </Link>
            </div>
            <div className="text-center md:text-left">
              <h3 className="sf-display text-3xl md:text-4xl lg:text-5xl">
                {p.title.slice(0, p.title.lastIndexOf(" "))}{" "}
                <span className="whitespace-nowrap">{p.title.slice(p.title.lastIndexOf(" ") + 1)}</span>
              </h3>
              <p className="mt-4">
                <Pill tint="lav">📅 {p.dates}</Pill>
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {p.details.map((d) => (
                  <span key={d} className="rounded-full border-2 border-[var(--sf-ink)]/10 px-3 py-1 text-xs font-bold">
                    {d}
                  </span>
                ))}
              </div>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--sf-soft)] max-md:mx-auto">{p.description}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
                <Link href={p.href} className={btnOutline}>
                  {p.learnMore}
                </Link>
                <button onClick={openWaitlist} className={btnPop}>
                  {p.interest}
                </button>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

function DropInCta() {
  const { openContact } = useDialogs();
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <CtaCard heading={HS_CTA.heading} body={HS_CTA.body}>
          <Link href="/apply?tab=homeschool" className={btnPop}>
            {HS_CTA.apply}
          </Link>
          <button onClick={openContact} className={btnOutline}>
            {HS_CTA.contact}
          </button>
        </CtaCard>
      </div>
    </section>
  );
}
