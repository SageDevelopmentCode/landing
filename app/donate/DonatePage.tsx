"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { PillarCards } from "@/app/_garden/program";
import { CountUp, Magnetic, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Draw, Leaf, Pill, Star, Sun, btnPop, type Tint } from "@/app/_garden/ui";
import {
  AREAS,
  COMMUNITY,
  DONATE_HERO,
  GALLERY,
  GOAL,
  IMPACT,
  MODAL,
  PIE_SEGMENTS,
  PRESET_AMOUNTS,
  TOTAL,
  VISION,
  amountRaised,
  impactCards,
  propertyAreas,
} from "./content";

// Donut maths from the previous page, with one fix: the gap is now
// PIE_CIRC - dashLen (it was PIE_CIRC, so the dash pattern repeated every
// PIE_CIRC + dashLen and the slices landed scattered, overlapping and gappy)
// and the offset starts the first slice at 12 o'clock as intended.
const PIE_RADIUS = 80;
const PIE_CIRC = 2 * Math.PI * PIE_RADIUS;

const PIE_SLICES = (() => {
  let cumulative = 0;
  return PIE_SEGMENTS.map((seg) => {
    const pct = seg.amount / TOTAL;
    const dashLen = pct * PIE_CIRC;
    const offset = PIE_CIRC / 4 - cumulative;
    cumulative += dashLen;
    return { ...seg, pct, dashLen, gap: PIE_CIRC - dashLen, offset };
  });
})();

const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];
const PHOTO_TILTS = [-2.5, 2, -1.5, 3, 1.5, -3, 2.5, -2];
const CARD_TILTS = [-1.5, 1, -1, 1.5, -1, 1];

/** The Donate page, built with the Garden design system (app/_garden). */
export default function DonatePage() {
  const [showModal, setShowModal] = useState(false);
  const open = () => setShowModal(true);

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>💛 {DONATE_HERO.badge}</>}
        before={DONATE_HERO.before}
        highlight={DONATE_HERO.highlight}
        body={DONATE_HERO.body}
        photos={DONATE_HERO.photos}
      >
        <div className="mt-9 flex justify-center">
          <Magnetic>
            <button type="button" onClick={open} className={btnPop}>
              {DONATE_HERO.cta}
            </button>
          </Magnetic>
        </div>
      </PageHero>

      <Gallery />
      <Vision />
      <Areas />
      <Goal />
      <Community onDonate={open} />
      <Impact onDonate={open} />

      <AnimatePresence>{showModal && <DonationModal onClose={() => setShowModal(false)} />}</AnimatePresence>
    </GardenShell>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionHead({ badge, tint, heading, children }: { badge: ReactNode; tint: Tint; heading: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Pill tint={tint}>{badge}</Pill>
      <WordsReveal text={heading} className="sf-display mt-5 text-5xl md:text-7xl" />
      {children}
    </div>
  );
}

