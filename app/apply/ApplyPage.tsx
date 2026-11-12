"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import EnrollForm from "@/app/_garden/EnrollForm";
import FaqList from "@/app/_garden/FaqList";
import { Magnetic, Reveal, Runs, WordsReveal } from "@/app/_garden/motion";
import { DetailNotes, PhotoScatter, WeekSchedule } from "@/app/_garden/program";
import { Draw, Leaf, Pill, Star, Sun, btnOutline, btnPop, fieldInput, fieldLabel } from "@/app/_garden/ui";
import Team from "@/app/_home/sections/Team";
import { OFFER } from "@/app/_home/content";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import { SY_PHILOSOPHY } from "@/app/school-year-2026-2027/content";
import { FieldDayFridays, ScheduleTiers, WhyMicroschool } from "@/app/homeschool/sections";
import {
  APPLY_CTA,
  APPLY_HERO,
  APPLY_TABS,
  FAQ_COPY,
  FLOATING_BAR,
  KEY_PILLARS,
  MOBILE_APPLY,
  PROGRAMS,
  QUESTIONS,
  READ_MORE,
  buildApplyFaqs,
  type ApplyTab,
} from "./content";

const MARK = "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]";
const MARK_MINT = "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-mint)_60%)]";
const PANEL_ID = "apply-program-panel";
const FORM_ID = "apply-form";

async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors });
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.6 }, colors }), 250);
}

/** The apply / enrollment page, built with the Garden design system (app/_garden). */
export default function ApplyPage({ initialTab, refCode }: { initialTab: ApplyTab; refCode?: string }) {
  const [activeTab, setActiveTab] = useState<ApplyTab>(initialTab);
  const applyStartUrl = refCode ? `/apply/start?ref=${encodeURIComponent(refCode)}` : "/apply/start";

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false} smsDesktopOnly>
      <PageHero
        badge={<>📝 {APPLY_HERO.badge}</>}
        tint="coral"
        before={APPLY_HERO.headingBefore}
        highlight={APPLY_HERO.headingHighlight}
        photos={PROGRAMS[activeTab].images.slice(0, 3)}
        note="pick a program below 🌱"
      />

      <ProgramIntro activeTab={activeTab} onTabChange={setActiveTab} applyStartUrl={applyStartUrl} />

      {/* Gallery */}
      <section className="bg-[var(--sf-mint)]/45 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <PhotoScatter photos={PROGRAMS[activeTab].images} alt="Program photo" hint="psst — you can drag these around!" featureFirst={false} />
        </div>
      </section>

      {/* Tab-specific sections; keyed so their reveals replay on switch. */}
      {activeTab === "school-year" ? (
        <div key="school-year">
          <HowWeLearn />
          <WhatWeOffer />
          <Team />
        </div>
      ) : (
        <div key="homeschool">
          <ScheduleTiers />
          <FieldDayFridays />
          <WhyMicroschool className="bg-white" />
          <Team />
        </div>
      )}

      <MobileApply applyStartUrl={applyStartUrl} />

      <LatestRecap />

      <Faq />

      <Questions />

      <FloatingBar />
    </GardenShell>
  );
}

// ─── Program intro: tabs, description, key facts + sticky CTA card ──────────

