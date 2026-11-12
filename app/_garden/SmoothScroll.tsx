"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger scrubs stay
 * perfectly in sync. Disabled entirely for prefers-reduced-motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    // Fonts shift line lengths, which shifts trigger positions.
    document.fonts?.ready.then(refresh).catch(() => {});

    // Lazy images and data-driven sections change the page height after triggers
    // are measured; re-measure (debounced) whenever the document height changes.
    let lastH = document.documentElement.scrollHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(timer);
      timer = setTimeout(() => {
        refresh();
        lastH = document.documentElement.scrollHeight;
      }, 250);
    });
    ro.observe(document.body);
    const stopObserving = () => {
      ro.disconnect();
      clearTimeout(timer);
      window.removeEventListener("load", refresh);
    };

    if (reduce) {
      return stopObserving;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      allowNestedScroll: true,
      anchors: true,
      // Never hijack scrolling inside modals, sheets, or the mobile menu.
      prevent: (node) => !!node.closest(".fixed, [role='dialog'], [data-lenis-prevent]"),
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenisRef.current = null;
      stopObserving();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);

  return <>{children}</>;
}
