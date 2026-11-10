"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/app/_home-variants/gsap";

const KEY = "sf-h1-intro";

/** Short curtain on first visit per session; skipped instantly afterwards and for reduced motion. */
export default function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const el = ref.current!;
      let seen = false;
      try {
        seen = sessionStorage.getItem(KEY) === "1";
        sessionStorage.setItem(KEY, "1");
      } catch {}
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finish = () => setDone(true);

      if (seen || reduce) {
        gsap.to(el, { opacity: 0, duration: 0.35, onComplete: finish });
        return;
      }
      gsap
        .timeline({ onComplete: finish })
        .from("[data-word]", { yPercent: 120, duration: 0.9, ease: "power4.out", stagger: 0.08 })
        .fromTo("[data-line]", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, "-=0.5")
        .to("[data-word], [data-line]", { opacity: 0, duration: 0.35 }, "+=0.25")
        .to(el, { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, "-=0.1");
    },
    { scope: ref },
  );

  if (done) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--h1-ink)] text-[var(--h1-cream)] pointer-events-none"
    >
      <div className="overflow-hidden">
        <span data-word className="h1-display block text-5xl md:text-7xl font-light italic">
          Sage Field
        </span>
      </div>
      <span data-line className="mt-6 block h-px w-40 origin-left bg-[var(--h1-coral)]" />
      <div className="overflow-hidden mt-4">
        <span data-word className="h1-eyebrow block text-white/60">
          Round Rock, Texas
        </span>
      </div>
    </div>
  );
}
