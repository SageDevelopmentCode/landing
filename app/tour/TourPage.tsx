"use client";

import { useEffect, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import FaqSection from "@/app/_garden/FaqSection";
import CalendarGrid from "@/app/_garden/CalendarGrid";
import { Magnetic, Marquee, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Draw, Leaf, Pill, Squiggle, Star, Sun, btnPop, fieldInput, fieldLabel } from "@/app/_garden/ui";
import { Philosophy } from "@/app/_home/sections/Story";
import Team from "@/app/_home/sections/Team";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import { formatPhone } from "@/app/utils/formatPhone";
import { submitTourBooking } from "@/app/actions/submitTourBooking";
import {
  dateKeyFromDate,
  getFullDayBlockedDates,
  getBlockedTimesForDate,
  hasAvailableSlot,
  normalizeTourUnavailabilityEntries,
  type TourUnavailabilityEntry,
} from "@/app/lib/tour-availability";
import {
  ConfirmationSummary,
  SelectedSlotChip,
  StepIndicator,
  SuccessCard,
  TimeBottomSheet,
  TimeSlotPicker,
  type TourFormData,
  type TourStep,
} from "./booking";
import {
  GRADE_OPTIONS,
  HERO,
  LOCATION,
  NUM_CHILDREN_OPTIONS,
  REFERRAL_OPTIONS,
  SCHEDULE,
  SCHOOL_FAQS,
  SCHOOL_FAQ_HEADER,
  STICKY,
  TIME_SLOTS,
  TOUR_FAQS,
  TOUR_FAQ_HEADER,
  TOUR_IMAGES,
  TOUR_IMAGE_ALT,
  WALKTHROUGH,
} from "./content";

// ─── Calendar rules (unchanged from the original page) ──────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const MAX_MONTH = 11; // December (0-indexed)
const MAX_YEAR = 2026;

const isAvailableDay = (date: Date) => date.getDay() !== 0;
const isPastDate = (date: Date) => date < TODAY;

const stepVariants = {
  initial: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
};

const NOTES = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];
const NOTE_TILTS = [-2, 1.5, -1, 2, -1.5];

/** The Tour page, built with the Garden design system (app/_garden). */
export default function TourPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false} smsDesktopOnly>
      <TourBody />
    </GardenShell>
  );
}

