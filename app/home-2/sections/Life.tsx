"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Instagram, Facebook } from "lucide-react";
import WeekCardsGrid from "@/app/components/WeekCardsGrid";
import { LIVE_SUMMER_WEEKS, SCHOOL_YEAR_WEEKS } from "@/app/lib/highlights/weeks";
import { HIGHLIGHTS, BLOG, SOCIAL, PHOTO_POOL } from "@/app/_home-variants/content";
import { useLatestPost, formatPostDate } from "@/app/_home-variants/hooks";
import { ClipReveal, Marquee, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Label, btnCoral } from "../ui";

export function Highlights() {
  const rail = useRef<HTMLDivElement>(null);
  const covers = SCHOOL_YEAR_WEEKS.filter((w) => w.href && w.coverImage);

  return (
    <section className="bg-[var(--h2-night)] py-28 lg:py-40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mb-14 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <Label n="08">{HIGHLIGHTS.badge}</Label>
            <WordsReveal text={HIGHLIGHTS.heading} className="h2-display mt-6 text-6xl md:text-8xl leading-[0.92]" />
          </div>
          <Reveal>
            <p className="text-lg text-[var(--h2-mute)] lg:max-w-md lg:ml-auto">{HIGHLIGHTS.body}</p>
            <p className="h2-label mt-4 text-[var(--h2-coral)] lg:text-right">Drag to explore →</p>
          </Reveal>
        </div>
      </div>

      {/* Draggable week-cover rail */}
      <div ref={rail} className="overflow-hidden px-6 sm:px-10 lg:px-16" data-cursor="Drag">
        <motion.div drag="x" dragConstraints={rail} dragElastic={0.08} className="flex w-max gap-5 cursor-grab active:cursor-grabbing">
          {covers.map((w) => (
            <Link
              key={w.week}
              href={w.href!}
              draggable={false}
              className="group relative block h-[52vh] min-h-[360px] w-[72vw] sm:w-[38vw] lg:w-[26vw] shrink-0 overflow-hidden rounded-[24px]"
            >
              <Image src={w.coverImage!} alt={w.theme} fill draggable={false} className="object-cover transition-transform duration-[1400ms] group-hover:scale-105" sizes="(max-width: 640px) 72vw, 26vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="h2-display h2-outline absolute right-4 top-2 text-8xl">{w.week}</span>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="h2-label text-[var(--h2-coral)]">Week {w.week} · {w.dates}</span>
                <p className="h2-display mt-2 text-2xl leading-tight">{w.theme}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>

      <div className="mx-auto mt-24 max-w-6xl px-6 sm:px-10 lg:px-16">
        {[
          { ...HIGHLIGHTS.schoolYear, weeks: SCHOOL_YEAR_WEEKS, key: "home2-school-year" },
          { ...HIGHLIGHTS.summer, weeks: LIVE_SUMMER_WEEKS, key: "home2-summer" },
        ].map((g) => (
          <Reveal key={g.key} className="mb-16" y={40}>
            <div className="mb-8 border-b border-[var(--h2-line)] pb-5">
              <h3 className="h2-display text-4xl">{g.title}</h3>
              <p className="mt-1 text-sm text-[var(--h2-mute)]">{g.sub}</p>
            </div>
            <WeekCardsGrid weeks={g.weeks} sectionKey={g.key} />
          </Reveal>
        ))}
        <div className="text-center">
          <Link href={HIGHLIGHTS.href} className={btnCoral}>
            {HIGHLIGHTS.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Blog() {
  const latestPost = useLatestPost();
  return (
    <section className="bg-[var(--h2-forest)] py-28 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <Label n="09">{BLOG.badge}</Label>
          <WordsReveal text={BLOG.heading} className="h2-display mt-6 text-6xl md:text-7xl leading-[0.95]" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h2-mute)]">{BLOG.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {BLOG.topics.map((t) => (
                <span key={t} className="rounded-full border border-[var(--h2-line)] px-4 py-1.5 text-xs font-semibold text-[var(--h2-sage)]">
                  {t}
                </span>
              ))}
            </div>
            <Link href={BLOG.href} className={`${btnCoral} mt-8`}>
              {BLOG.cta}
            </Link>
          </Reveal>
        </div>
        <Link href={latestPost ? `/blog/${latestPost.slug}` : BLOG.href} className="group lg:col-span-7 block" data-cursor="Read">
          <ClipReveal className="aspect-[16/10] rounded-[28px] bg-[var(--h2-moss)]">
            {latestPost?.cover_image_signed_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL, same as live page
              <img src={latestPost.cover_image_signed_url} alt={latestPost.title} className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-[var(--h2-sage)]">
                <BookOpen className="mb-2 h-10 w-10" />
                <p className="text-xs font-semibold">{BLOG.placeholderLabel}</p>
              </div>
            )}
          </ClipReveal>
          <div className="mt-6 flex items-start justify-between gap-6">
            <div>
              <p className="text-xs text-[var(--h2-mute)]">
                {latestPost?.author_name ?? BLOG.fallback.author}
                {latestPost?.published_at ? ` · ${formatPostDate(latestPost.published_at)}` : BLOG.fallback.meta}
              </p>
              <h3 className="h2-display mt-2 text-3xl md:text-4xl leading-tight group-hover:italic">{latestPost?.title ?? BLOG.fallback.title}</h3>
              {(latestPost ? latestPost.excerpt : BLOG.fallback.excerpt) && (
                <p className="mt-3 line-clamp-2 text-[var(--h2-mute)]">{latestPost ? latestPost.excerpt : BLOG.fallback.excerpt}</p>
              )}
            </div>
            <span className="shrink-0 pt-6 text-sm font-semibold text-[var(--h2-coral)]">{BLOG.readOn}</span>
          </div>
        </Link>
      </div>
    </section>
  );
}

export function Social() {
  return (
    <section className="bg-[var(--h2-night)] py-28 overflow-hidden">
      <div className="mx-auto mb-12 max-w-3xl px-6 text-center">
        <Label>{SOCIAL.badge}</Label>
        <WordsReveal text={SOCIAL.heading} className="h2-display mt-6 text-5xl md:text-7xl" />
        <Reveal>
          <p className="mt-5 text-lg text-[var(--h2-mute)]">{SOCIAL.body}</p>
        </Reveal>
      </div>
      <Marquee duration={60} trackClassName="gap-4">
        {PHOTO_POOL.map((src, i) => (
          <a
            key={src}
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sage Field on Instagram"
            data-cursor="Follow"
            className={`group relative mr-4 block shrink-0 overflow-hidden rounded-[22px] ${i % 3 === 0 ? "h-80 w-64" : i % 3 === 1 ? "h-64 w-64 mt-16" : "h-72 w-56 mt-8"}`}
          >
            <Image src={src} alt={`Sage Field moment ${i + 1}`} fill className="object-cover grayscale-[40%] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" sizes="260px" />
          </a>
        ))}
      </Marquee>
      <div className="mt-14 flex justify-center gap-3">
        <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#E4405F] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90">
          <Instagram className="h-4 w-4" /> Instagram
        </a>
        <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90">
          <Facebook className="h-4 w-4" /> Facebook
        </a>
      </div>
    </section>
  );
}
