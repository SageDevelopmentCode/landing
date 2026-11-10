"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TUITION } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import { CountUp, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Pill, btnOutline, btnPop, btnSage } from "../ui";

const STICKERS = ["bg-[var(--h3-butter)]", "bg-[var(--h3-mint)]", "bg-[var(--h3-sky)]"];

export default function Tuition() {
  const { openWaitlist } = useDialogs();
  const [band, setBand] = useState(0);
  const { full, aftercare, fieldDay, homeschool } = TUITION;

  return (
    <section className="bg-[var(--h3-peach)]/45 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tint="coral">💛 {TUITION.badge}</Pill>
          <WordsReveal text={TUITION.heading} className="h3-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mt-5 text-lg text-[var(--h3-soft)]">{TUITION.body}</p>
          </Reveal>
        </div>

        {/* Full enrollment */}
        <Reveal className="mt-14" y={60}>
          <article className="relative grid overflow-hidden rounded-[36px] bg-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] lg:grid-cols-2">
            <div className="relative min-h-[300px]">
              <Image src={full.image} alt={full.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div className="p-8 md:p-12">
              <Pill tint="sage">🗓️ {full.schedule}</Pill>
              <h3 className="h3-display mt-4 text-4xl md:text-5xl">{full.title}</h3>
              <div className="mt-8 flex flex-wrap gap-6">
                {full.tiers.map((t, i) => (
                  <div key={t.label} className={`flex h-44 w-44 flex-col items-center justify-center rounded-full text-center shadow-[0_10px_0_0_rgba(43,42,38,0.08)] ${STICKERS[i]}`} style={{ rotate: `${i ? 6 : -6}deg` }}>
                    <p className="text-xs font-extrabold uppercase tracking-wide">{t.label}</p>
                    <p className="h3-display text-4xl">
                      <CountUp value={t.price} prefix="$" />
                    </p>
                    <p className="text-xs font-bold">
                      {t.unit} · {t.note}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm text-[var(--h3-soft)]">
                <strong className="text-[var(--h3-ink)]">{full.feesLabel}</strong> {full.fees}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button onClick={openWaitlist} className={btnOutline}>
                  {full.interested}
                </button>
                <Link href="/apply" className={btnPop}>
                  {full.enroll}
                </Link>
              </div>
            </div>
          </article>
        </Reveal>

        {/* Packages */}
        <Reveal className="mt-8 grid gap-8 md:grid-cols-2" stagger={0.12}>
          {[aftercare, fieldDay].map((pkg, k) => (
            <article key={pkg.title} className="overflow-hidden rounded-[32px] bg-white shadow-[0_24px_50px_-35px_rgba(43,42,38,0.55)]">
              <div className="relative h-52">
                <Image src={pkg.image} alt={pkg.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                <span className="absolute left-5 top-5">
                  <Pill tint={k ? "butter" : "sky"}>⏰ {pkg.time}</Pill>
                </span>
              </div>
              <div className="p-7">
                <h3 className="h3-display text-3xl">{pkg.title}</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {pkg.options.map((o) => (
                    <div key={o.label} className="rounded-2xl border-2 border-dashed border-[var(--h3-ink)]/15 p-4">
                      <p className="font-extrabold">{o.label}</p>
                      <p className="h3-display text-3xl">
                        <CountUp value={o.price} prefix="$" />
                        <span className="text-base text-[var(--h3-soft)]">{o.unit}</span>
                      </p>
                      {o.note && <p className="text-xs text-[var(--h3-soft)]">{o.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </Reveal>

        {/* Homeschool */}
        <Reveal className="mt-16" y={50}>
          <div className="rounded-[36px] bg-[var(--h3-ink)] p-8 md:p-12 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Pill tint="butter">🏡 {homeschool.badge}</Pill>
                <h3 className="h3-display mt-4 text-4xl md:text-5xl">{homeschool.heading}</h3>
                <p className="mt-1 text-white/70">{homeschool.sub}</p>
              </div>
              <div role="tablist" aria-label="Grade band" className="inline-flex rounded-full bg-white/10 p-1.5">
                {homeschool.bands.map((b, i) => (
                  <button
                    key={b}
                    role="tab"
                    aria-selected={band === i}
                    onClick={() => setBand(i)}
                    className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-extrabold transition-colors cursor-pointer ${band === i ? "text-[var(--h3-ink)]" : "text-white/70"}`}
                  >
                    {band === i && <motion.span layoutId="h3-band" className="absolute inset-0 -z-10 rounded-full bg-[var(--h3-butter)]" transition={{ type: "spring", bounce: 0.35, duration: 0.6 }} />}
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {homeschool.options.map((o, i) => (
                <div key={o.title} className="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10">
                  <span className="h3-hand text-lg text-[var(--h3-butter)]">{["one", "two", "three"][i]} day{i ? "s" : ""}</span>
                  <h4 className="h3-display mt-1 text-2xl">{o.title}</h4>
                  {o.note && <p className="mt-1 text-sm text-white/60">{o.note}</p>}
                  <div className="mt-5 h-14 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={band}
                        initial={{ y: 40, opacity: 0, rotate: -6 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18 }}
                        className="h3-display text-5xl"
                      >
                        ${o.prices[band]}
                        <span className="text-lg text-white/50">/mo</span>
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/40">{homeschool.bands[band]}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/apply" className={btnPop}>
                {homeschool.getStarted}
              </Link>
              <Link href="/homeschool" className={btnSage}>
                {homeschool.learnMore}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
