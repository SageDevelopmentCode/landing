"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Marquee, Reveal, useMediaQuery } from "./motion";
import { Arrow, Draw, Leaf, Pill, Sun, type Tint } from "./ui";

/**
 * Building blocks shared by the program pages (school year, homeschool).
 * They hold no copy; each page passes its own from its content file.
 */

const NOTES = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)"];
const NOTE_TILTS = [-2.5, 1.5, -1, 2];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];
const PHOTO_TILTS = [-5, 3, -2, 6, -4, 2, -3];

/** Key facts (label + value) as a row of taped sticky notes. */
export function DetailNotes({ details, className = "" }: { details: { label: string; value: string }[]; className?: string }) {
  return (
    <Reveal className={`grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-4 ${className}`} stagger={0.08} y={40}>
      {details.map((d, i) => (
        <div
          key={d.label}
          className="sf-wiggle relative rounded-md p-5 pt-7 text-center shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]"
          style={{ background: NOTES[i % NOTES.length], rotate: `${NOTE_TILTS[i % NOTE_TILTS.length]}deg` }}
        >
          <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-ink)]/60">{d.label}</p>
          <p className="sf-display mt-1 text-xl leading-tight md:text-2xl">{d.value}</p>
        </div>
      ))}
    </Reveal>
  );
}

/**
 * Taped polaroids you can drag around on desktop (fine pointers), and an
 * endless Marquee row on smaller screens.
 */
