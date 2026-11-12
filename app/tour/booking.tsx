"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Calendar, CalendarCheck, Check, CheckCircle, Clock, ExternalLink, MapPin, Sparkles, Star, Users, X } from "lucide-react";
import { formatShortDate } from "@/app/_garden/CalendarGrid";
import { Draw, Squiggle, btnPop } from "@/app/_garden/ui";
import { CONFIRM, LOCATION, SCHEDULE, SUCCESS, TIME_SLOTS } from "./content";

/** Booking UI for the Tour page. State lives in TourPage; these only render it. */

export type TourStep = 1 | 2 | 3;

export interface TourFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  childName: string;
  childGrade: string;
  numChildren: string;
  referralSource: string;
  notes: string;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

const slotClass = (selected: boolean) =>
  `w-full cursor-pointer rounded-full border-2 px-4 py-3 text-left text-sm font-extrabold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30 ${
    selected
      ? "border-[var(--sf-coral)] bg-[var(--sf-coral)] text-white shadow-[0_4px_0_0_var(--sf-coral-deep)]"
      : "border-[var(--sf-ink)]/10 bg-white text-[var(--sf-ink)] hover:border-[var(--sf-coral)]/60 hover:bg-[var(--sf-coral)]/10"
  }`;

// ─── Step indicator ──────────────────────────────────────────────────────────

const DOTS = ["bg-[var(--sf-butter)]", "bg-[var(--sf-sky)]", "bg-[var(--sf-mint)]"];

