"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Magnetic, Reveal, Runs, WordsReveal } from "@/app/_garden/motion";
import { CtaCard, Chips, DetailNotes, PhotoScatter, PillarCards } from "@/app/_garden/program";
import { Draw, Leaf, Pill, btnOutline, btnPop } from "@/app/_garden/ui";
import Team from "@/app/_home/sections/Team";
import FullEnrollmentBlock from "@/app/tuition/FullEnrollmentBlock";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import { SY_CTA, SY_DESCRIPTION, SY_DETAILS, SY_GALLERY, SY_HERO, SY_HOMESCHOOL, SY_PHILOSOPHY, SY_PRICING, SY_SUMMARY } from "./content";

const MARK = "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]";
const MARK_MINT = "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-mint)_60%)]";

/** The School Year 2026–2027 page, built with the Garden design system (app/_garden). */
export default function SchoolYearPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero badge={<>🍎 {SY_HERO.badge}</>} tint="sage" before={SY_HERO.headingBefore} highlight={SY_HERO.headingHighlight} body={SY_HERO.subtitle} photos={SY_HERO.photos}>
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <Magnetic>
            <Link href="/apply" className={btnPop}>
              {SY_HERO.apply}
            </Link>
          </Magnetic>
          <Link href="/tour" className={btnOutline}>
            {SY_HERO.tour}
          </Link>
        </div>
      </PageHero>

      {/* Summary + key details */}
      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="mx-auto max-w-4xl text-center text-xl leading-relaxed text-[var(--sf-soft)] md:text-2xl md:leading-relaxed">{SY_SUMMARY}</p>
          </Reveal>
          <DetailNotes details={SY_DETAILS} className="mt-16" />
        </div>
      </section>

      {/* Description + gallery */}
      <section className="bg-[var(--sf-mint)]/45 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <Reveal className="mx-auto max-w-4xl" y={50}>
            <div className="relative rounded-[36px] bg-white p-8 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-12">
              <Draw className="absolute -right-5 -top-6 hidden w-16 md:block">
                <Leaf />
              </Draw>
              {SY_DESCRIPTION.map((p, i) => (
                <p key={i} className={`text-lg leading-relaxed text-[var(--sf-soft)] ${i ? "mt-5" : ""}`}>
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
          <div className="mt-20">
            <PhotoScatter photos={SY_GALLERY.photos} alt={SY_GALLERY.alt} hint="psst — you can drag these around!" />
          </div>
        </div>
      </section>

      {/* How we learn */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:items-center lg:px-16">
          <div>
            <Pill tint="sage">🌿 {SY_PHILOSOPHY.badge}</Pill>
            <WordsReveal text={SY_PHILOSOPHY.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
            <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{SY_PHILOSOPHY.subtitle}</p>
            <Reveal>
              <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">
                <Runs runs={SY_PHILOSOPHY.p1} highlightClassName={MARK} />
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[var(--sf-soft)]">
                <Runs runs={SY_PHILOSOPHY.p2} highlightClassName={MARK_MINT} />
              </p>
            </Reveal>
          </div>
          <PillarCards pillars={SY_PHILOSOPHY.pillars} />
        </div>
      </section>

      {/* Homeschool drop-in */}
      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <Reveal y={50}>
            <div className="relative overflow-hidden rounded-[40px] bg-[var(--sf-coral)]/15 p-8 text-center md:p-14">
              <Draw className="absolute -left-4 -bottom-6 w-28 opacity-50">
                <Leaf color="var(--sf-coral)" />
              </Draw>
              <Pill tint="coral">🏡 {SY_HOMESCHOOL.badge}</Pill>
              <h2 className="sf-display mt-5 text-4xl md:text-6xl">
                {SY_HOMESCHOOL.headingBefore} <span className="text-[var(--sf-coral-deep)]">{SY_HOMESCHOOL.headingHighlight}</span> {SY_HOMESCHOOL.headingAfter}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{SY_HOMESCHOOL.body}</p>
              <Chips items={SY_HOMESCHOOL.chips} className="mt-8" />
              <div className="mt-10">
                <Link href="/homeschool" className={btnPop}>
                  {SY_HOMESCHOOL.cta}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Team />

      {/* Pricing */}
      <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Pill tint="coral">💛 {SY_PRICING.badge}</Pill>
            <WordsReveal text={SY_PRICING.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          </div>
          <FullEnrollmentBlock />
        </div>
      </section>

      <Apply />

      <LatestRecap />
    </GardenShell>
  );
}

function Apply() {
  const { openWaitlist } = useDialogs();
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <CtaCard heading={SY_CTA.heading} body={SY_CTA.body}>
          <Link href="/apply/start" className={btnPop}>
            {SY_CTA.start}
          </Link>
          <button onClick={openWaitlist} className={btnOutline}>
            {SY_CTA.interest}
          </button>
        </CtaCard>
      </div>
    </section>
  );
}
