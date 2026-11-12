"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MQ_MOTION } from "@/app/_garden/gsap";

export const btnPop =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sf-coral)] px-7 py-4 text-base font-extrabold text-white shadow-[0_6px_0_0_var(--sf-coral-deep)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_var(--sf-coral-deep)] active:translate-y-1 active:shadow-[0_2px_0_0_var(--sf-coral-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 cursor-pointer";
export const btnSage =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sf-sage)] px-7 py-4 text-base font-extrabold text-white shadow-[0_6px_0_0_var(--sf-sage-deep)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_var(--sf-sage-deep)] active:translate-y-1 active:shadow-[0_2px_0_0_var(--sf-sage-deep)] cursor-pointer";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--sf-ink)] bg-white px-7 py-[14px] text-base font-extrabold text-[var(--sf-ink)] shadow-[0_6px_0_0_var(--sf-ink)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_0_var(--sf-ink)] cursor-pointer";

/** Form field classes (same theme as the home page interest form). */
export const fieldInput =
  "w-full rounded-2xl border-2 border-[var(--sf-ink)]/15 bg-white px-4 py-3 text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 transition focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)] disabled:opacity-60";
export const fieldLabel = "mb-2 block text-sm font-extrabold text-[var(--sf-ink)]";

const TINTS = {
  coral: "bg-[var(--sf-coral)]/20 text-[var(--sf-coral-deep)]",
  sage: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
  butter: "bg-[var(--sf-butter)] text-[#7a5b00]",
  sky: "bg-[var(--sf-sky)] text-[#2d5d86]",
  lav: "bg-[var(--sf-lav)] text-[#6b3f86]",
} as const;
export type Tint = keyof typeof TINTS;

export function Pill({ children, tint = "coral", className = "" }: { children: ReactNode; tint?: Tint; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold ${TINTS[tint]} ${className}`}>
      {children}
    </span>
  );
}

/** Wrap hand-drawn SVGs: every [data-draw] path draws itself when it scrolls into view. */
export function Draw({ children, className = "", delay = 0, duration = 1.4 }: { children: ReactNode; className?: string; delay?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const paths = ref.current!.querySelectorAll<SVGPathElement>("[data-draw]");
        paths.forEach((p) => {
          p.setAttribute("pathLength", "1");
          p.style.strokeDasharray = "1 2";
        });
        gsap.fromTo(
          paths,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration, delay, stagger: 0.15, ease: "power2.inOut", scrollTrigger: { trigger: ref.current, start: "top 90%", once: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <span ref={ref} className={className || "inline-block"} aria-hidden="true">
      {children}
    </span>
  );
}

export const Squiggle = ({ className = "", color = "var(--sf-coral)" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 300 24" className={className} fill="none">
    <path data-draw d="M3 15 C 30 3, 50 3, 75 13 S 120 23, 150 12 S 200 2, 225 12 S 270 22, 297 9" stroke={color} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const Sun = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="#f2b93b" strokeWidth="4" strokeLinecap="round">
    <path data-draw d="M50 30 a20 20 0 1 0 0.1 0" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * Math.PI) / 4;
      const x1 = 50 + Math.cos(a) * 30;
      const y1 = 50 + Math.sin(a) * 30;
      const x2 = 50 + Math.cos(a) * 42;
      const y2 = 50 + Math.sin(a) * 42;
      return <path key={i} data-draw d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`} />;
    })}
  </svg>
);

export const Leaf = ({ className = "", color = "var(--sf-sage)" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path data-draw d="M20 80 C 20 40, 50 18, 85 15 C 82 50, 60 80, 20 80 Z" />
    <path data-draw d="M20 80 C 40 60, 55 45, 70 32" />
  </svg>
);

export const Arrow = ({ className = "", color = "var(--sf-ink)" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path data-draw d="M6 12 C 40 4, 80 18, 92 60" />
    <path data-draw d="M78 52 L92 62 L100 46" />
  </svg>
);

export const Star = ({ className = "", color = "var(--sf-coral)" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round">
    <path data-draw d="M50 8 L61 38 L93 39 L67 58 L77 90 L50 71 L23 90 L33 58 L7 39 L39 38 Z" />
  </svg>
);
