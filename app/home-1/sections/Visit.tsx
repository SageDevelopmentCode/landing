"use client";

import Image from "next/image";
import Link from "next/link";
import { Shield, Clock, Calendar, Star } from "lucide-react";
import { ENROLL, TOUR, SHADOW, HERO_SLIDES, PHOTO_POOL } from "@/app/_home-variants/content";
import EnrollForm from "@/app/_home-variants/EnrollForm";
import { ClipReveal, Parallax, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Badge, Chapter, btnPrimary } from "../ui";

export function Enroll() {
  return (
    <section className="bg-[var(--h1-ink)] text-[var(--h1-cream)] py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Badge dark>{ENROLL.badge}</Badge>
            <WordsReveal text={ENROLL.heading} className="h1-display mt-5 text-5xl md:text-6xl font-light leading-[1.02]" />
            <Reveal>
              <p className="mt-6 text-lg leading-relaxed text-white/75">{ENROLL.body}</p>
            </Reveal>
            <Parallax className="mt-10 hidden lg:block aspect-[4/3] rounded-[32px]" amount={14}>
              <Image src={PHOTO_POOL[20]} alt="Students at Sage Field" fill className="object-cover" sizes="40vw" />
            </Parallax>
          </div>
        </div>
        <Reveal className="lg:col-span-7" y={60}>
          <div className="rounded-[36px] bg-[var(--h1-cream)] p-7 md:p-10 text-[var(--h1-ink)]">
            <EnrollForm
              theme={{
                label: "mb-2 block text-sm font-semibold text-[var(--h1-ink)]/80",
                input:
                  "w-full rounded-2xl border border-[var(--h1-ink)]/15 bg-white px-4 py-3.5 text-[var(--h1-ink)] placeholder:text-[var(--h1-ink)]/40 transition focus:border-[var(--h1-coral)] focus:outline-none focus:ring-4 focus:ring-[var(--h1-coral)]/20 disabled:opacity-60",
                button: `${btnPrimary} w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed`,
                success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
                error: "bg-red-50 text-red-800 border border-red-200",
                required: "text-[var(--h1-coral-deep)]",
              }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const TOUR_ICONS = [Shield, Clock, Calendar, Star];
const SHADOW_IMAGE = HERO_SLIDES[5].image;

export function TourAndShadow() {
  return (
    <section className="bg-[var(--h1-cream)] pb-28 lg:pb-36">
      <Chapter eyebrow="come" word="visit" />
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        {/* Tour */}
        <article className="flex flex-col overflow-hidden rounded-[36px] bg-white shadow-[0_30px_80px_-45px_rgba(31,42,36,0.5)]">
          <ClipReveal className="h-80 md:h-[420px]">
            <Image src={TOUR.image} alt="Sage Field outdoor campus" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image src={TOUR.host.image} alt={TOUR.host.name} fill className="object-cover" sizes="40px" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--h1-ink)]">{TOUR.host.name}</p>
                <p className="text-[10px] text-[var(--h1-ink)]/60">{TOUR.host.role}</p>
              </div>
              <span className="ml-1 rounded-full bg-[var(--h1-sage)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--h1-sage)]">{TOUR.host.tag}</span>
            </div>
          </ClipReveal>
          <Reveal className="flex flex-1 flex-col p-8 md:p-10">
            <div>
              <Badge>{TOUR.badge}</Badge>
            </div>
            <h2 className="h1-display mt-4 text-4xl md:text-5xl font-light leading-tight">{TOUR.heading}</h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--h1-ink)]/75">{TOUR.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {TOUR.chips.map((label, i) => {
                const Icon = TOUR_ICONS[i];
                return (
                  <span key={label} className="flex items-center gap-2 rounded-full border border-[var(--h1-ink)]/10 px-4 py-2 text-xs font-semibold">
                    <Icon className="h-3.5 w-3.5 text-[var(--h1-moss)]" />
                    {label}
                  </span>
                );
              })}
            </div>
            <div className="mt-auto pt-8">
              <Link href={TOUR.href} className={btnPrimary}>
                {TOUR.cta}
              </Link>
            </div>
          </Reveal>
        </article>

        {/* Shadow Day */}
        <article className="flex flex-col overflow-hidden rounded-[36px] bg-[var(--h1-sage)] text-white">
          <ClipReveal className="h-80 md:h-[420px]" from="inset(0% 0% 100% 0%)">
            <Image src={SHADOW_IMAGE} alt="A day at Sage Field" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </ClipReveal>
          <Reveal className="flex flex-1 flex-col p-8 md:p-10">
            <div>
              <Badge dark>{SHADOW.badge}</Badge>
            </div>
            <h2 className="h1-display mt-4 text-4xl md:text-5xl font-light leading-tight">{SHADOW.heading}</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">{SHADOW.body}</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {SHADOW.items.map((it) => (
                <li key={it.label} className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">{it.emoji}</span>
                  <div>
                    <p className="text-sm font-bold">{it.label}</p>
                    <p className="text-xs text-white/70">{it.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <Link href={SHADOW.href} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[var(--h1-ink)] transition-colors hover:bg-[var(--h1-coral)] hover:text-white">
                {SHADOW.cta}
              </Link>
            </div>
          </Reveal>
        </article>
      </div>
    </section>
  );
}
