"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle, PenLine } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import FaqSection, { FAQ_CARD_THEME } from "@/app/_garden/FaqSection";
import CalendarGrid, { formatShortDate } from "@/app/_garden/CalendarGrid";
import { Chips } from "@/app/_garden/program";
import { Magnetic, Marquee, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Arrow, Draw, Leaf, Pill, Squiggle, Star, Sun, btnOutline, btnPop, fieldInput, fieldLabel } from "@/app/_garden/ui";
import { formatPhone } from "@/app/utils/formatPhone";
import { isShadowDayBookable, SHADOW_CAL_MAX, SHADOW_CAL_MIN } from "@/app/lib/academic-calendar-data";
import AgreementDrawer from "./form/AgreementDrawer";
import {
  BOTTOM_CTA,
  CAROUSEL_IMAGES,
  FAQ_HEADER,
  FORM,
  GALLERY_INITIAL_COUNT,
  HERO,
  PACKING,
  PACKING_LIST,
  PHOTO_ALT,
  RECAP,
  SHADOW_FAQ_ITEMS,
  STICKY,
  WHO,
  WHO_ITS_FOR,
} from "./content";

// ─── Calendar bounds (unchanged from the original page) ─────────────────────

const CALENDAR_TODAY = new Date();
CALENDAR_TODAY.setHours(0, 0, 0, 0);

const CAL_MIN_YEAR = SHADOW_CAL_MIN.getFullYear();
const CAL_MIN_MONTH = SHADOW_CAL_MIN.getMonth();
const CAL_MAX_YEAR = SHADOW_CAL_MAX.getFullYear();
const CAL_MAX_MONTH = SHADOW_CAL_MAX.getMonth();

function getMinCalendarMonth(): { year: number; month: number } {
  if (CALENDAR_TODAY < SHADOW_CAL_MIN) return { year: CAL_MIN_YEAR, month: CAL_MIN_MONTH };
  if (CALENDAR_TODAY > SHADOW_CAL_MAX) return { year: CAL_MAX_YEAR, month: CAL_MAX_MONTH };
  return { year: CALENDAR_TODAY.getFullYear(), month: CALENDAR_TODAY.getMonth() };
}

function isCalendarMonthAtMin(year: number, month: number): boolean {
  const min = getMinCalendarMonth();
  return year < min.year || (year === min.year && month <= min.month);
}

function isCalendarMonthAtMax(year: number, month: number): boolean {
  return year > CAL_MAX_YEAR || (year === CAL_MAX_YEAR && month >= CAL_MAX_MONTH);
}

const TAPE = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];
const TILTS = [-3, 2, -1.5, 2.5, -2, 1.5];
const NOTES = ["var(--sf-butter)", "var(--sf-mint)", "var(--sf-sky)", "var(--sf-lav)", "var(--sf-peach)"];
const BAND_PAPER = { coral: "bg-[var(--sf-peach)]", sage: "bg-[var(--sf-mint)]", sky: "bg-[var(--sf-sky)]" } as const;
const ICON_BG = ["bg-[var(--sf-butter)]", "bg-[var(--sf-mint)]", "bg-[var(--sf-sky)]", "bg-[var(--sf-lav)]"];

