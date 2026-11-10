"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, MQ_DESKTOP_MOTION } from "@/app/_garden/gsap";
import { HERO_SLIDES } from "@/app/_home/content";
import { useDialogs } from "@/app/_garden/GardenShell";
import { Magnetic } from "@/app/_garden/motion";
import { Draw, Leaf, Squiggle, Star, Sun, btnPop } from "@/app/_garden/ui";

const WELCOME = HERO_SLIDES[0];
const NOTES = HERO_SLIDES.slice(1);

/** Hand-placed polaroid spots around the headline (desktop). */
const SPOTS = [
  { x: "3%", y: "24%", r: -9, d: 1.2 },
  { x: "17%", y: "56%", r: 6, d: 0.7 },
  { x: "4%", y: "66%", r: -4, d: 1.5 },
  { x: "79%", y: "22%", r: 8, d: 1.1 },
  { x: "87%", y: "47%", r: -7, d: 0.8 },
  { x: "73%", y: "62%", r: 5, d: 1.4 },
  { x: "19%", y: "21%", r: 4, d: 0.6 },
  { x: "62%", y: "70%", r: -10, d: 1 },
];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)"];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { openWaitlist } = useDialogs();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_DESKTOP_MOTION, () => {
        const root = ref.current!;
        const pars = gsap.utils.toArray<HTMLElement>("[data-par]", root);
        const tos = pars.map((p) => ({
          x: gsap.quickTo(p, "x", { duration: 1, ease: "power3.out" }),
          y: gsap.quickTo(p, "y", { duration: 1, ease: "power3.out" }),
          d: Number(p.dataset.depth || 1),
        }));
        const move = (e: PointerEvent) => {
          const mx = e.clientX / window.innerWidth - 0.5;
          const my = e.clientY / window.innerHeight - 0.5;
          tos.forEach((t) => {
            t.x(mx * 46 * t.d);
            t.y(my * 34 * t.d);
          });
        };
        root.addEventListener("pointermove", move);

        // Polaroids drop in, then gather into a neat pile as you scroll away.
        gsap.from("[data-gather]", { y: -120, opacity: 0, rotate: () => gsap.utils.random(-30, 30), duration: 1.1, ease: "back.out(1.6)", stagger: 0.07, delay: 0.3 });
        const center = () => ({ x: root.clientWidth / 2, y: root.clientHeight * 0.9 });
        gsap.utils.toArray<HTMLElement>("[data-gather]").forEach((g, i) => {
          const link = g.parentElement!;
          gsap.to(g, {
            x: () => (center().x - (link.offsetLeft + link.offsetWidth / 2)) * 0.85,
            y: () => center().y - (link.offsetTop + link.offsetHeight / 2),
            rotate: (i % 2 ? 1 : -1) * (4 + i),
            scale: 0.72,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top top", end: "bottom 35%", scrub: 0.8, invalidateOnRefresh: true },
          });
        });
        gsap.to("[data-headline]", {
          yPercent: 30,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
        return () => root.removeEventListener("pointermove", move);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-label="Welcome" className="relative overflow-hidden pt-36 pb-16 lg:h-[100svh] lg:min-h-[760px] lg:pt-0 lg:pb-0">
      {/* Doodles */}
      <Draw className="absolute right-[30%] top-[16%] hidden w-20 lg:block" delay={0.6}>
        <Sun />
      </Draw>
      <Draw className="absolute left-[34%] bottom-[16%] hidden w-14 lg:block" delay={0.9}>
        <Leaf />
      </Draw>
      <Draw className="absolute right-[36%] bottom-[22%] hidden w-10 lg:block" delay={1.1}>
        <Star />
      </Draw>

      {/* Headline */}
      <div data-headline className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:absolute lg:inset-0 lg:flex lg:flex-col lg:items-center lg:justify-center lg:pt-20">
        <span className="sf-hand text-2xl text-[var(--sf-sage)]">hello, friends!</span>
        <h1 className="sf-display mt-2 text-[15vw] leading-[0.88] sm:text-7xl lg:text-[7.4rem]">
          Welcome to{" "}
          <span className="relative inline-block text-[var(--sf-coral)]">
            Sage Field!
            <Draw className="absolute -bottom-3 left-0 w-full" delay={0.4}>
              <Squiggle className="w-full" color="var(--sf-butter)" />
            </Draw>
          </span>
        </h1>
        <p className="mx-auto mt-8 max-w-md text-lg font-semibold text-[var(--sf-soft)]">{WELCOME.description}</p>
        <div className="mt-8">
          <Magnetic>
            <button onClick={openWaitlist} className={btnPop}>
              {WELCOME.buttonLabel}
            </button>
          </Magnetic>
        </div>
      </div>

      {/* Polaroid notes: every hero slide, as a link */}
      <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 pt-4 lg:absolute lg:inset-0 lg:m-0 lg:block lg:overflow-visible lg:p-0">
        {NOTES.map((s, i) => {
          const spot = SPOTS[i];
          const inner = (
            <div data-gather className="will-change-transform">
              <div data-par data-depth={spot.d}>
                <div className="sf-polaroid relative w-48 lg:w-[11.5vw] lg:max-w-[180px] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-0 group-focus-visible:scale-110">
                  <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[i % 4] }} />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
                    <Image src={s.image} alt={s.title} fill className="object-cover" sizes="(max-width: 1024px) 192px, 180px" preload={i < 2} />
                  </div>
                  <p className="sf-hand mt-2 text-center text-[1.05rem] leading-tight">{s.title}</p>
                  <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-60 -translate-x-1/2 rounded-2xl bg-[var(--sf-ink)] p-4 text-left text-sm text-white opacity-0 shadow-xl transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 hidden lg:block">
                    {s.description}
                    <span className="mt-2 block font-extrabold text-[var(--sf-butter)]">{s.buttonLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          );
          return (
            <Link
              key={s.title}
              href={s.buttonHref!}
              className="group relative shrink-0 snap-center focus:outline-none lg:absolute lg:left-[var(--x)] lg:top-[var(--y)] lg:hover:z-30 lg:focus-visible:z-30"
              style={{ ["--x" as string]: spot.x, ["--y" as string]: spot.y, rotate: `${spot.r}deg` }}
              aria-label={`${s.title} — ${s.buttonLabel}`}
            >
              {inner}
              <span className="mt-3 block w-48 text-sm text-[var(--sf-soft)] lg:hidden">
                {s.description} <strong className="text-[var(--sf-coral-deep)]">{s.buttonLabel}</strong>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
