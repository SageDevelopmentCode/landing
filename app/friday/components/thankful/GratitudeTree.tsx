"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Draw } from "@/app/_garden/ui";
import { WordsReveal } from "@/app/_garden/motion";
import { BG } from "./data";
import { AutumnPill, OvalLeaf } from "./ui";

/** Leaf hooks on the tree, in viewBox units (600 × 480). */
const SLOTS: [number, number][] = [
  [300, 46],
  [150, 56],
  [450, 56],
  [226, 116],
  [374, 116],
  [84, 124],
  [516, 124],
  [300, 184],
  [150, 194],
  [450, 194],
  [46, 238],
  [554, 238],
];
const LEAF_COLORS = [
  "#EE8434",
  "#F4C04E",
  "#B23A48",
  "#C8643B",
  "#E8707D",
  "#9BC27A",
];
const PROMPTS = [
  { word: "my family", emoji: "👨‍👩‍👧" },
  { word: "my friends", emoji: "🤝" },
  { word: "my pets", emoji: "🐶" },
  { word: "yummy food", emoji: "🥧" },
  { word: "sunshine", emoji: "☀️" },
  { word: "my teachers", emoji: "🍎" },
  { word: "my home", emoji: "🏡" },
  { word: "playing outside", emoji: "🌳" },
];
const MAX_WORD = 18;

type HungLeaf = { id: number; word: string; slot: number };

const STARTERS: HungLeaf[] = [
  { id: 0, word: "family", slot: 0 },
  { id: 1, word: "friends", slot: 5 },
  { id: 2, word: "pumpkin pie", slot: 4 },
];

/** [path, stroke width] — thick limbs first, then twigs. */
const BRANCHES: [string, number][] = [
  ["M300 252 C 300 190, 300 110, 300 46", 13],
  ["M296 262 C 240 242, 172 222, 150 194", 13],
  ["M304 262 C 360 242, 428 222, 450 194", 13],
  ["M300 204 C 270 172, 240 150, 226 116", 10],
  ["M300 204 C 330 172, 360 150, 374 116", 10],
  ["M150 194 C 120 170, 96 150, 84 124", 7],
  ["M450 194 C 480 170, 504 150, 516 124", 7],
  ["M190 224 C 120 230, 80 236, 46 238", 7],
  ["M410 224 C 480 230, 520 236, 554 238", 7],
  ["M226 116 C 200 94, 170 80, 150 56", 6],
  ["M374 116 C 400 94, 430 80, 450 56", 6],
];

