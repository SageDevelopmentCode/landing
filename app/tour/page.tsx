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
} from "lucide-react";
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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TOUR_EXPECTATIONS = [
  { icon: MapPin,    text: "Walk the outdoor learning space and classrooms" },
  { icon: Users,     text: "Meet Sage Field educators and ask any questions" },
  { icon: BookOpen,  text: "See a typical day's rhythm and curriculum in action" },
  { icon: Clock,     text: "Tour duration: approximately 45 minutes" },
  { icon: Star,      text: "Private, one-on-one family tour experience" },
];

const TODAY = new Date(2026, 3, 27); // April 27, 2026 — earliest available tour date
TODAY.setHours(0, 0, 0, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isAvailableDay(date: Date): boolean {
  const day = date.getDay();
  // Mon–Fri (1–5) and Sat (6)
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

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Date & Time", "Your Info", "Confirmation"];

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
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-body transition-colors duration-300 ${
                  isCompleted
                    ? "bg-sage-600 text-white"
                    : isActive
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-xs font-body mt-2 text-center w-16 leading-tight ${
                  isActive ? "text-primary font-semibold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mt-4 mx-1 transition-colors duration-300 ${
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

  const totalCells = startOffset + daysInMonth;
  const paddedCells = Math.ceil(totalCells / 7) * 7;

  return (
    <div>
      {/* Month navigation */}
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
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
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

      {/* Day cells */}
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
    <div>
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
        <div className="flex flex-col gap-2">
          {TIME_SLOTS.map((slot) => {
            const isBlocked = blockedTimes.has(slot);
            return (
              <button
                key={slot}
                onClick={() => !isBlocked && onSelectTime(slot)}
                disabled={isBlocked}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-body transition-all duration-150 ${
                  isBlocked
                    ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                    : selectedTime === slot
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
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
      {/* Header */}
      <motion.div
        className="flex flex-col items-center text-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold font-heading text-gray-800 mb-1">
          Almost there!
        </h3>
        <p className="text-sm text-gray-500 font-body max-w-sm">
          Review your tour details below, then hit Schedule Tour to lock in your spot.
        </p>
      </motion.div>

      {/* Summary card */}
      <div className="bg-sage-50 rounded-2xl p-6 border border-sage-200 space-y-4 mb-8">
        <SummaryRow icon={<Calendar className="w-4 h-4 text-sage-700" />} label="Date">
          {selectedDate ? formatDisplayDate(selectedDate) : "—"}
        </SummaryRow>
        <SummaryRow icon={<Clock className="w-4 h-4 text-sage-700" />} label="Time">
          {selectedTime ?? "—"}
        </SummaryRow>
        <div className="border-t border-sage-200" />
        <SummaryRow icon={<Users className="w-4 h-4 text-sage-700" />} label="Parent / Guardian">
          {formData.firstName} {formData.lastName}
        </SummaryRow>
        <SummaryRow icon={<BookOpen className="w-4 h-4 text-sage-700" />} label="Child">
          {formData.childName}
          {formData.childGrade ? ` — ${formData.childGrade}` : ""}
        </SummaryRow>
        {formData.notes && (
          <SummaryRow icon={<Star className="w-4 h-4 text-sage-700" />} label="Notes">
            {formData.notes}
          </SummaryRow>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-500 font-body text-center mb-4">{submitError}</p>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-semibold font-body transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Scheduling..." : "Schedule Tour"}
      </motion.button>
      <p className="text-xs text-gray-400 font-body text-center mt-3">
        We&apos;ll send a confirmation email and reach out to finalize your visit.
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
        <p className="text-sm font-semibold text-gray-800 font-body">{children}</p>
      </div>
    </div>
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
    sub: "Choose a weekday or Saturday that works best for your family.",
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

  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const [isContactOpen, setIsContactOpen] = useState(false);

  const [unavailability, setUnavailability] = useState<UnavailabilityEntry[]>([]);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/tour-unavailability")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUnavailability(data);
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
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  // Build a set of fully-blocked date strings (YYYY-MM-DD) — null time = whole day
  const blockedDates = new Set<string>(
    unavailability
      .filter((u) => u.unavailable_time === null)
      .map((u) => u.unavailable_date)
  );

  // Build a set of blocked time slots for the currently selected date
  const blockedTimesForDate = (() => {
    if (!selectedDate) return new Set<string>();
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const dayOfWeek = selectedDate.getDay(); // 0=Sun … 6=Sat
    return new Set<string>(
      unavailability
        .filter((u) => {
          if (u.unavailable_time === null) return false;
          if (u.is_recurring) {
            // Match by day-of-week against the stored date's day-of-week
            const [y, m, d] = u.unavailable_date.split("-").map(Number);
            return new Date(y, m - 1, d).getDay() === dayOfWeek;
          }
          return u.unavailable_date === key;
        })
        .map((u) => u.unavailable_time as string)
    );
  })();

  function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    setSubmitError("");

    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const referralMap: Record<string, string> = {
      "Google": "google",
      "Social Media": "social_media",
      "Friend / Family": "friend_family",
      "Flyer / Poster": "flyer",
      "Other": "other",
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-welcome-bg">
        <Navbar darkStyle />
        <section className="pt-40 pb-20 px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-gray-800 mb-3">
              Tour Scheduled!
            </h2>
            <p className="text-sm text-gray-500 font-body leading-relaxed mb-2">
              We received your request for{" "}
              <span className="font-semibold text-gray-700">
                {selectedDate ? formatDisplayDate(selectedDate) : ""} at {selectedTime}
              </span>
              .
            </p>
            <p className="text-sm text-gray-500 font-body leading-relaxed">
              We&apos;ll send a confirmation to{" "}
              <span className="font-semibold text-gray-700">{formData.email}</span>{" "}
              and follow up to finalize your visit.
            </p>
          </motion.div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      {/* ── Hero ── */}
      <section className="pt-32 pb-14 px-6 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6 font-body"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Campus Tours
          </motion.span>
          <motion.h1
            className="text-4xl md:text-5xl font-bold font-heading text-gray-800 leading-tight mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Schedule a Campus Tour
          </motion.h1>
          <motion.p
            className="text-lg text-gray-500 font-body leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            We&apos;d love to show you around. Pick a time that works for your
            family and we&apos;ll walk you through our space, our approach, and
            everything that makes Sage Field special.
          </motion.p>
        </div>
      </section>

      {/* ── Scheduling Panel ── */}
      <section className="pb-20 px-6 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <StepIndicator currentStep={currentStep} />

          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {/* Step heading */}
            <div className="mb-8">
              <h2 className="text-xl font-bold font-heading text-gray-800 mb-1">
                {heading.title}
              </h2>
              <p className="text-sm text-gray-500 font-body">{heading.sub}</p>
            </div>

            {/* Animated step content */}
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
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                    </div>
                    <div className="lg:col-span-2 lg:border-l lg:border-gray-100 lg:pl-8">
                      <TimeSlotPicker
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        onSelectTime={setSelectedTime}
                        blockedTimes={blockedTimesForDate}
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 2: Your Information ── */}
                {currentStep === 2 && (
                  <div className="space-y-5">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Child&apos;s Name <span className="text-red-500">*</span>
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

                    <div>
                      <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                        Questions or Special Accommodations
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="Anything you'd like us to know before your visit…"
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

            {/* Back button on step 3 */}
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

      {/* ── What to Expect ── */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-sage-50/60">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Expectations */}
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-xl font-bold font-heading text-sage-700 mb-6">
              What to Expect
            </h3>
            <ul className="space-y-4">
              {TOUR_EXPECTATIONS.map(({ icon: Icon, text }, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                >
                  <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-body leading-relaxed">
                    {text}
                  </span>
                </motion.li>
              ))}
            </ul>

            {/* Chips */}
            <div className="flex flex-wrap gap-3 mt-7">
              {[
                { icon: Clock, label: "~45 min" },
                { icon: Users, label: "Private tour" },
                { icon: Calendar, label: "Mon–Sat" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 bg-sage-50 rounded-full px-4 py-2 text-xs text-gray-600 font-body border border-sage-200"
                >
                  <Icon className="w-3.5 h-3.5 text-sage-600" />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold font-heading text-sage-700 mb-6">
              Tour Availability
            </h3>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-body mb-1">
                    Available Days
                  </p>
                  <p className="text-sm font-semibold text-gray-800 font-body">
                    Monday – Saturday
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-body mb-1">
                    Available Times
                  </p>
                  <p className="text-sm font-semibold text-gray-800 font-body">
                    9:00 AM – 5:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-body mb-1">
                    Location
                  </p>
                  <p className="text-sm font-semibold text-gray-800 font-body">
                    Sage Field School Campus
                  </p>
                  <p className="text-sm text-gray-500 font-body mt-0.5">
                    2760 Gattis School Rd, Round Rock, TX 78664
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-badge-bg rounded-xl border border-primary/20">
              <p className="text-sm text-gray-700 font-body leading-relaxed mb-3">
                <span className="font-semibold text-primary">Have questions first?</span>{" "}
                Reach out to us directly — we&apos;re happy to chat before your visit.
              </p>
              <button
                onClick={() => setIsContactOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold font-body px-4 py-2.5 rounded-lg transition-colors duration-200"
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
      <ContactDialog isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
