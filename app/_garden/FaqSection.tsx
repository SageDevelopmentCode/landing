"use client";

import type { ReactNode } from "react";
import FaqList, { type FaqTheme } from "./FaqList";
import { Reveal, WordsReveal } from "./motion";
import { Pill, type Tint } from "./ui";
import type { FaqItem } from "./types";

export const FAQ_CARD_THEME: FaqTheme = {
  group: "rounded-[32px] bg-white p-6 md:p-8 shadow-[0_20px_50px_-35px_rgba(43,42,38,0.5)]",
  groupTitle: "sr-only",
  item: "border-b-2 border-dashed border-[var(--sf-ink)]/10 last:border-0",
  question: "text-lg md:text-xl font-extrabold leading-snug",
  answer: "text-lg leading-relaxed text-[var(--sf-soft)]",
  icon: "bg-[var(--sf-butter)] text-[var(--sf-ink)]",
  empty: "rounded-[32px] bg-white py-12 text-center text-lg font-bold text-[var(--sf-soft)]",
};

/**
 * A single-topic FAQ section: pill → heading → optional subtitle → accordion card.
 * Holds no copy; each page passes its own.
 */
export default function FaqSection({
  badge,
  tint = "sky",
  heading,
  sub,
  items,
  idPrefix,
  className = "",
  theme = FAQ_CARD_THEME,
  defaultOpenIndex,
  children,
}: {
  badge?: ReactNode;
  tint?: Tint;
  heading: string;
  sub?: string;
  items: FaqItem[];
  idPrefix: string;
  className?: string;
  theme?: FaqTheme;
  /** Index of an item to start open. */
  defaultOpenIndex?: number;
  /** Rendered under the accordion (e.g. a CTA). */
  children?: ReactNode;
}) {
  return (
    <section className={`py-24 lg:py-32 ${className}`}>
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <div className="text-center">
          {badge && <Pill tint={tint}>{badge}</Pill>}
          <WordsReveal text={heading} className={`sf-display text-5xl md:text-6xl ${badge ? "mt-5" : ""}`} />
          {sub && (
            <Reveal>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{sub}</p>
            </Reveal>
          )}
        </div>
        <Reveal className="mt-12" y={50}>
          <div>
            <FaqList
              groups={[{ title: heading, items }]}
              query=""
              idPrefix={idPrefix}
              theme={theme}
              defaultOpen={defaultOpenIndex !== undefined && items[defaultOpenIndex] ? `${heading}::${items[defaultOpenIndex].question}` : null}
            />
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
