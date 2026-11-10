"use client";

import Image from "next/image";
import Link from "next/link";
import { Shield, Clock, Calendar, Star as StarIcon } from "lucide-react";
import { ENROLL, TOUR, SHADOW, HERO_SLIDES } from "@/app/_home/content";
import EnrollForm from "@/app/_garden/EnrollForm";
import { Reveal, WordsReveal } from "@/app/_garden/motion";
import { Draw, Pill, Star, Sun, btnPop, btnSage } from "@/app/_garden/ui";

async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors });
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.6 }, colors }), 250);
}

export function Enroll() {
  return (
    <section className="relative py-24 lg:py-32 bg-[var(--sf-butter)]/50 overflow-hidden">
      <Draw className="absolute left-[6%] top-16 hidden w-24 lg:block">
        <Sun />
      </Draw>
      <Draw className="absolute right-[8%] bottom-20 hidden w-16 lg:block">
        <Star color="var(--sf-sage)" />
      </Draw>
      <div className="relative mx-auto max-w-4xl px-6 sm:px-10">
        <div className="text-center">
          <Pill tint="coral">✏️ {ENROLL.badge}</Pill>
          <WordsReveal text={ENROLL.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--sf-soft)]">{ENROLL.body}</p>
          </Reveal>
        </div>
        <Reveal y={60} className="mt-12">
          <div className="sf-paper relative rounded-[28px] p-7 md:p-12 shadow-[0_30px_60px_-30px_rgba(43,42,38,0.5)] ring-1 ring-black/5">
            <span className="absolute -top-4 left-10 h-8 w-28 -rotate-3 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />
            <EnrollForm
              onSuccess={celebrate}
              theme={{
                label: "mb-2 block text-sm font-extrabold text-[var(--sf-ink)]",
                input:
                  "w-full rounded-2xl border-2 border-[var(--sf-ink)]/15 bg-white px-4 py-3 text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 transition focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)] disabled:opacity-60",
                button: `${btnPop} w-full disabled:opacity-60`,
                success: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)] font-bold",
                error: "bg-red-100 text-red-800 font-bold",
                required: "text-[var(--sf-coral-deep)]",
              }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const ICONS = [Shield, Clock, Calendar, StarIcon];

export function TourAndShadow() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        {/* Tour postcard */}
        <Reveal y={60}>
          <article className="relative -rotate-1 rounded-[24px] bg-white p-5 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)] transition-transform duration-500 hover:rotate-0">
            <div className="relative h-72 overflow-hidden rounded-[16px]">
              <Image src={TOUR.image} alt="Sage Field outdoor campus" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              <span className="absolute right-4 top-4 flex h-20 w-16 flex-col items-center justify-center rounded-md border-2 border-dashed border-white/80 bg-[var(--sf-coral)] text-center text-[0.6rem] font-extrabold uppercase leading-tight text-white rotate-6">
                {TOUR.chips[3]}
              </span>
              <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
                <span className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image src={TOUR.host.image} alt={TOUR.host.name} fill className="object-cover" sizes="40px" />
                </span>
                <span>
                  <span className="block text-xs font-extrabold">{TOUR.host.name}</span>
                  <span className="block text-[10px] text-[var(--sf-soft)]">{TOUR.host.role}</span>
                </span>
                <span className="rounded-full bg-[var(--sf-mint)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--sf-sage-deep)]">{TOUR.host.tag}</span>
              </div>
            </div>
            <div className="p-4 pt-7">
              <Pill tint="sky">🗺️ {TOUR.badge}</Pill>
              <h2 className="sf-display mt-4 text-4xl md:text-5xl">{TOUR.heading}</h2>
              <p className="mt-3 text-lg text-[var(--sf-soft)]">{TOUR.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {TOUR.chips.map((c, i) => {
                  const Icon = ICONS[i];
                  return (
                    <span key={c} className="flex items-center gap-1.5 rounded-full bg-[var(--sf-cream)] px-3.5 py-1.5 text-xs font-extrabold">
                      <Icon className="h-3.5 w-3.5 text-[var(--sf-sage)]" /> {c}
                    </span>
                  );
                })}
              </div>
              <Link href={TOUR.href} className={`${btnSage} mt-7`}>
                {TOUR.cta}
              </Link>
            </div>
          </article>
        </Reveal>

        {/* Shadow Day ticket */}
        <Reveal y={60} delay={0.1}>
          <article className="relative rotate-1 transition-transform duration-500 hover:rotate-0">
            <div className="sf-ticket overflow-hidden rounded-[24px] bg-[var(--sf-coral)] text-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)]">
              <div className="relative h-56">
                <Image src={HERO_SLIDES[5].image} alt="A day at Sage Field" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-coral)] to-transparent" />
              </div>
              <div className="border-t-2 border-dashed border-white/50 p-8">
                <span className="inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-[var(--sf-coral-deep)]">🎟️ {SHADOW.badge}</span>
                <h2 className="sf-display mt-4 text-4xl md:text-5xl">{SHADOW.heading}</h2>
                <p className="mt-3 text-lg text-white/90">{SHADOW.body}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {SHADOW.items.map((it) => (
                    <li key={it.label} className="flex items-start gap-3 rounded-2xl bg-white/15 p-3">
                      <span className="text-2xl" aria-hidden="true">{it.emoji}</span>
                      <span>
                        <strong className="block text-sm">{it.label}</strong>
                        <span className="text-xs text-white/85">{it.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={SHADOW.href}
                  className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-extrabold text-[var(--sf-coral-deep)] shadow-[0_6px_0_0_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5"
                >
                  {SHADOW.cta}
                </Link>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
