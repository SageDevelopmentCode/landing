"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TEAM, type TeamMember } from "@/app/_home-variants/content";
import BioDialog from "@/app/_home-variants/BioDialog";
import { Parallax, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Badge } from "../ui";

export default function Team() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const nudge = (d: number) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: d * ((card?.offsetWidth ?? 320) + 24), behavior: "smooth" });
  };

  const { lead } = TEAM;

  return (
    <section className="bg-[var(--h1-cream)] py-28 lg:py-36 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <Badge>{TEAM.badge}</Badge>
        <WordsReveal text={TEAM.heading} className="h1-display mt-5 text-5xl md:text-7xl font-light" />

        {/* Lead */}
        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:items-center">
          <Parallax className="lg:col-span-5 aspect-[4/5] rounded-[36px]" amount={10}>
            <Image src={lead.image} alt={`${lead.name} - ${lead.role}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
          </Parallax>
          <Reveal className="lg:col-span-7">
            <span className="h1-eyebrow text-[var(--h1-coral-deep)]">{lead.role}</span>
            <p className="h1-display mt-4 text-4xl md:text-5xl">{lead.name}</p>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h1-ink)]/75">{lead.description}</p>
            <blockquote className="mt-8 border-l-2 border-[var(--h1-coral)] pl-6 h1-display italic text-xl md:text-2xl text-[var(--h1-sage)]">
              {TEAM.callout}
            </blockquote>
          </Reveal>
        </div>
      </div>

      {/* Team rail */}
      <div className="mt-20">
        <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
          <div className="h-[2px] w-40 overflow-hidden rounded-full bg-[var(--h1-ink)]/10">
            <div className="h-full bg-[var(--h1-coral)] transition-[width] duration-200" style={{ width: `${Math.max(12, progress * 100)}%` }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => nudge(-1)} aria-label="Previous team member" className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--h1-ink)]/15 hover:bg-[var(--h1-ink)] hover:text-white transition-colors cursor-pointer">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => nudge(1)} aria-label="Next team member" className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--h1-ink)]/15 hover:bg-[var(--h1-ink)] hover:text-white transition-colors cursor-pointer">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          ref={rail}
          data-lenis-prevent-wheel
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
          style={{
            paddingInline: "max(1.5rem, calc((100vw - 80rem) / 2 + 4rem))",
            scrollPaddingInline: "max(1.5rem, calc((100vw - 80rem) / 2 + 4rem))",
          }}
        >
          {TEAM.members.map((m) => (
            <article key={m.name} data-card className="group snap-start shrink-0 w-[78vw] sm:w-[340px]">
              <button
                onClick={() => setSelected(m)}
                className="block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--h1-coral)] rounded-[28px]"
                aria-label={`Read ${m.name}'s bio`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-[var(--h1-paper)]">
                  <Image src={m.image} alt={m.name} fill className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" sizes="(max-width: 640px) 78vw, 340px" />
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--h1-ink)] opacity-100 lg:opacity-0 lg:translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    Read bio →
                  </span>
                </div>
                <p className="h1-display mt-5 text-2xl">{m.name}</p>
                <p className="text-sm text-[var(--h1-ink)]/60">{m.role}</p>
              </button>
            </article>
          ))}
        </div>
      </div>

      <BioDialog member={selected} onClose={() => setSelected(null)} panelClassName="bg-[var(--h1-cream)] text-[var(--h1-ink)]" nameClassName="h1-display" />
    </section>
  );
}
