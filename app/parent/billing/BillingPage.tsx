"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  CheckCircle2,
  Sun,
  X,
  Check,
  ChevronRight,
  Clock,
  PartyPopper,
  Sparkles,
  Tag,
  Lock,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatProgramLabel(program: string | undefined | null): string | null {
  switch (program) {
    case "summer_26":
      return "Summer 2026";
    case "school_year_26_27":
      return "School Year 26–27";
    case "both":
      return "Summer & School Year";
    case "homeschool_drop_in":
      return "Homeschool Drop-In";
    default:
      return null;
  }
}

function formatDropInProgramLabel(
  prog: string | null | undefined,
): string | null {
  switch (prog) {
    case "summer_26":
      return "Summer 2026";
    case "school_year_26_27":
      return "School Year 26–27";
    case "both":
      return "Summer & School Year";
    default:
      return null;
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import {
  SidebarField,
  SidebarSection,
} from "@/app/components/SidebarPrimitives";
import TuitionFeedbackPopup from "./TuitionFeedbackPopup";
import { submitTuitionFeedback } from "@/app/actions/submitTuitionFeedback";
import { buildSupplyFeeStudentLines } from "@/app/lib/supply-fee-breakdown";
import {
  AFTERCARE_DAILY_CENTS,
  AFTERCARE_MONTHLY_CENTS,
  BUNDLE_MONTH_INDEX,
  FUN_FRIDAY_DROPIN_CENTS,
  FUN_FRIDAY_MONTHLY_CENTS,
  FUN_FRIDAY_SESSION_MONTHLY_CENTS,
  HOMESCHOOL_SCHOOL_YEAR_PRICING,
  HOMESCHOOL_TIERS,
  type HomeschoolTier,
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
  SCHOOL_YEAR_MONTHS,
  SUPPLY_FEE_CENTS,
  WEEKDAYS,
  buildPaidDaysByMonth,
  formatCents,
  formatHomeschoolSubline,
  formatSchoolYearMonthsFromMetadata,
  formatWeekdayKeys,
  getGradeTier,
  getWeekdaysForMonth,
  schoolYearAftercareMonthCents,
  schoolYearFunFridayMonthCents,
  tierToDays,
} from "@/shared/billing/school-year";

import type {
  StripeTransaction,
  PendingPaymentRequest,
  SummerEnrollment,
  PaidWeeksByStudent,
  NonEnrolledApp,
  StudentInfo,
  HomeschoolDropInApp,
  PaidHomeschoolByStudent,
  PaidHomeschoolEntry,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  SummerNotesByStudent,
  HomeschoolNotesByStudent,
  SchoolYearOnlyApp,
  PaidSchoolYearByStudent,
} from "./page";

interface Props {
  transactions: StripeTransaction[];
  studentMap: Record<string, StudentInfo>;
  pendingRequests: PendingPaymentRequest[];
  summerEnrollments: SummerEnrollment[];
  unpaidSummerEnrollments: SummerEnrollment[];
  paidWeeksByStudent: PaidWeeksByStudent;
  parentId: string;
  parentEmail: string;
  nonEnrolledApps: NonEnrolledApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidAftercareByStudent: PaidAftercareByStudent;
  paidFunFridayByStudent: PaidFunFridayByStudent;
  summerNotesByStudent: SummerNotesByStudent;
  homeschoolNotesByStudent: HomeschoolNotesByStudent;
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  hasSubmittedTuitionFeedback: boolean;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
}

// --- Summer pricing ---
const SUMMER_WEEKLY_CENTS = { primary: 37500, upper: 35000 };
const SUMMER_FULL_CENTS = { primary: 405000, upper: 378000 };
const SUMMER_FULL_ORIGINAL_CENTS = { primary: 450000, upper: 420000 };
const TOTAL_WEEKS = 12;

const SUMMER_WEEKS = [
  {
    week: 1,
    dates: "May 26\u201328",
    theme: "Welcome to Camp",
    emoji: "\ud83c\udfd5\ufe0f",
    highlights: [
      "Kick-Off Games",
      "Friendship Bracelets",
      "Water Balloon Race",
    ],
    days: ["tue", "wed", "thu"],
  },
  {
    week: 2,
    dates: "Jun 1\u20134",
    theme: "Mystery Camp Escape Challenge",
    emoji: "\ud83d\udd0d",
    highlights: ["Giant Slip & Slide", "Painted Stones", "DIY Camp Flags"],
  },
  {
    week: 3,
    dates: "Jun 8\u201311",
    theme: "Beach Day Bash",
    emoji: "\ud83c\udfd6\ufe0f",
    highlights: ["Ice Cream Bar", "Ocean Slime", "Seashell Painting"],
  },
  {
    week: 4,
    dates: "Jun 15\u201318",
    theme: "Scientist & Space Engineering Lab",
    emoji: "\ud83d\udd2c",
    highlights: ["Slime Lab", "Volcano Model", "Rocket Ship Craft"],
  },
  {
    week: 5,
    dates: "Jun 22\u201325",
    theme: "Safari Escape",
    emoji: "\ud83e\udd81",
    highlights: ["Safari Journals", "Animal Masks", "Clay Sculptures"],
  },
  {
    week: 6,
    dates: "Jun 29\u2013Jul 2",
    theme: "Splash Into Summer",
    emoji: "\ud83d\udca6",
    highlights: ["Water Relay Races", "Sponge Dodgeball", "Tie Dye Bandanas"],
  },
  {
    week: 7,
    dates: "Jul 6\u20139",
    theme: "Dino Hunt",
    emoji: "\ud83e\udd95",
    highlights: ["Dinosaur Dig", "Dino Egg Hunt", "Moon Sand"],
  },
  {
    week: 8,
    dates: "Jul 13\u201316",
    theme: "Pirate Adventure",
    emoji: "\ud83c\udff4\u200d\u2620\ufe0f",
    highlights: ["X Marks the Spot", "Pirate Hats", "Treasure Maps"],
  },
  {
    week: 9,
    dates: "Jul 20\u201323",
    theme: "You are a Superhero!",
    emoji: "\ud83e\uddb8",
    highlights: ["Hero Obstacle Course", "Superhero Masks", "Cape Decorating"],
  },
  {
    week: 10,
    dates: "Jul 27\u201330",
    theme: "Space Explorers: Mission to the Stars",
    emoji: "\ud83d\ude80",
    highlights: ["Rocket Launch Game", "Galaxy Paintings", "Planet Craft"],
  },
  {
    week: 11,
    dates: "Aug 3\u20136",
    theme: "Down on the Farm",
    emoji: "\ud83c\udf3e",
    highlights: ["Garden Scavenger Hunt", "Flower Pot Painting", "Sack Races"],
  },
  {
    week: 12,
    dates: "Aug 10\u201313",
    theme: "Finale of Camp",
    emoji: "\ud83c\udf89",
    highlights: ["Photo Booth", "Camp T-Shirts", "Memory Scrapbook"],
  },
];

// --- Aftercare pricing (summer) ---
const AFTERCARE_MONTHS = [
  {
    key: "may",
    label: "May 2026",
    shortLabel: "May",
    days: [
      { label: "Mon May 26", date: "2026-05-26" },
      { label: "Tue May 27", date: "2026-05-27" },
      { label: "Wed May 28", date: "2026-05-28" },
      { label: "Thu May 29", date: "2026-05-29" },
    ],
  },
  {
    key: "jun",
    label: "June 2026",
    shortLabel: "Jun",
    days: [
      { label: "Mon Jun 1", date: "2026-06-01" },
      { label: "Tue Jun 2", date: "2026-06-02" },
      { label: "Wed Jun 3", date: "2026-06-03" },
      { label: "Thu Jun 4", date: "2026-06-04" },
      { label: "Mon Jun 8", date: "2026-06-08" },
      { label: "Tue Jun 9", date: "2026-06-09" },
      { label: "Wed Jun 10", date: "2026-06-10" },
      { label: "Thu Jun 11", date: "2026-06-11" },
      { label: "Mon Jun 15", date: "2026-06-15" },
      { label: "Tue Jun 16", date: "2026-06-16" },
      { label: "Wed Jun 17", date: "2026-06-17" },
      { label: "Thu Jun 18", date: "2026-06-18" },
      { label: "Mon Jun 22", date: "2026-06-22" },
      { label: "Tue Jun 23", date: "2026-06-23" },
      { label: "Wed Jun 24", date: "2026-06-24" },
      { label: "Thu Jun 25", date: "2026-06-25" },
      { label: "Mon Jun 29", date: "2026-06-29" },
      { label: "Tue Jun 30", date: "2026-06-30" },
    ],
  },
  {
    key: "jul",
    label: "July 2026",
    shortLabel: "Jul",
    days: [
      { label: "Wed Jul 1", date: "2026-07-01" },
      { label: "Thu Jul 2", date: "2026-07-02" },
      { label: "Mon Jul 6", date: "2026-07-06" },
      { label: "Tue Jul 7", date: "2026-07-07" },
      { label: "Wed Jul 8", date: "2026-07-08" },
      { label: "Thu Jul 9", date: "2026-07-09" },
      { label: "Mon Jul 13", date: "2026-07-13" },
      { label: "Tue Jul 14", date: "2026-07-14" },
      { label: "Wed Jul 15", date: "2026-07-15" },
      { label: "Thu Jul 16", date: "2026-07-16" },
      { label: "Mon Jul 20", date: "2026-07-20" },
      { label: "Tue Jul 21", date: "2026-07-21" },
      { label: "Wed Jul 22", date: "2026-07-22" },
      { label: "Thu Jul 23", date: "2026-07-23" },
      { label: "Mon Jul 27", date: "2026-07-27" },
      { label: "Tue Jul 28", date: "2026-07-28" },
      { label: "Wed Jul 29", date: "2026-07-29" },
      { label: "Thu Jul 30", date: "2026-07-30" },
    ],
  },
  {
    key: "aug",
    label: "August 2026",
    shortLabel: "Aug",
    days: [
      { label: "Mon Aug 3", date: "2026-08-03" },
      { label: "Tue Aug 4", date: "2026-08-04" },
      { label: "Wed Aug 5", date: "2026-08-05" },
      { label: "Thu Aug 6", date: "2026-08-06" },
      { label: "Mon Aug 10", date: "2026-08-10" },
      { label: "Tue Aug 11", date: "2026-08-11" },
      { label: "Wed Aug 12", date: "2026-08-12" },
      { label: "Thu Aug 13", date: "2026-08-13" },
    ],
  },
];

function aftercareMonthCents(month: (typeof AFTERCARE_MONTHS)[number]): number {
  const normalMonthDayThreshold = 15;
  return month.days.length < normalMonthDayThreshold
    ? Math.round(month.days.length * 1868.75)
    : AFTERCARE_MONTHLY_CENTS;
}

// --- Fun Friday pricing (summer) ---
const FUN_FRIDAY_MONTHS = [
  {
    key: "may",
    label: "May 2026",
    fridays: [{ label: "Fri May 29", date: "2026-05-29" }],
  },
  {
    key: "jun",
    label: "June 2026",
    fridays: [
      { label: "Fri Jun 5", date: "2026-06-05" },
      { label: "Fri Jun 12", date: "2026-06-12" },
      { label: "Fri Jun 19", date: "2026-06-19" },
      { label: "Fri Jun 26", date: "2026-06-26" },
    ],
  },
  {
    key: "jul",
    label: "July 2026",
    fridays: [
      { label: "Fri Jul 3", date: "2026-07-03" },
      { label: "Fri Jul 10", date: "2026-07-10" },
      { label: "Fri Jul 17", date: "2026-07-17" },
      { label: "Fri Jul 24", date: "2026-07-24" },
      { label: "Fri Jul 31", date: "2026-07-31" },
    ],
  },
  {
    key: "aug",
    label: "August 2026",
    fridays: [
      { label: "Fri Aug 7", date: "2026-08-07" },
      { label: "Fri Aug 14", date: "2026-08-14" },
    ],
  },
];

function funFridayMonthCents(
  month: (typeof FUN_FRIDAY_MONTHS)[number],
): number {
  return month.fridays.length >= 4
    ? FUN_FRIDAY_MONTHLY_CENTS
    : month.fridays.length * FUN_FRIDAY_SESSION_MONTHLY_CENTS;
}

// --- Homeschool Drop-In pricing ---
// Summer: per-week rates
const HOMESCHOOL_SUMMER_PRICING = {
  dropin: { primary: 10000, upper: 9500 }, // $100/day, $95/day
  "2day": { primary: 18000, upper: 17000 }, // $180/wk, $170/wk
  "3day": { primary: 25500, upper: 24000 }, // $255/wk, $240/wk
} as const;

function deriveTier(dayCount: number): HomeschoolTier {
  if (dayCount === 1) return "dropin";
  if (dayCount === 2) return "2day";
  return "3day";
}

function gradeTierLabel(tier: "primary" | "upper"): string {
  return tier === "primary" ? "Pre-K–1st Grade" : "2nd–4th Grade";
}

function formatPaymentType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === "completed";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isCompleted
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatProgram(program: string): string {
  if (program === "summer_26") return "Summer 2026";
  if (program === "school_year_26_27") return "School Year 2026\u20132027";
  if (program === "homeschool_drop_in") return "Homeschool Drop-In";
  return program;
}

function PendingPaymentCard({
  request,
  studentName,
  onClick,
}: {
  request: PendingPaymentRequest;
  studentName: string | null;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      {/* Photo banner */}
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/ImageTen.jpg"
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
      {/* Card body */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            {formatProgram(request.program)}
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            {request.label}
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-bold" style={{ color: "#4a7c59" }}>
            {request.amount_cents != null
              ? formatCents(request.amount_cents)
              : "—"}
          </span>
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#4a7c59" }}
          >
            Pay Now
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function SummerTuitionCard({
  studentName,
  paidWeeks,
  onClick,
}: {
  studentName: string | null;
  paidWeeks: number[];
  onClick: () => void;
}) {
  const hasPaidWeeks = paidWeeks.length > 0;
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/ImageFive.jpg"
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        {hasPaidWeeks && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
            {paidWeeks.length}w paid
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            Summer 2026
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Summer Program Tuition
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#e07a3a" }}
          >
            {hasPaidWeeks ? "Add weeks" : "Select plan"}
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function SchoolYearTuitionCard({
  onClick,
  supplyFeePaid,
  paidMonthsCount,
}: {
  onClick: () => void;
  supplyFeePaid: boolean;
  paidMonthsCount: number;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col ${supplyFeePaid ? "cursor-pointer group" : "cursor-not-allowed"}`}
      onClick={supplyFeePaid ? onClick : undefined}
    >
      <div className="relative h-28 overflow-hidden bg-gray-200">
        <img
          src="/assets/Stock1.jpg"
          alt=""
          className={`w-full h-full object-cover object-center transition-transform duration-500 ${supplyFeePaid ? "group-hover:scale-105" : ""}`}
        />
        <div className="absolute inset-0 bg-black/10" />
        {paidMonthsCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            {paidMonthsCount} mo. paid
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            School Year 26–27
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            School Year Tuition
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          {supplyFeePaid ? (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "#4a7c59" }}
            >
              Pay tuition <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
              <Lock className="w-3 h-3" strokeWidth={2.5} /> Pay supply fee
              first
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplyFeeCard({
  onClick,
  supplyFeePaid,
}: {
  onClick?: () => void;
  supplyFeePaid?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col ${supplyFeePaid ? "cursor-default opacity-80" : "cursor-pointer group"}`}
      onClick={supplyFeePaid ? undefined : onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/Stock2.jpg"
          alt=""
          className={`w-full h-full object-cover transition-transform duration-500 ${supplyFeePaid ? "" : "group-hover:scale-105"}`}
          style={{ objectPosition: "center 65%" }}
        />
        <div className="absolute inset-0 bg-black/10" />
        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
          $300
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            School Year 26–27
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Annual Supply Fee
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          {supplyFeePaid ? (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "#4a7c59" }}
            >
              <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} /> Paid
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "#4a7c59" }}
            >
              Pay now <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NonEnrolledCard({ app }: { app: NonEnrolledApp }) {
  return (
    <a
      href={`/parent/dashboard?app=${app.id}`}
      className="col-span-2 flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors no-underline"
    >
      <div
        className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#f5e0c0", color: "#b45309" }}
      >
        {getInitials(app.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">
          {app.name ?? "Student"}
        </div>
        <div className="text-xs text-amber-600 mt-0.5">
          Enrollment not complete
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-amber-700">
          Complete enrollment
        </span>
        <ChevronRight className="w-4 h-4 text-amber-700" strokeWidth={2} />
      </div>
    </a>
  );
}

function HomeschoolPlanHistoryModal({
  app,
  studentName,
  paidData,
  onClose,
  onAddMore,
}: {
  app: HomeschoolDropInApp;
  studentName: string | null;
  paidData: PaidHomeschoolByStudent[string];
  onClose: () => void;
  onAddMore: () => void;
}) {
  const tierLabel = (tier: string) => {
    if (tier === "dropin") return "Explorer Day Pass";
    if (tier === "2day") return "2 Days / Week";
    if (tier === "3day") return "3 Days / Week";
    return tier;
  };
  const dayLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);

  const formatEntryDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold font-heading text-gray-800">
              Current Plan
            </h2>
            {studentName && (
              <p className="text-xs text-gray-400 mt-0.5">{studentName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {paidData.summer.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Summer 2026
              </p>
              <div className="space-y-3">
                {paidData.summer.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 px-4 py-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">
                        {tierLabel(entry.tier)}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#4a7c59" }}
                      >
                        {formatCents(entry.amountCents)}
                      </span>
                    </div>
                    {entry.days.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Days: {entry.days.map(dayLabel).join(", ")}
                      </p>
                    )}
                    {entry.weeks.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Weeks: {entry.weeks.sort((a, b) => a - b).join(", ")} (
                        {entry.weeks.length} week
                        {entry.weeks.length !== 1 ? "s" : ""})
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Paid {formatEntryDate(entry.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {paidData.schoolYear.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                School Year 2026–2027
              </p>
              <div className="space-y-3">
                {paidData.schoolYear.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 px-4 py-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">
                        {tierLabel(entry.tier)}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#4a7c59" }}
                      >
                        {formatCents(entry.amountCents)}
                      </span>
                    </div>
                    {entry.weeks.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Months:{" "}
                        {entry.weeks
                          .sort((a, b) => a - b)
                          .map((w) => SCHOOL_YEAR_MONTHS.find((m) => m.index === w)?.short ?? `Month ${w}`)
                          .join(", ")}
                      </p>
                    )}
                    {entry.days.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {entry.tier === "dropin"
                          ? `Every ${dayLabel(entry.days[0])}`
                          : `Days: ${entry.days.map(dayLabel).join(", ")}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Paid {formatEntryDate(entry.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2">
            <button
              onClick={onAddMore}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
            >
              Add more days / weeks
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HomeschoolDropInCard({
  app,
  studentName,
  paidData,
  onClick,
  onViewHistory,
}: {
  app: HomeschoolDropInApp;
  studentName: string | null;
  paidData?: PaidHomeschoolByStudent[string];
  onClick: () => void;
  onViewHistory?: () => void;
}) {
  const dropInProgram = app.drop_in_program;
  let programLabel = "Homeschool Drop-In";
  if (dropInProgram === "summer_26") programLabel = "Summer 2026";
  else if (dropInProgram === "school_year_26_27")
    programLabel = "School Year 2026–2027";
  else if (dropInProgram === "both") programLabel = "Summer & School Year";

  const isDisabled = dropInProgram === "school_year_26_27";

  const hasSummer = (paidData?.summer.length ?? 0) > 0;
  const hasSchoolYear = (paidData?.schoolYear.length ?? 0) > 0;
  const hasPriorPayment = hasSummer || hasSchoolYear;

  const paidSchoolYearMonthCount = (paidData?.schoolYear ?? [])
    .reduce((sum, entry) => sum + entry.weeks.length, 0);

  let ctaLabel = "Set up plan";
  let badgeLabel = "Select schedule & days";
  let badgeColor = "bg-blue-50 text-blue-600";

  if (hasSummer && hasSchoolYear) {
    ctaLabel = "Manage Plan";
    badgeLabel = "Plans active";
    badgeColor = "bg-emerald-50 text-emerald-700";
  } else if (hasSummer) {
    ctaLabel = "Add Weeks";
    badgeLabel = "Summer plan active";
    badgeColor = "bg-emerald-50 text-emerald-700";
  } else if (hasSchoolYear) {
    ctaLabel = "Edit Plan";
    badgeLabel = "School year plan active";
    badgeColor = "bg-emerald-50 text-emerald-700";
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col ${isDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer group"}`}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/Stock7.jpg"
          alt=""
          className={`w-full h-full object-cover object-center ${isDisabled ? "grayscale" : "transition-transform duration-500 group-hover:scale-105"}`}
        />
        <div
          className={`absolute inset-0 ${isDisabled ? "bg-black/20" : "bg-black/10"}`}
        />
        {!isDisabled && (
          <>
            {paidSchoolYearMonthCount > 0 ? (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                {paidSchoolYearMonthCount} mo. paid
              </div>
            ) : (
              <span
                className={`absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${hasPriorPayment ? "bg-emerald-500 text-white" : "bg-white/80 backdrop-blur-sm text-gray-600"}`}
              >
                {badgeLabel}
              </span>
            )}
          </>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            {programLabel}
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Homeschool Drop-In
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          {isDisabled ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 bg-gray-100 cursor-not-allowed">
              <Clock className="w-3 h-3" />
              Not available yet
            </span>
          ) : (
            <>
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: "#4a7c59" }}
              >
                {ctaLabel}
                <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
              </span>
              {hasPriorPayment && onViewHistory && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory();
                  }}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer underline underline-offset-2"
                >
                  View current plan
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeschoolSchoolYearCard({
  app,
  studentName,
  paidData,
  onClick,
  onViewHistory,
  supplyFeePaid,
}: {
  app: HomeschoolDropInApp;
  studentName: string | null;
  paidData?: PaidHomeschoolByStudent[string];
  onClick: () => void;
  onViewHistory?: () => void;
  supplyFeePaid: boolean;
}) {
  const hasSchoolYear = (paidData?.schoolYear.length ?? 0) > 0;

  let ctaLabel = "Set up plan";
  let badgeLabel = "Select schedule & days";

  if (hasSchoolYear) {
    ctaLabel = "Add month";
    badgeLabel = "Plan active";
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col ${supplyFeePaid ? "cursor-pointer group" : "cursor-not-allowed"}`}
      onClick={supplyFeePaid ? onClick : undefined}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/Stock11.jpg"
          alt=""
          className={`w-full h-full object-cover object-center transition-transform duration-500 ${supplyFeePaid ? "group-hover:scale-105" : ""}`}
        />
        <div className="absolute inset-0 bg-black/10" />
        <span
          className={`absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
            hasSchoolYear
              ? "bg-emerald-500 text-white"
              : "bg-white/80 backdrop-blur-sm text-gray-600"
          }`}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            School Year 26–27
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Homeschool Drop-In
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          {supplyFeePaid ? (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "#4a7c59" }}
            >
              {ctaLabel}
              <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
              <Lock className="w-3 h-3" strokeWidth={2.5} /> Pay supply fee
              first
            </span>
          )}
          {supplyFeePaid && hasSchoolYear && onViewHistory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory();
              }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer underline underline-offset-2"
            >
              View current plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeschoolSchoolYearModal({
  app,
  studentName,
  parentId,
  parentEmail,
  paidData,
  onClose,
  siblingApps = [],
  siblingPaidHomeschool = {},
  siblingStudentMap = {},
}: {
  app: HomeschoolDropInApp;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidData?: PaidHomeschoolByStudent[string];
  onClose: () => void;
  siblingApps?: HomeschoolDropInApp[];
  siblingPaidHomeschool?: PaidHomeschoolByStudent;
  siblingStudentMap?: Record<string, StudentInfo>;
}) {
  const gradeTier = getGradeTier(app.child_grade);
  const [selectedTier, setSelectedTier] = useState<HomeschoolTier | null>(null);
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<Set<number>>(
    new Set(),
  );
  const [dropinSelectedDates, setDropinSelectedDates] = useState<Set<number>>(
    new Set(),
  );
  const [dropinExpandedMonths, setDropinExpandedMonths] = useState<Set<number>>(
    new Set(SCHOOL_YEAR_MONTHS.map((m) => m.index)),
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(
    new Set(),
  );
  const [step, setStep] = useState<"plan" | "sibling" | "payment">("plan");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includedSiblings, setIncludedSiblings] = useState<
    Record<string, boolean>
  >({});
  const [siblingMonthOverrides, setSiblingMonthOverrides] = useState<
    Record<string, Set<number>>
  >({});
  const [siblingEditorOpen, setSiblingEditorOpen] = useState<
    Record<string, boolean>
  >({});
  const [siblingEditorDirty, setSiblingEditorDirty] = useState<
    Record<string, boolean>
  >({});

  const paidMonthIndices = new Set<number>(
    (paidData?.schoolYear ?? []).flatMap((entry) => entry.weeks),
  );

  const paidDaysByMonth = buildPaidDaysByMonth(paidData?.schoolYear ?? []);

  const paidMonthsByTier = (paidData?.schoolYear ?? []).reduce<
    Record<string, Set<number>>
  >((acc, entry) => {
    if (!acc[entry.tier]) acc[entry.tier] = new Set();
    entry.weeks.forEach((w) => acc[entry.tier].add(w));
    return acc;
  }, {});

  const unitCount = selectedMonthIndices.size;
  const pricePerUnit = selectedTier
    ? HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][gradeTier]
    : 0;
  const baseAmountCents = pricePerUnit * unitCount;

  const getSiblingPaidMonths = (studentId: string) =>
    new Set(
      (siblingPaidHomeschool[studentId]?.schoolYear ?? []).flatMap(
        (entry) => entry.weeks,
      ),
    );

  const eligibleSiblings = siblingApps.filter((sib) => {
    const paidMonths = getSiblingPaidMonths(sib.student_id);
    return Array.from(selectedMonthIndices).some((m) => !paidMonths.has(m));
  });

  useEffect(() => {
    setIncludedSiblings((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [s.student_id, prev[s.student_id] ?? true]),
      ),
    );
    setSiblingEditorDirty((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [
          s.student_id,
          prev[s.student_id] ?? false,
        ]),
      ),
    );
    setSiblingMonthOverrides((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => {
          if (siblingEditorDirty[s.student_id])
            return [s.student_id, prev[s.student_id] ?? new Set()];
          const paidMonths = getSiblingPaidMonths(s.student_id);
          const defaultMonths = Array.from(selectedMonthIndices).filter(
            (m) => !paidMonths.has(m),
          );
          return [s.student_id, new Set(defaultMonths)];
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eligibleSiblings.map((s) => s.student_id).join(","),
    Array.from(selectedMonthIndices)
      .sort((a, b) => a - b)
      .join(","),
  ]);

  function toggleSiblingMonth(studentId: string, monthIndex: number) {
    const paidMonths = getSiblingPaidMonths(studentId);
    if (paidMonths.has(monthIndex)) return;
    setSiblingEditorDirty((prev) => ({ ...prev, [studentId]: true }));
    setSiblingMonthOverrides((prev) => {
      const next = new Set(prev[studentId] ?? []);
      if (next.has(monthIndex)) next.delete(monthIndex);
      else next.add(monthIndex);
      return { ...prev, [studentId]: next };
    });
  }

  const siblingPayloads =
    selectedTier === null
      ? []
      : eligibleSiblings
          .filter((sib) => includedSiblings[sib.student_id])
          .map((sib) => {
            const sibGradeTier = getGradeTier(sib.child_grade);
            const paidMonths = getSiblingPaidMonths(sib.student_id);
            const override = siblingMonthOverrides[sib.student_id];
            const sibMonths = override
              ? Array.from(override)
                  .filter((m) => !paidMonths.has(m))
                  .sort((a, b) => a - b)
              : Array.from(selectedMonthIndices)
                  .filter((m) => !paidMonths.has(m))
                  .sort((a, b) => a - b);
            const sibDays = Array.from(selectedWeekdays);
            const tier = selectedTier;
            const sibAmount =
              HOMESCHOOL_SCHOOL_YEAR_PRICING[tier][sibGradeTier] *
              sibMonths.length;
            const weekSelectionsJson = JSON.stringify(
              sibMonths.map((w) => ({ week: w, days: sibDays })),
            );
            return {
              studentId: sib.student_id,
              applicationId: sib.id,
              tier,
              gradeTier: sibGradeTier,
              selectedDays: sibDays,
              selectedWeeks: sibMonths,
              weekSelectionsJson,
              intendedAmountCents: sibAmount,
              studentName: siblingStudentMap[sib.student_id]?.name,
            };
          });

  const siblingTotal = siblingPayloads.reduce(
    (s, sib) => s + sib.intendedAmountCents,
    0,
  );
  const combinedIntendedCents = baseAmountCents + siblingTotal;

  const cardFeeRate = 0.029;
  const cardFeeFixed = 30;
  const achFeeRate = 0.008;
  const achFeeCap = 500;
  const cardFee =
    Math.round(combinedIntendedCents * cardFeeRate) + cardFeeFixed;
  const achFee = Math.min(
    Math.round(combinedIntendedCents * achFeeRate),
    achFeeCap,
  );
  const feeCents = coverFees
    ? paymentMethod === "ach"
      ? Math.min(Math.round(combinedIntendedCents * achFeeRate), achFeeCap)
      : Math.round((combinedIntendedCents + 30) / (1 - 0.029)) -
        combinedIntendedCents
    : 0;
  const totalWithFees = combinedIntendedCents + feeCents;

  const requiredDays =
    selectedTier === "dropin"
      ? 1
      : selectedTier === "2day"
        ? 2
        : selectedTier === "3day"
          ? 3
          : 0;
  const canContinuePlan =
    selectedTier !== null &&
    unitCount >= 1 &&
    selectedWeekdays.size === requiredDays;

  const handlePayNow = async () => {
    if (!selectedTier) return;
    setLoading(true);
    setError(null);
    try {
      const selectedDays = Array.from(selectedWeekdays);
      const selectedWeeks = Array.from(selectedMonthIndices).sort(
        (a, b) => a - b,
      );
      const weekSelectionsJson = JSON.stringify(
        selectedWeeks.map((w) => ({ week: w, days: selectedDays })),
      );
      const res = await fetch("/api/stripe/create-homeschool-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: app.student_id,
          applicationId: app.id,
          program: "school_year_26_27",
          tier: selectedTier,
          gradeTier,
          selectedDays,
          selectedWeeks,
          weekSelectionsJson,
          intendedAmountCents: baseAmountCents,
          coverFees,
          paymentMethod,
          siblings: siblingPayloads,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold font-heading text-gray-800">
              Homeschool Drop-In
            </h2>
            {studentName && (
              <p className="text-xs text-gray-400 mt-0.5">
                {studentName} · School Year 26–27
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "plan" ? (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
              {/* Grade tier */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 font-body">
                  {gradeTierLabel(gradeTier)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  School Year 26–27 · Aug 2026–May 2027
                </span>
              </div>

              {/* Tier selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    1
                  </span>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Choose your schedule
                  </p>
                </div>
                <div className="space-y-2">
                  {HOMESCHOOL_TIERS.map((tier) => {
                    const price =
                      HOMESCHOOL_SCHOOL_YEAR_PRICING[tier.key][gradeTier];
                    const isSelected = selectedTier === tier.key;
                    return (
                      <button
                        key={tier.key}
                        onClick={() => {
                          setSelectedTier(tier.key);
                          setSelectedMonthIndices(new Set());
                          setDropinSelectedDates(new Set());
                          setDropinExpandedMonths(
                            new Set(SCHOOL_YEAR_MONTHS.map((m) => m.index)),
                          );
                          setSelectedWeekdays(new Set());
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-gray-800"}`}
                            >
                              {tier.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {tier.sub}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-bold ${isSelected ? "text-primary" : "text-gray-700"}`}
                            >
                              {formatCents(price)}
                            </div>
                            <div className="text-xs text-gray-400">/mo</div>
                          </div>
                        </div>
                        {(() => {
                          const paidSet = paidMonthsByTier[tier.key];
                          if (!paidSet || paidSet.size === 0) return null;
                          const paidMonths = SCHOOL_YEAR_MONTHS.filter((m) =>
                            paidSet.has(m.index),
                          );
                          return (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {paidMonths.map((m) => {
                                const dayLabel = formatWeekdayKeys(
                                  paidDaysByMonth[m.index] ?? [],
                                );
                                return (
                                  <span
                                    key={m.index}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700"
                                  >
                                    <Check
                                      className="w-2.5 h-2.5 shrink-0"
                                      strokeWidth={2.5}
                                    />
                                    {m.short}
                                    {dayLabel ? ` · ${dayLabel}` : ""}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day-of-week picker */}
              {selectedTier !== null && (
                <div className="pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      2
                    </span>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Choose your{" "}
                      {requiredDays === 1
                        ? "1 day"
                        : requiredDays === 2
                          ? "2 days"
                          : "3 days"}{" "}
                      (Mon–Thu)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {WEEKDAYS.map(({ key, label }) => {
                      const isChosen = selectedWeekdays.has(key);
                      const atLimit =
                        selectedWeekdays.size === requiredDays && !isChosen;
                      return (
                        <button
                          key={key}
                          disabled={atLimit}
                          onClick={() =>
                            setSelectedWeekdays((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              return next;
                            })
                          }
                          className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                            isChosen
                              ? "text-white border-transparent"
                              : atLimit
                                ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                                : "border-gray-200 text-gray-600 bg-white hover:border-primary hover:text-primary"
                          }`}
                          style={
                            isChosen
                              ? {
                                  backgroundColor: "#4a7c59",
                                  borderColor: "#4a7c59",
                                }
                              : undefined
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedWeekdays.size > 0 &&
                    selectedWeekdays.size < requiredDays && (
                      <p className="text-xs text-gray-400 mt-2">
                        Select {requiredDays - selectedWeekdays.size} more day
                        {requiredDays - selectedWeekdays.size !== 1 ? "s" : ""}
                      </p>
                    )}
                </div>
              )}

              {/* Month grid */}
              {selectedTier !== null && (
                <div className="pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      3
                    </span>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Select months to pay
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {SCHOOL_YEAR_MONTHS.map((month) => {
                      const isPaid = paidMonthIndices.has(month.index);
                      const isSelected = selectedMonthIndices.has(month.index);
                      const paidDayLabel = isPaid
                        ? formatWeekdayKeys(paidDaysByMonth[month.index] ?? [])
                        : "";
                      return (
                        <button
                          key={month.index}
                          disabled={isPaid}
                          onClick={() => {
                            if (isPaid) return;
                            setSelectedMonthIndices((prev) => {
                              const next = new Set(prev);
                              if (next.has(month.index))
                                next.delete(month.index);
                              else next.add(month.index);
                              return next;
                            });
                          }}
                          title={
                            paidDayLabel
                              ? `${month.label} · ${paidDayLabel}`
                              : month.label
                          }
                          className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            isPaid
                              ? "bg-green-50 border border-green-200 text-green-600 cursor-not-allowed"
                              : isSelected
                                ? "border-2 border-primary text-white"
                                : "border border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                          }`}
                          style={
                            isSelected && !isPaid
                              ? { backgroundColor: "#4a7c59" }
                              : undefined
                          }
                        >
                          {isPaid && <Check className="w-3 h-3" />}
                          {month.short}
                          {paidDayLabel ? (
                            <span className="text-[9px] font-medium text-green-600/80 leading-tight">
                              {paidDayLabel}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {selectedMonthIndices.size > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedMonthIndices.size} month
                      {selectedMonthIndices.size !== 1 ? "s" : ""} ·{" "}
                      <span className="font-bold" style={{ color: "#4a7c59" }}>
                        {formatCents(baseAmountCents)}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    Need a different number of days for a specific week?{" "}
                    <a
                      href="mailto:sabrina@sagefield.co"
                      className="text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Email us
                    </a>{" "}
                    and we&apos;ll get it sorted.
                  </p>
                </div>
              )}
              </motion.div>
            ) : step === "sibling" ? (
              <motion.div
                key="sibling"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-4"
              >
                <div>
                  <p className="text-base font-bold font-heading text-gray-800 mb-1">
                    Add a sibling to this payment?
                  </p>
                  <p className="text-sm text-gray-500 font-body">
                    Pay for both children in one transaction and save the extra
                    processing fee.
                  </p>
                </div>

                <div className="space-y-3">
                  {eligibleSiblings.map((sib) => {
                    const sibGradeTier = getGradeTier(sib.child_grade);
                    const paidMonths = getSiblingPaidMonths(sib.student_id);
                    const override = siblingMonthOverrides[sib.student_id];
                    const sibMonths = override
                      ? Array.from(override)
                          .filter((m) => !paidMonths.has(m))
                          .sort((a, b) => a - b)
                      : Array.from(selectedMonthIndices)
                          .filter((m) => !paidMonths.has(m))
                          .sort((a, b) => a - b);
                    const sibAmount =
                      selectedTier
                        ? HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][
                            sibGradeTier
                          ] * sibMonths.length
                        : 0;
                    const sibName =
                      siblingStudentMap[sib.student_id]?.name ?? "Sibling";
                    const isIncluded = includedSiblings[sib.student_id] ?? true;
                    const primaryMonthsForSib = Array.from(selectedMonthIndices)
                      .filter((m) => !paidMonths.has(m))
                      .sort((a, b) => a - b);
                    const isSameAsPrimary =
                      sibMonths.length === primaryMonthsForSib.length &&
                      sibMonths.every((m, i) => m === primaryMonthsForSib[i]);
                    const isEditorOpen =
                      siblingEditorOpen[sib.student_id] ?? false;

                    return (
                      <div
                        key={sib.student_id}
                        className={`w-full rounded-xl border transition-colors ${
                          isIncluded
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIncludedSiblings((prev) => ({
                              ...prev,
                              [sib.student_id]: !prev[sib.student_id],
                            }));
                            setSiblingEditorOpen((prev) => ({
                              ...prev,
                              [sib.student_id]: false,
                            }));
                          }}
                          className="w-full flex items-start gap-3 p-4 text-left cursor-pointer"
                        >
                          <span
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isIncluded
                                ? "border-emerald-600 bg-emerald-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isIncluded && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800 font-heading">
                                {sibName}
                              </span>
                              <span
                                className="text-sm font-bold font-heading"
                                style={{
                                  color: sibAmount > 0 ? "#4a7c59" : "#9ca3af",
                                }}
                              >
                                {sibAmount > 0
                                  ? formatCents(sibAmount)
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {sib.child_grade && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                  {sib.child_grade}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 font-body">
                                {sibMonths.length === 0
                                  ? "No months selected"
                                  : isSameAsPrimary
                                    ? `${sibMonths.length} mo. · same as ${studentName ?? "first child"}`
                                    : `${sibMonths.length} mo. · ${sibMonths
                                        .map(
                                          (m) =>
                                            SCHOOL_YEAR_MONTHS.find(
                                              (sm) => sm.index === m,
                                            )?.short ?? m,
                                        )
                                        .join(", ")}`}
                              </span>
                            </div>
                          </div>
                        </button>

                        {isIncluded && (
                          <div className="px-4 pb-4">
                            {!isEditorOpen ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSiblingEditorOpen((prev) => ({
                                    ...prev,
                                    [sib.student_id]: true,
                                  }))
                                }
                                className="text-xs font-semibold underline-offset-2 hover:underline cursor-pointer transition-colors"
                                style={{ color: "#4a7c59" }}
                              >
                                Edit months
                              </button>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-500 font-body">
                                    Months for {sibName}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSiblingEditorOpen((prev) => ({
                                        ...prev,
                                        [sib.student_id]: false,
                                      }))
                                    }
                                    className="text-xs font-semibold cursor-pointer transition-colors"
                                    style={{ color: "#4a7c59" }}
                                  >
                                    Done
                                  </button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {SCHOOL_YEAR_MONTHS.map((month) => {
                                    const isPaid = paidMonths.has(month.index);
                                    const isSelected =
                                      isPaid ||
                                      (override
                                        ? override.has(month.index)
                                        : sibMonths.includes(month.index));
                                    return (
                                      <button
                                        key={month.index}
                                        type="button"
                                        disabled={isPaid}
                                        onClick={() =>
                                          toggleSiblingMonth(
                                            sib.student_id,
                                            month.index,
                                          )
                                        }
                                        className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                                          isPaid
                                            ? "bg-green-50 border border-green-200 text-green-600 cursor-not-allowed"
                                            : isSelected
                                              ? "border-2 border-primary text-white"
                                              : "border border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                                        }`}
                                        style={
                                          isSelected && !isPaid
                                            ? { backgroundColor: "#4a7c59" }
                                            : undefined
                                        }
                                      >
                                        {month.short}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {siblingPayloads.length > 0 && (
                  <div
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{ backgroundColor: "#f0f7f1" }}
                  >
                    <span className="text-sm text-gray-600 font-body">
                      Combined total
                    </span>
                    <span
                      className="text-sm font-bold font-heading"
                      style={{ color: "#4a7c59" }}
                    >
                      {formatCents(combinedIntendedCents)}
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  Payment method
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("ach")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                      paymentMethod === "ach"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    ACH / US bank account
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-body mt-1.5">
                  {paymentMethod === "card"
                    ? `Processing fee (est.): ~${formatCents(cardFee)}`
                    : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`}
                </p>
              </div>

              {/* Cover fees checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#4a7c59" }}
                />
                <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                  I agree to pay the processing fee
                </span>
              </label>

              <p className="text-xs text-gray-400 font-body">
                Prefer to pay by check? Email us at{" "}
                <a
                  href="mailto:sabrina@sagefield.co"
                  className="underline hover:text-gray-600 transition-colors"
                >
                  sabrina@sagefield.co
                </a>{" "}
                and we&apos;ll send you instructions.
              </p>

              {/* Total */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "#f6faf7" }}
              >
                <span className="text-sm text-gray-500 font-body">Total</span>
                <span
                  className="text-base font-bold font-heading"
                  style={{ color: "#4a7c59" }}
                >
                  {formatCents(totalWithFees)}
                </span>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-500 font-body">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {(step === "payment" || step === "sibling") && (
            <button
              onClick={() =>
                step === "payment"
                  ? eligibleSiblings.length > 0
                    ? setStep("sibling")
                    : setStep("plan")
                  : setStep("plan")
              }
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={
              step === "plan"
                ? !canContinuePlan
                : step === "sibling"
                  ? false
                  : loading || !coverFees
            }
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#4a7c59" }}
            onClick={
              step === "plan"
                ? () => {
                    if (eligibleSiblings.length > 0) {
                      setStep("sibling");
                    } else {
                      setStep("payment");
                    }
                  }
                : step === "sibling"
                  ? () => setStep("payment")
                  : handlePayNow
            }
          >
            {step === "plan"
              ? unitCount > 0
                ? `Continue · ${formatCents(baseAmountCents)}`
                : "Continue"
              : step === "sibling"
                ? siblingPayloads.length > 0
                  ? `Continue · ${formatCents(combinedIntendedCents)}`
                  : "Continue"
                : loading
                  ? "Processing…"
                  : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function HomeschoolPaymentModal({
  app,
  studentName,
  parentId,
  parentEmail,
  paidData,
  initialNote,
  onClose,
}: {
  app: HomeschoolDropInApp;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidData?: PaidHomeschoolByStudent[string];
  initialNote: string;
  onClose: () => void;
}) {
  const gradeTier = getGradeTier(app.child_grade);

  // weekSelections: week number → set of selected day keys
  const [weekSelections, setWeekSelections] = useState<
    Record<number, Set<string>>
  >({});
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState(initialNote);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaveResult, setNoteSaveResult] = useState<
    "success" | "error" | null
  >(null);

  // Build paid days per week across all prior transactions
  const paidDaysByWeek: Record<number, Set<string>> = {};
  for (const entry of paidData?.summer ?? []) {
    for (const [wk, entryDays] of Object.entries(entry.weekDays)) {
      const w = Number(wk);
      if (!paidDaysByWeek[w]) paidDaysByWeek[w] = new Set();
      entryDays.forEach((d) => paidDaysByWeek[w].add(d));
    }
  }

  const toggleWeekDay = (weekNum: number, dayKey: string) => {
    if (paidDaysByWeek[weekNum]?.has(dayKey)) return;
    setWeekSelections((prev) => {
      const current = new Set(prev[weekNum] ?? []);
      if (current.has(dayKey)) {
        current.delete(dayKey);
      } else if (current.size < 3) {
        current.add(dayKey);
      }
      return { ...prev, [weekNum]: current };
    });
  };

  // Compute total across all weeks
  const baseAmountCents = Object.entries(weekSelections).reduce(
    (sum, [, days]) => {
      if (days.size === 0) return sum;
      return sum + HOMESCHOOL_SUMMER_PRICING[deriveTier(days.size)][gradeTier];
    },
    0,
  );

  // Fee estimates
  const cardFeeRate = 0.029;
  const cardFeeFixed = 30;
  const achFeeRate = 0.008;
  const achFeeCap = 500;
  const cardFee = Math.round(baseAmountCents * cardFeeRate) + cardFeeFixed;
  const achFee = Math.min(Math.round(baseAmountCents * achFeeRate), achFeeCap);
  const feeAmount = paymentMethod === "card" ? cardFee : achFee;
  const totalWithFees = coverFees
    ? baseAmountCents + feeAmount
    : baseAmountCents;

  const canContinuePlan = Object.values(weekSelections).some((d) => d.size > 0);

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    setNoteSaveResult(null);
    try {
      const res = await fetch("/api/billing/save-homeschool-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          studentId: app.student_id,
          applicationId: app.id,
          note: noteText.trim(),
        }),
      });
      const data = await res.json();
      setNoteSaveResult(res.ok ? "success" : "error");
      if (!res.ok) console.error("save homeschool note error:", data.error);
    } catch {
      setNoteSaveResult("error");
    } finally {
      setNoteSaving(false);
    }
  }

  const handlePayNow = async () => {
    setLoading(true);
    setError(null);
    try {
      // Derive a representative tier from the most common day count
      const dayCounts = Object.values(weekSelections)
        .filter((d) => d.size > 0)
        .map((d) => d.size);
      const freq: Record<number, number> = {};
      dayCounts.forEach((c) => {
        freq[c] = (freq[c] ?? 0) + 1;
      });
      const dominantCount =
        dayCounts.sort((a, b) => (freq[b] ?? 0) - (freq[a] ?? 0))[0] ?? 1;
      const dominantTier = deriveTier(dominantCount);

      const selectedWeeksList = Object.entries(weekSelections)
        .filter(([, d]) => d.size > 0)
        .map(([wk]) => Number(wk))
        .sort((a, b) => a - b);

      const allSelectedDays = Array.from(
        new Set(Object.values(weekSelections).flatMap((d) => Array.from(d))),
      );

      const weekSelectionsJson = JSON.stringify(
        selectedWeeksList.map((wk) => ({
          week: wk,
          days: Array.from(weekSelections[wk] ?? []),
        })),
      );

      const res = await fetch("/api/stripe/create-homeschool-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: app.student_id,
          applicationId: app.id,
          program: "summer_26",
          tier: dominantTier,
          gradeTier,
          selectedDays: allSelectedDays,
          selectedWeeks: selectedWeeksList,
          weekSelectionsJson,
          intendedAmountCents: baseAmountCents,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold font-heading text-gray-800">
              Homeschool Drop-In
            </h2>
            {studentName && (
              <p className="text-xs text-gray-400 mt-0.5">{studentName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {step === "plan" ? (
            <>
              {/* Grade tier + program label */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 font-body">
                  {gradeTierLabel(gradeTier)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Summer 2026 · May 26 – Aug 13
                </span>
              </div>

              {/* Flat week list */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  Choose up to 3 days per week
                </p>
                <div className="space-y-2">
                  {SUMMER_WEEKS.map((w) => {
                    const availableDays = WEEKDAYS.filter(
                      (day) => !w.days || w.days.includes(day.key),
                    );
                    const paidDays =
                      paidDaysByWeek[w.week] ?? new Set<string>();
                    const isFullyPaid = availableDays.every((day) =>
                      paidDays.has(day.key),
                    );
                    const days = weekSelections[w.week] ?? new Set<string>();
                    const weekRate =
                      days.size > 0
                        ? HOMESCHOOL_SUMMER_PRICING[deriveTier(days.size)][
                            gradeTier
                          ]
                        : 0;
                    return (
                      <div
                        key={w.week}
                        className={`rounded-xl border px-3 py-2.5 ${
                          isFullyPaid
                            ? "border-gray-100 bg-gray-50 opacity-60"
                            : days.size > 0
                              ? "border-primary bg-primary/5"
                              : "border-gray-100 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1.5 gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-base leading-none mt-0.5 shrink-0">
                              {w.emoji}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-bold ${days.size > 0 && !isFullyPaid ? "text-primary" : "text-gray-400"}`}
                                >
                                  Wk {w.week}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {w.dates}
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-gray-600 leading-tight">
                                {w.theme}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                                {w.highlights.join(" · ")}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isFullyPaid ? (
                              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Paid
                              </span>
                            ) : paidDays.size > 0 ? (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {Array.from(paidDays)
                                  .map(
                                    (d) =>
                                      d.charAt(0).toUpperCase() + d.slice(1),
                                  )
                                  .join(", ")}{" "}
                                paid
                              </span>
                            ) : days.size > 0 ? (
                              <span
                                className="text-xs font-bold"
                                style={{ color: "#4a7c59" }}
                              >
                                {formatCents(weekRate)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-300">
                                —
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {availableDays.map((day) => {
                            const isDayPaid = paidDays.has(day.key);
                            const isSel = days.has(day.key);
                            return (
                              <button
                                key={day.key}
                                onClick={() => toggleWeekDay(w.week, day.key)}
                                disabled={isDayPaid}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isDayPaid
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : isSel
                                      ? "text-white cursor-pointer"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                                }`}
                                style={
                                  isSel && !isDayPaid
                                    ? { backgroundColor: "#4a7c59" }
                                    : {}
                                }
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rate summary */}
              <AnimatePresence>
                {canContinuePlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="rounded-xl px-4 py-3 space-y-1"
                    style={{ backgroundColor: "#f6faf7" }}
                  >
                    {Object.entries(weekSelections)
                      .filter(([, d]) => d.size > 0)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([wk, d]) => {
                        const wkNum = Number(wk);
                        const rate =
                          HOMESCHOOL_SUMMER_PRICING[deriveTier(d.size)][
                            gradeTier
                          ];
                        const dayLabels = WEEKDAYS.filter((day) =>
                          d.has(day.key),
                        )
                          .map((day) => day.label)
                          .join(", ");
                        return (
                          <div
                            key={wk}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs text-gray-400 font-body">
                              Wk {wkNum} · {dayLabels}
                            </span>
                            <span className="text-xs font-semibold text-gray-600">
                              {formatCents(rate)}
                            </span>
                          </div>
                        );
                      })}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-1">
                      <span className="text-sm text-gray-500 font-body">
                        Total
                      </span>
                      <span
                        className="text-base font-bold font-heading"
                        style={{ color: "#4a7c59" }}
                      >
                        {formatCents(baseAmountCents)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes / Commitment section */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 font-heading mb-1">
                  Planning to add more days later?
                </p>
                <p className="text-xs text-gray-400 font-body mb-3">
                  Leave a note letting us know which days you&apos;re planning
                  to commit to — we&apos;ll hold your spot.
                </p>
                <textarea
                  value={noteText}
                  onChange={(e) => {
                    setNoteText(e.target.value);
                    setNoteSaveResult(null);
                  }}
                  rows={3}
                  maxLength={2000}
                  placeholder="e.g. I plan to add Tuesdays in weeks 7–9…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 font-body placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs">
                    {noteSaveResult === "success" && (
                      <span className="text-emerald-600 font-body">
                        Note saved.
                      </span>
                    )}
                    {noteSaveResult === "error" && (
                      <span className="text-red-500 font-body">
                        Couldn&apos;t save — please try again.
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={noteSaving || !noteText.trim()}
                    onClick={handleSaveNote}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#4a7c59" }}
                  >
                    {noteSaving ? "Saving…" : "Save Note"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Payment method step */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  Payment method
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("ach")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                      paymentMethod === "ach"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    ACH / US bank account
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-body mt-1.5">
                  {paymentMethod === "card"
                    ? `Processing fee (est.): ~${formatCents(cardFee)}`
                    : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`}
                </p>
              </div>

              {/* Cover fees checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#4a7c59" }}
                />
                <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                  I agree to pay the processing fee
                </span>
              </label>

              <p className="text-xs text-gray-400 font-body">
                Prefer to pay by check? Email us at{" "}
                <a
                  href="mailto:sabrina@sagefield.co"
                  className="underline hover:text-gray-600 transition-colors"
                >
                  sabrina@sagefield.co
                </a>{" "}
                and we&apos;ll send you instructions.
              </p>

              {/* Total */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "#f6faf7" }}
              >
                <span className="text-sm text-gray-500 font-body">Total</span>
                <span
                  className="text-base font-bold font-heading"
                  style={{ color: "#4a7c59" }}
                >
                  {formatCents(totalWithFees)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-500 font-body">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("plan")}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={
              step === "plan" ? !canContinuePlan : loading || !coverFees
            }
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#4a7c59" }}
            onClick={() => {
              if (step === "plan") setStep("payment");
              else handlePayNow();
            }}
          >
            {step === "plan"
              ? "Continue"
              : loading
                ? "Processing…"
                : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SupplyFeeSiblingModal({
  primaryStudentName,
  primaryGrade,
  siblings,
  onClose,
  onContinue,
}: {
  primaryStudentId: string;
  primaryStudentName: string | null;
  primaryGrade: string | null;
  primaryProgramType: "school_year" | "homeschool" | null;
  siblings: Array<{
    studentId: string;
    studentName: string | null;
    childGrade: string | null;
    programType: "school_year" | "homeschool" | null;
  }>;
  onClose: () => void;
  onContinue: (selectedSiblingIds: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(siblings.map((s) => s.studentId)),
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalChildren = 1 + selectedIds.size;
  const totalCents = 30000 * totalChildren;

  const gradeLabel = (grade: string | null) => {
    if (!grade) return null;
    const g = grade.trim();
    const lower = g.toLowerCase();
    if (lower === "k" || lower === "kindergarten") return "Kindergarten";
    if (lower === "pre-k" || lower === "prek" || lower === "pre k")
      return "Pre-K";
    return g.match(/^\d+$/) ? `${g}th grade` : g;
  };

  const primaryFirstName = primaryStudentName
    ? primaryStudentName.trim().split(/\s+/)[0]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold font-heading text-gray-800">
              Add siblings to this payment?
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pay for all children in one transaction and save on processing
              fees.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
          {/* Primary child — always included, shown as reference */}
          <div className="rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ backgroundColor: "#4a7c59" }}
              >
                <svg
                  className="w-2.5 h-2.5 text-white"
                  viewBox="0 0 10 8"
                  fill="none"
                >
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {primaryFirstName ?? "Child"}
                {primaryGrade && (
                  <span className="text-gray-400 font-normal">
                    {" "}
                    · {gradeLabel(primaryGrade)}
                  </span>
                )}
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#4a7c59" }}>
              $300.00
            </span>
          </div>

          {siblings.map((sib) => {
            const firstName = sib.studentName
              ? sib.studentName.trim().split(/\s+/)[0]
              : "Child";
            const checked = selectedIds.has(sib.studentId);
            return (
              <label
                key={sib.studentId}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(sib.studentId)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#4a7c59" }}
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    {firstName}
                    {sib.childGrade && (
                      <span className="text-gray-400 font-normal">
                        {" "}
                        · {gradeLabel(sib.childGrade)}
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#4a7c59" }}
                >
                  $300.00
                </span>
              </label>
            );
          })}

          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: "#f6faf7" }}
          >
            <span className="text-sm text-gray-500 font-body">
              Total · {totalChildren}{" "}
              {totalChildren === 1 ? "child" : "children"}
            </span>
            <span
              className="text-base font-bold font-heading"
              style={{ color: "#4a7c59" }}
            >
              {formatCents(totalCents)}
            </span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => onContinue(Array.from(selectedIds))}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
            style={{ backgroundColor: "#4a7c59" }}
          >
            Continue →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SupplyFeeModal({
  studentId,
  studentName,
  parentId,
  parentEmail,
  onClose,
  programType,
  childGrade,
  paidSchoolYearMonths,
  siblingStudents,
  applicationId,
  paidHomeschoolByStudent = {},
}: {
  studentId: string;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  onClose: () => void;
  programType: "school_year" | "homeschool" | null;
  childGrade: string | null;
  paidSchoolYearMonths: number[];
  siblingStudents?: Array<{
    studentId: string;
    studentName: string | null;
    childGrade: string | null;
    programType: "school_year" | "homeschool" | null;
    paidSchoolYearMonths: number[];
    applicationId?: string;
  }>;
  applicationId?: string;
  paidHomeschoolByStudent?: PaidHomeschoolByStudent;
}) {
  const hasSiblings = siblingStudents && siblingStudents.length > 0;
  const allStudents = hasSiblings
    ? [
        {
          studentId,
          studentName,
          childGrade,
          programType,
          paidSchoolYearMonths,
          applicationId,
        },
        ...siblingStudents!,
      ]
    : null;

  const hasPaidHomeschoolMonth = (sid: string, monthIndex: number) =>
    (paidHomeschoolByStudent[sid]?.schoolYear ?? []).some((e) =>
      e.weeks.includes(monthIndex),
    );

  // Multi-child: track selected bundle per-student
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedHomeschoolBundleIds, setSelectedHomeschoolBundleIds] =
    useState<Set<string>>(() => new Set());
  const [homeschoolPlanConfigured, setHomeschoolPlanConfigured] =
    useState(false);
  // Single-child legacy
  const primaryGradeTier = getGradeTier(childGrade);
  const primaryBundleTuitionCents =
    primaryGradeTier === "primary" ? 119500 : 109500;
  const primaryShowUpsell =
    programType === "school_year"
      ? !paidSchoolYearMonths.includes(BUNDLE_MONTH_INDEX)
      : programType === "homeschool";
  const [addBundle, setAddBundle] = useState(false);

  // Drop-in plan step state (homeschool only)
  const [step, setStep] = useState<"payment" | "dropin-plan">("payment");
  const [selectedTier, setSelectedTier] = useState<HomeschoolTier | null>(null);
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<Set<number>>(
    new Set(),
  );
  const [dropinSelectedDates, setDropinSelectedDates] = useState<Set<number>>(
    new Set(),
  );
  const [dropinExpandedMonths, setDropinExpandedMonths] = useState<Set<number>>(
    new Set([1]),
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(new Set());

  const homeschoolGradeTier = getGradeTier(childGrade);
  const dropinPricePerDay = selectedTier
    ? HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][homeschoolGradeTier]
    : 0;
  const dropinUnitCount = selectedMonthIndices.size;
  const homeschoolBundleCents =
    addBundle && programType === "homeschool"
      ? dropinPricePerDay * dropinUnitCount
      : 0;
  const requiredDays = selectedTier === "dropin" ? 1 : selectedTier === "2day" ? 2 : 3;
  const canContinueDropin =
    selectedTier !== null &&
    dropinUnitCount >= 1 &&
    selectedWeekdays.size === requiredDays;

  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStudentBundleCents = (
    grade: string | null,
    prog: "school_year" | "homeschool" | null,
  ) => {
    if (prog !== "school_year") return 0;
    return getGradeTier(grade) === "primary" ? 119500 : 109500;
  };

  const getHomeschoolBundleCents = (grade: string | null) => {
    if (!selectedTier || dropinUnitCount < 1) return 0;
    return (
      HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][getGradeTier(grade)] *
      dropinUnitCount
    );
  };

  const buildHomeschoolWeekSelectionsJson = () => {
    const selectedItems = Array.from(selectedMonthIndices).sort(
      (a, b) => a - b,
    );
    const weekdayArray = Array.from(selectedWeekdays);
    return JSON.stringify(
      selectedItems.map((w) => ({ week: w, days: weekdayArray })),
    );
  };

  let BASE_CENTS: number;
  if (hasSiblings && allStudents) {
    const supplyTotal = SUPPLY_FEE_CENTS * allStudents.length;
    const schoolYearBundleTotal = allStudents
      .filter((s) => selectedBundleIds.has(s.studentId))
      .reduce(
        (sum, s) => sum + getStudentBundleCents(s.childGrade, s.programType),
        0,
      );
    const homeschoolBundleTotal = allStudents
      .filter((s) => selectedHomeschoolBundleIds.has(s.studentId))
      .reduce((sum, s) => sum + getHomeschoolBundleCents(s.childGrade), 0);
    BASE_CENTS = supplyTotal + schoolYearBundleTotal + homeschoolBundleTotal;
  } else {
    const bundleAmountCents =
      programType === "school_year"
        ? primaryBundleTuitionCents
        : homeschoolBundleCents;
    BASE_CENTS = SUPPLY_FEE_CENTS + (addBundle ? bundleAmountCents : 0);
  }

  const cardFee = Math.round((BASE_CENTS + 30) / (1 - 0.029)) - BASE_CENTS;
  const achFee = Math.min(Math.round(BASE_CENTS * 0.008), 500);
  const feeAmount = paymentMethod === "card" ? cardFee : achFee;
  const totalWithFees = coverFees ? BASE_CENTS + feeAmount : BASE_CENTS;

  const handlePayNow = async () => {
    if (
      !hasSiblings &&
      addBundle &&
      programType === "homeschool" &&
      dropinUnitCount < 1
    )
      return;
    if (hasSiblings && allStudents) {
      const anyHomeschoolBundle = allStudents.some(
        (s) =>
          s.programType === "homeschool" &&
          selectedHomeschoolBundleIds.has(s.studentId),
      );
      if (
        anyHomeschoolBundle &&
        (!homeschoolPlanConfigured ||
          !selectedTier ||
          dropinUnitCount < 1 ||
          selectedWeekdays.size !== requiredDays)
      )
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        parentId,
        parentEmail,
        studentId,
        coverFees,
        paymentMethod,
      };

      if (hasSiblings && allStudents) {
        const primarySchoolYearBundle =
          selectedBundleIds.has(studentId) && programType === "school_year";
        if (primarySchoolYearBundle) {
          body.bundleType = "school_year_tuition";
          body.bundleAmountCents = getStudentBundleCents(
            childGrade,
            programType,
          );
          body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
        }

        const primaryHomeschoolBundle =
          selectedHomeschoolBundleIds.has(studentId) &&
          programType === "homeschool";
        const hsSiblingBundles = siblingStudents!.filter(
          (s) =>
            s.programType === "homeschool" &&
            selectedHomeschoolBundleIds.has(s.studentId),
        );
        const anyHomeschoolBundle =
          primaryHomeschoolBundle || hsSiblingBundles.length > 0;

        if (anyHomeschoolBundle && selectedTier) {
          const selectedItems = Array.from(selectedMonthIndices).sort(
            (a, b) => a - b,
          );
          const weekdayArray = Array.from(selectedWeekdays);
          body.bundleHomeschoolTier = selectedTier;
          body.bundleHomeschoolSelectedDays = selectedItems;
          body.bundleHomeschoolWeekSelectionsJson =
            buildHomeschoolWeekSelectionsJson();
          if (selectedTier === "dropin" && weekdayArray.length > 0) {
            body.bundleHomeschoolDropinWeekday = weekdayArray[0];
          }
          if (primaryHomeschoolBundle) {
            body.bundleType = "homeschool";
            body.bundleAmountCents = getHomeschoolBundleCents(childGrade);
            body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
            body.bundleHomeschoolGradeTier = homeschoolGradeTier;
            body.bundleHomeschoolApplicationId = applicationId;
          }
          if (hsSiblingBundles.length > 0) {
            body.siblingHomeschoolBundleStudentIds = hsSiblingBundles.map(
              (s) => s.studentId,
            );
            body.siblingHomeschoolBundleAmounts = hsSiblingBundles.map((s) =>
              getHomeschoolBundleCents(s.childGrade),
            );
            body.siblingHomeschoolApplicationIds = hsSiblingBundles.map(
              (s) => s.applicationId ?? "",
            );
            body.siblingHomeschoolGradeTiers = hsSiblingBundles.map((s) =>
              getGradeTier(s.childGrade),
            );
          }
        }

        const sibs = siblingStudents!;
        body.siblingStudentIds = sibs.map((s) => s.studentId);
        body.siblingBundleStudentIds = sibs
          .filter((s) => selectedBundleIds.has(s.studentId))
          .map((s) => s.studentId);
        body.siblingGrades = sibs.map((s) => s.childGrade ?? "");
        body.siblingBundleAmounts = sibs
          .filter((s) => selectedBundleIds.has(s.studentId))
          .map((s) => getStudentBundleCents(s.childGrade, s.programType));
      } else {
        if (addBundle && programType) {
          if (programType === "school_year") {
            body.bundleType = "school_year_tuition";
            body.bundleAmountCents = primaryBundleTuitionCents;
            body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
          } else {
            // homeschool drop-in bundle
            body.bundleType = "homeschool";
            body.bundleAmountCents = homeschoolBundleCents;
            body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
            body.bundleHomeschoolTier = selectedTier;
            body.bundleHomeschoolGradeTier = homeschoolGradeTier;
            body.bundleHomeschoolApplicationId = applicationId;
            const selectedItems = Array.from(selectedMonthIndices).sort((a, b) => a - b);
            body.bundleHomeschoolSelectedDays = selectedItems;
            const weekdayArray = Array.from(selectedWeekdays);
            if (selectedTier === "dropin" && weekdayArray.length > 0) {
              body.bundleHomeschoolDropinWeekday = weekdayArray[0];
            }
            body.bundleHomeschoolWeekSelectionsJson = JSON.stringify(
              selectedItems.map((w) => ({
                week: w,
                days: weekdayArray,
              })),
            );
          }
        }
      }

      const res = await fetch("/api/stripe/create-supply-fee-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.url)
        throw new Error(data.error ?? "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const childNames =
    hasSiblings && allStudents
      ? allStudents
          .map((s) =>
            s.studentName ? s.studentName.trim().split(/\s+/)[0] : "Child",
          )
          .join(", ")
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold font-heading text-gray-800">
              {step === "dropin-plan"
                ? "Set up Drop-In · School Year 26–27"
                : "Annual Supply Fee"}
            </h2>
            {hasSiblings ? (
              <p className="text-xs text-gray-400 mt-0.5">{childNames}</p>
            ) : (
              studentName && (
                <p className="text-xs text-gray-400 mt-0.5">{studentName}</p>
              )
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {step === "dropin-plan" ? (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Grade tier + context */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 font-body">
                  {gradeTierLabel(homeschoolGradeTier)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  School Year 26–27 · Aug 2026–May 2027
                </span>
              </div>

              {/* Tier selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    1
                  </span>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Choose your schedule
                  </p>
                </div>
                <div className="space-y-2">
                  {HOMESCHOOL_TIERS.map((tier) => {
                    const price =
                      HOMESCHOOL_SCHOOL_YEAR_PRICING[tier.key][
                        homeschoolGradeTier
                      ];
                    const isSelected = selectedTier === tier.key;
                    const unitSuffix = "/mo";
                    return (
                      <button
                        key={tier.key}
                        onClick={() => {
                          setSelectedTier(tier.key);
                          setSelectedMonthIndices(new Set());
                          setDropinSelectedDates(new Set());
                          setDropinExpandedMonths(new Set([1]));
                          setSelectedWeekdays(new Set());
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-gray-800"}`}
                            >
                              {tier.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {tier.sub}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-bold ${isSelected ? "text-primary" : "text-gray-700"}`}
                            >
                              {formatCents(price)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {unitSuffix}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekday selector — all tiers */}
              {selectedTier !== null && (
                <div className="pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      2
                    </span>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Choose your{" "}
                      {requiredDays === 1 ? "1 day" : requiredDays === 2 ? "2 days" : "3 days"}{" "}
                      (Mon–Thu)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {WEEKDAYS.map(({ key, label }) => {
                      const isChosen = selectedWeekdays.has(key);
                      const atLimit = selectedWeekdays.size === requiredDays && !isChosen;
                      return (
                        <button
                          key={key}
                          disabled={atLimit}
                          onClick={() =>
                            setSelectedWeekdays((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              return next;
                            })
                          }
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                            isChosen
                              ? "text-white border-transparent"
                              : atLimit
                                ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                          }`}
                          style={isChosen ? { backgroundColor: "#4a7c59", borderColor: "#4a7c59" } : undefined}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedWeekdays.size > 0 && selectedWeekdays.size < requiredDays && (
                    <p className="text-xs text-gray-400 mt-2">
                      Select {requiredDays - selectedWeekdays.size} more day
                      {requiredDays - selectedWeekdays.size !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Month grid — all tiers */}
              {selectedTier !== null && (
                <div className="pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      3
                    </span>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Select months to pay
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {SCHOOL_YEAR_MONTHS.map((month) => {
                      const isSelected = selectedMonthIndices.has(month.index);
                      return (
                        <button
                          key={month.index}
                          onClick={() => {
                            setSelectedMonthIndices((prev) => {
                              const next = new Set(prev);
                              if (next.has(month.index)) next.delete(month.index);
                              else next.add(month.index);
                              return next;
                            });
                          }}
                          title={month.label}
                          className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? "border-2 border-primary text-white"
                              : "border border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                          }`}
                          style={isSelected ? { backgroundColor: "#4a7c59" } : undefined}
                        >
                          {month.short}
                        </button>
                      );
                    })}
                  </div>
                  {selectedMonthIndices.size > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedMonthIndices.size} month{selectedMonthIndices.size !== 1 ? "s" : ""} ·{" "}
                      <span className="font-bold" style={{ color: "#4a7c59" }}>
                        {formatCents(homeschoolBundleCents)}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    Need a different number of days for a specific week?{" "}
                    <a
                      href="mailto:sabrina@sagefield.co"
                      className="text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Email us
                    </a>{" "}
                    and we&apos;ll get it sorted.
                  </p>
                </div>
              )}
            </div>
            {error && (
              <div className="px-6 pb-2">
                <p className="text-xs text-red-500 font-body">{error}</p>
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  if (hasSiblings) {
                    setHomeschoolPlanConfigured(false);
                    setSelectedHomeschoolBundleIds(new Set());
                  } else {
                    setAddBundle(false);
                  }
                  setSelectedTier(null);
                  setSelectedMonthIndices(new Set());
                  setDropinSelectedDates(new Set());
                  setStep("payment");
                }}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!canContinueDropin}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#4a7c59" }}
                onClick={() => {
                  setHomeschoolPlanConfigured(true);
                  setStep("payment");
                }}
              >
                Continue →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    Annual Supply Fee
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#4a7c59" }}
                  >
                    {hasSiblings && allStudents
                      ? `${formatCents(SUPPLY_FEE_CENTS * allStudents.length)} · ${allStudents.length} children`
                      : "$300.00"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  One-time fee · School Year 26–27
                </p>
              </div>

              {hasSiblings && allStudents
                ? (() => {
                    const bundlableSchoolYearStudents = allStudents.filter(
                      (s) =>
                        s.programType === "school_year" &&
                        !s.paidSchoolYearMonths.includes(BUNDLE_MONTH_INDEX),
                    );
                    const bundlableHomeschoolStudents = allStudents.filter(
                      (s) =>
                        s.programType === "homeschool" &&
                        !hasPaidHomeschoolMonth(s.studentId, BUNDLE_MONTH_INDEX),
                    );
                    return (
                      <>
                        {bundlableSchoolYearStudents.length > 0 && (
                          <div
                            className="rounded-xl border border-gray-200 px-4 py-4 space-y-3"
                            style={{ backgroundColor: "#f6faf7" }}
                          >
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-0.5">
                                Bundle &amp; save on processing fees
                              </p>
                              <p className="text-xs text-gray-500 font-body">
                                Add August 2026 tuition for any child — one
                                checkout, one processing fee.
                              </p>
                            </div>
                            {bundlableSchoolYearStudents.map((s) => {
                              const firstName = s.studentName
                                ? s.studentName.trim().split(/\s+/)[0]
                                : "Child";
                              const amt = getStudentBundleCents(
                                s.childGrade,
                                s.programType,
                              );
                              const checked = selectedBundleIds.has(
                                s.studentId,
                              );
                              return (
                                <label
                                  key={s.studentId}
                                  className="flex items-start gap-3 cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setSelectedBundleIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(s.studentId))
                                          next.delete(s.studentId);
                                        else next.add(s.studentId);
                                        return next;
                                      });
                                    }}
                                    className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                                    style={{ accentColor: "#4a7c59" }}
                                  />
                                  <span className="text-sm text-gray-700 font-body group-hover:text-gray-900 transition-colors">
                                    Add August 2026 tuition for {firstName}
                                    {s.childGrade
                                      ? ` · ${s.childGrade}`
                                      : ""}{" "}
                                    · {formatCents(amt)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {bundlableHomeschoolStudents.length > 0 && (
                          <div
                            className="rounded-xl border border-gray-200 px-4 py-4 space-y-3"
                            style={{ backgroundColor: "#f6faf7" }}
                          >
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-0.5">
                                Bundle Homeschool Drop-In
                              </p>
                              <p className="text-xs text-gray-500 font-body">
                                Add the first month of Drop-In for any child —
                                one checkout, one processing fee. Same schedule
                                for all bundled children.
                              </p>
                            </div>
                            {!homeschoolPlanConfigured ? (
                              <button
                                type="button"
                                onClick={() => setStep("dropin-plan")}
                                className="text-sm font-semibold underline cursor-pointer"
                                style={{ color: "#4a7c59" }}
                              >
                                Set up Drop-In plan →
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setStep("dropin-plan")}
                                className="text-xs font-semibold underline cursor-pointer"
                                style={{ color: "#4a7c59" }}
                              >
                                Edit Drop-In plan
                              </button>
                            )}
                            {homeschoolPlanConfigured &&
                              bundlableHomeschoolStudents.map((s) => {
                                const firstName = s.studentName
                                  ? s.studentName.trim().split(/\s+/)[0]
                                  : "Child";
                                const amt = getHomeschoolBundleCents(
                                  s.childGrade,
                                );
                                const checked = selectedHomeschoolBundleIds.has(
                                  s.studentId,
                                );
                                return (
                                  <label
                                    key={s.studentId}
                                    className="flex items-start gap-3 cursor-pointer group"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setSelectedHomeschoolBundleIds(
                                          (prev) => {
                                            const next = new Set(prev);
                                            if (next.has(s.studentId))
                                              next.delete(s.studentId);
                                            else next.add(s.studentId);
                                            return next;
                                          },
                                        );
                                      }}
                                      className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                                      style={{ accentColor: "#4a7c59" }}
                                    />
                                    <span className="text-sm text-gray-700 font-body group-hover:text-gray-900 transition-colors">
                                      Add first month Drop-In for {firstName}
                                      {s.childGrade
                                        ? ` · ${s.childGrade}`
                                        : ""}{" "}
                                      · {formatCents(amt)}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        )}
                      </>
                    );
                  })()
                : primaryShowUpsell && (
                    <div
                      className="rounded-xl border border-gray-200 px-4 py-4 space-y-3"
                      style={{ backgroundColor: "#f6faf7" }}
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">
                          Bundle &amp; save on processing fees
                        </p>
                        <p className="text-xs text-gray-500 font-body">
                          {programType === "school_year"
                            ? `Add August tuition (${formatCents(primaryBundleTuitionCents)}) to this payment — one Stripe checkout, one processing fee.`
                            : "Add your first month of Homeschool Drop-In to this payment — one Stripe checkout, one processing fee."}
                        </p>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={addBundle}
                          onChange={(e) => {
                            setAddBundle(e.target.checked);
                            if (
                              e.target.checked &&
                              programType === "homeschool"
                            ) {
                              setStep("dropin-plan");
                            }
                            if (!e.target.checked) {
                              setStep("payment");
                              setSelectedTier(null);
                              setSelectedMonthIndices(new Set());
                              setDropinSelectedDates(new Set());
                            }
                          }}
                          className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                          style={{ accentColor: "#4a7c59" }}
                        />
                        <span className="text-sm text-gray-700 font-body group-hover:text-gray-900 transition-colors">
                          {programType === "school_year"
                            ? `Add August 2026 tuition · ${formatCents(primaryBundleTuitionCents)}`
                            : addBundle && selectedTier
                              ? `Drop-In · August 2026 · ${formatCents(homeschoolBundleCents)}`
                              : "Set up first month of Drop-In"}
                        </span>
                      </label>
                      {addBundle &&
                        selectedTier &&
                        programType === "homeschool" && (
                          <button
                            onClick={() => setStep("dropin-plan")}
                            className="text-xs font-semibold underline cursor-pointer"
                            style={{ color: "#4a7c59" }}
                          >
                            Edit selection
                          </button>
                        )}
                    </div>
                  )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  Payment method
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${paymentMethod === "card" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("ach")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${paymentMethod === "ach" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    ACH / US bank account
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-body mt-1.5">
                  {paymentMethod === "card"
                    ? `Processing fee (est.): ~${formatCents(cardFee)}`
                    : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`}
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#4a7c59" }}
                />
                <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                  I agree to pay the processing fee
                </span>
              </label>
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "#f6faf7" }}
              >
                <span className="text-sm text-gray-500 font-body">Total</span>
                <span
                  className="text-base font-bold font-heading"
                  style={{ color: "#4a7c59" }}
                >
                  {formatCents(totalWithFees)}
                </span>
              </div>
            </div>
            {error && (
              <div className="px-6 pb-2">
                <p className="text-xs text-red-500 font-body">{error}</p>
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                disabled={
                  loading ||
                  !coverFees ||
                  (addBundle &&
                    programType === "homeschool" &&
                    dropinUnitCount < 1)
                }
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#4a7c59" }}
                onClick={handlePayNow}
              >
                {loading
                  ? "Processing…"
                  : `Pay Now · ${formatCents(totalWithFees)}`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function SchoolYearTuitionModal({
  studentId,
  studentName,
  childGrade,
  parentId,
  parentEmail,
  onClose,
  paidMonthIndices,
  siblingStudents = [],
  siblingPaidSchoolYear = {},
  siblingStudentMap = {},
}: {
  studentId: string;
  studentName: string | null;
  childGrade: string | null;
  parentId: string;
  parentEmail: string;
  onClose: () => void;
  paidMonthIndices: Set<number>;
  siblingStudents?: Array<{ student_id: string; child_grade: string | null }>;
  siblingPaidSchoolYear?: PaidSchoolYearByStudent;
  siblingStudentMap?: Record<string, StudentInfo>;
}) {
  const gradeTier = getGradeTier(childGrade);
  const BASE_CENTS = gradeTier === "primary" ? 119500 : 109500;
  const [step, setStep] = useState<"plan" | "sibling" | "payment">("plan");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<Set<number>>(
    new Set(),
  );
  const [includedSiblings, setIncludedSiblings] = useState<
    Record<string, boolean>
  >({});
  const [siblingMonthOverrides, setSiblingMonthOverrides] = useState<
    Record<string, Set<number>>
  >({});
  const [siblingEditorOpen, setSiblingEditorOpen] = useState<
    Record<string, boolean>
  >({});
  const [siblingEditorDirty, setSiblingEditorDirty] = useState<
    Record<string, boolean>
  >({});

  const unitCount = selectedMonthIndices.size;
  const totalBaseCents = BASE_CENTS * unitCount;

  const getSiblingPaidMonths = (sibStudentId: string) =>
    new Set(siblingPaidSchoolYear[sibStudentId] ?? []);

  const eligibleSiblings = siblingStudents.filter((sib) => {
    const paidMonths = getSiblingPaidMonths(sib.student_id);
    return Array.from(selectedMonthIndices).some((m) => !paidMonths.has(m));
  });

  useEffect(() => {
    setIncludedSiblings((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [s.student_id, prev[s.student_id] ?? true]),
      ),
    );
    setSiblingEditorDirty((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [
          s.student_id,
          prev[s.student_id] ?? false,
        ]),
      ),
    );
    setSiblingMonthOverrides((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => {
          if (siblingEditorDirty[s.student_id])
            return [s.student_id, prev[s.student_id] ?? new Set()];
          const paidMonths = getSiblingPaidMonths(s.student_id);
          const defaultMonths = Array.from(selectedMonthIndices).filter(
            (m) => !paidMonths.has(m),
          );
          return [s.student_id, new Set(defaultMonths)];
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eligibleSiblings.map((s) => s.student_id).join(","),
    Array.from(selectedMonthIndices)
      .sort((a, b) => a - b)
      .join(","),
  ]);

  function toggleSiblingMonth(sibStudentId: string, monthIndex: number) {
    const paidMonths = getSiblingPaidMonths(sibStudentId);
    if (paidMonths.has(monthIndex)) return;
    setSiblingEditorDirty((prev) => ({ ...prev, [sibStudentId]: true }));
    setSiblingMonthOverrides((prev) => {
      const next = new Set(prev[sibStudentId] ?? []);
      if (next.has(monthIndex)) next.delete(monthIndex);
      else next.add(monthIndex);
      return { ...prev, [sibStudentId]: next };
    });
  }

  const siblingPayloads = eligibleSiblings
    .filter((sib) => includedSiblings[sib.student_id])
    .map((sib) => {
      const sibGradeTier = getGradeTier(sib.child_grade);
      const sibBaseCents =
        sibGradeTier === "primary" ? 119500 : 109500;
      const paidMonths = getSiblingPaidMonths(sib.student_id);
      const override = siblingMonthOverrides[sib.student_id];
      const sibMonths = override
        ? Array.from(override)
            .filter((m) => !paidMonths.has(m))
            .sort((a, b) => a - b)
        : Array.from(selectedMonthIndices)
            .filter((m) => !paidMonths.has(m))
            .sort((a, b) => a - b);
      return {
        studentId: sib.student_id,
        gradeTier: sibGradeTier,
        selectedMonths: sibMonths,
        intendedAmountCents: sibBaseCents * sibMonths.length,
        studentName: siblingStudentMap[sib.student_id]?.name,
      };
    });

  const siblingTotal = siblingPayloads.reduce(
    (sum, sib) => sum + sib.intendedAmountCents,
    0,
  );
  const combinedIntendedCents = totalBaseCents + siblingTotal;

  const cardFee =
    unitCount > 0
      ? Math.round((combinedIntendedCents + 30) / (1 - 0.029)) -
        combinedIntendedCents
      : 0;
  const achFee =
    unitCount > 0
      ? Math.min(Math.round(combinedIntendedCents * 0.008), 500)
      : 0;
  const feeAmount = paymentMethod === "card" ? cardFee : achFee;
  const totalWithFees = coverFees
    ? combinedIntendedCents + feeAmount
    : combinedIntendedCents;

  const handlePayNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/stripe/create-school-year-tuition-checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId,
            parentEmail,
            studentId,
            intendedAmountCents: totalBaseCents,
            coverFees,
            paymentMethod,
            selectedMonths: Array.from(selectedMonthIndices).sort(
              (a, b) => a - b,
            ),
            siblings: siblingPayloads,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.url)
        throw new Error(data.error ?? "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold font-heading text-gray-800">
              School Year Tuition
            </h2>
            {studentName && (
              <p className="text-xs text-gray-400 mt-0.5">{studentName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "plan" ? (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                    Select months to pay · {formatCents(BASE_CENTS)}/mo
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {SCHOOL_YEAR_MONTHS.map((month) => {
                      const isPaid = paidMonthIndices.has(month.index);
                      const isSelected = selectedMonthIndices.has(month.index);
                      return (
                        <button
                          key={month.index}
                          disabled={isPaid}
                          onClick={() => {
                            if (isPaid) return;
                            setSelectedMonthIndices((prev) => {
                              const next = new Set(prev);
                              if (next.has(month.index)) next.delete(month.index);
                              else next.add(month.index);
                              return next;
                            });
                          }}
                          className={`relative rounded-lg py-2 text-xs font-semibold border transition-all cursor-pointer ${
                            isPaid
                              ? "border-green-200 bg-green-50 text-green-700 cursor-default opacity-70"
                              : isSelected
                                ? "text-white border-transparent"
                                : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white"
                          }`}
                          style={
                            isSelected && !isPaid
                              ? {
                                  backgroundColor: "#4a7c59",
                                  borderColor: "#4a7c59",
                                }
                              : undefined
                          }
                        >
                          {month.short}
                          {isPaid && (
                            <span className="block text-[9px] font-semibold text-green-600 leading-none mt-0.5">
                              Paid
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : step === "sibling" ? (
              <motion.div
                key="sibling"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-4"
              >
                <div>
                  <p className="text-base font-bold font-heading text-gray-800 mb-1">
                    Add a sibling to this payment?
                  </p>
                  <p className="text-sm text-gray-500 font-body">
                    Pay for both children in one transaction and save the extra
                    processing fee.
                  </p>
                </div>
                <div className="space-y-3">
                  {eligibleSiblings.map((sib) => {
                    const sibGradeTier = getGradeTier(sib.child_grade);
                    const sibBaseCents =
                      sibGradeTier === "primary" ? 119500 : 109500;
                    const paidMonths = getSiblingPaidMonths(sib.student_id);
                    const override = siblingMonthOverrides[sib.student_id];
                    const sibMonths = override
                      ? Array.from(override)
                          .filter((m) => !paidMonths.has(m))
                          .sort((a, b) => a - b)
                      : Array.from(selectedMonthIndices)
                          .filter((m) => !paidMonths.has(m))
                          .sort((a, b) => a - b);
                    const sibAmount = sibBaseCents * sibMonths.length;
                    const sibName =
                      siblingStudentMap[sib.student_id]?.name ?? "Sibling";
                    const isIncluded = includedSiblings[sib.student_id] ?? true;
                    const isEditorOpen =
                      siblingEditorOpen[sib.student_id] ?? false;

                    return (
                      <div
                        key={sib.student_id}
                        className={`w-full rounded-xl border transition-colors ${
                          isIncluded
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIncludedSiblings((prev) => ({
                              ...prev,
                              [sib.student_id]: !prev[sib.student_id],
                            }));
                            setSiblingEditorOpen((prev) => ({
                              ...prev,
                              [sib.student_id]: false,
                            }));
                          }}
                          className="w-full flex items-start gap-3 p-4 text-left cursor-pointer"
                        >
                          <span
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isIncluded
                                ? "border-emerald-600 bg-emerald-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isIncluded && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800 font-heading">
                                {sibName}
                              </span>
                              <span
                                className="text-sm font-bold font-heading"
                                style={{
                                  color: sibAmount > 0 ? "#4a7c59" : "#9ca3af",
                                }}
                              >
                                {sibAmount > 0
                                  ? formatCents(sibAmount)
                                  : "—"}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-body mt-0.5 block">
                              {sibMonths.length === 0
                                ? "No months selected"
                                : `${sibMonths.length} mo. · ${sibMonths
                                    .map(
                                      (m) =>
                                        SCHOOL_YEAR_MONTHS.find(
                                          (sm) => sm.index === m,
                                        )?.short ?? m,
                                    )
                                    .join(", ")}`}
                            </span>
                          </div>
                        </button>
                        {isIncluded && (
                          <div className="px-4 pb-4">
                            {!isEditorOpen ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSiblingEditorOpen((prev) => ({
                                    ...prev,
                                    [sib.student_id]: true,
                                  }))
                                }
                                className="text-xs font-semibold underline-offset-2 hover:underline cursor-pointer transition-colors"
                                style={{ color: "#4a7c59" }}
                              >
                                Edit months
                              </button>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-500 font-body">
                                    Months for {sibName}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSiblingEditorOpen((prev) => ({
                                        ...prev,
                                        [sib.student_id]: false,
                                      }))
                                    }
                                    className="text-xs font-semibold cursor-pointer transition-colors"
                                    style={{ color: "#4a7c59" }}
                                  >
                                    Done
                                  </button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {SCHOOL_YEAR_MONTHS.map((month) => {
                                    const isPaid = paidMonths.has(month.index);
                                    const isSelected =
                                      isPaid ||
                                      (override
                                        ? override.has(month.index)
                                        : sibMonths.includes(month.index));
                                    return (
                                      <button
                                        key={month.index}
                                        type="button"
                                        disabled={isPaid}
                                        onClick={() =>
                                          toggleSiblingMonth(
                                            sib.student_id,
                                            month.index,
                                          )
                                        }
                                        className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                                          isPaid
                                            ? "bg-green-50 border border-green-200 text-green-600 cursor-not-allowed"
                                            : isSelected
                                              ? "border-2 border-primary text-white"
                                              : "border border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                                        }`}
                                        style={
                                          isSelected && !isPaid
                                            ? { backgroundColor: "#4a7c59" }
                                            : undefined
                                        }
                                      >
                                        {month.short}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                    Payment method
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${paymentMethod === "card" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod("ach")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${paymentMethod === "ach" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      ACH / US bank account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-1.5">
                    {paymentMethod === "card"
                      ? `Processing fee (est.): ~${formatCents(cardFee)}`
                      : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`}
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={coverFees}
                    onChange={(e) => setCoverFees(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#4a7c59" }}
                  />
                  <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                    I agree to pay the processing fee
                  </span>
                </label>
                <p className="text-xs text-gray-400 font-body">
                  Prefer to pay by check? No processing fee — email us at{" "}
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="underline hover:text-gray-600 transition-colors"
                  >
                    sabrina@sagefield.co
                  </a>{" "}
                  and we&apos;ll send you instructions.
                </p>
                <div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      combinedIntendedCents > 0 ? "#f0f9f4" : "#f9fafb",
                  }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {unitCount === 0
                      ? "No months selected"
                      : siblingPayloads.length > 0
                        ? `${1 + siblingPayloads.length} children`
                        : `${unitCount} month${unitCount !== 1 ? "s" : ""} × ${formatCents(BASE_CENTS)}/mo`}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#4a7c59" }}
                  >
                    {combinedIntendedCents > 0
                      ? formatCents(totalWithFees)
                      : "—"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-500 font-body">{error}</p>
          </div>
        )}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {(step === "payment" || step === "sibling") && (
            <button
              onClick={() =>
                step === "payment"
                  ? eligibleSiblings.length > 0
                    ? setStep("sibling")
                    : setStep("plan")
                  : setStep("plan")
              }
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={
              step === "plan"
                ? unitCount < 1
                : step === "sibling"
                  ? false
                  : loading || !coverFees
            }
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#4a7c59" }}
            onClick={
              step === "plan"
                ? () => {
                    if (eligibleSiblings.length > 0) {
                      setStep("sibling");
                    } else {
                      setStep("payment");
                    }
                  }
                : step === "sibling"
                  ? () => setStep("payment")
                  : handlePayNow
            }
          >
            {step === "plan"
              ? unitCount > 0
                ? `Continue · ${formatCents(totalBaseCents)}`
                : "Continue"
              : step === "sibling"
                ? siblingPayloads.length > 0
                  ? `Continue · ${formatCents(combinedIntendedCents)}`
                  : "Continue"
                : loading
                  ? "Processing…"
                  : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SummerPaymentModal({
  enrollment,
  studentName,
  parentId,
  parentEmail,
  paidWeeks,
  initialNote,
  onClose,
  siblingEnrollments = [],
  siblingPaidWeeks = {},
  siblingStudentMap = {},
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidWeeks: number[];
  initialNote: string;
  onClose: () => void;
  siblingEnrollments?: SummerEnrollment[];
  siblingPaidWeeks?: Record<string, number[]>;
  siblingStudentMap?: Record<string, StudentInfo>;
}) {
  const isOnWeeklyPlan = paidWeeks.length > 0;
  const [step, setStep] = useState<"plan" | "payment" | "sibling">("plan");
  const [tab, setTab] = useState<"weekly" | "full">("weekly");
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState(initialNote);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaveResult, setNoteSaveResult] = useState<
    "success" | "error" | null
  >(null);
  const [includedSiblings, setIncludedSiblings] = useState<
    Record<string, boolean>
  >({});
  const [siblingWeekOverrides, setSiblingWeekOverrides] = useState<
    Record<string, Set<number>>
  >({});
  const [siblingEditorOpen, setSiblingEditorOpen] = useState<
    Record<string, boolean>
  >({});
  const [siblingEditorDirty, setSiblingEditorDirty] = useState<
    Record<string, boolean>
  >({});

  const tier = getGradeTier(enrollment.child_grade);
  const weeklyRate = SUMMER_WEEKLY_CENTS[tier];
  const fullRate = SUMMER_FULL_CENTS[tier];
  const fullOriginal = SUMMER_FULL_ORIGINAL_CENTS[tier];
  const savings = fullOriginal - fullRate;
  const weeklyTotal = selectedWeeks.size * weeklyRate;
  const allWeeksSelected = selectedWeeks.size === TOTAL_WEEKS;
  const effectiveTotal = allWeeksSelected ? fullRate : weeklyTotal;
  const canContinue = tab === "full" || selectedWeeks.size > 0;

  const intendedAmountCents = tab === "full" ? fullRate : effectiveTotal;

  // Siblings eligible to bundle: have unpaid weeks that overlap with what the parent just selected
  const eligibleSiblings = siblingEnrollments.filter((sib) => {
    const paid = siblingPaidWeeks[sib.student_id] ?? [];
    if (paid.length >= 12) return false;
    if (tab === "full") return paid.length === 0; // full plan: only siblings with nothing paid
    return Array.from(selectedWeeks).some((w) => !paid.includes(w));
  });

  // Sync sibling defaults whenever the primary week selection changes.
  // Dirty siblings (manually edited by parent) keep their overrides; clean ones track the primary.
  useEffect(() => {
    setIncludedSiblings((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [s.student_id, prev[s.student_id] ?? true]),
      ),
    );
    setSiblingEditorDirty((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [
          s.student_id,
          prev[s.student_id] ?? false,
        ]),
      ),
    );
    setSiblingWeekOverrides((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => {
          if (siblingEditorDirty[s.student_id])
            return [s.student_id, prev[s.student_id] ?? new Set()];
          const paid = siblingPaidWeeks[s.student_id] ?? [];
          const defaultWeeks = Array.from(selectedWeeks).filter(
            (w) => !paid.includes(w),
          );
          return [s.student_id, new Set(defaultWeeks)];
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eligibleSiblings.map((s) => s.student_id).join(","),
    Array.from(selectedWeeks)
      .sort((a, b) => a - b)
      .join(","),
  ]);

  function toggleSiblingWeek(studentId: string, week: number) {
    const paid = siblingPaidWeeks[studentId] ?? [];
    if (paid.includes(week)) return;
    setSiblingEditorDirty((prev) => ({ ...prev, [studentId]: true }));
    setSiblingWeekOverrides((prev) => {
      const next = new Set(prev[studentId] ?? []);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return { ...prev, [studentId]: next };
    });
  }

  // Build sibling payloads for checkout
  const siblingPayloads = eligibleSiblings
    .filter((sib) => includedSiblings[sib.student_id])
    .map((sib) => {
      const sibTier = getGradeTier(sib.child_grade);
      const paid = siblingPaidWeeks[sib.student_id] ?? [];
      const override = siblingWeekOverrides[sib.student_id];
      const sibWeeks = override
        ? Array.from(override)
            .filter((w) => !paid.includes(w))
            .sort((a, b) => a - b)
        : Array.from(selectedWeeks)
            .filter((w) => !paid.includes(w))
            .sort((a, b) => a - b);
      const sibPlanType: "weekly" | "full" =
        tab === "full" && paid.length === 0 ? "full" : "weekly";
      const sibAmount =
        sibPlanType === "full"
          ? SUMMER_FULL_CENTS[sibTier]
          : sibWeeks.length * SUMMER_WEEKLY_CENTS[sibTier];
      return {
        studentId: sib.student_id,
        applicationId: sib.id,
        planType: sibPlanType,
        selectedWeeks: sibWeeks,
        gradeTier: sibTier,
        intendedAmountCents: sibAmount,
        studentName: siblingStudentMap[sib.student_id]?.name,
      };
    });

  const siblingTotal = siblingPayloads.reduce(
    (s, sib) => s + sib.intendedAmountCents,
    0,
  );
  const combinedIntendedCents = intendedAmountCents + siblingTotal;

  const feeCents = coverFees
    ? paymentMethod === "ach"
      ? Math.min(Math.round(combinedIntendedCents * 0.008), 500)
      : Math.round((combinedIntendedCents + 30) / (1 - 0.029)) -
        combinedIntendedCents
    : 0;
  const totalWithFees = combinedIntendedCents + feeCents;

  const cardFeeDisplay =
    Math.round(((combinedIntendedCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay = Math.min(
    Math.round((combinedIntendedCents / 100) * 0.008 * 100) / 100,
    5.0,
  );

  function toggleWeek(week: number) {
    if (paidWeeks.includes(week)) return; // no-op for already-paid weeks
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-summer-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: enrollment.student_id,
          applicationId: enrollment.id,
          planType: tab,
          selectedWeeks: Array.from(selectedWeeks).sort((a, b) => a - b),
          gradeTier: tier,
          intendedAmountCents,
          coverFees,
          paymentMethod,
          siblings: siblingPayloads,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    setNoteSaveResult(null);
    try {
      const res = await fetch("/api/billing/save-summer-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          studentId: enrollment.student_id,
          applicationId: enrollment.id,
          note: noteText.trim(),
        }),
      });
      const data = await res.json();
      setNoteSaveResult(res.ok ? "success" : "error");
      if (!res.ok) console.error("save note error:", data.error);
    } catch {
      setNoteSaveResult("error");
    } finally {
      setNoteSaving(false);
    }
  }

  const continueLabel =
    tab === "weekly"
      ? selectedWeeks.size > 0
        ? `Continue · ${formatCents(effectiveTotal)}`
        : "Select weeks to continue"
      : `Continue · ${formatCents(fullRate)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ backgroundColor: "#fde8d8" }}
                >
                  <Sun
                    className="w-3.5 h-3.5"
                    style={{ color: "#e07a3a" }}
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  Summer 2026 Tuition
                </h2>
              </div>
              {studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-body">
                    {studentName}
                  </span>
                  {enrollment.child_grade && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {enrollment.child_grade}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    · {gradeTierLabel(tier)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab switcher — only shown on plan selection step */}
          {step === "plan" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTab("weekly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "weekly"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "weekly" ? { backgroundColor: "#4a7c59" } : {}}
              >
                Pay Weekly
              </button>
              <button
                onClick={() => {
                  if (!isOnWeeklyPlan) setTab("full");
                }}
                title={
                  isOnWeeklyPlan
                    ? "Not available — you're on the weekly plan"
                    : undefined
                }
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  isOnWeeklyPlan
                    ? "bg-gray-100 text-gray-400 opacity-40 cursor-not-allowed"
                    : tab === "full"
                      ? "text-white cursor-pointer"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                }`}
                style={
                  !isOnWeeklyPlan && tab === "full"
                    ? { backgroundColor: "#4a7c59" }
                    : {}
                }
              >
                Full Summer
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={
                    !isOnWeeklyPlan && tab === "full"
                      ? {
                          backgroundColor: "rgba(255,255,255,0.25)",
                          color: "#fff",
                        }
                      : { backgroundColor: "#d4e6d0", color: "#4a7c59" }
                  }
                >
                  10% off
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "sibling" ? (
              <motion.div
                key="sibling"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-4"
              >
                <div>
                  <p className="text-base font-bold font-heading text-gray-800 mb-1">
                    Add a sibling to this payment?
                  </p>
                  <p className="text-sm text-gray-500 font-body">
                    Pay for both children in one transaction and save the extra
                    processing fee.
                  </p>
                </div>

                <div className="space-y-3">
                  {eligibleSiblings.map((sib) => {
                    const sibTier = getGradeTier(sib.child_grade);
                    const paid = siblingPaidWeeks[sib.student_id] ?? [];
                    const override = siblingWeekOverrides[sib.student_id];
                    const sibWeeks = override
                      ? Array.from(override)
                          .filter((w) => !paid.includes(w))
                          .sort((a, b) => a - b)
                      : Array.from(selectedWeeks)
                          .filter((w) => !paid.includes(w))
                          .sort((a, b) => a - b);
                    const sibPlan: "weekly" | "full" =
                      tab === "full" && paid.length === 0 ? "full" : "weekly";
                    const sibAmount =
                      sibPlan === "full"
                        ? SUMMER_FULL_CENTS[sibTier]
                        : sibWeeks.length * SUMMER_WEEKLY_CENTS[sibTier];
                    const sibName =
                      siblingStudentMap[sib.student_id]?.name ?? "Sibling";
                    const isIncluded = includedSiblings[sib.student_id] ?? true;

                    // Detect if sibling weeks match the primary's selection (default state)
                    const primaryWeeksForSib = Array.from(selectedWeeks)
                      .filter((w) => !paid.includes(w))
                      .sort((a, b) => a - b);
                    const isSameAsPrimary =
                      sibWeeks.length === primaryWeeksForSib.length &&
                      sibWeeks.every((w, i) => w === primaryWeeksForSib[i]);
                    const isEditorOpen =
                      siblingEditorOpen[sib.student_id] ?? false;

                    return (
                      <div
                        key={sib.student_id}
                        className={`w-full rounded-xl border transition-colors ${
                          isIncluded
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {/* Top row: checkbox toggle + name + amount */}
                        <button
                          type="button"
                          onClick={() => {
                            setIncludedSiblings((prev) => ({
                              ...prev,
                              [sib.student_id]: !prev[sib.student_id],
                            }));
                            setSiblingEditorOpen((prev) => ({
                              ...prev,
                              [sib.student_id]: false,
                            }));
                          }}
                          className="w-full flex items-start gap-3 p-4 text-left cursor-pointer"
                        >
                          <span
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isIncluded
                                ? "border-emerald-600 bg-emerald-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isIncluded && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800 font-heading">
                                {sibName}
                              </span>
                              <span
                                className="text-sm font-bold font-heading"
                                style={{
                                  color: sibAmount > 0 ? "#4a7c59" : "#9ca3af",
                                }}
                              >
                                {sibPlan === "full" || sibAmount > 0
                                  ? formatCents(sibAmount)
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {sib.child_grade && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                  {sib.child_grade}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 font-body">
                                {sibPlan === "full"
                                  ? "Full Summer · 12 weeks"
                                  : sibWeeks.length === 0
                                    ? "No weeks selected"
                                    : isSameAsPrimary
                                      ? `Weeks ${sibWeeks.join(", ")} · same as ${studentName ?? "first child"}`
                                      : `Weeks ${sibWeeks.join(", ")}`}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* "Edit weeks" toggle + expandable week editor */}
                        {isIncluded && sibPlan === "weekly" && (
                          <div className="px-4 pb-4">
                            {!isEditorOpen ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSiblingEditorOpen((prev) => ({
                                    ...prev,
                                    [sib.student_id]: true,
                                  }))
                                }
                                className="text-xs font-semibold underline-offset-2 hover:underline cursor-pointer transition-colors"
                                style={{ color: "#4a7c59" }}
                              >
                                Edit weeks
                              </button>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-500 font-body">
                                    Weeks for {sibName}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSiblingEditorOpen((prev) => ({
                                        ...prev,
                                        [sib.student_id]: false,
                                      }))
                                    }
                                    className="text-xs font-semibold cursor-pointer transition-colors"
                                    style={{ color: "#4a7c59" }}
                                  >
                                    Done
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {SUMMER_WEEKS.map((w) => {
                                    const isPaidBySib = paid.includes(w.week);
                                    const isSelected =
                                      isPaidBySib ||
                                      (override
                                        ? override.has(w.week)
                                        : sibWeeks.includes(w.week));
                                    return (
                                      <motion.button
                                        key={w.week}
                                        type="button"
                                        disabled={isPaidBySib}
                                        onClick={() =>
                                          toggleSiblingWeek(
                                            sib.student_id,
                                            w.week,
                                          )
                                        }
                                        className={`flex flex-col gap-1.5 rounded-xl px-3 py-3 text-left transition-colors ${isPaidBySib ? "cursor-default" : "cursor-pointer"}`}
                                        animate={{
                                          backgroundColor: isPaidBySib
                                            ? "#f0fdf4"
                                            : isSelected
                                              ? "#f0f7f1"
                                              : "#f9fafb",
                                        }}
                                        whileTap={
                                          isPaidBySib ? {} : { scale: 0.99 }
                                        }
                                        transition={{ duration: 0.15 }}
                                        style={
                                          isPaidBySib
                                            ? {
                                                boxShadow:
                                                  "inset 3px 0 0 #16a34a",
                                              }
                                            : isSelected
                                              ? {
                                                  boxShadow:
                                                    "inset 3px 0 0 #4a7c59",
                                                }
                                              : {}
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                                            style={
                                              isPaidBySib
                                                ? { backgroundColor: "#16a34a" }
                                                : isSelected
                                                  ? {
                                                      backgroundColor:
                                                        "#4a7c59",
                                                    }
                                                  : {
                                                      backgroundColor:
                                                        "transparent",
                                                      border:
                                                        "2px solid #d1d5db",
                                                    }
                                            }
                                          >
                                            {(isPaidBySib || isSelected) && (
                                              <Check
                                                className="w-3 h-3 text-white"
                                                strokeWidth={3}
                                              />
                                            )}
                                          </div>
                                          <span
                                            className={`text-sm font-semibold font-heading ${isPaidBySib ? "text-green-700" : "text-gray-800"}`}
                                          >
                                            Week {w.week}
                                          </span>
                                        </div>
                                        <p
                                          className={`text-xs font-body ${isPaidBySib ? "text-green-600" : "text-gray-400"}`}
                                        >
                                          {w.dates}
                                        </p>
                                        {isPaidBySib ? (
                                          <p className="text-xs font-semibold text-green-600 font-body">
                                            Paid ✓
                                          </p>
                                        ) : (
                                          <p className="text-xs text-gray-500 font-body truncate">
                                            {w.theme}
                                          </p>
                                        )}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {siblingPayloads.length > 0 && (
                  <div
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{ backgroundColor: "#f0f7f1" }}
                  >
                    <span className="text-sm text-gray-600 font-body">
                      Combined total
                    </span>
                    <span
                      className="text-sm font-bold font-heading"
                      style={{ color: "#4a7c59" }}
                    >
                      {formatCents(combinedIntendedCents)}
                    </span>
                  </div>
                )}
              </motion.div>
            ) : step === "payment" ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                {/* Payment method toggle */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 font-body mb-2">
                    How will you be paying?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ach")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "ach"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ACH / US bank account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-1.5">
                    {paymentMethod === "card"
                      ? `Processing fee (est.): ~$${cardFeeDisplay.toFixed(2)}`
                      : `Processing fee (est.): ~$${achFeeDisplay.toFixed(2)} (0.8%, max $5.00)`}
                  </p>
                </div>

                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={coverFees}
                    onChange={(e) => setCoverFees(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                    I agree to pay the processing fee
                  </span>
                </label>

                <p className="text-xs text-gray-400 font-body mb-5">
                  Prefer to pay by check? Email us at{" "}
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="underline hover:text-gray-600 transition-colors"
                  >
                    sabrina@sagefield.co
                  </a>{" "}
                  and we&apos;ll send you instructions.
                </p>

                {error && (
                  <p className="text-sm text-red-600 font-body mb-4">{error}</p>
                )}

                <p className="text-xs text-gray-400 font-body mb-4">
                  Summer tuition payments are non-refundable.
                </p>
              </motion.div>
            ) : tab === "weekly" ? (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500 font-body">
                    Select the weeks you&apos;d like to pay for
                  </p>
                  <button
                    onClick={() => {
                      if (selectedWeeks.size === TOTAL_WEEKS) {
                        setSelectedWeeks(new Set());
                      } else {
                        setSelectedWeeks(
                          new Set(SUMMER_WEEKS.map((w) => w.week)),
                        );
                      }
                    }}
                    className="text-xs font-semibold cursor-pointer transition-colors"
                    style={{ color: "#4a7c59" }}
                  >
                    {selectedWeeks.size === TOTAL_WEEKS
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                {/* Week list */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {SUMMER_WEEKS.map((w) => {
                    const isPaid = paidWeeks.includes(w.week);
                    const selected = isPaid || selectedWeeks.has(w.week);
                    return (
                      <motion.button
                        key={w.week}
                        onClick={() => toggleWeek(w.week)}
                        className={`flex flex-col gap-1.5 rounded-xl px-3 py-3 text-left transition-colors ${isPaid ? "cursor-default" : "cursor-pointer"}`}
                        animate={{
                          backgroundColor: isPaid
                            ? "#f0fdf4"
                            : selected
                              ? "#f0f7f1"
                              : "#f9fafb",
                        }}
                        whileTap={isPaid ? {} : { scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          isPaid
                            ? { boxShadow: "inset 3px 0 0 #16a34a" }
                            : selected
                              ? { boxShadow: "inset 3px 0 0 #4a7c59" }
                              : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          {/* Checkbox */}
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              isPaid
                                ? { backgroundColor: "#16a34a" }
                                : selected
                                  ? { backgroundColor: "#4a7c59" }
                                  : {
                                      backgroundColor: "transparent",
                                      border: "2px solid #d1d5db",
                                    }
                            }
                          >
                            {(isPaid || selected) && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span
                            className={`text-sm font-semibold font-heading ${isPaid ? "text-green-700" : "text-gray-800"}`}
                          >
                            Week {w.week}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-body ${isPaid ? "text-green-600" : "text-gray-400"}`}
                        >
                          {w.dates}
                        </p>
                        {isPaid ? (
                          <p className="text-xs font-semibold text-green-600 font-body">
                            Paid ✓
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 font-body truncate">
                            {w.theme}
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Running total */}
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor: allWeeksSelected ? "#f0f7f1" : "#f6faf7",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col gap-0.5">
                    {isOnWeeklyPlan && paidWeeks.length > 0 && (
                      <span className="text-xs text-green-600 font-body">
                        {paidWeeks.length} week
                        {paidWeeks.length !== 1 ? "s" : ""} already paid
                      </span>
                    )}
                    <span className="text-sm text-gray-500 font-body">
                      {selectedWeeks.size === 0
                        ? isOnWeeklyPlan
                          ? "Select more weeks to pay for"
                          : "No weeks selected"
                        : allWeeksSelected
                          ? "All 12 weeks · Full Summer discount applied"
                          : isOnWeeklyPlan
                            ? `paying for ${selectedWeeks.size} more week${selectedWeeks.size !== 1 ? "s" : ""} × ${formatCents(weeklyRate)}/wk`
                            : `${selectedWeeks.size} week${selectedWeeks.size !== 1 ? "s" : ""} × ${formatCents(weeklyRate)}/wk`}
                    </span>
                    {allWeeksSelected && (
                      <span className="text-xs text-gray-400 font-body line-through">
                        {formatCents(weeklyTotal)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {allWeeksSelected && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: "#4a7c59" }}
                      >
                        Save 10%
                      </span>
                    )}
                    <span
                      className="text-base font-bold font-heading"
                      style={{ color: "#4a7c59" }}
                    >
                      {selectedWeeks.size > 0
                        ? formatCents(effectiveTotal)
                        : "—"}
                    </span>
                  </div>
                </motion.div>

                {/* Notes / Commitment section */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 font-heading mb-1">
                    Planning to add more weeks later?
                  </p>
                  <p className="text-xs text-gray-400 font-body mb-3">
                    Leave a note letting us know which weeks you&apos;re
                    planning to commit to — we&apos;ll hold your spot.
                  </p>
                  <textarea
                    value={noteText}
                    onChange={(e) => {
                      setNoteText(e.target.value);
                      setNoteSaveResult(null);
                    }}
                    rows={3}
                    maxLength={2000}
                    placeholder="e.g. I plan to add weeks 7–9 in July…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 font-body placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs">
                      {noteSaveResult === "success" && (
                        <span className="text-emerald-600 font-body">
                          Note saved.
                        </span>
                      )}
                      {noteSaveResult === "error" && (
                        <span className="text-red-500 font-body">
                          Couldn&apos;t save — please try again.
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={noteSaving || !noteText.trim()}
                      onClick={handleSaveNote}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#4a7c59" }}
                    >
                      {noteSaving ? "Saving…" : "Save Note"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                {/* Pricing summary card */}
                <div className="relative rounded-xl border border-gray-200 bg-white p-5 mb-4">
                  <span
                    className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: "#4a7c59" }}
                  >
                    Save 10%
                  </span>

                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Full Summer &middot; 12 Weeks
                  </p>
                  <p className="text-xs text-gray-500 font-body mb-0.5">
                    {gradeTierLabel(tier)}
                  </p>
                  <p className="text-3xl font-bold font-heading text-gray-800 mb-1">
                    {formatCents(fullRate)}
                  </p>
                  <p className="text-sm text-gray-400 font-body">
                    <span className="line-through">
                      {formatCents(fullOriginal)}
                    </span>
                    <span className="ml-1.5 text-gray-500">
                      &middot; {formatCents(savings)} off
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 font-body mt-3">
                    Monday&ndash;Thursday, 9am&ndash;3pm &middot; May 26 &ndash;
                    Aug 13, 2026
                  </p>
                </div>

                {/* Week breakdown */}
                <p className="text-sm text-gray-500 font-body mb-3">
                  Your child will experience all 12 weeks of adventure:
                </p>
                <div className="space-y-1.5">
                  {SUMMER_WEEKS.map((w) => (
                    <div
                      key={w.week}
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{ backgroundColor: "#f9fafb" }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#d4e6d0" }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{ color: "#4a7c59" }}
                          strokeWidth={3}
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700 font-heading">
                            Week {w.week}
                          </span>
                          <span className="text-xs text-gray-400 font-body">
                            {w.dates}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-body truncate">
                          {w.theme}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {(step === "payment" || step === "sibling") && (
            <button
              onClick={() =>
                step === "payment"
                  ? eligibleSiblings.length > 0
                    ? setStep("sibling")
                    : setStep("plan")
                  : setStep("plan")
              }
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={
              step === "plan"
                ? !canContinue
                : step === "sibling"
                  ? false
                  : loading || !coverFees
            }
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#4a7c59" }}
            onClick={
              step === "plan"
                ? () => {
                    eligibleSiblings.length > 0
                      ? setStep("sibling")
                      : setStep("payment");
                  }
                : step === "sibling"
                  ? () => setStep("payment")
                  : handlePayNow
            }
          >
            {step === "plan"
              ? continueLabel
              : step === "sibling"
                ? siblingPayloads.length > 0
                  ? `Continue · ${formatCents(combinedIntendedCents)}`
                  : "Continue"
                : loading
                  ? "Processing…"
                  : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AftercareCard({
  studentName,
  onClick,
}: {
  studentName: string | null;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/ImageNine.jpg"
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
          Optional
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            Summer 2026
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Extended Learning (3:00 – 5:00pm)
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#e07a3a" }}
          >
            Select plan
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function FunFridayCard({
  studentName,
  onClick,
  paidMonthsCount,
}: {
  studentName: string | null;
  onClick: () => void;
  paidMonthsCount: number;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/ImageEleven.jpg"
          alt=""
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        {paidMonthsCount > 0 ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            {paidMonthsCount} mo. paid
          </div>
        ) : (
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
            Optional
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            Summer 2026
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Friday Enrichment Day
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#7c3aed" }}
          >
            Select plan
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function SchoolYearAftercareCard({
  studentName,
  onClick,
}: {
  studentName: string | null;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/Stock3.jpg"
          alt=""
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
          Optional
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            School Year 26–27
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Extended Learning (3:00 – 5:00pm)
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#e07a3a" }}
          >
            Select plan
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function SchoolYearFunFridayCard({
  studentName,
  onClick,
  paidMonthsCount,
}: {
  studentName: string | null;
  onClick: () => void;
  paidMonthsCount: number;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/Stock4.jpg"
          alt=""
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        {paidMonthsCount > 0 ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            {paidMonthsCount} mo. paid
          </div>
        ) : (
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
            Optional
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-0.5">
            School Year 26–27
          </div>
          <div className="text-sm font-semibold text-gray-800 leading-snug">
            Friday Enrichment Day
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#7c3aed" }}
          >
            Select plan
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function AftercarePaymentModal({
  enrollment,
  studentName,
  parentId,
  parentEmail,
  paidMonths,
  paidDays,
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidMonths: Set<string>;
  paidDays: Set<string>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [tab, setTab] = useState<"monthly" | "daily">("monthly");
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set(AFTERCARE_MONTHS.map((m) => m.key)),
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyTotal = AFTERCARE_MONTHS.filter((m) =>
    selectedMonths.has(m.key),
  ).reduce((sum, m) => sum + aftercareMonthCents(m), 0);
  const dailyTotal = selectedDays.size * AFTERCARE_DAILY_CENTS;
  const intendedAmountCents = tab === "monthly" ? monthlyTotal : dailyTotal;
  const canContinue =
    tab === "monthly" ? selectedMonths.size > 0 : selectedDays.size > 0;

  const feeCents = coverFees
    ? paymentMethod === "ach"
      ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
      : Math.round((intendedAmountCents + 30) / (1 - 0.029)) -
        intendedAmountCents
    : 0;
  const totalWithFees = intendedAmountCents + feeCents;

  const cardFeeDisplay =
    Math.round(((intendedAmountCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay = Math.min(
    Math.round((intendedAmountCents / 100) * 0.008 * 100) / 100,
    5.0,
  );

  function toggleMonth(key: string) {
    if (paidMonths.has(key)) return;
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDay(date: string) {
    if (paidDays.has(date)) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleExpandedMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const continueLabel =
    tab === "monthly"
      ? selectedMonths.size > 0
        ? `Continue · ${formatCents(monthlyTotal)}`
        : "Select months to continue"
      : selectedDays.size > 0
        ? `Continue · ${formatCents(dailyTotal)}`
        : "Select days to continue";

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-aftercare-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: enrollment.student_id,
          applicationId: enrollment.id,
          planType: tab,
          selectedMonths: Array.from(selectedMonths),
          selectedDays: Array.from(selectedDays).sort(),
          intendedAmountCents,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ backgroundColor: "#fde8d8" }}
                >
                  <Clock
                    className="w-3.5 h-3.5"
                    style={{ color: "#e07a3a" }}
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  Extended Learning — Summer 2026
                </h2>
              </div>
              {studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-body">
                    {studentName}
                  </span>
                  {enrollment.child_grade && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {enrollment.child_grade}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab switcher — only on plan step */}
          {step === "plan" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTab("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "monthly"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "monthly" ? { backgroundColor: "#e07a3a" } : {}}
              >
                Monthly
              </button>
              <button
                onClick={() => setTab("daily")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "daily"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "daily" ? { backgroundColor: "#e07a3a" } : {}}
              >
                Daily
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "payment" ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                {/* Payment method toggle */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 font-body mb-2">
                    How will you be paying?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ach")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "ach"
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ACH / US bank account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-1.5">
                    {paymentMethod === "card"
                      ? `Processing fee (est.): ~$${cardFeeDisplay.toFixed(2)}`
                      : `Processing fee (est.): ~$${achFeeDisplay.toFixed(2)} (0.8%, max $5.00)`}
                  </p>
                </div>

                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={coverFees}
                    onChange={(e) => setCoverFees(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#e07a3a" }}
                  />
                  <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                    I agree to pay the processing fee
                  </span>
                </label>

                <p className="text-xs text-gray-400 font-body mb-5">
                  Prefer to pay by check? Email us at{" "}
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="underline hover:text-gray-600 transition-colors"
                  >
                    sabrina@sagefield.co
                  </a>{" "}
                  and we&apos;ll send you instructions.
                </p>

                {error && (
                  <p className="text-sm text-red-600 font-body mb-4">{error}</p>
                )}

                <p className="text-xs text-gray-400 font-body mb-4">
                  Extended Learning payments are non-refundable.
                </p>
              </motion.div>
            ) : tab === "monthly" ? (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-4">
                  Select the months you&apos;d like Extended Learning coverage
                  for.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {AFTERCARE_MONTHS.map((m) => {
                    const selected = selectedMonths.has(m.key);
                    const isPaid = paidMonths.has(m.key);
                    const paidDaysInMonth = m.days.filter((d) =>
                      paidDays.has(d.date),
                    ).length;
                    // Only count individually-paid days (not from a monthly payment) for the subtitle
                    const individualPaidDaysInMonth = isPaid
                      ? 0
                      : paidDaysInMonth;
                    return (
                      <motion.button
                        key={m.key}
                        onClick={() => toggleMonth(m.key)}
                        disabled={isPaid}
                        className={`flex flex-col gap-1 rounded-xl px-4 py-4 text-left transition-colors ${isPaid ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        animate={{
                          backgroundColor: isPaid
                            ? "#f0fdf4"
                            : selected
                              ? "#fff7f3"
                              : "#f9fafb",
                        }}
                        whileTap={isPaid ? {} : { scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          isPaid
                            ? { boxShadow: "inset 3px 0 0 #16a34a" }
                            : selected
                              ? { boxShadow: "inset 3px 0 0 #e07a3a" }
                              : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              isPaid
                                ? { backgroundColor: "#16a34a" }
                                : selected
                                  ? { backgroundColor: "#e07a3a" }
                                  : {
                                      backgroundColor: "transparent",
                                      border: "2px solid #d1d5db",
                                    }
                            }
                          >
                            {(isPaid || selected) && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold font-heading text-gray-800">
                            {m.label}
                          </span>
                          {isPaid && (
                            <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                              Paid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-body mt-1 ml-7">
                          {m.days.length} days ·{" "}
                          {aftercareMonthCents(m) === AFTERCARE_MONTHLY_CENTS
                            ? `${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
                            : formatCents(aftercareMonthCents(m))}
                          {individualPaidDaysInMonth > 0 && (
                            <span className="ml-1.5 text-green-600 font-semibold">
                              · {individualPaidDaysInMonth} day
                              {individualPaidDaysInMonth !== 1 ? "s" : ""} paid
                            </span>
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Running total */}
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedMonths.size > 0 ? "#fff7f3" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedMonths.size === 0
                      ? "No months selected"
                      : (() => {
                          const sel = AFTERCARE_MONTHS.filter((m) =>
                            selectedMonths.has(m.key),
                          );
                          const allNormal = sel.every(
                            (m) =>
                              aftercareMonthCents(m) ===
                              AFTERCARE_MONTHLY_CENTS,
                          );
                          return allNormal
                            ? `${sel.length} month${sel.length !== 1 ? "s" : ""} × ${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
                            : `${sel.length} month${sel.length !== 1 ? "s" : ""} selected`;
                        })()}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#e07a3a" }}
                  >
                    {selectedMonths.size > 0 ? formatCents(monthlyTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="daily"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-4">
                  Select individual days you&apos;d like Extended Learning.
                  $35/day.
                </p>
                <div className="space-y-3 mb-4">
                  {AFTERCARE_MONTHS.map((m) => {
                    const isExpanded = expandedMonths.has(m.key);
                    const selectedInMonth = m.days.filter((d) =>
                      selectedDays.has(d.date),
                    ).length;
                    const paidInMonth = m.days.filter((d) =>
                      paidDays.has(d.date),
                    ).length;
                    return (
                      <div
                        key={m.key}
                        className="rounded-xl border border-gray-100 overflow-hidden"
                      >
                        {/* Month header */}
                        <button
                          onClick={() => toggleExpandedMonth(m.key)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-heading text-gray-700">
                              {m.label}
                            </span>
                            {paidInMonth > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-100">
                                {paidInMonth} paid
                              </span>
                            )}
                            {selectedInMonth > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: "#e07a3a" }}
                              >
                                {selectedInMonth} selected
                              </span>
                            )}
                          </div>
                          <motion.span
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-gray-400"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.span>
                        </button>

                        {/* Day chips */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                ease: "easeInOut" as const,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3 flex flex-wrap gap-2">
                                {m.days.map((d) => {
                                  const sel = selectedDays.has(d.date);
                                  const isPaidDay = paidDays.has(d.date);
                                  return (
                                    <button
                                      key={d.date}
                                      onClick={() => toggleDay(d.date)}
                                      disabled={isPaidDay}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors border ${
                                        isPaidDay
                                          ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                                          : sel
                                            ? "text-white border-transparent cursor-pointer"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 cursor-pointer"
                                      }`}
                                      style={
                                        !isPaidDay && sel
                                          ? {
                                              backgroundColor: "#e07a3a",
                                              borderColor: "#e07a3a",
                                            }
                                          : {}
                                      }
                                    >
                                      {d.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Running total */}
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedDays.size > 0 ? "#fff7f3" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedDays.size === 0
                      ? "No days selected"
                      : `${selectedDays.size} day${selectedDays.size !== 1 ? "s" : ""} × ${formatCents(AFTERCARE_DAILY_CENTS)}/day`}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#e07a3a" }}
                  >
                    {selectedDays.size > 0 ? formatCents(dailyTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("plan")}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={step === "plan" ? !canContinue : loading || !coverFees}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#e07a3a" }}
            onClick={step === "plan" ? () => setStep("payment") : handlePayNow}
          >
            {step === "plan"
              ? continueLabel
              : loading
                ? "Processing…"
                : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FunFridayPaymentModal({
  enrollment,
  studentName,
  parentId,
  parentEmail,
  paidMonths,
  paidFridays,
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidMonths: Set<string>;
  paidFridays: Set<string>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [tab, setTab] = useState<"monthly" | "dropin">("monthly");
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedFridays, setSelectedFridays] = useState<Set<string>>(
    new Set(),
  );
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set(FUN_FRIDAY_MONTHS.map((m) => m.key)),
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyTotal = FUN_FRIDAY_MONTHS.filter((m) =>
    selectedMonths.has(m.key),
  ).reduce((sum, m) => sum + schoolYearFunFridayMonthCents(m), 0);
  const dropinTotal = selectedFridays.size * FUN_FRIDAY_DROPIN_CENTS;
  const intendedAmountCents = tab === "monthly" ? monthlyTotal : dropinTotal;
  const canContinue =
    tab === "monthly" ? selectedMonths.size > 0 : selectedFridays.size > 0;

  const feeCents = coverFees
    ? paymentMethod === "ach"
      ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
      : Math.round((intendedAmountCents + 30) / (1 - 0.029)) -
        intendedAmountCents
    : 0;
  const totalWithFees = intendedAmountCents + feeCents;

  const cardFeeDisplay =
    Math.round(((intendedAmountCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay = Math.min(
    Math.round((intendedAmountCents / 100) * 0.008 * 100) / 100,
    5.0,
  );

  function toggleMonth(key: string) {
    if (paidMonths.has(key)) return;
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleFriday(date: string) {
    if (paidFridays.has(date)) return;
    setSelectedFridays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleExpandedMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const continueLabel =
    tab === "monthly"
      ? selectedMonths.size > 0
        ? `Continue · ${formatCents(monthlyTotal)}`
        : "Select months to continue"
      : selectedFridays.size > 0
        ? `Continue · ${formatCents(dropinTotal)}`
        : "Select Fridays to continue";

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-fun-friday-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: enrollment.student_id,
          applicationId: enrollment.id,
          planType: tab,
          selectedMonths: Array.from(selectedMonths),
          selectedFridays: Array.from(selectedFridays).sort(),
          intendedAmountCents,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ backgroundColor: "#ede9fe" }}
                >
                  <PartyPopper
                    className="w-3.5 h-3.5"
                    style={{ color: "#7c3aed" }}
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  Fun Friday — Summer 2026
                </h2>
              </div>
              {studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-body">
                    {studentName}
                  </span>
                  {enrollment.child_grade && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {enrollment.child_grade}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab switcher — only on plan step */}
          {step === "plan" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTab("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "monthly"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "monthly" ? { backgroundColor: "#7c3aed" } : {}}
              >
                Monthly · Save 33% 🎉
              </button>
              <button
                onClick={() => setTab("dropin")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "dropin"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "dropin" ? { backgroundColor: "#7c3aed" } : {}}
              >
                Drop-in
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "payment" ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                {/* Payment method toggle */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 font-body mb-2">
                    How will you be paying?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ach")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "ach"
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ACH / US bank account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-1.5">
                    {paymentMethod === "card"
                      ? `Processing fee (est.): ~$${cardFeeDisplay.toFixed(2)}`
                      : `Processing fee (est.): ~$${achFeeDisplay.toFixed(2)} (0.8%, max $5.00)`}
                  </p>
                </div>

                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={coverFees}
                    onChange={(e) => setCoverFees(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#7c3aed" }}
                  />
                  <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                    I agree to pay the processing fee
                  </span>
                </label>

                <p className="text-xs text-gray-400 font-body mb-5">
                  Prefer to pay by check? Email us at{" "}
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="underline hover:text-gray-600 transition-colors"
                  >
                    sabrina@sagefield.co
                  </a>{" "}
                  and we&apos;ll send you instructions.
                </p>

                {error && (
                  <p className="text-sm text-red-600 font-body mb-4">{error}</p>
                )}

                <p className="text-xs text-gray-400 font-body mb-4">
                  Fun Friday payments are non-refundable.
                </p>
              </motion.div>
            ) : tab === "monthly" ? (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-1">
                  Select the months you&apos;d like Fun Friday coverage for.
                </p>
                <p className="text-xs text-gray-400 font-body mb-4">
                  9:00am – 1:00pm · Package of 4 Fridays per month
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {FUN_FRIDAY_MONTHS.map((m) => {
                    const selected = selectedMonths.has(m.key);
                    const isPaid = paidMonths.has(m.key);
                    const paidFridaysInMonth = m.fridays.filter((d) =>
                      paidFridays.has(d.date),
                    ).length;
                    const individualPaidFridaysInMonth = isPaid
                      ? 0
                      : paidFridaysInMonth;
                    return (
                      <motion.button
                        key={m.key}
                        onClick={() => toggleMonth(m.key)}
                        disabled={isPaid}
                        className={`flex flex-col gap-1 rounded-xl px-4 py-4 text-left transition-colors ${isPaid ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        animate={{
                          backgroundColor: isPaid
                            ? "#f0fdf4"
                            : selected
                              ? "#f5f3ff"
                              : "#f9fafb",
                        }}
                        whileTap={isPaid ? {} : { scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          isPaid
                            ? { boxShadow: "inset 3px 0 0 #16a34a" }
                            : selected
                              ? { boxShadow: "inset 3px 0 0 #7c3aed" }
                              : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              isPaid
                                ? { backgroundColor: "#16a34a" }
                                : selected
                                  ? { backgroundColor: "#7c3aed" }
                                  : {
                                      backgroundColor: "transparent",
                                      border: "2px solid #d1d5db",
                                    }
                            }
                          >
                            {(isPaid || selected) && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold font-heading text-gray-800">
                            {m.label}
                          </span>
                          {isPaid && (
                            <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                              Paid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-body mt-1 ml-7">
                          {m.fridays.length} Friday
                          {m.fridays.length !== 1 ? "s" : ""} ·{" "}
                          {m.fridays.length >= 4
                            ? `${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo`
                            : formatCents(funFridayMonthCents(m))}
                          {individualPaidFridaysInMonth > 0 && (
                            <span className="ml-1.5 text-green-600 font-semibold">
                              · {individualPaidFridaysInMonth} Friday
                              {individualPaidFridaysInMonth !== 1
                                ? "s"
                                : ""}{" "}
                              paid
                            </span>
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Running total */}
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedMonths.size > 0 ? "#f5f3ff" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedMonths.size === 0
                      ? "No months selected"
                      : (() => {
                          const sel = FUN_FRIDAY_MONTHS.filter((m) =>
                            selectedMonths.has(m.key),
                          );
                          const allNormal = sel.every(
                            (m) => m.fridays.length >= 4,
                          );
                          return allNormal
                            ? `${sel.length} month${sel.length !== 1 ? "s" : ""} × ${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo`
                            : `${sel.length} month${sel.length !== 1 ? "s" : ""} selected`;
                        })()}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#7c3aed" }}
                  >
                    {selectedMonths.size > 0 ? formatCents(monthlyTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="dropin"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-1">
                  Select individual Fridays you&apos;d like to attend.
                  $50/session.
                </p>
                <p className="text-xs text-gray-400 font-body mb-4">
                  9:00am – 1:00pm
                </p>
                <div className="space-y-3 mb-4">
                  {FUN_FRIDAY_MONTHS.map((m) => {
                    const isExpanded = expandedMonths.has(m.key);
                    const selectedInMonth = m.fridays.filter((d) =>
                      selectedFridays.has(d.date),
                    ).length;
                    const paidInMonth = m.fridays.filter((d) =>
                      paidFridays.has(d.date),
                    ).length;
                    return (
                      <div
                        key={m.key}
                        className="rounded-xl border border-gray-100 overflow-hidden"
                      >
                        {/* Month header */}
                        <button
                          onClick={() => toggleExpandedMonth(m.key)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-heading text-gray-700">
                              {m.label}
                            </span>
                            {paidInMonth > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-100">
                                {paidInMonth} paid
                              </span>
                            )}
                            {selectedInMonth > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: "#7c3aed" }}
                              >
                                {selectedInMonth} selected
                              </span>
                            )}
                          </div>
                          <motion.span
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-gray-400"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.span>
                        </button>

                        {/* Friday chips */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                ease: "easeInOut" as const,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3 flex flex-wrap gap-2">
                                {m.fridays.map((d) => {
                                  const sel = selectedFridays.has(d.date);
                                  const isPaidFriday = paidFridays.has(d.date);
                                  return (
                                    <button
                                      key={d.date}
                                      onClick={() => toggleFriday(d.date)}
                                      disabled={isPaidFriday}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors border ${
                                        isPaidFriday
                                          ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                                          : sel
                                            ? "text-white border-transparent cursor-pointer"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600 cursor-pointer"
                                      }`}
                                      style={
                                        !isPaidFriday && sel
                                          ? {
                                              backgroundColor: "#7c3aed",
                                              borderColor: "#7c3aed",
                                            }
                                          : {}
                                      }
                                    >
                                      {d.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Running total */}
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedFridays.size > 0 ? "#f5f3ff" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedFridays.size === 0
                      ? "No Fridays selected"
                      : `${selectedFridays.size} session${selectedFridays.size !== 1 ? "s" : ""} × ${formatCents(FUN_FRIDAY_DROPIN_CENTS)}/session`}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#7c3aed" }}
                  >
                    {selectedFridays.size > 0 ? formatCents(dropinTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("plan")}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={step === "plan" ? !canContinue : loading || !coverFees}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#7c3aed" }}
            onClick={step === "plan" ? () => setStep("payment") : handlePayNow}
          >
            {step === "plan"
              ? continueLabel
              : loading
                ? "Processing…"
                : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SchoolYearAftercarePaymentModal({
  enrollment,
  studentName,
  parentId,
  parentEmail,
  paidMonths,
  paidDays,
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidMonths: Set<string>;
  paidDays: Set<string>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [tab, setTab] = useState<"monthly" | "daily">("monthly");
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set(SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => m.key)),
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyTotal = SCHOOL_YEAR_AFTERCARE_MONTHS.filter((m) =>
    selectedMonths.has(m.key),
  ).reduce((sum, m) => sum + schoolYearAftercareMonthCents(m), 0);
  const dailyTotal = selectedDays.size * AFTERCARE_DAILY_CENTS;
  const intendedAmountCents = tab === "monthly" ? monthlyTotal : dailyTotal;
  const canContinue =
    tab === "monthly" ? selectedMonths.size > 0 : selectedDays.size > 0;

  const feeCents = coverFees
    ? paymentMethod === "ach"
      ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
      : Math.round((intendedAmountCents + 30) / (1 - 0.029)) -
        intendedAmountCents
    : 0;
  const totalWithFees = intendedAmountCents + feeCents;

  const cardFeeDisplay =
    Math.round(((intendedAmountCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay = Math.min(
    Math.round((intendedAmountCents / 100) * 0.008 * 100) / 100,
    5.0,
  );

  function toggleMonth(key: string) {
    if (paidMonths.has(key)) return;
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDay(date: string) {
    if (paidDays.has(date)) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleExpandedMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const continueLabel =
    tab === "monthly"
      ? selectedMonths.size > 0
        ? `Continue · ${formatCents(monthlyTotal)}`
        : "Select months to continue"
      : selectedDays.size > 0
        ? `Continue · ${formatCents(dailyTotal)}`
        : "Select days to continue";

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-aftercare-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: enrollment.student_id,
          applicationId: enrollment.id,
          planType: tab,
          selectedMonths: Array.from(selectedMonths),
          selectedDays: Array.from(selectedDays).sort(),
          intendedAmountCents,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ backgroundColor: "#fde8d8" }}
                >
                  <Clock
                    className="w-3.5 h-3.5"
                    style={{ color: "#e07a3a" }}
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  Extended Learning — School Year 26–27
                </h2>
              </div>
              {studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-body">
                    {studentName}
                  </span>
                  {enrollment.child_grade && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {enrollment.child_grade}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {step === "plan" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTab("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "monthly"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "monthly" ? { backgroundColor: "#e07a3a" } : {}}
              >
                Monthly
              </button>
              <button
                onClick={() => setTab("daily")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "daily"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "daily" ? { backgroundColor: "#e07a3a" } : {}}
              >
                Daily
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "payment" ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 font-body mb-2">
                    How will you be paying?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ach")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "ach"
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ACH / US bank account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-1.5">
                    {paymentMethod === "card"
                      ? `Processing fee (est.): ~$${cardFeeDisplay.toFixed(2)}`
                      : `Processing fee (est.): ~$${achFeeDisplay.toFixed(2)} (0.8%, max $5.00)`}
                  </p>
                </div>
                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={coverFees}
                    onChange={(e) => setCoverFees(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#e07a3a" }}
                  />
                  <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                    I agree to pay the processing fee
                  </span>
                </label>
                <p className="text-xs text-gray-400 font-body mb-5">
                  Prefer to pay by check? Email us at{" "}
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="underline hover:text-gray-600 transition-colors"
                  >
                    sabrina@sagefield.co
                  </a>{" "}
                  and we&apos;ll send you instructions.
                </p>
                {error && (
                  <p className="text-sm text-red-600 font-body mb-4">{error}</p>
                )}
                <p className="text-xs text-gray-400 font-body mb-4">
                  Extended Learning payments are non-refundable.
                </p>
              </motion.div>
            ) : tab === "monthly" ? (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-4">
                  Select the months you&apos;d like Extended Learning coverage
                  for.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => {
                    const selected = selectedMonths.has(m.key);
                    const isPaid = paidMonths.has(m.key);
                    const paidDaysInMonth = m.days.filter((d) =>
                      paidDays.has(d.date),
                    ).length;
                    const individualPaidDaysInMonth = isPaid
                      ? 0
                      : paidDaysInMonth;
                    return (
                      <motion.button
                        key={m.key}
                        onClick={() => toggleMonth(m.key)}
                        disabled={isPaid}
                        className={`flex flex-col gap-1 rounded-xl px-4 py-4 text-left transition-colors ${isPaid ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        animate={{
                          backgroundColor: isPaid
                            ? "#f0fdf4"
                            : selected
                              ? "#fff7f3"
                              : "#f9fafb",
                        }}
                        whileTap={isPaid ? {} : { scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          isPaid
                            ? { boxShadow: "inset 3px 0 0 #16a34a" }
                            : selected
                              ? { boxShadow: "inset 3px 0 0 #e07a3a" }
                              : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              isPaid
                                ? { backgroundColor: "#16a34a" }
                                : selected
                                  ? { backgroundColor: "#e07a3a" }
                                  : {
                                      backgroundColor: "transparent",
                                      border: "2px solid #d1d5db",
                                    }
                            }
                          >
                            {(isPaid || selected) && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold font-heading text-gray-800">
                            {m.label}
                          </span>
                          {isPaid && (
                            <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                              Paid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-body mt-1 ml-7">
                          {m.days.length} days ·{" "}
                          {schoolYearAftercareMonthCents(m) ===
                          AFTERCARE_MONTHLY_CENTS
                            ? `${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
                            : formatCents(schoolYearAftercareMonthCents(m))}
                          {individualPaidDaysInMonth > 0 && (
                            <span className="ml-1.5 text-green-600 font-semibold">
                              · {individualPaidDaysInMonth} day
                              {individualPaidDaysInMonth !== 1 ? "s" : ""} paid
                            </span>
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedMonths.size > 0 ? "#fff7f3" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedMonths.size === 0
                      ? "No months selected"
                      : (() => {
                          const sel = SCHOOL_YEAR_AFTERCARE_MONTHS.filter((m) =>
                            selectedMonths.has(m.key),
                          );
                          const allNormal = sel.every(
                            (m) =>
                              schoolYearAftercareMonthCents(m) ===
                              AFTERCARE_MONTHLY_CENTS,
                          );
                          return allNormal
                            ? `${sel.length} month${sel.length !== 1 ? "s" : ""} × ${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
                            : `${sel.length} month${sel.length !== 1 ? "s" : ""} selected`;
                        })()}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#e07a3a" }}
                  >
                    {selectedMonths.size > 0 ? formatCents(monthlyTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="daily"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-4">
                  Select individual days you&apos;d like Extended Learning.
                  $35/day.
                </p>
                <div className="space-y-3 mb-4">
                  {SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => {
                    const isExpanded = expandedMonths.has(m.key);
                    const selectedInMonth = m.days.filter((d) =>
                      selectedDays.has(d.date),
                    ).length;
                    const paidInMonth = m.days.filter((d) =>
                      paidDays.has(d.date),
                    ).length;
                    return (
                      <div
                        key={m.key}
                        className="rounded-xl border border-gray-100 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpandedMonth(m.key)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-heading text-gray-700">
                              {m.label}
                            </span>
                            {paidInMonth > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-100">
                                {paidInMonth} paid
                              </span>
                            )}
                            {selectedInMonth > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: "#e07a3a" }}
                              >
                                {selectedInMonth} selected
                              </span>
                            )}
                          </div>
                          <motion.span
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-gray-400"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                ease: "easeInOut" as const,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3 flex flex-wrap gap-2">
                                {m.days.map((d) => {
                                  const sel = selectedDays.has(d.date);
                                  const isPaidDay = paidDays.has(d.date);
                                  return (
                                    <button
                                      key={d.date}
                                      onClick={() => toggleDay(d.date)}
                                      disabled={isPaidDay}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors border ${
                                        isPaidDay
                                          ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                                          : sel
                                            ? "text-white border-transparent cursor-pointer"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 cursor-pointer"
                                      }`}
                                      style={
                                        !isPaidDay && sel
                                          ? {
                                              backgroundColor: "#e07a3a",
                                              borderColor: "#e07a3a",
                                            }
                                          : {}
                                      }
                                    >
                                      {d.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedDays.size > 0 ? "#fff7f3" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedDays.size === 0
                      ? "No days selected"
                      : `${selectedDays.size} day${selectedDays.size !== 1 ? "s" : ""} × ${formatCents(AFTERCARE_DAILY_CENTS)}/day`}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#e07a3a" }}
                  >
                    {selectedDays.size > 0 ? formatCents(dailyTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("plan")}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={step === "plan" ? !canContinue : loading || !coverFees}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#e07a3a" }}
            onClick={step === "plan" ? () => setStep("payment") : handlePayNow}
          >
            {step === "plan"
              ? continueLabel
              : loading
                ? "Processing…"
                : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SchoolYearFunFridayPaymentModal({
  enrollment,
  studentName,
  parentId,
  parentEmail,
  paidMonths,
  paidFridays,
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidMonths: Set<string>;
  paidFridays: Set<string>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [tab, setTab] = useState<"monthly" | "dropin">("monthly");
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedFridays, setSelectedFridays] = useState<Set<string>>(
    new Set(),
  );
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set(SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key)),
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyTotal = SCHOOL_YEAR_FUN_FRIDAY_MONTHS.filter((m) =>
    selectedMonths.has(m.key),
  ).reduce((sum, m) => sum + schoolYearFunFridayMonthCents(m), 0);
  const dropinTotal = selectedFridays.size * FUN_FRIDAY_DROPIN_CENTS;
  const intendedAmountCents = tab === "monthly" ? monthlyTotal : dropinTotal;
  const canContinue =
    tab === "monthly" ? selectedMonths.size > 0 : selectedFridays.size > 0;

  const feeCents = coverFees
    ? paymentMethod === "ach"
      ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
      : Math.round((intendedAmountCents + 30) / (1 - 0.029)) -
        intendedAmountCents
    : 0;
  const totalWithFees = intendedAmountCents + feeCents;

  const cardFeeDisplay =
    Math.round(((intendedAmountCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay = Math.min(
    Math.round((intendedAmountCents / 100) * 0.008 * 100) / 100,
    5.0,
  );

  function toggleMonth(key: string) {
    if (paidMonths.has(key)) return;
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleFriday(date: string) {
    if (paidFridays.has(date)) return;
    setSelectedFridays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleExpandedMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const continueLabel =
    tab === "monthly"
      ? selectedMonths.size > 0
        ? `Continue · ${formatCents(monthlyTotal)}`
        : "Select months to continue"
      : selectedFridays.size > 0
        ? `Continue · ${formatCents(dropinTotal)}`
        : "Select Fridays to continue";

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-fun-friday-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          studentId: enrollment.student_id,
          applicationId: enrollment.id,
          planType: tab,
          selectedMonths: Array.from(selectedMonths),
          selectedFridays: Array.from(selectedFridays).sort(),
          intendedAmountCents,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ backgroundColor: "#ede9fe" }}
                >
                  <PartyPopper
                    className="w-3.5 h-3.5"
                    style={{ color: "#7c3aed" }}
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  Friday Enrichment — School Year 26–27
                </h2>
              </div>
              {studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-body">
                    {studentName}
                  </span>
                  {enrollment.child_grade && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {enrollment.child_grade}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {step === "plan" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTab("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "monthly"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "monthly" ? { backgroundColor: "#7c3aed" } : {}}
              >
                Monthly · Save 33% 🎉
              </button>
              <button
                onClick={() => setTab("dropin")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "dropin"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={tab === "dropin" ? { backgroundColor: "#7c3aed" } : {}}
              >
                Drop-in
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === "payment" ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 font-body mb-2">
                    How will you be paying?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ach")}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                        paymentMethod === "ach"
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ACH / US bank account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-1.5">
                    {paymentMethod === "card"
                      ? `Processing fee (est.): ~$${cardFeeDisplay.toFixed(2)}`
                      : `Processing fee (est.): ~$${achFeeDisplay.toFixed(2)} (0.8%, max $5.00)`}
                  </p>
                </div>
                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={coverFees}
                    onChange={(e) => setCoverFees(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#7c3aed" }}
                  />
                  <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                    I agree to pay the processing fee
                  </span>
                </label>
                <p className="text-xs text-gray-400 font-body mb-5">
                  Prefer to pay by check? Email us at{" "}
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="underline hover:text-gray-600 transition-colors"
                  >
                    sabrina@sagefield.co
                  </a>{" "}
                  and we&apos;ll send you instructions.
                </p>
                {error && (
                  <p className="text-sm text-red-600 font-body mb-4">{error}</p>
                )}
                <p className="text-xs text-gray-400 font-body mb-4">
                  Friday Enrichment payments are non-refundable.
                </p>
              </motion.div>
            ) : tab === "monthly" ? (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-1">
                  Select the months you&apos;d like Friday Enrichment coverage
                  for.
                </p>
                <p className="text-xs text-gray-400 font-body mb-4">
                  9:00am – 1:00pm · Package of 4 Fridays per month
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => {
                    const selected = selectedMonths.has(m.key);
                    const isPaid = paidMonths.has(m.key);
                    const paidFridaysInMonth = m.fridays.filter((d) =>
                      paidFridays.has(d.date),
                    ).length;
                    const individualPaidFridaysInMonth = isPaid
                      ? 0
                      : paidFridaysInMonth;
                    return (
                      <motion.button
                        key={m.key}
                        onClick={() => toggleMonth(m.key)}
                        disabled={isPaid}
                        className={`flex flex-col gap-1 rounded-xl px-4 py-4 text-left transition-colors ${isPaid ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        animate={{
                          backgroundColor: isPaid
                            ? "#f0fdf4"
                            : selected
                              ? "#f5f3ff"
                              : "#f9fafb",
                        }}
                        whileTap={isPaid ? {} : { scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          isPaid
                            ? { boxShadow: "inset 3px 0 0 #16a34a" }
                            : selected
                              ? { boxShadow: "inset 3px 0 0 #7c3aed" }
                              : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              isPaid
                                ? { backgroundColor: "#16a34a" }
                                : selected
                                  ? { backgroundColor: "#7c3aed" }
                                  : {
                                      backgroundColor: "transparent",
                                      border: "2px solid #d1d5db",
                                    }
                            }
                          >
                            {(isPaid || selected) && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold font-heading text-gray-800">
                            {m.label}
                          </span>
                          {isPaid && (
                            <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                              Paid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-body mt-1 ml-7">
                          {m.fridays.length} Friday
                          {m.fridays.length !== 1 ? "s" : ""} ·{" "}
                          {m.fridays.length >= 4
                            ? `${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo`
                            : formatCents(schoolYearFunFridayMonthCents(m))}
                          {individualPaidFridaysInMonth > 0 && (
                            <span className="ml-1.5 text-green-600 font-semibold">
                              · {individualPaidFridaysInMonth} Friday
                              {individualPaidFridaysInMonth !== 1
                                ? "s"
                                : ""}{" "}
                              paid
                            </span>
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedMonths.size > 0 ? "#f5f3ff" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedMonths.size === 0
                      ? "No months selected"
                      : (() => {
                          const sel = SCHOOL_YEAR_FUN_FRIDAY_MONTHS.filter(
                            (m) => selectedMonths.has(m.key),
                          );
                          const allNormal = sel.every(
                            (m) => m.fridays.length >= 4,
                          );
                          return allNormal
                            ? `${sel.length} month${sel.length !== 1 ? "s" : ""} × ${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo`
                            : `${sel.length} month${sel.length !== 1 ? "s" : ""} selected`;
                        })()}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#7c3aed" }}
                  >
                    {selectedMonths.size > 0 ? formatCents(monthlyTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="dropin"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" as const }}
              >
                <p className="text-sm text-gray-500 font-body mb-1">
                  Select individual Fridays you&apos;d like to attend.
                  $50/session.
                </p>
                <p className="text-xs text-gray-400 font-body mb-4">
                  9:00am – 1:00pm
                </p>
                <div className="space-y-3 mb-4">
                  {SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => {
                    const isExpanded = expandedMonths.has(m.key);
                    const selectedInMonth = m.fridays.filter((d) =>
                      selectedFridays.has(d.date),
                    ).length;
                    const paidInMonth = m.fridays.filter((d) =>
                      paidFridays.has(d.date),
                    ).length;
                    return (
                      <div
                        key={m.key}
                        className="rounded-xl border border-gray-100 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpandedMonth(m.key)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-heading text-gray-700">
                              {m.label}
                            </span>
                            {paidInMonth > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-100">
                                {paidInMonth} paid
                              </span>
                            )}
                            {selectedInMonth > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: "#7c3aed" }}
                              >
                                {selectedInMonth} selected
                              </span>
                            )}
                          </div>
                          <motion.span
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-gray-400"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                ease: "easeInOut" as const,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3 flex flex-wrap gap-2">
                                {m.fridays.map((d) => {
                                  const sel = selectedFridays.has(d.date);
                                  const isPaidFriday = paidFridays.has(d.date);
                                  return (
                                    <button
                                      key={d.date}
                                      onClick={() => toggleFriday(d.date)}
                                      disabled={isPaidFriday}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors border ${
                                        isPaidFriday
                                          ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                                          : sel
                                            ? "text-white border-transparent cursor-pointer"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600 cursor-pointer"
                                      }`}
                                      style={
                                        !isPaidFriday && sel
                                          ? {
                                              backgroundColor: "#7c3aed",
                                              borderColor: "#7c3aed",
                                            }
                                          : {}
                                      }
                                    >
                                      {d.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <motion.div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedFridays.size > 0 ? "#f5f3ff" : "#f9fafb",
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    {selectedFridays.size === 0
                      ? "No Fridays selected"
                      : `${selectedFridays.size} session${selectedFridays.size !== 1 ? "s" : ""} × ${formatCents(FUN_FRIDAY_DROPIN_CENTS)}/session`}
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#7c3aed" }}
                  >
                    {selectedFridays.size > 0 ? formatCents(dropinTotal) : "—"}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("plan")}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            disabled={step === "plan" ? !canContinue : loading || !coverFees}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#7c3aed" }}
            onClick={step === "plan" ? () => setStep("payment") : handlePayNow}
          >
            {step === "plan"
              ? continueLabel
              : loading
                ? "Processing…"
                : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AllCaughtUpCard() {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
        style={{ backgroundColor: "#d4e6d0" }}
      >
        <CheckCircle2
          className="w-6 h-6"
          style={{ color: "#4a7c59" }}
          strokeWidth={1.5}
        />
      </div>
      <p className="text-base font-semibold font-heading text-gray-700 mb-1">
        All caught up!
      </p>
      <p className="text-sm font-body text-gray-400">
        You have no outstanding payments at this time.
      </p>
    </div>
  );
}

const STUDENT_AVATAR_COLORS = [
  "bg-[#4a7c59]",
  "bg-[#7c6b4a]",
  "bg-[#5a6b8a]",
  "bg-[#8a5a6b]",
  "bg-[#6b7c4a]",
  "bg-[#4a6b7c]",
];
function colorForStudentId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return STUDENT_AVATAR_COLORS[Math.abs(hash) % STUDENT_AVATAR_COLORS.length];
}

function StudentTabAvatar({
  id,
  name,
  profileImageUrl,
  isActive,
}: {
  id: string;
  name: string;
  profileImageUrl: string | null;
  isActive: boolean;
}) {
  if (profileImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={profileImageUrl}
        alt={name}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 ${colorForStudentId(id)}`}
    >
      {getInitials(name)}
    </div>
  );
}

function PendingPaymentsSection({
  summerEnrollments,
  unpaidSummerEnrollments,
  pendingRequests,
  studentMap,
  paidWeeksByStudent,
  onSelectSummer,
  onSelectPending,
  onSelectAftercare,
  onSelectFunFriday,
  onSelectSchoolYearAftercare,
  onSelectSchoolYearFunFriday,
  onSelectHomeschool,
  onViewHomeschoolHistory,
  onSelectSchoolYearHomeschool,
  onViewSchoolYearHomeschoolHistory,
  nonEnrolledApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  paidFunFridayByStudent,
  activeStudentId,
  schoolYearOnlyApps,
  showMultiChildBanner,
  showMultiChildSchoolYearBanner,
  onOpenFirstSummer,
  onSelectSupplyFee,
  onSelectSchoolYearTuition,
  paidSupplyFeeByStudent,
  paidSchoolYearByStudent,
  onTuitionCodeClick,
}: {
  summerEnrollments: SummerEnrollment[];
  unpaidSummerEnrollments: SummerEnrollment[];
  pendingRequests: PendingPaymentRequest[];
  studentMap: Record<string, StudentInfo>;
  paidWeeksByStudent: PaidWeeksByStudent;
  onSelectSummer: (e: SummerEnrollment) => void;
  onSelectPending: (r: PendingPaymentRequest) => void;
  onSelectAftercare: (e: SummerEnrollment) => void;
  onSelectFunFriday: (e: SummerEnrollment) => void;
  onSelectSchoolYearAftercare: (e: SummerEnrollment) => void;
  onSelectSchoolYearFunFriday: (e: SummerEnrollment) => void;
  onSelectHomeschool: (app: HomeschoolDropInApp) => void;
  onViewHomeschoolHistory: (app: HomeschoolDropInApp) => void;
  onSelectSchoolYearHomeschool: (app: HomeschoolDropInApp) => void;
  onViewSchoolYearHomeschoolHistory: (app: HomeschoolDropInApp) => void;
  nonEnrolledApps: NonEnrolledApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidFunFridayByStudent: PaidFunFridayByStudent;
  activeStudentId: string | null;
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  showMultiChildBanner: boolean;
  showMultiChildSchoolYearBanner: boolean;
  onOpenFirstSummer: () => void;
  onSelectSupplyFee: (
    studentId: string,
    programType: "school_year" | "homeschool" | null,
    childGrade: string | null,
  ) => void;
  onSelectSchoolYearTuition: (
    studentId: string,
    childGrade: string | null,
  ) => void;
  paidSupplyFeeByStudent: Record<string, boolean>;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  onTuitionCodeClick: () => void;
}) {
  const nonEnrolledMap = new Map(nonEnrolledApps.map((a) => [a.student_id, a]));

  const isSchoolYearOnly = schoolYearOnlyApps.some(
    (a) => a.student_id === activeStudentId,
  );

  const hasSchoolYearContent =
    isSchoolYearOnly ||
    summerEnrollments.some(
      (e) => e.student_id === activeStudentId && e.program === "both",
    ) ||
    homeschoolDropInApps.some(
      (a) =>
        a.student_id === activeStudentId &&
        (a.drop_in_program === "school_year_26_27" ||
          a.drop_in_program === "both"),
    );

  const isSchoolYearOnlyStudent =
    isSchoolYearOnly ||
    summerEnrollments.some(
      (e) => e.student_id === activeStudentId && e.program === "both",
    ) ||
    homeschoolDropInApps.some(
      (a) =>
        a.student_id === activeStudentId &&
        (a.drop_in_program === "school_year_26_27" ||
          a.drop_in_program === "both"),
    );

  const studentTermKey = `${activeStudentId}-${isSchoolYearOnlyStudent ? "school_year" : "summer"}`;
  const [userTermTab, setUserTermTab] = useState<{
    studentKey: string;
    tab: "summer" | "school_year";
  } | null>(null);
  const defaultTermTab: "summer" | "school_year" = isSchoolYearOnlyStudent
    ? "school_year"
    : "summer";
  const activeTermTab =
    userTermTab?.studentKey === studentTermKey ? userTermTab.tab : defaultTermTab;
  const setActiveTermTab = (tab: "summer" | "school_year") => {
    setUserTermTab({ studentKey: studentTermKey, tab });
  };

  if (
    !isSchoolYearOnly &&
    unpaidSummerEnrollments.length === 0 &&
    pendingRequests.length === 0 &&
    nonEnrolledApps.length === 0 &&
    summerEnrollments.length === 0 &&
    homeschoolDropInApps.length === 0
  ) {
    return <AllCaughtUpCard />;
  }

  // Items with no student_id
  const orphanRequests = pendingRequests.filter((r) => !r.student_id);

  // Items for the active student
  const activeSummerEnrollments = unpaidSummerEnrollments.filter(
    (e) => e.student_id === activeStudentId,
  );
  // All summer enrollments for aftercare (including fully-paid)
  const activeAllSummerEnrollments = summerEnrollments.filter(
    (e) => e.student_id === activeStudentId,
  );
  const activePendingRequests = pendingRequests.filter(
    (r) => r.student_id === activeStudentId,
  );
  const activeHomeschoolApps = homeschoolDropInApps.filter(
    (a) => a.student_id === activeStudentId,
  );

  // Total owed (only pending requests with known amounts)
  const totalCents = (
    activeStudentId === "__other__" ? orphanRequests : activePendingRequests
  ).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);

  const isOtherTab = activeStudentId === "__other__";
  const currentItems = isOtherTab ? orphanRequests : activePendingRequests;
  const currentSummer = isOtherTab ? [] : activeSummerEnrollments;
  const currentAllSummer = isOtherTab ? [] : activeAllSummerEnrollments;
  const currentHomeschool = isOtherTab ? [] : activeHomeschoolApps;

  const activeNonEnrolled = activeStudentId
    ? nonEnrolledMap.get(activeStudentId)
    : undefined;

  // Tab-filtered items
  const showSchoolYearTab =
    hasSchoolYearContent && activeTermTab === "school_year";

  const summerPendingItems = currentItems.filter(
    (r) => r.program !== "school_year_26_27",
  );
  const schoolYearPendingItems = currentItems.filter(
    (r) => r.program === "school_year_26_27",
  );
  const summerHomeschoolApps = currentHomeschool.filter(
    (a) => a.drop_in_program === "summer_26" || a.drop_in_program === "both",
  );
  const schoolYearHomeschoolApps = currentHomeschool.filter(
    (a) =>
      a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both",
  );

  const summerTotalCents = (
    activeStudentId === "__other__" ? orphanRequests : summerPendingItems
  ).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
  const schoolYearTotalCents = schoolYearPendingItems.reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0,
  );

  return (
    <>
      {showMultiChildBanner &&
        (activeTermTab === "summer" || !hasSchoolYearContent) && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#4a7c59]/20 bg-[#4a7c59]/5 px-4 py-3">
            <svg
              className="mt-0.5 shrink-0 text-[#4a7c59]"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold font-body text-[#4a7c59]">
                Pay for all children in one transaction
              </p>
              <p className="text-xs font-body text-gray-500 mt-0.5">
                Add siblings during checkout and pay only one processing fee.
              </p>
            </div>
            <button
              onClick={onOpenFirstSummer}
              className="shrink-0 text-xs font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 rounded-lg px-3 py-1.5 hover:bg-[#4a7c59]/10 transition-colors cursor-pointer"
            >
              View tuition
            </button>
          </div>
        )}
      {showMultiChildSchoolYearBanner && activeTermTab === "school_year" && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#3b6cb7]/20 bg-[#3b6cb7]/5 px-4 py-3">
          <svg
            className="mt-0.5 shrink-0 text-[#3b6cb7]"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-body text-[#3b6cb7]">
              Pay for all children in one transaction
            </p>
            <p className="text-xs font-body text-gray-500 mt-0.5">
              Add siblings during checkout and pay only one processing fee.
            </p>
          </div>
        </div>
      )}
      {hasSchoolYearContent && !isOtherTab && (
        <div className="flex gap-2 mb-4">
          {!isSchoolYearOnlyStudent && (
            <button
              onClick={() => setActiveTermTab("summer")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold font-body transition-colors ${
                activeTermTab === "summer"
                  ? "bg-[#e07a3a] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              ☀️ Summer
            </button>
          )}
          <button
            onClick={() => setActiveTermTab("school_year")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold font-body transition-colors ${
              activeTermTab === "school_year"
                ? "bg-[#4a7c59] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            🎒 School Year
            <span className="inline-flex items-center px-1.5 py-1 rounded-full text-[10px] font-bold bg-[#4a7c59] text-white leading-none">
              New!
            </span>
          </button>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeStudentId}-${activeTermTab}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeInOut" as const }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {activeNonEnrolled ? (
            <NonEnrolledCard app={activeNonEnrolled} />
          ) : showSchoolYearTab ? (
            <div className="col-span-full flex flex-col max-w-2xl mx-auto w-full gap-16 pt-4">
              {(isSchoolYearOnly ||
                summerEnrollments.some(
                  (e) =>
                    e.student_id === activeStudentId && e.program === "both",
                ) ||
                schoolYearHomeschoolApps.length > 0) &&
                (() => {
                  const supplyFeePaid =
                    paidSupplyFeeByStudent[activeStudentId!] ?? false;

                  // Resolve enrollment for step 3
                  const schoolYearOnly = schoolYearOnlyApps.find(
                    (a) => a.student_id === activeStudentId,
                  );
                  const bothEnrollment = summerEnrollments.find(
                    (e) =>
                      e.student_id === activeStudentId && e.program === "both",
                  );
                  const homeschoolApp = schoolYearHomeschoolApps.find(
                    (a) => a.student_id === activeStudentId,
                  );
                  const enrollment =
                    (schoolYearOnly as unknown as SummerEnrollment) ??
                    bothEnrollment ??
                    (homeschoolApp as unknown as SummerEnrollment) ??
                    null;

                  return (
                    <>
                      {/* STEP 1 — Supply Fee */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut",
                          delay: 0,
                        }}
                        className="flex flex-col sm:flex-row sm:items-start gap-4"
                      >
                        {/* Step indicator */}
                        <div className="sm:w-44 shrink-0 flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#4a7c59] text-white`}
                          >
                            {supplyFeePaid ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              "1"
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-body">
                              Step 1
                            </span>
                            <span className="text-sm font-semibold text-gray-700 font-heading leading-tight">
                              Supply Fee
                            </span>
                          </div>
                        </div>
                        {/* Card */}
                        <div className="flex-1">
                          <SupplyFeeCard
                            key="supply-fee"
                            supplyFeePaid={supplyFeePaid}
                            onClick={() => {
                              const grade =
                                schoolYearOnlyApps.find(
                                  (a) => a.student_id === activeStudentId,
                                )?.child_grade ??
                                summerEnrollments.find(
                                  (e) =>
                                    e.student_id === activeStudentId &&
                                    e.program === "both",
                                )?.child_grade ??
                                schoolYearHomeschoolApps.find(
                                  (a) => a.student_id === activeStudentId,
                                )?.child_grade ??
                                null;
                              const programType:
                                | "school_year"
                                | "homeschool"
                                | null = isSchoolYearOnly
                                ? "school_year"
                                : schoolYearHomeschoolApps.length > 0
                                  ? "homeschool"
                                  : summerEnrollments.some(
                                        (e) =>
                                          e.student_id === activeStudentId &&
                                          e.program === "both",
                                      )
                                    ? "school_year"
                                    : null;
                              onSelectSupplyFee(
                                activeStudentId!,
                                programType,
                                grade,
                              );
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* STEP 2 — Tuition */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut",
                          delay: 0.1,
                        }}
                        className="flex flex-col sm:flex-row sm:items-start gap-4"
                      >
                        {/* Step indicator */}
                        <div className="sm:w-44 shrink-0 flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#4a7c59] text-white">
                            2
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-body">
                              Step 2
                            </span>
                            <span className="text-sm font-semibold text-gray-700 font-heading leading-tight">
                              Tuition
                            </span>
                            <span className="hidden sm:block text-xs text-amber-600 font-medium font-body mt-0.5">
                              September tuition due Sept. 1
                            </span>
                          </div>
                        </div>
                        {/* Cards */}
                        <div className="flex-1 flex flex-col gap-3">
                          {schoolYearHomeschoolApps.map((app) => (
                            <HomeschoolSchoolYearCard
                              key={app.id}
                              app={app}
                              studentName={
                                studentMap[app.student_id]?.name ?? null
                              }
                              paidData={paidHomeschoolByStudent[app.student_id]}
                              supplyFeePaid={
                                paidSupplyFeeByStudent[app.student_id] ?? false
                              }
                              onClick={() => onSelectSchoolYearHomeschool(app)}
                              onViewHistory={() =>
                                onViewSchoolYearHomeschoolHistory(app)
                              }
                            />
                          ))}
                          {(isSchoolYearOnly ||
                            summerEnrollments.some(
                              (e) =>
                                e.student_id === activeStudentId &&
                                e.program === "both",
                            ) ||
                            schoolYearHomeschoolApps.length > 0) && (
                            <SchoolYearTuitionCard
                              key="school-year-tuition"
                              supplyFeePaid={supplyFeePaid}
                              paidMonthsCount={
                                (paidSchoolYearByStudent[activeStudentId!] ?? []).length
                              }
                              onClick={() => {
                                const grade =
                                  schoolYearOnlyApps.find(
                                    (a) => a.student_id === activeStudentId,
                                  )?.child_grade ??
                                  summerEnrollments.find(
                                    (e) =>
                                      e.student_id === activeStudentId &&
                                      e.program === "both",
                                  )?.child_grade ??
                                  schoolYearHomeschoolApps.find(
                                    (a) => a.student_id === activeStudentId,
                                  )?.child_grade ??
                                  null;
                                onSelectSchoolYearTuition(
                                  activeStudentId!,
                                  grade,
                                );
                              }}
                            />
                          )}
                          <div className="mt-1">
                            <button
                              onClick={onTuitionCodeClick}
                              className="text-sm font-body text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                            >
                              Have a tuition code?
                            </button>
                          </div>
                        </div>
                      </motion.div>

                      {/* STEP 3 — Optional Add-ons */}
                      {enrollment && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                          className="flex flex-col sm:flex-row sm:items-start gap-4"
                        >
                          {/* Step indicator */}
                          <div className="sm:w-44 shrink-0 flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-violet-100 text-violet-600">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-body">
                                Optional
                              </span>
                              <span className="text-sm font-semibold text-gray-700 font-heading leading-tight">
                                Add-ons
                              </span>
                              <span className="hidden sm:block text-xs text-gray-400 font-body mt-0.5">
                                Friday & aftercare programs
                              </span>
                            </div>
                          </div>
                          {/* Cards */}
                          <div className="flex-1 flex flex-col gap-3">
                            <SchoolYearFunFridayCard
                              studentName={
                                studentMap[enrollment.student_id]?.name ?? null
                              }
                              paidMonthsCount={
                                (paidFunFridayByStudent[enrollment.student_id]?.months ?? [])
                                  .filter((k) => ["aug_26","sep_26","oct_26","nov_26","dec_26","jan_27","feb_27","mar_27","apr_27","may_27"].includes(k)).length
                              }
                              onClick={() =>
                                onSelectSchoolYearFunFriday(enrollment)
                              }
                            />
                            <SchoolYearAftercareCard
                              studentName={
                                studentMap[enrollment.student_id]?.name ?? null
                              }
                              onClick={() =>
                                onSelectSchoolYearAftercare(enrollment)
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </>
                  );
                })()}

              {schoolYearPendingItems.map((req) => (
                <PendingPaymentCard
                  key={req.id}
                  request={req}
                  studentName={
                    req.student_id
                      ? (studentMap[req.student_id]?.name ?? null)
                      : null
                  }
                  onClick={() => onSelectPending(req)}
                />
              ))}
              {!isSchoolYearOnly &&
                !summerEnrollments.some(
                  (e) =>
                    e.student_id === activeStudentId && e.program === "both",
                ) &&
                schoolYearPendingItems.length === 0 &&
                schoolYearHomeschoolApps.length === 0 && <AllCaughtUpCard />}
              {schoolYearTotalCents > 0 && (
                <div
                  className="col-span-1 sm:col-span-2 rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: "#f6faf7" }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    Total owed
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#4a7c59" }}
                  >
                    {formatCents(schoolYearTotalCents)}
                  </span>
                </div>
              )}
            </div>
          ) : currentSummer.length === 0 &&
            (hasSchoolYearContent ? summerPendingItems : currentItems)
              .length === 0 &&
            currentAllSummer.length === 0 &&
            (hasSchoolYearContent ? summerHomeschoolApps : currentHomeschool)
              .length === 0 ? (
            <AllCaughtUpCard />
          ) : (
            <>
              {currentSummer.map((enrollment) => (
                <SummerTuitionCard
                  key={enrollment.student_id}
                  studentName={studentMap[enrollment.student_id]?.name ?? null}
                  paidWeeks={paidWeeksByStudent[enrollment.student_id] ?? []}
                  onClick={() => onSelectSummer(enrollment)}
                />
              ))}
              {currentAllSummer.map((enrollment) => (
                <AftercareCard
                  key={`aftercare-${enrollment.student_id}`}
                  studentName={studentMap[enrollment.student_id]?.name ?? null}
                  onClick={() => onSelectAftercare(enrollment)}
                />
              ))}
              {currentAllSummer.map((enrollment) => (
                <FunFridayCard
                  key={`funfriday-${enrollment.student_id}`}
                  studentName={studentMap[enrollment.student_id]?.name ?? null}
                  paidMonthsCount={
                    (paidFunFridayByStudent[enrollment.student_id]?.months ?? [])
                      .filter((k) => ["may", "jun", "jul", "aug"].includes(k)).length
                  }
                  onClick={() => onSelectFunFriday(enrollment)}
                />
              ))}
              {(hasSchoolYearContent ? summerPendingItems : currentItems).map(
                (req) => (
                  <PendingPaymentCard
                    key={req.id}
                    request={req}
                    studentName={
                      req.student_id
                        ? (studentMap[req.student_id]?.name ?? null)
                        : null
                    }
                    onClick={() => onSelectPending(req)}
                  />
                ),
              )}
              {(hasSchoolYearContent
                ? summerHomeschoolApps
                : currentHomeschool
              ).map((app) => (
                <HomeschoolDropInCard
                  key={app.id}
                  app={app}
                  studentName={studentMap[app.student_id]?.name ?? null}
                  paidData={paidHomeschoolByStudent[app.student_id]}
                  onClick={() => onSelectHomeschool(app)}
                  onViewHistory={() => onViewHomeschoolHistory(app)}
                />
              ))}

              {/* Tuition code */}
              <div className="col-span-1 sm:col-span-2 flex mt-1">
                <button
                  onClick={onTuitionCodeClick}
                  className="text-sm font-body text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                >
                  Have a tuition code?
                </button>
              </div>

              {/* Total bar */}
              {(hasSchoolYearContent ? summerTotalCents : totalCents) > 0 && (
                <div
                  className="col-span-1 sm:col-span-2 rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: "#f6faf7" }}
                >
                  <span className="text-sm text-gray-500 font-body">
                    Total owed
                  </span>
                  <span
                    className="text-base font-bold font-heading"
                    style={{ color: "#4a7c59" }}
                  >
                    {formatCents(
                      hasSchoolYearContent ? summerTotalCents : totalCents,
                    )}
                  </span>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function PendingDetailSidebar({
  pending,
  studentName,
  onClose,
}: {
  pending: PendingPaymentRequest | null;
  studentName: string | null;
  onClose: () => void;
}) {
  return (
    <DetailSidebar
      isOpen={!!pending}
      onClose={onClose}
      title={studentName ?? "Payment Request"}
    >
      {pending && (
        <div className="space-y-4">
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#4a7c59" }}
            onClick={() => {}}
          >
            Pay Now
          </button>
          <SidebarSection title="Payment Details">
            <SidebarField label="Label" value={pending.label} />
            <SidebarField
              label="Program"
              value={formatProgram(pending.program)}
            />
            <SidebarField
              label="Payment Type"
              value={formatPaymentType(pending.payment_type)}
            />
            <SidebarField
              label="Amount"
              value={
                pending.amount_cents != null
                  ? formatCents(pending.amount_cents)
                  : "—"
              }
            />
            <SidebarField
              label="Requested On"
              value={formatDate(pending.created_at)}
            />
            {studentName && (
              <SidebarField label="Student" value={studentName} />
            )}
          </SidebarSection>
        </div>
      )}
    </DetailSidebar>
  );
}

type FullTimeProgram = "summer_26" | "school_year_26_27" | "both";

const FULL_TIME_OPTIONS: {
  value: FullTimeProgram;
  label: string;
  sub: string;
}[] = [
  {
    value: "summer_26",
    label: "Summer 2026",
    sub: "May–Aug · 12 weeks · Mon–Thu",
  },
  {
    value: "school_year_26_27",
    label: "School Year 26–27",
    sub: "Sep–May · Mon–Thu",
  },
  {
    value: "both",
    label: "Both Programs",
    sub: "Summer 2026 + School Year 26–27",
  },
];

function WantToGoFullTimeSection({
  applicationId,
  dropInProgram,
}: {
  applicationId: string;
  dropInProgram: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [selected, setSelected] = useState<FullTimeProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show options relevant to what the parent signed up for as drop-in
  const visibleOptions = FULL_TIME_OPTIONS.filter((opt) => {
    if (dropInProgram === "summer_26")
      return opt.value === "summer_26" || opt.value === "both";
    if (dropInProgram === "school_year_26_27")
      return opt.value === "school_year_26_27" || opt.value === "both";
    return true; // "both" drop-in → show all
  });

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/switch-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, targetProgram: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
        Want to go full-time?
      </h2>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl px-5 py-5 shadow-sm"
      >
        {step === "idle" && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold font-heading text-gray-900 mb-0.5">
                Switch to a full-time program
              </p>
              <p className="text-xs font-body text-gray-500">
                Mon–Thu, every week. Same kids, same teachers, deeper learning.
              </p>
            </div>
            <button
              onClick={() => setStep("confirm")}
              className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold font-body rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Switch to Full-Time
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold font-heading text-gray-900 mb-0.5">
                Which program would you like?
              </p>
              <p className="text-xs font-body text-gray-500">
                Select a full-time program below. Your drop-in enrollment will
                be converted.
              </p>
            </div>

            <div className="space-y-2">
              {visibleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelected(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                    selected === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white/70 hover:border-indigo-300"
                  }`}
                >
                  <div>
                    <p
                      className={`text-xs font-semibold font-body ${selected === opt.value ? "text-indigo-700" : "text-gray-800"}`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs font-body text-gray-400">{opt.sub}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selected === opt.value
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {error && <p className="text-xs font-body text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setStep("idle");
                  setSelected(null);
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold font-body rounded-xl hover:bg-white/60 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected || loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold font-body rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Switching…" : "Confirm Switch"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function WantToAddSummerSection({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/add-summer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
        Want to join Summer 2026?
      </h2>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-5 shadow-sm"
      >
        {step === "idle" && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold font-heading text-gray-900 mb-0.5">
                Add Summer 2026 to your enrollment
              </p>
              <p className="text-xs font-body text-gray-500">
                May–Aug · 12 weeks · Mon–Thu. Keep the same community
                year-round.
              </p>
            </div>
            <button
              onClick={() => setStep("confirm")}
              className="flex-shrink-0 px-4 py-2 bg-amber-500 text-white text-xs font-semibold font-body rounded-xl hover:bg-amber-600 transition-colors whitespace-nowrap"
            >
              Add Summer Program
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold font-heading text-gray-900 mb-0.5">
                Add Summer 2026?
              </p>
              <p className="text-xs font-body text-gray-500">
                This will add the Summer 2026 program (May–Aug, 12 weeks,
                Mon–Thu) to your enrollment. You&apos;ll be able to select and
                pay for weeks right here.
              </p>
            </div>

            {error && <p className="text-xs font-body text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setStep("idle");
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold font-body rounded-xl hover:bg-white/60 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-amber-500 text-white text-xs font-semibold font-body rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding…" : "Yes, Add Summer"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SchoolYearComingSoonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className="bg-white border border-gray-100 rounded-2xl px-5 py-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold font-heading text-gray-800 mb-1">
            School Year Tuition — Not Available Yet
          </p>
          <p className="text-xs font-body text-gray-500 leading-relaxed">
            Tuition for the 2026–27 school year will open a few weeks before
            school starts. We&apos;ll notify you when it&apos;s ready to pay.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function UpgradeToFullTimeCard({ childNames }: { childNames: string[] }) {
  const nameLabel =
    childNames.length === 1
      ? childNames[0]
      : childNames.slice(0, -1).join(", ") + " & " + childNames.at(-1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl px-6 py-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
          <Sparkles className="w-3 h-3" />
          For {nameLabel}
        </span>
      </div>
      <h3 className="text-lg font-bold font-heading text-gray-900 mb-1">
        Go full-time at Sage Field.
      </h3>
      <p className="text-sm font-body text-gray-500 mb-5">
        Mon–Thu, every week. Same kids, same teachers, deeper learning.
      </p>

      {/* Plan comparison cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Drop-In */}
        <div className="bg-white/70 border border-gray-200 rounded-xl px-4 py-4">
          <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-3">
            Drop-In (current)
          </p>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs font-body text-gray-400 mb-0.5">
                3-Day / School Year
              </p>
              <p className="text-xl font-bold font-heading text-gray-700">
                $720
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </p>
              <p className="text-xs font-body text-gray-400">
                Primary · $780/mo
              </p>
            </div>
          </div>
        </div>

        {/* Full-Time */}
        <div className="bg-indigo-600 border border-indigo-600 rounded-xl px-4 py-4 relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full whitespace-nowrap">
            Best Value
          </span>
          <p className="text-xs font-semibold font-body text-indigo-200 uppercase tracking-wide mb-3">
            Full-Time
          </p>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs font-body text-indigo-300 mb-0.5">
                Mon–Thu / School Year
              </p>
              <p className="text-xl font-bold font-heading text-white">
                $1,095
                <span className="text-sm font-normal text-indigo-300">/mo</span>
              </p>
              <p className="text-xs font-body text-indigo-300">
                Primary · $1,195/mo
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button className="flex-1 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold font-body rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm">
          Apply for Full-Time
        </button>
        <button className="flex-1 px-5 py-2.5 border border-indigo-200 text-indigo-700 text-sm font-semibold font-body rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer">
          See full pricing
        </button>
      </div>
    </motion.div>
  );
}

function TuitionCodeEntryModal({
  parentId,
  onClose,
  onValidated,
}: {
  parentId: string;
  onClose: () => void;
  onValidated: (result: {
    label: string;
    amount_cents: number;
    code: string;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/validate-tuition-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code. Please check and try again.");
        return;
      }
      onValidated(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#ccfbf1" }}
              >
                <Tag
                  className="w-3.5 h-3.5"
                  style={{ color: "#0d9488" }}
                  strokeWidth={2}
                />
              </div>
              <h2 className="text-lg font-bold font-heading text-gray-800">
                Enter Tuition Code
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <p className="text-sm text-gray-500 font-body">
            Enter the tuition code provided by the school.
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SMITH900"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-body font-semibold tracking-widest text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:border-transparent uppercase"
            style={{ "--tw-ring-color": "#0d9488" } as React.CSSProperties}
            autoFocus
          />
          {error && <p className="text-sm text-red-600 font-body">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488" }}
          >
            {loading ? "Checking…" : "Apply Code"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function TuitionCodePaymentModal({
  parentId,
  parentEmail,
  tuitionResult,
  onClose,
}: {
  parentId: string;
  parentEmail: string;
  tuitionResult: { label: string; amount_cents: number; code: string };
  onClose: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { label, amount_cents: intendedAmountCents, code } = tuitionResult;

  const cardFee =
    Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents;
  const achFee = Math.min(Math.round(intendedAmountCents * 0.008), 500);
  const feeCents = coverFees
    ? paymentMethod === "card"
      ? cardFee
      : achFee
    : 0;
  const totalWithFees = intendedAmountCents + feeCents;

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-custom-tuition-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          parentEmail,
          tuitionCode: code,
          label,
          intendedAmountCents,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#ccfbf1" }}
              >
                <Tag
                  className="w-3.5 h-3.5"
                  style={{ color: "#0d9488" }}
                  strokeWidth={2}
                />
              </div>
              <h2 className="text-lg font-bold font-heading text-gray-800">
                Confirm Payment
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5 overflow-y-auto">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <p className="text-xs text-gray-500 font-body mb-1">
              You&apos;re paying for
            </p>
            <p className="text-sm font-semibold text-gray-800 font-body">
              {label}
            </p>
            <p
              className="text-lg font-bold font-heading mt-1"
              style={{ color: "#0d9488" }}
            >
              {formatCents(intendedAmountCents)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 font-body mb-2">
              How will you be paying?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                  paymentMethod === "card"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Credit/Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("ach")}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                  paymentMethod === "ach"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                ACH / US bank account
              </button>
            </div>
            <p className="text-xs text-gray-400 font-body mt-1.5">
              {paymentMethod === "card"
                ? `Processing fee (est.): ~${formatCents(cardFee)}`
                : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`}
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={coverFees}
              onChange={(e) => setCoverFees(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: "#0d9488" }}
            />
            <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
              I agree to pay the processing fee
            </span>
          </label>

          <p className="text-xs text-gray-400 font-body">
            Prefer to pay by check? Email us at{" "}
            <a
              href="mailto:sabrina@sagefield.co"
              className="underline hover:text-gray-600 transition-colors"
            >
              sabrina@sagefield.co
            </a>
          </p>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            disabled={loading || !coverFees}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488" }}
            onClick={handlePayNow}
          >
            {loading
              ? "Processing…"
              : `Pay Now · ${formatCents(totalWithFees)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PayByCheckModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900">
              Pay by Check
            </h2>
            <p
              className="text-sm font-semibold font-body mt-0.5"
              style={{ color: "#0d9488" }}
            >
              No processing fee
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-1 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 pb-6 overflow-y-auto space-y-5">
          {/* Check illustration */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-col gap-1">
                <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
                <div className="w-5 h-0.5 bg-gray-300 rounded-full" />
              </div>
              <span className="text-xs text-gray-400 font-body flex items-center gap-1">
                Date{" "}
                <span className="inline-block w-14 h-px bg-gray-300 align-middle" />
              </span>
            </div>
            <p className="text-xs text-gray-400 font-body mb-1">
              Pay to the Order of
            </p>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm font-semibold font-heading text-gray-800 shadow-sm">
                Sage Field LLC
              </span>
              <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm font-body text-gray-400 shadow-sm min-w-[80px] text-center">
                $
                <span className="inline-block w-10 h-px bg-gray-300 align-middle ml-1" />
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400 font-body">Memo</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold font-heading text-gray-700 shadow-sm">
                Sage Field 2026 – Wks 1, 2, 3
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2.5">
              <p className="text-center text-xs text-gray-400 font-mono tracking-widest">
                ⋮ 0000 ⋮ 0000 0000 ⋮
              </p>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400 font-body -mt-2">
            Example — your check should look like this
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              {
                n: 1,
                title: "Make the check out to",
                body: "Sage Field LLC",
              },
              {
                n: 2,
                title: "On the memo line, write",
                body: 'Include your child\'s name, weeks, and the program name — e.g. "Sage Field 2026 – Weeks 1, 2, 3"',
              },
              {
                n: 3,
                title: "Drop it off",
                body: "Bring it on the first day you come in.",
              },
              {
                n: 4,
                title: "Questions?",
                body: null,
                link: "sabrina@sagefield.co",
              },
            ].map(({ n, title, body, link }) => (
              <div key={n} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-semibold font-heading text-gray-500">
                    {n}
                  </span>
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold font-heading text-gray-900">
                    {title}
                  </p>
                  {body && (
                    <p className="text-sm text-gray-500 font-body mt-0.5">
                      {body}
                    </p>
                  )}
                  {link && (
                    <a
                      href={`mailto:${link}`}
                      className="text-sm font-body underline mt-0.5 block"
                      style={{ color: "#0d9488" }}
                    >
                      {link}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Got it button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2"
            style={{ backgroundColor: "#0d9488" }}
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BillingPage({
  transactions,
  studentMap,
  pendingRequests,
  summerEnrollments,
  unpaidSummerEnrollments,
  paidWeeksByStudent,
  parentId,
  parentEmail,
  nonEnrolledApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  paidAftercareByStudent,
  paidFunFridayByStudent,
  summerNotesByStudent,
  homeschoolNotesByStudent,
  schoolYearOnlyApps,
  hasSubmittedTuitionFeedback,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
}: Props) {
  const [selectedTx, setSelectedTx] = useState<StripeTransaction | null>(null);
  const [selectedPending, setSelectedPending] =
    useState<PendingPaymentRequest | null>(null);
  const [selectedSummerEnrollment, setSelectedSummerEnrollment] =
    useState<SummerEnrollment | null>(null);
  const [selectedAftercareEnrollment, setSelectedAftercareEnrollment] =
    useState<SummerEnrollment | null>(null);
  const [selectedFunFridayEnrollment, setSelectedFunFridayEnrollment] =
    useState<SummerEnrollment | null>(null);
  const [
    selectedSchoolYearAftercareEnrollment,
    setSelectedSchoolYearAftercareEnrollment,
  ] = useState<SummerEnrollment | null>(null);
  const [
    selectedSchoolYearFunFridayEnrollment,
    setSelectedSchoolYearFunFridayEnrollment,
  ] = useState<SummerEnrollment | null>(null);
  const [selectedHomeschoolApp, setSelectedHomeschoolApp] =
    useState<HomeschoolDropInApp | null>(null);
  const [selectedHomeschoolHistoryApp, setSelectedHomeschoolHistoryApp] =
    useState<HomeschoolDropInApp | null>(null);
  const [selectedSchoolYearHomeschoolApp, setSelectedSchoolYearHomeschoolApp] =
    useState<HomeschoolDropInApp | null>(null);
  const [
    selectedSchoolYearHomeschoolHistoryApp,
    setSelectedSchoolYearHomeschoolHistoryApp,
  ] = useState<HomeschoolDropInApp | null>(null);
  const [tuitionCodeModalOpen, setTuitionCodeModalOpen] = useState(false);
  const [payByCheckModalOpen, setPayByCheckModalOpen] = useState(false);
  const [validatedTuitionResult, setValidatedTuitionResult] = useState<{
    label: string;
    amount_cents: number;
    code: string;
  } | null>(null);
  const [feedbackPopupOpen, setFeedbackPopupOpen] = useState(false);
  const [supplyFeeTarget, setSupplyFeeTarget] = useState<{
    studentId: string;
    programType: "school_year" | "homeschool" | null;
    childGrade: string | null;
    applicationId?: string;
    siblingStudents?: Array<{
      studentId: string;
      studentName: string | null;
      childGrade: string | null;
      programType: "school_year" | "homeschool" | null;
      paidSchoolYearMonths: number[];
      applicationId?: string;
    }>;
  } | null>(null);
  const [supplyFeeSiblingTarget, setSupplyFeeSiblingTarget] = useState<{
    primaryStudentId: string;
    primaryGrade: string | null;
    primaryProgramType: "school_year" | "homeschool" | null;
    siblings: Array<{
      studentId: string;
      studentName: string | null;
      childGrade: string | null;
      programType: "school_year" | "homeschool" | null;
    }>;
  } | null>(null);
  const [schoolYearTuitionTarget, setSchoolYearTuitionTarget] = useState<{
    studentId: string;
    childGrade: string | null;
  } | null>(null);
  const [showCommitModal, setShowCommitModal] = useState<string | null>(null); // applicationId
  const [commitModalType, setCommitModalType] = useState<
    "drop_in" | "full_time" | null
  >(null);
  const [commitPaymentMethod, setCommitPaymentMethod] = useState<
    "card" | "ach"
  >("card");
  const [commitCoverFees, setCommitCoverFees] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [tuitionBannerDismissed, setTuitionBannerDismissed] = useState(false);

  const hasPaidAny = transactions.some(
    (tx) => tx.status === "completed" && tx.payment_type !== "registration_fee",
  );

  useEffect(() => {
    if (!hasPaidAny || hasSubmittedTuitionFeedback) return;
    const t = setTimeout(() => setFeedbackPopupOpen(true), 1500);
    return () => clearTimeout(t);
  }, [hasPaidAny, hasSubmittedTuitionFeedback]);

  const nonEnrolledMap = new Map(nonEnrolledApps.map((a) => [a.student_id, a]));

  const studentProgramMap = new Map<string, string>();
  for (const e of summerEnrollments) {
    if (e.program) studentProgramMap.set(e.student_id, e.program);
  }
  for (const e of homeschoolDropInApps) {
    // Only set from homeschoolDropInApps if the student's primary program is actually
    // a homeschool/drop-in variant — don't overwrite a summer_26-only enrollment
    const prog = e.drop_in_program ?? "homeschool_drop_in";
    if (
      !studentProgramMap.has(e.student_id) ||
      e.drop_in_program === "homeschool_drop_in"
    ) {
      studentProgramMap.set(e.student_id, prog);
    }
  }
  for (const a of nonEnrolledApps) {
    if (a.program) studentProgramMap.set(a.student_id, a.program);
  }
  for (const a of schoolYearOnlyApps) {
    if (!studentProgramMap.has(a.student_id)) {
      studentProgramMap.set(a.student_id, "school_year_26_27");
    }
  }

  // Collect all unique student IDs for the sidebar
  const allStudentIds = [
    ...new Set([
      ...summerEnrollments.map((e) => e.student_id),
      ...(pendingRequests.map((r) => r.student_id).filter(Boolean) as string[]),
      ...nonEnrolledApps.map((a) => a.student_id),
      ...homeschoolDropInApps.map((a) => a.student_id),
      ...schoolYearOnlyApps.map((a) => a.student_id),
    ]),
  ];
  const orphanRequests = pendingRequests.filter((r) => !r.student_id);
  const hasOrphans = orphanRequests.length > 0;

  const [activeStudentId, setActiveStudentId] = useState<string | null>(
    allStudentIds[0] ?? null,
  );

  const nonEnrolledStudentIds = new Set(
    nonEnrolledApps.map((a) => a.student_id),
  );
  const visibleTransactions = transactions.filter((tx) => {
    const meta = (tx.metadata ?? {}) as Record<string, string>;
    return (
      (!tx.student_id || !nonEnrolledStudentIds.has(tx.student_id)) &&
      meta.is_sibling_split !== "true" &&
      meta.bundled_with_supply_fee !== "true"
    );
  });

  const multiChildSummerEligible =
    unpaidSummerEnrollments.filter(
      (e) => e.program === "summer_26" || e.program === "both",
    ).length >= 2;

  const multiChildSchoolYearEligible =
    [
      ...schoolYearOnlyApps.map((a) => a.student_id),
      ...summerEnrollments
        .filter((e) => e.program === "both")
        .map((e) => e.student_id),
      ...homeschoolDropInApps
        .filter(
          (a) =>
            a.drop_in_program === "school_year_26_27" ||
            a.drop_in_program === "both",
        )
        .map((a) => a.student_id),
    ].length >= 2;

  // School-year students with unpaid supply fees — used for sibling pre-step
  const schoolYearStudentsForSupplyFee: Array<{
    studentId: string;
    childGrade: string | null;
    programType: "school_year" | "homeschool" | null;
  }> = [
    ...schoolYearOnlyApps
      .filter((a) => !paidSupplyFeeByStudent[a.student_id])
      .map((a) => ({
        studentId: a.student_id,
        childGrade: a.child_grade ?? null,
        programType: "school_year" as const,
      })),
    ...summerEnrollments
      .filter(
        (e) => e.program === "both" && !paidSupplyFeeByStudent[e.student_id],
      )
      .map((e) => ({
        studentId: e.student_id,
        childGrade: e.child_grade ?? null,
        programType: "school_year" as const,
      })),
    ...homeschoolDropInApps
      .filter(
        (a) =>
          (a.drop_in_program === "school_year_26_27" ||
            a.drop_in_program === "both") &&
          !paidSupplyFeeByStudent[a.student_id],
      )
      .map((a) => ({
        studentId: a.student_id,
        childGrade: a.child_grade ?? null,
        programType: "homeschool" as const,
      })),
  ];

  const hasPendingContent =
    unpaidSummerEnrollments.length > 0 ||
    pendingRequests.length > 0 ||
    nonEnrolledApps.length > 0 ||
    summerEnrollments.length > 0 ||
    homeschoolDropInApps.length > 0 ||
    schoolYearOnlyApps.length > 0;

  const showSidebar = allStudentIds.length > 0 || hasOrphans;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left: Children sidebar ── */}
      {showSidebar && (
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto px-3 pt-8 gap-1 bg-white border-r border-gray-100">
          <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">
            Children
          </p>
          {allStudentIds.map((id) => {
            const isNonEnrolled = nonEnrolledMap.has(id);
            const studentInfo = studentMap[id];
            const name = isNonEnrolled
              ? (nonEnrolledMap.get(id)!.name ?? "Student")
              : (studentInfo?.name ?? "Unknown");
            const profileImageUrl = isNonEnrolled
              ? null
              : (studentInfo?.profileImageUrl ?? null);
            const isActive = activeStudentId === id;
            const programLabel = formatProgramLabel(studentProgramMap.get(id));
            return (
              <button
                key={id}
                onClick={() => setActiveStudentId(id)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#4a7c59]/10 text-gray-800"
                    : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                }`}
              >
                <StudentTabAvatar
                  id={id}
                  name={name}
                  profileImageUrl={profileImageUrl}
                  isActive={isActive}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-body font-medium truncate leading-tight">
                    {name}
                  </p>
                  {programLabel && (
                    <p className="text-xs font-body text-gray-400 truncate leading-tight">
                      {programLabel}
                    </p>
                  )}
                </div>
                {isNonEnrolled && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
          {hasOrphans && (
            <button
              onClick={() => setActiveStudentId("__other__")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeStudentId === "__other__"
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              <span className="text-sm font-body font-medium">Other</span>
            </button>
          )}
        </aside>
      )}

      {/* ── Right: Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: horizontal child tab bar */}
        <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-2 border-b border-gray-100 bg-white shrink-0">
          {allStudentIds.map((id) => {
            const isNonEnrolled = nonEnrolledMap.has(id);
            const studentInfo = studentMap[id];
            const name = isNonEnrolled
              ? (nonEnrolledMap.get(id)!.name ?? "Student")
              : (studentInfo?.name ?? "Unknown");
            const profileImageUrl = isNonEnrolled
              ? null
              : (studentInfo?.profileImageUrl ?? null);
            const isActive = activeStudentId === id;
            return (
              <button
                key={id}
                onClick={() => setActiveStudentId(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? "bg-[#4a7c59]/10 text-gray-800"
                    : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                }`}
              >
                <StudentTabAvatar
                  id={id}
                  name={name}
                  profileImageUrl={profileImageUrl}
                  isActive={isActive}
                />
                <span className="max-w-[10ch] truncate">{name}</span>
              </button>
            );
          })}
          {hasOrphans && (
            <button
              onClick={() => setActiveStudentId("__other__")}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm font-body font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeStudentId === "__other__"
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              Other
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {!tuitionBannerDismissed && (
            <div className="max-w-5xl mx-auto px-6 pt-6">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Info size={16} className="text-amber-500 shrink-0" />
                <p className="flex-1 text-sm font-semibold text-amber-800">
                  September tuition due <span className="font-bold">Sept. 1</span>.
                </p>
                <button
                  onClick={() => setTuitionBannerDismissed(true)}
                  className="text-amber-400 hover:text-amber-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
                Tuition &amp; Billing
              </h1>
              {(() => {
                const activeProgram = activeStudentId
                  ? studentProgramMap.get(activeStudentId)
                  : undefined;
                const programBadgeLabel = formatProgramLabel(activeProgram);
                const activeHomeschoolApp = homeschoolDropInApps.find(
                  (a) => a.student_id === activeStudentId,
                );
                const dropInBadgeLabel =
                  activeProgram === "homeschool_drop_in" && activeHomeschoolApp
                    ? formatDropInProgramLabel(
                        activeHomeschoolApp.drop_in_program,
                      )
                    : null;
                if (!programBadgeLabel) return null;
                const fullName = activeStudentId
                  ? studentMap[activeStudentId]?.name
                  : null;
                const firstName = fullName
                  ? fullName.trim().split(/\s+/)[0]
                  : null;
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                    {firstName && (
                      <span className="text-xs font-body text-gray-400">
                        {firstName}&apos;s programs:
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body bg-[#d4e6d0] text-[#4a7c59]">
                        {programBadgeLabel}
                      </span>
                      {dropInBadgeLabel && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body bg-amber-100 text-amber-700">
                          {dropInBadgeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {(() => {
              const activeHomeschoolDropIn = homeschoolDropInApps.find(
                (a) => a.student_id === activeStudentId,
              );
              if (
                !activeHomeschoolDropIn ||
                activeHomeschoolDropIn.drop_in_program !== "summer_26"
              )
                return null;

              // Hide if student already committed to school year
              const alreadyCommitted = summerEnrollments.some(
                (e) => e.student_id === activeStudentId && e.program === "both",
              );
              if (alreadyCommitted) return null;

              const childFirstName = (() => {
                const full =
                  studentMap[activeHomeschoolDropIn.student_id]?.name ?? null;
                return full ? full.trim().split(/\s+/)[0] : null;
              })();
              return (
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" as const }}
                    className="bg-gradient-to-br from-[#f0f9f4] to-[#e8f5ec] border border-[#4a7c59]/20 rounded-2xl px-5 py-5 shadow-sm"
                  >
                    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                      <div>
                        <p className="text-sm font-semibold font-heading text-gray-900 mb-0.5">
                          Secure{" "}
                          {childFirstName
                            ? `${childFirstName}'s`
                            : "your child's"}{" "}
                          spot for 2026–2027
                        </p>
                        <p className="text-xs font-body text-gray-500">
                          {childFirstName
                            ? `Want to make sure ${childFirstName}'s spot is ready for the 2026–2027 school year?`
                            : "Want to make sure your child's spot is ready for the 2026–2027 school year?"}{" "}
                          If your family plans to continue, secure their place
                          now.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCommitPaymentMethod("card");
                          setCommitCoverFees(false);
                          setCommitError(null);
                          setCommitModalType("drop_in");
                          setShowCommitModal(activeHomeschoolDropIn.id);
                        }}
                        className="w-full md:w-auto flex-shrink-0 px-4 py-2 text-white text-xs font-semibold font-body rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                        style={{ backgroundColor: "#4a7c59" }}
                      >
                        Commit to School Year
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}

            {(() => {
              // Don't show if drop-in banner already showing (avoid duplicates)
              const hasDropIn = homeschoolDropInApps.some(
                (a) =>
                  a.student_id === activeStudentId &&
                  a.drop_in_program === "summer_26",
              );
              if (hasDropIn) return null;

              const activeSummer = summerEnrollments.find(
                (e) =>
                  e.student_id === activeStudentId && e.program === "summer_26",
              );
              if (!activeSummer) return null;

              // Hide if student already committed to school year
              const alreadyCommitted = summerEnrollments.some(
                (e) => e.student_id === activeStudentId && e.program === "both",
              );
              if (alreadyCommitted) return null;

              const childFirstName = (() => {
                const full = studentMap[activeSummer.student_id]?.name ?? null;
                return full ? full.trim().split(/\s+/)[0] : null;
              })();

              return (
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" as const }}
                    className="bg-gradient-to-br from-[#f0f9f4] to-[#e8f5ec] border border-[#4a7c59]/20 rounded-2xl px-5 py-5 shadow-sm"
                  >
                    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                      <div>
                        <p className="text-sm font-semibold font-heading text-gray-900 mb-0.5">
                          Secure{" "}
                          {childFirstName
                            ? `${childFirstName}'s`
                            : "your child's"}{" "}
                          spot for 2026–2027
                        </p>
                        <p className="text-xs font-body text-gray-500">
                          {childFirstName
                            ? `Want to make sure ${childFirstName}'s spot is ready for the 2026–2027 school year?`
                            : "Want to make sure your child's spot is ready for the 2026–2027 school year?"}{" "}
                          If your family plans to continue, secure their place
                          now.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCommitPaymentMethod("card");
                          setCommitCoverFees(false);
                          setCommitError(null);
                          setCommitModalType("full_time");
                          setShowCommitModal(activeSummer.id);
                        }}
                        className="w-full md:w-auto flex-shrink-0 px-4 py-2 text-white text-xs font-semibold font-body rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                        style={{ backgroundColor: "#4a7c59" }}
                      >
                        Commit to School Year
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}

            {hasPendingContent && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold font-heading text-gray-700">
                    Pending Payments
                  </h2>
                  <button
                    onClick={() => setPayByCheckModalOpen(true)}
                    className="text-sm font-body text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                  >
                    Want to pay by check?
                  </button>
                </div>
                <PendingPaymentsSection
                  summerEnrollments={summerEnrollments}
                  unpaidSummerEnrollments={unpaidSummerEnrollments}
                  pendingRequests={pendingRequests}
                  studentMap={studentMap}
                  paidWeeksByStudent={paidWeeksByStudent}
                  onSelectSummer={setSelectedSummerEnrollment}
                  onSelectPending={setSelectedPending}
                  onSelectAftercare={setSelectedAftercareEnrollment}
                  onSelectFunFriday={setSelectedFunFridayEnrollment}
                  onSelectSchoolYearAftercare={
                    setSelectedSchoolYearAftercareEnrollment
                  }
                  onSelectSchoolYearFunFriday={
                    setSelectedSchoolYearFunFridayEnrollment
                  }
                  onSelectHomeschool={setSelectedHomeschoolApp}
                  onViewHomeschoolHistory={setSelectedHomeschoolHistoryApp}
                  onSelectSchoolYearHomeschool={
                    setSelectedSchoolYearHomeschoolApp
                  }
                  onViewSchoolYearHomeschoolHistory={
                    setSelectedSchoolYearHomeschoolHistoryApp
                  }
                  nonEnrolledApps={nonEnrolledApps}
                  homeschoolDropInApps={homeschoolDropInApps}
                  paidHomeschoolByStudent={paidHomeschoolByStudent}
                  paidFunFridayByStudent={paidFunFridayByStudent}
                  activeStudentId={activeStudentId}
                  schoolYearOnlyApps={schoolYearOnlyApps}
                  showMultiChildBanner={multiChildSummerEligible}
                  showMultiChildSchoolYearBanner={multiChildSchoolYearEligible}
                  onOpenFirstSummer={() =>
                    setSelectedSummerEnrollment(
                      unpaidSummerEnrollments.find(
                        (e) =>
                          e.program === "summer_26" || e.program === "both",
                      ) ?? null,
                    )
                  }
                  onSelectSupplyFee={(studentId, programType, childGrade) => {
                    const siblings = schoolYearStudentsForSupplyFee
                      .filter((s) => s.studentId !== studentId)
                      .map((s) => ({
                        studentId: s.studentId,
                        studentName: studentMap[s.studentId]?.name ?? null,
                        childGrade: s.childGrade,
                        programType: s.programType,
                      }));
                    const homeschoolApp = homeschoolDropInApps.find(
                      (a) => a.student_id === studentId,
                    );
                    if (siblings.length > 0) {
                      setSupplyFeeSiblingTarget({
                        primaryStudentId: studentId,
                        primaryGrade: childGrade,
                        primaryProgramType: programType,
                        siblings,
                      });
                    } else {
                      setSupplyFeeTarget({
                        studentId,
                        programType,
                        childGrade,
                        applicationId: homeschoolApp?.id,
                      });
                    }
                  }}
                  onSelectSchoolYearTuition={(id, grade) =>
                    setSchoolYearTuitionTarget({
                      studentId: id,
                      childGrade: grade,
                    })
                  }
                  paidSupplyFeeByStudent={paidSupplyFeeByStudent}
                  paidSchoolYearByStudent={paidSchoolYearByStudent}
                  onTuitionCodeClick={() => setTuitionCodeModalOpen(true)}
                />
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
                Payment History
              </h2>
              {visibleTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-16 text-center">
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
                    style={{ backgroundColor: "#d4e6d0" }}
                  >
                    <Receipt
                      className="w-6 h-6"
                      style={{ color: "#4a7c59" }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-base font-semibold font-heading text-gray-700 mb-1">
                    No transactions yet
                  </p>
                  <p className="text-sm font-body text-gray-400">
                    Your payment history will appear here once a transaction is
                    processed.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs font-body">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Description
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Student
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          Type
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right whitespace-nowrap">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="px-4 py-3.5 text-gray-800 max-w-[220px] truncate">
                            {(() => {
                              if (tx.description) return tx.description;
                              const txMeta = (tx.metadata ?? {}) as Record<
                                string,
                                string
                              >;
                              if (tx.payment_type === "supply_fee") {
                                return txMeta.bundle_type
                                  ? "Annual Supply Fee + August 2026 Tuition"
                                  : "Annual Supply Fee";
                              }
                              return "—";
                            })()}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 max-w-[180px] truncate">
                            {(() => {
                              const primaryName =
                                studentMap[tx.student_id ?? ""]?.name ?? "—";
                              const meta = (tx.metadata ?? {}) as Record<
                                string,
                                string
                              >;
                              const sibIds =
                                (tx.payment_type === "supply_fee" &&
                                meta.bundle_type
                                  ? meta.sibling_supply_student_ids
                                  : meta.sibling_student_ids
                                )
                                  ?.split(",")
                                  .filter(Boolean) ?? [];
                              if (sibIds.length === 0) return primaryName;
                              const sibNames = sibIds
                                .map((id) => studentMap[id]?.name)
                                .filter(Boolean);
                              return sibNames.length > 0
                                ? [primaryName, ...sibNames].join(", ")
                                : primaryName;
                            })()}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                            {(() => {
                              const txMeta = (tx.metadata ?? {}) as Record<
                                string,
                                string
                              >;
                              if (
                                tx.payment_type === "supply_fee" &&
                                txMeta.bundle_type
                              ) {
                                return "Supply Fee + School Year Tuition";
                              }
                              return formatPaymentType(tx.payment_type);
                            })()}
                          </td>
                          <td className="px-4 py-3.5 text-gray-800 text-right whitespace-nowrap font-semibold">
                            {formatCents(tx.amount_cents)}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={tx.status} />
                          </td>
                          <td className="px-4 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PendingDetailSidebar
        pending={selectedPending}
        studentName={
          selectedPending?.student_id
            ? (studentMap[selectedPending.student_id]?.name ?? null)
            : null
        }
        onClose={() => setSelectedPending(null)}
      />

      <DetailSidebar
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
      >
        {selectedTx &&
          (() => {
            const meta = (selectedTx.metadata ?? {}) as Record<string, string>;

            const isSupplyFeeCheckout =
              selectedTx.payment_type === "supply_fee";
            const isSupplyFeeBundle =
              isSupplyFeeCheckout && !!meta.bundle_type;

            // Sibling IDs — supply fee uses sibling_supply_student_ids, others use sibling_student_ids
            const sibIds = isSupplyFeeCheckout
              ? (meta.sibling_supply_student_ids?.split(",").filter(Boolean) ??
                [])
              : (meta.sibling_student_ids?.split(",").filter(Boolean) ?? []);

            // Sibling amounts (non-supply-fee transactions only)
            const sibCentsArr = isSupplyFeeCheckout
              ? []
              : (meta.sibling_intended_cents
                  ?.split(",")
                  .map(Number)
                  .filter(Boolean) ?? []);

            const sibCentsTotal = sibCentsArr.reduce((a, b) => a + b, 0);

            const primaryIntended =
              !isSupplyFeeCheckout && selectedTx.intended_amount_cents != null
                ? selectedTx.intended_amount_cents - sibCentsTotal
                : null;
            const primaryWeeks = meta.weeks?.split(",").filter(Boolean) ?? [];
            const primaryPlan =
              meta.plan_type === "full"
                ? "Full Summer"
                : primaryWeeks.length > 0
                  ? `${primaryWeeks.length} week${primaryWeeks.length !== 1 ? "s" : ""} · Weekly`
                  : null;
            const sibWeekGroups = meta.sibling_weeks?.split(";") ?? [];
            const sibPlanTypes = meta.sibling_plan_types?.split(",") ?? [];
            const fee =
              selectedTx.cover_fees && selectedTx.intended_amount_cents != null
                ? selectedTx.amount_cents - selectedTx.intended_amount_cents
                : 0;

            function getSubLine(): string | null {
              if (selectedTx!.payment_type === "summer_tuition") return null;
              if (meta.selected_months) {
                if (selectedTx!.payment_type === "school_year_tuition") {
                  const formatted = formatSchoolYearMonthsFromMetadata(
                    meta.selected_months,
                    "short",
                  );
                  if (formatted) return formatted;
                }
                const months = meta.selected_months.split(",").filter(Boolean);
                if (months.length > 0) return months.join(", ");
              }
              if (selectedTx!.payment_type === "homeschool_dropin") {
                return formatHomeschoolSubline(meta);
              }
              if (meta.selected_weeks) {
                const wks = meta.selected_weeks.split(",").filter(Boolean);
                if (wks.length > 0)
                  return `${wks.length} week${wks.length !== 1 ? "s" : ""}`;
              }
              if (meta.selected_fridays) {
                const fridays = meta.selected_fridays
                  .split(",")
                  .filter(Boolean);
                if (fridays.length > 0)
                  return `${fridays.length} Friday${fridays.length !== 1 ? "s" : ""}`;
              }
              return null;
            }
            const nonSummerSubLine = getSubLine();
            const hasSiblings = sibIds.length > 0;
            const hasStudents = !!selectedTx.student_id || hasSiblings;

            return (
              <div className="space-y-0 font-body">
                {/* Header: status + date */}
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={selectedTx.status} />
                  <span className="text-xs text-gray-400">
                    {formatDate(selectedTx.created_at)}
                  </span>
                </div>

                {/* Type + description */}
                <p className="text-base font-semibold text-gray-800 mt-3">
                  {isSupplyFeeBundle
                    ? "Supply Fee + School Year Tuition"
                    : formatPaymentType(selectedTx.payment_type)}
                </p>
                {selectedTx.description && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {selectedTx.description}
                  </p>
                )}

                <div className="border-t border-gray-100 my-4" />

                {/* Students & amounts */}
                {hasStudents && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      {hasSiblings ? "Students & Amounts" : "Student"}
                    </p>

                    {isSupplyFeeCheckout ? (
                      <>
                        {selectedTx.student_id && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 font-medium mb-1.5">
                              {studentMap[selectedTx.student_id]?.name ?? "—"}
                            </p>
                            <div className="space-y-1">
                              {buildSupplyFeeStudentLines(
                                meta,
                                selectedTx.student_id,
                                true,
                              ).map((line) => (
                                <div key={line.label}>
                                  <div className="flex justify-between items-baseline text-xs">
                                    <span className="text-gray-500">
                                      {line.label}
                                    </span>
                                    <span className="text-gray-700">
                                      {formatCents(line.amountCents)}
                                    </span>
                                  </div>
                                  {line.sublabel && (
                                    <p className="text-xs text-gray-400">
                                      {line.sublabel}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {sibIds.map((sibId) => (
                          <div key={sibId} className="mb-3">
                            <p className="text-sm text-gray-700 font-medium mb-1.5">
                              {studentMap[sibId]?.name ?? sibId}
                            </p>
                            <div className="space-y-1">
                              {buildSupplyFeeStudentLines(meta, sibId, false).map(
                                (line) => (
                                  <div key={line.label}>
                                    <div className="flex justify-between items-baseline text-xs">
                                      <span className="text-gray-500">
                                        {line.label}
                                      </span>
                                      <span className="text-gray-700">
                                        {formatCents(line.amountCents)}
                                      </span>
                                    </div>
                                    {line.sublabel && (
                                      <p className="text-xs text-gray-400">
                                        {line.sublabel}
                                      </p>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Primary student */}
                        {selectedTx.student_id && (
                          <div className="mb-3">
                            <div className="flex justify-between items-baseline text-sm">
                              <span className="text-gray-700 font-medium">
                                {studentMap[selectedTx.student_id]?.name ?? "—"}
                              </span>
                              {primaryIntended != null && (
                                <span className="text-gray-800 font-semibold">
                                  {formatCents(primaryIntended)}
                                </span>
                              )}
                            </div>
                            {primaryPlan && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {primaryPlan}
                              </p>
                            )}
                            {nonSummerSubLine && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {nonSummerSubLine}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Siblings */}
                        {sibIds.map((sibId, i) => {
                          const sibName = studentMap[sibId]?.name ?? sibId;
                          const sibWeeks =
                            sibWeekGroups[i]?.split(",").filter(Boolean) ?? [];
                          const sibPlan =
                            sibPlanTypes[i] === "full"
                              ? "Full Summer"
                              : sibWeeks.length > 0
                                ? `${sibWeeks.length} week${sibWeeks.length !== 1 ? "s" : ""} · Weekly`
                                : null;
                          const sibCents = sibCentsArr[i] ?? 0;
                          return (
                            <div key={sibId} className="mb-3">
                              <div className="flex justify-between items-baseline text-sm">
                                <span className="text-gray-700 font-medium">
                                  {sibName}
                                </span>
                                {sibCents > 0 && (
                                  <span className="text-gray-800 font-semibold">
                                    {formatCents(sibCents)}
                                  </span>
                                )}
                              </div>
                              {sibPlan && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {sibPlan}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    <div className="border-t border-gray-100 my-4" />
                  </>
                )}

                {/* Totals */}
                <div className="space-y-2">
                  {selectedTx.intended_amount_cents != null && (
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">
                        {formatCents(selectedTx.intended_amount_cents)}
                      </span>
                    </div>
                  )}
                  {selectedTx.cover_fees && fee > 0 && (
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-gray-500">Card processing fee</span>
                      <span className="text-gray-700">{formatCents(fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-sm font-semibold border-t border-gray-200 pt-3 mt-1">
                    <span className="text-gray-800">Total charged</span>
                    <span className="text-gray-800">
                      {formatCents(selectedTx.amount_cents)}
                    </span>
                  </div>
                </div>

                {/* Payer */}
                {selectedTx.payer_email && (
                  <>
                    <div className="border-t border-gray-100 my-4" />
                    <p className="text-xs text-gray-400">
                      Paid by{" "}
                      <span className="text-gray-600">
                        {selectedTx.payer_email}
                      </span>
                    </p>
                  </>
                )}
              </div>
            );
          })()}
      </DetailSidebar>

      <AnimatePresence>
        {selectedSummerEnrollment && (
          <SummerPaymentModal
            enrollment={selectedSummerEnrollment}
            studentName={
              studentMap[selectedSummerEnrollment.student_id]?.name ?? null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidWeeks={
              paidWeeksByStudent[selectedSummerEnrollment.student_id] ?? []
            }
            initialNote={
              summerNotesByStudent[selectedSummerEnrollment.student_id] ?? ""
            }
            onClose={() => setSelectedSummerEnrollment(null)}
            siblingEnrollments={unpaidSummerEnrollments.filter(
              (e) =>
                e.student_id !== selectedSummerEnrollment.student_id &&
                e.program !== "homeschool_drop_in",
            )}
            siblingPaidWeeks={paidWeeksByStudent}
            siblingStudentMap={studentMap}
          />
        )}
        {selectedAftercareEnrollment && (
          <AftercarePaymentModal
            enrollment={selectedAftercareEnrollment}
            studentName={
              studentMap[selectedAftercareEnrollment.student_id]?.name ?? null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidMonths={
              new Set(
                paidAftercareByStudent[selectedAftercareEnrollment.student_id]
                  ?.months ?? [],
              )
            }
            paidDays={
              new Set([
                ...(paidAftercareByStudent[
                  selectedAftercareEnrollment.student_id
                ]?.days ?? []),
                ...(
                  paidAftercareByStudent[selectedAftercareEnrollment.student_id]
                    ?.months ?? []
                ).flatMap(
                  (mk) =>
                    AFTERCARE_MONTHS.find((m) => m.key === mk)?.days.map(
                      (d) => d.date,
                    ) ?? [],
                ),
              ])
            }
            onClose={() => setSelectedAftercareEnrollment(null)}
          />
        )}
        {selectedFunFridayEnrollment && (
          <FunFridayPaymentModal
            enrollment={selectedFunFridayEnrollment}
            studentName={
              studentMap[selectedFunFridayEnrollment.student_id]?.name ?? null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidMonths={
              new Set(
                paidFunFridayByStudent[selectedFunFridayEnrollment.student_id]
                  ?.months ?? [],
              )
            }
            paidFridays={
              new Set([
                ...(paidFunFridayByStudent[
                  selectedFunFridayEnrollment.student_id
                ]?.fridays ?? []),
                ...(
                  paidFunFridayByStudent[selectedFunFridayEnrollment.student_id]
                    ?.months ?? []
                ).flatMap(
                  (mk) =>
                    FUN_FRIDAY_MONTHS.find((m) => m.key === mk)?.fridays.map(
                      (d) => d.date,
                    ) ?? [],
                ),
              ])
            }
            onClose={() => setSelectedFunFridayEnrollment(null)}
          />
        )}
        {selectedSchoolYearAftercareEnrollment && (
          <SchoolYearAftercarePaymentModal
            enrollment={selectedSchoolYearAftercareEnrollment}
            studentName={
              studentMap[selectedSchoolYearAftercareEnrollment.student_id]
                ?.name ?? null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidMonths={
              new Set(
                paidAftercareByStudent[
                  selectedSchoolYearAftercareEnrollment.student_id
                ]?.months ?? [],
              )
            }
            paidDays={
              new Set([
                ...(paidAftercareByStudent[
                  selectedSchoolYearAftercareEnrollment.student_id
                ]?.days ?? []),
                ...(
                  paidAftercareByStudent[
                    selectedSchoolYearAftercareEnrollment.student_id
                  ]?.months ?? []
                ).flatMap(
                  (mk) =>
                    SCHOOL_YEAR_AFTERCARE_MONTHS.find(
                      (m) => m.key === mk,
                    )?.days.map((d) => d.date) ?? [],
                ),
              ])
            }
            onClose={() => setSelectedSchoolYearAftercareEnrollment(null)}
          />
        )}
        {selectedSchoolYearFunFridayEnrollment && (
          <SchoolYearFunFridayPaymentModal
            enrollment={selectedSchoolYearFunFridayEnrollment}
            studentName={
              studentMap[selectedSchoolYearFunFridayEnrollment.student_id]
                ?.name ?? null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidMonths={
              new Set(
                paidFunFridayByStudent[
                  selectedSchoolYearFunFridayEnrollment.student_id
                ]?.months ?? [],
              )
            }
            paidFridays={
              new Set([
                ...(paidFunFridayByStudent[
                  selectedSchoolYearFunFridayEnrollment.student_id
                ]?.fridays ?? []),
                ...(
                  paidFunFridayByStudent[
                    selectedSchoolYearFunFridayEnrollment.student_id
                  ]?.months ?? []
                ).flatMap(
                  (mk) =>
                    SCHOOL_YEAR_FUN_FRIDAY_MONTHS.find(
                      (m) => m.key === mk,
                    )?.fridays.map((d) => d.date) ?? [],
                ),
              ])
            }
            onClose={() => setSelectedSchoolYearFunFridayEnrollment(null)}
          />
        )}
        {selectedHomeschoolApp && (
          <HomeschoolPaymentModal
            app={selectedHomeschoolApp}
            studentName={
              studentMap[selectedHomeschoolApp.student_id]?.name ?? null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidData={paidHomeschoolByStudent[selectedHomeschoolApp.student_id]}
            initialNote={
              homeschoolNotesByStudent[selectedHomeschoolApp.student_id] ?? ""
            }
            onClose={() => setSelectedHomeschoolApp(null)}
          />
        )}
        {selectedHomeschoolHistoryApp &&
          paidHomeschoolByStudent[selectedHomeschoolHistoryApp.student_id] && (
            <HomeschoolPlanHistoryModal
              app={selectedHomeschoolHistoryApp}
              studentName={
                studentMap[selectedHomeschoolHistoryApp.student_id]?.name ??
                null
              }
              paidData={
                paidHomeschoolByStudent[selectedHomeschoolHistoryApp.student_id]
              }
              onClose={() => setSelectedHomeschoolHistoryApp(null)}
              onAddMore={() => {
                setSelectedHomeschoolApp(selectedHomeschoolHistoryApp);
                setSelectedHomeschoolHistoryApp(null);
              }}
            />
          )}
        {selectedSchoolYearHomeschoolApp && (
          <HomeschoolSchoolYearModal
            app={selectedSchoolYearHomeschoolApp}
            studentName={
              studentMap[selectedSchoolYearHomeschoolApp.student_id]?.name ??
              null
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidData={
              paidHomeschoolByStudent[
                selectedSchoolYearHomeschoolApp.student_id
              ]
            }
            onClose={() => setSelectedSchoolYearHomeschoolApp(null)}
            siblingApps={homeschoolDropInApps.filter(
              (a) =>
                a.id !== selectedSchoolYearHomeschoolApp.id &&
                (a.drop_in_program === "school_year_26_27" ||
                  a.drop_in_program === "both") &&
                paidSupplyFeeByStudent[a.student_id],
            )}
            siblingPaidHomeschool={paidHomeschoolByStudent}
            siblingStudentMap={studentMap}
          />
        )}
        {selectedSchoolYearHomeschoolHistoryApp &&
          paidHomeschoolByStudent[
            selectedSchoolYearHomeschoolHistoryApp.student_id
          ] && (
            <HomeschoolPlanHistoryModal
              app={selectedSchoolYearHomeschoolHistoryApp}
              studentName={
                studentMap[selectedSchoolYearHomeschoolHistoryApp.student_id]
                  ?.name ?? null
              }
              paidData={
                paidHomeschoolByStudent[
                  selectedSchoolYearHomeschoolHistoryApp.student_id
                ]
              }
              onClose={() => setSelectedSchoolYearHomeschoolHistoryApp(null)}
              onAddMore={() => {
                setSelectedSchoolYearHomeschoolApp(
                  selectedSchoolYearHomeschoolHistoryApp,
                );
                setSelectedSchoolYearHomeschoolHistoryApp(null);
              }}
            />
          )}
        {supplyFeeSiblingTarget && (
          <SupplyFeeSiblingModal
            primaryStudentId={supplyFeeSiblingTarget.primaryStudentId}
            primaryStudentName={
              studentMap[supplyFeeSiblingTarget.primaryStudentId]?.name ?? null
            }
            primaryGrade={supplyFeeSiblingTarget.primaryGrade}
            primaryProgramType={supplyFeeSiblingTarget.primaryProgramType}
            siblings={supplyFeeSiblingTarget.siblings}
            onClose={() => setSupplyFeeSiblingTarget(null)}
            onContinue={(selectedSiblingIds) => {
              const selectedSiblings = supplyFeeSiblingTarget.siblings.filter(
                (s) => selectedSiblingIds.includes(s.studentId),
              );
              setSupplyFeeSiblingTarget(null);
              setSupplyFeeTarget({
                studentId: supplyFeeSiblingTarget.primaryStudentId,
                programType: supplyFeeSiblingTarget.primaryProgramType,
                childGrade: supplyFeeSiblingTarget.primaryGrade,
                applicationId: homeschoolDropInApps.find(
                  (a) =>
                    a.student_id === supplyFeeSiblingTarget.primaryStudentId,
                )?.id,
                siblingStudents: selectedSiblings.map((s) => ({
                  ...s,
                  applicationId: homeschoolDropInApps.find(
                    (a) => a.student_id === s.studentId,
                  )?.id,
                  paidSchoolYearMonths:
                    paidSchoolYearByStudent[s.studentId] ?? [],
                })),
              });
            }}
          />
        )}
        {supplyFeeTarget && (
          <SupplyFeeModal
            studentId={supplyFeeTarget.studentId}
            studentName={studentMap[supplyFeeTarget.studentId]?.name ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            onClose={() => setSupplyFeeTarget(null)}
            programType={supplyFeeTarget.programType}
            childGrade={supplyFeeTarget.childGrade}
            paidSchoolYearMonths={
              paidSchoolYearByStudent[supplyFeeTarget.studentId] ?? []
            }
            siblingStudents={supplyFeeTarget.siblingStudents}
            applicationId={supplyFeeTarget.applicationId}
            paidHomeschoolByStudent={paidHomeschoolByStudent}
          />
        )}
        {schoolYearTuitionTarget && (
          <SchoolYearTuitionModal
            studentId={schoolYearTuitionTarget.studentId}
            studentName={
              studentMap[schoolYearTuitionTarget.studentId]?.name ?? null
            }
            childGrade={schoolYearTuitionTarget.childGrade}
            parentId={parentId}
            parentEmail={parentEmail}
            onClose={() => setSchoolYearTuitionTarget(null)}
            paidMonthIndices={
              new Set(
                paidSchoolYearByStudent[schoolYearTuitionTarget.studentId] ??
                  [],
              )
            }
            siblingStudents={[
              ...schoolYearOnlyApps.filter(
                (a) => a.student_id !== schoolYearTuitionTarget.studentId,
              ),
              ...summerEnrollments
                .filter(
                  (e) =>
                    e.student_id !== schoolYearTuitionTarget.studentId &&
                    e.program === "both",
                )
                .map((e) => ({
                  student_id: e.student_id,
                  child_grade: e.child_grade,
                })),
            ].filter((s) => paidSupplyFeeByStudent[s.student_id])}
            siblingPaidSchoolYear={paidSchoolYearByStudent}
            siblingStudentMap={studentMap}
          />
        )}
        {showCommitModal &&
          (() => {
            const commitApp =
              commitModalType === "full_time"
                ? (summerEnrollments.find((e) => e.id === showCommitModal) ??
                  null)
                : (homeschoolDropInApps.find((a) => a.id === showCommitModal) ??
                  null);
            if (!commitApp) return null;
            const studentName = studentMap[commitApp.student_id]?.name ?? null;
            const BASE_CENTS = 50000;
            const cardFee =
              Math.round((BASE_CENTS + 30) / (1 - 0.029)) - BASE_CENTS;
            const achFee = Math.min(Math.round(BASE_CENTS * 0.008), 500);
            const feeAmount = commitPaymentMethod === "card" ? cardFee : achFee;
            const totalWithFees = commitCoverFees
              ? BASE_CENTS + feeAmount
              : BASE_CENTS;

            const handleCommitPay = async () => {
              setCommitLoading(true);
              setCommitError(null);
              try {
                const res = await fetch(
                  "/api/stripe/create-registration-checkout",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      parentId,
                      parentEmail,
                      studentId: commitApp.student_id,
                      applicationId: commitApp.id,
                      ...(commitModalType === "full_time"
                        ? { program: "school_year_26_27" }
                        : {
                            program: "homeschool_drop_in",
                            dropInProgram: "school_year_26_27",
                          }),
                      coverFees: commitCoverFees,
                      paymentMethod: commitPaymentMethod,
                    }),
                  },
                );
                const data = await res.json();
                if (!res.ok || !data.url)
                  throw new Error(
                    data.error ?? "Failed to create checkout session",
                  );
                window.location.href = data.url;
              } catch (err) {
                setCommitError(
                  err instanceof Error ? err.message : "Something went wrong",
                );
                setCommitLoading(false);
              }
            };

            return (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <motion.div
                  className="absolute inset-0 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCommitModal(null)}
                />
                <motion.div
                  className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      <h2 className="text-base font-bold font-heading text-gray-800">
                        School Year 2026–2027 Registration Fee
                      </h2>
                      {studentName && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {studentName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCommitModal(null)}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    <div
                      className="rounded-xl px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: "#f0f9f4" }}
                    >
                      <span className="text-sm text-gray-500 font-body">
                        Registration fee
                      </span>
                      <span
                        className="text-base font-bold font-heading"
                        style={{ color: "#4a7c59" }}
                      >
                        $500.00
                      </span>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
                      <p className="text-xs font-semibold font-heading text-gray-700">
                        What this covers
                      </p>
                      <p className="text-xs font-body text-gray-500">
                        {studentName
                          ? `${studentName} will`
                          : "Your child will"}{" "}
                        remain enrolled as a{" "}
                        <span className="font-semibold text-gray-700">
                          {commitModalType === "full_time"
                            ? "Full Time"
                            : "Homeschool Drop-In"}
                        </span>{" "}
                        student and will also be secured for the{" "}
                        <span className="font-semibold text-gray-700">
                          2026–2027 School Year
                        </span>{" "}
                        program. This $500 registration fee holds their spot.
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        Payment method
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCommitPaymentMethod("card")}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${commitPaymentMethod === "card" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          Credit/Debit Card
                        </button>
                        <button
                          onClick={() => setCommitPaymentMethod("ach")}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${commitPaymentMethod === "ach" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          ACH / US bank account
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 font-body mt-1.5">
                        {commitPaymentMethod === "card"
                          ? `Processing fee (est.): ~${formatCents(cardFee)}`
                          : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`}
                      </p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={commitCoverFees}
                        onChange={(e) => setCommitCoverFees(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: "#4a7c59" }}
                      />
                      <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                        I agree to pay the processing fee
                      </span>
                    </label>
                  </div>
                  {commitError && (
                    <div className="px-6 pb-2">
                      <p className="text-xs text-red-500 font-body">
                        {commitError}
                      </p>
                    </div>
                  )}
                  <div className="px-6 py-4 border-t border-gray-100">
                    <button
                      disabled={commitLoading || !commitCoverFees}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#4a7c59" }}
                      onClick={handleCommitPay}
                    >
                      {commitLoading
                        ? "Processing…"
                        : `Pay Now · ${formatCents(totalWithFees)}`}
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        {payByCheckModalOpen && (
          <PayByCheckModal onClose={() => setPayByCheckModalOpen(false)} />
        )}
        {tuitionCodeModalOpen && !validatedTuitionResult && (
          <TuitionCodeEntryModal
            parentId={parentId}
            onClose={() => setTuitionCodeModalOpen(false)}
            onValidated={(result) => setValidatedTuitionResult(result)}
          />
        )}
        {validatedTuitionResult && (
          <TuitionCodePaymentModal
            parentId={parentId}
            parentEmail={parentEmail}
            tuitionResult={validatedTuitionResult}
            onClose={() => {
              setValidatedTuitionResult(null);
              setTuitionCodeModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
      <TuitionFeedbackPopup
        isOpen={feedbackPopupOpen}
        onClose={() => setFeedbackPopupOpen(false)}
        onSubmit={submitTuitionFeedback}
      />
    </div>
  );
}