export function StepIndicator({ currentStep }: { currentStep: TourStep }) {
  return (
    <ol className="mb-10 flex items-start justify-center">
      {SCHEDULE.stepLabels.map((label, i) => {
        const stepNum = (i + 1) as TourStep;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        return (
          <li key={label} className="flex items-start" aria-current={isActive ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <motion.span
                animate={isActive ? { rotate: [-6, 6, -6] } : { rotate: 0 }}
                transition={isActive ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" } : { duration: 0.3 }}
                className={`sf-display flex h-12 w-12 items-center justify-center rounded-full text-lg transition-colors duration-300 ${
                  isCompleted
                    ? "bg-[var(--sf-sage)] text-white shadow-[0_4px_0_0_var(--sf-sage-deep)]"
                    : isActive
                      ? "bg-[var(--sf-coral)] text-white shadow-[0_4px_0_0_var(--sf-coral-deep)]"
                      : `${DOTS[i]} text-[var(--sf-ink)]/50`
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" aria-hidden="true" /> : stepNum}
              </motion.span>
              <span className={`mt-2.5 w-24 text-center text-xs font-extrabold leading-tight ${isActive ? "text-[var(--sf-coral-deep)]" : "text-[var(--sf-ink)]/60"}`}>
                {label}
              </span>
              <span className="sf-hand mt-0.5 w-24 text-center text-sm leading-tight text-[var(--sf-soft)]">{SCHEDULE.stepMicrocopy[i]}</span>
            </div>
            {i < SCHEDULE.stepLabels.length - 1 && (
              <span
                className={`mx-1 mt-6 h-1 w-8 rounded-full transition-colors duration-500 sm:w-20 ${currentStep > stepNum ? "bg-[var(--sf-sage)]" : "bg-[var(--sf-ink)]/10"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Time slots ──────────────────────────────────────────────────────────────

export function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onSelectTime,
  blockedTimes,
}: {
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  blockedTimes: Set<string>;
}) {
  const open = TIME_SLOTS.filter((slot) => !blockedTimes.has(slot));
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--sf-coral-deep)]" aria-hidden="true" />
        <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--sf-ink)]">
          {selectedDate ? formatShortDate(selectedDate) : SCHEDULE.selectDate}
        </p>
      </div>
      {!selectedDate ? (
        <p className="sf-hand text-xl text-[var(--sf-soft)]">{SCHEDULE.pickDateHint}</p>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1" data-lenis-prevent>
          {open.length === 0 ? (
            <p className="sf-hand text-xl text-[var(--sf-soft)]">{SCHEDULE.noTimes}</p>
          ) : (
            open.map((slot) => (
              <button key={slot} type="button" onClick={() => onSelectTime(slot)} aria-pressed={selectedTime === slot} className={slotClass(selectedTime === slot)}>
                {slot}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Mobile time picker. Sits above the sticky CTA bar (z-[60]/z-[70]). */
export function TimeBottomSheet({
  open,
  onClose,
  selectedDate,
  selectedTime,
  onSelectTime,
  blockedTimes,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  blockedTimes: Set<string>;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handlePick(slot: string) {
    onSelectTime(slot);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[60] bg-[var(--sf-ink)]/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={selectedDate ? formatShortDate(selectedDate) : SCHEDULE.pickTime}
            className="fixed inset-x-0 bottom-0 z-[70] flex flex-col rounded-t-[32px] bg-[var(--sf-cream)] shadow-2xl lg:hidden"
            style={{ maxHeight: "75vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-3" aria-hidden="true">
              <span className="h-1.5 w-12 rounded-full bg-[var(--sf-ink)]/20" />
            </div>
            <div className="flex shrink-0 items-center justify-between border-b-2 border-dashed border-[var(--sf-ink)]/10 px-6 py-4">
              <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                <Clock className="h-4 w-4 text-[var(--sf-coral-deep)]" aria-hidden="true" />
                {selectedDate ? formatShortDate(selectedDate) : SCHEDULE.pickTime}
              </p>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-full bg-white p-2 text-[var(--sf-ink)] shadow-sm" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
              <div className="grid grid-cols-2 gap-2 pb-6">
                {TIME_SLOTS.filter((slot) => !blockedTimes.has(slot)).map((slot) => (
                  <button key={slot} type="button" onClick={() => handlePick(slot)} aria-pressed={selectedTime === slot} className={`${slotClass(selectedTime === slot)} text-center`}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SelectedSlotChip({ date, time }: { date: Date | null; time: string | null }) {
  const show = date !== null || time !== null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-6 flex items-center gap-3 rounded-2xl bg-[var(--sf-mint)] px-4 py-3"
          role="status"
        >
          <Check className="h-4 w-4 shrink-0 text-[var(--sf-sage-deep)]" aria-hidden="true" />
          <p className="text-sm font-extrabold text-[var(--sf-sage-deep)]">
            {date ? formatShortDate(date) : SCHEDULE.datePending}
            {time ? ` · ${time}` : SCHEDULE.selectTimeHint}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Step 3: confirmation ticket ─────────────────────────────────────────────

export function ConfirmationSummary({
  selectedDate,
  selectedTime,
  formData,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  selectedDate: Date | null;
  selectedTime: string | null;
  formData: TourFormData;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string;
}) {
  return (
    <div>
      <motion.div
        className="mb-8 flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <span className="flex h-20 w-20 -rotate-6 items-center justify-center rounded-[28px] bg-[var(--sf-butter)]">
          <CheckCircle className="h-10 w-10 text-[var(--sf-coral-deep)]" aria-hidden="true" />
        </span>
        <h3 className="sf-display mt-5 text-4xl">{CONFIRM.heading}</h3>
        <p className="mt-2 max-w-sm text-[var(--sf-soft)]">{CONFIRM.body}</p>
      </motion.div>

      <div className="sf-ticket mx-auto mb-8 max-w-xl overflow-hidden rounded-[24px] bg-[var(--sf-mint)]">
        <p className="sf-hand border-b-2 border-dashed border-[var(--sf-sage-deep)]/25 px-8 py-4 text-center text-2xl text-[var(--sf-sage-deep)]">
          🎟️ {CONFIRM.summaryTitle}
        </p>
        <div className="space-y-4 px-8 py-6">
          <SummaryRow icon={<Calendar className="h-4 w-4" />} label={CONFIRM.date}>
            {selectedDate ? formatDisplayDate(selectedDate) : "—"}
          </SummaryRow>
          <SummaryRow icon={<Clock className="h-4 w-4" />} label={CONFIRM.time}>
            {selectedTime ?? "—"}
          </SummaryRow>
          <div className="border-t-2 border-dashed border-[var(--sf-sage-deep)]/20" />
          <SummaryRow icon={<Users className="h-4 w-4" />} label={CONFIRM.parent}>
            {formData.firstName} {formData.lastName}
          </SummaryRow>
          <SummaryRow icon={<BookOpen className="h-4 w-4" />} label={CONFIRM.child}>
            {formData.childName}
            {formData.childGrade ? ` — ${formData.childGrade}` : ""}
          </SummaryRow>
          {formData.notes && (
            <SummaryRow icon={<Star className="h-4 w-4" />} label={CONFIRM.notes}>
              {formData.notes}
            </SummaryRow>
          )}
        </div>
      </div>

      {submitError && (
        <p className="mx-auto mb-4 max-w-xl rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-800" role="alert">
          {submitError}
        </p>
      )}

      <div className="mx-auto max-w-xl">
        <button type="button" onClick={onSubmit} disabled={isSubmitting} className={`${btnPop} w-full disabled:cursor-not-allowed disabled:opacity-50`}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? CONFIRM.submitting : CONFIRM.submit}
        </button>
        <p className="mt-3 text-center text-xs text-[var(--sf-soft)]">{CONFIRM.footnote}</p>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-sage-deep)]" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-sage-deep)]/80">{label}</p>
        <p className="font-extrabold text-[var(--sf-ink)]">{children}</p>
      </div>
    </div>
  );
}

// ─── Success screen ──────────────────────────────────────────────────────────

export function SuccessCard({ selectedDate, selectedTime, email }: { selectedDate: Date | null; selectedTime: string | null; email: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors });
      setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.5 }, colors }), 250);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-6 pt-36 pb-24 lg:pt-44">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative mx-auto max-w-xl rounded-[40px] bg-white p-8 text-center shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] sm:p-12"
      >
        <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
        <motion.span
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-[var(--sf-mint)]"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
        >
          <CheckCircle className="h-12 w-12 text-[var(--sf-sage-deep)]" aria-hidden="true" />
        </motion.span>
        <h1 className="sf-display mt-6 text-5xl">
          <span className="relative isolate inline-block">
            <Draw className="pointer-events-none absolute -bottom-2 left-0 z-0 w-full" delay={0.4}>
              <Squiggle className="w-full" color="var(--sf-butter)" />
            </Draw>
            <span className="relative z-10">{SUCCESS.heading}</span>
          </span>
        </h1>
        <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{SUCCESS.sub}</p>

        <div className="mt-8 space-y-4 rounded-[24px] bg-[var(--sf-cream)] p-6 text-left">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-[var(--sf-coral-deep)]" aria-hidden="true" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">{SUCCESS.dateTime}</p>
              <p className="font-extrabold">
                {selectedDate ? formatDisplayDate(selectedDate) : ""} {SUCCESS.at} {selectedTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-[var(--sf-coral-deep)]" aria-hidden="true" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">{SUCCESS.location}</p>
              <p className="font-extrabold">{LOCATION.address}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-[var(--sf-soft)]">
          {SUCCESS.confirmationBefore} <span className="font-extrabold text-[var(--sf-ink)]">{email}</span>
          {SUCCESS.confirmationAfter}
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm font-extrabold text-[var(--sf-coral-deep)]">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          {SUCCESS.addToCalendar}
        </p>

        <div className="mt-8 border-t-2 border-dashed border-[var(--sf-ink)]/10 pt-7">
          <p className="sf-hand text-xl text-[var(--sf-soft)]">{SUCCESS.explore}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {SUCCESS.links.map(({ label, href }, i) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.12)] transition-transform hover:-translate-y-0.5 hover:-rotate-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30 ${DOTS[i % DOTS.length]}`}
              >
                {label}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