function ProgramIntro({
  activeTab,
  onTabChange,
  applyStartUrl,
}: {
  activeTab: ApplyTab;
  onTabChange: (tab: ApplyTab) => void;
  applyStartUrl: string;
}) {
  const { openWaitlist } = useDialogs();
  const [descExpanded, setDescExpanded] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const program = PROGRAMS[activeTab];

  const selectTab = (tab: ApplyTab) => {
    onTabChange(tab);
    setDescExpanded(false);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + APPLY_TABS.length) % APPLY_TABS.length;
    selectTab(APPLY_TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-start gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:px-16">
        <div className="min-w-0 lg:col-span-7">
          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Programs"
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-full gap-1 sm:inline-flex sm:w-auto rounded-full bg-[var(--sf-cream)] p-1.5 ring-2 ring-[var(--sf-ink)]/10">
              {APPLY_TABS.map((tab, i) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    id={`apply-tab-${tab.id}`}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    aria-controls={PANEL_ID}
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectTab(tab.id)}
                    onKeyDown={(e) => onTabKey(e, i)}
                    className={`relative flex-1 cursor-pointer whitespace-nowrap rounded-full px-3 py-2.5 text-[13px] font-extrabold sm:flex-none transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 sm:px-6 sm:py-3 sm:text-base ${
                      active ? "text-white" : "text-[var(--sf-soft)] hover:text-[var(--sf-ink)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sf-apply-tab"
                        className="absolute inset-0 rounded-full bg-[var(--sf-coral)] shadow-[0_4px_0_0_var(--sf-coral-deep)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">
                      <span aria-hidden="true" className="hidden sm:inline">
                        {tab.emoji}{" "}
                      </span>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div id={PANEL_ID} role="tabpanel" aria-labelledby={`apply-tab-${activeTab}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30, rotate: -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -16, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
              >
                <h2 className="sf-display mt-10 text-4xl leading-[0.95] md:text-6xl">{program.title}</h2>
                <div className="mt-7 space-y-4">
                  {program.description.map((para, i) => (
                    <p
                      key={i}
                      className={`text-lg leading-relaxed text-[var(--sf-soft)] ${i > 0 ? (descExpanded ? "block" : "hidden sm:block") : ""}`}
                    >
                      {para}
                    </p>
                  ))}
                  {program.description.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded(!descExpanded)}
                      aria-expanded={descExpanded}
                      className="sf-hand cursor-pointer text-xl text-[var(--sf-coral-deep)] hover:underline focus-visible:underline focus-visible:outline-none sm:hidden"
                    >
                      {descExpanded ? READ_MORE.less : READ_MORE.more}
                    </button>
                  )}
                </div>
                <DetailNotes details={program.details} className="mt-12" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky CTA card — desktop only (phones get the inline form further down) */}
        <aside className="hidden lg:sticky lg:top-28 lg:col-span-5 lg:block">
          <div className="relative rounded-[36px] bg-[var(--sf-butter)]/50 p-8 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] xl:p-10">
            <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
            <Draw className="absolute -right-6 -top-8 w-20" delay={0.3}>
              <Sun />
            </Draw>
            <h2 className="sf-display text-4xl">{APPLY_CTA.heading}</h2>
            <p className="mt-3 text-lg leading-relaxed text-[var(--sf-soft)]">{APPLY_CTA.body}</p>
            <div className="mt-8 flex flex-col gap-4">
              <Magnetic>
                <Link href={applyStartUrl} className={`${btnPop} w-full`}>
                  {APPLY_CTA.start}
                </Link>
              </Magnetic>
              <Link href="/tour" className={`${btnOutline} w-full`}>
                {APPLY_CTA.tour}
              </Link>
              <button
                type="button"
                onClick={openWaitlist}
                className="cursor-pointer rounded-full py-2 font-extrabold text-[var(--sf-soft)] transition-colors hover:text-[var(--sf-coral-deep)] focus-visible:text-[var(--sf-coral-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30"
              >
                {APPLY_CTA.questions}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─── School Year: How We Learn ───────────────────────────────────────────────

const CARD_TILTS = [-2, 1.5, 1, -1.5];
const CARD_TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)"];

