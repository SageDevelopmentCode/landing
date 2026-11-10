"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, MQ_MOTION } from "@/app/_home-variants/gsap";
import { WELCOME, OFFER, PHILOSOPHY, PHOTO_POOL } from "@/app/_home-variants/content";
import {
  Reveal,
  WordsReveal,
  ScrubWords,
  Runs,
  Parallax,
  HorizontalTrack,
} from "@/app/_home-variants/motion";
import { Badge, Chapter, btnPrimary } from "../ui";

// ─── Welcome ─────────────────────────────────────────────────────────────────

export function Welcome() {
  return (
    <section className="h1-grain bg-[var(--h1-cream)] pb-28">
      <Chapter eyebrow="where children" word="explore" />
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 mb-20">
          <div className="lg:col-span-4">
            <Badge>{WELCOME.badge}</Badge>
            <WordsReveal
              text={WELCOME.heading}
              className="h1-display mt-5 text-5xl md:text-6xl font-light leading-[1.02]"
            />
          </div>
          <ScrubWords
            runs={[{ text: WELCOME.body }]}
            className="lg:col-span-8 h1-display text-2xl md:text-[2.15rem] leading-[1.35] font-light text-[var(--h1-ink)]"
          />
        </div>

        <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" y={70} stagger={0.12}>
          {WELCOME.cards.map((c, i) => (
            <article
              key={c.title}
              tabIndex={0}
              className="group relative h-[460px] overflow-hidden rounded-[28px] bg-[var(--h1-sage)] text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--h1-coral)] focus-visible:ring-offset-4"
            >
              <Image
                src={c.image}
                alt={c.title}
                fill
                className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-focus:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f2a24]/90 via-[#1f2a24]/20 to-transparent" />
              <span className="absolute left-6 top-6 h1-eyebrow text-[0.65rem] text-white/80">0{i + 1}</span>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="h1-display text-[1.75rem] leading-tight">{c.title}</h3>
                <div className="grid transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] grid-rows-[1fr] lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus:grid-rows-[1fr]">
                  <p className="overflow-hidden text-sm leading-relaxed text-white/85 pt-3 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus:opacity-100 transition-opacity duration-700">
                    {c.description}
                  </p>
                </div>
                <span className="mt-4 block h-px w-full origin-left scale-x-[0.25] bg-white/50 transition-transform duration-700 group-hover:scale-x-100 group-focus:scale-x-100" />
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── What We Offer ───────────────────────────────────────────────────────────

const SCHEDULE_PHOTOS = [PHOTO_POOL[3], PHOTO_POOL[9], PHOTO_POOL[14]];

export function Offer() {
  const lineRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.fromTo(
          "[data-line]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: lineRef.current, start: "top 70%", end: "bottom 60%", scrub: true },
          },
        );
        gsap.utils.toArray<HTMLElement>("[data-node]").forEach((n) =>
          gsap.from(n, {
            scale: 0,
            duration: 0.6,
            ease: "back.out(2)",
            scrollTrigger: { trigger: n, start: "top 70%", once: true },
          }),
        );
      });
      return () => mm.revert();
    },
    { scope: lineRef },
  );

  return (
    <section id="what-we-offer" className="bg-[var(--h1-paper)] py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Sticky intro */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-36">
              <Badge>{OFFER.badge}</Badge>
              <WordsReveal text={OFFER.heading} className="h1-display mt-5 text-5xl md:text-7xl font-light leading-[0.98]" />
              <Reveal>
                <p className="h1-display italic text-2xl text-[var(--h1-moss)] mt-5">{OFFER.subtitle}</p>
                <p className="mt-8 text-lg leading-relaxed text-[var(--h1-ink)]/80">
                  <Runs runs={OFFER.p1} highlightClassName="text-[var(--h1-coral-deep)] font-semibold" />
                </p>
                <p className="mt-5 text-lg leading-relaxed text-[var(--h1-ink)]/80">
                  <Runs runs={OFFER.p2} highlightClassName="text-[var(--h1-coral-deep)] font-semibold" />
                </p>
              </Reveal>
            </div>
          </div>

          {/* Weekly rhythm timeline */}
          <div ref={lineRef} className="relative lg:col-span-7 lg:pl-10">
            <div className="absolute left-[19px] lg:left-[59px] top-2 bottom-2 w-px bg-[var(--h1-ink)]/10">
              <div data-line className="h-full w-full origin-top bg-[var(--h1-coral)]" />
            </div>
            <p className="h1-eyebrow text-[var(--h1-moss)] pl-14 mb-8">{OFFER.schedule.weekdays}</p>
            <div className="space-y-8">
              {OFFER.schedule.blocks.map((b, i) => (
                <Reveal key={b} x={40} y={0} className="pl-14">
                  <div className="relative">
                    <span data-node className="absolute -left-[45px] top-8 h-[17px] w-[17px] rounded-full border-4 border-[var(--h1-paper)] bg-[var(--h1-coral)]" />
                    <div className="grid grid-cols-[1fr_120px] sm:grid-cols-[1fr_180px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-30px_rgba(31,42,36,0.35)]">
                      <div className="p-7">
                        <span className="h1-display text-5xl font-light text-[var(--h1-coral)]">0{i + 1}</span>
                        <p className="mt-3 text-lg font-medium leading-snug">{b}</p>
                      </div>
                      <div className="relative">
                        <Image src={SCHEDULE_PHOTOS[i]} alt="" fill className="object-cover" sizes="180px" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
              <Reveal x={40} y={0} className="pl-14">
                <div className="relative">
                  <span data-node className="absolute -left-[45px] top-8 h-[17px] w-[17px] rounded-full border-4 border-[var(--h1-paper)] bg-[var(--h1-sage)]" />
                  <div className="relative overflow-hidden rounded-3xl bg-[var(--h1-sage)] p-8 text-white">
                    <Image src={PHILOSOPHY.pillars[3].image} alt="" fill className="object-cover opacity-25" sizes="600px" />
                    <div className="relative">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="h1-display text-3xl">
                          <span className="italic text-[var(--h1-coral)]">Field</span> Day Friday
                        </h4>
                        <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">{OFFER.schedule.friday.time}</span>
                      </div>
                      <p className="mt-3 text-white/85">{OFFER.schedule.friday.description}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Programs */}
        <div className="mt-32">
          <Badge>{OFFER.programsBadge}</Badge>
          <WordsReveal text={OFFER.programsHeading} className="h1-display mt-5 mb-12 text-4xl md:text-6xl font-light" />
          <Reveal className="grid gap-8 md:grid-cols-2" y={80} stagger={0.15}>
            {OFFER.programs.map((p) => (
              <article key={p.href} className="group overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_-40px_rgba(31,42,36,0.45)]">
                <Parallax className="h-72 md:h-96" amount={16}>
                  <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </Parallax>
                <div className="p-8 md:p-10">
                  <Link href="/apply" className="inline-flex items-center gap-2 rounded-full bg-[var(--h1-sage)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--h1-sage)] hover:bg-[var(--h1-sage)]/15">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {OFFER.enrollmentOpen} →
                  </Link>
                  <h3 className="h1-display mt-5 text-3xl md:text-4xl">{p.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-[var(--h1-moss)]">📅 {p.dates}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.details.map((d) => (
                      <span key={d} className="rounded-full border border-[var(--h1-ink)]/10 px-3 py-1 text-xs font-medium text-[var(--h1-ink)]/75">
                        {d}
                      </span>
                    ))}
                  </div>
                  <p className="mt-5 leading-relaxed text-[var(--h1-ink)]/75">{p.description}</p>
                  <div className="mt-8 flex items-center gap-6">
                    <Link href={p.ctaHref} className={btnPrimary}>
                      Enroll Now
                    </Link>
                    <Link href={p.href} className="h1-link-underline font-semibold">
                      Learn More
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── How We Learn ────────────────────────────────────────────────────────────

export function Philosophy() {
  return (
    <div id="educational-philosophy" className="bg-[var(--h1-ink)] text-[var(--h1-cream)]">
      <Chapter eyebrow="how we" word="learn" dark />
      <HorizontalTrack
        className="pb-24 lg:pb-0"
        trackClassName="gap-6 px-6 sm:px-10 lg:px-16 pb-4"
        progressClassName="bg-[var(--h1-coral)]"
        progressTrackClassName="bg-white/15"
      >
        <div className="snap-start shrink-0 w-[85vw] sm:w-[60vw] lg:w-[38vw] lg:pr-10 flex flex-col justify-center">
          <span className="h1-eyebrow text-[var(--h1-coral)]">{PHILOSOPHY.badge}</span>
          <h2 className="h1-display mt-5 text-5xl md:text-6xl font-light leading-[1.02]">{PHILOSOPHY.heading}</h2>
          <p className="h1-display italic text-2xl text-white/60 mt-4">{PHILOSOPHY.subtitle}</p>
          <p className="mt-8 text-lg leading-relaxed text-white/80">
            <Runs runs={PHILOSOPHY.p1} highlightClassName="text-[var(--h1-coral)] font-semibold" />
          </p>
          <p className="mt-5 text-lg leading-relaxed text-white/80">
            <Runs runs={PHILOSOPHY.p2} highlightClassName="text-[var(--h1-coral)] font-semibold" />
          </p>
        </div>
        {PHILOSOPHY.pillars.map((p, i) => (
          <article
            key={p.title}
            className="group snap-start shrink-0 relative w-[78vw] sm:w-[48vw] lg:w-[30vw] h-[62vh] min-h-[420px] max-h-[680px] overflow-hidden rounded-[32px]"
          >
            <Image
              src={p.image}
              alt={p.title}
              fill
              className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              sizes="(max-width: 1024px) 80vw, 30vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute right-6 top-5 h1-display text-7xl font-light text-white/25">0{i + 1}</span>
            <div className="absolute inset-x-0 bottom-0 p-8">
              <span className="text-3xl" aria-hidden="true">{p.icon}</span>
              <h3 className="h1-display mt-3 text-3xl">{p.title}</h3>
              <p className="mt-2 text-white/80">{p.description}</p>
            </div>
          </article>
        ))}
        <div className="shrink-0 w-[4vw]" aria-hidden="true" />
      </HorizontalTrack>
    </div>
  );
}