function Gallery() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <SectionHead badge={<>🏡 {GALLERY.badge}</>} tint="sage" heading={GALLERY.heading}>
          <Reveal>
            <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">{GALLERY.body}</p>
          </Reveal>
        </SectionHead>
        <Reveal className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07} y={50}>
          {GALLERY.images.map((img, i) => (
            <div key={img.src}>
              <figure
                className="sf-polaroid group relative transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:!rotate-0"
                style={{ rotate: `${PHOTO_TILTS[i % PHOTO_TILTS.length]}deg` }}
              >
                <span
                  className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90"
                  style={{ background: TAPE[i % TAPE.length] }}
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  />
                </div>
              </figure>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Vision() {
  return (
    <section className="relative overflow-hidden bg-[var(--sf-mint)]/45 py-24 lg:py-32">
      <Draw className="absolute left-[7%] top-[18%] hidden w-16 lg:block">
        <Leaf />
      </Draw>
      <Draw className="absolute right-[8%] bottom-[16%] hidden w-20 lg:block" delay={0.3}>
        <Sun />
      </Draw>
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <SectionHead badge={<>🌿 {VISION.badge}</>} tint="sage" heading={VISION.heading}>
          <Reveal stagger={0.12}>
            {VISION.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">
                {p}
              </p>
            ))}
          </Reveal>
        </SectionHead>
      </div>
    </section>
  );
}

function Areas() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <SectionHead badge={<>🧺 {AREAS.badge}</>} tint="butter" heading={AREAS.heading} />
        <Reveal className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08} y={50}>
          {propertyAreas.map((area, i) => (
            <div key={area.title}>
              <article
                className="group relative flex h-full flex-col rounded-[32px] p-8 pt-9 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:!rotate-0"
                style={{ background: `color-mix(in srgb, ${area.color} 55%, white)`, rotate: `${CARD_TILTS[i % CARD_TILTS.length]}deg` }}
              >
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-[0_8px_20px_-12px_rgba(43,42,38,0.5)] transition-transform duration-500 group-hover:rotate-12"
                  aria-hidden="true"
                >
                  {area.icon}
                </span>
                {/* Sticker with the amount */}
                <span
                  className="sf-display absolute -right-3 -top-4 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-dashed border-white text-xl shadow-[0_10px_24px_-12px_rgba(43,42,38,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-0 group-hover:scale-110"
                  style={{ background: area.color, rotate: "12deg" }}
                >
                  {area.amount}
                </span>
                <h3 className="sf-display mt-6 text-2xl">{area.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-[var(--sf-ink)]/75">{area.description}</p>
              </article>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Goal() {
  const reduce = useReducedMotion();
  return (
    <section className="bg-[var(--sf-sky)]/35 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <SectionHead badge={<>🎯 {GOAL.badge}</>} tint="sky" heading={GOAL.heading} />
        <Reveal className="mx-auto mt-16 max-w-5xl" y={50}>
          <div className="relative grid items-center gap-10 rounded-[40px] bg-white p-8 shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-12 lg:grid-cols-[auto_1fr] lg:gap-16">
            <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-butter)] opacity-90" aria-hidden="true" />

            {/* Donut */}
            <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
              <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden="true">
                <circle cx={110} cy={110} r={PIE_RADIUS} fill="none" stroke="#f0e8e0" strokeWidth={30} />
                {PIE_SLICES.map((slice, i) => (
                  <motion.circle
                    key={slice.label}
                    cx={110}
                    cy={110}
                    r={PIE_RADIUS}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={30}
                    strokeDasharray={`${slice.dashLen} ${slice.gap}`}
                    strokeDashoffset={slice.offset}
                    initial={reduce ? false : { strokeDasharray: `0 ${PIE_CIRC}` }}
                    whileInView={{ strokeDasharray: `${slice.dashLen} ${slice.gap}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" as const }}
                  />
                ))}
                <circle cx={110} cy={110} r={50} fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sf-soft)]">{GOAL.goalLabel}</span>
                <CountUp value={TOTAL} prefix="$" className="sf-display text-2xl sm:text-3xl" />
              </div>
            </div>

            {/* Legend + progress */}
            <div className="w-full">
              <ul className="space-y-3">
                {PIE_SEGMENTS.map((seg) => (
                  <li key={seg.label} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-3">
                      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} aria-hidden="true" />
                      <span className="text-[var(--sf-soft)]">{seg.label}</span>
                    </span>
                    <span className="font-extrabold">${seg.amount.toLocaleString()}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-4 border-t-2 border-dashed border-[var(--sf-ink)]/15 pt-3">
                  <span className="font-extrabold">{GOAL.totalGoal}</span>
                  <span className="sf-display text-xl">${TOTAL.toLocaleString()}</span>
                </li>
              </ul>

              <div className="mt-8">
                <div className="mb-2 flex justify-between gap-4">
                  <span className="font-extrabold">{GOAL.amountRaised}</span>
                  <span className="font-extrabold">
                    ${amountRaised.toLocaleString()} / ${TOTAL.toLocaleString()}
                  </span>
                </div>
                <div
                  className="h-5 w-full overflow-hidden rounded-full bg-[var(--sf-cream)] ring-2 ring-inset ring-[var(--sf-ink)]/10"
                  role="progressbar"
                  aria-label={GOAL.amountRaised}
                  aria-valuemin={0}
                  aria-valuemax={TOTAL}
                  aria-valuenow={amountRaised}
                >
                  <motion.div
                    className="h-full rounded-full bg-[var(--sf-coral)]"
                    initial={reduce ? false : { width: "0%" }}
                    whileInView={{ width: `${(amountRaised / TOTAL) * 100}%` }}
                    style={{ width: `${(amountRaised / TOTAL) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.4 }}
                  />
                </div>
                <p className="sf-hand mt-3 text-xl text-[var(--sf-sage-deep)]">{GOAL.note}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Community({ onDonate }: { onDonate: () => void }) {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <SectionHead badge={<>🤗 {COMMUNITY.badge}</>} tint="coral" heading={COMMUNITY.heading} />
        <Reveal className="mx-auto mt-16 max-w-3xl" y={50}>
          <div className="relative flex flex-col items-center rounded-[40px] border-[3px] border-dashed border-[var(--sf-coral)]/60 bg-[var(--sf-coral)]/10 px-6 py-14 text-center sm:px-12">
            <Draw className="absolute -left-5 -top-6 hidden w-14 sm:block">
              <Star />
            </Draw>
            <span className="sf-wiggle flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-[0_10px_24px_-14px_rgba(43,42,38,0.5)]" aria-hidden="true">
              💛
            </span>
            <h3 className="sf-display mt-6 text-3xl md:text-4xl">{COMMUNITY.cardTitle}</h3>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-[var(--sf-soft)]">{COMMUNITY.cardBody}</p>
            <button type="button" onClick={onDonate} className={`${btnPop} mt-9`}>
              {COMMUNITY.cta}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Impact({ onDonate }: { onDonate: () => void }) {
  return (
    <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <SectionHead badge={<>🌻 {IMPACT.badge}</>} tint="coral" heading={IMPACT.heading} />
        <PillarCards pillars={impactCards} className="mt-16 md:grid-cols-3" />
        <div className="mt-14 flex justify-center">
          <Magnetic>
            <button type="button" onClick={onDonate} className={btnPop}>
              {IMPACT.cta}
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}

// ─── Donation dialog ─────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-2xl border-2 border-[var(--sf-ink)]/15 bg-white px-4 py-3 text-[var(--sf-ink)] placeholder:text-[var(--sf-soft)]/60 transition-colors focus:border-[var(--sf-coral)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-coral)]/20";
const labelCls = "mb-1.5 block text-sm font-extrabold text-[var(--sf-ink)]";

function DonationModal({ onClose }: { onClose: () => void }) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const baseAmountDollars = selectedAmount ?? (parseFloat(customAmount) || 0);
  const baseAmountCents = Math.round(baseAmountDollars * 100);
  const feeAmountCents = coverFees
    ? Math.round((baseAmountCents + 30) / (1 - 0.029)) - baseAmountCents
    : 0;
  const totalCents = baseAmountCents + feeAmountCents;

  function formatCents(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  // Escape closes; focus moves into the dialog and back to the opener on close;
  // the page behind stops scrolling.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  async function handleDonate() {
    setError("");

    if (baseAmountCents < 100) {
      setError(MODAL.errors.minimum);
      return;
    }
    if (!donorEmail) {
      setError(MODAL.errors.email);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: baseAmountCents,
          donorName: donorName || undefined,
          donorEmail,
          message: message || undefined,
          coverFees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || MODAL.errors.generic);
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError(MODAL.errors.network);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        className="absolute inset-0 bg-[var(--sf-ink)]/55 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        data-lenis-prevent
        className="sf-paper relative max-h-[92vh] w-full overflow-y-auto overscroll-contain rounded-t-[32px] shadow-2xl sm:max-w-md sm:rounded-[32px]"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-6 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sf-coral)]/20 text-xl" aria-hidden="true">
              💛
            </span>
            <h2 id={`${id}-title`} className="sf-display text-2xl">
              {MODAL.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={MODAL.close}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--sf-ink)]/5 text-[var(--sf-ink)] transition-colors hover:bg-[var(--sf-ink)]/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 px-6 pb-7 sm:px-7">
          {/* Preset amounts */}
          <div>
            <p id={`${id}-amount`} className={labelCls}>
              {MODAL.selectAmount}
            </p>
            <div role="group" aria-labelledby={`${id}-amount`} className="mb-3 grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => {
                const on = selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                    }}
                    className={`cursor-pointer rounded-full border-2 py-2.5 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 ${
                      on
                        ? "border-[var(--sf-coral)] bg-[var(--sf-coral)] text-white shadow-[0_4px_0_0_var(--sf-coral-deep)]"
                        : "border-[var(--sf-ink)]/15 bg-white text-[var(--sf-ink)] hover:border-[var(--sf-coral)] hover:text-[var(--sf-coral-deep)]"
                    }`}
                  >
                    ${amt}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              min="1"
              placeholder={MODAL.customAmount}
              aria-label={MODAL.customAmount}
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className={inputCls}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor={`${id}-email`} className={labelCls}>
              {MODAL.email} <span className="text-[var(--sf-coral-deep)]">*</span>
            </label>
            <input
              id={`${id}-email`}
              type="email"
              required
              placeholder={MODAL.emailPlaceholder}
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Name (optional) */}
          <div>
            <label htmlFor={`${id}-name`} className={labelCls}>
              {MODAL.name} <span className="font-normal text-[var(--sf-soft)]">{MODAL.optional}</span>
            </label>
            <input
              id={`${id}-name`}
              type="text"
              placeholder={MODAL.namePlaceholder}
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Message (optional) */}
          <div>
            <label htmlFor={`${id}-message`} className={labelCls}>
              {MODAL.message} <span className="font-normal text-[var(--sf-soft)]">{MODAL.optional}</span>
            </label>
            <textarea
              id={`${id}-message`}
              placeholder={MODAL.messagePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Cover fees */}
          {baseAmountCents >= 100 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--sf-mint)]/60 p-4">
              <input
                type="checkbox"
                checked={coverFees}
                onChange={(e) => setCoverFees(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--sf-sage)]"
              />
              <span className="text-sm leading-snug text-[var(--sf-ink)]/80">{MODAL.coverFees(formatCents(feeAmountCents))}</span>
            </label>
          )}

          {/* Error */}
          {error && (
            <p role="alert" className="rounded-2xl bg-[var(--sf-coral)]/15 px-4 py-3 text-sm font-bold text-[var(--sf-coral-deep)]">
              {error}
            </p>
          )}

          {/* Total + CTA */}
          <div className="pt-1">
            {totalCents >= 100 && (
              <p className="mb-4 text-center text-[var(--sf-soft)]" aria-live="polite">
                {MODAL.total} <span className="sf-display text-2xl text-[var(--sf-ink)]">{formatCents(totalCents)}</span>
              </p>
            )}
            <button
              type="button"
              onClick={handleDonate}
              disabled={loading || baseAmountCents < 100}
              className={`${btnPop} w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {MODAL.redirecting}
                </>
              ) : (
                MODAL.donate
              )}
            </button>
            <p className="mt-3 text-center text-xs text-[var(--sf-soft)]">{MODAL.secure}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