export default function GratitudeTree() {
  const reduced = useReducedMotion();
  const [leaves, setLeaves] = useState<HungLeaf[]>(STARTERS);
  const [draft, setDraft] = useState("");
  const [shaking, setShaking] = useState(false);
  const nextId = useRef(STARTERS.length);
  const full = leaves.length >= SLOTS.length;

  const hang = (raw: string) => {
    const word = raw.trim().slice(0, MAX_WORD);
    if (!word) return;
    const id = nextId.current++;
    setLeaves((prev) => {
      const used = new Set(prev.map((l) => l.slot));
      const slot = SLOTS.findIndex((_, i) => !used.has(i));
      return slot < 0 ? prev : [...prev, { id, word, slot }];
    });
  };

  const shake = () => {
    setShaking(true);
    setLeaves([]);
    window.setTimeout(() => setShaking(false), 700);
  };

  return (
    <section
      className="relative overflow-hidden py-24 text-[#FFF8EF] lg:py-32"
      style={{ backgroundColor: BG.forest }}
    >
      {/* String lights */}
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-16 w-full"
        aria-hidden
      >
        <path
          d="M0 10 Q 360 80, 720 30 T 1440 20"
          stroke="#1E2E24"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <div
        className="absolute inset-x-0 top-0 flex h-16 justify-around px-4"
        aria-hidden
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="tg-twinkle mt-6 h-3 w-3 rounded-full"
            style={
              {
                backgroundColor: ["#F4C04E", "#EE8434", "#FFF3C4"][i % 3],
                boxShadow: `0 0 14px 4px ${["#F4C04E", "#EE8434", "#FFF3C4"][i % 3]}88`,
                marginTop: `${18 + Math.round(Math.sin(i * 0.9) * 10)}px`,
                "--delay": `${(i % 5) * 0.4}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
        <div>
          <AutumnPill tone="mustard">🍂 Gratitude Tree</AutumnPill>
          <WordsReveal
            text="What are you thankful for?"
            className="sf-display mt-5 text-5xl md:text-6xl"
          />
          <p className="sf-hand mt-3 text-2xl text-[#F4C04E]">
            pick one (or write your own) and hang it on the tree!
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {PROMPTS.map((p) => (
              <button
                key={p.word}
                type="button"
                disabled={full}
                onClick={() => hang(p.word)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F4C04E] hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4C04E]/40 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span aria-hidden>{p.emoji}</span>
                {p.word}
              </button>
            ))}
          </div>

          <form
            className="mt-5 flex gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              hang(draft);
              setDraft("");
            }}
          >
            <label htmlFor="tg-thanks" className="sr-only">
              Something you’re thankful for
            </label>
            <input
              id="tg-thanks"
              value={draft}
              maxLength={MAX_WORD}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="I’m thankful for…"
              autoComplete="off"
              disabled={full}
              className="min-w-0 flex-1 rounded-full border-2 border-white/20 bg-white px-5 py-3 font-bold text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 focus:border-[#F4C04E] focus:outline-none focus:ring-4 focus:ring-[#F4C04E]/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={full || !draft.trim()}
              className="shrink-0 cursor-pointer rounded-full bg-[#F4C04E] px-5 py-3 font-extrabold text-[var(--sf-ink)] shadow-[0_5px_0_0_#B8861A] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#B8861A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4C04E]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hang it 🍂
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="text-sm font-bold text-white/75" aria-live="polite">
              {full
                ? "The tree is full of thanks! Shake it to start again."
                : `${leaves.length} of ${SLOTS.length} leaves on the tree`}
            </p>
            {leaves.length > 0 && (
              <button
                type="button"
                onClick={shake}
                className="cursor-pointer rounded-full border-2 border-white/25 px-4 py-1.5 text-sm font-extrabold transition hover:border-white/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                🌬️ Shake the tree
              </button>
            )}
          </div>
        </div>

        <motion.div
          className="relative mx-auto aspect-[600/480] w-full max-w-[640px]"
          animate={
            shaking && !reduced
              ? { rotate: [0, -2.5, 2.5, -1.5, 1, 0] }
              : { rotate: 0 }
          }
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: "50% 100%" }}
        >
          <Draw className="absolute inset-0 block">
            <svg viewBox="0 0 600 480" className="h-full w-full">
              <ellipse cx="300" cy="474" rx="260" ry="26" fill="#24382B" />
              <path
                d="M270 480 C 284 420, 282 330, 289 252 L 311 252 C 318 330, 316 420, 330 480 Z"
                fill="#7A4E33"
              />
              <path
                d="M292 470 C 296 420, 294 360, 298 300"
                stroke="#5E3A25"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
              <g stroke="#7A4E33" strokeLinecap="round" fill="none">
                {BRANCHES.map(([d, w]) => (
                <path key={d} data-draw d={d} strokeWidth={w} />
              ))}
              </g>
              {[110, 210, 390, 500].map((x, i) => (
                <path
                  key={x}
                  d="M0 0 C -6 -5 -6 -14 0 -20 C 6 -14 6 -5 0 0 Z"
                  transform={`translate(${x} ${462 + (i % 2) * 6}) rotate(${i % 2 ? 70 : -60})`}
                  fill={LEAF_COLORS[i]}
                  opacity="0.85"
                />
              ))}
            </svg>
          </Draw>

          <AnimatePresence>
            {leaves.map((leaf) => {
              const [x, y] = SLOTS[leaf.slot];
              const color = LEAF_COLORS[leaf.slot % LEAF_COLORS.length];
              return (
                <motion.div
                  key={leaf.id}
                  className="absolute"
                  style={{
                    left: `${(x / 600) * 100}%`,
                    top: `${(y / 480) * 100}%`,
                    x: "-50%",
                  }}
                  initial={reduced ? false : { scale: 0, y: -40, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : {
                          y: 260 + (leaf.slot % 3) * 40,
                          x: `${-50 + ((leaf.slot % 4) - 1.5) * 60}%`,
                          rotate: leaf.slot % 2 ? 160 : -140,
                          opacity: 0,
                        }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 14,
                    opacity: { duration: 0.4 },
                  }}
                >
                  <div
                    className="tg-hang flex flex-col items-center"
                    style={
                      {
                        "--delay": `${(leaf.slot % 4) * 0.3}s`,
                      } as React.CSSProperties
                    }
                  >
                    <OvalLeaf
                      color={color}
                      className="h-9 w-7 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] sm:h-12 sm:w-9"
                    />
                    <span className="sf-hand -mt-1 max-w-[8.5rem] truncate rounded-md bg-[#FFF8EF] px-2 py-0.5 text-sm leading-tight text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(0,0,0,0.25)] sm:text-base">
                      {leaf.word}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
