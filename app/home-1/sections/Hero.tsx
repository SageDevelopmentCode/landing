"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap, useGSAP } from "@/app/_home-variants/gsap";
import { HERO_SLIDES } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import { Magnetic } from "@/app/_home-variants/motion";
import { btnPrimary } from "../ui";

const WELCOME = HERO_SLIDES[0];
/** Slides 2–9 rotate in the "Now at Sage Field" card; slide 1 is the page headline. */
const NEWS = HERO_SLIDES.slice(1);
const INTERVAL = 6500;
const MQ_HERO = "(min-width: 1024px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { openWaitlist } = useDialogs();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % NEWS.length), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused]);

  // gps.edu hero: inset card grows to full-bleed while the headline drops into it.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_HERO, () => {
        const stage = ref.current!.querySelector<HTMLElement>("[data-stage]")!;
        const title = ref.current!.querySelector<HTMLElement>("[data-title]")!;
        const navH = 130;
        const inset = () => {
          const h = stage.clientHeight;
          const w = stage.clientWidth;
          return `inset(${Math.round(h * 0.52)}px ${Math.round(w * 0.035)}px ${Math.round(h * 0.035)}px ${Math.round(w * 0.035)}px round 36px)`;
        };
        const titleShift = () => navH + title.offsetHeight / 2 + 8 - stage.clientHeight / 2;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            pin: true,
            start: "top top",
            end: "+=115%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.fromTo(
          "[data-media]",
          { clipPath: inset },
          { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "power2.inOut", duration: 1 },
          0,
        )
          .fromTo("[data-overlay]", { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" }, 0)
          .fromTo(
            title,
            { y: titleShift, color: "#1f2a24", scale: 0.94 },
            { y: 0, color: "#fff9f5", scale: 1.04, duration: 1, ease: "power2.inOut" },
            0,
          )
          .fromTo("[data-cue]", { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0)
          .fromTo("[data-ticker]", { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0.8);

        // Headline intro on load.
        gsap.from("[data-title] [data-in]", { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: "power4.out", delay: 0.2 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const slide = NEWS[index];
  const go = (d: number) => setIndex((i) => (i + d + NEWS.length) % NEWS.length);

  return (
    <section ref={ref} aria-label="Welcome" className="relative">
      <div data-stage className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[var(--h1-cream)]">
        {/* Media card */}
        <div data-media className="absolute inset-0 will-change-[clip-path]">
          {NEWS.map((s, i) => (
            <div
              key={s.image}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
              aria-hidden={i !== index}
            >
              <div key={i === index ? `on-${index}` : "off"} className={`absolute inset-0 ${i === index ? "h1-kenburns" : ""}`}>
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  preload={i === 0}
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            </div>
          ))}
          <div data-overlay className="absolute inset-0 bg-gradient-to-b from-[#1f2a24]/60 via-[#1f2a24]/45 to-[#1f2a24]/80" />
        </div>

        {/* Headline */}
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 pb-[22vh] sm:pb-[12vh] lg:pb-0 pointer-events-none">
        <div
          data-title
          className="text-center text-[var(--h1-cream)] origin-center pointer-events-auto"
        >
          <h1 data-in className="h1-display text-[13vw] leading-[0.92] sm:text-[10vw] lg:text-[min(7.6vw,9rem)] font-light">
            Welcome to <em className="italic font-normal">Sage Field!</em>
          </h1>
          <p data-in className="mx-auto mt-5 max-w-xl text-base md:text-lg opacity-90">
            {WELCOME.description}
          </p>
          <div data-in className="mt-7">
            <Magnetic>
              <button onClick={openWaitlist} className={btnPrimary}>
                {WELCOME.buttonLabel}
              </button>
            </Magnetic>
          </div>
        </div>
        </div>

        {/* Scroll cue (only visible in the inset state) */}
        <div data-cue className="hidden lg:flex absolute bottom-[6vh] left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 text-white opacity-0 pointer-events-none">
          <span className="h1-eyebrow text-[0.65rem]">Scroll</span>
          <span className="block h-10 w-px bg-white/60 animate-pulse" />
        </div>

        {/* Now at Sage Field */}
        <div
          data-ticker
          className="absolute z-20 bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-auto sm:w-[440px] rounded-3xl border border-white/20 bg-[#1f2a24]/45 p-5 sm:p-6 text-white backdrop-blur-xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          aria-roledescription="carousel"
          aria-label="Now at Sage Field"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="h1-eyebrow text-[0.62rem] text-[var(--h1-coral)]">Now at Sage Field</span>
            <span className="text-xs tabular-nums text-white/60">
              {String(index + 1).padStart(2, "0")} / {String(NEWS.length).padStart(2, "0")}
            </span>
          </div>
          <div key={index} className="animate-[h1-fade_0.6s_ease-out]" aria-live="polite">
            <h2 className="h1-display text-2xl sm:text-[1.7rem] leading-tight mb-2">{slide.title}</h2>
            <p className="text-sm text-white/80 leading-relaxed line-clamp-3 sm:line-clamp-none">{slide.description}</p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            {slide.buttonHref ? (
              <Link href={slide.buttonHref} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--h1-ink)] hover:bg-[var(--h1-coral)] hover:text-white transition-colors">
                {slide.buttonLabel}
              </Link>
            ) : (
              <button onClick={openWaitlist} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--h1-ink)] cursor-pointer">
                {slide.buttonLabel}
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={() => go(-1)} aria-label="Previous update" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 hover:bg-white/15 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => go(1)} aria-label="Next update" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 hover:bg-white/15 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-5 flex gap-1.5">
            {NEWS.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setIndex(i)}
                aria-label={`Show: ${s.title}`}
                aria-current={i === index}
                className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20 cursor-pointer"
              >
                <span
                  key={i === index ? `p-${index}` : "idle"}
                  className={`absolute inset-y-0 left-0 bg-white ${i < index ? "w-full" : i === index ? "w-full origin-left animate-[h1-progress_linear_forwards]" : "w-0"}`}
                  style={i === index ? { animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
