"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import { Marquee, Reveal, WordsReveal, useMediaQuery } from "@/app/_garden/motion";
import { Draw, Leaf, Pill, Squiggle, Star, Sun, btnOutline, btnPop } from "@/app/_garden/ui";
import { CtaCard } from "@/app/_garden/program";
import GradeBandCard from "./GradeBandCard";
import type { WeekHighlight } from "./types";

const ImageLightbox = dynamic(() => import("@/app/components/ImageLightbox"), { ssr: false });

const TILTS = [-3, 2, -1.5, 2.5, -2, 1.5];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];
const NOTE_COLORS = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-lav)"];

/** One weekly recap page, built with the Garden design system (app/_garden). */
export default function WeekHighlightsPage({ week }: { week: WeekHighlight }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxImages = week.images.map((img) => ({ src: img.src, alt: img.caption }));

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <WeekHero week={week} />
      <Learned week={week} />
      <Photos week={week} onOpen={setLightboxIndex} />
      <JoinUs week={week} />
      {lightboxIndex !== null && (
        <ImageLightbox images={lightboxImages} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </GardenShell>
  );
}

// ─── Hero: heading + a polaroid slideshow of the first photos ────────────────

function WeekHero({ week }: { week: WeekHighlight }) {
  const summer = week.program === "summer";
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      <Draw className="absolute left-[4%] top-[18%] hidden w-16 lg:block" delay={0.5}>
        <Sun />
      </Draw>
      <Draw className="absolute right-[5%] bottom-[10%] hidden w-12 lg:block" delay={0.8}>
        <Leaf />
      </Draw>
      <Draw className="absolute left-[44%] bottom-[8%] hidden w-9 lg:block" delay={1}>
        <Star />
      </Draw>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:px-16">
        <Reveal stagger={0.1}>
          <div>
            <Pill tint={summer ? "butter" : "sage"}>{summer ? "☀️" : "🍎"} {week.badge}</Pill>
          </div>
          <h1 className="sf-display mt-6 text-5xl leading-[0.95] sm:text-6xl lg:text-[5.2rem] lg:leading-[0.92]">
            <span className="relative isolate inline-block">
              <Draw className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full" delay={0.4}>
                <Squiggle className="w-full" color="var(--sf-butter)" />
              </Draw>
              <span className="relative z-10">{week.title}</span>
            </span>
          </h1>
          {week.dates && <p className="sf-hand mt-6 text-2xl text-[var(--sf-sage-deep)]">{week.dates}</p>}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{week.intro}</p>
        </Reveal>

        <Slideshow week={week} />
      </div>

      {/* Phones: an endless row of the week's photos */}
      <div className="mt-12 -rotate-2 sm:hidden" aria-hidden="true">
        <Marquee duration={70} trackClassName="py-4">
          {week.images.map((img, i) => (
            <div key={img.src} className="sf-polaroid relative mx-2.5 w-60 shrink-0" style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}>
              <div className="relative aspect-square overflow-hidden rounded-[3px]">
                <Image src={img.src} alt="" fill className="object-cover" sizes="240px" preload={i === 0} />
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function Slideshow({ week }: { week: WeekHighlight }) {
  const count = Math.min(week.carouselCount, week.images.length);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance every 5s; manual navigation restarts the clock.
  const start = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setActive((s) => (s + 1) % count), 5000);
  }, [count]);
  useEffect(() => {
    if (paused || reduced) return;
    start();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [start, paused, reduced]);

  const go = (i: number) => {
    setActive((i + count) % count);
    if (!paused && !reduced) start();
  };
  const slide = week.images[active];
  const tilt = TILTS[active % TILTS.length];

  return (
    <div
      className="relative mx-auto hidden w-full max-w-[600px] sm:block"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Paper stack behind the photo */}
      <div className="absolute inset-x-6 top-6 bottom-16 rotate-[5deg] rounded-md bg-[var(--sf-lav)]" aria-hidden="true" />
      <div className="absolute inset-x-4 top-3 bottom-14 -rotate-[4deg] rounded-md bg-[var(--sf-mint)]" aria-hidden="true" />

      <motion.figure
        className="sf-polaroid relative"
        initial={{ y: 40, rotate: tilt * 3 }}
        animate={{ y: 0, rotate: tilt }}
        transition={{ type: "spring", stiffness: 140, damping: 14 }}
      >
        <span className="absolute -top-3 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-butter)] opacity-90" aria-hidden="true" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-[var(--sf-cream)]">
          <AnimatePresence initial={false}>
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
              <Image src={slide.src} alt={slide.caption} fill className="object-cover" sizes="(max-width: 1024px) 90vw, 600px" preload={active === 0} />
            </motion.div>
          </AnimatePresence>
        </div>
        <figcaption className="sf-hand flex min-h-[3.5rem] items-center justify-center px-3 pt-3 text-center text-xl leading-snug text-[var(--sf-ink)]" aria-live="polite">
          {slide.caption}
        </figcaption>
      </motion.figure>

      <div className="relative mt-8 flex items-center justify-center gap-5">
        <button onClick={() => go(active - 1)} aria-label="Previous photo" className={ROUND_BTN}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-coral)] ${
                i === active ? "w-7 bg-[var(--sf-coral)]" : "w-2.5 bg-[var(--sf-ink)]/20 hover:bg-[var(--sf-ink)]/40"
              }`}
            />
          ))}
        </div>
        <button onClick={() => go(active + 1)} aria-label="Next photo" className={ROUND_BTN}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

const ROUND_BTN =
  "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--sf-ink)] bg-white text-[var(--sf-ink)] shadow-[0_4px_0_0_var(--sf-ink)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--sf-ink)] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40";

// ─── What we learned: grade-band cards + beyond-academics sticky notes ───────

function Learned({ week }: { week: WeekHighlight }) {
  const three = week.groups.length >= 3;
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sage">📚 {week.learned.badge}</Pill>
          <WordsReveal text={week.learned.heading} className="sf-display mt-5 text-4xl md:text-6xl" />
          <Reveal>
            <p className="mt-5 text-lg leading-relaxed text-[var(--sf-soft)]">{week.learned.sub}</p>
          </Reveal>
        </div>

        <Reveal className={`mx-auto mt-16 grid gap-10 ${three ? "lg:grid-cols-3 lg:gap-8" : "max-w-5xl md:grid-cols-2"}`} stagger={0.12} y={50}>
          {week.groups.map((g, i) => (
            <div key={g.title}>
              <GradeBandCard {...g} tilt={[-1.5, 1, -1][i % 3]} headingLevel="h3" />
            </div>
          ))}
        </Reveal>

        <div className="mt-24">
          <h3 className="sf-display text-center text-3xl md:text-4xl">
            <span aria-hidden="true">✨ </span>
            {week.beyond.label}
          </h3>
          <Reveal className="mt-10 grid gap-8 sm:grid-cols-3" stagger={0.1} y={40}>
            {week.beyond.items.map((item, i) => (
              <div
                key={item.title}
                className="sf-wiggle relative rounded-md p-6 pt-8 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]"
                style={{ background: NOTE_COLORS[i % NOTE_COLORS.length], rotate: `${[-2, 1.5, -1][i % 3]}deg` }}
              >
                <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
                <span className="text-3xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <p className="sf-display mt-3 text-xl leading-snug">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--sf-ink)]/75">{item.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>

        {week.callout && (
          <Reveal className="mx-auto mt-20 max-w-3xl" y={40}>
            <div>
            <div className="relative -rotate-1 rounded-[32px] border-2 border-dashed border-[var(--sf-coral)]/50 bg-[var(--sf-cream)] p-8 transition-transform duration-500 hover:rotate-0 md:p-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span className="flex h-16 w-16 shrink-0 rotate-6 items-center justify-center rounded-2xl bg-[var(--sf-butter)] text-3xl shadow" aria-hidden="true">
                  {week.callout.emoji}
                </span>
                <div>
                  <Pill tint="coral">{week.callout.label}</Pill>
                  <h3 className="sf-display mt-3 text-2xl md:text-3xl">{week.callout.title}</h3>
                  <p className="mt-3 leading-relaxed text-[var(--sf-soft)]">{week.callout.body}</p>
                </div>
              </div>
            </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Photo highlights: polaroid grid that opens the lightbox ─────────────────

function Photos({ week, onOpen }: { week: WeekHighlight; onOpen: (i: number) => void }) {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="lav">📸 {week.photos.badge}</Pill>
          <WordsReveal text={week.photos.heading} className="sf-display mt-5 text-4xl md:text-6xl" />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{week.photos.hint}</p>
        </div>

        <div className="-mx-6 mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pt-4 pb-8 [scroll-padding-inline:1.5rem] [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {week.images.map((img, i) => (
            <motion.div
              key={img.src}
              className="w-[78%] shrink-0 snap-start sm:w-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: (i % 3) * 0.06 }}
            >
              <button
                onClick={() => onOpen(i)}
                className="sf-polaroid group relative block w-full cursor-zoom-in text-left transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:rotate-0 focus-visible:-translate-y-1.5 focus-visible:rotate-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40"
                style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}
              >
                <span className="absolute -top-3 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[i % TAPE.length] }} aria-hidden="true" />
                <span className="relative block aspect-[4/3] overflow-hidden rounded-[3px]">
                  <Image
                    src={img.src}
                    alt={img.caption}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 360px"
                  />
                </span>
                <span className="sf-hand block px-1.5 pt-3 pb-1 text-lg leading-snug text-[var(--sf-ink)]">{img.caption}</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Join us ─────────────────────────────────────────────────────────────────

function JoinUs({ week }: { week: WeekHighlight }) {
  const { cta } = week;
  return (
    <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <CtaCard badge={<>💌 {cta.badge}</>} heading={cta.heading} body={cta.body}>
          <Link href={cta.primary.href} className={btnPop}>
            {cta.primary.label}
          </Link>
          <Link href={cta.secondary.href} className={btnOutline}>
            {cta.secondary.label}
          </Link>
        </CtaCard>
      </div>
    </section>
  );
}
