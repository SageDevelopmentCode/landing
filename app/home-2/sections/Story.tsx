"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, ScrollTrigger, MQ_DESKTOP_MOTION } from "@/app/_home-variants/gsap";
import { WELCOME, OFFER, PHILOSOPHY, PHOTO_POOL } from "@/app/_home-variants/content";
import { HorizontalTrack, Reveal, Runs, WordsReveal, ScrubWords } from "@/app/_home-variants/motion";
import { Label, btnCoral, btnLine } from "../ui";

// ─── Welcome — stacking sticky cards ─────────────────────────────────────────

export function Welcome() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_DESKTOP_MOTION, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-stack]");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card.firstElementChild, {
            scale: 0.88,
            opacity: 0.35,
            filter: "blur(2px)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top 18%", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="bg-[var(--h2-night)] py-28 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-36">
            <Label n="01">{WELCOME.badge}</Label>
            <WordsReveal text={WELCOME.heading} className="h2-display mt-6 text-6xl md:text-8xl leading-[0.92]" />
            <ScrubWords
              runs={[{ text: WELCOME.body }]}
              className="mt-8 text-lg md:text-xl leading-relaxed text-[var(--h2-cream)]"
              dimOpacity={0.25}
            />
          </div>
        </div>
        <div className="lg:col-span-7 space-y-8 lg:space-y-[14vh]">
          {WELCOME.cards.map((c, i) => (
            <div key={c.title} data-stack className="lg:sticky" style={{ top: `calc(18vh + ${i * 22}px)` }}>
              <article className="grid overflow-hidden rounded-[28px] border border-[var(--h2-line)] bg-[var(--h2-forest)] sm:grid-cols-2 origin-top will-change-transform">
                <div className="relative min-h-[260px] sm:min-h-[420px]" data-cursor="View">
                  <Image src={c.image} alt={c.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 30vw" />
                </div>
                <div className="flex flex-col justify-between p-8 md:p-10">
                  <span className="h2-display text-7xl text-[var(--h2-coral)]/80">0{i + 1}</span>
                  <div>
                    <span className="text-3xl" aria-hidden="true">{c.icon}</span>
                    <h3 className="h2-display mt-3 text-4xl">{c.title}</h3>
                    <p className="mt-3 leading-relaxed text-[var(--h2-mute)]">{c.description}</p>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── What We Offer — a week, sideways ────────────────────────────────────────

const WEEK_PHOTOS = [PHOTO_POOL[1], PHOTO_POOL[6], PHOTO_POOL[12], PHOTO_POOL[22]];

export function Offer() {
  return (
    <div id="what-we-offer" className="bg-[var(--h2-forest)]">
      <HorizontalTrack
        className="py-24 lg:py-0"
        trackClassName="gap-6 px-6 sm:px-10 lg:px-16 items-stretch"
        progressClassName="bg-[var(--h2-coral)]"
        progressTrackClassName="bg-white/10"
      >
        <div className="snap-start shrink-0 w-[86vw] sm:w-[60vw] lg:w-[40vw] lg:pr-12 flex flex-col justify-center">
          <Label n="02">{OFFER.badge}</Label>
          <h2 className="h2-display mt-6 text-6xl md:text-8xl leading-[0.92]">{OFFER.heading}</h2>
          <p className="h2-display italic mt-4 text-2xl text-[var(--h2-sage)]">{OFFER.subtitle}</p>
          <p className="mt-6 leading-relaxed text-[var(--h2-mute)]">
            <Runs runs={OFFER.p1} highlightClassName="text-[var(--h2-cream)] font-semibold" />
          </p>
          <p className="mt-4 leading-relaxed text-[var(--h2-mute)]">
            <Runs runs={OFFER.p2} highlightClassName="text-[var(--h2-cream)] font-semibold" />
          </p>
        </div>
        {OFFER.schedule.blocks.map((b, i) => (
          <article key={b} className="snap-start shrink-0 relative w-[80vw] sm:w-[50vw] lg:w-[34vw] h-[64vh] min-h-[440px] max-h-[680px] overflow-hidden rounded-[28px]" data-cursor="View">
            <Image src={WEEK_PHOTOS[i]} alt="" fill className="object-cover" sizes="(max-width: 1024px) 80vw, 34vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--h2-night)] via-[var(--h2-night)]/40 to-transparent" />
            <span className="h2-display h2-outline absolute -right-4 top-2 text-[9rem] leading-none select-none" aria-hidden="true">
              0{i + 1}
            </span>
            <div className="absolute inset-x-0 bottom-0 p-8">
              <span className="h2-label text-[var(--h2-coral)]">{OFFER.schedule.weekdays}</span>
              <p className="h2-display mt-3 text-3xl leading-tight">{b}</p>
            </div>
          </article>
        ))}
        <article className="snap-start shrink-0 relative w-[80vw] sm:w-[50vw] lg:w-[34vw] h-[64vh] min-h-[440px] max-h-[680px] overflow-hidden rounded-[28px] bg-[var(--h2-coral)] text-[var(--h2-night)]">
          <Image src={WEEK_PHOTOS[3]} alt="" fill className="object-cover mix-blend-multiply opacity-60" sizes="34vw" />
          <div className="absolute inset-0 flex flex-col justify-between p-8">
            <span className="h2-label">{OFFER.schedule.friday.time}</span>
            <div>
              <h3 className="h2-display text-6xl leading-none">
                <em>Field</em> Day Friday
              </h3>
              <p className="mt-4 text-lg font-semibold">{OFFER.schedule.friday.description}</p>
            </div>
          </div>
        </article>
        <div className="shrink-0 w-[4vw]" aria-hidden="true" />
      </HorizontalTrack>
      <Programs />
    </div>
  );
}

// ─── Programs — sticky photo crossfades as each program scrolls past ─────────

function Programs() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-program]").forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="mx-auto max-w-7xl px-6 pb-28 sm:px-10 lg:px-16 lg:pb-40">
      <div className="mb-14 flex items-end justify-between gap-6 border-b border-[var(--h2-line)] pb-8">
        <div>
          <Label>{OFFER.programsBadge}</Label>
          <WordsReveal text={OFFER.programsHeading} className="h2-display mt-5 text-5xl md:text-7xl" />
        </div>
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="sticky top-32 aspect-[4/5] overflow-hidden rounded-[28px]">
            {OFFER.programs.map((p, i) => (
              <Image
                key={p.image}
                src={p.image}
                alt={p.title}
                fill
                sizes="50vw"
                className={`object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${active === i ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
              />
            ))}
            <span className="absolute bottom-6 left-6 h2-label rounded-full bg-[var(--h2-night)]/70 px-4 py-2 backdrop-blur">
              0{active + 1} / 0{OFFER.programs.length}
            </span>
          </div>
        </div>
        <div className="space-y-24 lg:space-y-[30vh] lg:py-[12vh]">
          {OFFER.programs.map((p, i) => (
            <article key={p.href} data-program className={`transition-opacity duration-700 ${active === i ? "lg:opacity-100" : "lg:opacity-35"}`}>
              <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-[24px] lg:hidden">
                <Image src={p.image} alt={p.title} fill className="object-cover" sizes="100vw" />
              </div>
              <Link href="/apply" className="h2-label inline-flex items-center gap-2 rounded-full border border-[var(--h2-sage)]/40 px-3.5 py-2 text-[var(--h2-sage)] hover:bg-[var(--h2-sage)]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--h2-sage)] animate-pulse" />
                {OFFER.enrollmentOpen} →
              </Link>
              <h3 className="h2-display mt-6 text-5xl md:text-6xl">{p.title}</h3>
              <p className="mt-3 text-sm font-semibold text-[var(--h2-coral)]">📅 {p.dates}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {p.details.map((d) => (
                  <span key={d} className="rounded-full border border-[var(--h2-line)] px-3.5 py-1.5 text-xs text-[var(--h2-mute)]">
                    {d}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-lg leading-relaxed text-[var(--h2-mute)]">{p.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={p.ctaHref} className={btnCoral}>
                  Enroll Now
                </Link>
                <Link href={p.href} className={btnLine}>
                  Learn More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── How We Learn — expanding panels ─────────────────────────────────────────

export function Philosophy() {
  const [open, setOpen] = useState(0);
  return (
    <section id="educational-philosophy" className="bg-[var(--h2-night)] py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-12 mb-16">
          <div className="lg:col-span-5">
            <Label n="03">{PHILOSOPHY.badge}</Label>
            <WordsReveal text={PHILOSOPHY.heading} className="h2-display mt-6 text-6xl md:text-8xl leading-[0.92]" />
            <p className="h2-display italic mt-4 text-2xl text-[var(--h2-sage)]">{PHILOSOPHY.subtitle}</p>
          </div>
          <Reveal className="lg:col-span-6 lg:col-start-7 self-end space-y-5 text-lg leading-relaxed text-[var(--h2-mute)]">
            <p>
              <Runs runs={PHILOSOPHY.p1} highlightClassName="text-[var(--h2-cream)] font-semibold" />
            </p>
            <p>
              <Runs runs={PHILOSOPHY.p2} highlightClassName="text-[var(--h2-cream)] font-semibold" />
            </p>
          </Reveal>
        </div>
        <Reveal className="flex flex-col gap-3 lg:h-[70vh] lg:min-h-[520px] lg:flex-row" y={60} stagger={0.08}>
          {PHILOSOPHY.pillars.map((p, i) => {
            const isOpen = open === i;
            return (
              <button
                key={p.title}
                type="button"
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
                aria-expanded={isOpen}
                className={`group relative h-[340px] overflow-hidden rounded-[28px] text-left transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:h-auto cursor-pointer ${isOpen ? "lg:grow-[5]" : "lg:grow"} lg:basis-0`}
              >
                <Image src={p.image} alt={p.title} fill className={`object-cover transition-transform duration-[1400ms] ${isOpen ? "scale-100" : "scale-110"}`} sizes="(max-width: 1024px) 100vw, 50vw" />
                <div className={`absolute inset-0 transition-colors duration-700 ${isOpen ? "bg-gradient-to-t from-black/80 via-black/10 to-transparent" : "bg-black/50"}`} />
                <span className="absolute left-6 top-6 h2-label text-[var(--h2-cream)]/70">0{i + 1}</span>
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <span className="text-3xl" aria-hidden="true">{p.icon}</span>
                  <h3 className={`h2-display mt-2 text-3xl md:text-4xl transition-all duration-700 ${isOpen ? "" : "lg:[writing-mode:vertical-rl] lg:rotate-180 lg:text-2xl"}`}>{p.title}</h3>
                  <p className={`mt-2 max-w-md text-[var(--h2-cream)]/80 transition-opacity duration-700 ${isOpen ? "opacity-100" : "lg:opacity-0"}`}>{p.description}</p>
                </div>
              </button>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
