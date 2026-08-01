"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Users,
  BookOpen,
  Star,
  Leaf,
  Heart,
  Shield,
  ArrowDown,
  Tag,
  MapPin,
  Sun,
  Utensils,
  TreePine,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";
import ContactDialog from "@/app/components/ContactDialog";
import { formatPhone } from "@/app/utils/formatPhone";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShadowFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  childName: string;
  childGrade: string;
  referralSource: string;
  notes: string;
}

type ShadowStep = 1 | 2;

// ─── Constants ────────────────────────────────────────────────────────────────

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

const TODAY = new Date(2026, 4, 28);
TODAY.setHours(0, 0, 0, 0);

const MAX_DATE = new Date(2026, 7, 13);
MAX_DATE.setHours(0, 0, 0, 0);

const MAX_MONTH = 7;
const MAX_YEAR = 2026;

const SHADOW_TOUR_IMAGES = [
  "/assets/Stock1.jpg",
  "/assets/Kid1.png",
  "/assets/Kid2.jpg",
  // "/assets/Stock2.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
  "/assets/Stock11.jpg",
];

const STEP_LABELS = ["Pick a Date", "Your Family"];
const STEP_MICROCOPY = ["Mon–Thu school days only", "Parent + child info"];

const STEP_HEADINGS: Record<ShadowStep, { title: string; sub: string }> = {
  1: {
    title: "Choose Your Shadow Day",
    sub: "Select any Monday–Thursday school day — your child will spend the full day, 9 AM to 3 PM.",
  },
  2: {
    title: "Your Family's Information",
    sub: "Tell us about your child so Ms. Sabrina can personalize their day.",
  },
};

const SHADOW_DAY_SCHEDULE = [
  {
    time: "9:00 AM",
    icon: Sun,
    label: "Morning Arrival",
    description:
      "Your child arrives, meets their guide, and settles into the morning rhythm alongside classmates.",
    colorClass: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-500",
  },
  {
    time: "9:30 AM",
    icon: BookOpen,
    label: "Morning Lessons",
    description:
      "Circle time, collaborative learning, and Montessori/Waldorf-inspired work cycles in small groups.",
    colorClass: "bg-sage-50 border-sage-200",
    iconColor: "text-sage-600",
  },
  {
    time: "10:30 AM",
    icon: TreePine,
    label: "Outdoor Learning",
    description:
      "Nature trails, garden work, and hands-on science. This is where Sage Field comes alive.",
    colorClass: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
  },
  {
    time: "12:00 PM",
    icon: Utensils,
    label: "Lunch with Friends",
    description:
      "A real school lunch with real friends — your child eats alongside their class, not apart from it.",
    colorClass: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
  },
  {
    time: "1:00 PM",
    icon: Star,
    label: "Afternoon Projects",
    description:
      "Art, building, creative inquiry, or community projects. Afternoons at Sage Field are never passive.",
    colorClass: "bg-primary/5 border-primary/20",
    iconColor: "text-primary",
  },
  {
    time: "3:00 PM",
    icon: Heart,
    label: "Pickup & Debrief",
    description:
      "You pick up your child and spend time with your student's teacher hearing about their day.",
    colorClass: "bg-sage-50 border-sage-200",
    iconColor: "text-sage-600",
  },
];

const WHO_ITS_FOR = [
  {
    icon: BookOpen,
    headline: "Switching from traditional school",
    body: "If your child has been in conventional classrooms and you're wondering what else is possible, a shadow day makes the contrast unmistakable.",
  },
  {
    icon: Leaf,
    headline: "Curious about Montessori or Waldorf",
    body: "You've read about child-led learning. Now your child can actually live a day of it and tell you if it fits them.",
  },
  {
    icon: Users,
    headline: "Looking for the right community",
    body: "Small classes mean every child is known by name. Come see whether Sage Field's families and values feel like home.",
  },
  {
    icon: Heart,
    headline: "Your child needs something different",
    body: "If traditional school hasn't been the right fit — whether for learning style, pace, or simply joy — this day exists for you.",
  },
];

