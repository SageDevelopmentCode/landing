"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP, MQ_MOTION, MQ_DESKTOP_MOTION } from "@/app/_home-variants/gsap";
import { CONTINUITY, PARTNERSHIP, PHOTO_POOL } from "@/app/_home-variants/content";
import { Marquee, Reveal, Runs, WordsReveal } from "@/app/_home-variants/motion";
import { Pill } from "../ui";

// ─── Community Continuity — split scroll, Garden style ───────────────────────

const R = CONTINUITY.roots.map((r) => r.image);
const LEFT = [R[0], PHOTO_POOL[10], PHOTO_POOL[13], R[1], PHOTO_POOL[16], PHOTO_POOL[19]];
const RIGHT = [PHOTO_POOL[11], R[2], PHOTO_POOL[14], PHOTO_POOL[17], R[3], PHOTO_POOL[21]];
const TAPES = ["var(--h3-butter)", "var(--h3-mint)", "var(--h3-sky)", "var(--h3-lav)"];
const ROOT_TINTS = ["bg-[var(--h3-butter)]", "bg-[var(--h3-mint)]", "bg-white", "bg-[var(--h3-lav)]"];
const OUTCOME_TINTS = ["bg-[var(--h3-coral)]/30", "bg-[var(--h3-mint)]", "bg-white", "bg-[var(--h3-lav)]"];

function Polaroid({ src, i, alt, className = "" }: { src: string; i: number; alt: string; className?: string }) {
  const tilt = [-3, 2.5, -1.5, 3, -2.5, 1.5][i % 6];
  return (
    <div
      className={`h3-polaroid relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:!rotate-0 hover:-translate-y-1 hover:scale-[1.03] ${className}`}
      style={{ rotate: `${tilt}deg` }}
    >
      <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPES[i % 4] }} />
      <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 208px, 24vw" />
      </div>
    </div>
  );
}

