"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { TuitionCard, TuitionCtaTone } from "./tuition";
import { Arrow, CheckIcon, SectionHeader, TINT_BG, linkSoft } from "@/app/parent/_garden/ui";

const CTA_STYLE: Record<TuitionCtaTone, string> = {
  pay: "bg-[var(--sf-coral-deep)] text-white shadow-[0_3px_0_0_#b85a4f] group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
  paid: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
  plan: "bg-[var(--sf-sage)] text-white shadow-[0_3px_0_0_var(--sf-sage-deep)] group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
  optional: "bg-white text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/15 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
  locked: "bg-[var(--sf-ink)]/[0.07] text-[var(--sf-soft)]",
};

function CardBody({ card }: { card: TuitionCard }) {
  return (
    <>
      <div className={`relative h-[104px] w-[92px] shrink-0 overflow-hidden rounded-[20px] ${TINT_BG[card.tint]}`}>
        <Image
          src={card.image}
          alt=""
          fill
          sizes="92px"
          className={`object-cover transition-transform duration-500 ${card.locked ? "grayscale-[40%]" : "group-hover:scale-105 group-focus-visible:scale-105"}`}
          style={card.imagePosition ? { objectPosition: card.imagePosition } : undefined}
        />
        {card.locked ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--sf-ink)]/35" aria-hidden="true">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[var(--sf-ink)]">
              <Lock className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          {card.badgeLeft ? (
            <span className="rounded-full bg-[var(--sf-sky)] px-2 py-0.5 text-[11px] font-extrabold text-[#2d5d86]">{card.badgeLeft}</span>
          ) : null}
          {card.badgeRight ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                card.badgeRight.tone === "paid"
                  ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]"
                  : "bg-[var(--sf-butter)] text-[#7a5b00]"
              }`}
            >
              {card.badgeRight.tone === "paid" ? "✓ " : ""}
              {card.badgeRight.label}
            </span>
          ) : null}
        </div>
        {card.names ? <p className="mt-1 truncate text-xs font-bold text-[var(--sf-soft)]">{card.names}</p> : null}
        {card.term ? <p className="text-xs font-bold text-[var(--sf-soft)]/80">{card.term}</p> : null}
        <p className="mt-0.5 text-[15px] font-extrabold leading-snug text-[var(--sf-ink)]">{card.title}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold transition-transform duration-200 ${CTA_STYLE[card.cta.tone]}`}
          >
            {card.cta.tone === "paid" ? <CheckIcon className="h-3 w-3" /> : null}
            {card.cta.tone === "locked" ? <Lock className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" /> : null}
            {card.cta.label}
            {card.cta.tone !== "paid" && card.cta.tone !== "locked" ? <Arrow className="h-3 w-3" /> : null}
          </span>
          {card.amount ? <span className="sf-display text-lg">{card.amount}</span> : null}
        </div>
      </div>
    </>
  );
}

const cardClass =
  "group flex gap-3.5 rounded-[26px] bg-white p-3 shadow-[0_18px_40px_-28px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]";

export default function TuitionCards({
  hasAnything,
  cards,
}: {
  hasAnything: boolean;
  cards: TuitionCard[];
}) {
  return (
    <section aria-labelledby="home-tuition">
      <SectionHeader
        id="home-tuition"
        title="Tuition & billing"
        action={
          <Link href="/parent/billing" className={linkSoft}>
            View all <Arrow />
          </Link>
        }
      />
      {!hasAnything ? (
        <div className="flex items-center gap-3 rounded-[26px] bg-[var(--sf-mint)]/70 px-5 py-5">
          <span className="text-2xl" aria-hidden="true">
            🌿
          </span>
          <div>
            <p className="sf-display text-xl leading-tight text-[var(--sf-sage-deep)]">All caught up!</p>
            <p className="text-sm font-bold text-[var(--sf-sage-deep)]/80">No pending payments</p>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {cards.map((card) =>
            card.locked ? (
              <li key={card.key} className="min-w-0">
                <div
                  role="link"
                  aria-disabled="true"
                  tabIndex={0}
                  aria-describedby={`${card.key}-why`}
                  className={`${cardClass} cursor-not-allowed bg-white/70`}
                >
                  <CardBody card={card} />
                </div>
                <p id={`${card.key}-why`} className="sf-hand mt-1.5 px-3 text-base leading-tight text-[var(--sf-coral-deep)]">
                  ↑ pay the Annual Supply Fee first, then tuition unlocks
                </p>
              </li>
            ) : (
              <li key={card.key} className="min-w-0">
                <Link
                  href="/parent/billing"
                  className={`${cardClass} hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(43,42,38,0.6)] focus-visible:-translate-y-0.5`}
                >
                  <CardBody card={card} />
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
