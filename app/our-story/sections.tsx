"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, MQ_MOTION } from "@/app/_garden/gsap";
import { Reveal, Runs, WordsReveal } from "@/app/_garden/motion";
import { Draw, Leaf, Pill, Squiggle, Star, Sun } from "@/app/_garden/ui";
import { FOUNDERS, STORY, STORY_HERO } from "./content";

const springy = "transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const highlight =
  "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]";

// ─── Hero: heading + a stack of taped polaroids ──────────────────────────────

/** Decorative polaroids behind the portrait: position, width and tilt. */
const BACK_PHOTOS = [
  { pos: "left-0 top-2", rotate: -10, tape: "var(--sf-mint)" },
  { pos: "right-0 bottom-0", rotate: 9, tape: "var(--sf-sky)" },
];

export function StoryHero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28">
      <Draw className="absolute left-[5%] top-[18%] hidden w-20 lg:block" delay={0.5}>
        <Sun />
      </Draw>
      <Draw className="absolute right-[6%] top-[16%] hidden w-14 lg:block" delay={0.8}>
        <Leaf />
      </Draw>
      <Draw className="absolute left-[42%] bottom-[10%] hidden w-10 lg:block" delay={1}>
        <Star />
      </Draw>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:px-16">
        <Reveal stagger={0.1} className="text-center lg:text-left">
          <div>
            <Pill tint="coral">📖 {STORY_HERO.badge}</Pill>
          </div>
          <h1 className="sf-display mt-6 text-5xl leading-[0.95] sm:text-6xl lg:text-[5.4rem] lg:leading-[0.92] xl:text-[6.2rem]">
            {STORY_HERO.headingBefore}{" "}
            <span className="relative isolate inline-block text-[var(--sf-coral)]">
              <Draw className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full" delay={0.4}>
                <Squiggle className="w-full" color="var(--sf-butter)" />
              </Draw>
              <span className="relative z-10">{STORY_HERO.headingHighlight}</span>
            </span>
          </h1>
          <p className="sf-hand mx-auto mt-8 max-w-xl text-2xl leading-snug text-[var(--sf-sage-deep)] md:text-[1.7rem] lg:mx-0">
            {STORY_HERO.subtitle}
          </p>
        </Reveal>

        {/* Photo stack: Reveal animates the wrappers; tilt + hover live on the inner frames. */}
        <Reveal className="relative mx-auto aspect-[1/1.02] w-full max-w-[460px]" stagger={0.12} y={60}>
          {STORY_HERO.photos.map((src, i) => (
            <div key={src} className={`absolute w-[42%] ${BACK_PHOTOS[i].pos}`} aria-hidden="true">
              <div className={`sf-polaroid relative ${springy} hover:-translate-y-2`} style={{ rotate: `${BACK_PHOTOS[i].rotate}deg` }}>
                <span
                  className="absolute -top-3 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3 rounded-sm opacity-90"
                  style={{ background: BACK_PHOTOS[i].tape }}
                />
                <div className="relative aspect-square overflow-hidden rounded-[3px]">
                  <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 640px) 40vw, 200px" preload />
                </div>
              </div>
            </div>
          ))}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className={`sf-polaroid relative w-[64%] ${springy} hover:!rotate-0`} style={{ rotate: "-3deg" }}>
              <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-2 rounded-sm bg-[var(--sf-butter)] opacity-90" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
                <Image
                  src={STORY_HERO.portrait.src}
                  alt={STORY_HERO.portrait.alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 60vw, 300px"
                  preload
                />
              </div>
              <p className="sf-hand px-1 pt-3 text-center text-xl text-[var(--sf-soft)]" aria-hidden="true">
                meet Ms. Sabrina ✿
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── The story: two notebook pages with the pull quote stuck across them ─────

const body = "text-lg leading-[34px] text-[var(--sf-soft)] md:text-[1.2rem]";
// Line the ruled background up just under each 34px line of text.
const page =
  "sf-paper relative rounded-[36px] px-6 pt-[68px] pb-[68px] shadow-[0_30px_60px_-35px_rgba(43,42,38,0.5)] sm:px-12 md:px-16";
const pageStyle = { backgroundPosition: "0 27px" };

export function StoryLetter() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.from("[data-note]", {
          y: 70,
          rotate: -10,
          scale: 0.9,
          opacity: 0,
          duration: 0.9,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: "[data-note]", start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="py-24 lg:py-32 bg-[var(--sf-peach)]/45">
      <div className="mx-auto max-w-3xl px-5 sm:px-10">
        {/* Page one */}
        <div className={page} style={{ ...pageStyle, rotate: "-0.6deg" }}>
          <span className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />
          <Reveal className="space-y-[34px]" stagger={0.12} y={24}>
            {STORY.before.map((p) => (
              <p key={p} className={body}>
                {p}
              </p>
            ))}
          </Reveal>
        </div>

        {/* Pull quote sticky note: GSAP animates the wrapper, the note keeps its CSS tilt + wiggle. */}
        <div data-note className="relative z-10 -my-8 md:-mx-14">
          <figure
            className="sf-wiggle relative rounded-md bg-[var(--sf-butter)] p-7 pt-9 shadow-[0_24px_50px_-26px_rgba(43,42,38,0.55)] md:p-10 md:pt-12"
            style={{ rotate: "-2deg" }}
          >
            <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-1 rounded-sm bg-white/70" aria-hidden="true" />
            <Draw className="absolute -right-5 -top-7 hidden w-14 md:block" delay={0.6}>
              <Star />
            </Draw>
            <blockquote className="sf-display text-2xl leading-snug tracking-[-0.02em] text-[var(--sf-ink)] md:text-[2.1rem] md:leading-[1.2]">
              {STORY.quote}
            </blockquote>
          </figure>
        </div>

        {/* Page two */}
        <div className={page} style={{ ...pageStyle, rotate: "0.5deg" }}>
          <Reveal className="space-y-[34px]" stagger={0.12} y={24}>
            {STORY.after.map((runs) => (
              <p key={runs[0].text} className={body}>
                <Runs runs={runs} highlightClassName={highlight} />
              </p>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Founders ────────────────────────────────────────────────────────────────

const CARD_TILTS = [-1.5, 1.5];
const CARD_TAPE = ["var(--sf-butter)", "var(--sf-sky)"];
const ROLE_TINTS = ["coral", "sage"] as const;

export function Founders() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--sf-mint)]/45">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="text-center">
          <Pill tint="butter">👋 {FOUNDERS.badge}</Pill>
          <WordsReveal text={FOUNDERS.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
        </div>

        <Reveal className="mt-14 grid gap-10 sm:grid-cols-2 lg:gap-12" stagger={0.12} y={50}>
          {FOUNDERS.members.map((m, i) => (
            <article key={m.name}>
              <div
                className={`group relative h-full rounded-[36px] bg-white p-4 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.5)] sm:p-5 ${springy} hover:!rotate-0`}
                style={{ rotate: `${CARD_TILTS[i]}deg` }}
              >
                <span
                  className="absolute -top-3 left-1/2 z-10 h-7 w-24 -translate-x-1/2 -rotate-2 rounded-sm opacity-90"
                  style={{ background: CARD_TAPE[i] }}
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[26px]">
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1152px) 50vw, 520px"
                  />
                </div>
                <div className="px-2 pt-6 pb-3 sm:px-3">
                  <h3 className="sf-display text-3xl leading-tight">{m.name}</h3>
                  <Pill tint={ROLE_TINTS[i]} className="mt-3">
                    {m.role}
                  </Pill>
                  <p className="mt-5 leading-relaxed text-[var(--sf-soft)]">{m.description}</p>
                </div>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
