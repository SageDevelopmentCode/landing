"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/app/_home-variants/gsap";

export const btnCoral =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--h2-coral)] px-7 py-4 text-sm font-bold text-[var(--h2-night)] transition-all duration-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--h2-night)] cursor-pointer";
export const btnLine =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--h2-line)] px-7 py-4 text-sm font-bold text-[var(--h2-cream)] transition-colors duration-300 hover:bg-[var(--h2-cream)] hover:text-[var(--h2-night)] cursor-pointer";

export function Label({ children, n }: { children: ReactNode; n?: string }) {
  return (
    <span className="h2-label inline-flex items-center gap-3 text-[var(--h2-coral)]">
      {n && <span className="text-[var(--h2-mute)]">{n}</span>}
      {children}
    </span>
  );
}

/**
 * Desktop-only follower bubble that says "View" over [data-cursor] elements.
 * The native cursor stays visible.
 */
export function CursorBubble() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const el = ref.current!;
      const label = el.querySelector("span")!;
      const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        x(e.clientX);
        y(e.clientY);
        const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
        if (target) {
          label.textContent = target.dataset.cursor || "View";
          gsap.to(el, { scale: 1, opacity: 1, duration: 0.3, overwrite: "auto" });
        } else {
          gsap.to(el, { scale: 0, opacity: 0, duration: 0.3, overwrite: "auto" });
        }
      };
      window.addEventListener("pointermove", move);
      return () => window.removeEventListener("pointermove", move);
    });
    return () => mm.revert();
  });
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[65] -ml-12 -mt-12 flex h-24 w-24 scale-0 items-center justify-center rounded-full bg-[var(--h2-coral)] opacity-0 mix-blend-normal"
    >
      <span className="h2-label text-[0.62rem] text-[var(--h2-night)]">View</span>
    </div>
  );
}
