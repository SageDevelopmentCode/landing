"use client";

import { useState } from "react";
import Image from "next/image";
import { RotateCw } from "lucide-react";
import { TEAM } from "@/app/_home/content";
import { Reveal, WordsReveal } from "@/app/_garden/motion";
import { Pill } from "@/app/_garden/ui";

const BACKS = ["bg-[var(--sf-butter)]", "bg-[var(--sf-mint)]", "bg-[var(--sf-sky)]", "bg-[var(--sf-lav)]", "bg-[var(--sf-peach)]"];

export default function Team() {
  const [flipped, setFlipped] = useState<string | null>(null);
  const { lead } = TEAM;

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="text-center">
          <Pill tint="butter">👋 {TEAM.badge}</Pill>
          <WordsReveal text={TEAM.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
        </div>

        {/* Lead */}
        <Reveal className="mt-14" y={60}>
          <div className="grid items-center gap-10 rounded-[40px] bg-white p-6 md:p-10 shadow-[0_30px_60px_-40px_rgba(43,42,38,0.55)] lg:grid-cols-[380px_1fr]">
            <div className="relative mx-auto w-full max-w-[380px]">
              <div className="sf-blob relative aspect-square overflow-hidden">
                <Image src={lead.image} alt={`${lead.name} - ${lead.role}`} fill className="object-cover" sizes="380px" />
              </div>
              <span className="sf-hand absolute -bottom-2 -right-2 rotate-[-8deg] rounded-xl bg-[var(--sf-butter)] px-4 py-2 text-xl shadow">meet Ms. Sabrina</span>
            </div>
            <div>
              <Pill tint="coral">{lead.role}</Pill>
              <p className="sf-display mt-4 text-4xl md:text-5xl">{lead.name}</p>
              <p className="mt-5 text-lg leading-relaxed text-[var(--sf-soft)]">{lead.description}</p>
              <p className="mt-6 rounded-2xl bg-[var(--sf-mint)]/60 p-5 font-semibold leading-relaxed">{TEAM.callout}</p>
            </div>
          </div>
        </Reveal>

        {/* Flip cards */}
        <p className="sf-hand mt-16 mb-6 text-center text-xl text-[var(--sf-soft)]">hover or tap a card to meet everyone ↓</p>
        <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5" stagger={0.08} y={50}>
          {TEAM.members.map((m, i) => {
            const isFlipped = flipped === m.name;
            return (
              <div key={m.name} className="sf-flip h-[420px]" data-flipped={isFlipped}>
                <button
                  type="button"
                  onClick={() => setFlipped(isFlipped ? null : m.name)}
                  aria-pressed={isFlipped}
                  aria-label={`${m.name}, ${m.role}. ${isFlipped ? "Hide" : "Show"} bio`}
                  className="sf-flip-inner relative block h-full w-full text-left cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 rounded-[28px]"
                >
                  <div className="sf-face absolute inset-0 overflow-hidden rounded-[28px] bg-white shadow-[0_20px_40px_-28px_rgba(43,42,38,0.6)]">
                    <div className="relative h-[72%]">
                      <Image src={m.image} alt={m.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" />
                    </div>
                    <div className="p-5">
                      <p className="sf-display text-xl leading-tight">{m.name}</p>
                      <p className="text-sm text-[var(--sf-soft)]">{m.role}</p>
                    </div>
                    <RotateCw className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/90 p-1.5 text-[var(--sf-coral-deep)]" />
                  </div>
                  <div className={`sf-face sf-back absolute inset-0 flex flex-col overflow-hidden rounded-[28px] p-6 ${BACKS[i % BACKS.length]}`}>
                    <p className="sf-display text-xl">{m.name}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide opacity-60">{m.role}</p>
                    <p className="mt-3 overflow-y-auto pr-1 text-[0.88rem] leading-relaxed" data-lenis-prevent>
                      {m.description}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
