"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle,
  Users,
  BookOpen,
  MessageCircle,
  Star,
  Leaf,
  Heart,
  Shield,
  ArrowDown,
  CalendarCheck,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";
import ContactDialog from "@/app/components/ContactDialog";
import { formatPhone } from "@/app/utils/formatPhone";
import { submitTourBooking } from "@/app/actions/submitTourBooking";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
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

type TourStep = 1 | 2 | 3;

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
];

const GRADE_OPTIONS = [
  "Pre-K",
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
];

const REFERRAL_OPTIONS = [
  "Google",
  "Social Media",
  "Friend / Family",
  "Flyer / Poster",
  "Other",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TOUR_EXPECTATIONS = [
  { icon: MapPin, text: "Walk the outdoor learning space and classrooms" },
  { icon: Users, text: "Meet Sage Field educators and ask any questions" },
  {
    icon: BookOpen,
    text: "See a typical day's rhythm and curriculum in action",
  },
  { icon: Clock, text: "Tour duration: approximately 45 minutes" },
  { icon: Star, text: "Private, one-on-one family tour experience" },
];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const MAX_MONTH = 5; // June (0-indexed)
const MAX_YEAR = 2026;

// ─── New Constants ────────────────────────────────────────────────────────────

const TOUR_STEPS_WALKTHROUGH = [
  {
    icon: MapPin,
    label: "Arrival",
    description: "Park, meet your host, and take a breath — no rush.",
  },
  {
    icon: BookOpen,
    label: "Classroom Tour",
    description:
      "See the materials, learning centers, and daily rhythm boards.",
  },
  {
    icon: Leaf,
    label: "Outdoor Space",
    description: "Walk our nature trail, garden, and outdoor learning areas.",
  },
  {
    icon: Users,
    label: "Meet the Team",
    description:
      "A real conversation with Ms. Sabrina and your child's future teacher.",
  },
  {
    icon: MessageCircle,
    label: "Q&A",
    description: "Ask anything — enrollment, curriculum, schedules, tuition.",
  },
];

const TRUST_BENEFITS = [
  {
    emoji: "👫",
    headline: "Small Groups, Big Attention",
    body: "Our class sizes cap at 12. Every child is seen, known, and guided by name — not lost in a crowd.",
    accentClass: "bg-sage-50 border-sage-200",
  },
  {
    emoji: "🌿",
    headline: "Nature Is the Classroom",
    body: "Montessori and Waldorf methods meet the Texas outdoors — in the garden, on the trail, and under the sky.",
    accentClass: "bg-badge-bg border-primary/20",
  },
  {
    emoji: "🧡",
    headline: "Meet Your Child's Teacher",
    body: "Tours are led by Ms. Sabrina herself. You'll leave knowing exactly who will care for your child every day.",
    accentClass: "bg-sage-50 border-sage-200",
  },
];

const TOUR_FAQS = [
  {
    question: "Can I bring siblings?",
    answer:
      "Absolutely. Siblings are welcome. Just note it in the 'Questions' field when booking so we can plan accordingly.",
  },
  {
    question: "How long does the tour take?",
    answer:
      "Plan for approximately 45 minutes, though we often run a bit longer when families have lots of great questions.",
  },
  {
    question: "Is the tour really free?",
    answer:
      "Yes — completely free, no strings attached. We want you to see Sage Field before making any decision.",
  },
  {
    question: "What if I need to reschedule?",
    answer:
      "Just reach out via the Contact button or SMS. We're flexible and happy to find another time that works for your family.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isAvailableDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0;
}

function isPastDate(date: Date): boolean {
  return date < TODAY;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isDateSelected(date: Date, selected: Date | null): boolean {
  return selected !== null && date.toDateString() === selected.toDateString();
}

function isToday(date: Date): boolean {
  return date.toDateString() === TODAY.toDateString();
}

// ─── Trust Badge Row ──────────────────────────────────────────────────────────

function TrustBadgeRow() {
  const badges = [
    { icon: Shield, label: "Private Tour" },
    { icon: Clock, label: "~45 Minutes" },
    { icon: Calendar, label: "Mon – Sat" },
    { icon: Star, label: "100% Free" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 mt-8">
      {badges.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-sage-200 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 font-body shadow-sm"
        >
          <Icon className="w-3.5 h-3.5 text-sage-600" />
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Selected Slot Chip ───────────────────────────────────────────────────────

function SelectedSlotChip({
  date,
  time,
}: {
  date: Date | null;
  time: string | null;
}) {
  const show = date !== null || time !== null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-5 flex items-center gap-3 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3"
        >
          <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-sage-700 font-body">
            {date ? formatShortDate(date) : "Date pending"}
            {time ? ` · ${time}` : " · Select a time →"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Date & Time", "Your Info", "Confirmation"];
const STEP_MICROCOPY = [
  "Pick date & time",
  "Tell us about your family",
  "Confirm & submit",
];

function StepIndicator({ currentStep }: { currentStep: TourStep }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as TourStep;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center">
              <motion.div
                animate={
                  isActive
                    ? {
                        boxShadow: [
                          "0 0 0 0px rgba(242,154,143,0.35)",
                          "0 0 0 8px rgba(242,154,143,0)",
                        ],
                      }
                    : { boxShadow: "0 0 0 0px rgba(242,154,143,0)" }
                }
                transition={isActive ? { repeat: Infinity, duration: 1.8 } : {}}
                className="rounded-full"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-body transition-colors duration-300 ${
                    isCompleted
                      ? "bg-sage-600 text-white"
                      : isActive
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
              </motion.div>
              <span
                className={`text-xs font-body mt-2 text-center w-20 leading-tight ${
                  isActive ? "text-primary font-semibold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              <span className="text-[10px] text-gray-400 font-body text-center w-20 leading-tight mt-0.5">
                {STEP_MICROCOPY[i]}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-24 mt-5 mx-1 transition-colors duration-300 ${
                  currentStep > stepNum ? "bg-sage-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  selectedDate,
  onSelectDate,
  calendarMonth,
  calendarYear,
  onPrevMonth,
  onNextMonth,
  blockedDates,
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  calendarMonth: number;
  calendarYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  blockedDates: Set<string>;
}) {
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const startOffset = getFirstDayOfMonth(calendarYear, calendarMonth);
  const isPrevDisabled =
    calendarYear === TODAY.getFullYear() && calendarMonth <= TODAY.getMonth();
  const isNextDisabled =
    calendarYear === MAX_YEAR && calendarMonth >= MAX_MONTH;

  const totalCells = startOffset + daysInMonth;
  const paddedCells = Math.ceil(totalCells / 7) * 7;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          disabled={isPrevDisabled}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-base font-bold font-heading text-gray-800">
          {MONTHS[calendarMonth]} {calendarYear}
        </h3>
        <button
          onClick={onNextMonth}
          disabled={isNextDisabled}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-xs font-semibold text-gray-400 uppercase text-center py-1 font-body"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: paddedCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > daysInMonth) {
            return <div key={idx} />;
          }
          const date = new Date(calendarYear, calendarMonth, dayNum);
          const past = isPastDate(date);
          const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const fullyBlocked = blockedDates.has(dateKey);
          const available = isAvailableDay(date) && !past && !fullyBlocked;
          const selected = isDateSelected(date, selectedDate);
          const todayCell = isToday(date);

          return (
            <button
              key={idx}
              onClick={() => available && onSelectDate(date)}
              disabled={!available}
              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-body transition-all duration-150 ${
                selected
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : available
                    ? todayCell
                      ? "text-primary font-semibold ring-2 ring-primary/30 hover:bg-primary/10"
                      : "text-gray-700 hover:bg-primary/10 hover:text-primary cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time Slot Picker ─────────────────────────────────────────────────────────

function TimeSlotPicker({
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
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-gray-700 font-body uppercase tracking-wide">
          {selectedDate ? formatShortDate(selectedDate) : "Select a date"}
        </p>
      </div>

      {!selectedDate ? (
        <p className="text-sm text-gray-400 font-body italic">
          Pick a date on the calendar to see available times.
        </p>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {TIME_SLOTS.filter((slot) => !blockedTimes.has(slot)).length === 0 ? (
            <p className="text-sm text-gray-400 font-body italic">
              No times available for this date — please select another day.
            </p>
          ) : (
            TIME_SLOTS.filter((slot) => !blockedTimes.has(slot)).map((slot) => (
              <button
                key={slot}
                onClick={() => onSelectTime(slot)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-body transition-all duration-150 ${
                  selectedTime === slot
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {slot}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Time Bottom Sheet (mobile only) ─────────────────────────────────────────

function TimeBottomSheet({
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
  function handlePick(slot: string) {
    onSelectTime(slot);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden flex flex-col"
            style={{ maxHeight: "75vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-gray-700 font-body uppercase tracking-wide">
                  {selectedDate ? formatShortDate(selectedDate) : "Pick a time"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable time slots */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="flex flex-col gap-2 pb-6">
                {TIME_SLOTS.filter((slot) => !blockedTimes.has(slot)).map(
                  (slot) => (
                    <button
                      key={slot}
                      onClick={() => handlePick(slot)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-body transition-all duration-150 ${
                        selectedTime === slot
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {slot}
                    </button>
                  ),
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Confirmation Summary ─────────────────────────────────────────────────────

function ConfirmationSummary({
  selectedDate,
  selectedTime,
  formData,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  selectedDate: Date | null;
  selectedTime: string | null;
  formData: FormData;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string;
}) {
  return (
    <div>
      <motion.div
        className="flex flex-col items-center text-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold font-heading text-gray-800 mb-2">
          You&apos;re almost in!
        </h3>
        <p className="text-sm text-gray-500 font-body max-w-sm">
          Everything look right? Hit the button below to lock in your private
          tour with Ms. Sabrina.
        </p>
      </motion.div>

      <div className="bg-sage-50 rounded-2xl p-6 border border-sage-200 space-y-4 mb-8">
        <p className="text-sm font-bold text-sage-700 font-body mb-4">
          Your Tour at Sage Field
        </p>
        <SummaryRow
          icon={<Calendar className="w-4 h-4 text-sage-700" />}
          label="Date"
        >
          {selectedDate ? formatDisplayDate(selectedDate) : "—"}
        </SummaryRow>
        <SummaryRow
          icon={<Clock className="w-4 h-4 text-sage-700" />}
          label="Time"
        >
          {selectedTime ?? "—"}
        </SummaryRow>
        <div className="border-t border-sage-200" />
        <SummaryRow
          icon={<Users className="w-4 h-4 text-sage-700" />}
          label="Parent / Guardian"
        >
          {formData.firstName} {formData.lastName}
        </SummaryRow>
        <SummaryRow
          icon={<BookOpen className="w-4 h-4 text-sage-700" />}
          label="Child"
        >
          {formData.childName}
          {formData.childGrade ? ` — ${formData.childGrade}` : ""}
        </SummaryRow>
        {formData.notes && (
          <SummaryRow
            icon={<Star className="w-4 h-4 text-sage-700" />}
            label="Notes"
          >
            {formData.notes}
          </SummaryRow>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-500 font-body text-center mb-4">
          {submitError}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-hover text-white py-5 rounded-xl font-semibold font-body transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {isSubmitting ? "Scheduling..." : "Schedule My Tour"}
      </motion.button>
      <p className="text-xs text-gray-400 font-body text-center mt-3">
        We&apos;ll send a confirmation email and reach out to finalize your
        visit.
      </p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-body mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-800 font-body">
          {children}
        </p>
      </div>
    </div>
  );
}

// ─── Tour Walkthrough ─────────────────────────────────────────────────────────

function TourWalkthrough() {
  return (
    <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
            Your Visit
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
            What Your Tour Looks Like
          </h2>
          <p className="text-base text-gray-500 font-body max-w-xl mx-auto">
            From arrival to your last question — here&apos;s what to expect from
            your private 45-minute visit.
          </p>
        </motion.div>

        <div className="flex flex-row items-stretch overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory pb-2 lg:pb-0">
          {TOUR_STEPS_WALKTHROUGH.map(
            ({ icon: Icon, label, description }, i) => (
              <div
                key={label}
                className="flex flex-col lg:flex-row items-center lg:items-start flex-shrink-0 w-[160px] lg:w-auto lg:flex-1 snap-center"
              >
                <motion.div
                  className="flex flex-col items-center text-center px-4 py-6 flex-1"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                >
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-sage-50 border-2 border-sage-200 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-sage-600" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center font-body">
                      {i + 1}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-gray-800 mb-1.5">
                    {label}
                  </h4>
                  <p className="text-xs text-gray-500 font-body leading-relaxed max-w-[140px]">
                    {description}
                  </p>
                </motion.div>

                {i < TOUR_STEPS_WALKTHROUGH.length - 1 && (
                  <motion.div
                    className="hidden lg:flex items-center self-center flex-shrink-0"
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
                    style={{ originX: 0 }}
                  >
                    <div className="w-8 h-0.5 bg-sage-200" />
                    <ChevronRight className="w-4 h-4 text-sage-300 -ml-1" />
                  </motion.div>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Tour FAQ ─────────────────────────────────────────────────────────────────

function TourFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold font-heading text-gray-800 mb-3">
            Before Your Visit
          </h2>
          <p className="text-gray-500 font-body">
            Quick answers to the questions families ask most.
          </p>
        </motion.div>

        <div className="space-y-3">
          {TOUR_FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer focus:outline-none"
              >
                <span className="text-sm font-semibold text-gray-800 font-body pr-4">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-primary" />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" as const }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-gray-600 font-body leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500";

const stepVariants = {
  initial: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
};

const STEP_HEADINGS: Record<TourStep, { title: string; sub: string }> = {
  1: {
    title: "Select a Date & Time",
    sub: "Pick a day or time that works for your family",
  },
  2: {
    title: "Your Information",
    sub: "Tell us a little about your family so we can personalize your tour.",
  },
  3: {
    title: "Review & Confirm",
    sub: "Everything looks good? We'll reach out to finalize your tour.",
  },
};

type UnavailabilityEntry = {
  unavailable_date: string;
  unavailable_time: string | null;
  is_recurring: boolean;
};

export default function TourPage() {
  const [currentStep, setCurrentStep] = useState<TourStep>(1);
  const stepDirection = useRef<1 | -1>(1);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const [isContactOpen, setIsContactOpen] = useState(false);

  const [unavailability, setUnavailability] = useState<UnavailabilityEntry[]>(
    [],
  );
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/tour-unavailability")
      .then((r) => r.json())
      .then((data: UnavailabilityEntry[]) => {
        if (Array.isArray(data)) {
          setUnavailability(data);

          // Auto-select first available date on desktop only
          if (window.innerWidth >= 1024) {
            const blockedDates = new Set(
              data
                .filter((e) => e.unavailable_time === null)
                .map((e) => e.unavailable_date),
            );
            const candidate = new Date(TODAY);
            for (let i = 0; i < 365; i++) {
              const dateStr = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(candidate.getDate()).padStart(2, "0")}`;
              if (isAvailableDay(candidate) && !blockedDates.has(dateStr)) {
                setSelectedDate(new Date(candidate));
                setCalendarMonth(candidate.getMonth());
                setCalendarYear(candidate.getFullYear());
                break;
              }
              candidate.setDate(candidate.getDate() + 1);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState<FormData>({
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
    stepDirection.current = step > currentStep ? 1 : -1;
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

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  const blockedDates = new Set<string>(
    unavailability
      .filter((u) => u.unavailable_time === null)
      .map((u) => u.unavailable_date),
  );

  const blockedTimesForDate = (() => {
    if (!selectedDate) return new Set<string>();
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const dayOfWeek = selectedDate.getDay();
    return new Set<string>(
      unavailability
        .filter((u) => {
          if (u.unavailable_time === null) return false;
          if (u.is_recurring) {
            const [y, m, d] = u.unavailable_date.split("-").map(Number);
            return new Date(y, m - 1, d).getDay() === dayOfWeek;
          }
          return u.unavailable_date === key;
        })
        .map((u) => u.unavailable_time as string),
    );
  })();

  function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    setSubmitError("");

    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
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

  const heading = STEP_HEADINGS[currentStep];

  // ─── Success State ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-welcome-bg">
        <Navbar darkStyle />

        <section className="pt-40 pb-20 px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 20,
              delay: 0.1,
            }}
            className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-10 sm:p-14 max-w-lg w-full text-center overflow-hidden"
          >
            {/* Confetti dots */}
            {[
              { color: "bg-primary", xEnd: -60, yEnd: -55 },
              { color: "bg-sage-400", xEnd: 0, yEnd: -65 },
              { color: "bg-yellow-300", xEnd: 60, yEnd: -55 },
            ].map(({ color, xEnd, yEnd }, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${color} opacity-80 pointer-events-none`}
                style={{ top: "4rem", left: "50%", translateX: "-50%" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: xEnd, y: yEnd, opacity: 0, scale: 0.4 }}
                transition={{
                  duration: 0.85,
                  delay: 0.25 + i * 0.08,
                  ease: "easeOut",
                }}
              />
            ))}

            <motion.div
              className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.2,
              }}
            >
              <CheckCircle className="w-12 h-12 text-primary" />
            </motion.div>

            <motion.h2
              className="text-3xl font-bold font-heading text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your Tour Is Booked!
            </motion.h2>

            <motion.p
              className="text-gray-500 font-body mb-7"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              We can&apos;t wait to show you around.
            </motion.p>

            <motion.div
              className="bg-sage-50 rounded-2xl p-6 border border-sage-200 text-left space-y-4 mb-7"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-body">
                    Date & Time
                  </p>
                  <p className="text-sm font-bold text-gray-800 font-body">
                    {selectedDate ? formatDisplayDate(selectedDate) : ""} at{" "}
                    {selectedTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-body">
                    Your Host
                  </p>
                  <p className="text-sm font-bold text-gray-800 font-body">
                    Ms. Sabrina · Lead Teacher & Director
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-body">
                    Location
                  </p>
                  <p className="text-sm font-bold text-gray-800 font-body">
                    2760 Gattis School Rd, Round Rock, TX 78664
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.p
              className="text-sm text-gray-400 font-body mb-6 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              A confirmation is headed to{" "}
              <span className="font-semibold text-gray-600">
                {formData.email}
              </span>
              . We&apos;ll follow up to finalize your visit details.
            </motion.p>

            <motion.div
              className="flex items-center justify-center gap-2 text-sm text-primary font-semibold font-body mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Add to your calendar once confirmed</span>
            </motion.div>

            <motion.div
              className="border-t border-gray-100 pt-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-gray-400 font-body uppercase tracking-wide mb-4">
                While you wait, explore
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  { label: "Our Philosophy", href: "/educational-philosophy" },
                  { label: "Meet the Team", href: "/team" },
                  {
                    label: "School Year 2026–27",
                    href: "/school-year-2026-2027",
                  },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 text-xs font-semibold font-body text-sage-700 bg-sage-50 hover:bg-sage-100 border border-sage-200 rounded-full px-4 py-2 transition-colors duration-150"
                  >
                    {label}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        <Footer />
      </div>
    );
  }

  // ─── Main Page ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 px-6 sm:px-12 lg:px-16 bg-welcome-bg overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-sage-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          {/* Left column */}
          <div>
            <motion.span
              className="inline-block px-5 py-2 bg-badge-bg border border-primary/20 text-gray-700 text-sm font-semibold rounded-full mb-6 font-body"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Campus Tours · Round Rock, TX
            </motion.span>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-5"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              See Where Your Child Will Thrive
            </motion.h1>

            <motion.p
              className="text-lg text-gray-600 font-body leading-relaxed max-w-md mb-6"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              Join us for a private, 45-minute tour of our outdoor campus. Walk
              the space, meet Ms. Sabrina, and feel the Sage Field difference
              for yourself.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
            >
              <a
                href="#schedule"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
              >
                Schedule My Tour
                <ArrowDown className="w-4 h-4" />
              </a>
            </motion.div>
          </div>

          {/* Right column — image */}
          <motion.div
            className="relative w-full h-[420px] lg:h-[540px] rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            <Image
              src="/assets/ImageEleven.jpg"
              alt="Children learning outdoors at Sage Field School"
              fill
              className="object-cover"
              priority
            />
            {/* Floating educator chip */}
            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/assets/Headshot.jpeg"
                  alt="Ms. Sabrina"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 font-body">
                  Ms. Sabrina
                </p>
                <p className="text-[10px] text-gray-500 font-body">
                  Lead Teacher & Director
                </p>
              </div>
              <span className="ml-1 bg-sage-100 text-sage-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-body">
                Your Host
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Scheduling Panel ── */}
      <section
        id="schedule"
        className="py-20 px-6 sm:px-12 lg:px-16 scroll-mt-24"
      >
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Book Your Tour
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-2">
              Reserve Your Family&apos;s Spot
            </h2>
          </motion.div>

          <StepIndicator currentStep={currentStep} />

          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-primary p-6 sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h2 className="text-xl font-bold font-heading text-gray-800 mb-1">
                {heading.title}
              </h2>
              <p className="text-sm text-gray-500 font-body">{heading.sub}</p>
            </div>

            <AnimatePresence mode="wait" custom={stepDirection.current}>
              <motion.div
                key={currentStep}
                custom={stepDirection.current}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" as const }}
              >
                {/* ── Step 1: Date & Time ── */}
                {currentStep === 1 && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:items-start">
                      <div className="lg:col-span-3">
                        <CalendarGrid
                          selectedDate={selectedDate}
                          onSelectDate={handleSelectDate}
                          calendarMonth={calendarMonth}
                          calendarYear={calendarYear}
                          onPrevMonth={handlePrevMonth}
                          onNextMonth={handleNextMonth}
                          blockedDates={blockedDates}
                        />
                        {/* Mobile: hint to open time sheet after date selected */}
                        {selectedDate && (
                          <button
                            onClick={() => setTimeSheetOpen(true)}
                            className="lg:hidden mt-4 w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-sm font-body text-primary font-semibold"
                          >
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {selectedTime ? selectedTime : "Pick a time"}
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="hidden lg:flex lg:col-span-2 lg:border-l lg:border-gray-100 lg:pl-8 lg:h-[420px] flex-col">
                        <TimeSlotPicker
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          onSelectTime={setSelectedTime}
                          blockedTimes={blockedTimesForDate}
                        />
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

                {/* ── Step 2: Your Information ── */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-body mb-4">
                      About You
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleFormChange}
                          placeholder="Jane"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleFormChange}
                          placeholder="Smith"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          placeholder="jane@example.com"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          placeholder="(555) 000-0000"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 uppercase tracking-widest font-body mb-4 mt-6">
                      About Your Child
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Child&apos;s Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="childName"
                          value={formData.childName}
                          onChange={handleFormChange}
                          placeholder="Alex"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Child&apos;s Grade / Age
                        </label>
                        <div className="relative">
                          <select
                            name="childGrade"
                            value={formData.childGrade}
                            onChange={handleFormChange}
                            className={`${inputClass} appearance-none pr-10`}
                          >
                            <option value="">Select grade…</option>
                            {GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Number of Children Attending
                        </label>
                        <div className="relative">
                          <select
                            name="numChildren"
                            value={formData.numChildren}
                            onChange={handleFormChange}
                            className={`${inputClass} appearance-none pr-10`}
                          >
                            {["1", "2", "3", "4", "5+"].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          How did you hear about us?
                        </label>
                        <div className="relative">
                          <select
                            name="referralSource"
                            value={formData.referralSource}
                            onChange={handleFormChange}
                            className={`${inputClass} appearance-none pr-10`}
                          >
                            <option value="">Select one…</option>
                            {REFERRAL_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 uppercase tracking-widest font-body mb-4 mt-6">
                      A Few Quick Questions
                    </p>

                    <div>
                      <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                        Questions or Special Accommodations
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="Anything you'd like Ms. Sabrina to know before you arrive — questions, concerns, or a little about your child…"
                        rows={4}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 3: Confirmation ── */}
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

            {/* Navigation buttons */}
            {currentStep < 3 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                {currentStep > 1 ? (
                  <button
                    onClick={() => goToStep((currentStep - 1) as TourStep)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-body text-sm font-semibold transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <span />
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => goToStep((currentStep + 1) as TourStep)}
                  disabled={
                    (currentStep === 1 && !canAdvanceStep1) ||
                    (currentStep === 2 && !canAdvanceStep2)
                  }
                  className="ml-auto bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold font-body transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {currentStep === 2 ? "Review" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex items-center mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => goToStep(2)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-body text-sm font-semibold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Edit Information
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Tour Walkthrough ── */}
      <TourWalkthrough />

      {/* ── FAQ ── */}
      <TourFAQ />

      {/* ── Location Bar ── */}
      <section className="py-16 px-6 sm:px-12 lg:px-16 bg-sage-50/60">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-4">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-body mb-0.5">
                  Location
                </p>
                <p className="text-sm font-semibold text-gray-800 font-body">
                  2760 Gattis School Rd, Round Rock, TX 78664
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-12 w-px bg-gray-200" />

            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-body mb-0.5">
                  Available
                </p>
                <p className="text-sm font-semibold text-gray-800 font-body">
                  Mon – Sat · 9:00 AM – 5:00 PM
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-12 w-px bg-gray-200" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <p className="text-sm text-gray-600 font-body whitespace-nowrap">
                Questions before booking?
              </p>
              <button
                onClick={() => setIsContactOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold font-body px-5 py-2.5 rounded-lg transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <FloatingSMSButton />
      <ContactDialog
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
