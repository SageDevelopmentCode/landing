"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap, useGSAP, MQ_MOTION } from "@/app/_garden/gsap";
import { WELCOME, OFFER, PHILOSOPHY } from "@/app/_home/content";
import { Reveal, Runs, WordsReveal, useMediaQuery } from "@/app/_garden/motion";
import { Arrow, Draw, Leaf, Pill, Squiggle, btnOutline, btnPop, type Tint } from "@/app/_garden/ui";

// ─── Welcome — draggable polaroids ───────────────────────────────────────────

const TILTS = [-6, 4, -3, 7];
const NOTE_COLORS = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)"];

export function Welcome() {
  const area = useRef<HTMLDivElement>(null);
  // Dragging only for mouse/trackpad so touch users can scroll normally.
  const canDrag = useMediaQuery("(pointer: fine)");
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sage">🌱 {WELCOME.badge}</Pill>
          <WordsReveal text={WELCOME.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mt-6 text-lg md:text-xl leading-relaxed text-[var(--sf-soft)]">{WELCOME.body}</p>
          </Reveal>
          <p className="sf-hand mt-8 hidden text-xl text-[var(--sf-coral-deep)] lg:flex items-center justify-center gap-2">
            psst — you can drag these around!
            <Draw className="w-14 rotate-12">
              <Arrow />
            </Draw>
          </p>
        </div>

        <div ref={area} className="relative mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {WELCOME.cards.map((c, i) => (
            <motion.article
              key={c.title}
              drag={canDrag}
              dragConstraints={area}
              dragElastic={0.2}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 20 }}
              whileDrag={{ scale: 1.08, rotate: 0, zIndex: 30, cursor: "grabbing" }}
              initial={{ opacity: 0, y: 60, rotate: TILTS[i] * 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: TILTS[i] }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 160, damping: 16, delay: i * 0.08 }}
              className={`sf-polaroid relative select-none ${canDrag ? "cursor-grab" : ""}`}
              style={{ rotate: TILTS[i] }}
            >
              <span className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-2 rounded-sm opacity-90" style={{ background: NOTE_COLORS[i] }} />
              <div className="pointer-events-none relative aspect-square overflow-hidden rounded-[3px]">
                <Image src={c.image} alt={c.title} fill draggable={false} className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
              </div>
              <div className="px-2 pt-4 pb-2">
                <h3 className="sf-display text-2xl">
                  <span aria-hidden="true">{c.icon}</span> {c.title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--sf-soft)]">{c.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── What We Offer — sticky notes + blob programs ────────────────────────────

const BLOCK_TINTS = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];
const PROGRAM_TINTS: Tint[] = ["lav", "sage"];

