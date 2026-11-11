"use client";

import Image from "next/image";
import { Reveal } from "@/app/_garden/motion";
import { Draw, Leaf, Pill, Squiggle, Star, Sun } from "@/app/_garden/ui";
import { ABOUT_HERO } from "./content";

const TILTS = [-6, 2, 7];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];
// The middle polaroid sits higher; the outer two tuck under it.
const OFFSETS = ["mt-6 -mr-4 sm:-mr-6", "z-10", "mt-8 -ml-4 sm:-ml-6"];

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28">
      {/* Doodles */}
      <Draw
        className="absolute left-[8%] top-[22%] hidden w-20 lg:block"
        delay={0.5}
      >
        <Sun />
      </Draw>
      <Draw
        className="absolute right-[9%] top-[30%] hidden w-14 lg:block"
        delay={0.8}
      >
        <Leaf />
      </Draw>
      <Draw
        className="absolute left-[16%] bottom-[18%] hidden w-10 lg:block"
        delay={1}
      >
        <Star />
      </Draw>

      <div className="relative mx-auto max-w-5xl px-6 text-center sm:px-10">
        <Reveal stagger={0.1}>
          <div>
            <Pill tint="coral">📖 {ABOUT_HERO.badge}</Pill>
          </div>
          <h1 className="sf-display mt-6 text-5xl leading-[0.95] sm:text-6xl lg:text-[6.2rem] lg:leading-[0.9]">
            {ABOUT_HERO.headingBefore}{" "}
            <span className="relative isolate inline-block text-[var(--sf-coral)]">
              <Draw
                className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full"
                delay={0.4}
              >
                <Squiggle className="w-full" color="var(--sf-butter)" />
              </Draw>
              <span className="relative z-10">
                {ABOUT_HERO.headingHighlight}
              </span>
            </span>{" "}
            {ABOUT_HERO.headingAfter}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--sf-soft)] md:text-xl">
            {ABOUT_HERO.body}
          </p>
        </Reveal>

        {/* Fanned polaroids (decorative) */}
        <div aria-hidden="true">
          <Reveal
            className="mt-14 flex items-start justify-center"
            stagger={0.12}
            y={60}
          >
            {ABOUT_HERO.photos.map((src, i) => (
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
                      className="object-cover"
                      sizes="(max-width: 640px) 112px, (max-width: 1024px) 160px, 192px"
                      preload
                    />
                  </div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <p className="sf-hand mt-10 text-xl text-[var(--sf-sage-deep)]">
          our story, in a scroll ↓
        </p>
      </div>
    </section>
  );
}
