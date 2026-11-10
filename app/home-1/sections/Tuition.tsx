"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, PartyPopper } from "lucide-react";
import { TUITION } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import { CountUp, Parallax, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Badge, btnGhost, btnPrimary } from "../ui";

export default function Tuition() {
  const { openWaitlist } = useDialogs();
  const [band, setBand] = useState(0);
  const { full, aftercare, fieldDay, homeschool } = TUITION;

  return (
    <section className="h1-grain bg-[var(--h1-paper)] py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <Badge>{TUITION.badge}</Badge>
            <WordsReveal text={TUITION.heading} className="h1-display mt-5 text-5xl md:text-7xl font-light leading-[0.98]" />
          </div>
          <Reveal>
            <p className="text-lg leading-relaxed text-[var(--h1-ink)]/75 lg:max-w-md lg:ml-auto">{TUITION.body}</p>
          </Reveal>
        </div>

        {/* Full enrollment */}
        <Reveal y={80}>
          <article className="grid overflow-hidden rounded-[36px] bg-[var(--h1-ink)] text-[var(--h1-cream)] lg:grid-cols-[1.05fr_1fr]">
            <Parallax className="min-h-[320px] lg:min-h-[560px]" amount={14}>
              <Image src={full.image} alt={full.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
            </Parallax>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="flex items-center gap-3 text-[var(--h1-coral)]">
                <Calendar className="h-5 w-5" />
                <span className="h1-eyebrow">{full.schedule}</span>
              </div>
              <h3 className="h1-display mt-4 text-4xl md:text-5xl">{full.title}</h3>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {full.tiers.map((t) => (
                  <div key={t.label} className="rounded-3xl border border-white/15 bg-white/5 p-6">
                    <p className="text-sm text-white/70">{t.label}</p>
                    <p className="mt-2 h1-display text-5xl font-light">
                      <CountUp value={t.price} prefix="$" />
                      <span className="text-lg text-white/60">{t.unit}</span>
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-white/50">{t.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-white/70">
                <span className="font-semibold text-white">{full.feesLabel}</span> {full.fees}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={openWaitlist} className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[var(--h1-ink)] cursor-pointer">
                  {full.interested}
                </button>
                <Link href="/apply" className={btnPrimary}>
                  {full.enroll}
                </Link>
              </div>
            </div>
          </article>
        </Reveal>

        {/* Packages */}
        <Reveal className="mt-8 grid gap-8 md:grid-cols-2" stagger={0.15}>
          {[
            { ...aftercare, Icon: Clock },
            { ...fieldDay, Icon: PartyPopper },
          ].map((pkg) => (
            <article key={pkg.title} className="group overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_-45px_rgba(31,42,36,0.5)]">
              <div className="relative h-56 overflow-hidden">
                <Image src={pkg.image} alt={pkg.title} fill className="object-cover transition-transform duration-[1400ms] group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 text-[var(--h1-moss)]">
                  <pkg.Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{pkg.time}</span>
                </div>
                <h3 className="h1-display mt-2 text-3xl">{pkg.title}</h3>
                <div className="mt-6 space-y-3">
                  {pkg.options.map((o) => (
                    <div key={o.label} className="flex items-end justify-between gap-4 border-t border-[var(--h1-ink)]/10 pt-3">
                      <div>
                        <p className="font-semibold">{o.label}</p>
                        {o.note && <p className="text-xs text-[var(--h1-ink)]/55">{o.note}</p>}
                      </div>
                      <p className="h1-display text-3xl">
                        <CountUp value={o.price} prefix="$" />
                        <span className="text-base text-[var(--h1-ink)]/50">{o.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </Reveal>

        {/* Homeschool */}
        <Reveal className="mt-20" y={60}>
          <div className="rounded-[36px] border border-[var(--h1-ink)]/10 bg-[var(--h1-cream)] p-8 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge>{homeschool.badge}</Badge>
                <h3 className="h1-display mt-4 text-4xl md:text-5xl font-light">{homeschool.heading}</h3>
                <p className="mt-2 text-[var(--h1-ink)]/70">{homeschool.sub}</p>
              </div>
              <div role="tablist" aria-label="Grade band" className="relative inline-flex rounded-full bg-[var(--h1-ink)]/5 p-1.5">
                {homeschool.bands.map((b, i) => (
                  <button
                    key={b}
                    role="tab"
                    aria-selected={band === i}
                    onClick={() => setBand(i)}
                    className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${band === i ? "text-white" : "text-[var(--h1-ink)]/70"}`}
                  >
                    {band === i && (
                      <motion.span layoutId="h1-band" className="absolute inset-0 -z-10 rounded-full bg-[var(--h1-sage)]" transition={{ type: "spring", bounce: 0.25, duration: 0.6 }} />
                    )}
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {homeschool.options.map((o, i) => (
                <div key={o.title} className="relative overflow-hidden rounded-3xl bg-white p-7 shadow-[0_20px_50px_-35px_rgba(31,42,36,0.5)]">
                  <span className="h1-display text-6xl font-light text-[var(--h1-coral)]/30 absolute right-5 top-2">{i + 1}</span>
                  <h4 className="h1-display text-2xl">{o.title}</h4>
                  {o.note && <p className="mt-1 text-sm text-[var(--h1-ink)]/60">{o.note}</p>}
                  <div className="mt-6 h-14 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={band}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="h1-display text-5xl font-light"
                      >
                        ${o.prices[band]}
                        <span className="text-lg text-[var(--h1-ink)]/50">/mo</span>
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-widest text-[var(--h1-ink)]/45">{homeschool.bands[band]}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/apply" className={btnPrimary}>
                {homeschool.getStarted}
              </Link>
              <Link href="/homeschool" className={btnGhost}>
                {homeschool.learnMore}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