function HowWeLearn() {
  return (
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

          {/* Key pillars sticky note */}
          <Reveal className="mt-10" y={40}>
            <div className="relative rounded-md bg-[var(--sf-butter)] p-7 pt-9 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)] sm:mr-10" style={{ rotate: "-1.5deg" }}>
              <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
              <h3 className="sf-display text-2xl">{KEY_PILLARS.title}</h3>
              <ul className="mt-4 space-y-3">
                {KEY_PILLARS.items.map((item, i) => (
                  <li key={item} className="flex items-start gap-3 font-bold leading-snug">
                    <Draw className="mt-0.5 inline-block w-5 shrink-0" delay={0.2 + i * 0.15} duration={0.6}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5">
                        <path data-draw d="M4 13 L10 18 L20 6" stroke="var(--sf-sage-deep)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Draw>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Photo pillars: snap rail on phones, 2×2 polaroids from sm */}
        <Reveal
          className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 pt-4 [scroll-padding-inline:1.5rem] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-7 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          stagger={0.1}
          y={50}
        >
          {KEY_PILLARS.cards.map((card, i) => (
            <div key={card.title} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <article
                className="sf-polaroid relative h-full transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:!rotate-0"
                style={{ rotate: `${CARD_TILTS[i % CARD_TILTS.length]}deg` }}
              >
                <span
                  className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90"
                  style={{ background: CARD_TAPE[i % CARD_TAPE.length] }}
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                  <Image src={card.image} alt={card.title} fill className="object-cover" sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 300px" />
                </div>
                <div className="px-2 pb-2 pt-4">
                  <h3 className="sf-display text-xl">{card.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--sf-soft)]">{card.description}</p>
                </div>
              </article>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── School Year: What We Offer + weekly schedule ────────────────────────────

function WhatWeOffer() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:items-center lg:px-16">
        <div>
          <Pill tint="butter">☀️ {OFFER.badge}</Pill>
          <WordsReveal text={OFFER.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{OFFER.subtitle}</p>
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">
              <Runs runs={OFFER.p1} highlightClassName={MARK} />
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--sf-soft)]">
              <Runs runs={OFFER.p2} highlightClassName={MARK_MINT} />
            </p>
          </Reveal>
        </div>
        <WeekSchedule schedule={OFFER.schedule} />
      </div>
    </section>
  );
}

// ─── Phones: inline interest form + direct application ──────────────────────

function MobileApply({ applyStartUrl }: { applyStartUrl: string }) {
  return (
    <section id={FORM_ID} className="relative scroll-mt-24 overflow-hidden bg-[var(--sf-butter)]/50 py-20 lg:hidden">
      <div className="mx-auto max-w-2xl px-6 sm:px-10">
        <Reveal y={50}>
          <div className="sf-paper relative rounded-[28px] p-6 shadow-[0_30px_60px_-30px_rgba(43,42,38,0.5)] ring-1 ring-black/5 sm:p-10">
            <span className="absolute -top-4 left-10 h-8 w-28 -rotate-3 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />
            <h2 className="sf-display text-4xl">{MOBILE_APPLY.formHeading}</h2>
            <p className="mt-2 mb-7 text-[var(--sf-soft)]">{MOBILE_APPLY.formBody}</p>
            <EnrollForm
              onSuccess={celebrate}
              theme={{
                label: fieldLabel,
                input: fieldInput,
                button: `${btnPop} w-full disabled:opacity-60`,
                success: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)] font-bold",
                error: "bg-red-100 text-red-800 font-bold",
                required: "text-[var(--sf-coral-deep)]",
              }}
            />
          </div>
        </Reveal>

        <Reveal className="mt-12" y={40}>
          <div className="relative overflow-hidden rounded-[32px] bg-[var(--sf-coral)]/15 p-7 text-center">
            <Draw className="absolute -bottom-5 -left-4 w-24 opacity-50">
              <Leaf color="var(--sf-coral)" />
            </Draw>
            <h2 className="sf-display text-3xl">{MOBILE_APPLY.enrollHeading}</h2>
            <p className="mx-auto mt-3 max-w-sm text-[var(--sf-soft)]">{MOBILE_APPLY.enrollBody}</p>
            <div className="relative mt-7 flex flex-col gap-4">
              <Link href={applyStartUrl} className={`${btnPop} w-full`}>
                {MOBILE_APPLY.start}
              </Link>
              <Link href="/tour" className={`${btnOutline} w-full`}>
                {MOBILE_APPLY.tour}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function Faq() {
  const { openWaitlist } = useDialogs();
  const groups = buildApplyFaqs(() => (
    <button type="button" onClick={openWaitlist} className={btnPop}>
      Enroll Now
    </button>
  ));
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="mb-14 text-center">
          <Pill tint="sky">❓ {FAQ_COPY.badge}</Pill>
          <WordsReveal text={FAQ_COPY.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
        </div>
        <FaqList
          groups={groups}
          query=""
          idPrefix="apply-faq"
          theme={{
            group: "rounded-[32px] bg-white p-6 md:p-8 shadow-[0_20px_50px_-35px_rgba(43,42,38,0.5)]",
            groupTitle: "sf-display text-2xl md:text-3xl mb-1",
            item: "border-b-2 border-dashed border-[var(--sf-ink)]/10 last:border-0",
            question: "text-lg md:text-xl font-extrabold leading-snug",
            answer: "text-lg leading-relaxed text-[var(--sf-soft)]",
            icon: "bg-[var(--sf-butter)] text-[var(--sf-ink)]",
            empty: "py-12 text-center text-lg font-bold text-[var(--sf-soft)]",
          }}
        />
      </div>
    </section>
  );
}

// ─── Have any questions? ─────────────────────────────────────────────────────

function Questions() {
  const { openContact, openWaitlist } = useDialogs();
  return (
    <section className="relative overflow-hidden bg-[var(--sf-sky)]/35 py-24 pb-36 lg:py-32">
      <Draw className="absolute left-[10%] top-16 hidden w-12 lg:block">
        <Star color="var(--sf-sage)" />
      </Draw>
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <Reveal y={50}>
          <div className="relative rounded-[40px] bg-white p-8 text-center shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-14">
            <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
            <Draw className="absolute -right-6 -top-8 hidden w-20 md:block" delay={0.3}>
              <Sun />
            </Draw>
            <Pill tint="sky">💬 {QUESTIONS.badge}</Pill>
            <h2 className="sf-display mt-5 text-4xl md:text-5xl">{QUESTIONS.heading}</h2>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-[var(--sf-soft)]">{QUESTIONS.body}</p>
            <a
              href={`mailto:${QUESTIONS.email}`}
              className="mt-5 inline-block break-all font-extrabold text-[var(--sf-coral-deep)] underline decoration-[var(--sf-butter)] decoration-4 underline-offset-4 hover:decoration-[var(--sf-coral)] focus-visible:decoration-[var(--sf-coral)] focus-visible:outline-none"
            >
              {QUESTIONS.email}
            </a>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <button type="button" onClick={openContact} className={btnOutline}>
                {QUESTIONS.contact}
              </button>
              <button type="button" onClick={openWaitlist} className={btnPop}>
                {QUESTIONS.interest}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Phones: floating "Apply Now" bar ────────────────────────────────────────

function FloatingBar() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pt-2 lg:hidden"
      initial={reduce ? false : { y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.6 }}
    >
      <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[var(--sf-ink)] px-5 py-3 shadow-[0_20px_40px_-20px_rgba(43,42,38,0.8)]">
        <div>
          <p className="sf-display text-sm leading-tight text-white">{FLOATING_BAR.title}</p>
          <p className="text-xs font-semibold text-white/70">{FLOATING_BAR.sub}</p>
        </div>
        <a
          href={`#${FORM_ID}`}
          className="shrink-0 rounded-full bg-[var(--sf-butter)] px-4 py-2 text-sm font-extrabold text-[var(--sf-ink)] shadow-[0_4px_0_0_#d9b84a] transition-transform active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        >
          {FLOATING_BAR.cta}
        </a>
      </div>
    </motion.div>
  );
}