const SHADOW_FAQS = [
  {
    question: "Why does a shadow day cost $95?",
    answer:
      "Unlike a 45-minute campus tour, a shadow day is a full school day of real teacher time, materials, outdoor activities, and lunch. The $95 covers that experience and ensures families who book are genuinely considering enrollment.",
    highlight: true,
  },
  {
    question: "What happens to the $95 if we enroll?",
    answer:
      "If your family submits an enrollment application within 14 days of your child's shadow day, the $95 fee is fully waived from your first month's tuition. It's not a discount — it disappears entirely.",
    highlight: false,
  },
  {
    question: "What should my child bring?",
    answer:
      "Comfortable clothes they can get dirty in, closed-toe shoes (they'll be outdoors), a water bottle, and a packed lunch unless otherwise coordinated. Ms. Sabrina will confirm specifics when your booking is confirmed.",
    highlight: false,
  },
  {
    question: "Can siblings come?",
    answer:
      "Each shadow day is structured around one child's experience in their appropriate age group. If you have multiple children, please book separate days so each child gets the full, personalized experience.",
    highlight: false,
  },
  {
    question: "What if the day doesn't feel like a fit?",
    answer:
      "That's completely okay and it happens. We'd rather you know now than after enrollment. Your student's teacher will still spend time with you at pickup giving honest feedback about what they observed and where your child might thrive.",
    highlight: false,
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
  return day >= 1 && day <= 4;
}

function isPastDate(date: Date): boolean {
  return date < TODAY || date > MAX_DATE;
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

function StepIndicator({ currentStep }: { currentStep: ShadowStep }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as ShadowStep;
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
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  calendarMonth: number;
  calendarYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
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
          const available = isAvailableDay(date) && !past;
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

// ─── Selected Day Chip ────────────────────────────────────────────────────────

function SelectedDayChip({ date }: { date: Date | null }) {
  return (
    <AnimatePresence>
      {date && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-5 flex items-center gap-3 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3"
        >
          <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-sage-700 font-body">
            {formatShortDate(date)} · Full Day · 9:00 AM – 3:00 PM
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Shadow Day Timeline ──────────────────────────────────────────────────────

function ShadowDayTimeline() {
  return (
    <section className="py-24 px-6 sm:px-12 lg:px-16 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-5 py-2 bg-sage-50 border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-4 font-body">
            A Full Day in Their Shoes
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
            What Your Child Will Actually Do
          </h2>
          <p className="text-base text-gray-500 font-body max-w-2xl mx-auto">
            From the moment they arrive to the moment you pick them up — no
            gaps, no waiting rooms, no observation glass.
          </p>
        </motion.div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:flex items-stretch">
          {SHADOW_DAY_SCHEDULE.map(
            (
              { time, icon: Icon, label, description, colorClass, iconColor },
              i,
            ) => (
              <div key={label} className="flex items-center flex-1">
                <motion.div
                  className="flex flex-col items-center text-center flex-1 px-2"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                >
                  <p className="text-xs font-bold text-sage-600 font-body uppercase tracking-wide mb-3">
                    {time}
                  </p>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${colorClass} mb-3`}
                  >
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <h4 className="text-xs font-bold font-heading text-gray-800 mb-1">
                    {label}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-body leading-relaxed max-w-[130px]">
                    {description}
                  </p>
                </motion.div>

                {i < SHADOW_DAY_SCHEDULE.length - 1 && (
                  <motion.div
                    className="flex items-center flex-shrink-0 self-center mt-4"
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
                    style={{ originX: 0 }}
                  >
                    <div className="w-6 h-0.5 bg-sage-200" />
                    <ChevronRight className="w-3 h-3 text-sage-300 -ml-0.5" />
                  </motion.div>
                )}
              </div>
            ),
          )}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative pl-6 border-l-2 border-sage-200 space-y-6">
          {SHADOW_DAY_SCHEDULE.map(
            (
              { time, icon: Icon, label, description, colorClass, iconColor },
              i,
            ) => (
              <motion.div
                key={label}
                className="flex gap-4"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div
                  className={`absolute -left-[13px] w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass} bg-white`}
                >
                  <Icon className={`w-3 h-3 ${iconColor}`} />
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-sage-600 font-body uppercase tracking-wide mb-1">
                    {time}
                  </p>
                  <h4 className="text-sm font-bold font-heading text-gray-800 mb-1">
                    {label}
                  </h4>
                  <p className="text-xs text-gray-500 font-body leading-relaxed">
                    {description}
                  </p>
                </div>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Waived Fee Block ─────────────────────────────────────────────────────────

function WaivedFeeBlock() {
  return (
    <section className="py-24 px-6 sm:px-12 lg:px-16 bg-gradient-to-br from-sage-50 to-[#FFF9F5]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="relative bg-white rounded-3xl shadow-xl border-2 border-sage-200 overflow-hidden"
        >
          {/* Left accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-sage-500" />

          <div className="grid grid-cols-1 md:grid-cols-5">
            {/* Left panel */}
            <div className="md:col-span-3 p-8 md:p-10 pl-10 md:pl-12">
              <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wide px-4 py-1.5 rounded-full mb-6 font-body">
                <Tag className="w-3 h-3" />
                Limited-Time Offer
              </span>
              <h3 className="text-2xl md:text-3xl font-bold font-heading text-gray-800 leading-tight mb-5">
                Enroll Within 14 Days, and Your $95 Is Waived.
              </h3>
              <p className="text-base text-gray-600 font-body leading-relaxed mb-6">
                The Shadow Day fee exists because this is a real school day —
                teacher time, materials, and outdoor space included. But if you
                see the fit and enroll within two weeks of your child&apos;s
                visit, that $95 comes off your first tuition payment. No forms.
                No codes. We just honor it.
              </p>
              <div className="flex items-start gap-3 bg-sage-50 border border-sage-200 rounded-xl p-4">
                <Shield className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 font-body leading-relaxed">
                  No enrollment pressure. No coupon codes. If you love what you
                  see and apply within two weeks, we simply honor the waiver.
                </p>
              </div>
            </div>

            {/* Right panel */}
            <div className="md:col-span-2 bg-sage-50 border-t-2 md:border-t-0 md:border-l-2 border-sage-200 p-8 md:p-10 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-body mb-5">
                Shadow Day Investment
              </p>

              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-bold font-heading text-gray-300 line-through decoration-red-300">
                  $95
                </span>
                <span className="text-sage-400 text-2xl">→</span>
                <span className="text-5xl font-bold font-heading text-sage-600">
                  $0
                </span>
              </div>
              <p className="text-sm text-gray-500 font-body mb-8">
                if you enroll within 14 days
              </p>

              <div className="bg-white rounded-xl border border-sage-200 p-4 space-y-2">
                {[
                  "Shadow Day: $95",
                  "Enroll within 14 days",
                  "$95 fee waived",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-body font-semibold">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Who It's For ─────────────────────────────────────────────────────────────

function WhoItsForSection() {
  return (
    <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
            Is This Right for Us?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
            Shadow Days Are Made for These Families
          </h2>
          <p className="text-base text-gray-500 font-body">
            You don&apos;t need to be sold. You need to see it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WHO_ITS_FOR.map(({ icon: Icon, headline, body }, i) => (
            <motion.div
              key={headline}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-sage-50 border border-sage-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-white rounded-xl border border-sage-200 flex items-center justify-center mb-4 shadow-sm">
                <Icon className="w-5 h-5 text-sage-600" />
              </div>
              <h4 className="text-base font-bold font-heading text-gray-800 mb-2">
                {headline}
              </h4>
              <p className="text-sm text-gray-600 font-body leading-relaxed">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Shadow FAQ ───────────────────────────────────────────────────────────────

function ShadowFAQ() {
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
          <span className="inline-block px-5 py-2 bg-sage-50 border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-4 font-body">
            Common Questions
          </span>
          <h2 className="text-3xl font-bold font-heading text-gray-800 mb-3">
            Before You Book
          </h2>
          <p className="text-gray-500 font-body">
            Everything families ask before their child&apos;s shadow day.
          </p>
        </motion.div>

        <div className="space-y-3">
          {SHADOW_FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
                faq.highlight ? "border-amber-200" : "border-gray-100"
              }`}
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

// ─── Bottom CTA Strip ─────────────────────────────────────────────────────────

function BottomCTAStrip() {
  return (
    <section className="py-20 px-6 sm:px-12 lg:px-16 bg-gradient-to-r from-sage-800 to-sage-900">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sage-300 text-xs uppercase tracking-widest font-body mb-5">
            No pressure. No sales pitch. Just a day.
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4 leading-tight">
            Ready to see if Sage Field is the right fit?
          </h2>
          <p className="text-lg text-sage-200 font-body mb-8">
            Book a shadow day and let your child be the judge.
          </p>
          <motion.a
            href="#book"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Book a Shadow Day
            <ArrowDown className="w-4 h-4" />
          </motion.a>
          <p className="text-sm text-sage-400 font-body mt-5">
            $95 · Waived if you enroll within 14 days
          </p>
          <p className="text-sm text-sage-500 font-body mt-3">
            Already booked?{" "}
            <a
              href="/shadow-day/dashboard"
              className="text-sage-300 hover:text-white transition-colors"
            >
              View your upcoming day →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Step Variants ────────────────────────────────────────────────────────────

const stepVariants = {
  initial: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
};

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShadowTourPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ShadowStep>(1);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(5); // June
  const [calendarYear, setCalendarYear] = useState(2026);

  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        setIsLoggedIn(!!data.session);
      });
  }, []);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;

    let pos = el.scrollLeft;
    const tick = () => {
      if (!isPausedRef.current && el) {
        pos += 0.5;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleGalleryInteractionStart = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleGalleryInteractionEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2500);
  };

  const [formData, setFormData] = useState<ShadowFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    childName: "",
    childGrade: "",
    referralSource: "",
    notes: "",
  });

  function goToStep(step: ShadowStep) {
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

  const canAdvanceStep1 = selectedDate !== null;
  const canAdvanceStep2 =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.childName.trim() !== "";

  const heading = STEP_HEADINGS[currentStep];

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      {/* Mobile hero gallery — above heading */}
      <div className="sm:hidden pt-20">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onTouchStart={handleGalleryInteractionStart}
          onTouchEnd={handleGalleryInteractionEnd}
          onMouseDown={handleGalleryInteractionStart}
          onMouseUp={handleGalleryInteractionEnd}
        >
          {[...SHADOW_TOUR_IMAGES, ...SHADOW_TOUR_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-[88%] flex-shrink-0 aspect-square overflow-hidden"
            >
              <Image
                src={src}
                alt="Sage Field shadow day"
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-8 sm:pt-28 pb-16 px-6 sm:px-12 lg:px-16 bg-welcome-bg overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-sage-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          {/* Left column */}
          <div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-5"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              Let Your Child Live a Day Here.
            </motion.h1>

            <motion.p
              className="text-lg text-gray-600 font-body leading-relaxed max-w-md mb-6"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              A Shadow Day is a full school day at Sage Field — real lessons,
              real outdoor time, real lunch with classmates. Not a tour. An
              experience. Mon–Thu, 9 AM to 3 PM. $95, and waived if you enroll.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="mb-8"
            >
              <a
                href="#book"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
              >
                Book Your Shadow Day
              </a>
              <p className="mt-3 text-sm text-gray-400 font-body">
                Already booked?{" "}
                <a
                  href="/shadow-day/dashboard"
                  className="text-sage-600 hover:text-sage-700 transition-colors"
                >
                  View your upcoming day →
                </a>
              </p>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              {[
                { icon: Calendar, label: "Mon – Thu Only" },
                { icon: Clock, label: "Full Day · 9 AM – 3 PM" },
                { icon: Star, label: "$95 · Waived on Enrollment" },
                { icon: Users, label: "Ages Pre-K – 4th Grade" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-sage-200 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 font-body shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-sage-600" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right column — image */}
          <motion.div
            className="relative w-full h-[380px] lg:h-[580px] rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            <Image
              src="/assets/Kid1.png"
              alt="Child at Sage Field School"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Educator chip */}
            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/assets/team/sabrina.jpg"
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
                Your Guide
              </span>
            </div>

            {/* Full day chip */}
            <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800 font-body">
                    9 AM – 3 PM
                  </p>
                  <p className="text-[10px] text-gray-500 font-body">
                    Full school day
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Shadow Day Timeline ── */}
      <ShadowDayTimeline />

      {/* ── Waived Fee Block ── */}
      <WaivedFeeBlock />

      {/* ── Booking Section ── */}
      <section
        id="book"
        className="py-20 px-6 sm:px-12 lg:px-16 scroll-mt-24 bg-welcome-bg"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg border border-primary/20 text-black text-sm font-semibold rounded-full mb-4 font-body">
              Book Your Shadow Day
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-2">
              Reserve Your Child&apos;s Day
            </h2>
            <p className="text-base text-gray-500 font-body max-w-lg mx-auto">
              Pick a school day, share your child&apos;s info, and we&apos;ll
              confirm your booking directly.
            </p>
            <p className="text-xs text-gray-400 font-body mt-3">
              Already booked?{" "}
              <a
                href="/shadow-day/dashboard"
                className="text-sage-600 hover:text-sage-700 transition-colors"
              >
                View your upcoming day →
              </a>
            </p>
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

            <AnimatePresence mode="wait" custom={stepDirection}>
              <motion.div
                key={currentStep}
                custom={stepDirection}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" as const }}
              >
                {/* ── Step 1: Pick a Date ── */}
                {currentStep === 1 && (
                  <div>
                    <CalendarGrid
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                      calendarMonth={calendarMonth}
                      calendarYear={calendarYear}
                      onPrevMonth={handlePrevMonth}
                      onNextMonth={handleNextMonth}
                    />
                    <SelectedDayChip date={selectedDate} />
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-body">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        2760 Gattis School Rd, Round Rock, TX 78664 · School
                        days Mon–Thu only
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Your Family ── */}
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

                    <p className="text-xs text-gray-400 uppercase tracking-widest font-body mb-4 mt-6">
                      Anything Else?
                    </p>

                    <div>
                      <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                        Notes for Ms. Sabrina
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="Is there anything Ms. Sabrina should know about your child before the day? Learning style, allergies, sensitivities, or what you're hoping they experience…"
                        rows={4}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep > 1 ? (
                <button
                  onClick={() => goToStep((currentStep - 1) as ShadowStep)}
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
                onClick={() => {
                  if (currentStep === 2) {
                    const params = new URLSearchParams({
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      email: formData.email,
                      phone: formData.phone,
                      childName: formData.childName,
                      childGrade: formData.childGrade,
                      referralSource: formData.referralSource,
                      notes: formData.notes,
                      shadowDate: selectedDate
                        ? selectedDate.toISOString().split("T")[0]
                        : "",
                    });
                    router.push(`/shadow-day/start?${params.toString()}`);
                  } else {
                    goToStep((currentStep + 1) as ShadowStep);
                  }
                }}
                disabled={
                  (currentStep === 1 && !canAdvanceStep1) ||
                  (currentStep === 2 && !canAdvanceStep2)
                }
                className="ml-auto bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold font-body transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {currentStep === 2 ? "Create Account & Book" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Who It's For ── */}
      <WhoItsForSection />

      {/* ── FAQ ── */}
      <ShadowFAQ />

      {/* ── Bottom CTA ── */}
      <BottomCTAStrip />

      <Footer />
      <FloatingSMSButton />
      <ContactDialog
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
