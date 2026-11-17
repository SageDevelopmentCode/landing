"use client";

import { useState } from "react";
import { Reveal, WordsReveal } from "@/app/_garden/motion";
import CraftArt from "./CraftArt";
import MenuCard from "./MenuCard";
import { CRAFTS, EVENT } from "./data";
import { AutumnPill, btnPumpkin } from "./ui";

function Cutlery({ side }: { side: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 20 120"
      className={`absolute top-1/2 hidden h-28 w-4 -translate-y-1/2 sm:block ${side === "left" ? "-left-7" : "-right-7"}`}
      aria-hidden
    >
      {side === "left" ? (
        <g fill="#B8B2A7">
          <rect x="8" y="40" width="4" height="78" rx="2" />
          <rect x="3" y="2" width="2.5" height="34" rx="1.2" />
          <rect x="8.75" y="2" width="2.5" height="34" rx="1.2" />
          <rect x="14.5" y="2" width="2.5" height="34" rx="1.2" />
          <path d="M3 30 Q10 48 17 30 Z" />
        </g>
      ) : (
        <g fill="#B8B2A7">
          <rect x="8" y="50" width="4" height="68" rx="2" />
          <path d="M8 52 L8 6 Q16 14 16 40 L12 52 Z" />
        </g>
      )}
    </svg>
  );
}

export default function CraftTable({ price, onReserve }: { price: number; onReserve: () => void }) {
  const [served, setServed] = useState<Set<number>>(new Set());
  const [hovered, setHovered] = useState<number | null>(null);
  const all = served.size === CRAFTS.length;

  const serve = (i: number) =>
    setServed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section id="what-we-do" className="scroll-mt-24 bg-[#fff8ef] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <AutumnPill tone="cranberry">🦃 This Friday’s Theme</AutumnPill>
          <WordsReveal
            text={`Five Hours of ${EVENT.title}`}
            className="sf-display mt-5 text-5xl text-[var(--sf-ink)] md:text-7xl"
          />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">tap each plate to serve up a craft!</p>
          <div
            className={`mt-6 inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-extrabold transition-colors duration-300 ${
              all ? "bg-[#6b9474] text-white" : "bg-white text-[var(--sf-ink)] shadow-[0_6px_20px_-12px_rgba(43,42,38,0.45)]"
            }`}
            aria-live="polite"
          >
            <span className="flex gap-1.5" aria-hidden>
              {CRAFTS.map((c, i) => (
                <span
                  key={c.id}
                  className="h-3 w-3 rounded-full border-2 transition-all duration-300"
                  style={{
                    borderColor: all ? "#fff" : c.color,
                    backgroundColor: served.has(i) ? (all ? "#fff" : c.color) : "transparent",
                  }}
                />
              ))}
            </span>
            {all ? "Table’s set — all three crafts are served! 🎉" : `Crafts served · ${served.size} of ${CRAFTS.length}`}
          </div>
        </div>

        <div className="tg-gingham relative mt-14 rounded-[44px] p-5 shadow-[0_30px_60px_-35px_rgba(74,52,38,0.5)] sm:p-8 lg:p-10">
          <Reveal className="grid gap-6 md:grid-cols-3" stagger={0.12} y={50}>
            {CRAFTS.map((craft, i) => {
              const isServed = served.has(i);
              const active = isServed || hovered === i;
              return (
                <article
                  key={craft.id}
                  className="relative flex flex-col items-center rounded-[32px] bg-white/95 px-6 pb-7 pt-8 text-center shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)]"
                >
                  <span className="sf-hand absolute -top-4 left-1/2 -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-lg bg-[var(--sf-ink)] px-3 py-0.5 text-lg text-white">
                    {craft.plate}
                  </span>
                  <div className="relative">
                    <Cutlery side="left" />
                    <Cutlery side="right" />
                    <button
                      type="button"
                      aria-pressed={isServed}
                      aria-label={`Serve ${craft.title}`}
                      onClick={() => serve(i)}
                      onPointerEnter={() => setHovered(i)}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setHovered(i)}
                      onBlur={() => setHovered(null)}
                      className={`relative grid aspect-square w-48 cursor-pointer place-items-center rounded-full border-[6px] border-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40 sm:w-52 ${
                        isServed ? "-translate-y-2" : "hover:-translate-y-1"
                      }`}
                      style={{
                        backgroundColor: craft.tint,
                        boxShadow: `${isServed ? "0 22px 30px -18px rgba(43,42,38,0.6)" : "0 10px 24px -16px rgba(43,42,38,0.5)"}, inset 0 0 0 12px rgba(0,0,0,0.05)`,
                      }}
                    >
                      <CraftArt id={craft.id} active={active} className="h-[72%] w-[72%]" />
                    </button>
                    {isServed && (
                      <span
                        className="tg-stamp sf-display pointer-events-none absolute -right-3 -top-2 grid h-16 w-16 place-items-center rounded-full border-[3px] border-dashed text-sm leading-none text-white shadow-md"
                        style={{ backgroundColor: craft.color, borderColor: "rgba(255,255,255,0.7)" }}
                        aria-hidden
                      >
                        Yum!
                      </span>
                    )}
                  </div>
                  <h3 className="sf-display mt-6 text-2xl text-[var(--sf-ink)]">{craft.title}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--sf-soft)]">{craft.desc}</p>
                </article>
              );
            })}
          </Reveal>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1fr_400px]">
          <Reveal className="text-center lg:text-left">
            <p className="sf-display text-4xl leading-tight text-[var(--sf-ink)] md:text-5xl">
              All activities included.
              <br />
              <span className="text-[#EE8434]">No enrollment required.</span>
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--sf-soft)]">
              A one-time drop-in for ages {EVENT.ages}. Spots are limited.
            </p>
            <div className="mt-7">
              <button type="button" onClick={onReserve} className={btnPumpkin}>
                Save a Seat at the Table →
              </button>
            </div>
          </Reveal>
          <MenuCard price={price} className="mx-auto w-full max-w-[400px]" />
        </div>
      </div>
    </section>
  );
}
