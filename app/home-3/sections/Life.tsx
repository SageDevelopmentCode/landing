"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Instagram, Facebook } from "lucide-react";
import WeekCardsGrid from "@/app/components/WeekCardsGrid";
import { LIVE_SUMMER_WEEKS, SCHOOL_YEAR_WEEKS, SUMMER_WEEKS } from "@/app/lib/highlights/weeks";
import { HIGHLIGHTS, BLOG, SOCIAL, PHOTO_POOL } from "@/app/_home-variants/content";
import { useLatestPost, formatPostDate } from "@/app/_home-variants/hooks";
import { Marquee, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Pill, btnPop } from "../ui";

const PILL_TINTS = ["bg-[var(--h3-butter)]", "bg-[var(--h3-mint)]", "bg-[var(--h3-sky)]", "bg-[var(--h3-lav)]", "bg-[var(--h3-peach)]"];
const THEMES = [...SCHOOL_YEAR_WEEKS, ...SUMMER_WEEKS].map((w) => w.theme);

export function Highlights() {
  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Pill tint="lav">📸 {HIGHLIGHTS.badge}</Pill>
        <WordsReveal text={HIGHLIGHTS.heading} className="h3-display mt-5 text-5xl md:text-7xl" />
        <Reveal>
          <p className="mt-5 text-lg text-[var(--h3-soft)]">{HIGHLIGHTS.body}</p>
        </Reveal>
      </div>
      <div className="my-14 -rotate-2 space-y-3" aria-hidden="true">
        <Marquee duration={50} trackClassName="gap-3">
          {THEMES.slice(0, 12).map((t, i) => (
            <span key={`${t}-${i}`} className={`mr-3 whitespace-nowrap rounded-full px-6 py-3 h3-display text-xl ${PILL_TINTS[i % 5]}`}>
              {t}
            </span>
          ))}
        </Marquee>
        <Marquee duration={50} reverse trackClassName="gap-3">
          {THEMES.slice(12).map((t, i) => (
            <span key={`${t}-${i}`} className={`mr-3 whitespace-nowrap rounded-full px-6 py-3 h3-display text-xl ${PILL_TINTS[(i + 2) % 5]}`}>
              {t}
            </span>
          ))}
        </Marquee>
      </div>
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        {[
          { ...HIGHLIGHTS.schoolYear, weeks: SCHOOL_YEAR_WEEKS, key: "home3-school-year", emoji: "🍎" },
          { ...HIGHLIGHTS.summer, weeks: LIVE_SUMMER_WEEKS, key: "home3-summer", emoji: "☀️" },
        ].map((g) => (
          <Reveal key={g.key} className="mb-16" y={40}>
            <div className="mb-8">
              <h3 className="h3-display text-3xl">
                <span aria-hidden="true">{g.emoji}</span> {g.title}
              </h3>
              <p className="mt-1 text-[var(--h3-soft)]">{g.sub}</p>
            </div>
            <WeekCardsGrid weeks={g.weeks} sectionKey={g.key} />
          </Reveal>
        ))}
        <div className="text-center">
          <Link href={HIGHLIGHTS.href} className={btnPop}>
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
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <div>
          <Pill tint="sage">📚 {BLOG.badge}</Pill>
          <WordsReveal text={BLOG.heading} className="h3-display mt-5 text-5xl md:text-6xl" />
          <Reveal>
            <p className="mt-5 text-lg leading-relaxed text-[var(--h3-soft)]">{BLOG.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {BLOG.topics.map((t, i) => (
                <span key={t} className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${PILL_TINTS[i]}`}>
                  {t}
                </span>
              ))}
            </div>
            <Link href={BLOG.href} className={`${btnPop} mt-8`}>
              {BLOG.cta}
            </Link>
          </Reveal>
        </div>
        <Reveal y={60}>
          <Link href={latestPost ? `/blog/${latestPost.slug}` : BLOG.href} className="group block rotate-1 overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)] transition-transform duration-500 hover:rotate-0 hover:-translate-y-1">
            <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[var(--h3-mint)] to-[var(--h3-sky)]">
              {latestPost?.cover_image_signed_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL, same as live page
                <img src={latestPost.cover_image_signed_url} alt={latestPost.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-[var(--h3-sage-deep)]">
                  <BookOpen className="mb-2 h-10 w-10" />
                  <p className="text-xs font-extrabold">{BLOG.placeholderLabel}</p>
                </div>
              )}
            </div>
            <div className="p-7">
              <p className="text-xs font-bold text-[var(--h3-soft)]">
                {latestPost?.author_name ?? BLOG.fallback.author}
                {latestPost?.published_at ? ` · ${formatPostDate(latestPost.published_at)}` : BLOG.fallback.meta}
              </p>
              <h3 className="h3-display mt-2 text-2xl leading-snug">{latestPost?.title ?? BLOG.fallback.title}</h3>
              {(latestPost ? latestPost.excerpt : BLOG.fallback.excerpt) && (
                <p className="mt-2 line-clamp-3 text-[var(--h3-soft)]">{latestPost ? latestPost.excerpt : BLOG.fallback.excerpt}</p>
              )}
              <span className="mt-5 inline-block font-extrabold text-[var(--h3-coral-deep)]">{BLOG.readOn}</span>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function Social() {
  return (
    <section className="py-24 bg-[var(--h3-lav)]/40 overflow-hidden">
      <div className="mx-auto mb-12 max-w-3xl px-6 text-center">
        <Pill tint="coral">💬 {SOCIAL.badge}</Pill>
        <WordsReveal text={SOCIAL.heading} className="h3-display mt-5 text-4xl md:text-6xl" />
        <Reveal>
          <p className="mt-5 text-lg text-[var(--h3-soft)]">{SOCIAL.body}</p>
        </Reveal>
      </div>
      <Marquee duration={70} trackClassName="items-center py-6">
        {PHOTO_POOL.map((src, i) => (
          <a
            key={src}
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sage Field on Instagram"
            className="h3-polaroid group mr-6 block w-52 shrink-0 transition-transform duration-500 hover:scale-105 hover:rotate-0"
            style={{ rotate: `${[-5, 3, -2, 6, -4][i % 5]}deg` }}
          >
            <div className="relative aspect-square overflow-hidden rounded-[3px]">
              <Image src={src} alt={`Sage Field moment ${i + 1}`} fill className="object-cover" sizes="208px" />
            </div>
          </a>
        ))}
      </Marquee>
      <div className="mt-10 flex justify-center gap-3">
        <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#E4405F] px-6 py-3.5 font-extrabold text-white shadow-[0_5px_0_0_#b02d47]">
          <Instagram className="h-4 w-4" /> Instagram
        </a>
        <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-3.5 font-extrabold text-white shadow-[0_5px_0_0_#0f56b3]">
          <Facebook className="h-4 w-4" /> Facebook
        </a>
      </div>
    </section>
  );
}
