"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "@/app/_home-variants/gsap";
import { TEAM, type TeamMember } from "@/app/_home-variants/content";
import BioDialog from "@/app/_home-variants/BioDialog";
import { Parallax, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Label } from "../ui";

export default function Team() {
  const ref = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const { lead } = TEAM;

  // Floating portrait that follows the cursor over the name list.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const list = ref.current!.querySelector<HTMLElement>("[data-list]")!;
        const float = ref.current!.querySelector<HTMLElement>("[data-float]")!;
        const x = gsap.quickTo(float, "x", { duration: 0.6, ease: "power3.out" });
        const y = gsap.quickTo(float, "y", { duration: 0.6, ease: "power3.out" });
        const r = gsap.quickTo(float, "rotate", { duration: 0.8, ease: "power3.out" });
        let lastX = 0;
        const move = (e: PointerEvent) => {
          const b = list.getBoundingClientRect();
          x(e.clientX - b.left);
          y(e.clientY - b.top);
          r(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
          lastX = e.clientX;
        };
        list.addEventListener("pointermove", move);
        return () => list.removeEventListener("pointermove", move);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="bg-[var(--h2-forest)] py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <Label n="07">{TEAM.badge}</Label>
        <WordsReveal text={TEAM.heading} className="h2-display mt-6 text-6xl md:text-8xl" />

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:items-end">
          <Parallax className="lg:col-span-5 aspect-[4/5] rounded-[28px]" amount={12}>
            <Image src={lead.image} alt={`${lead.name} - ${lead.role}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
          </Parallax>
          <Reveal className="lg:col-span-7">
            <span className="h2-label text-[var(--h2-coral)]">{lead.role}</span>
            <p className="h2-display mt-3 text-5xl md:text-6xl">{lead.name}</p>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h2-mute)]">{lead.description}</p>
            <p className="h2-display italic mt-8 text-2xl leading-snug text-[var(--h2-sage)]">“{TEAM.callout}”</p>
          </Reveal>
        </div>

        <div data-list className="relative mt-24 border-t border-[var(--h2-line)]" onMouseLeave={() => setHover(null)}>
          {TEAM.members.map((m, i) => (
            <button
              key={m.name}
              onClick={() => setSelected(m)}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="group relative z-10 flex w-full items-center gap-5 border-b border-[var(--h2-line)] py-6 md:py-8 text-left cursor-pointer focus:outline-none focus-visible:bg-white/5"
              aria-label={`Read ${m.name}'s bio`}
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full lg:hidden">
                <Image src={m.image} alt="" fill className="object-cover" sizes="56px" />
              </span>
              <span className="h2-label w-10 text-[var(--h2-mute)] hidden md:block">0{i + 1}</span>
              <span className={`h2-display flex-1 text-3xl md:text-6xl transition-all duration-500 ${hover !== null && hover !== i ? "lg:opacity-30" : ""} group-hover:translate-x-3 group-hover:italic`}>
                {m.name}
              </span>
              <span className="hidden sm:block text-right text-sm text-[var(--h2-mute)] max-w-[220px]">{m.role}</span>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-[var(--h2-coral)] transition-transform duration-500 group-hover:rotate-45" />
              <span className="sm:hidden sr-only">{m.role}</span>
            </button>
          ))}
          <div
            data-float
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-0 -ml-[120px] -mt-[150px] hidden h-[300px] w-[240px] lg:block"
          >
            <div
              className={`relative h-full w-full overflow-hidden rounded-[22px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${hover !== null ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
            >
              {TEAM.members.map((m, i) => (
                <Image key={m.name} src={m.image} alt="" fill sizes="240px" className={`object-cover transition-opacity duration-300 ${hover === i ? "opacity-100" : "opacity-0"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <BioDialog member={selected} onClose={() => setSelected(null)} panelClassName="bg-[var(--h2-forest)] text-[var(--h2-cream)] border border-[var(--h2-line)]" nameClassName="h2-display text-4xl" />
    </section>
  );
}
