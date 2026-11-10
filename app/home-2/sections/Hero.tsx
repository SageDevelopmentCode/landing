"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP } from "@/app/_home-variants/gsap";
import { HERO_SLIDES } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import { btnCoral } from "../ui";

const INTERVAL = 7000;
const MQ = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { openWaitlist } = useDialogs();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused]);

  // Giant "Sage Field" letters act as a window onto the photo, then zoom until the photo fills the screen.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ, () => {
        gsap.set("[data-mask]", { display: "block" });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-stage]", pin: true, start: "top top", end: "+=140%", scrub: 1 },
        });
        tl.to("[data-maskg]", { scale: 28, svgOrigin: "800 470", ease: "power2.in", duration: 1 }, 0)
          .to("[data-mask-sub]", { opacity: 0, y: -30, duration: 0.25 }, 0)
          .to("[data-mask]", { opacity: 0, duration: 0.25 }, 0.75)
          .from("[data-content] > *", { y: 60, opacity: 0, stagger: 0.05, duration: 0.3 }, 0.8);

        gsap.from("[data-maskg]", { opacity: 0, scale: 0.9, svgOrigin: "800 470", duration: 1.6, ease: "power3.out" });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const slide = HERO_SLIDES[index];
  const n = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <section ref={ref} aria-label="Welcome">
      <div data-stage className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[var(--h2-night)]">
        {HERO_SLIDES.map((s, i) => (
          <div key={s.image} className={`absolute inset-0 transition-opacity duration-[1600ms] ${i === index ? "opacity-100" : "opacity-0"}`} aria-hidden={i !== index}>
            <div key={i === index ? `z-${index}` : "z"} className={`absolute inset-0 ${i === index ? "h2-zoom" : ""}`}>
              <Image src={s.image} alt={s.title} fill preload={i === 0} className="object-cover" sizes="100vw" />
            </div>
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--h2-night)] via-[var(--h2-night)]/30 to-[var(--h2-night)]/50" />

        {/* Final content */}
        <h1 className="sr-only">Welcome to Sage Field!</h1>
        <div
          data-content
          className="absolute inset-x-0 bottom-0 z-10 grid gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-12 lg:px-16 lg:pb-14"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="lg:col-span-7" aria-live="polite">
            <p className="h2-label text-[var(--h2-coral)]">
              {n(index)} <span className="text-[var(--h2-mute)]">/ {n(HERO_SLIDES.length - 1)}</span>
            </p>
            <h2 key={`t-${index}`} className="h2-display mt-4 text-[13vw] leading-[0.9] sm:text-7xl lg:text-[6.5rem] animate-[h2-in_0.9s_cubic-bezier(0.22,1,0.36,1)]">
              {slide.title}
            </h2>
            <p key={`d-${index}`} className="mt-5 max-w-xl text-base md:text-lg text-[var(--h2-mute)] animate-[h2-in_1.1s_cubic-bezier(0.22,1,0.36,1)]">
              {slide.description}
            </p>
            <div className="mt-8">
              {slide.buttonHref ? (
                <Link href={slide.buttonHref} className={btnCoral}>
                  {slide.buttonLabel}
                </Link>
              ) : (
                <button onClick={openWaitlist} className={btnCoral}>
                  {slide.buttonLabel}
                </button>
              )}
            </div>
          </div>
          <ol className="hidden lg:col-span-4 lg:col-start-9 lg:flex flex-col justify-end gap-1" aria-label="Slides">
            {HERO_SLIDES.map((s, i) => (
              <li key={s.title}>
                <button
                  onClick={() => setIndex(i)}
                  aria-current={i === index}
                  className={`group flex w-full items-center gap-4 py-1.5 text-left transition-colors cursor-pointer ${i === index ? "text-[var(--h2-cream)]" : "text-[var(--h2-cream)]/40 hover:text-[var(--h2-cream)]/80"}`}
                >
                  <span className="h2-label w-6 text-[0.62rem]">{n(i)}</span>
                  <span className="relative h-px w-10 overflow-hidden bg-white/20">
                    {i === index && (
                      <span
                        key={`b-${index}`}
                        className="absolute inset-0 origin-left bg-[var(--h2-coral)] animate-[h2-bar_linear_forwards]"
                        style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }}
                      />
                    )}
                  </span>
                  <span className="truncate text-sm">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="flex gap-2 lg:hidden">
            {HERO_SLIDES.map((s, i) => (
              <button key={s.title} onClick={() => setIndex(i)} aria-label={`Show: ${s.title}`} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? "w-8 bg-[var(--h2-coral)]" : "w-3 bg-white/30"}`} />
            ))}
          </div>
        </div>

        {/* Letter-mask intro (desktop + motion only) */}
        <div data-mask className="absolute inset-0 z-20 hidden pointer-events-none" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <mask id="h2-letters">
                <rect width="1600" height="900" fill="white" />
                <g data-maskg>
                  <text
                    x="800"
                    y="560"
                    textAnchor="middle"
                    fill="black"
                    style={{ fontFamily: "var(--font-h2-display), Georgia, serif", fontSize: 330, letterSpacing: "-6px" }}
                  >
                    Sage Field
                  </text>
                </g>
              </mask>
            </defs>
            <rect width="1600" height="900" fill="#0d1410" mask="url(#h2-letters)" />
          </svg>
          <p data-mask-sub className="absolute inset-x-0 bottom-[16vh] text-center text-lg text-[var(--h2-mute)]">
            {HERO_SLIDES[0].description}
          </p>
          <p data-mask-sub className="h2-label absolute inset-x-0 bottom-[8vh] text-center text-[var(--h2-coral)]">Scroll</p>
        </div>
      </div>
    </section>
  );
}
