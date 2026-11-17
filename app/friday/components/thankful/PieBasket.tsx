"use client";

import { useEffect, useRef, useState } from "react";
import {
  Backpack,
  Check,
  Droplets,
  Footprints,
  Leaf,
  Sandwich,
  Shirt,
  SprayCan,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Reveal, WordsReveal } from "@/app/_garden/motion";
import { EVENT, leafConfetti } from "./data";
import { AutumnPill } from "./ui";

const PACKING_LIST: { icon: LucideIcon; item: string }[] = [
  { icon: Footprints, item: "Closed-toe shoes" },
  { icon: Sun, item: "Sun hat or cap" },
  { icon: SprayCan, item: "Sunscreen (applied before drop-off)" },
  { icon: Droplets, item: "Water bottle, labeled" },
  { icon: Sandwich, item: "Snack + lunch from home" },
  { icon: Shirt, item: "Old clothes for outdoor play" },
  { icon: Backpack, item: "Small backpack for paintings & creations" },
  { icon: Leaf, item: "Optional fall colors or a cozy layer" },
];

const C = 120;
const R = 98;
const point = (deg: number, r = R) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)]
    .map((n) => n.toFixed(2))
    .join(" ");
};
const slicePath = (i: number, n: number) => {
  const a0 = (360 / n) * i;
  const a1 = (360 / n) * (i + 1);
  return `M${C} ${C} L${point(a0)} A${R} ${R} 0 0 1 ${point(a1)} Z`;
};
const crustPath = (i: number, n: number) => {
  const a0 = (360 / n) * i + 1;
  const a1 = (360 / n) * (i + 1) - 1;
  return `M${point(a0, R - 6)} A${R - 6} ${R - 6} 0 0 1 ${point(a1, R - 6)}`;
};

function Pie({ packed, total }: { packed: Set<number>; total: number }) {
  const all = packed.size === total;
  return (
    <svg viewBox="0 0 240 240" className="w-full overflow-visible" aria-hidden>
      <circle cx={C} cy={C + 6} r="116" fill="#000" opacity="0.08" />
      <circle cx={C} cy={C} r="116" fill="#fff" />
      <circle
        cx={C}
        cy={C}
        r="106"
        fill="#F1E4D2"
        stroke="#E2CFB4"
        strokeWidth="3"
      />
      {Array.from({ length: total }).map((_, i) => (
        <path
          key={`guide-${i}`}
          d={`M${C} ${C} L${point((360 / total) * i)}`}
          stroke="#D9C3A3"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      ))}
      {Array.from({ length: total }).map((_, i) => {
        const on = packed.has(i);
        const mid = (360 / total) * (i + 0.5);
        const [cx, cy] = point(mid, 62).split(" ").map(Number);
        return (
          <g
            key={i}
            className="tg-slice"
            style={{
              transform: on ? "scale(1)" : "scale(0.55)",
              opacity: on ? 1 : 0,
            }}
          >
            <path
              d={slicePath(i, total)}
              fill="#D9792E"
              stroke="#B85F1E"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d={crustPath(i, total)}
              stroke="#E8B26A"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="7" fill="#FFF8EF" />
            <circle cx={cx - 2} cy={cy - 2} r="3" fill="#fff" />
          </g>
        );
      })}
      <g
        className="tg-slice"
        style={{
          transform: all ? "scale(1)" : "scale(0)",
          opacity: all ? 1 : 0,
        }}
      >
        <circle
          cx={C}
          cy={C}
          r="20"
          fill="#FFF8EF"
          stroke="#EADBC4"
          strokeWidth="2"
        />
        <path d="M108 118 Q120 100 132 118 Q120 112 108 118 Z" fill="#fff" />
        <path
          d="M120 98 C 124 92, 130 92, 128 86"
          stroke="#6b9474"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function PieBasket() {
  const [packed, setPacked] = useState<Set<number>>(new Set());
  const total = PACKING_LIST.length;
  const allPacked = packed.size === total;

  const toggle = (index: number) =>
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  // Celebrate the moment the last slice lands.
  const wasAllPacked = useRef(false);
  useEffect(() => {
    if (allPacked && !wasAllPacked.current) void leafConfetti({ y: 0.7 });
    wasAllPacked.current = allPacked;
  }, [allPacked]);

  return (
    <section className="bg-[#fff8ef] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <AutumnPill tone="sage">🧺 Packing List</AutumnPill>
          <WordsReveal
            text="Pack Your Basket"
            className="sf-display mt-5 text-5xl text-[var(--sf-ink)] md:text-7xl"
          />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">
            every item packed bakes another slice 🥧
          </p>
          <p className="mt-5 text-lg leading-relaxed text-[var(--sf-soft)]">
            Tap each item to check it off — don&apos;t forget anything for{" "}
            {EVENT.title}!
          </p>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_380px]">
          <Reveal className="grid gap-3 sm:grid-cols-2" stagger={0.05} y={30}>
            {PACKING_LIST.map(({ icon: Icon, item }, i) => {
              const isPacked = packed.has(i);
              // Reveal (GSAP) animates this plain wrapper; the button keeps its CSS transitions.
              return (
                <div key={item} className="h-full">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isPacked}
                    onClick={() => toggle(i)}
                    className={`flex h-full w-full cursor-pointer items-center gap-4 rounded-[22px] border-2 p-4 text-left font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/30 ${
                      isPacked
                        ? "border-[#6b9474] bg-[var(--sf-mint)]/60 text-[var(--sf-sage-deep)]"
                        : "border-[var(--sf-ink)]/10 bg-white text-[var(--sf-ink)] shadow-[0_10px_24px_-18px_rgba(43,42,38,0.45)] hover:-translate-y-0.5 hover:border-[#EE8434]/50"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-all duration-300 ${
                        isPacked
                          ? "rotate-[-8deg] bg-[#6b9474] text-white"
                          : "bg-[#FFE3CC] text-[#C4621C]"
                      }`}
                      aria-hidden
                    >
                      {isPacked ? (
                        <Check className="h-6 w-6" strokeWidth={3.5} />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </span>
                    <span
                      className={
                        isPacked
                          ? "line-through decoration-2 decoration-[#6b9474]/60"
                          : ""
                      }
                    >
                      {item}
                    </span>
                  </button>
                </div>
              );
            })}
          </Reveal>

          <div className="mx-auto w-full max-w-[340px] text-center">
            <Pie packed={packed} total={total} />
            <p
              className="sf-display mt-5 text-3xl text-[var(--sf-ink)]"
              aria-live="polite"
            >
              {packed.size} / {total} packed
            </p>
            <p
              className={`sf-hand mt-1 text-2xl transition-colors ${allPacked ? "text-[#C4621C]" : "text-[var(--sf-soft)]"}`}
            >
              {allPacked
                ? "All packed! See you Friday."
                : "keep going — the pie’s baking!"}
            </p>
          </div>
        </div>

        <p className="mx-auto mt-14 w-fit rounded-full bg-[var(--sf-ink)] px-6 py-3 text-center text-sm font-bold text-white">
          Questions? Text or call us:{" "}
          <a
            href="tel:+15126775872"
            className="text-[#F4C04E] underline underline-offset-4"
          >
            (512) 677-5872
          </a>
        </p>
      </div>
    </section>
  );
}
