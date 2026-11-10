"use client";

import Image from "next/image";
import Link from "next/link";
import { TUITION } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import { CountUp, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Label, btnCoral, btnLine } from "../ui";

export default function Tuition() {
  const { openWaitlist } = useDialogs();
  const { full, aftercare, fieldDay, homeschool } = TUITION;

  return (
    <section className="relative overflow-hidden bg-[var(--h2-night)] py-28 lg:py-40">
      {/* Atmospheric photo behind the glass */}
      <div className="absolute inset-0 opacity-40" aria-hidden="true">
        <Image src={full.image} alt="" fill className="object-cover blur-2xl scale-110" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--h2-night)] via-[var(--h2-night)]/60 to-[var(--h2-night)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <Label n="06">{TUITION.badge}</Label>
            <WordsReveal text={TUITION.heading} className="h2-display mt-6 text-6xl md:text-8xl leading-[0.92]" />
          </div>
          <Reveal>
            <p className="text-lg text-[var(--h2-mute)] lg:max-w-md lg:ml-auto">{TUITION.body}</p>
          </Reveal>
        </div>

        <Reveal className="grid gap-6 lg:grid-cols-3" stagger={0.12} y={60}>
          {/* Full enrollment */}
          <article className="h2-glass rounded-[28px] p-8 lg:col-span-2 lg:row-span-2 flex flex-col">
            <div className="relative -mx-8 -mt-8 mb-8 h-64 overflow-hidden rounded-t-[28px]" data-cursor="View">
              <Image src={full.image} alt={full.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
            </div>
            <span className="h2-label text-[var(--h2-coral)]">{full.schedule}</span>
            <h3 className="h2-display mt-3 text-5xl">{full.title}</h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {full.tiers.map((t) => (
                <div key={t.label} className="rounded-2xl border border-[var(--h2-line)] p-6">
                  <p className="text-sm text-[var(--h2-mute)]">{t.label}</p>
                  <p className="h2-display mt-2 text-6xl">
                    <CountUp value={t.price} prefix="$" />
                    <span className="text-xl text-[var(--h2-mute)]">{t.unit}</span>
                  </p>
                  <p className="h2-label mt-2 text-[0.6rem] text-[var(--h2-mute)]">{t.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-[var(--h2-mute)]">
              <span className="font-semibold text-[var(--h2-cream)]">{full.feesLabel}</span> {full.fees}
            </p>
            <div className="mt-auto pt-8 flex flex-wrap gap-3">
              <button onClick={openWaitlist} className={btnLine}>
                {full.interested}
              </button>
              <Link href="/apply" className={btnCoral}>
                {full.enroll}
              </Link>
            </div>
          </article>

          {[aftercare, fieldDay].map((pkg) => (
            <article key={pkg.title} className="h2-glass rounded-[28px] p-7">
              <div className="relative -mx-7 -mt-7 mb-6 h-36 overflow-hidden rounded-t-[28px]">
                <Image src={pkg.image} alt={pkg.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 30vw" />
              </div>
              <span className="h2-label text-[var(--h2-sage)]">{pkg.time}</span>
              <h3 className="h2-display mt-2 text-3xl">{pkg.title}</h3>
              <div className="mt-4 divide-y divide-[var(--h2-line)]">
                {pkg.options.map((o) => (
                  <div key={o.label} className="flex items-end justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold">{o.label}</p>
                      {o.note && <p className="text-xs text-[var(--h2-mute)]">{o.note}</p>}
                    </div>
                    <p className="h2-display text-3xl">
                      <CountUp value={o.price} prefix="$" />
                      <span className="text-sm text-[var(--h2-mute)]">{o.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </Reveal>

        {/* Homeschool table */}
        <Reveal className="mt-6" y={50}>
          <div className="h2-glass rounded-[28px] p-8 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Label>{homeschool.badge}</Label>
                <h3 className="h2-display mt-3 text-4xl md:text-5xl">{homeschool.heading}</h3>
                <p className="mt-1 text-[var(--h2-mute)]">{homeschool.sub}</p>
              </div>
              <div className="flex gap-3">
                <Link href="/apply" className={btnCoral}>
                  {homeschool.getStarted}
                </Link>
                <Link href="/homeschool" className={btnLine}>
                  {homeschool.learnMore}
                </Link>
              </div>
            </div>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-[var(--h2-line)]">
                    <th scope="col" className="py-4 pr-4 h2-label text-[0.62rem] text-[var(--h2-mute)] font-bold">
                      <span className="sr-only">Option</span>
                    </th>
                    {homeschool.bands.map((b) => (
                      <th key={b} scope="col" className="py-4 px-4 h2-label text-[0.62rem] text-[var(--h2-mute)] font-bold text-right">
                        {b}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homeschool.options.map((o) => (
                    <tr key={o.title} className="group border-b border-[var(--h2-line)] last:border-0 transition-colors hover:bg-white/[0.04]">
                      <th scope="row" className="py-5 pr-4 font-normal">
                        <span className="h2-display text-2xl">{o.title}</span>
                        {o.note && <span className="block text-sm text-[var(--h2-mute)]">{o.note}</span>}
                      </th>
                      {o.prices.map((p, i) => (
                        <td key={i} className="py-5 px-4 text-right h2-display text-3xl">
                          ${p}
                          <span className="text-base text-[var(--h2-mute)]">/mo</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