export function PhotoScatter({
  photos,
  alt,
  hint,
  featureFirst = true,
}: {
  photos: string[];
  alt: string;
  hint?: string;
  /** Make the first polaroid larger (default). Turn off for even rows of four. */
  featureFirst?: boolean;
}) {
  const area = useRef<HTMLDivElement>(null);
  const canDrag = useMediaQuery("(pointer: fine)");
  return (
    <div>
      {hint && (
        <p className="sf-hand mb-6 hidden items-center justify-center gap-2 text-xl text-[var(--sf-coral-deep)] lg:flex" aria-hidden="true">
          {hint}
          <Draw className="w-14 rotate-12">
            <Arrow />
          </Draw>
        </p>
      )}
      <div ref={area} className="relative hidden flex-wrap justify-center gap-x-6 gap-y-10 py-6 lg:flex">
        {photos.map((src, i) => (
          <motion.figure
            key={src}
            drag={canDrag}
            dragConstraints={area}
            dragElastic={0.2}
            whileHover={{ rotate: 0, scale: 1.04, zIndex: 20 }}
            whileDrag={{ scale: 1.08, rotate: 0, zIndex: 30, cursor: "grabbing" }}
            initial={{ opacity: 0, y: 60, rotate: PHOTO_TILTS[i % PHOTO_TILTS.length] * 2 }}
            whileInView={{ opacity: 1, y: 0, rotate: PHOTO_TILTS[i % PHOTO_TILTS.length] }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 160, damping: 16, delay: i * 0.06 }}
            className={`sf-polaroid relative select-none ${featureFirst && i === 0 ? "w-[30%]" : "w-[23%]"} ${canDrag ? "cursor-grab" : ""}`}
            style={{ rotate: PHOTO_TILTS[i % PHOTO_TILTS.length] }}
          >
            <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-2 rounded-sm opacity-90" style={{ background: TAPE[i % TAPE.length] }} aria-hidden="true" />
            <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-[3px]">
              <Image src={src} alt={alt} fill draggable={false} className="object-cover" sizes="(max-width: 1280px) 30vw, 380px" />
            </div>
          </motion.figure>
        ))}
      </div>
      <div className="-mx-6 -rotate-2 sm:-mx-10 lg:hidden">
        <Marquee duration={45} trackClassName="py-4">
          {photos.map((src, i) => (
            <div key={src} className="sf-polaroid relative mx-3 w-60 shrink-0 sm:w-72" style={{ rotate: `${PHOTO_TILTS[i % PHOTO_TILTS.length] / 2}deg` }}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                <Image src={src} alt={alt} fill className="object-cover" sizes="288px" />
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
}

/** Emoji + title + description cards in a 2-column grid. */
export function PillarCards({
  pillars,
  className = "",
}: {
  pillars: { icon: string; title: string; description: string }[];
  className?: string;
}) {
  const BG = ["bg-[var(--sf-butter)]", "bg-[var(--sf-mint)]", "bg-[var(--sf-sky)]", "bg-[var(--sf-lav)]"];
  return (
    <Reveal className={`grid gap-6 sm:grid-cols-2 ${className}`} stagger={0.1} y={50}>
      {pillars.map((p, i) => (
        <div key={p.title}>
          <article
            className="group h-full rounded-[28px] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:rotate-0"
            style={{ rotate: `${[-1.5, 1, 1.5, -1][i % 4]}deg` }}
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl transition-transform duration-500 group-hover:rotate-12 ${BG[i % BG.length]}`} aria-hidden="true">
              {p.icon}
            </span>
            <h3 className="sf-display mt-5 text-2xl">{p.title}</h3>
            <p className="mt-2 leading-relaxed text-[var(--sf-soft)]">{p.description}</p>
          </article>
        </div>
      ))}
    </Reveal>
  );
}

/** Closing call-to-action card with tape and a sun doodle. */
export function CtaCard({
  heading,
  body,
  badge,
  tint = "coral",
  children,
}: {
  heading: string;
  body: string;
  badge?: ReactNode;
  tint?: Tint;
  children: ReactNode;
}) {
  return (
    <Reveal y={50}>
      <div className="relative rounded-[40px] bg-white p-8 text-center shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-14">
        <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
        <Draw className="absolute -right-6 -top-8 hidden w-20 md:block" delay={0.3}>
          <Sun />
        </Draw>
        {badge && <Pill tint={tint}>{badge}</Pill>}
        <h2 className={`sf-display text-4xl md:text-5xl ${badge ? "mt-5" : ""}`}>{heading}</h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[var(--sf-soft)]">{body}</p>
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">{children}</div>
      </div>
    </Reveal>
  );
}

/** Rounded chips with an emoji, e.g. "📅 1–5 Days/Week". */
export function Chips({ items, className = "" }: { items: { emoji: string; label: string }[]; className?: string }) {
  const BG = ["bg-[var(--sf-butter)]", "bg-[var(--sf-mint)]", "bg-[var(--sf-sky)]", "bg-[var(--sf-lav)]"];
  return (
    <Reveal className={`flex flex-wrap justify-center gap-3 ${className}`} stagger={0.06} y={20}>
      {items.map((c, i) => (
        <span key={c.label} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold ${BG[i % BG.length]}`}>
          <span aria-hidden="true">{c.emoji}</span>
          {c.label}
        </span>
      ))}
    </Reveal>
  );
}

const BLOCK_TINTS = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];

export type WeekScheduleCopy = {
  weekdays: string;
  blocks: readonly string[];
  friday: { title: string; time: string; description: string };
};

/** The Monday–Thursday blocks as tilted sticky notes, plus the coral Field Day Friday card. */
export function WeekSchedule({ schedule }: { schedule: WeekScheduleCopy }) {
  return (
    <div>
      <p className="sf-hand mb-4 text-2xl">{schedule.weekdays}</p>
      <Reveal className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1" stagger={0.12} y={50}>
        {schedule.blocks.map((b, i) => (
          <div
            key={b}
            className={`sf-wiggle relative rounded-md p-5 pt-7 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)] lg:flex lg:items-center lg:gap-5 lg:pt-5 ${["lg:mr-10", "lg:ml-10", "lg:mr-6"][i % 3]}`}
            style={{ background: BLOCK_TINTS[i % BLOCK_TINTS.length], rotate: `${[-2, 1.5, -1][i % 3]}deg` }}
          >
            <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
            <span className="sf-display text-4xl opacity-30 lg:text-5xl" aria-hidden="true">
              {i + 1}
            </span>
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
            <h4 className="sf-display text-3xl">{schedule.friday.title} 🎉</h4>
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-[var(--sf-coral-deep)]">{schedule.friday.time}</span>
          </div>
          <p className="mt-2 text-lg font-semibold">{schedule.friday.description}</p>
        </div>
      </Reveal>
    </div>
  );
}
