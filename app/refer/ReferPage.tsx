"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Gift, Shield } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import FaqSection from "@/app/_garden/FaqSection";
import { PillarCards } from "@/app/_garden/program";
import { Magnetic, Marquee, Reveal, Runs, WordsReveal } from "@/app/_garden/motion";
import { Arrow, Draw, Leaf, Pill, Squiggle, Star, Sun, btnOutline, btnPop, fieldInput, fieldLabel } from "@/app/_garden/ui";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import { formatPhone } from "@/app/utils/formatPhone";
import { submitReferral } from "@/app/actions/referral";
import {
  BOTTOM_CTA,
  FAQS,
  FAQ_HEADER,
  FORM,
  GALLERY_IMAGES,
  GIFT_CARDS,
  HERO,
  HERO_PHOTOS,
  HOW,
  PHOTO_ALT,
  REWARD,
  STICKY,
  WHY,
} from "./content";

const NOTES = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];
const NOTE_TILTS = [-2, 1.5, -1];
const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)"];
const HERO_TILTS = [-4, 3, -2];

const highlight = "font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]";

async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 }, colors: ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"] });
  } catch {
    // confetti is a nice-to-have
  }
}

/** The Refer page, built with the Garden design system (app/_garden). */
export default function ReferPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false} smsDesktopOnly>
      <Hero onRefer={scrollToForm} />
      <PhotoStrip />
      <HowItWorks />
      <WhySageField />
      <Reward />
      <ReferralForm formRef={formRef} />
      <FaqSection
        badge={<>❓ {FAQ_HEADER.badge}</>}
        tint="sky"
        heading={FAQ_HEADER.heading}
        sub={FAQ_HEADER.sub}
        items={FAQS}
        idPrefix="refer-faq"
        className="bg-white"
      />
      <BottomCta onRefer={scrollToForm} />
      <LatestRecap />
      <StickyBar onRefer={scrollToForm} />
    </GardenShell>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ onRefer }: { onRefer: () => void }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-24">
      <Draw className="absolute left-[5%] top-[18%] hidden w-16 lg:block" delay={0.5}>
        <Sun />
      </Draw>
      <Draw className="absolute bottom-[12%] left-[44%] hidden w-10 lg:block" delay={1}>
        <Star />
      </Draw>
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:px-16">
        <Reveal className="text-center lg:text-left" stagger={0.1}>
          <h1 className="sf-display text-5xl leading-[0.95] sm:text-6xl lg:text-[5.4rem] lg:leading-[0.92]">
            {HERO.before}{" "}
            <span className="relative isolate inline-block text-[var(--sf-coral)]">
              <Draw className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full" delay={0.4}>
                <Squiggle className="w-full" color="var(--sf-butter)" />
              </Draw>
              <span className="relative z-10">{HERO.highlight}</span>
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-[var(--sf-soft)] md:text-xl lg:mx-0">
            <Runs runs={HERO.body} highlightClassName={highlight} />
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
            <Magnetic>
              <button type="button" onClick={onRefer} className={`${btnPop} w-full sm:w-auto`}>
                {HERO.cta}
              </button>
            </Magnetic>
            <Link href={HERO.learnHref} className={btnOutline}>
              {HERO.learn}
            </Link>
          </div>
          <div className="mt-9 flex justify-center lg:justify-start">
            <div
              className="relative max-w-sm rounded-md bg-[var(--sf-butter)] p-4 pt-6 text-left shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]"
              style={{ rotate: "-1.5deg" }}
            >
              <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
              <p className="flex items-start gap-3 text-sm leading-snug text-[var(--sf-ink)]">
                <span className="text-xl" aria-hidden="true">
                  💰
                </span>
                <span>
                  <Runs runs={HERO.callout} highlightClassName="font-extrabold" />
                </span>
              </p>
            </div>
          </div>
        </Reveal>

        {/* Taped polaroids (desktop) */}
        <div className="relative hidden h-[520px] lg:block" aria-hidden="true">
          {HERO_PHOTOS.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 60, rotate: HERO_TILTS[i] * 2 }}
              animate={{ opacity: 1, y: 0, rotate: HERO_TILTS[i] }}
              transition={{ type: "spring", stiffness: 140, damping: 15, delay: 0.2 + i * 0.12 }}
              className={`sf-polaroid absolute ${
                i === 0 ? "left-0 top-6 w-[58%]" : i === 1 ? "right-0 top-0 w-[46%]" : "bottom-0 right-[12%] w-[48%]"
              }`}
              style={{ rotate: `${HERO_TILTS[i]}deg`, zIndex: i === 2 ? 2 : 1 }}
              whileHover={{ rotate: 0, scale: 1.03, zIndex: 5 }}
            >
              <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[i] }} />
              <div className={`relative overflow-hidden rounded-[3px] ${i === 0 ? "aspect-[3/4]" : "aspect-square"}`}>
                <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 1280px) 25vw, 340px" preload={i < 2} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhotoStrip() {
  return (
    <div className="-rotate-2 pb-10" aria-hidden="true">
      <Marquee duration={60} trackClassName="py-4">
        {GALLERY_IMAGES.map((src, i) => (
          <div key={src} className="sf-polaroid relative mx-3 w-52 shrink-0 sm:w-64 lg:w-72" style={{ rotate: `${i % 2 ? 2 : -2}deg` }}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
              <Image src={src} alt={PHOTO_ALT} fill className="object-cover" sizes="288px" />
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sky">🧭 {HOW.badge}</Pill>
          <WordsReveal text={HOW.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{HOW.sub}</p>
          </Reveal>
        </div>
        <Reveal className="mt-16 grid gap-8 sm:grid-cols-3" stagger={0.12} y={50}>
          {HOW.steps.map((s, i) => (
            <div key={s.title}>
              <div
                className="sf-wiggle relative h-full rounded-md p-7 pt-9 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]"
                style={{ background: NOTES[i], rotate: `${NOTE_TILTS[i]}deg` }}
              >
                <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <span className="sf-hand text-2xl text-[var(--sf-ink)]/70">{s.step}</span>
                  <span className="text-4xl" aria-hidden="true">
                    {s.emoji}
                  </span>
                </div>
                <h3 className="sf-display mt-4 text-3xl">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-[var(--sf-ink)]/75">{s.desc}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── Why Sage Field ──────────────────────────────────────────────────────────

function WhySageField() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--sf-mint)]/45">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Pill tint="sage">🌿 {WHY.badge}</Pill>
          <WordsReveal text={WHY.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">{WHY.sub}</p>
          </Reveal>
        </div>
        <PillarCards pillars={WHY.pillars} className="mt-14" />
        <div className="mt-12 text-center">
          <Link href={WHY.ctaHref} className={btnOutline}>
            {WHY.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── The Reward ──────────────────────────────────────────────────────────────

function Reward() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <Reveal y={60}>
          <div className="relative grid overflow-hidden rounded-[40px] bg-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:grid-cols-5">
            <span className="absolute -top-1 left-12 z-10 h-7 w-28 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
            <div className="p-8 md:col-span-3 md:p-12">
              <Pill tint="coral">
                <Gift className="h-4 w-4" aria-hidden="true" /> {REWARD.badge}
              </Pill>
              <h2 className="sf-display mt-5 text-4xl leading-tight md:text-5xl">{REWARD.heading}</h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--sf-soft)]">{REWARD.body}</p>
              <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[var(--sf-mint)]/60 p-4">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sf-sage-deep)]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-[var(--sf-sage-deep)]">{REWARD.note}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-8 border-t-2 border-dashed border-[var(--sf-ink)]/10 bg-[var(--sf-peach)]/45 p-8 md:col-span-2 md:border-l-2 md:border-t-0 md:p-10">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-ink)]/60">{REWARD.optionsLabel}</p>
                <Marquee duration={30} className="mt-4" trackClassName="py-2">
                  {GIFT_CARDS.map((c) => (
                    <div key={c.label} className="mx-1.5 flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-[0_4px_0_0_rgba(43,42,38,0.08)]">
                      <div className="relative h-10 w-10">
                        <Image src={c.logo} alt={c.label} fill unoptimized className="object-contain" />
                      </div>
                      <span className="text-center text-[11px] font-extrabold text-[var(--sf-soft)]">{c.label}</span>
                    </div>
                  ))}
                </Marquee>
              </div>

              <ol className="flex items-start justify-between gap-1 rounded-3xl bg-white p-5">
                {REWARD.flow.map((step, i) => (
                  <li key={step.num} className="contents">
                    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                      <span
                        className={`sf-display flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                          step.highlight ? "bg-[var(--sf-coral)] text-white shadow-[0_3px_0_0_var(--sf-coral-deep)]" : "bg-[var(--sf-butter)]"
                        }`}
                      >
                        {step.num}
                      </span>
                      <span className={`text-xs font-extrabold leading-tight ${step.highlight ? "text-[var(--sf-coral-deep)]" : ""}`}>{step.label}</span>
                      <span className="sf-hand text-sm leading-none text-[var(--sf-soft)]">{step.sub}</span>
                    </div>
                    {i < REWARD.flow.length - 1 && (
                      <span className="pt-2 text-[var(--sf-ink)]/30" aria-hidden="true">
                        ›
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Referral form ───────────────────────────────────────────────────────────

function FormSection({ children }: { children: ReactNode }) {
  return <p className="sf-hand mb-4 mt-8 text-2xl text-[var(--sf-sage-deep)] first:mt-0">{children}</p>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className={fieldLabel}>
        {label} {required && <span className="text-[var(--sf-coral-deep)]">*</span>}
      </span>
      {children}
    </label>
  );
}

function ReferralForm({ formRef }: { formRef: React.RefObject<HTMLDivElement | null> }) {
  const [formData, setFormData] = useState({
    yourName: "",
    yourEmail: "",
    yourPhone: "",
    theirName: "",
    theirEmail: "",
    theirPhone: "",
    childAge: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.toLowerCase().includes("phone") ? formatPhone(value) : value,
    }));
  };

  const isFormValid =
    !!formData.yourName.trim() && !!formData.yourEmail.trim() && !!formData.theirName.trim() && !!formData.theirEmail.trim();

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitReferral({
      referrerName: formData.yourName,
      referrerEmail: formData.yourEmail,
      referrerPhone: formData.yourPhone || undefined,
      referredName: formData.theirName,
      referredEmail: formData.theirEmail,
      referredPhone: formData.theirPhone || undefined,
      childAge: formData.childAge ? parseInt(formData.childAge) : undefined,
      message: formData.message || undefined,
    });
    if (result.success) {
      await celebrate();
      setSubmitted(true);
    } else {
      setSubmitError(result.message);
    }
    setSubmitting(false);
  };

  const f = FORM.fields;

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-[var(--sf-butter)]/50">
      <Draw className="absolute left-[6%] top-20 hidden w-20 lg:block">
        <Leaf />
      </Draw>
      <div ref={formRef} className="relative mx-auto max-w-3xl scroll-mt-24 px-6 sm:px-10">
        <div className="text-center">
          <Pill tint="coral">✏️ {FORM.badge}</Pill>
          <WordsReveal text={FORM.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
          <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{FORM.sub}</p>
        </div>

        <Reveal y={60} className="mt-12">
          <div className="sf-paper relative rounded-[28px] p-7 shadow-[0_30px_60px_-30px_rgba(43,42,38,0.5)] ring-1 ring-black/5 md:p-12">
            <span className="absolute -top-4 left-10 h-8 w-28 -rotate-3 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center" role="status">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sf-mint)]">
                  <CheckCircle className="h-8 w-8 text-[var(--sf-sage-deep)]" aria-hidden="true" />
                </span>
                <h3 className="sf-display mt-5 text-4xl">{FORM.success.heading}</h3>
                <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-[var(--sf-soft)]">{FORM.success.body}</p>
                <p className="sf-hand mt-5 text-2xl text-[var(--sf-sage-deep)]">{FORM.success.thanks}</p>
              </motion.div>
            ) : (
              <div>
                <FormSection>{FORM.yourInfo}</FormSection>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={f.yourName.label} required>
                    <input type="text" name="yourName" value={formData.yourName} onChange={handleChange} placeholder={f.yourName.placeholder} className={fieldInput} />
                  </Field>
                  <Field label={f.yourEmail.label} required>
                    <input type="email" name="yourEmail" value={formData.yourEmail} onChange={handleChange} placeholder={f.yourEmail.placeholder} className={fieldInput} />
                  </Field>
                  <Field label={f.yourPhone.label}>
                    <input type="tel" name="yourPhone" value={formData.yourPhone} onChange={handleChange} placeholder={f.yourPhone.placeholder} className={fieldInput} />
                  </Field>
                </div>

                <FormSection>{FORM.theirInfo}</FormSection>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={f.theirName.label} required>
                    <input type="text" name="theirName" value={formData.theirName} onChange={handleChange} placeholder={f.theirName.placeholder} className={fieldInput} />
                  </Field>
                  <Field label={f.theirEmail.label} required>
                    <input type="email" name="theirEmail" value={formData.theirEmail} onChange={handleChange} placeholder={f.theirEmail.placeholder} className={fieldInput} />
                  </Field>
                  <Field label={f.theirPhone.label}>
                    <input type="tel" name="theirPhone" value={formData.theirPhone} onChange={handleChange} placeholder={f.theirPhone.placeholder} className={fieldInput} />
                  </Field>
                  <Field label={f.childAge.label}>
                    <select name="childAge" value={formData.childAge} onChange={handleChange} className={`${fieldInput} cursor-pointer`}>
                      <option value="">{f.childAge.placeholder}</option>
                      {FORM.ages.map((age) => (
                        <option key={age} value={age}>
                          {age} {FORM.ageSuffix}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <FormSection>{FORM.anythingElse}</FormSection>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder={f.message.placeholder}
                  aria-label={FORM.anythingElse}
                  className={`${fieldInput} resize-none`}
                />

                {submitError && (
                  <p className="mt-4 rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-800" role="alert">
                    {submitError}
                  </p>
                )}

                <p className="mt-7 text-center text-xs leading-relaxed text-[var(--sf-soft)]">{FORM.consent}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid || submitting}
                  className={`${btnPop} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
                >
                  {submitting ? FORM.submitting : FORM.submit}
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Bottom CTA + sticky bar ─────────────────────────────────────────────────

function BottomCta({ onRefer }: { onRefer: () => void }) {
  return (
    <section className="py-24 lg:py-32 bg-[var(--sf-peach)]/45">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <Reveal y={50}>
          <div className="relative rounded-[40px] bg-white p-8 text-center shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-14">
            <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
            <Draw className="absolute -right-6 -top-8 hidden w-20 md:block" delay={0.3}>
              <Sun />
            </Draw>
            <Pill tint="butter">🎁 {BOTTOM_CTA.badge}</Pill>
            <h2 className="sf-display mt-5 text-4xl md:text-5xl">{BOTTOM_CTA.heading}</h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[var(--sf-soft)]">{BOTTOM_CTA.body}</p>
            <div className="mt-9 flex items-center justify-center gap-4">
              <Draw className="hidden w-14 rotate-12 sm:block">
                <Arrow />
              </Draw>
              <Magnetic>
                <button type="button" onClick={onRefer} className={btnPop}>
                  {BOTTOM_CTA.cta}
                </button>
              </Magnetic>
            </div>
            <p className="mt-6 text-xs text-[var(--sf-soft)]">{BOTTOM_CTA.note}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StickyBar({ onRefer }: { onRefer: () => void }) {
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pt-2 lg:hidden"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[var(--sf-coral)] px-5 py-3 shadow-[0_6px_0_0_var(--sf-coral-deep)]">
        <div>
          <p className="sf-display text-base leading-tight text-white">{STICKY.title}</p>
          <p className="text-xs text-white/85">{STICKY.sub}</p>
        </div>
        <button
          type="button"
          onClick={onRefer}
          className="shrink-0 cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[var(--sf-coral-deep)] transition-colors hover:bg-[var(--sf-cream)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        >
          {STICKY.cta}
        </button>
      </div>
    </motion.div>
  );
}