export function Offer() {
  return (
    <section id="what-we-offer" className="relative py-24 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <Pill tint="butter">☀️ {OFFER.badge}</Pill>
            <WordsReveal text={OFFER.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
            <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage)]">{OFFER.subtitle}</p>
            <Reveal>
              <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">
                <Runs runs={OFFER.p1} highlightClassName="font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]" />
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[var(--sf-soft)]">
                <Runs runs={OFFER.p2} highlightClassName="font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-mint)_60%)]" />
              </p>
            </Reveal>
          </div>

          {/* Sticky-note week */}
          <div>
            <p className="sf-hand mb-4 text-2xl">{OFFER.schedule.weekdays}</p>
            <Reveal className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1" stagger={0.12} y={50}>
              {OFFER.schedule.blocks.map((b, i) => (
                <div
                  key={b}
                  className={`sf-wiggle relative rounded-md p-5 pt-7 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)] lg:flex lg:items-center lg:gap-5 lg:pt-5 ${["lg:mr-10", "lg:ml-10", "lg:mr-6"][i]}`}
                  style={{ background: BLOCK_TINTS[i], rotate: `${[-2, 1.5, -1][i]}deg` }}
                >
                  <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" />
                  <span className="sf-display text-4xl opacity-30 lg:text-5xl">{i + 1}</span>
                  <p className="mt-2 font-bold leading-snug lg:mt-0 lg:text-lg">{b}</p>
                </div>
              ))}
            </Reveal>
            <Reveal className="mt-6" y={40}>
              <div className="relative overflow-hidden rounded-[28px] bg-[var(--sf-coral)] p-7 text-white">
                <Draw className="absolute -right-4 -top-4 w-28 opacity-60">
                  <Leaf color="#fff" />
                </Draw>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="sf-display text-3xl">{OFFER.schedule.friday.title} 🎉</h4>
                  <span className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-[var(--sf-coral-deep)]">{OFFER.schedule.friday.time}</span>
                </div>
                <p className="mt-2 text-lg font-semibold">{OFFER.schedule.friday.description}</p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Programs */}
        <div className="mt-28 text-center">
          <Pill tint="lav">🎒 {OFFER.programsBadge}</Pill>
          <WordsReveal text={OFFER.programsHeading} className="sf-display mt-5 text-4xl md:text-6xl" />
        </div>
        <div className="mt-14 grid gap-16 md:grid-cols-2">
          {OFFER.programs.map((p, i) => (
            <Reveal key={p.href} y={60} delay={i * 0.1}>
              <article className="text-center">
                <div className="relative mx-auto aspect-square w-[82%] max-w-[420px]">
                  <div className="sf-blob absolute inset-0 overflow-hidden" style={{ animationDelay: `${-i * 5}s` }}>
                    <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 80vw, 420px" />
                  </div>
                  <Link href="/apply" className="absolute -right-2 top-4 flex h-28 w-28 rotate-12 items-center justify-center rounded-full bg-[var(--sf-butter)] p-3 text-center text-xs font-extrabold leading-tight text-[var(--sf-ink)] shadow-lg transition-transform hover:rotate-0 hover:scale-105">
                    {OFFER.enrollmentOpen} →
                  </Link>
                </div>
                <h3 className="sf-display mt-8 text-3xl md:text-4xl">{p.title}</h3>
                <p className="mt-2">
                  <Pill tint={PROGRAM_TINTS[i]}>📅 {p.dates}</Pill>
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {p.details.map((d) => (
                    <span key={d} className="rounded-full border-2 border-[var(--sf-ink)]/10 px-3 py-1 text-xs font-bold">
                      {d}
                    </span>
                  ))}
                </div>
                <p className="mx-auto mt-4 max-w-md leading-relaxed text-[var(--sf-soft)]">{p.description}</p>
                <div className="mt-7 flex flex-wrap justify-center gap-4">
                  <Link href={p.ctaHref} className={btnPop}>
                    Enroll Now
                  </Link>
                  <Link href={p.href} className={btnOutline}>
                    Learn More
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How We Learn — a seed grows into a sage plant as you scroll ─────────────

export function Philosophy() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const st = { trigger: "[data-pillars]", start: "top 70%", end: "bottom 60%", scrub: 0.6 };
        const tl = gsap.timeline({ scrollTrigger: st, defaults: { ease: "none" } });
        tl.fromTo("[data-stem]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 4 }, 0)
          .from("[data-seed]", { scale: 1.6, duration: 0.6, transformOrigin: "50% 50%" }, 0)
          .from("[data-sprout='0']", { scale: 0, transformOrigin: "50% 100%", duration: 0.6 }, 0.6)
          .from("[data-sprout='1']", { scale: 0, transformOrigin: "0% 100%", duration: 0.6 }, 1.5)
          .from("[data-sprout='2']", { scale: 0, transformOrigin: "100% 100%", duration: 0.6 }, 2.4)
          .from("[data-bloom]", { scale: 0, rotate: -90, transformOrigin: "50% 50%", duration: 0.8 }, 3.3);
        gsap.utils.toArray<HTMLElement>("[data-pillar]").forEach((el) => {
          gsap.from(el, { x: 60, opacity: 0, duration: 0.8, ease: "back.out(1.4)", scrollTrigger: { trigger: el, start: "top 80%", once: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="educational-philosophy" className="relative py-24 lg:py-32 bg-[var(--sf-mint)]/45">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sage">🌿 {PHILOSOPHY.badge}</Pill>
          <WordsReveal text={PHILOSOPHY.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <p className="sf-hand mt-2 text-2xl text-[var(--sf-sage-deep)]">{PHILOSOPHY.subtitle}</p>
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">
              <Runs runs={PHILOSOPHY.p1} highlightClassName="font-extrabold text-[var(--sf-ink)]" />
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--sf-soft)]">
              <Runs runs={PHILOSOPHY.p2} highlightClassName="font-extrabold text-[var(--sf-ink)]" />
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* Growing plant */}
          <div className="hidden lg:block">
            <div className="sticky top-32 mx-auto aspect-[3/4] max-w-[380px]">
              <svg viewBox="0 0 300 400" className="h-full w-full" aria-hidden="true">
                <ellipse cx="150" cy="372" rx="120" ry="16" fill="#8a6a4a" opacity="0.18" />
                <path d="M30 372 Q150 340 270 372" stroke="#8a6a4a" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5" />
                <ellipse data-seed cx="150" cy="364" rx="13" ry="9" fill="#a3784f" />
                <path data-stem pathLength={1} strokeDasharray="1 2" d="M150 362 C 148 300, 158 250, 150 190 S 140 110, 152 70" stroke="var(--sf-sage-deep)" strokeWidth="7" fill="none" strokeLinecap="round" />
                <g data-sprout="0">
                  <path d="M150 300 C 120 290, 98 268, 92 240 C 122 244, 144 266, 150 300 Z" fill="var(--sf-sage)" />
                </g>
                <g data-sprout="1">
                  <path d="M152 220 C 186 212, 212 186, 218 154 C 184 160, 160 186, 152 220 Z" fill="#97c09b" />
                </g>
                <g data-sprout="2">
                  <path d="M150 150 C 118 140, 96 112, 94 82 C 126 90, 146 118, 150 150 Z" fill="var(--sf-sage)" />
                </g>
                <g data-bloom>
                  {[0, 72, 144, 216, 288].map((a) => (
                    <ellipse key={a} cx="152" cy="52" rx="10" ry="20" fill="var(--sf-coral)" transform={`rotate(${a} 152 70)`} />
                  ))}
                  <circle cx="152" cy="70" r="10" fill="var(--sf-butter)" />
                </g>
              </svg>
              <p className="sf-hand -mt-2 text-center text-xl text-[var(--sf-sage-deep)]">scroll to grow 🌱</p>
            </div>
          </div>

          {/* Pillars */}
          <div data-pillars className="space-y-8 lg:py-[10vh]">
            {PHILOSOPHY.pillars.map((p, i) => (
              <article key={p.title} data-pillar className="grid overflow-hidden rounded-[32px] bg-white shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] sm:grid-cols-[200px_1fr]">
                <div className="relative min-h-[200px]">
                  <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 200px" />
                </div>
                <div className="flex flex-col justify-center p-7">
                  <span className="sf-hand text-lg text-[var(--sf-coral-deep)]">step {i + 1}</span>
                  <h3 className="sf-display mt-1 text-3xl">
                    <span aria-hidden="true">{p.icon}</span> {p.title}
                  </h3>
                  <p className="mt-2 text-lg text-[var(--sf-soft)]">{p.description}</p>
                </div>
              </article>
            ))}
            <Draw className="mx-auto block w-40">
              <Squiggle color="var(--sf-sage)" />
            </Draw>
          </div>
        </div>
      </div>
    </section>
  );
}
