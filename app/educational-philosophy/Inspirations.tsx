"use client";

import { Fragment } from "react";
import { Reveal, Runs, WordsReveal } from "@/app/_garden/motion";
import { Arrow, Draw, Leaf, Pill, type Tint } from "@/app/_garden/ui";
import { INSPIRATIONS } from "./content";

const springy = "transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const highlight =
  "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]";

/** Per approach: card tilt, tape colour, check colour, and tagline colour. */
const STYLES = [
  { tilt: -1.5, tape: "var(--sf-coral)", tick: "var(--sf-coral-deep)", pill: "coral" },
  { tilt: 1, tape: "var(--sf-mint)", tick: "var(--sf-sage-deep)", pill: "sage" },
  { tilt: -1, tape: "var(--sf-sky)", tick: "#2d5d86", pill: "sky" },
] as const satisfies { tilt: number; tape: string; tick: string; pill: Tint }[];

const Tick = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path data-draw d="M4 13 L10 18 L20 6" />
  </svg>
);

/** Montessori, Waldorf and Reggio Emilia: three taped cards of principles. */
export default function Inspirations() {
  return (
    <section id="three-inspirations" className="py-24 lg:py-32 bg-[var(--sf-sky)]/35">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sky">📚 {INSPIRATIONS.badge}</Pill>
          <WordsReveal text={INSPIRATIONS.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">
              <Runs runs={INSPIRATIONS.intro} highlightClassName={highlight} />
            </p>
          </Reveal>
        </div>

        {/* Montessori · Waldorf · Reggio Emilia → Sage Field */}
        <Reveal className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-3" stagger={0.08} y={20}>
          {INSPIRATIONS.chain.map((name, i) => (
            <Fragment key={name}>
              <Pill tint={STYLES[i].pill} className="text-base">
                {name}
              </Pill>
              {i < INSPIRATIONS.chain.length - 1 && (
                <span className="font-extrabold text-[var(--sf-soft)]">·</span>
              )}
            </Fragment>
          ))}
          <span className="flex items-center gap-1">
            <Draw className="hidden w-12 -rotate-12 sm:block" delay={0.3}>
              <Arrow />
            </Draw>
            <span className="sm:sr-only font-extrabold text-[var(--sf-soft)]">→</span>
          </span>
          <span className="rounded-full bg-[var(--sf-coral)] px-5 py-2 text-base font-extrabold text-white shadow-[0_4px_0_0_var(--sf-coral-deep)]">
            {INSPIRATIONS.chainResult}
          </span>
        </Reveal>

        <Reveal className="mt-16 grid items-stretch gap-10 lg:grid-cols-3 lg:gap-8" stagger={0.12} y={50}>
          {INSPIRATIONS.approaches.map((a, i) => {
            const s = STYLES[i];
            const headingId = `approach-heading-${a.id}`;
            return (
              <article key={a.id} aria-labelledby={headingId} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-[32px] bg-white p-7 pt-9 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.5)] lg:p-8 lg:pt-10 ${springy} hover:!rotate-0`}
                  style={{ rotate: `${s.tilt}deg` }}
                >
                  <span
                    className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-2 rounded-sm opacity-80"
                    style={{ background: s.tape }}
                    aria-hidden="true"
                  />
                  <h3 id={headingId} className="sf-display text-3xl leading-tight">
                    {a.label}
                  </h3>
                  <p className="sf-hand mt-1 text-xl leading-snug" style={{ color: s.tick }}>
                    {a.tagline}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {a.principles.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <Draw className="mt-0.5 shrink-0" delay={0.2}>
                          <Tick color={s.tick} />
                        </Draw>
                        <span className="leading-relaxed text-[var(--sf-soft)]">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </Reveal>

        {/* How we weave them together */}
        <Reveal className="mx-auto mt-20 max-w-4xl" y={40}>
          <div
            className="sf-paper relative rounded-[36px] px-7 py-10 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.5)] sm:px-12 md:px-14"
            style={{ rotate: "-0.5deg" }}
          >
            <span className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />
            <Draw className="absolute -right-4 -top-6 hidden w-16 md:block" delay={0.4}>
              <Leaf />
            </Draw>
            <p className="sf-display text-3xl md:text-4xl">{INSPIRATIONS.weaveTitle}</p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--sf-soft)] md:text-[1.15rem]">{INSPIRATIONS.weaveBody}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
