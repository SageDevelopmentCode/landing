"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "./motion";
import { Draw, Leaf, Pill, Squiggle, Star, Sun, type Tint } from "./ui";

const TILTS = [-6, 2, 7];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];
// The middle polaroid sits higher; the outer two tuck under it.
const OFFSETS = ["mt-6 -mr-4 sm:-mr-6", "z-10", "mt-8 -ml-4 sm:-ml-6"];

/**
 * Header for inner Garden pages: badge, h1 with a squiggle under the
 * highlighted words, a lead paragraph, and optional fanned polaroids.
 * Holds no copy; each page passes its own. `children` renders under the lead
 * (e.g. a search box).
 */
export default function PageHero({
  badge,
  tint = "coral",
  before,
  highlight,
  after,
  body,
  photos = [],
  photoPosition = "object-center",
  note,
  children,
}: {
  badge: ReactNode;
  tint?: Tint;
  before?: string;
  highlight: string;
  after?: string;
  body?: string;
  /** Up to three decorative photos, fanned under the heading. */
  photos?: string[];
  /** object-position class for the photos (e.g. "object-top" for portraits). */
  photoPosition?: string;
  /** Small decorative handwritten note under the photos. */
  note?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28">
      <Draw className="absolute left-[8%] top-[22%] hidden w-20 lg:block" delay={0.5}>
        <Sun />
      </Draw>
      <Draw className="absolute right-[9%] top-[30%] hidden w-14 lg:block" delay={0.8}>
        <Leaf />
      </Draw>
      <Draw className="absolute left-[16%] bottom-[18%] hidden w-10 lg:block" delay={1}>
        <Star />
      </Draw>

      <div className="relative mx-auto max-w-5xl px-6 text-center sm:px-10">
        <Reveal stagger={0.1}>
          <div>
            <Pill tint={tint}>{badge}</Pill>
          </div>
          <h1 className="sf-display mt-6 text-5xl leading-[0.95] sm:text-6xl lg:text-[6.2rem] lg:leading-[0.9]">
            {before && <>{before} </>}
            <span className="relative isolate inline-block text-[var(--sf-coral)]">
              <Draw className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full" delay={0.4}>
                <Squiggle className="w-full" color="var(--sf-butter)" />
              </Draw>
              <span className="relative z-10">{highlight}</span>
            </span>
            {after && <> {after}</>}
          </h1>
          {body && (
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--sf-soft)] md:text-xl">{body}</p>
          )}
        </Reveal>

        {children}

        {photos.length > 0 && (
          <div aria-hidden="true">
            <Reveal className="mt-14 flex items-start justify-center" stagger={0.12} y={60}>
              {photos.slice(0, 3).map((src, i) => (
                <div key={src} className={`relative ${OFFSETS[i]}`}>
                  <div
                    className="sf-polaroid relative w-28 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:!rotate-0 sm:w-40 lg:w-48"
                    style={{ rotate: `${TILTS[i]}deg` }}
                  >
                    <span
                      className="absolute -top-3 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3 rounded-sm opacity-90 sm:h-6 sm:w-20"
                      style={{ background: TAPE[i] }}
                    />
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
                      <Image
                        src={src}
                        alt=""
                        fill
                        className={`object-cover ${photoPosition}`}
                        sizes="(max-width: 640px) 112px, (max-width: 1024px) 160px, 192px"
                        preload
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        )}

        {note && (
          <p className="sf-hand mt-10 text-xl text-[var(--sf-sage-deep)]" aria-hidden="true">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
