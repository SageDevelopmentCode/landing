"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pill, Draw, Sun, Squiggle } from "@/app/_garden/ui";
import type { HomeEvent } from "../page";
import { formatEventTime, formatLongDate, getGreeting, toYmd } from "@/app/parent/_garden/format";

export const BANNER_IMAGES = [
  "/assets/Kid1.png",
  "/assets/Kid2.jpg",
  "/assets/Stock1.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
];

function bannerIndexForUser(userId: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return Math.abs(hash) % length;
}

// The greeting and date depend on the parent's clock, so they render after hydration.
let clientNow: Date | null = null;
const subscribeNoop = () => () => {};
function useClientNow(): Date | null {
  return useSyncExternalStore(
    subscribeNoop,
    () => (clientNow ??= new Date()),
    () => null,
  );
}

type Props = {
  userId: string;
  firstName: string;
  nextEvent: HomeEvent | null;
  stepCount: number;
  onJumpToSteps: () => void;
};

export default function HomeHero({ userId, firstName, nextEvent, stepCount, onJumpToSteps }: Props) {
  const reduce = useReducedMotion();
  const now = useClientNow();
  const [firstIdx] = useState(() => bannerIndexForUser(userId, BANNER_IMAGES.length));
  const [idx, setIdx] = useState(firstIdx);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setIdx((i) => (i + 1) % BANNER_IMAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [reduce, paused]);

  const back1 = BANNER_IMAGES[(idx + 1) % BANNER_IMAGES.length];
  const back2 = BANNER_IMAGES[(idx + 2) % BANNER_IMAGES.length];
  const todayYmd = now ? toYmd(now) : null;
  const isToday = !!nextEvent && nextEvent.event_date === todayYmd;

  return (
    <section className="relative grid items-center gap-10 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-6" aria-labelledby="home-greeting">
      <Draw className="pointer-events-none absolute -left-6 -top-6 hidden w-20 lg:block">
        <Sun className="w-20" />
      </Draw>

      <div className="relative">
        <p className="sf-hand min-h-[2rem] text-2xl text-[var(--sf-sage-deep)] sm:text-[1.7rem]" aria-live="off">
          {now ? `${getGreeting(now)},` : " "}
        </p>
        <h1 id="home-greeting" className="sf-display break-words text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[5.4rem]">
          {firstName}.
        </h1>
        <Draw className="mt-1 block w-48 sm:w-60" delay={0.2}>
          <Squiggle className="w-full" color="var(--sf-coral)" />
        </Draw>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <Pill tint="sage" className="min-h-10">
            📅{" "}
            {now
              ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
              : "Today"}
          </Pill>
          <button
            type="button"
            onClick={onJumpToSteps}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
              stepCount > 0
                ? "bg-[var(--sf-coral)]/25 text-[var(--sf-coral-deep)]"
                : "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]"
            }`}
          >
            {stepCount > 0 ? (
              <>
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--sf-coral-deep)] opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--sf-coral-deep)]" />
                </span>
                {stepCount} thing{stepCount > 1 ? "s" : ""} need{stepCount > 1 ? "" : "s"} you
              </>
            ) : (
              <>🌿 All caught up</>
            )}
          </button>
        </div>
      </div>

      {/* Polaroid stack + sticky note */}
      <div
        className="relative mx-auto mb-8 h-[300px] w-full max-w-[420px] sm:mb-0 sm:h-[340px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="sf-polaroid absolute right-2 top-4 w-[62%]" style={{ rotate: "7deg" }} aria-hidden="true">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[3px] bg-[var(--sf-peach)]">
            <Image src={back2} alt="" fill sizes="260px" className="object-cover" />
          </div>
        </div>
        <div className="sf-polaroid absolute left-2 top-10 w-[58%]" style={{ rotate: "-8deg" }} aria-hidden="true">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[3px] bg-[var(--sf-sky)]">
            <Image src={back1} alt="" fill sizes="240px" className="object-cover" />
          </div>
        </div>
        <div
          className="sf-polaroid absolute left-1/2 top-0 w-[72%] -translate-x-1/2 transition-[rotate] duration-300 hover:!rotate-0"
          style={{ rotate: "-2deg" }}
        >
          <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-[var(--sf-butter)]/90 shadow-sm" aria-hidden="true" />
          <div className="relative aspect-[5/4] overflow-hidden rounded-[3px] bg-[var(--sf-mint)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={idx}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Image
                  src={BANNER_IMAGES[idx]}
                  alt="Children learning and playing at Sage Field"
                  fill
                  preload={idx === firstIdx}
                  sizes="(min-width: 1024px) 300px, 72vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="sf-hand pt-2 text-center text-lg leading-none text-[var(--sf-soft)]" aria-hidden="true">
            life at Sage Field ✿
          </p>
        </div>

        {nextEvent ? (
          <Link
            href="/parent/calendar"
            className="sf-wiggle absolute -bottom-6 left-0 z-20 block w-[58%] max-w-[230px] rounded-[6px] bg-[var(--sf-butter)] px-4 pb-4 pt-3 shadow-[0_18px_30px_-18px_rgba(43,42,38,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] sm:-bottom-4 sm:-left-4"
            style={{ rotate: "-3deg" }}
          >
            <span className="sf-hand block text-lg leading-none text-[#7a5a00]">
              {isToday ? "today at Sage Field" : "coming up next"}
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[15px] font-extrabold leading-snug text-[var(--sf-ink)]">
              {nextEvent.title}
            </span>
            <span className="mt-1 block text-xs font-bold text-[#7a5a00]">
              {isToday ? "Today" : formatLongDate(nextEvent.event_date)}
              {formatEventTime(nextEvent) ? ` · ${formatEventTime(nextEvent)}` : ""}
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
