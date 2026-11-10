"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Instagram, Facebook } from "lucide-react";
import WeekCardsGrid from "@/app/components/WeekCardsGrid";
import { LIVE_SUMMER_WEEKS, SCHOOL_YEAR_WEEKS } from "@/app/lib/highlights/weeks";
import { HIGHLIGHTS, BLOG, SOCIAL, PHOTO_POOL } from "@/app/_home-variants/content";
import { useLatestPost, formatPostDate } from "@/app/_home-variants/hooks";
import { ClipReveal, Marquee, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Badge, btnPrimary } from "../ui";

export function Highlights() {
  return (
    <section className="bg-[var(--h1-paper)] py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="mb-16 text-center">
          <Badge>{HIGHLIGHTS.badge}</Badge>
          <WordsReveal text={HIGHLIGHTS.heading} className="h1-display mt-5 text-5xl md:text-6xl font-light" />
          <Reveal>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--h1-ink)]/70">{HIGHLIGHTS.body}</p>
          </Reveal>
        </div>
        {[
          { ...HIGHLIGHTS.schoolYear, weeks: SCHOOL_YEAR_WEEKS, key: "home1-school-year" },
          { ...HIGHLIGHTS.summer, weeks: LIVE_SUMMER_WEEKS, key: "home1-summer" },
        ].map((g) => (
          <Reveal key={g.key} className="mb-16" y={50}>
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--h1-ink)]/10 pb-5">
              <div>
                <h3 className="h1-display text-3xl">{g.title}</h3>
                <p className="mt-1 text-sm text-[var(--h1-ink)]/60">{g.sub}</p>
              </div>
            </div>
            <WeekCardsGrid weeks={g.weeks} sectionKey={g.key} />
          </Reveal>
        ))}
        <div className="text-center">
          <Link href={HIGHLIGHTS.href} className={btnPrimary}>
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
    <section className="bg-[var(--h1-cream)] py-28 lg:py-36">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <div>
          <Badge>{BLOG.badge}</Badge>
          <WordsReveal text={BLOG.heading} className="h1-display mt-5 text-5xl md:text-6xl font-light leading-[1.02]" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--h1-ink)]/75">{BLOG.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {BLOG.topics.map((t) => (
                <span key={t} className="rounded-full border border-[var(--h1-sage)]/25 px-4 py-1.5 text-xs font-semibold text-[var(--h1-sage)]">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8">
              <Link href={BLOG.href} className={btnPrimary}>
                {BLOG.cta}
              </Link>
            </div>
          </Reveal>
        </div>

        <Link
          href={latestPost ? `/blog/${latestPost.slug}` : BLOG.href}
          className="group block overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_-45px_rgba(31,42,36,0.5)]"
        >
          <ClipReveal className="h-64 md:h-80 bg-gradient-to-br from-[var(--h1-paper)] to-[#fde5df]">
            {latestPost?.cover_image_signed_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL, same as live page
              <img src={latestPost.cover_image_signed_url} alt={latestPost.title} className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <BookOpen className="mb-2 h-10 w-10 text-[var(--h1-moss)]" />
                <p className="text-xs font-semibold text-[var(--h1-moss)]">{BLOG.placeholderLabel}</p>
              </div>
            )}
          </ClipReveal>
          <div className="p-7 md:p-9">
            <p className="text-xs text-[var(--h1-ink)]/50">
              {latestPost?.author_name ?? BLOG.fallback.author}
              {latestPost?.published_at ? ` · ${formatPostDate(latestPost.published_at)}` : BLOG.fallback.meta}
            </p>
            <h3 className="h1-display mt-3 text-2xl md:text-3xl leading-snug">{latestPost?.title ?? BLOG.fallback.title}</h3>
            {(latestPost ? latestPost.excerpt : BLOG.fallback.excerpt) && (
              <p className="mt-3 line-clamp-3 leading-relaxed text-[var(--h1-ink)]/65">
                {latestPost ? latestPost.excerpt : BLOG.fallback.excerpt}
              </p>
            )}
            <span className="mt-6 inline-block border-t border-[var(--h1-ink)]/10 pt-5 text-sm font-semibold text-[var(--h1-coral-deep)]">
              {BLOG.readOn}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

const ROW_A = PHOTO_POOL.slice(0, 16);
const ROW_B = PHOTO_POOL.slice(16);

export function Social() {
  return (
    <section className="bg-[var(--h1-paper)] py-28 overflow-hidden">
      <div className="mx-auto mb-14 max-w-3xl px-6 text-center">
        <Badge>{SOCIAL.badge}</Badge>
        <WordsReveal text={SOCIAL.heading} className="h1-display mt-5 text-4xl md:text-6xl font-light" />
        <Reveal>
          <p className="mt-5 text-lg text-[var(--h1-ink)]/70">{SOCIAL.body}</p>
        </Reveal>
      </div>
      <div className="space-y-4 -rotate-2 scale-105">
        {[ROW_A, ROW_B].map((row, r) => (
          <Marquee key={r} reverse={r === 1} duration={55} trackClassName="gap-4">
            {row.map((src, i) => (
              <a
                key={src}
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Sage Field on Instagram"
                className="group relative mr-4 block h-56 w-56 md:h-64 md:w-64 shrink-0 overflow-hidden rounded-3xl"
              >
                <Image src={src} alt={`Sage Field moment ${r * 16 + i + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="256px" />
                <span className="absolute inset-0 flex items-center justify-center bg-[var(--h1-ink)]/0 opacity-0 transition-all duration-500 group-hover:bg-[var(--h1-ink)]/40 group-hover:opacity-100">
                  <Instagram className="h-7 w-7 text-white" />
                </span>
              </a>
            ))}
          </Marquee>
        ))}
      </div>
      <div className="mt-14 flex justify-center gap-3">
        <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#E4405F] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90">
          <Instagram className="h-4 w-4" /> Instagram
        </a>
        <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90">
          <Facebook className="h-4 w-4" /> Facebook
        </a>
      </div>
    </section>
  );
}
