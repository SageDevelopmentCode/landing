"use client";

/**
 * Scroll-animation building blocks shared by the home variants.
 * Every block renders its final, readable state on the server and for
 * prefers-reduced-motion; GSAP only adds motion on top.
 */

import {
  Fragment,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, useGSAP, MQ_DESKTOP_MOTION, MQ_MOTION } from "./gsap";
import type { Run } from "./content";

// ─── useMediaQuery ───────────────────────────────────────────────────────────

/** SSR-safe media query (false on the server and during hydration). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// ─── Runs (text with highlighted phrases) ────────────────────────────────────

export function Runs({ runs, highlightClassName }: { runs: Run[]; highlightClassName?: string }) {
  return (
    <>
      {runs.map((r, i) =>
        r.highlight ? (
          <span key={i} className={highlightClassName}>
            {r.text}
          </span>
        ) : (
          <Fragment key={i}>{r.text}</Fragment>
        ),
      )}
    </>
  );
}

// ─── Reveal: fade/slide children in when they enter the viewport ─────────────

export function Reveal({
  as: Tag = "div",
  children,
  className,
  y = 40,
  x = 0,
  stagger = 0.09,
  delay = 0,
  duration = 0.9,
  start = "top 85%",
  selector,
  style,
  id,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  y?: number;
  x?: number;
  stagger?: number;
  delay?: number;
  duration?: number;
  start?: string;
  /** Animate these descendants instead of the direct children. */
  selector?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const el = ref.current!;
        const targets = selector ? el.querySelectorAll(selector) : el.children;
        if (!targets.length) return;
        gsap.from(targets, {
          y,
          x,
          opacity: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start, once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className} style={style} id={id}>
      {children}
    </Tag>
  );
}

// ─── WordsReveal: masked word-by-word headline reveal ────────────────────────

