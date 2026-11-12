"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import FaqSection from "@/app/_garden/FaqSection";
import { Magnetic, Marquee, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Arrow, Draw, Leaf, Pill, Squiggle, Star, Sun, btnPop } from "@/app/_garden/ui";
import { Philosophy } from "@/app/_home/sections/Story";
import Team from "@/app/_home/sections/Team";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import {
  BENTO_ALT,
  BENTO_IMAGES,
  CLOSING,
  COMPARISON,
  GALLERY_ALT,
  GALLERY_IMAGES,
  HERO,
  PATHS,
  PLACE,
  SCHOOL_FAQS,
  SCHOOL_FAQ_HEADER,
  VISIT_FAQS,
  VISIT_FAQ_HEADER,
} from "./content";

const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)"];
const BENTO_TILTS = [-1.5, 2.5, -3, 2];

/** The Visit page, built with the Garden design system (app/_garden). */
export default function VisitPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <VisitBody />
    </GardenShell>
  );
}

function VisitBody() {
  const { openContact } = useDialogs();
  return (
    <>
      <ChoosePath />
      <Comparison />
      <Place />
      <FaqSection
        badge={<>🧭 {VISIT_FAQ_HEADER.badge}</>}
        tint="sage"
        heading={VISIT_FAQ_HEADER.heading}
        items={VISIT_FAQS}
        idPrefix="visit-faq"
        defaultOpenIndex={0}
        className="bg-white"
      />
      <Philosophy />
      <Team />
      <FaqSection
        badge={<>❓ {SCHOOL_FAQ_HEADER.badge}</>}
        tint="sky"
        heading={SCHOOL_FAQ_HEADER.heading}
        sub={SCHOOL_FAQ_HEADER.sub}
        items={SCHOOL_FAQS}
        idPrefix="school-faq"
        className="bg-[var(--sf-sky)]/35"
      />
      <LatestRecap className="bg-white" />
      <Closing onContact={openContact} />
    </>
  );
}

// ─── Hero + the two paths ────────────────────────────────────────────────────

function ChoosePath() {
  const { tour, shadow } = PATHS;
  return (
    <section id="choose-path" className="relative scroll-mt-24 overflow-hidden pt-28 pb-24 sm:scroll-mt-40 sm:pt-40 lg:pt-44 lg:pb-32">
      <Draw className="absolute left-[7%] top-[16%] hidden w-20 lg:block" delay={0.5}>
        <Sun />
      </Draw>
      <Draw className="absolute right-[8%] top-[22%] hidden w-14 lg:block" delay={0.8}>
        <Leaf />
      </Draw>

      <div className="relative mx-auto max-w-5xl px-6 text-center sm:px-10">
        <Reveal stagger={0.1}>
          <h1 className="sf-display text-5xl leading-[0.95] sm:text-6xl lg:text-[5.6rem] lg:leading-[0.92]">
            {HERO.before}{" "}
            <span className="relative isolate inline-block text-[var(--sf-coral)]">
              <Draw className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full" delay={0.4}>
                <Squiggle className="w-full" color="var(--sf-butter)" />
              </Draw>
              <span className="relative z-10">{HERO.highlight}</span>
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)] md:text-xl">{HERO.body}</p>
        </Reveal>
      </div>

      {/* Phones: the week-11 photos as a row */}
      <div className="mt-12 -rotate-2 sm:hidden" aria-hidden="true">
        <Marquee duration={50} trackClassName="py-4">
          {GALLERY_IMAGES.map((src, i) => (
            <div key={src} className="sf-polaroid relative mx-2.5 w-44 shrink-0" style={{ rotate: `${i % 2 ? 2 : -2}deg` }}>
              <div className="relative aspect-square overflow-hidden rounded-[3px]">
                <Image src={src} alt={GALLERY_ALT} fill className="object-cover" sizes="176px" preload={i === 0} />
              </div>
            </div>
          ))}
        </Marquee>
      </div>

      <div className="relative mx-auto mt-14 grid max-w-6xl gap-10 px-6 sm:px-10 md:grid-cols-2 lg:mt-20 lg:gap-12 lg:px-16">
        {/* Tour postcard */}
        <Reveal y={60}>
          <Link
            href={tour.href}
            className="group relative block h-full -rotate-1 rounded-[28px] bg-white p-5 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-0 focus-visible:rotate-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sage)]/40"
          >
            <div className="relative h-60 overflow-hidden rounded-[18px] sm:h-64">
              <Image
                src={tour.image}
                alt={tour.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                preload
              />
              <span
                className="absolute right-4 top-4 flex h-16 w-14 rotate-6 items-center justify-center rounded-md border-2 border-dashed border-white/80 bg-[var(--sf-sky)] text-2xl"
                aria-hidden="true"
              >
                🗺️
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 p-4 pt-6">
              <div>
                <h2 className="sf-display text-3xl md:text-4xl">{tour.title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-[var(--sf-soft)]">{tour.body}</p>
              </div>
              <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white shadow-[0_4px_0_0_var(--sf-sage-deep)] transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </Reveal>

        {/* Shadow Day ticket */}
        <Reveal y={60} delay={0.1}>
          <Link
            href={shadow.href}
            className="group relative block h-full rotate-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-0 focus-visible:rotate-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 rounded-[28px]"
          >
            <div className="sf-ticket h-full overflow-hidden rounded-[28px] bg-[var(--sf-coral)] text-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)]">
              <div className="relative h-60 sm:h-64">
                <Image
                  src={shadow.image}
                  alt={shadow.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  preload
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-coral)] to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-lg" aria-hidden="true">
                  🎟️
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-t-2 border-dashed border-white/50 p-8">
                <div>
                  <h2 className="sf-display text-3xl md:text-4xl">{shadow.title}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-white/90">{shadow.body}</p>
                </div>
                <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-coral-deep)] shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Tour vs. Shadow Day ─────────────────────────────────────────────────────