function TourBody() {
  const { openContact } = useDialogs();

  const [currentStep, setCurrentStep] = useState<TourStep>(1);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const [unavailability, setUnavailability] = useState<TourUnavailabilityEntry[]>([]);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/tour-unavailability", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: TourUnavailabilityEntry[]) => {
        if (!Array.isArray(data)) return;
        const normalized = normalizeTourUnavailabilityEntries(data);
        setUnavailability(normalized);

        // Auto-select first available date on desktop only
        if (window.innerWidth >= 1024) {
          const candidate = new Date(TODAY);
          for (let i = 0; i < 365; i++) {
            const dateStr = dateKeyFromDate(candidate);
            if (isAvailableDay(candidate) && hasAvailableSlot(normalized, dateStr, TIME_SLOTS)) {
              setSelectedDate(new Date(candidate));
              setCalendarMonth(candidate.getMonth());
              setCalendarYear(candidate.getFullYear());
              break;
            }
            candidate.setDate(candidate.getDate() + 1);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load tour availability:", err);
      });
  }, []);

  const [formData, setFormData] = useState<TourFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    childName: "",
    childGrade: "",
    numChildren: "1",
    referralSource: "",
    notes: "",
  });

  function goToStep(step: TourStep) {
    setStepDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  }

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (calendarYear === MAX_YEAR && calendarMonth >= MAX_MONTH) return;
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    if (window.innerWidth < 1024) {
      setTimeSheetOpen(true);
    }
  }

  function handleFormChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  const blockedTimesForDate = selectedDate ? getBlockedTimesForDate(unavailability, dateKeyFromDate(selectedDate)) : new Set<string>();
  const blockedDates = getFullDayBlockedDates(unavailability);

  function isBookable(date: Date) {
    const dateKey = dateKeyFromDate(date);
    return isAvailableDay(date) && !isPastDate(date) && !blockedDates.has(dateKey) && hasAvailableSlot(unavailability, dateKey, TIME_SLOTS);
  }

  function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    setSubmitError("");

    const dateKey = dateKeyFromDate(selectedDate);
    const referralMap: Record<string, string> = {
      Google: "google",
      "Social Media": "social_media",
      "Friend / Family": "friend_family",
      "Flyer / Poster": "flyer",
      Other: "other",
    };

    startSubmitTransition(async () => {
      const result = await submitTourBooking({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        child_name: formData.childName,
        child_grade: formData.childGrade || "Pre-K",
        num_children: Math.min(5, parseInt(formData.numChildren) || 1),
        tour_date: dateKey,
        tour_time: selectedTime,
        how_did_you_hear: referralMap[formData.referralSource] || "other",
        accommodations: formData.notes || undefined,
      });

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      setSubmitted(true);
    });
  }

  const canAdvanceStep1 = selectedDate !== null && selectedTime !== null;
  const canAdvanceStep2 =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.childName.trim() !== "";

  const heading = SCHEDULE.stepHeadings[currentStep];
  const f = SCHEDULE.fields;
  const scrollToSchedule = () => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (submitted) {
    return <SuccessCard selectedDate={selectedDate} selectedTime={selectedTime} email={formData.email} />;
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-24">
        <Draw className="absolute left-[5%] top-[18%] hidden w-16 lg:block" delay={0.5}>
          <Sun />
        </Draw>
        <Draw className="absolute bottom-[14%] left-[40%] hidden w-10 lg:block" delay={1}>
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
            <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-[var(--sf-soft)] md:text-xl lg:mx-0">{HERO.body}</p>
            <div className="mt-9">
              <Magnetic>
                <a href="#schedule" className={btnPop}>
                  {HERO.cta}
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </Magnetic>
            </div>
          </Reveal>

          <Reveal y={60} delay={0.15} className="hidden sm:block">
            <div className="relative mx-auto aspect-square w-[86%] max-w-[500px]">
              <div className="sf-blob absolute inset-0 overflow-hidden">
                <Image src={HERO.image} alt={HERO.imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 80vw, 500px" preload />
              </div>
              <span className="sf-display absolute -left-4 bottom-8 flex h-28 w-28 -rotate-12 items-center justify-center rounded-full bg-[var(--sf-butter)] p-3 text-center text-sm leading-tight shadow-[0_10px_25px_-12px_rgba(43,42,38,0.5)]">
                {LOCATION.hours.split(" · ")[0]}
                <br />
                {LOCATION.hours.split(" · ")[1]}
              </span>
              <Draw className="absolute -right-4 top-2 w-16" delay={0.8}>
                <Leaf />
              </Draw>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Phones: a row of tour photos */}
      <div className="-rotate-2 pb-10 sm:hidden" aria-hidden="true">
        <Marquee duration={50} trackClassName="py-4">
          {TOUR_IMAGES.map((src, i) => (
            <div key={src} className="sf-polaroid relative mx-2.5 w-48 shrink-0" style={{ rotate: `${i % 2 ? 2 : -2}deg` }}>
              <div className="relative aspect-square overflow-hidden rounded-[3px]">
                <Image src={src} alt={TOUR_IMAGE_ALT} fill className="object-cover" sizes="192px" preload={i === 0} />
              </div>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── Walkthrough ── */}
      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <Pill tint="butter">🗺️ {WALKTHROUGH.badge}</Pill>
            <WordsReveal text={WALKTHROUGH.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
            <Reveal>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{WALKTHROUGH.sub}</p>
            </Reveal>
          </div>
          <Reveal
            as="ol"
            className="-mx-6 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 pt-4 [scroll-padding-inline:1.5rem] sm:-mx-10 sm:px-10 sm:[scroll-padding-inline:2.5rem] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0"
            stagger={0.1}
            y={50}
          >
            {WALKTHROUGH.steps.map(({ icon: Icon, label, description }, i) => (
              <li key={label} className="w-56 shrink-0 snap-start lg:w-auto">
                <div
                  className="sf-wiggle relative h-full rounded-md p-6 pt-8 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)]"
                  style={{ background: NOTES[i], rotate: `${NOTE_TILTS[i]}deg` }}
                >
                  <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
                  <div className="flex items-center justify-between">
                    <span className="sf-hand text-2xl text-[var(--sf-ink)]/60" aria-hidden="true">
                      {i + 1}.
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80" aria-hidden="true">
                      <Icon className="h-5 w-5 text-[var(--sf-ink)]" />
                    </span>
                  </div>
                  <h3 className="sf-display mt-4 text-2xl">{label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sf-ink)]/75">{description}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <FaqSection heading={TOUR_FAQ_HEADER.heading} sub={TOUR_FAQ_HEADER.sub} items={TOUR_FAQS} idPrefix="tour-faq" className="bg-[var(--sf-sky)]/35" />

      {/* ── Location bar ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
          <Reveal y={40}>
            <div className="relative flex flex-col gap-6 rounded-[32px] bg-[var(--sf-peach)]/70 p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
              <span className="absolute -top-3 left-12 h-6 w-24 -rotate-2 rounded-sm bg-[var(--sf-butter)]" aria-hidden="true" />
              <InfoChip icon={<MapPin className="h-5 w-5" />} label={LOCATION.locationLabel} value={LOCATION.address} />
              <InfoChip icon={<Clock className="h-5 w-5" />} label={LOCATION.availableLabel} value={LOCATION.hours} />
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <p className="sf-hand whitespace-nowrap text-xl text-[var(--sf-ink)]">{LOCATION.questions}</p>
                <button type="button" onClick={openContact} className={btnPop}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {LOCATION.contact}
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Philosophy />
      <Team />
      <FaqSection
        badge={<>❓ {SCHOOL_FAQ_HEADER.badge}</>}
        tint="sky"
        heading={SCHOOL_FAQ_HEADER.heading}
        sub={SCHOOL_FAQ_HEADER.sub}
        items={SCHOOL_FAQS}
        idPrefix="school-faq"
        className="bg-white"
      />

      {/* ── Scheduling panel ── */}
      <section id="schedule" className="scroll-mt-24 bg-[var(--sf-butter)]/50 py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="mb-12 text-center">
            <Pill tint="coral">🗓️ {SCHEDULE.badge}</Pill>
            <WordsReveal text={SCHEDULE.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
          </div>

          <StepIndicator currentStep={currentStep} />

          <div className="sf-paper relative rounded-[28px] p-6 shadow-[0_30px_60px_-30px_rgba(43,42,38,0.5)] ring-1 ring-black/5 sm:p-10">
            <span className="absolute -top-4 left-10 h-8 w-28 -rotate-3 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />
            <div className="mb-8">
              <h2 className="sf-display text-3xl">{heading.title}</h2>
              <p className="mt-1 text-[var(--sf-soft)]">{heading.sub}</p>
            </div>

            <AnimatePresence mode="wait" custom={stepDirection}>
              <motion.div
                key={currentStep}
                custom={stepDirection}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                {currentStep === 1 && (
                  <div>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:items-start">
                      <div className="rounded-[24px] bg-[var(--sf-cream)] p-4 ring-1 ring-black/5 sm:p-5 lg:col-span-3">
                        <CalendarGrid
                          selectedDate={selectedDate}
                          onSelectDate={handleSelectDate}
                          month={calendarMonth}
                          year={calendarYear}
                          onPrev={handlePrevMonth}
                          onNext={handleNextMonth}
                          canPrev={!(calendarYear === TODAY.getFullYear() && calendarMonth <= TODAY.getMonth())}
                          canNext={!(calendarYear === MAX_YEAR && calendarMonth >= MAX_MONTH)}
                          isAvailable={isBookable}
                        />
                        {selectedDate && (
                          <button
                            type="button"
                            onClick={() => setTimeSheetOpen(true)}
                            className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-full border-2 border-[var(--sf-coral)]/40 bg-white px-5 py-3 text-sm font-extrabold text-[var(--sf-coral-deep)] lg:hidden"
                          >
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" aria-hidden="true" />
                              {selectedTime ? selectedTime : SCHEDULE.pickTime}
                            </span>
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <div className="hidden flex-col lg:col-span-2 lg:flex lg:h-[460px]">
                        <TimeSlotPicker selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={setSelectedTime} blockedTimes={blockedTimesForDate} />
                      </div>
                    </div>
                    <SelectedSlotChip date={selectedDate} time={selectedTime} />
                    <TimeBottomSheet
                      open={timeSheetOpen}
                      onClose={() => setTimeSheetOpen(false)}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onSelectTime={setSelectedTime}
                      blockedTimes={blockedTimesForDate}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <FormSection>{SCHEDULE.aboutYou}</FormSection>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label={f.firstName.label} required>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} placeholder={f.firstName.placeholder} className={fieldInput} />
                      </Field>
                      <Field label={f.lastName.label} required>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} placeholder={f.lastName.placeholder} className={fieldInput} />
                      </Field>
                      <Field label={f.email.label} required>
                        <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder={f.email.placeholder} className={fieldInput} />
                      </Field>
                      <Field label={f.phone.label} required>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} placeholder={f.phone.placeholder} className={fieldInput} />
                      </Field>
                    </div>

                    <FormSection>{SCHEDULE.aboutChild}</FormSection>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label={f.childName.label} required>
                        <input type="text" name="childName" value={formData.childName} onChange={handleFormChange} placeholder={f.childName.placeholder} className={fieldInput} />
                      </Field>
                      <Field label={f.childGrade.label}>
                        <select name="childGrade" value={formData.childGrade} onChange={handleFormChange} className={`${fieldInput} cursor-pointer`}>
                          <option value="">{f.childGrade.placeholder}</option>
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={f.numChildren.label}>
                        <select name="numChildren" value={formData.numChildren} onChange={handleFormChange} className={`${fieldInput} cursor-pointer`}>
                          {NUM_CHILDREN_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={f.referralSource.label}>
                        <select name="referralSource" value={formData.referralSource} onChange={handleFormChange} className={`${fieldInput} cursor-pointer`}>
                          <option value="">{f.referralSource.placeholder}</option>
                          {REFERRAL_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <FormSection>{SCHEDULE.quickQuestions}</FormSection>
                    <Field label={f.notes.label}>
                      <textarea name="notes" value={formData.notes} onChange={handleFormChange} placeholder={f.notes.placeholder} rows={4} className={`${fieldInput} resize-y`} />
                    </Field>
                  </div>
                )}

                {currentStep === 3 && (
                  <ConfirmationSummary
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    formData={formData}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t-2 border-dashed border-[var(--sf-ink)]/10 pt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep((currentStep === 3 ? 2 : currentStep - 1) as TourStep)}
                  className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold text-[var(--sf-soft)] transition-colors hover:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {currentStep === 3 ? SCHEDULE.edit : SCHEDULE.back}
                </button>
              ) : (
                <span />
              )}
              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={() => goToStep((currentStep + 1) as TourStep)}
                  disabled={(currentStep === 1 && !canAdvanceStep1) || (currentStep === 2 && !canAdvanceStep2)}
                  className={`${btnPop} ml-auto disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
                >
                  {currentStep === 2 ? SCHEDULE.review : SCHEDULE.next}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <LatestRecap />

      {/* ── Mobile sticky bar ── */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pt-2 lg:hidden"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[var(--sf-sage)] px-5 py-3 shadow-[0_6px_0_0_var(--sf-sage-deep)]">
          <div>
            <p className="sf-display text-base leading-tight text-white">{STICKY.title}</p>
            <p className="text-xs text-white/85">{STICKY.sub}</p>
          </div>
          <button
            type="button"
            onClick={scrollToSchedule}
            className="shrink-0 cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[var(--sf-sage-deep)] transition-colors hover:bg-[var(--sf-cream)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
          >
            {STICKY.cta}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-coral-deep)]" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-ink)]/60">{label}</p>
        <p className="font-extrabold text-[var(--sf-ink)]">{value}</p>
      </div>
    </div>
  );
}

function FormSection({ children }: { children: ReactNode }) {
  return <p className="sf-hand mb-4 mt-9 text-2xl text-[var(--sf-sage-deep)] first:mt-0">{children}</p>;
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
