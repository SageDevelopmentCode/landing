"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { WeekEntry } from "@/app/lib/highlights/weeks";

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];

/** Garden grid of weekly recap cards (same copy and links as WeekCardsGrid). */
export default function WeekCards({ weeks, sectionKey }: { weeks: WeekEntry[]; sectionKey: string }) {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {weeks.map((entry, i) => {
        const isLive = !!entry.href;
        const tilt = TILTS[i % TILTS.length];
        const card = (
          <div
            className={`sf-polaroid relative h-full transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isLive ? "group-hover:-translate-y-1.5 group-hover:rotate-0 group-focus-visible:-translate-y-1.5 group-focus-visible:rotate-0" : "opacity-75"
            }`}
            style={{ rotate: `${tilt}deg` }}
          >
            <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[i % TAPE.length] }} aria-hidden="true" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-[var(--sf-cream)]">
              {isLive && entry.coverImage ? (
                <Image
                  src={entry.coverImage}
                  alt={`Week ${entry.week} — ${entry.theme}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--sf-ink)]/15">
                  <span className="text-3xl" aria-hidden="true">
                    📅
                  </span>
                  <span className="text-xs font-extrabold text-[var(--sf-soft)]">Coming Soon</span>
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-[var(--sf-coral)] px-3 py-1 text-xs font-extrabold text-white shadow-[0_3px_0_0_var(--sf-coral-deep)]">
                Week {entry.week}
              </span>
              {isLive && (
                <span className="absolute right-3 top-3 rotate-6 rounded-full bg-[var(--sf-butter)] px-3 py-1 text-xs font-extrabold text-[var(--sf-ink)] shadow">
                  ✓ Live
                </span>
              )}
            </div>
            <div className="px-2 pt-4 pb-2">
              <p className="sf-hand text-lg text-[var(--sf-sage-deep)]">{entry.dates}</p>
              <h3 className="sf-display mt-1 text-xl leading-snug">{isLive ? entry.theme : "Coming Soon"}</h3>
              {isLive ? (
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-[var(--sf-coral-deep)] group-hover:underline">
                  View Highlights →
                </span>
              ) : (
                <span className="mt-3 block text-xs italic text-[var(--sf-soft)]">Recap will be posted after the week ends</span>
              )}
            </div>
          </div>
        );

        return (
          <motion.div
            key={`${sectionKey}-${entry.week}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: (i % 3) * 0.08 }}
          >
            {isLive ? (
              <Link href={entry.href!} className="group block h-full rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40">
                {card}
              </Link>
            ) : (
              card
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
