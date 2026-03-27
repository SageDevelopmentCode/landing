"use client";

import { useState } from "react";
import { Receipt, CheckCircle2, Sun, X, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
import type { StripeTransaction, PendingPaymentRequest, SummerEnrollment, PaidWeeksByStudent, NonEnrolledApp } from "./page";

interface Props {
  transactions: StripeTransaction[];
  studentMap: Record<string, string>;
  pendingRequests: PendingPaymentRequest[];
  summerEnrollments: SummerEnrollment[];
  unpaidSummerEnrollments: SummerEnrollment[];
  paidWeeksByStudent: PaidWeeksByStudent;
  parentId: string;
  parentEmail: string;
  nonEnrolledApps: NonEnrolledApp[];
}

// --- Summer pricing ---
const SUMMER_WEEKLY_CENTS = { primary: 37500, upper: 35000 };
const SUMMER_FULL_CENTS = { primary: 405000, upper: 378000 };
const SUMMER_FULL_ORIGINAL_CENTS = { primary: 450000, upper: 420000 };
const TOTAL_WEEKS = 12;

const SUMMER_WEEKS = [
  { week: 1, dates: "May 26\u201329", theme: "Welcome to Camp" },
  { week: 2, dates: "Jun 1\u20134", theme: "Mystery Camp Escape Challenge" },
  { week: 3, dates: "Jun 8\u201311", theme: "Beach Day Bash" },
  { week: 4, dates: "Jun 15\u201318", theme: "Scientist and Space Engineering Lab" },
  { week: 5, dates: "Jun 22\u201325", theme: "Safari Escape" },
  { week: 6, dates: "Jun 29\u2013Jul 2", theme: "Splash Into Summer" },
  { week: 7, dates: "Jul 6\u20139", theme: "Dino Hunt" },
  { week: 8, dates: "Jul 13\u201316", theme: "Pirate Adventure" },
  { week: 9, dates: "Jul 20\u201323", theme: "You are a Superhero!" },
  { week: 10, dates: "Jul 27\u201330", theme: "Space Explorers: Mission to the Stars" },
  { week: 11, dates: "Aug 3\u20136", theme: "Down on the Farm" },
  { week: 12, dates: "Aug 10\u201313", theme: "Finale of Camp" },
];

function getGradeTier(grade: string | null): "primary" | "upper" {
  if (!grade) return "upper";
  const g = grade.toLowerCase().trim();
  if (["pre-k", "prek", "pre k", "kindergarten", "k", "1st", "1", "1st grade"].includes(g)) return "primary";
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
      className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
      >
        {getInitials(studentName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">
            {request.label}
          </span>
          <span className="text-xs text-gray-400">&mdash;</span>
          <span className="text-xs text-gray-500">{formatProgram(request.program)}</span>
        </div>
        {studentName && (
          <div className="text-xs text-gray-400 mt-0.5">
            Student: {studentName}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <span
          className="text-sm font-semibold"
          style={{ color: "#4a7c59" }}
        >
          {request.amount_cents != null ? `Pay ${formatCents(request.amount_cents)}` : "Pay Now"}
        </span>
        <ChevronRight className="w-4 h-4" style={{ color: "#4a7c59" }} strokeWidth={2} />
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
      className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
      >
        {getInitials(studentName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">Summer Program Tuition</span>
          <span className="text-xs text-gray-400">&mdash;</span>
          <span className="text-xs text-gray-500">Summer 2026</span>
        </div>
        {hasPaidWeeks && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              {paidWeeks.length} week{paidWeeks.length !== 1 ? "s" : ""} paid
            </span>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <span className="text-sm font-semibold" style={{ color: "#e07a3a" }}>
          {hasPaidWeeks ? "Pay for more weeks" : "Select plan"}
        </span>
        <ChevronRight className="w-4 h-4" style={{ color: "#e07a3a" }} strokeWidth={2} />
      </div>
    </div>
  );
}

function NonEnrolledCard({ app }: { app: NonEnrolledApp }) {
  return (
    <a
      href={`/parent/dashboard?app=${app.id}`}
      className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors no-underline"
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
        <div className="text-xs text-amber-600 mt-0.5">Enrollment not complete</div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-amber-700">Complete enrollment</span>
        <ChevronRight className="w-4 h-4 text-amber-700" strokeWidth={2} />
      </div>
    </a>
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
      : Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents
    : 0;
  const totalWithFees = intendedAmountCents + feeCents;

  const cardFeeDisplay = Math.round(((intendedAmountCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay  = Math.min(Math.round((intendedAmountCents / 100) * 0.008 * 100) / 100, 5.0);

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
                  <Sun className="w-3.5 h-3.5" style={{ color: "#e07a3a" }} strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  Summer 2026 Tuition
                </h2>
              </div>
              {studentName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-body">{studentName}</span>
                  {enrollment.child_grade && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {enrollment.child_grade}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">· {gradeTierLabel(tier)}</span>
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
          {step === "plan" && <div className="flex gap-2 mt-4">
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
              onClick={() => { if (!isOnWeeklyPlan) setTab("full"); }}
              title={isOnWeeklyPlan ? "Not available — you're on the weekly plan" : undefined}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                isOnWeeklyPlan
                  ? "bg-gray-100 text-gray-400 opacity-40 cursor-not-allowed"
                  : tab === "full"
                  ? "text-white cursor-pointer"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
              }`}
              style={!isOnWeeklyPlan && tab === "full" ? { backgroundColor: "#4a7c59" } : {}}
            >
              Full Summer
              <span
                className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                style={
                  !isOnWeeklyPlan && tab === "full"
                    ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                    : { backgroundColor: "#d4e6d0", color: "#4a7c59" }
                }
              >
                10% off
              </span>
            </button>
          </div>}
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
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* Payment method toggle */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 font-body mb-2">
                  How will you be paying?
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod("card")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}>
                    Credit/Debit Card
                  </button>
                  <button type="button" onClick={() => setPaymentMethod("ach")}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                      paymentMethod === "ach"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}>
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
                <input type="checkbox" checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer" />
                <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
                  I agree to pay the processing fee
                </span>
              </label>

              <p className="text-xs text-gray-400 font-body mb-5">
                Prefer to pay by check? Email us at{" "}
                <a href="mailto:sabrina@sagefield.co"
                  className="underline hover:text-gray-600 transition-colors">
                  sabrina@sagefield.co
                </a>{" "}
                and we&apos;ll send you instructions.
              </p>

              {error && <p className="text-sm text-red-600 font-body mb-4">{error}</p>}

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
              transition={{ duration: 0.2, ease: "easeInOut" }}
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
                      setSelectedWeeks(new Set(SUMMER_WEEKS.map((w) => w.week)));
                    }
                  }}
                  className="text-xs font-semibold cursor-pointer transition-colors"
                  style={{ color: "#4a7c59" }}
                >
                  {selectedWeeks.size === TOTAL_WEEKS ? "Deselect All" : "Select All"}
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
                        backgroundColor: isPaid ? "#f0fdf4" : selected ? "#f0f7f1" : "#f9fafb",
                      }}
                      whileTap={isPaid ? {} : { scale: 0.99 }}
                      transition={{ duration: 0.15 }}
                      style={isPaid ? { boxShadow: "inset 3px 0 0 #16a34a" } : selected ? { boxShadow: "inset 3px 0 0 #4a7c59" } : {}}
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
                              : { backgroundColor: "transparent", border: "2px solid #d1d5db" }
                          }
                        >
                          {(isPaid || selected) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-semibold font-heading ${isPaid ? "text-green-700" : "text-gray-800"}`}>
                          Week {w.week}
                        </span>
                      </div>
                      <p className={`text-xs font-body ${isPaid ? "text-green-600" : "text-gray-400"}`}>{w.dates}</p>
                      {isPaid ? (
                        <p className="text-xs font-semibold text-green-600 font-body">Paid ✓</p>
                      ) : (
                        <p className="text-xs text-gray-500 font-body truncate">{w.theme}</p>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Running total */}
              <motion.div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: allWeeksSelected ? "#f0f7f1" : "#f6faf7" }}
                layout
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-0.5">
                  {isOnWeeklyPlan && paidWeeks.length > 0 && (
                    <span className="text-xs text-green-600 font-body">
                      {paidWeeks.length} week{paidWeeks.length !== 1 ? "s" : ""} already paid
                    </span>
                  )}
                  <span className="text-sm text-gray-500 font-body">
                    {selectedWeeks.size === 0
                      ? isOnWeeklyPlan ? "Select more weeks to pay for" : "No weeks selected"
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
                    {selectedWeeks.size > 0 ? formatCents(effectiveTotal) : "—"}
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
              transition={{ duration: 0.2, ease: "easeInOut" }}
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
                <p className="text-xs text-gray-500 font-body mb-0.5">{gradeTierLabel(tier)}</p>
                <p className="text-3xl font-bold font-heading text-gray-800 mb-1">
                  {formatCents(fullRate)}
                </p>
                <p className="text-sm text-gray-400 font-body">
                  <span className="line-through">{formatCents(fullOriginal)}</span>
                  <span className="ml-1.5 text-gray-500">&middot; {formatCents(savings)} off</span>
                </p>
                <p className="text-xs text-gray-400 font-body mt-3">
                  Monday&ndash;Thursday, 9am&ndash;3pm &middot; May 26 &ndash; Aug 13, 2026
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
                      <Check className="w-3 h-3" style={{ color: "#4a7c59" }} strokeWidth={3} />
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

function AllCaughtUpCard() {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-8 text-center">
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

function PendingPaymentsSection({
  summerEnrollments,
  unpaidSummerEnrollments,
  pendingRequests,
  studentMap,
  paidWeeksByStudent,
  onSelectSummer,
  onSelectPending,
  nonEnrolledApps,
}: {
  summerEnrollments: SummerEnrollment[];
  unpaidSummerEnrollments: SummerEnrollment[];
  pendingRequests: PendingPaymentRequest[];
  studentMap: Record<string, string>;
  paidWeeksByStudent: PaidWeeksByStudent;
  onSelectSummer: (e: SummerEnrollment) => void;
  onSelectPending: (r: PendingPaymentRequest) => void;
  nonEnrolledApps: NonEnrolledApp[];
}) {
  const nonEnrolledMap = new Map(nonEnrolledApps.map((a) => [a.student_id, a]));

  // Collect all unique student IDs (enrolled + pending + non-enrolled)
  const allStudentIds = [
    ...new Set([
      ...summerEnrollments.map((e) => e.student_id),
      ...pendingRequests.map((r) => r.student_id).filter(Boolean) as string[],
      ...nonEnrolledApps.map((a) => a.student_id),
    ]),
  ];

  const [activeStudentId, setActiveStudentId] = useState<string | null>(
    allStudentIds[0] ?? null
  );

  if (unpaidSummerEnrollments.length === 0 && pendingRequests.length === 0 && nonEnrolledApps.length === 0) {
    return <AllCaughtUpCard />;
  }

  // Items with no student_id
  const orphanRequests = pendingRequests.filter((r) => !r.student_id);
  const hasOrphans = orphanRequests.length > 0;

  // Items for the active student
  const activeSummerEnrollments = unpaidSummerEnrollments.filter(
    (e) => e.student_id === activeStudentId
  );
  const activePendingRequests = pendingRequests.filter(
    (r) => r.student_id === activeStudentId
  );

  // Total owed (only pending requests with known amounts)
  const totalCents = (activeStudentId === "__other__" ? orphanRequests : activePendingRequests)
    .reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);

  const isOtherTab = activeStudentId === "__other__";
  const currentItems = isOtherTab ? orphanRequests : activePendingRequests;
  const currentSummer = isOtherTab ? [] : activeSummerEnrollments;

  const activeNonEnrolled = activeStudentId ? nonEnrolledMap.get(activeStudentId) : undefined;

  return (
    <div>
      {/* Child tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {allStudentIds.map((id) => {
          const isNonEnrolled = nonEnrolledMap.has(id);
          const name = isNonEnrolled ? (nonEnrolledMap.get(id)!.name ?? "Student") : (studentMap[id] ?? "Unknown");
          const isActive = activeStudentId === id;
          return (
            <button
              key={id}
              onClick={() => setActiveStudentId(id)}
              className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={isActive ? { backgroundColor: "#4a7c59" } : {}}
            >
              {name}
              {isNonEnrolled && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
              )}
            </button>
          );
        })}
        {hasOrphans && (
          <button
            onClick={() => setActiveStudentId("__other__")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              isOtherTab
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={isOtherTab ? { backgroundColor: "#4a7c59" } : {}}
          >
            Other
          </button>
        )}
      </div>

      {/* Items for active child */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStudentId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="space-y-3"
        >
          {activeNonEnrolled ? (
            <NonEnrolledCard app={activeNonEnrolled} />
          ) : currentSummer.length === 0 && currentItems.length === 0 ? (
            <AllCaughtUpCard />
          ) : (
            <>
              {currentSummer.map((enrollment) => (
                <SummerTuitionCard
                  key={enrollment.student_id}
                  studentName={studentMap[enrollment.student_id] ?? null}
                  paidWeeks={paidWeeksByStudent[enrollment.student_id] ?? []}
                  onClick={() => onSelectSummer(enrollment)}
                />
              ))}
              {currentItems.map((req) => (
                <PendingPaymentCard
                  key={req.id}
                  request={req}
                  studentName={req.student_id ? (studentMap[req.student_id] ?? null) : null}
                  onClick={() => onSelectPending(req)}
                />
              ))}

              {/* Total bar */}
              {totalCents > 0 && (
                <div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: "#f6faf7" }}
                >
                  <span className="text-sm text-gray-500 font-body">Total owed</span>
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
    </div>
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
            <SidebarField label="Program" value={formatProgram(pending.program)} />
            <SidebarField label="Payment Type" value={formatPaymentType(pending.payment_type)} />
            <SidebarField
              label="Amount"
              value={pending.amount_cents != null ? formatCents(pending.amount_cents) : "—"}
            />
            <SidebarField label="Requested On" value={formatDate(pending.created_at)} />
            {studentName && <SidebarField label="Student" value={studentName} />}
          </SidebarSection>
        </div>
      )}
    </DetailSidebar>
  );
}

export default function BillingPage({ transactions, studentMap, pendingRequests, summerEnrollments, unpaidSummerEnrollments, paidWeeksByStudent, parentId, parentEmail, nonEnrolledApps }: Props) {
  const [selectedTx, setSelectedTx] = useState<StripeTransaction | null>(null);
  const [selectedPending, setSelectedPending] = useState<PendingPaymentRequest | null>(null);
  const [selectedSummerEnrollment, setSelectedSummerEnrollment] = useState<SummerEnrollment | null>(null);

  const nonEnrolledStudentIds = new Set(nonEnrolledApps.map((a) => a.student_id));
  const visibleTransactions = transactions.filter((tx) => !tx.student_id || !nonEnrolledStudentIds.has(tx.student_id));

  if (visibleTransactions.length === 0) {
    return (
      <>
      <div className="space-y-8">
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
            nonEnrolledApps={nonEnrolledApps}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
            Payment History
          </h2>
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
              Your payment history will appear here once a transaction is processed.
            </p>
          </div>
        </div>
      </div>

      <PendingDetailSidebar
        pending={selectedPending}
        studentName={selectedPending?.student_id ? (studentMap[selectedPending.student_id] ?? null) : null}
        onClose={() => setSelectedPending(null)}
      />
      <AnimatePresence>
        {selectedSummerEnrollment && (
          <SummerPaymentModal
            enrollment={selectedSummerEnrollment}
            studentName={studentMap[selectedSummerEnrollment.student_id] ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            paidWeeks={paidWeeksByStudent[selectedSummerEnrollment.student_id] ?? []}
            onClose={() => setSelectedSummerEnrollment(null)}
          />
        )}
      </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="space-y-8">
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
            nonEnrolledApps={nonEnrolledApps}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
            Payment History
          </h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Date
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Description
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Student
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Type
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">
                Amount
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                  {formatDate(tx.created_at)}
                </td>
                <td className="px-5 py-4 text-gray-800 max-w-[240px] truncate">
                  {tx.description ?? "—"}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {studentMap[tx.student_id ?? ""] ?? "—"}
                </td>
                <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                  {formatPaymentType(tx.payment_type)}
                </td>
                <td className="px-5 py-4 text-gray-800 text-right whitespace-nowrap font-semibold">
                  {formatCents(tx.amount_cents)}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      </div>

      <PendingDetailSidebar
        pending={selectedPending}
        studentName={selectedPending?.student_id ? (studentMap[selectedPending.student_id] ?? null) : null}
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
                    ? (studentMap[selectedTx.student_id] ?? "—")
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

            <SidebarSection title="Stripe IDs">
              <SidebarField
                label="Session ID"
                value={selectedTx.stripe_session_id}
              />
              <SidebarField
                label="Payment Intent ID"
                value={selectedTx.stripe_payment_intent_id}
              />
            </SidebarSection>
          </div>
        )}
      </DetailSidebar>

      <AnimatePresence>
        {selectedSummerEnrollment && (
          <SummerPaymentModal
            enrollment={selectedSummerEnrollment}
            studentName={studentMap[selectedSummerEnrollment.student_id] ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            paidWeeks={paidWeeksByStudent[selectedSummerEnrollment.student_id] ?? []}
            onClose={() => setSelectedSummerEnrollment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