export function Continuity() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_DESKTOP_MOTION, () => {
        const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.6 };
        gsap.fromTo("[data-col-up]", { yPercent: 0 }, { yPercent: -48, ease: "none", scrollTrigger: st });
        gsap.fromTo("[data-col-down]", { yPercent: -48 }, { yPercent: 0, ease: "none", scrollTrigger: st });

        // Check off each "Why It Matters" line in turn as you scroll through.
        const tl = gsap.timeline({ scrollTrigger: st, defaults: { ease: "none" } });
        gsap.utils.toArray<HTMLElement>("[data-why]").forEach((row, i) => {
          const at = 0.08 + i * 0.28;
          tl.fromTo(row, { opacity: 0.35 }, { opacity: 1, duration: 0.12 }, at)
            .fromTo(row.querySelector("[data-tick]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.12 }, at)
            .fromTo(row.querySelector("[data-mark]"), { backgroundSize: "0% 40%" }, { backgroundSize: "100% 40%", duration: 0.14 }, at + 0.04);
        });
        tl.to({}, { duration: 0.1 }, 1);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const column = (imgs: string[], attr: Record<string, string>, offset: number) => (
    <div className="hidden lg:block h-screen overflow-hidden px-3">
      <div {...attr} className="flex flex-col gap-10 py-8">
        {[...imgs, ...imgs].map((src, i) => (
          <Polaroid key={`${src}-${i}`} src={src} i={i + offset} alt="" />
        ))}
      </div>
    </div>
  );

  return (
    <section ref={ref} className="relative bg-[var(--h3-sky)]/35 lg:h-[260vh]">
      <div className="lg:sticky lg:top-0 lg:h-screen grid lg:grid-cols-[1fr_1.75fr_1fr] gap-6 lg:px-6">
        {column(LEFT, { "data-col-up": "" }, 0)}
        <div className="flex flex-col justify-center px-6 py-24 sm:px-10 lg:px-4 lg:pt-28 lg:pb-6 text-center">
          <div>
            <Pill tint="sky">🤝 {CONTINUITY.badge}</Pill>
          </div>
          <h2 className="h3-display mt-4 text-5xl md:text-6xl lg:text-[3.4rem] xl:text-6xl leading-[0.95]">{CONTINUITY.heading}</h2>
          <p className="h3-hand mt-2 text-2xl text-[var(--h3-sage-deep)]">{CONTINUITY.subtitle}</p>
          <p className="mt-3 leading-relaxed text-[var(--h3-soft)]">
            <Runs runs={CONTINUITY.body} highlightClassName="font-extrabold text-[var(--h3-ink)] bg-[linear-gradient(transparent_60%,var(--h3-sky)_60%)]" />
          </p>

          {/* Why It Matters sticky note */}
          <div className="relative mx-auto mt-5 w-full max-w-lg -rotate-1 rounded-md bg-[var(--h3-butter)] p-5 pt-6 text-left shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]">
            <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2 rounded-sm bg-white/70" aria-hidden="true" />
            <p className="h3-hand text-2xl leading-none">{CONTINUITY.whyTitle}</p>
            <ul className="mt-3 space-y-2">
              {CONTINUITY.why.map((w) => (
                <li key={w.lead} data-why className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10.5" fill="#fff" opacity="0.7" />
                    <path data-tick pathLength={1} strokeDasharray="1 2" d="M6.5 12.5 L10.5 16.5 L17.5 7.5" stroke="var(--h3-sage-deep)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>
                    <strong
                      data-mark
                      className="font-extrabold"
                      style={{
                        backgroundImage: "linear-gradient(rgba(242,154,143,0.45), rgba(242,154,143,0.45))",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "100% 40%",
                        backgroundPosition: "0 88%",
                      }}
                    >
                      {w.lead}
                    </strong>{" "}
                    <span className="text-[var(--h3-soft)]">{w.rest}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roots */}
          <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2 text-left">
            {CONTINUITY.roots.map((r, i) => (
              <div key={r.title} className={`rounded-2xl p-3 shadow-[0_6px_0_0_rgba(43,42,38,0.06)] ${ROOT_TINTS[i]}`}>
                <p className="text-sm font-extrabold leading-tight">
                  <span aria-hidden="true">{r.icon}</span> {r.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--h3-soft)]">{r.description}</p>
              </div>
            ))}
          </div>

          {/* Outcomes */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CONTINUITY.outcomes.map((o, i) => (
              <span key={o} className={`rounded-full px-4 py-2 text-sm font-extrabold ${OUTCOME_TINTS[i]}`}>
                {o}
              </span>
            ))}
          </div>
        </div>
        {column(RIGHT, { "data-col-down": "" }, 3)}
      </div>

      {/* Phones: photos as a polaroid row */}
      <div className="pb-20 lg:hidden" aria-hidden="true">
        <Marquee duration={45} trackClassName="items-center py-6">
          {[...LEFT, ...RIGHT].map((src, i) => (
            <div key={`${src}-m${i}`} className="mr-6 w-44 shrink-0">
              <Polaroid src={src} i={i} alt="" />
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

const NODE_TINT: Record<string, string> = {
  school: "bg-[var(--h3-butter)]",
  student: "bg-[var(--h3-mint)]",
  family: "bg-[var(--h3-lav)]",
};
const NODE_POS: Record<string, string> = {
  school: "left-1/2 top-[6%] -ml-[17%]",
  student: "left-[2%] bottom-[8%]",
  family: "right-[2%] bottom-[8%]",
};

export function Partnership() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.fromTo(
          "[data-loop]",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ref.current, start: "top 80%", end: "center 50%", scrub: 0.6 } },
        );
        gsap.from("[data-bubble]", { scale: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.15, scrollTrigger: { trigger: ref.current, start: "top 75%", once: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[500px]">
          <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path
              data-loop
              pathLength={1}
              strokeDasharray="1 2"
              d="M250 85 C 380 90, 440 300, 400 395 C 360 470, 140 470, 100 395 C 60 300, 120 80, 250 85 Z"
              stroke="var(--h3-coral)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          {PARTNERSHIP.nodes.map((n) => (
            <div key={n.id} data-bubble className={`absolute w-[34%] ${NODE_POS[n.id]}`}>
              <button
                type="button"
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                className={`flex aspect-square w-full flex-col items-center justify-center rounded-full shadow-[0_14px_30px_-14px_rgba(43,42,38,0.5)] transition-transform duration-300 cursor-default ${NODE_TINT[n.id]} ${hover === n.id ? "scale-110" : ""}`}
              >
                <span className="text-4xl" aria-hidden="true">{n.icon}</span>
                <span className="h3-display text-2xl">{n.label}</span>
                <span className="h3-hand text-base text-[var(--h3-soft)]">{n.description}</span>
              </button>
            </div>
          ))}
          <span className="h3-hand absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 -rotate-6 text-4xl text-[var(--h3-coral-deep)]">{PARTNERSHIP.center}</span>
        </div>
        <div>
          <Pill tint="lav">🏡 {PARTNERSHIP.badge}</Pill>
          <WordsReveal text={PARTNERSHIP.heading} className="h3-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h3-soft)]">{PARTNERSHIP.body}</p>
            <div className="relative mt-8 rounded-[28px] bg-[var(--h3-peach)]/70 p-7">
              <p className="h3-display text-2xl">{PARTNERSHIP.calloutTitle}</p>
              <p className="mt-3 leading-relaxed text-[var(--h3-soft)]">{PARTNERSHIP.calloutBody}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {PARTNERSHIP.tiles.map((t, i) => (
                <span key={t} className={`rounded-full px-5 py-2.5 text-sm font-extrabold ${["bg-[var(--h3-butter)]", "bg-[var(--h3-mint)]", "bg-[var(--h3-sky)]"][i]}`}>
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
