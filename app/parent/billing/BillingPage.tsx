"use client";

import { useState } from "react";
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

// --- Aftercare pricing ---
const AFTERCARE_DAILY_CENTS = 3500; // $35/day
const AFTERCARE_MONTHLY_CENTS = 37500; // $375/month

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
      { label: "Fri May 30", date: "2026-05-30" },
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
      { label: "Fri Jun 12", date: "2026-06-12" },
      { label: "Mon Jun 15", date: "2026-06-15" },
      { label: "Tue Jun 16", date: "2026-06-16" },
      { label: "Wed Jun 17", date: "2026-06-17" },
      { label: "Thu Jun 18", date: "2026-06-18" },
      { label: "Fri Jun 19", date: "2026-06-19" },
      { label: "Mon Jun 22", date: "2026-06-22" },
      { label: "Tue Jun 23", date: "2026-06-23" },
      { label: "Wed Jun 24", date: "2026-06-24" },
      { label: "Thu Jun 25", date: "2026-06-25" },
      { label: "Fri Jun 26", date: "2026-06-26" },
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
      { label: "Fri Jul 3", date: "2026-07-03" },
      { label: "Mon Jul 6", date: "2026-07-06" },
      { label: "Tue Jul 7", date: "2026-07-07" },
      { label: "Wed Jul 8", date: "2026-07-08" },
      { label: "Thu Jul 9", date: "2026-07-09" },
      { label: "Mon Jul 13", date: "2026-07-13" },
      { label: "Tue Jul 14", date: "2026-07-14" },
      { label: "Wed Jul 15", date: "2026-07-15" },
      { label: "Thu Jul 16", date: "2026-07-16" },
      { label: "Fri Jul 17", date: "2026-07-17" },
      { label: "Mon Jul 20", date: "2026-07-20" },
      { label: "Tue Jul 21", date: "2026-07-21" },
      { label: "Wed Jul 22", date: "2026-07-22" },
      { label: "Thu Jul 23", date: "2026-07-23" },
      { label: "Fri Jul 24", date: "2026-07-24" },
      { label: "Mon Jul 27", date: "2026-07-27" },
      { label: "Tue Jul 28", date: "2026-07-28" },
      { label: "Wed Jul 29", date: "2026-07-29" },
      { label: "Thu Jul 30", date: "2026-07-30" },
      { label: "Fri Jul 31", date: "2026-07-31" },
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
      { label: "Fri Aug 7", date: "2026-08-07" },
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
    ? month.days.length * AFTERCARE_DAILY_CENTS
    : AFTERCARE_MONTHLY_CENTS;
}

// --- Fun Friday pricing ---
const FUN_FRIDAY_MONTHLY_CENTS = 20000; // $200/month (4 sessions)
const FUN_FRIDAY_DROPIN_CENTS = 6000; // $60/session

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
    fridays: [{ label: "Fri Aug 7", date: "2026-08-07" }],
  },
];

function funFridayMonthCents(
  month: (typeof FUN_FRIDAY_MONTHS)[number],
): number {
  return month.fridays.length === 1
    ? FUN_FRIDAY_DROPIN_CENTS
    : FUN_FRIDAY_MONTHLY_CENTS;
}

// --- Homeschool Drop-In pricing ---
// Summer: per-week rates
const HOMESCHOOL_SUMMER_PRICING = {
  dropin: { primary: 10000, upper: 9500 }, // $100/day, $95/day
  "2day": { primary: 18000, upper: 17000 }, // $180/wk, $170/wk
  "3day": { primary: 25500, upper: 24000 }, // $255/wk, $240/wk
} as const;

// School Year: per-month rates
const HOMESCHOOL_SCHOOL_YEAR_PRICING = {
  dropin: { primary: 12000, upper: 11000 }, // $120/day, $110/day
  "2day": { primary: 56000, upper: 52000 }, // $560/mo, $520/mo
  "3day": { primary: 78000, upper: 72000 }, // $780/mo, $720/mo
} as const;

type HomeschoolTier = "dropin" | "2day" | "3day";

const HOMESCHOOL_TIERS: {
  key: HomeschoolTier;
  label: string;
  sub: string;
  days: number;
}[] = [
  { key: "dropin", label: "Explorer Day Pass", sub: "Drop-In", days: 1 },
  { key: "2day", label: "2 Days / Week", sub: "Part-Time", days: 2 },
  { key: "3day", label: "3 Days / Week", sub: "Part-Time", days: 3 },
];

const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
] as const;

function deriveTier(dayCount: number): HomeschoolTier {
  if (dayCount === 1) return "dropin";
  if (dayCount === 2) return "2day";
  return "3day";
}

function getGradeTier(grade: string | null): "primary" | "upper" {
  if (!grade) return "upper";
  const g = grade.toLowerCase().trim();
  if (
    [
      "pre-k",
      "prek",
      "pre k",
      "kindergarten",
      "k",
      "1st",
      "1",
      "1st grade",
    ].includes(g)
  )
    return "primary";
  return "upper";
}

