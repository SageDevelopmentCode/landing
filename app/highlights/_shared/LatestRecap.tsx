"use client";

import Image from "next/image";
import Link from "next/link";
import {
  SCHOOL_YEAR_LATEST_LOWER,
  SCHOOL_YEAR_LATEST_PREVIEW_IMAGES,
  SCHOOL_YEAR_LATEST_PRIMARY,
  SCHOOL_YEAR_LATEST_RECAP,
  SCHOOL_YEAR_LATEST_UPPER,
} from "@/app/lib/highlights/school-year-latest-preview";
import { Marquee, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Pill, btnPop } from "@/app/_garden/ui";
import GradeBandCard from "./GradeBandCard";
import type { GradeGroup } from "./types";

// Same bands, labels and emoji as the legacy WeekRecapPreview.
const GRADE_BANDS: GradeGroup[] = [
  { title: "Primary", subtitle: "Pre-K & Kindergarten", emoji: "🌱", tint: "coral", items: SCHOOL_YEAR_LATEST_PRIMARY },
  { title: "Lower Elementary", subtitle: "1st & 2nd Grade", emoji: "✨", tint: "sage", items: SCHOOL_YEAR_LATEST_LOWER },
  { title: "Upper Elementary", subtitle: "3rd & 4th Grade", emoji: "📐", tint: "sky", items: SCHOOL_YEAR_LATEST_UPPER },
];
const TILTS = [-3, 2, -2, 3, -1.5, 2.5];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];

/** Garden preview of the latest school-year weekly recap (replaces WeekRecapPreview). */
export default function LatestRecap({ className = "bg-[var(--sf-mint)]/45" }: { className?: string }) {
  const recap = SCHOOL_YEAR_LATEST_RECAP;
  return (
    <section className={`overflow-hidden py-24 lg:py-32 ${className}`}>
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
        <Pill tint="lav">📸 {recap.badge}</Pill>
        <WordsReveal text={recap.heading} className="sf-display mt-5 text-4xl md:text-6xl" />
        <Reveal>
          <p className="mt-5 text-lg leading-relaxed text-[var(--sf-soft)]">{recap.subtitle}</p>
        </Reveal>
      </div>

      <div className="my-14 -rotate-2" aria-hidden="true">
        <Marquee duration={45} trackClassName="py-4">
          {SCHOOL_YEAR_LATEST_PREVIEW_IMAGES.map((src, i) => (
            <div key={src} className="sf-polaroid relative mx-3 w-56 shrink-0 sm:w-64" style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}>
              <span className="absolute -top-3 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[i % TAPE.length] }} />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                <Image src={src} alt="" fill className="object-cover" sizes="256px" />
              </div>
            </div>
          ))}
        </Marquee>
      </div>

      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <Reveal>
          <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-[var(--sf-soft)]">{recap.body}</p>
        </Reveal>
        <Reveal className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={50}>
          {GRADE_BANDS.map((band, i) => (
            <div key={band.title}>
              <GradeBandCard {...band} tilt={[-1.5, 1, -1][i]} compact headingLevel="h3" />
            </div>
          ))}
        </Reveal>
        <div className="mt-12 text-center">
          <Link href={recap.href} className={btnPop}>
            {recap.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
