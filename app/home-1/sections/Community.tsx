"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, MQ_MOTION } from "@/app/_home-variants/gsap";
import { CONTINUITY, PARTNERSHIP, PHOTO_POOL } from "@/app/_home-variants/content";
import { PinnedCollage, Reveal, Runs, WordsReveal } from "@/app/_home-variants/motion";
import { Badge, Chapter } from "../ui";

// ─── Community Continuity — gps.edu pinned collage ───────────────────────────

const PILE = CONTINUITY.roots.slice(0, 3).map((r) => ({ src: r.image, alt: r.title }));
const GRID = PHOTO_POOL.slice(0, 13).map((src, i) => ({ src, alt: `Life at Sage Field ${i + 1}` }));

export function Continuity() {
  const intro = (
    <div className="mx-auto max-w-3xl text-center">
      <span className="h1-eyebrow block text-[var(--h1-moss)]" aria-hidden="true">
        life in the
      </span>
      <span className="h1-script block text-[22vw] md:text-[9rem] leading-none text-[var(--h1-sage)] -mt-2 md:-mt-6 mb-2" aria-hidden="true">
        field
      </span>
      <Badge>{CONTINUITY.badge}</Badge>
      <h2 className="h1-display mt-5 text-4xl md:text-6xl font-light leading-[1.02]">{CONTINUITY.heading}</h2>
      <p className="h1-display italic text-xl md:text-2xl text-[var(--h1-moss)] mt-4">{CONTINUITY.subtitle}</p>
      <p className="mt-6 text-lg leading-relaxed text-[var(--h1-ink)]/75">
        <Runs runs={CONTINUITY.body} highlightClassName="text-[var(--h1-coral-deep)] font-semibold" />
      </p>
    </div>
  );

  const captions = CONTINUITY.why.map((w, i) => (
    <div key={w.lead} className="inline-block rounded-2xl bg-[var(--h1-cream)]/95 px-6 py-4 shadow-xl backdrop-blur">
      <span className="h1-eyebrow text-[0.62rem] text-[var(--h1-moss)]">
        {CONTINUITY.whyTitle} · {i + 1}/3
      </span>
      <p className="h1-display mt-1 text-xl md:text-2xl">
        <span className="text-[var(--h1-coral-deep)]">{w.lead}</span> {w.rest}
      </p>
    </div>
  ));

  const outro = (
    <div className="mx-auto max-w-4xl text-center text-white">
      <span className="h1-eyebrow text-[var(--h1-coral)]">{CONTINUITY.whyTitle}</span>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {CONTINUITY.outcomes.map((o) => (
          <span key={o} className="rounded-full bg-white px-6 py-3 h1-display text-lg md:text-xl text-[var(--h1-ink)] shadow-lg">
            {o}
          </span>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        {CONTINUITY.roots.map((r) => (
          <div key={r.title} className="rounded-2xl border border-white/25 bg-black/25 p-5 backdrop-blur-md">
            <span className="text-2xl" aria-hidden="true">{r.icon}</span>
            <p className="mt-2 font-semibold">{r.title}</p>
            <p className="text-sm text-white/75">{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[var(--h1-cream)]">
      <PinnedCollage
        intro={intro}
        pile={PILE}
        captions={captions}
        grid={GRID}
        outro={outro}
        scrimClassName="bg-[#1f2a24]/70"
        captionClassName="text-[var(--h1-ink)]"
      />
    </div>
  );
}

// ─── Family Partnership — self-drawing triangle ──────────────────────────────

const NODE_POS = {
  school: { x: 200, y: 40 },
  student: { x: 40, y: 320 },
  family: { x: 360, y: 320 },
} as const;
const EDGES: [keyof typeof NODE_POS, keyof typeof NODE_POS][] = [
  ["school", "student"],
  ["school", "family"],
  ["student", "family"],
];

export function Partnership() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 70%", once: true } });
        tl.fromTo("[data-edge]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.25, ease: "power2.inOut" })
          .from("[data-pnode]", { scale: 0, opacity: 0, duration: 0.7, stagger: 0.15, ease: "back.out(1.8)", transformOrigin: "50% 50%" }, 0.3)
          .from("[data-center]", { opacity: 0, scale: 0.8, duration: 0.6 }, 1.2);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const active = (a: string, b: string) => !hover || hover === a || hover === b;

  return (
    <section className="bg-[var(--h1-cream)] pb-32">
      <Chapter eyebrow="together we" word="grow" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <div ref={ref} className="relative mx-auto w-full max-w-[460px] aspect-[400/380]">
          <svg viewBox="0 0 400 380" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {EDGES.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                data-edge
                pathLength={1}
                strokeDasharray="1 2"
                x1={NODE_POS[a].x}
                y1={NODE_POS[a].y}
                x2={NODE_POS[b].x}
                y2={NODE_POS[b].y}
                stroke="var(--h1-coral)"
                strokeWidth={active(a, b) ? 2.5 : 1}
                strokeOpacity={active(a, b) ? 1 : 0.3}
                strokeLinecap="round"
                style={{ transition: "stroke-width .4s, stroke-opacity .4s" }}
              />
            ))}
          </svg>
          {PARTNERSHIP.nodes.map((n) => {
            const p = NODE_POS[n.id as keyof typeof NODE_POS];
            const on = hover === n.id;
            return (
              <button
                type="button"
                key={n.id}
                data-pnode
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-default focus:outline-none"
                style={{ left: `${(p.x / 400) * 100}%`, top: `${(p.y / 380) * 100}%` }}
              >
                <span
                  className={`flex h-24 w-24 md:h-28 md:w-28 flex-col items-center justify-center rounded-full transition-all duration-500 ${on ? "bg-[var(--h1-coral)] text-white scale-110 shadow-[0_20px_50px_-15px_rgba(217,119,107,0.9)]" : "bg-white text-[var(--h1-ink)] shadow-[0_15px_40px_-20px_rgba(31,42,36,0.5)]"}`}
                >
                  <span className="text-2xl" aria-hidden="true">{n.icon}</span>
                  <span className="h1-display text-lg">{n.label}</span>
                </span>
                <span className={`mt-3 whitespace-nowrap rounded-full bg-[var(--h1-ink)] px-3 py-1 text-xs font-semibold text-white transition-all duration-500 ${on ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 lg:opacity-0 max-lg:opacity-100"}`}>
                  {n.description}
                </span>
              </button>
            );
          })}
          <span data-center className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 h1-script text-5xl md:text-6xl text-[var(--h1-sage)]">
            {PARTNERSHIP.center}
          </span>
        </div>

        <div>
          <Badge>{PARTNERSHIP.badge}</Badge>
          <WordsReveal text={PARTNERSHIP.heading} className="h1-display mt-5 text-5xl md:text-6xl font-light leading-[1.02]" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h1-ink)]/75">{PARTNERSHIP.body}</p>
            <div className="mt-8 rounded-3xl border-l-4 border-[var(--h1-coral)] bg-white p-7 shadow-[0_20px_60px_-35px_rgba(31,42,36,0.45)]">
              <p className="h1-display text-xl md:text-2xl">{PARTNERSHIP.calloutTitle}</p>
              <p className="mt-3 leading-relaxed text-[var(--h1-ink)]/75">{PARTNERSHIP.calloutBody}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {PARTNERSHIP.tiles.map((t) => (
                <span key={t} className="rounded-full bg-[var(--h1-sage)] px-5 py-2.5 text-sm font-semibold text-white">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