function gradeTierLabel(tier: "primary" | "upper"): string {
  return tier === "primary" ? "Primary (Pre-K\u20131st)" : "2nd\u20134th Grade";
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
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
                    {entry.days.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Days: {entry.days.map(dayLabel).join(", ")}
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

  const hasSummer = (paidData?.summer.length ?? 0) > 0;
  const hasSchoolYear = (paidData?.schoolYear.length ?? 0) > 0;
  const hasPriorPayment = hasSummer || hasSchoolYear;

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
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white border border-gray-100 flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src="/assets/Homeschool.jpg"
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        <span
          className={`absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${hasPriorPayment ? "bg-emerald-500 text-white" : "bg-white/80 backdrop-blur-sm text-gray-600"}`}
        >
          {badgeLabel}
        </span>
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
        </div>
      </div>
    </div>
  );
}

function HomeschoolPaymentModal({
  app,
  studentName,
  parentId,
  parentEmail,
  paidData,
  onClose,
}: {
  app: HomeschoolDropInApp;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidData?: PaidHomeschoolByStudent[string];
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

function SummerPaymentModal({
  enrollment,
  studentName,
  parentId,
  parentEmail,
  paidWeeks,
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidWeeks: number[];
  onClose: () => void;
}) {
  const isOnWeeklyPlan = paidWeeks.length > 0;
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [tab, setTab] = useState<"weekly" | "full">("weekly");
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            style={{ backgroundColor: "#4a7c59" }}
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
            Extended Learning (3:30 – 5pm)
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
          src="/assets/ImageEleven.jpg"
          alt=""
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
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
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
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
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDay(date: string) {
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
                    return (
                      <motion.button
                        key={m.key}
                        onClick={() => toggleMonth(m.key)}
                        className="flex flex-col gap-1 rounded-xl px-4 py-4 text-left cursor-pointer transition-colors"
                        animate={{
                          backgroundColor: selected ? "#fff7f3" : "#f9fafb",
                        }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          selected ? { boxShadow: "inset 3px 0 0 #e07a3a" } : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              selected
                                ? { backgroundColor: "#e07a3a" }
                                : {
                                    backgroundColor: "transparent",
                                    border: "2px solid #d1d5db",
                                  }
                            }
                          >
                            {selected && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold font-heading text-gray-800">
                            {m.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-body mt-1 ml-7">
                          {m.days.length} days ·{" "}
                          {aftercareMonthCents(m) === AFTERCARE_MONTHLY_CENTS
                            ? `${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
                            : formatCents(aftercareMonthCents(m))}
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
                                  return (
                                    <button
                                      key={d.date}
                                      onClick={() => toggleDay(d.date)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors cursor-pointer border ${
                                        sel
                                          ? "text-white border-transparent"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                                      }`}
                                      style={
                                        sel
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
  onClose,
}: {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
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
  ).reduce((sum, m) => sum + funFridayMonthCents(m), 0);
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
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleFriday(date: string) {
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
                Monthly
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
                    return (
                      <motion.button
                        key={m.key}
                        onClick={() => toggleMonth(m.key)}
                        className="flex flex-col gap-1 rounded-xl px-4 py-4 text-left cursor-pointer transition-colors"
                        animate={{
                          backgroundColor: selected ? "#f5f3ff" : "#f9fafb",
                        }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        style={
                          selected ? { boxShadow: "inset 3px 0 0 #7c3aed" } : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                            style={
                              selected
                                ? { backgroundColor: "#7c3aed" }
                                : {
                                    backgroundColor: "transparent",
                                    border: "2px solid #d1d5db",
                                  }
                            }
                          >
                            {selected && (
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold font-heading text-gray-800">
                            {m.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-body mt-1 ml-7">
                          {m.fridays.length} Friday
                          {m.fridays.length !== 1 ? "s" : ""} ·{" "}
                          {m.fridays.length === 1
                            ? formatCents(FUN_FRIDAY_DROPIN_CENTS)
                            : `${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo`}
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
                            (m) => m.fridays.length !== 1,
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
                  $60/session.
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
                                  return (
                                    <button
                                      key={d.date}
                                      onClick={() => toggleFriday(d.date)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors cursor-pointer border ${
                                        sel
                                          ? "text-white border-transparent"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                                      }`}
                                      style={
                                        sel
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
  onSelectHomeschool,
  onViewHomeschoolHistory,
  nonEnrolledApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  activeStudentId,
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
  onSelectHomeschool: (app: HomeschoolDropInApp) => void;
  onViewHomeschoolHistory: (app: HomeschoolDropInApp) => void;
  nonEnrolledApps: NonEnrolledApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  activeStudentId: string | null;
}) {
  const nonEnrolledMap = new Map(nonEnrolledApps.map((a) => [a.student_id, a]));

  if (
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeStudentId}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: "easeInOut" as const }}
        className="grid grid-cols-2 gap-3"
      >
        {activeNonEnrolled ? (
          <NonEnrolledCard app={activeNonEnrolled} />
        ) : currentSummer.length === 0 &&
          currentItems.length === 0 &&
          currentAllSummer.length === 0 &&
          currentHomeschool.length === 0 ? (
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
                onClick={() => onSelectFunFriday(enrollment)}
              />
            ))}
            {currentItems.map((req) => (
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
            {currentHomeschool.map((app) => (
              <HomeschoolDropInCard
                key={app.id}
                app={app}
                studentName={studentMap[app.student_id]?.name ?? null}
                paidData={paidHomeschoolByStudent[app.student_id]}
                onClick={() => onSelectHomeschool(app)}
                onViewHistory={() => onViewHomeschoolHistory(app)}
              />
            ))}

            {/* Total bar */}
            {totalCents > 0 && (
              <div
                className="col-span-2 rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "#f6faf7" }}
              >
                <span className="text-sm text-gray-500 font-body">
                  Total owed
                </span>
                <span
                  className="text-base font-bold font-heading"
                  style={{ color: "#4a7c59" }}
                >
                  {formatCents(totalCents)}
                </span>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
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
  const [selectedHomeschoolApp, setSelectedHomeschoolApp] =
    useState<HomeschoolDropInApp | null>(null);
  const [selectedHomeschoolHistoryApp, setSelectedHomeschoolHistoryApp] =
    useState<HomeschoolDropInApp | null>(null);

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

  // Collect all unique student IDs for the sidebar
  const allStudentIds = [
    ...new Set([
      ...summerEnrollments.map((e) => e.student_id),
      ...(pendingRequests.map((r) => r.student_id).filter(Boolean) as string[]),
      ...nonEnrolledApps.map((a) => a.student_id),
      ...homeschoolDropInApps.map((a) => a.student_id),
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
  const visibleTransactions = transactions.filter(
    (tx) => !tx.student_id || !nonEnrolledStudentIds.has(tx.student_id),
  );

  const hasPendingContent =
    unpaidSummerEnrollments.length > 0 ||
    pendingRequests.length > 0 ||
    nonEnrolledApps.length > 0 ||
    summerEnrollments.length > 0 ||
    homeschoolDropInApps.length > 0;

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
      <div className="flex-1 overflow-y-auto">
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
                <div className="flex items-center gap-2 mt-2">
                  {firstName && (
                    <span className="text-xs font-body text-gray-400">
                      {firstName}&apos;s programs:
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body bg-[#d4e6d0] text-[#4a7c59]">
                    {programBadgeLabel}
                  </span>
                  {dropInBadgeLabel && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body bg-amber-100 text-amber-700">
                      {dropInBadgeLabel}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {hasPendingContent && (
            <div>
              <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
                Pending Payments
              </h2>
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
                onSelectHomeschool={setSelectedHomeschoolApp}
                onViewHomeschoolHistory={setSelectedHomeschoolHistoryApp}
                nonEnrolledApps={nonEnrolledApps}
                homeschoolDropInApps={homeschoolDropInApps}
                paidHomeschoolByStudent={paidHomeschoolByStudent}
                activeStudentId={activeStudentId}
              />
            </div>
          )}

          {(() => {
            const activeHomeschoolDropIn = homeschoolDropInApps.find(
              (a) => a.student_id === activeStudentId,
            );
            const eligible =
              !!activeHomeschoolDropIn &&
              (activeHomeschoolDropIn.drop_in_program === "summer_26" ||
                activeHomeschoolDropIn.drop_in_program === "both");
            if (!eligible) return null;
            return (
              <WantToGoFullTimeSection
                applicationId={activeHomeschoolDropIn.id}
                dropInProgram={activeHomeschoolDropIn.drop_in_program}
              />
            );
          })()}

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
                          {tx.description ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {studentMap[tx.student_id ?? ""]?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {formatPaymentType(tx.payment_type)}
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
        {selectedTx && (
          <div className="space-y-2">
            <SidebarSection title="Payment">
              <SidebarField
                label="Amount"
                value={formatCents(selectedTx.amount_cents)}
              />
              {selectedTx.intended_amount_cents != null && (
                <SidebarField
                  label="Base Amount"
                  value={formatCents(selectedTx.intended_amount_cents)}
                />
              )}
              <SidebarField
                label="Type"
                value={formatPaymentType(selectedTx.payment_type)}
              />
              <SidebarField label="Status" value={selectedTx.status} />
              <SidebarField
                label="Student"
                value={
                  selectedTx.student_id
                    ? (studentMap[selectedTx.student_id]?.name ?? "—")
                    : "—"
                }
              />
              <SidebarField
                label="Description"
                value={selectedTx.description}
              />
              <SidebarField
                label="Date"
                value={formatDate(selectedTx.created_at)}
              />
              <SidebarField
                label="Cover Fees"
                value={selectedTx.cover_fees ? "Yes" : "No"}
              />
            </SidebarSection>

            <SidebarSection title="Payer">
              <SidebarField label="Name" value={selectedTx.payer_name} />
              <SidebarField label="Email" value={selectedTx.payer_email} />
            </SidebarSection>
          </div>
        )}
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
            onClose={() => setSelectedSummerEnrollment(null)}
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
            onClose={() => setSelectedFunFridayEnrollment(null)}
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
      </AnimatePresence>
    </div>
  );
}
