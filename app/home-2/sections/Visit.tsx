"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, Clock, Calendar, Star } from "lucide-react";
import { ENROLL, TOUR, SHADOW, HERO_SLIDES, PHOTO_POOL } from "@/app/_home-variants/content";
import EnrollForm from "@/app/_home-variants/EnrollForm";
import { Marquee, Reveal } from "@/app/_home-variants/motion";
import { Label, btnCoral } from "../ui";

export function Enroll() {
  return (
    <section className="bg-[var(--h2-cream)] text-[var(--h2-night)] py-28 lg:py-40 overflow-hidden">
      <div aria-hidden="true">
      <Marquee duration={30} className="mb-20" trackClassName="items-center">
        {[0, 1, 2].map((k) => (
          <span key={k} className="h2-display flex items-center gap-10 pr-10 text-[12vw] leading-none whitespace-nowrap">
            {ENROLL.heading}
            <span className="relative inline-block h-[8vw] w-[12vw] overflow-hidden rounded-full align-middle">
              <Image src={PHOTO_POOL[k * 5 + 3]} alt="" fill className="object-cover" sizes="12vw" />
            </span>
          </span>
        ))}
      </Marquee>
      </div>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-4">
          <span className="h2-label inline-flex items-center gap-3 text-[#c66b60]">{ENROLL.badge}</span>
          <h2 className="sr-only">{ENROLL.heading}</h2>
          <Reveal>
            <p className="h2-display mt-6 text-3xl leading-snug">{ENROLL.body}</p>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-8" y={50}>
          <EnrollForm
            theme={{
              label: "h2-label mb-2 block text-[0.62rem] text-[var(--h2-night)]/60",
              input:
                "w-full border-0 border-b border-[var(--h2-night)]/20 bg-transparent px-0 py-3 text-lg text-[var(--h2-night)] placeholder:text-[var(--h2-night)]/35 focus:border-[var(--h2-night)] focus:outline-none focus:ring-0 disabled:opacity-60",
              button:
                "mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--h2-night)] px-8 py-5 text-sm font-bold text-[var(--h2-cream)] transition-colors hover:bg-[var(--h2-moss)] disabled:opacity-60 sm:w-auto cursor-pointer",
              success: "bg-emerald-100 text-emerald-900",
              error: "bg-red-100 text-red-900",
              required: "text-[#c66b60]",
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}

const ICONS = [Shield, Clock, Calendar, Star];

export function TourAndShadow() {
  const [focus, setFocus] = useState<0 | 1 | null>(null);
  const grow = (i: 0 | 1) => (focus === null ? "lg:grow" : focus === i ? "lg:grow-[1.6]" : "lg:grow-[0.8]");

  return (
    <section className="bg-[var(--h2-night)]" onMouseLeave={() => setFocus(null)}>
      <div className="flex flex-col lg:flex-row lg:h-screen lg:min-h-[720px]">
        {/* Tour */}
        <article
          onMouseEnter={() => setFocus(0)}
          className={`group relative flex min-h-[90vh] lg:min-h-0 basis-0 grow overflow-hidden transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${grow(0)}`}
        >
          <Image src={TOUR.image} alt="Sage Field outdoor campus" fill className="object-cover transition-transform duration-[1600ms] group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 60vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--h2-night)] via-[var(--h2-night)]/40 to-[var(--h2-night)]/20" />
          <div className="relative mt-auto w-full p-8 md:p-12">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full h2-glass py-2 pl-2 pr-4">
              <span className="relative h-9 w-9 overflow-hidden rounded-full">
                <Image src={TOUR.host.image} alt={TOUR.host.name} fill className="object-cover" sizes="36px" />
              </span>
              <span className="text-xs">
                <strong className="block">{TOUR.host.name}</strong>
                <span className="text-[var(--h2-mute)]">{TOUR.host.role}</span>
              </span>
              <span className="h2-label rounded-full bg-[var(--h2-sage)]/20 px-2 py-0.5 text-[0.55rem] text-[var(--h2-sage)]">{TOUR.host.tag}</span>
            </div>
            <Label>{TOUR.badge}</Label>
            <h2 className="h2-display mt-4 text-5xl md:text-6xl leading-[0.95] max-w-xl">{TOUR.heading}</h2>
            <p className="mt-4 max-w-md text-[var(--h2-mute)]">{TOUR.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {TOUR.chips.map((c, i) => {
                const Icon = ICONS[i];
                return (
                  <span key={c} className="flex items-center gap-2 rounded-full h2-glass px-4 py-2 text-xs font-semibold">
                    <Icon className="h-3.5 w-3.5 text-[var(--h2-sage)]" />
                    {c}
                  </span>
                );
              })}
            </div>
            <Link href={TOUR.href} className={`${btnCoral} mt-8`}>
              {TOUR.cta}
            </Link>
          </div>
        </article>

        {/* Shadow Day */}
        <article
          onMouseEnter={() => setFocus(1)}
          className={`group relative flex min-h-[90vh] lg:min-h-0 basis-0 grow overflow-hidden border-t border-[var(--h2-line)] lg:border-t-0 lg:border-l transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${grow(1)}`}
        >
          <Image src={HERO_SLIDES[5].image} alt="A full school day at Sage Field" fill className="object-cover transition-transform duration-[1600ms] group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 60vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--h2-night)] via-[var(--h2-night)]/50 to-[var(--h2-night)]/20" />
          <div className="relative mt-auto w-full p-8 md:p-12">
            <Label>{SHADOW.badge}</Label>
            <h2 className="h2-display mt-4 text-5xl md:text-6xl leading-[0.95] max-w-xl">{SHADOW.heading}</h2>
            <p className="mt-4 max-w-md text-[var(--h2-mute)]">{SHADOW.body}</p>
            <ul className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              {SHADOW.items.map((it) => (
                <li key={it.label} className="flex items-start gap-3 rounded-2xl h2-glass p-3">
                  <span className="text-xl" aria-hidden="true">{it.emoji}</span>
                  <span>
                    <strong className="block text-sm">{it.label}</strong>
                    <span className="text-xs text-[var(--h2-mute)]">{it.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href={SHADOW.href} className={`${btnCoral} mt-8`}>
              {SHADOW.cta}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