function Comparison() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--sf-mint)]/45">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        <div className="text-center">
          <Pill tint="sage">🤔 {COMPARISON.badge}</Pill>
          <WordsReveal text={COMPARISON.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
        </div>

        <Reveal y={50} className="mt-14">
          <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)]">
            <div className="hidden grid-cols-3 gap-3 p-4 sm:grid">
              <div />
              <div className="rounded-2xl bg-[var(--sf-sky)] py-3 text-center text-sm font-extrabold uppercase tracking-wide text-[#2d5d86]">
                {COMPARISON.tourHeader}
              </div>
              <div className="rounded-2xl bg-[var(--sf-coral)]/25 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-[var(--sf-coral-deep)]">
                {COMPARISON.shadowHeader}
              </div>
            </div>
            {COMPARISON.rows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-1 gap-3 p-6 sm:grid-cols-3 sm:gap-3 sm:px-4 sm:py-6 ${
                  i < COMPARISON.rows.length - 1 ? "border-b-2 border-dashed border-[var(--sf-ink)]/10" : ""
                }`}
              >
                <p className="sf-display text-xl sm:pl-4">{row.label}</p>
                <p className="border-l-4 border-[var(--sf-sky)] pl-4 leading-relaxed text-[var(--sf-soft)] sm:border-0 sm:pl-0 sm:text-center">
                  <span className="font-extrabold text-[#2d5d86] sm:hidden">{COMPARISON.tourPrefix} </span>
                  {row.tour}
                </p>
                <p className="border-l-4 border-[var(--sf-coral)]/50 pl-4 leading-relaxed text-[var(--sf-soft)] sm:border-0 sm:pl-0 sm:text-center">
                  <span className="font-extrabold text-[var(--sf-coral-deep)] sm:hidden">{COMPARISON.shadowPrefix} </span>
                  {row.shadow}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── A place worth seeing ────────────────────────────────────────────────────

function Place() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16">
        <div>
          <Pill tint="butter">📍 {PLACE.badge}</Pill>
          <WordsReveal text={PLACE.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
          <Reveal className="mt-7 space-y-5" stagger={0.12}>
            {PLACE.body.map((p) => (
              <p key={p.slice(0, 24)} className="text-lg leading-relaxed text-[var(--sf-soft)]">
                {p}
              </p>
            ))}
          </Reveal>
        </div>

        <Reveal className="grid w-full grid-cols-3 gap-4 sm:gap-6 lg:sticky lg:top-32 lg:max-w-[560px] lg:justify-self-end" stagger={0.1} y={50}>
          {BENTO_IMAGES.map((src, i) => (
            <div key={src} className={i === 0 ? "col-span-3" : ""}>
              <div
                className="sf-polaroid relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:!rotate-0"
                style={{ rotate: `${BENTO_TILTS[i]}deg` }}
              >
                <span
                  className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90"
                  style={{ background: TAPE[i] }}
                  aria-hidden="true"
                />
                <div className={`relative overflow-hidden rounded-[3px] ${i === 0 ? "aspect-[2/1]" : "aspect-square"}`}>
                  <Image src={src} alt={BENTO_ALT} fill className="object-cover" sizes={i === 0 ? "(max-width: 1024px) 100vw, 560px" : "(max-width: 1024px) 33vw, 180px"} />
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── Closing CTA ─────────────────────────────────────────────────────────────

function Closing({ onContact }: { onContact: () => void }) {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        <Reveal y={50}>
          <div className="relative overflow-hidden rounded-[44px] bg-[var(--sf-ink)] px-8 py-16 text-center text-[var(--sf-cream)] md:px-14">
            <div className="sf-spin-slow absolute -right-16 -top-16 h-56 w-56 rounded-full border-[18px] border-dashed border-white/10" aria-hidden="true" />
            <Draw className="absolute bottom-8 left-8 hidden w-12 md:block" delay={0.3}>
              <Star color="var(--sf-butter)" />
            </Draw>
            <p className="sf-hand text-2xl text-[var(--sf-butter)]">{CLOSING.eyebrow}</p>
            <h2 className="sf-display mx-auto mt-3 max-w-2xl text-4xl md:text-6xl">{CLOSING.heading}</h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={PATHS.tour.href}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-extrabold text-[var(--sf-ink)] shadow-[0_6px_0_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:w-auto"
              >
                {CLOSING.tourCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Magnetic>
                <Link href={PATHS.shadow.href} className={`${btnPop} w-full sm:w-auto`}>
                  {CLOSING.shadowCta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>
            <p className="mt-9 flex items-center justify-center gap-2 text-[var(--sf-cream)]/70">
              <Draw className="hidden w-10 -scale-x-100 rotate-12 sm:block">
                <Arrow color="var(--sf-cream)" />
              </Draw>
              {CLOSING.questions}{" "}
              <button
                type="button"
                onClick={onContact}
                className="cursor-pointer font-extrabold text-[var(--sf-cream)] underline decoration-[var(--sf-coral)] decoration-2 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 rounded"
              >
                {CLOSING.message}
              </button>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
