"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, MQ_DESKTOP_MOTION, MQ_MOTION } from "@/app/_home-variants/gsap";
import { CONTINUITY, PARTNERSHIP, PHOTO_POOL } from "@/app/_home-variants/content";
import { Reveal, Runs, WordsReveal } from "@/app/_home-variants/motion";
import { Label } from "../ui";

// ─── Community Continuity — split scroll ─────────────────────────────────────

const LEFT = [CONTINUITY.roots[0].image, PHOTO_POOL[2], PHOTO_POOL[5], CONTINUITY.roots[1].image, PHOTO_POOL[8], PHOTO_POOL[11]];
const RIGHT = [PHOTO_POOL[13], CONTINUITY.roots[2].image, PHOTO_POOL[16], PHOTO_POOL[18], CONTINUITY.roots[3].image, PHOTO_POOL[24]];

export function Continuity() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_DESKTOP_MOTION, () => {
        const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.6 };
        gsap.fromTo("[data-col-up]", { yPercent: 0 }, { yPercent: -48, ease: "none", scrollTrigger: st });
        gsap.fromTo("[data-col-down]", { yPercent: -48 }, { yPercent: 0, ease: "none", scrollTrigger: st });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const column = (imgs: string[], attr: Record<string, string>) => (
    <div className="hidden lg:block h-screen overflow-hidden">
      <div {...attr} className="flex flex-col gap-4 py-4">
        {[...imgs, ...imgs].map((src, i) => (
          <div key={`${src}-${i}`} className="relative aspect-[4/5] overflow-hidden rounded-[22px]" data-cursor="View">
            <Image src={src} alt="" fill className="object-cover" sizes="25vw" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section ref={ref} className="relative bg-[var(--h2-forest)] lg:h-[260vh]">
      <div className="lg:sticky lg:top-0 lg:h-screen grid lg:grid-cols-[1fr_1.75fr_1fr] gap-6 px-6 sm:px-10 lg:px-6">
        {column(LEFT, { "data-col-up": "" })}
        <div className="flex flex-col justify-center py-24 lg:pt-28 lg:pb-6 lg:px-4">
          <Label n="04">{CONTINUITY.badge}</Label>
          <h2 className="h2-display mt-5 text-5xl md:text-7xl lg:text-[3.4rem] xl:text-6xl leading-[0.95]">{CONTINUITY.heading}</h2>
          <p className="h2-display italic mt-2 text-2xl text-[var(--h2-sage)]">{CONTINUITY.subtitle}</p>
          <p className="mt-4 leading-relaxed text-[var(--h2-mute)]">
            <Runs runs={CONTINUITY.body} highlightClassName="text-[var(--h2-cream)] font-semibold" />
          </p>
          <div className="mt-5 rounded-[22px] h2-glass p-5 text-sm">
            <p className="h2-label text-[var(--h2-coral)]">{CONTINUITY.whyTitle}</p>
            <ul className="mt-3 space-y-1.5">
              {CONTINUITY.why.map((w) => (
                <li key={w.lead} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--h2-coral)]" />
                  <span>
                    <strong className="font-semibold">{w.lead}</strong> <span className="text-[var(--h2-mute)]">{w.rest}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2">
            {CONTINUITY.roots.map((r) => (
              <div key={r.title} className="rounded-2xl border border-[var(--h2-line)] p-3">
                <p className="text-sm font-semibold">
                  <span aria-hidden="true">{r.icon}</span> {r.title}
                </p>
                <p className="mt-1 text-xs text-[var(--h2-mute)]">{r.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONTINUITY.outcomes.map((o) => (
              <span key={o} className="rounded-full bg-[var(--h2-cream)] px-4 py-2 text-xs font-bold text-[var(--h2-night)]">
                {o}
              </span>
            ))}
          </div>
        </div>
        {column(RIGHT, { "data-col-down": "" })}
      </div>
    </section>
  );
}

// ─── Family Partnership — three circles converge ─────────────────────────────

export function Partnership() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const st = { trigger: ref.current, start: "top 85%", end: "center 55%", scrub: 0.8 };
        gsap.from("[data-c='school']", { yPercent: -45, ease: "none", scrollTrigger: st });
        gsap.from("[data-c='student']", { xPercent: -45, yPercent: 25, ease: "none", scrollTrigger: st });
        gsap.from("[data-c='family']", { xPercent: 45, yPercent: 25, ease: "none", scrollTrigger: st });
        gsap.from("[data-center]", { opacity: 0, scale: 0.6, ease: "none", scrollTrigger: { ...st, start: "top 50%", end: "center 50%" } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const pos: Record<string, string> = {
    school: "left-1/2 top-0 -ml-[30%]",
    student: "left-0 bottom-0",
    family: "right-0 bottom-0",
  };

  return (
    <section className="bg-[var(--h2-night)] py-28 lg:py-40 overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[520px]">
          {PARTNERSHIP.nodes.map((n) => (
            <div
              key={n.id}
              data-c={n.id}
              className={`absolute flex h-[60%] w-[60%] flex-col items-center justify-center rounded-full border border-[var(--h2-coral)]/50 bg-[var(--h2-coral)]/[0.07] text-center mix-blend-screen ${pos[n.id]}`}
            >
              <span className={`flex flex-col items-center ${n.id === "school" ? "-translate-y-[35%]" : n.id === "student" ? "-translate-x-[22%] translate-y-[22%]" : "translate-x-[22%] translate-y-[22%]"}`}>
                <span className="text-2xl" aria-hidden="true">{n.icon}</span>
                <span className="h2-display text-3xl">{n.label}</span>
                <span className="h2-label mt-1 text-[0.6rem] text-[var(--h2-mute)]">{n.description}</span>
              </span>
            </div>
          ))}
          <span data-center className="absolute left-1/2 top-[57%] -translate-x-1/2 -translate-y-1/2 h2-display italic text-3xl text-[var(--h2-coral)]">
            {PARTNERSHIP.center}
          </span>
        </div>
        <div>
          <Label n="05">{PARTNERSHIP.badge}</Label>
          <WordsReveal text={PARTNERSHIP.heading} className="h2-display mt-6 text-6xl md:text-7xl leading-[0.95]" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h2-mute)]">{PARTNERSHIP.body}</p>
            <div className="mt-8 border-l border-[var(--h2-coral)] pl-6">
              <p className="h2-display text-2xl md:text-3xl">{PARTNERSHIP.calloutTitle}</p>
              <p className="mt-3 leading-relaxed text-[var(--h2-mute)]">{PARTNERSHIP.calloutBody}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {PARTNERSHIP.tiles.map((t) => (
                <span key={t} className="rounded-full border border-[var(--h2-line)] px-5 py-2.5 text-sm font-semibold">
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