export function WordsReveal({
  as: Tag = "h2",
  text,
  className,
  wordClassName = "",
  stagger = 0.06,
  delay = 0,
  start = "top 85%",
  immediate = false,
}: {
  as?: ElementType;
  text: string;
  className?: string;
  wordClassName?: string;
  stagger?: number;
  delay?: number;
  start?: string;
  /** Play on mount instead of on scroll (for above-the-fold headings). */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.from(ref.current!.querySelectorAll("[data-w]"), {
          yPercent: 110,
          rotate: 4,
          duration: 1.1,
          delay,
          stagger,
          ease: "power4.out",
          scrollTrigger: immediate ? undefined : { trigger: ref.current, start, once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <span data-w className={`inline-block origin-bottom-left ${wordClassName}`}>
              {w}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}

// ─── ScrubWords: words light up as you scroll through the paragraph ──────────

export function ScrubWords({
  runs,
  as: Tag = "p",
  className,
  highlightClassName = "",
  dimOpacity = 0.14,
  start = "top 80%",
  end = "bottom 45%",
}: {
  runs: Run[];
  as?: ElementType;
  className?: string;
  highlightClassName?: string;
  dimOpacity?: number;
  start?: string;
  end?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.fromTo(
          ref.current!.querySelectorAll("[data-w]"),
          { opacity: dimOpacity },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start, end, scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {runs.map((r, ri) =>
        r.text.split(/(\s+)/).map((part, pi) =>
          /^\s+$/.test(part) || part === "" ? (
            <Fragment key={`${ri}-${pi}`}>{part}</Fragment>
          ) : (
            <span key={`${ri}-${pi}`} data-w className={r.highlight ? highlightClassName : undefined}>
              {part}
            </span>
          ),
        ),
      )}
    </Tag>
  );
}

// ─── ScriptTitle: small caps line + handwritten word revealed by a wipe ──────

export function ScriptTitle({
  eyebrow,
  word,
  className = "",
  eyebrowClassName = "",
  wordClassName = "",
}: {
  eyebrow: string;
  word: string;
  className?: string;
  eyebrowClassName?: string;
  wordClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
        });
        tl.from("[data-eyebrow]", { opacity: 0, y: 16, duration: 0.6, ease: "power2.out" }).fromTo(
          "[data-script]",
          { clipPath: "inset(-20% 100% -20% 0)", opacity: 0 },
          { clipPath: "inset(-20% -10% -20% -10%)", opacity: 1, duration: 1.3, ease: "power2.inOut" },
          "-=0.2",
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`text-center ${className}`} aria-hidden="true">
      <span data-eyebrow className={`block uppercase tracking-[0.3em] ${eyebrowClassName}`}>
        {eyebrow}
      </span>
      <span data-script className={`block leading-none ${wordClassName}`}>
        {word}
      </span>
    </div>
  );
}

// ─── Parallax: image drifts inside its frame while scrolling ─────────────────

export function Parallax({
  children,
  className = "",
  amount = 12,
  scale = 1.15,
}: {
  children: ReactNode;
  className?: string;
  /** Percent of travel, top to bottom. */
  amount?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.fromTo(
          "[data-parallax]",
          { yPercent: -amount / 2, scale },
          {
            yPercent: amount / 2,
            scale,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div data-parallax className="absolute inset-0 will-change-transform">
        {children}
      </div>
    </div>
  );
}

// ─── ClipReveal: image unveils with a clip-path wipe ─────────────────────────

export function ClipReveal({
  children,
  className = "",
  from = "inset(100% 0% 0% 0%)",
  start = "top 80%",
}: {
  children: ReactNode;
  className?: string;
  from?: string;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.fromTo(
          ref.current,
          { clipPath: from },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.4,
            ease: "expo.inOut",
            scrollTrigger: { trigger: ref.current, start, once: true },
          },
        );
        gsap.fromTo(
          ref.current!.querySelector("[data-clip-img]"),
          { scale: 1.3 },
          { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: ref.current, start, once: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div data-clip-img className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

// ─── CountUp: number counts up when it enters view ───────────────────────────

export function CountUp({
  value,
  prefix = "",
  className,
  duration = 1.6,
}: {
  value: number;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString("en-US")}`;
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const o = { v: 0 };
        ref.current!.textContent = fmt(0);
        gsap.to(o, {
          v: value,
          duration,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
          onUpdate: () => {
            if (ref.current) ref.current.textContent = fmt(o.v);
          },
        });
        return () => {
          if (ref.current) ref.current.textContent = fmt(value);
        };
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [value] },
  );
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {fmt(value)}
    </span>
  );
}

// ─── Magnetic: element leans toward the cursor ───────────────────────────────

export function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const el = ref.current!;
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}

// ─── Marquee: endless row whose speed reacts to scroll velocity ──────────────

export function Marquee({
  children,
  className = "",
  trackClassName = "",
  duration = 40,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Seconds per loop at rest. */
  duration?: number;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        const track = ref.current!.querySelector<HTMLElement>("[data-track]")!;
        const loop = gsap.fromTo(
          track,
          { xPercent: reverse ? -50 : 0 },
          { xPercent: reverse ? 0 : -50, duration, ease: "none", repeat: -1 },
        );
        let resting: gsap.core.Tween | null = null;
        const st = ScrollTrigger.create({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
            resting?.kill();
            loop.timeScale(boost);
            resting = gsap.to(loop, { timeScale: 1, duration: 0.9, ease: "power2.out" });
          },
        });
        const el = ref.current!;
        const pause = () => gsap.to(loop, { timeScale: 0, duration: 0.4 });
        const play = () => gsap.to(loop, { timeScale: 1, duration: 0.4 });
        el.addEventListener("pointerenter", pause);
        el.addEventListener("pointerleave", play);
        el.addEventListener("focusin", pause);
        el.addEventListener("focusout", play);
        return () => {
          st.kill();
          el.removeEventListener("pointerenter", pause);
          el.removeEventListener("pointerleave", play);
          el.removeEventListener("focusin", pause);
          el.removeEventListener("focusout", play);
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`overflow-hidden motion-reduce:overflow-x-auto ${className}`}>
      <div data-track className={`flex w-max ${trackClassName}`}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── HorizontalTrack: pinned sideways scroll with a progress bar ─────────────

export function HorizontalTrack({
  header,
  children,
  className = "",
  trackClassName = "",
  progressClassName = "bg-current",
  progressTrackClassName = "bg-black/10",
  footer,
}: {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  progressTrackClassName?: string;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_DESKTOP_MOTION, () => {
        const pin = ref.current!.querySelector<HTMLElement>("[data-pin]")!;
        const track = ref.current!.querySelector<HTMLElement>("[data-htrack]")!;
        const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pin,
            pin: true,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        tl.to(track, { x: () => -distance(), ease: "none" }, 0).fromTo(
          "[data-progress]",
          { scaleX: 0 },
          { scaleX: 1, ease: "none" },
          0,
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className={className}>
      <div data-pin className="lg:min-h-screen lg:flex lg:flex-col lg:justify-center lg:pt-24 overflow-hidden">
        {header}
        <div
          data-htrack
          className={`flex overflow-x-auto snap-x snap-mandatory no-scrollbar lg:overflow-visible lg:snap-none ${trackClassName}`}
        >
          {children}
        </div>
        <div className="hidden lg:block px-16 mt-10">
          <div className={`h-[2px] w-full max-w-md overflow-hidden rounded-full ${progressTrackClassName}`}>
            <div data-progress className={`h-full w-full origin-left scale-x-0 ${progressClassName}`} />
          </div>
        </div>
        {footer}
      </div>
    </section>
  );
}

// ─── PinnedCollage: gps.edu-style "pile of photos explodes into a grid" ──────

export type CollagePhoto = { src: string; alt: string };

const PILE_ROT: [number, number][] = [
  [6, -3],
  [-10, 6],
  [-12, 7.5],
];
/** 3-2-3-2-3 columns = 13 cells. */
const COLUMN_SIZES = [3, 2, 3, 2, 3];

export function PinnedCollage({
  intro,
  pile,
  captions,
  grid,
  outro,
  className = "",
  frame = "plain",
  captionClassName = "",
  scrimClassName = "bg-black/55",
}: {
  intro: ReactNode;
  /** The three photos that fly in one at a time. */
  pile: CollagePhoto[];
  /** One caption per pile photo, shown as it lands. */
  captions?: ReactNode[];
  /** 13 photos for the expanded 5-column grid. */
  grid: CollagePhoto[];
  outro: ReactNode;
  className?: string;
  frame?: "plain" | "polaroid";
  captionClassName?: string;
  scrimClassName?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const pinMode = useMediaQuery(MQ_DESKTOP_MOTION);

  const cellFrame =
    frame === "polaroid"
      ? "bg-white p-[0.6vw] pb-[1.8vw] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] rounded-sm"
      : "rounded-2xl overflow-hidden shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)]";

  useGSAP(
    () => {
      if (!pinMode) return;
      const root = ref.current!;
      const stage = root.querySelector<HTMLElement>("[data-stage]")!;
      const gridLayer = root.querySelector<HTMLElement>("[data-grid]")!;
      const cols = gsap.utils.toArray<HTMLElement>("[data-col]", root);
      const piles = gsap.utils.toArray<HTMLElement>("[data-pile]", root);
      const caps = gsap.utils.toArray<HTMLElement>("[data-cap]", root);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          pin: true,
          start: "top top",
          end: "+=3200",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Stage 1: intro fades as the first photo rises.
      tl.to("[data-intro]", { opacity: 0, y: -80, duration: 0.25 }, 0.05);

      // Stage 2: three photos fly up one at a time, tilted.
      piles.forEach((p, i) => {
        const at = 0.05 + i * 0.3;
        tl.fromTo(
          p,
          { y: () => window.innerHeight * 1.1, rotate: PILE_ROT[i][0] },
          { y: 0, rotate: PILE_ROT[i][1], duration: 0.3, ease: "power1.out" },
          at,
        );
        if (caps[i]) {
          tl.fromTo(caps[i], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12 }, at + 0.15);
          if (i < piles.length - 1) tl.to(caps[i], { opacity: 0, y: -30, duration: 0.1 }, at + 0.32);
        }
      });

      // Stage 3: straighten the pile.
      tl.to(piles, { rotate: 0, duration: 0.15 }, 1.0);
      if (caps.length) tl.to(caps[caps.length - 1], { opacity: 0, duration: 0.1 }, 1.05);

      // Stage 4: swap the pile for the collapsed grid, then expand outward.
      tl.set(gridLayer, { opacity: 1 }, 1.18);
      tl.set(piles, { opacity: 0 }, 1.19);
      const stageCenter = () => gridLayer.clientWidth / 2;
      cols.forEach((col) => {
        tl.fromTo(
          col,
          { x: () => stageCenter() - (col.offsetLeft + col.offsetWidth / 2) },
          { x: 0, duration: 0.6, ease: "power2.inOut" },
          1.2,
        );
        const colMid = () => col.offsetHeight / 2;
        Array.from(col.children).forEach((cell) => {
          const c = cell as HTMLElement;
          tl.fromTo(
            c,
            { y: () => colMid() - (c.offsetTop - col.offsetTop + c.offsetHeight / 2) },
            { y: 0, duration: 0.6, ease: "power2.inOut" },
            1.2,
          );
        });
      });

      // Stage 5: scrim + outro.
      tl.fromTo("[data-scrim]", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.85);
      tl.fromTo("[data-outro]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, 1.95);
      tl.to({}, { duration: 0.25 }); // hold
    },
    { scope: ref, dependencies: [pinMode], revertOnUpdate: true },
  );

  // Split the 13 grid photos into 3-2-3-2-3 columns.
  const columns: CollagePhoto[][] = [];
  let k = 0;
  for (const n of COLUMN_SIZES) {
    columns.push(grid.slice(k, k + n));
    k += n;
  }

  if (!pinMode) {
    // Static, fully readable layout for mobile + reduced motion.
    return (
      <section ref={ref} className={`py-20 px-6 sm:px-10 ${className}`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">{intro}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {pile.map((p, i) => (
              <figure key={p.src}>
                <div className={`relative aspect-[4/5] ${cellFrame}`}>
                  <div className="relative w-full h-full overflow-hidden">
                    <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                  </div>
                </div>
                {captions?.[i] && <figcaption className={`mt-4 ${captionClassName}`}>{captions[i]}</figcaption>}
              </figure>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
            {grid.slice(0, 6).map((p) => (
              <div key={p.src} className={`relative aspect-square ${cellFrame}`}>
                <div className="relative w-full h-full overflow-hidden">
                  <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                </div>
              </div>
            ))}
          </div>
          <div>{outro}</div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={className}>
      <div data-stage className="relative h-screen overflow-hidden">
        {/* Expanded grid (starts collapsed under the pile) */}
        <div data-grid className="absolute inset-0 z-10 flex items-center justify-center gap-[1.2vw] opacity-0">
          {columns.map((col, ci) => (
            <div key={ci} data-col className="flex w-[21vw] shrink-0 flex-col justify-center gap-[1.2vw] self-stretch">
              {col.map((p) => (
                <div key={p.src} className={`relative h-[31vh] w-full shrink-0 ${cellFrame}`}>
                  <div className="relative w-full h-full overflow-hidden">
                    <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="22vw" />
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div data-scrim className={`absolute inset-0 opacity-0 ${scrimClassName}`} />
        </div>

        {/* Pile of three */}
        {pile.map((p) => (
          <div
            key={p.src}
            data-pile
            className={`absolute left-1/2 top-1/2 z-20 -ml-[10.5vw] -mt-[15.5vh] h-[31vh] w-[21vw] will-change-transform ${cellFrame}`}
            style={{ transform: "translateY(110vh)" }}
          >
            <div className="relative w-full h-full overflow-hidden">
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="22vw" />
            </div>
          </div>
        ))}

        {/* Captions for each landing photo */}
        {captions?.map((c, i) => (
          <div
            key={i}
            data-cap
            className={`absolute bottom-[9vh] inset-x-0 z-30 mx-auto w-[min(640px,80vw)] text-center opacity-0 ${captionClassName}`}
          >
            {c}
          </div>
        ))}

        <div data-intro className="absolute inset-0 z-30 flex items-center justify-center px-16">
          {intro}
        </div>
        <div data-outro className="absolute inset-0 z-40 flex items-center justify-center px-16 opacity-0">
          {outro}
        </div>
      </div>
    </section>
  );
}