/** The Shadow Day page, built with the Garden design system (app/_garden). */
export default function ShadowPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [sigPrintedName, setSigPrintedName] = useState("");
  const [sigValue, setSigValue] = useState("");
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    referralSource: "",
    notes: "",
    emergencyName: "",
    emergencyPhone: "",
    consentOutdoor: false,
    consentPhoto: false,
    interestedInEnrollment: false,
  });

  const [children, setChildren] = useState([{ name: "", age: "" }]);
  const addChild = () => setChildren((prev) => [...prev, { name: "", age: "" }]);
  const removeChild = (i: number) => setChildren((prev) => prev.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: "name" | "age", value: string) =>
    setChildren((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const totalBase = children.length * 20;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const initialCalendar = getMinCalendarMonth();
  const [calendarMonth, setCalendarMonth] = useState(initialCalendar.month);
  const [calendarYear, setCalendarYear] = useState(initialCalendar.year);

  useEffect(() => {
    if (selectedDate && !isShadowDayBookable(selectedDate, CALENDAR_TODAY)) {
      setSelectedDate(null);
    }
  }, [selectedDate]);

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (isCalendarMonthAtMax(calendarYear, calendarMonth)) return;
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agreementOpen) {
      document.body.style.overflow = "hidden";
      if (formData.parentName && !sigPrintedName) setSigPrintedName(formData.parentName);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementOpen]);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name.toLowerCase().includes("phone") ? formatPhone(value) : value,
    }));
  };

  const isFormValid =
    !!formData.parentName.trim() &&
    !!formData.email.trim() &&
    children.length > 0 &&
    children.every((c) => !!c.name.trim() && !!c.age) &&
    formData.consentOutdoor &&
    selectedDate !== null;

  const handleSaveSignature = () => {
    if (!sigPrintedName.trim() || !sigValue.trim()) return;
    setAgreementSigned(true);
    setAgreementOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid || !agreementSigned || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/shadow-day-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          children: children.map((c) => ({ name: c.name, age: Number(c.age) })),
          selectedDate: selectedDate!.toISOString().split("T")[0],
          referralSource: formData.referralSource,
          notes: formData.notes,
          emergencyName: formData.emergencyName,
          emergencyPhone: formData.emergencyPhone,
          consentOutdoor: formData.consentOutdoor,
          consentPhoto: formData.consentPhoto,
          interestedInEnrollment: formData.interestedInEnrollment,
          signatureName: sigPrintedName,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setSubmitError("Unexpected response. Please try again.");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const consents = [
    { name: "consentOutdoor" as const, checked: formData.consentOutdoor, label: FORM.consents.consentOutdoor, required: true },
    { name: "consentPhoto" as const, checked: formData.consentPhoto, label: FORM.consents.consentPhoto },
    { name: "interestedInEnrollment" as const, checked: formData.interestedInEnrollment, label: FORM.consents.interestedInEnrollment },
  ];

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false} smsDesktopOnly>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-12 lg:pt-44 lg:pb-20">
        <Draw className="absolute left-[5%] top-[18%] hidden w-16 lg:block" delay={0.5}>
          <Sun />
        </Draw>
        <Draw className="absolute bottom-[10%] left-[42%] hidden w-10 lg:block" delay={1}>
          <Star color="var(--sf-sage)" />
        </Draw>
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:px-16">
          <Reveal className="text-center lg:text-left" stagger={0.1}>
            <div>
              <span className="inline-flex rounded-full bg-[var(--sf-coral)] px-4 py-1.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_var(--sf-coral-deep)]">
                🎟️ {STICKY.title}
              </span>
            </div>
            <h1 className="sf-display mt-6 text-5xl leading-[0.95] sm:text-6xl lg:text-[5.4rem] lg:leading-[0.92]">
              {HERO.before}{" "}
              <span className="relative isolate inline-block text-[var(--sf-coral)]">
                <Draw className="pointer-events-none absolute -bottom-3 left-0 z-0 w-full" delay={0.4}>
                  <Squiggle className="w-full" color="var(--sf-butter)" />
                </Draw>
                <span className="relative z-10">{HERO.highlight}</span>
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-[var(--sf-soft)] md:text-xl lg:mx-0">{HERO.body}</p>
            <div>
              <Chips items={HERO.pills} className="mt-7 lg:justify-start" />
            </div>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Magnetic>
                <button type="button" onClick={scrollToForm} className={`${btnPop} w-full sm:w-auto`}>
                  {HERO.cta}
                </button>
              </Magnetic>
              <a href="#timeline" className={btnOutline}>
                {HERO.secondary}
              </a>
            </div>
          </Reveal>

          <div className="relative hidden h-[540px] lg:block" aria-hidden="true">
            {HERO.photos.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 60, rotate: TILTS[i] * 2 }}
                animate={{ opacity: 1, y: 0, rotate: TILTS[i] }}
                transition={{ type: "spring", stiffness: 140, damping: 15, delay: 0.2 + i * 0.12 }}
                whileHover={{ rotate: 0, scale: 1.03, zIndex: 5 }}
                className={`sf-polaroid absolute ${
                  i === 0 ? "left-0 top-4 w-[56%]" : i === 1 ? "right-0 top-0 w-[46%]" : "bottom-0 right-[10%] w-[48%]"
                }`}
                style={{ rotate: `${TILTS[i]}deg`, zIndex: i === 2 ? 2 : 1 }}
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

      {/* ── Photo strip ── */}
      <div className="-rotate-2 pb-10" aria-hidden="true">
        <Marquee duration={90} trackClassName="py-4">
          {CAROUSEL_IMAGES.map((src, i) => (
            <div key={src} className="sf-polaroid relative mx-3 w-52 shrink-0 sm:w-64 lg:w-72" style={{ rotate: `${i % 2 ? 2 : -2}deg` }}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                <Image src={src} alt={PHOTO_ALT} fill className="object-cover" sizes="288px" />
              </div>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── Weeks 10 & 11 recap ── */}
      <section id="timeline" className="scroll-mt-24 bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <Pill tint="lav">📸 {RECAP.badge}</Pill>
            <WordsReveal text={RECAP.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
            <Reveal>
              <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">{RECAP.sub}</p>
            </Reveal>
          </div>

          <Reveal className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-7" stagger={0.06} y={40}>
            {CAROUSEL_IMAGES.slice(0, GALLERY_INITIAL_COUNT).map((src, i) => (
              <Polaroid key={src} src={src} i={i} />
            ))}
          </Reveal>
          <AnimatePresence>
            {galleryExpanded && (
              <motion.div
                className="mx-auto mt-7 grid max-w-5xl grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-7"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                {CAROUSEL_IMAGES.slice(GALLERY_INITIAL_COUNT).map((src, i) => (
                  <Polaroid key={src} src={src} i={i + GALLERY_INITIAL_COUNT} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setGalleryExpanded((prev) => !prev)}
              aria-expanded={galleryExpanded}
              className="sf-hand cursor-pointer rounded-full px-4 py-1 text-2xl text-[var(--sf-coral-deep)] underline decoration-[var(--sf-butter)] decoration-4 underline-offset-4 hover:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30"
            >
              {galleryExpanded ? RECAP.showFewer : RECAP.seeAll(CAROUSEL_IMAGES.length)}
            </button>
          </div>

          <Reveal className="mt-20 grid gap-8 lg:grid-cols-3" stagger={0.12} y={50}>
            {RECAP.bands.map((band, b) => (
              <div key={band.title}>
                <article
                  className={`relative h-full rounded-[28px] ${BAND_PAPER[band.tint]} p-6 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-[rotate] duration-500 hover:rotate-0`}
                  style={{ rotate: `${[-1.5, 1, -1][b]}deg` }}
                >
                  <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-white/70" aria-hidden="true" />
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">
                      {band.emoji}
                    </span>
                    <div>
                      <h3 className="sf-display text-2xl">{band.title}</h3>
                      <p className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">{band.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {[
                      { label: RECAP.week10, items: band.week10, pill: "bg-[var(--sf-coral)]/20 text-[var(--sf-coral-deep)]" },
                      { label: RECAP.week11, items: band.week11, pill: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" },
                    ].map((wk) => (
                      <div key={wk.label} className="rounded-2xl bg-white p-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${wk.pill}`}>{wk.label}</span>
                        <ul className="mt-3 space-y-2.5">
                          {wk.items.map((item) => (
                            <li key={item.label} className="flex items-start gap-2">
                              <span className="mt-0.5 shrink-0 text-sm leading-none" aria-hidden="true">
                                {item.emoji}
                              </span>
                              <div>
                                <p className="text-xs font-extrabold leading-tight">{item.label}</p>
                                <p className="mt-0.5 text-[11px] leading-snug text-[var(--sf-soft)]">{item.desc}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ))}
          </Reveal>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={RECAP.links[0].href} className={btnPop}>
              {RECAP.links[0].label}
            </Link>
            <Link href={RECAP.links[1].href} className={btnOutline}>
              {RECAP.links[1].label}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-24 lg:py-32 bg-[var(--sf-mint)]/45">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <Pill tint="sage">🤔 {WHO.badge}</Pill>
            <WordsReveal text={WHO.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
            <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{WHO.sub}</p>
          </div>
          <Reveal className="mt-14 grid gap-6 sm:grid-cols-2" stagger={0.1} y={50}>
            {WHO_ITS_FOR.map(({ icon: Icon, headline, body }, i) => (
              <div key={headline}>
                <article
                  className="group h-full rounded-[28px] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:rotate-0"
                  style={{ rotate: `${[-1.5, 1, 1.5, -1][i % 4]}deg` }}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-12 ${ICON_BG[i % 4]}`} aria-hidden="true">
                    <Icon className="h-6 w-6 text-[var(--sf-ink)]" />
                  </span>
                  <h3 className="sf-display mt-5 text-2xl">{headline}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--sf-soft)]">{body}</p>
                </article>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Registration form ── */}
      <section id="reserve" className="relative overflow-hidden py-24 lg:py-32 bg-[var(--sf-butter)]/50">
        <Draw className="absolute left-[6%] top-24 hidden w-20 lg:block">
          <Leaf />
        </Draw>
        <div ref={formRef} className="relative mx-auto max-w-3xl scroll-mt-24 px-6 sm:px-10">
          <div className="text-center">
            <Pill tint="coral">🎟️ {FORM.badge}</Pill>
            <WordsReveal text={FORM.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
            <p className="sf-hand mt-3 text-2xl text-[var(--sf-sage-deep)]">{FORM.sub}</p>
          </div>

          <Reveal y={60} className="mt-12">
            <div className="sf-paper relative rounded-[28px] p-6 shadow-[0_30px_60px_-30px_rgba(43,42,38,0.5)] ring-1 ring-black/5 md:p-12">
              <span className="absolute -top-4 left-10 h-8 w-28 -rotate-3 rounded-sm bg-[var(--sf-coral)]/70" aria-hidden="true" />

              <FormSection>{FORM.yourInfo}</FormSection>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={FORM.parentName.label} required>
                  <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} placeholder={FORM.parentName.placeholder} className={fieldInput} />
                </Field>
                <Field label={FORM.email.label} required>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={FORM.email.placeholder} className={fieldInput} />
                </Field>
                <Field label={FORM.phone.label}>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={FORM.phone.placeholder} className={fieldInput} />
                </Field>
              </div>

              <FormSection>
                {FORM.yourChild}
                {children.length > 1 ? FORM.childrenSuffix : ""}{" "}
                <span className="ml-1 rounded-full bg-[var(--sf-butter)] px-2.5 py-0.5 align-middle font-sans text-xs font-extrabold text-[#7a5b00]">{FORM.perChild}</span>
              </FormSection>
              <div className="space-y-4">
                {children.map((child, i) => (
                  <div key={i} className="rounded-2xl border-2 border-dashed border-[var(--sf-ink)]/15 bg-white/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">
                        {FORM.child} {i + 1}
                      </p>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(i)}
                          className="cursor-pointer rounded-full px-2 text-xs font-bold text-[var(--sf-soft)] transition-colors hover:text-[var(--sf-coral-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-coral)]"
                        >
                          {FORM.remove}
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={FORM.childName.label} required>
                        <input type="text" value={child.name} onChange={(e) => updateChild(i, "name", e.target.value)} placeholder={FORM.childName.placeholder} className={fieldInput} />
                      </Field>
                      <Field label={FORM.childAge.label} required>
                        <select value={child.age} onChange={(e) => updateChild(i, "age", e.target.value)} className={`${fieldInput} cursor-pointer`}>
                          <option value="">{FORM.childAge.placeholder}</option>
                          {FORM.ages.map((age) => (
                            <option key={age} value={age}>
                              {age} {FORM.ageSuffix}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChild}
                  className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-[var(--sf-ink)]/25 py-3 text-sm font-extrabold text-[var(--sf-soft)] transition-all hover:border-[var(--sf-sage)] hover:bg-[var(--sf-mint)]/40 hover:text-[var(--sf-sage-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]"
                >
                  {FORM.addChild}
                </button>
                {children.length > 1 && (
                  <p className="rounded-2xl bg-[var(--sf-coral)]/15 px-4 py-2 text-center text-sm font-extrabold text-[var(--sf-coral-deep)]">
                    {FORM.total(children.length, totalBase)}
                  </p>
                )}
              </div>

              <FormSection>{FORM.preferredDay}</FormSection>
              <div className="rounded-[24px] bg-[var(--sf-cream)] p-4 ring-1 ring-black/5 sm:p-5">
                <CalendarGrid
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  month={calendarMonth}
                  year={calendarYear}
                  onPrev={handlePrevMonth}
                  onNext={handleNextMonth}
                  canPrev={!isCalendarMonthAtMin(calendarYear, calendarMonth)}
                  canNext={!isCalendarMonthAtMax(calendarYear, calendarMonth)}
                  isAvailable={(date) => isShadowDayBookable(date, CALENDAR_TODAY)}
                />
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--sf-mint)] px-4 py-3"
                      role="status"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[var(--sf-sage-deep)]" aria-hidden="true" />
                      <p className="text-sm font-extrabold text-[var(--sf-sage-deep)]">
                        {formatShortDate(selectedDate)} · {FORM.dayChip}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <FormSection>{FORM.bitMore}</FormSection>
              <div className="space-y-5">
                <Field label={FORM.referral.label}>
                  <select name="referralSource" value={formData.referralSource} onChange={handleChange} className={`${fieldInput} cursor-pointer`}>
                    <option value="">{FORM.referral.placeholder}</option>
                    {FORM.referral.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={FORM.notes.label}>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder={FORM.notes.placeholder} className={`${fieldInput} resize-none`} />
                </Field>
              </div>

              <FormSection>{FORM.emergency}</FormSection>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={FORM.emergencyName.label}>
                  <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder={FORM.emergencyName.placeholder} className={fieldInput} />
                </Field>
                <Field label={FORM.emergencyPhone.label}>
                  <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder={FORM.emergencyPhone.placeholder} className={fieldInput} />
                </Field>
              </div>

              <FormSection>{FORM.confirm}</FormSection>
              <div className="space-y-3">
                {consents.map(({ name, checked, label, required }) => (
                  <label key={name} className="group flex cursor-pointer items-start gap-3 rounded-2xl p-2 transition-colors hover:bg-white/70">
                    <input type="checkbox" name={name} checked={checked} onChange={handleChange} className="peer sr-only" />
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--sf-coral)]/30 ${
                        checked ? "-rotate-6 border-[var(--sf-sage)] bg-[var(--sf-sage)]" : "border-[var(--sf-ink)]/25 bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className="text-sm leading-snug text-[var(--sf-ink)]">
                      {label} {required && <span className="text-[var(--sf-coral-deep)]">*</span>}
                    </span>
                  </label>
                ))}
              </div>

              {/* Agreement + submit */}
              <div className="mt-8 space-y-4">
                <div
                  className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-4 transition-colors ${
                    agreementSigned ? "border-[var(--sf-mint)] bg-[var(--sf-mint)]/60" : "border-dashed border-[var(--sf-ink)]/20 bg-white/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {agreementSigned ? (
                      <CheckCircle className="h-6 w-6 shrink-0 text-[var(--sf-sage-deep)]" aria-hidden="true" />
                    ) : (
                      <PenLine className="h-6 w-6 shrink-0 text-[var(--sf-coral-deep)]" aria-hidden="true" />
                    )}
                    <div>
                      <p className="sf-display text-lg">{FORM.agreement.title}</p>
                      <p className="text-xs text-[var(--sf-soft)]">{agreementSigned ? FORM.agreement.signed : FORM.agreement.required}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAgreementOpen(true)}
                    disabled={!isFormValid}
                    className="shrink-0 cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[var(--sf-coral-deep)] shadow-[0_3px_0_0_rgba(43,42,38,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    {agreementSigned ? FORM.agreement.view : FORM.agreement.sign}
                  </button>
                </div>
                {!isFormValid && !agreementSigned && <p className="sf-hand text-center text-lg text-[var(--sf-soft)]">{FORM.agreement.locked}</p>}

                {submitError && (
                  <p className="rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-800" role="alert">
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid || !agreementSigned || submitting}
                  className={`${btnPop} w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
                >
                  {submitting ? FORM.submitting : FORM.submit(totalBase)}
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Packing list ── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <Pill tint="butter">🎒 {PACKING.badge}</Pill>
            <WordsReveal text={PACKING.heading} className="sf-display mt-5 text-5xl md:text-6xl" />
          </div>
          <Reveal className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-5" stagger={0.08} y={40}>
            {PACKING_LIST.map((item, i) => (
              <div
                key={item.item}
                className="sf-wiggle relative rounded-md p-5 pt-7 text-center shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)] last:col-span-2 md:last:col-span-1"
                style={{ background: NOTES[i % NOTES.length], rotate: `${TILTS[i % TILTS.length]}deg` }}
              >
                <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" aria-hidden="true" />
                <span className="text-3xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <p className="mt-2 text-sm font-extrabold leading-snug">{item.item}</p>
              </div>
            ))}
          </Reveal>
          <p className="sf-hand mt-12 text-center text-2xl text-[var(--sf-sage-deep)]">{PACKING.questions}</p>
        </div>
      </section>

      <FaqSection
        badge={<>❓ {FAQ_HEADER.badge}</>}
        tint="sky"
        heading={FAQ_HEADER.heading}
        sub={FAQ_HEADER.sub}
        items={SHADOW_FAQ_ITEMS}
        idPrefix="shadow-faq"
        className="bg-white"
        theme={{
          ...FAQ_CARD_THEME,
          item: `${FAQ_CARD_THEME.item} first:-mx-3 first:rounded-2xl first:bg-[var(--sf-butter)]/45 first:px-3`,
        }}
      />

      {/* ── Bottom CTA ── */}
      <section className="py-24 lg:py-32 bg-[var(--sf-peach)]/45">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <Reveal y={50}>
            <div className="relative rounded-[40px] bg-white p-8 text-center shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] md:p-14">
              <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-[var(--sf-coral)] opacity-80" aria-hidden="true" />
              <Draw className="absolute -right-6 -top-8 hidden w-20 md:block" delay={0.3}>
                <Sun />
              </Draw>
              <Pill tint="coral">🎟️ {BOTTOM_CTA.badge}</Pill>
              <h2 className="sf-display mt-5 text-4xl md:text-5xl">{BOTTOM_CTA.heading}</h2>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[var(--sf-soft)]">{BOTTOM_CTA.body}</p>
              <div className="mt-9 flex items-center justify-center gap-4">
                <Draw className="hidden w-14 rotate-12 sm:block">
                  <Arrow />
                </Draw>
                <Magnetic>
                  <button type="button" onClick={scrollToForm} className={btnPop}>
                    {BOTTOM_CTA.cta}
                  </button>
                </Magnetic>
              </div>
              <p className="mt-6 text-xs text-[var(--sf-soft)]">{BOTTOM_CTA.note}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Mobile sticky bottom bar ── */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
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
            onClick={scrollToForm}
            className="shrink-0 cursor-pointer rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[var(--sf-coral-deep)] transition-colors hover:bg-[var(--sf-cream)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
          >
            {STICKY.cta}
          </button>
        </div>
      </motion.div>

      <AgreementDrawer
        agreementOpen={agreementOpen}
        setAgreementOpen={setAgreementOpen}
        agreementSigned={agreementSigned}
        setAgreementSigned={setAgreementSigned}
        sigPrintedName={sigPrintedName}
        setSigPrintedName={setSigPrintedName}
        sigValue={sigValue}
        setSigValue={setSigValue}
        handleSaveSignature={handleSaveSignature}
        kids={children}
        guardianName={formData.parentName}
        notesForAgreement={formData.notes}
        photoConsent={formData.consentPhoto}
        emergencyName={formData.emergencyName}
        emergencyPhone={formData.emergencyPhone}
      />
    </GardenShell>
  );
}

function Polaroid({ src, i }: { src: string; i: number }) {
  return (
    <div>
      <div
        className="sf-polaroid relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:!rotate-0 hover:scale-[1.03]"
        style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}
      >
        <span className="absolute -top-3 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[i % TAPE.length] }} aria-hidden="true" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
          <Image src={src} alt={PHOTO_ALT} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
        </div>
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
