"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  ClipboardList,
  ClipboardCheck,
  Gift,
  Copy,
  Check,
  Car,
  CalendarClock,
  CreditCard,
  MessageCircle,
  CalendarDays,
  Rss,
  Users,
  Heart,
  HelpCircle,
  X,
  ChevronRight,
  Coffee,
  Sparkles,
  Lock,
} from "lucide-react";
import OnboardingChecklist from "@/app/parent/components/OnboardingChecklist";
import type {
  ConferenceTeacherDisplay,
  ConferenceBookingRecord,
} from "@/app/lib/parent-teacher-conference";
import type { ConferenceStudentContext } from "@/app/lib/get-conference-teacher-assignments";
import ActionNeededCard from "./ActionNeededCard";
import UpcomingActivitiesSection from "./UpcomingActivitiesSection";
import ParentActivityPreferenceSheet from "./ParentActivityPreferenceSheet";
import HelpWidget from "@/app/parent/components/HelpWidget";
import { getParentStudentAttendance } from "@/app/actions/getParentStudentAttendance";
import {
  ATT_FILTER_TABS,
  filterAttendanceRecords,
  getAttendanceStatus,
  PROGRAM_CONFIG,
  type AttendanceFilter,
  type UnifiedAttendanceRecord,
  type UserMap,
} from "@/shared/parent/student-attendance";
import { findFirstUnsetActivity, computeHasUnsetActivityPreference } from "@/shared/parent/activity-preferences";
import { isFieldFridayCalendarEvent } from "@/shared/parent/calendar";
import type { StudentDefaultPreference } from "@/app/parent/preferences/page";
import AutoFillPreferencesSheet from "./AutoFillPreferencesSheet";
import { getEligibleAutoFillStudents } from "@/app/parent/components/AutoFillPreferenceSection";
import type { Activity } from "@/app/actions/activities";
import { saveDropOffTime } from "@/app/actions/saveDropOffTime";
import { submitTestimonial } from "@/app/actions/submitTestimonial";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import {
  SidebarField,
  SidebarSection,
} from "@/app/components/SidebarPrimitives";
import {
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
} from "@/shared/billing/school-year";
import type {
  HomeStudent,
  HomeCheckIn,
  HomeEvent,
  HomePendingPayment,
  HomeReferral,
  StudentMap,
  PaidHomeschoolByStudent,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  SummerEnrollment,
  HomeschoolDropInApp,
  SchoolYearOnlyApp,
  PaidSchoolYearByStudent,
} from "./page";

const SCHOOL_YEAR_AFTERCARE_KEYS = new Set(
  SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => m.key),
);
const SCHOOL_YEAR_FUN_FRIDAY_KEYS = new Set(
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key),
);

// Update each year to match the first school week
const DROPOFF_WEEK_START = new Date("2026-04-28T00:00:00");
const DROPOFF_WEEK_END = new Date("2026-05-29T23:59:59");

const DROP_OFF_SLOTS = [
  { label: "8:15 – 8:30", value: "8:15" },
  { label: "8:30 – 8:45", value: "8:30" },
  { label: "8:45 – 9:00", value: "8:45" },
] as const;

const BANNER_IMAGES = [
  "/assets/Kid1.png",
  "/assets/Kid2.jpg",
  "/assets/Stock1.jpg",
  // "/assets/Stock2.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
];

function bannerIndexForUser(userId: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatEventTime(evt: HomeEvent): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time)
    return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "";
}

function formatProgram(program: string | null): string {
  switch (program) {
    case "summer_26":
      return "Summer 2026";
    case "school_year_26_27":
      return "School Year 2026–2027";
    case "both":
      return "Summer 2026 & School Year 2026–2027";
    case "homeschool_drop_in":
      return "Homeschool Drop-In";
    default:
      return program ?? "—";
  }
}

function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

const AVATAR_COLORS = [
  "bg-[#d4e6d0] text-[#4a7c59]",
  "bg-[#dce8f5] text-[#4a7394]",
  "bg-[#f5e8d4] text-[#946e3a]",
  "bg-[#f5d4e4] text-[#944a6e]",
  "bg-[#e4d4f5] text-[#6e4a94]",
  "bg-[#d4f5e4] text-[#3a9468]",
];

function avatarColor(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function getEventDayMonth(dateStr: string): { day: string; month: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    day: String(day),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function formatAttendanceDate(ymd: string) {
  return new Date(ymd + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPickupTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface AttendanceSidebarProps {
  student: HomeStudent | null;
  onClose: () => void;
}

function AttendanceSidebar({ student, onClose }: AttendanceSidebarProps) {
  const [records, setRecords] = useState<UnifiedAttendanceRecord[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selectedRecord, setSelectedRecord] =
    useState<UnifiedAttendanceRecord | null>(null);
  const studentId = student?.id;

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    getParentStudentAttendance(studentId)
      .then(({ records: r, userMap: m }) => {
        if (cancelled) return;
        setRecords(r);
        setUserMap(m);
      })
      .catch(() => {
        if (cancelled) return;
        setRecords([]);
        setUserMap({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const firstName = student?.child_legal_name.split(" ")[0] ?? "";
  const filteredRecords = filterAttendanceRecords(records, filter);

  return (
    <>
      <DetailSidebar
        isOpen={!!student}
        onClose={onClose}
        title={`${firstName}'s Attendance`}
      >
        <div className="flex flex-col gap-4">
          {!loading && records.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ATT_FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                    filter === key
                      ? "bg-[#4a7c59] border-[#4a7c59] text-white"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="space-y-0">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
                  >
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-6">
                No attendance records found.
              </p>
            ) : (
              <div>
                <div className="grid grid-cols-3 px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Date
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Program
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">
                    Status
                  </span>
                </div>
                {filteredRecords.map((r, i) => {
                  const cfg = PROGRAM_CONFIG[r.program];
                  const status = getAttendanceStatus(r);
                  return (
                    <div
                      key={`${r.program}-${r.id}`}
                      onClick={() => setSelectedRecord(r)}
                      className={`grid grid-cols-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                        i < filteredRecords.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <span className="text-xs text-gray-700">
                        {formatAttendanceDate(r.date)}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full self-center w-fit"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                      <div className="flex justify-end">
                        {status === "absent" ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Absent
                          </span>
                        ) : status === "picked_up" ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Picked Up
                          </span>
                        ) : (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#eaf2ec",
                              color: "#4a7c59",
                            }}
                          >
                            Attended
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DetailSidebar>

      {/* Record detail sidebar (layered on top) */}
      <DetailSidebar
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Attendance Record"
      >
        {selectedRecord &&
          (() => {
            const cfg = PROGRAM_CONFIG[selectedRecord.program];
            const status = getAttendanceStatus(selectedRecord);
            const recordedBy =
              userMap[selectedRecord.recorded_by]?.full_name ?? "Staff";
            const pickupRecordedBy = selectedRecord.pickup_recorded_by
              ? (userMap[selectedRecord.pickup_recorded_by]?.full_name ??
                "Staff")
              : null;
            return (
              <SidebarSection title="Record Details">
                <SidebarField
                  label="Date"
                  value={formatAttendanceDate(selectedRecord.date)}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Program</span>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full w-fit"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </div>
                {status === "absent" ? (
                  <SidebarField label="Status" value="Marked absent" />
                ) : (
                  <>
                    <SidebarField label="Recorded By" value={recordedBy} />
                    {selectedRecord.pickup_time && (
                      <>
                        <SidebarField
                          label="Pickup Time"
                          value={formatPickupTime(selectedRecord.pickup_time)}
                        />
                        {selectedRecord.picked_up_by_name && (
                          <SidebarField
                            label="Picked Up By"
                            value={[
                              selectedRecord.picked_up_by_name,
                              selectedRecord.picked_up_by_relationship,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          />
                        )}
                        {pickupRecordedBy && (
                          <SidebarField
                            label="Pickup Recorded By"
                            value={pickupRecordedBy}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                {selectedRecord.notes && (
                  <SidebarField label="Notes" value={selectedRecord.notes} />
                )}
              </SidebarSection>
            );
          })()}
      </DetailSidebar>
    </>
  );
}

interface Props {
  fullName: string | null;
  email: string;
  userId: string;
  parentId: string;
  students: HomeStudent[];
  activeCheckIns: HomeCheckIn[];
  upcomingEvents: HomeEvent[];
  pendingPayments: HomePendingPayment[];
  studentMap: StudentMap;
  referrals: HomeReferral[];
  savedDropOffSlot: string | null;
  summerEnrollments: SummerEnrollment[];
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidAftercareByStudent: PaidAftercareByStudent;
  paidFunFridayByStudent: PaidFunFridayByStudent;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
  checklistComplete: boolean;
  initialCompletedIds?: string[];
  checklistInteractive?: boolean;
  actionNeededInteractive?: boolean;
  readOnlyPreview?: boolean;
  suppressReferralPopup?: boolean;
  upcomingActivities: Activity[];
  activityPrefs: { student_id: string; activity_id: string }[];
  studentDefaults: StudentDefaultPreference[];
  paidDateSets: Record<string, string[]>;
  publishedActivitiesForBanner: { id: string; activity_date: string | null }[];
  hasSubmittedTestimonial: boolean;
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  conferenceBookingsByStudent: Record<string, ConferenceBookingRecord>;
  conferenceTakenSlotKeys: string[];
}

export default function HomePageClient({
  fullName,
  userId,
  parentId,
  students,
  upcomingEvents,
  pendingPayments,
  studentMap,
  referrals,
  savedDropOffSlot,
  summerEnrollments,
  schoolYearOnlyApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  paidAftercareByStudent,
  paidFunFridayByStudent,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
  checklistComplete,
  initialCompletedIds,
  checklistInteractive,
  actionNeededInteractive,
  readOnlyPreview,
  suppressReferralPopup,
  upcomingActivities,
  activityPrefs,
  studentDefaults: initialStudentDefaults,
  paidDateSets,
  publishedActivitiesForBanner,
  hasSubmittedTestimonial,
  conferenceTeachers,
  conferenceStudents,
  conferenceBookingsByStudent,
  conferenceTakenSlotKeys,
}: Props) {
  const router = useRouter();
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(() =>
    bannerIndexForUser(userId, BANNER_IMAGES.length),
  );
  const [greeting] = useState(() => getGreeting());
  const [attendanceStudent, setAttendanceStudent] =
    useState<HomeStudent | null>(null);
  const [copied, setCopied] = useState(false);
  const [dropOffSlot, setDropOffSlot] = useState<string | null>(
    savedDropOffSlot,
  );
  const [dropOffSaved, setDropOffSaved] = useState<boolean>(
    savedDropOffSlot !== null,
  );
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [referralPopupOpen, setReferralPopupOpen] = useState(false);
  const [testimonialOpen, setTestimonialOpen] = useState(false);
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(
    hasSubmittedTestimonial,
  );
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024,
  );
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [autoFillSheetOpen, setAutoFillSheetOpen] = useState(false);
  const [studentDefaults, setStudentDefaults] = useState(initialStudentDefaults);

  const paidSets = useMemo(() => {
    const sets: Record<string, Set<string>> = {};
    for (const [studentId, dates] of Object.entries(paidDateSets)) {
      sets[studentId] = new Set(dates);
    }
    return sets;
  }, [paidDateSets]);

  const defaultPrefStudentIdSet = useMemo(
    () => new Set(studentDefaults.map((d) => d.student_id)),
    [studentDefaults],
  );

  const hasActivityForPaidDayLive = useMemo(
    () =>
      computeHasUnsetActivityPreference(
        publishedActivitiesForBanner,
        activityPrefs,
        defaultPrefStudentIdSet,
        students,
        paidSets,
      ),
    [
      publishedActivitiesForBanner,
      activityPrefs,
      defaultPrefStudentIdSet,
      students,
      paidSets,
    ],
  );

  const hasEligibleAutoFillStudents = useMemo(
    () =>
      getEligibleAutoFillStudents(students, paidDateSets, upcomingActivities).length >
      0,
    [students, paidDateSets, upcomingActivities],
  );

  const refreshActivityBanner = useCallback(() => {
    router.refresh();
  }, [router]);

  const openActivityPreferenceSheet = useCallback(
    (activity?: Activity | null) => {
      if (readOnlyPreview && !activity) return;

      let target = activity ?? null;

      if (!target) {
        const unsetId = findFirstUnsetActivity(
          publishedActivitiesForBanner,
          activityPrefs,
          defaultPrefStudentIdSet,
          students,
          paidSets,
        );
        if (unsetId) {
          target = upcomingActivities.find((a) => a.id === unsetId) ?? null;
        }
      }

      if (target) {
        setSelectedActivity(target);
        setActivitySheetOpen(true);
      } else if (!readOnlyPreview) {
        router.push("/parent/preferences");
      }
    },
    [
      readOnlyPreview,
      publishedActivitiesForBanner,
      activityPrefs,
      defaultPrefStudentIdSet,
      students,
      paidSets,
      upcomingActivities,
      router,
    ],
  );

  const handleActivitySaved = useCallback(() => {
    refreshActivityBanner();
  }, [refreshActivityBanner]);

  useEffect(() => {
    if (suppressReferralPopup) return;
    if (!sessionStorage.getItem("referralPopupSeen")) {
      const t = setTimeout(() => setReferralPopupOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, [suppressReferralPopup]);

  function closeReferralPopup() {
    sessionStorage.setItem("referralPopupSeen", "1");
    setReferralPopupOpen(false);
  }

  async function handleSubmitTestimonial() {
    if (!testimonialText.trim() || testimonialSubmitting) return;
    setTestimonialSubmitting(true);
    const childName = students[0]?.child_legal_name ?? "your child";
    const res = await submitTestimonial({
      testimonial: testimonialText.trim(),
      childName,
    });
    setTestimonialSubmitting(false);
    if (res.success) setTestimonialSubmitted(true);
  }

  async function handleSaveDropOff() {
    if (!dropOffSlot) return;
    setDropOffSaving(true);
    const res = await saveDropOffTime(dropOffSlot);
    if ("ok" in res && res.ok) setDropOffSaved(true);
    setDropOffSaving(false);
  }

  const refCode = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const referralLink = `https://sagefield.co/apply?ref=${refCode}`;

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const referralCount = referrals.length;
  const enrolledCount = referrals.filter(
    (r) => r.status === "enrolled" || r.status === "rewarded",
  ).length;
  const earnedDollars =
    referrals.filter((r) => r.status === "rewarded").length * 500;

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIdx((i) => (i + 1) % BANNER_IMAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const firstName = fullName?.split(" ")[0] ?? "there";

  const now = new Date();
  const showDropOff = now >= DROPOFF_WEEK_START && now <= DROPOFF_WEEK_END;

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <div className={checklistInteractive ? "pointer-events-auto" : undefined}>
        <OnboardingChecklist
          open={checklistOpen}
          onClose={() => setChecklistOpen(false)}
          initialCompleted={initialCompletedIds}
        />
      </div>

      {/* Referral popup — shown once per session; bottom sheet on mobile, centered modal on desktop */}
      <AnimatePresence>
        {referralPopupOpen &&
          (isMobile ? (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeReferralPopup}
              />
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3" />
                {/* Banner image */}
                <div className="relative h-36 w-full overflow-hidden mt-3">
                  <img
                    src="/assets/Kid1.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="p-6 pb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                      <Gift
                        className="w-5 h-5 text-[#4a7c59]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h2 className="text-lg font-heading font-semibold text-gray-900">
                      Refer a Family
                    </h2>
                    <span className="bg-[#4a7c59] text-white text-xs font-body px-2.5 py-1 rounded-full font-medium">
                      $500 gift card
                    </span>
                  </div>

                  <p className="text-sm font-body text-gray-600 leading-relaxed mb-6">
                    Know a family who&apos;d be a great fit for Sage Field?
                    Share your link — when they enroll and pay their
                    registration fee, you&apos;ll receive a{" "}
                    <strong className="text-gray-800">$500 gift card</strong> of
                    your choice. If sharing the link isn&apos;t convenient, just
                    let them know to{" "}
                    <strong className="text-gray-800">
                      mention your name when they apply!
                    </strong>
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <p className="text-sm font-body text-gray-500 truncate">
                        {referralLink}
                      </p>
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors whitespace-nowrap cursor-pointer ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy link
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={closeReferralPopup}
                    className="mt-5 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeReferralPopup}
            >
              <motion.div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Banner image */}
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src="/assets/Kid1.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="p-6">
                  <button
                    onClick={closeReferralPopup}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                      <Gift
                        className="w-5 h-5 text-[#4a7c59]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h2 className="text-lg font-heading font-semibold text-gray-900">
                      Refer a Family
                    </h2>
                    <span className="bg-[#4a7c59] text-white text-xs font-body px-2.5 py-1 rounded-full font-medium">
                      $500 gift card
                    </span>
                  </div>

                  <p className="text-sm font-body text-gray-600 leading-relaxed mb-6">
                    Know a family who&apos;d be a great fit for Sage Field?
                    Share your link — when they enroll and pay their
                    registration fee, you&apos;ll receive a{" "}
                    <strong className="text-gray-800">$500 gift card</strong> of
                    your choice. If sharing the link isn&apos;t convenient, just
                    let them know to{" "}
                    <strong className="text-gray-800">
                      mention your name when they apply!
                    </strong>
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <p className="text-sm font-body text-gray-500 truncate">
                        {referralLink}
                      </p>
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors whitespace-nowrap cursor-pointer ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy link
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={closeReferralPopup}
                    className="mt-5 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Testimonial Popup */}
      <AnimatePresence>
        {testimonialOpen &&
          (isMobile ? (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() =>
                  !testimonialSubmitting && setTestimonialOpen(false)
                }
              />
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3" />
                <div className="p-6 pb-10">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#a0784a]/10 flex items-center justify-center shrink-0">
                      <Coffee
                        className="w-5 h-5 text-[#a0784a]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-semibold text-gray-900 leading-tight">
                        Share Your Experience
                      </h2>
                      <p className="text-xs font-body text-[#a0784a] font-medium">
                        $15 Starbucks gift card — coffee on us
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-body text-gray-500 leading-relaxed mt-4 mb-4">
                    A few honest sentences from the heart is more than enough.
                    Here are some prompts to get you started:
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {[
                      `What has ${students[0]?.child_legal_name?.split(" ")[0] ?? "your child"} enjoyed most at Sage Field?`,
                      "How has the program impacted your family?",
                      "Is there a moment or experience that stood out?",
                      "Would you recommend Sage Field to another family?",
                    ].map((prompt) => (
                      <li
                        key={prompt}
                        className="flex items-start gap-2 text-xs font-body text-gray-500"
                      >
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#a0784a]/50 shrink-0" />
                        {prompt}
                      </li>
                    ))}
                  </ul>

                  {testimonialSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <div className="w-12 h-12 rounded-full bg-[#a0784a]/10 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#a0784a]" />
                      </div>
                      <p className="text-sm font-body font-medium text-gray-800">
                        Thank you so much!
                      </p>
                      <p className="text-xs font-body text-gray-500 text-center">
                        We&apos;ll be in touch about your gift card soon.
                      </p>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-3 text-xs font-body text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={testimonialText}
                        onChange={(e) => setTestimonialText(e.target.value)}
                        placeholder="Share your experience here…"
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-body text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#a0784a]/30 focus:border-[#a0784a]/50 transition"
                      />
                      <button
                        onClick={handleSubmitTestimonial}
                        disabled={
                          !testimonialText.trim() || testimonialSubmitting
                        }
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold font-body bg-[#a0784a] text-white hover:bg-[#8a6640] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Coffee className="w-4 h-4" />
                        {testimonialSubmitting
                          ? "Submitting…"
                          : "Submit testimonial"}
                      </button>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-4 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Maybe later
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() =>
                !testimonialSubmitting && setTestimonialOpen(false)
              }
            >
              <motion.div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    !testimonialSubmitting && setTestimonialOpen(false)
                  }
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#a0784a]/10 flex items-center justify-center shrink-0">
                      <Coffee
                        className="w-5 h-5 text-[#a0784a]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-semibold text-gray-900 leading-tight">
                        Share Your Experience
                      </h2>
                      <p className="text-xs font-body text-[#a0784a] font-medium">
                        $15 Starbucks gift card — coffee on us
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-body text-gray-500 leading-relaxed mt-4 mb-3">
                    A few honest sentences from the heart is more than enough.
                    Here are some prompts to get you started:
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {[
                      `What has ${students[0]?.child_legal_name?.split(" ")[0] ?? "your child"} enjoyed most at Sage Field?`,
                      "How has the program impacted your family?",
                      "Is there a moment or experience that stood out?",
                      "Would you recommend Sage Field to another family?",
                    ].map((prompt) => (
                      <li
                        key={prompt}
                        className="flex items-start gap-2 text-xs font-body text-gray-500"
                      >
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#a0784a]/50 shrink-0" />
                        {prompt}
                      </li>
                    ))}
                  </ul>

                  {testimonialSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-[#a0784a]/10 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#a0784a]" />
                      </div>
                      <p className="text-sm font-body font-medium text-gray-800">
                        Thank you so much!
                      </p>
                      <p className="text-xs font-body text-gray-500 text-center">
                        We&apos;ll be in touch about your gift card soon.
                      </p>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-3 text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={testimonialText}
                        onChange={(e) => setTestimonialText(e.target.value)}
                        placeholder="Share your experience here…"
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-body text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#a0784a]/30 focus:border-[#a0784a]/50 transition"
                      />
                      <button
                        onClick={handleSubmitTestimonial}
                        disabled={
                          !testimonialText.trim() || testimonialSubmitting
                        }
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold font-body bg-[#a0784a] text-white hover:bg-[#8a6640] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Coffee className="w-4 h-4" />
                        {testimonialSubmitting
                          ? "Submitting…"
                          : "Submit testimonial"}
                      </button>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-4 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Maybe later
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Banner */}
      <div className="relative h-64 rounded-2xl overflow-hidden shadow-sm">
        <AnimatePresence initial={false}>
          <motion.img
            key={bannerIdx}
            src={BANNER_IMAGES[bannerIdx]}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-6">
          <p className="text-white/75 text-sm font-body">{greeting},</p>
          <p className="text-white text-3xl font-heading font-bold leading-tight">
            {firstName}.
          </p>
        </div>
      </div>

      {/* Two-column grid on desktop, single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start lg:items-stretch">
        {/* Left column: Students + Drop-Off + Referral */}
        <div className="flex flex-col gap-8">
          <div
            className={
              actionNeededInteractive ? "pointer-events-auto" : undefined
            }
          >
            <ActionNeededCard
              parentId={parentId}
              hasActivityForPaidDay={hasActivityForPaidDayLive}
              onOpenActivityPrefs={() => openActivityPreferenceSheet()}
              schoolYearOnlyApps={schoolYearOnlyApps}
              summerEnrollments={summerEnrollments}
              paidSchoolYearByStudent={paidSchoolYearByStudent}
              paidSupplyFeeByStudent={paidSupplyFeeByStudent}
              conferenceTeachers={conferenceTeachers}
              conferenceStudents={conferenceStudents}
              conferenceBookingsByStudent={conferenceBookingsByStudent}
              conferenceTakenSlotKeys={conferenceTakenSlotKeys}
              readOnly={readOnlyPreview}
            />
          </div>

          <div className={actionNeededInteractive ? "pointer-events-auto" : undefined}>
            <UpcomingActivitiesSection
              activities={upcomingActivities}
              onSelectActivity={(activity) => openActivityPreferenceSheet(activity)}
              readOnly={readOnlyPreview}
              showAutoFillButton={hasEligibleAutoFillStudents}
              onAutoFillClick={() => setAutoFillSheetOpen(true)}
            />
          </div>

          {/* Student Cards */}
          <section>
            <h2 className="text-base font-heading font-semibold text-gray-800 mb-4">
              My Children
            </h2>
            {students.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-5 py-6 text-center">
                <p className="text-sm text-gray-400">
                  No children found. Contact us if you believe this is an error.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {students.map((student) => {
                  const childFirstName = student.child_legal_name.split(" ")[0];
                  return (
                    <div
                      key={student.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Avatar */}
                      {student.profile_image_url ? (
                        <img
                          src={student.profile_image_url}
                          alt={childFirstName}
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-semibold font-heading ${avatarColor(student.id)}`}
                        >
                          {getInitials(student.child_legal_name)}
                        </div>
                      )}

                      {/* Name + grade */}
                      <div className="text-center min-w-0 w-full">
                        <p className="text-sm font-semibold font-heading text-gray-800 truncate">
                          {childFirstName}
                        </p>
                        {student.child_grade && (
                          <p className="text-xs font-body text-gray-400 mt-0.5">
                            {student.child_grade}
                          </p>
                        )}
                      </div>

                      {/* Attendance button */}
                      <button
                        onClick={() => setAttendanceStudent(student)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold font-body text-[#4a7c59] bg-[#EEF5EF] rounded-xl hover:bg-[#ddeede] transition-colors"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Attendance
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* First Week Drop-Off Schedule */}
          {showDropOff && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 bg-[#EEF4FF] border-b border-[#c7dffe]">
                <div className="w-7 h-7 rounded-full bg-[#3b82f6]/15 flex items-center justify-center flex-shrink-0">
                  <Car
                    className="w-3.5 h-3.5 text-[#3b82f6]"
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className="text-base font-heading font-semibold text-gray-800">
                  First Week Drop-Off
                </h2>
              </div>

              <div className="px-5 py-4 flex flex-col gap-5">
                <p className="text-sm font-body text-gray-500 leading-relaxed">
                  To ease morning traffic during the first week, choose a
                  15-minute drop-off window for your family. Drop-off runs{" "}
                  <span className="font-medium text-gray-700">
                    8:15 – 9:00 AM
                  </span>
                  .
                </p>

                {dropOffSaved ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold font-heading text-gray-800">
                        {DROP_OFF_SLOTS.find((s) => s.value === dropOffSlot)
                          ?.label ?? dropOffSlot}
                      </span>
                      <span className="text-xs font-body text-gray-400">
                        confirmed
                      </span>
                    </div>
                    <button
                      onClick={() => setDropOffSaved(false)}
                      className="text-xs font-semibold font-body text-[#3b82f6] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      {DROP_OFF_SLOTS.map((slot) => {
                        const isSelected = dropOffSlot === slot.value;
                        return (
                          <button
                            key={slot.value}
                            onClick={() => setDropOffSlot(slot.value)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold font-body transition-colors ${
                              isSelected
                                ? "bg-[#3b82f6] text-white"
                                : "bg-[#EEF4FF] text-[#3b82f6] hover:bg-[#dbeafe]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-body text-gray-400">
                        <CalendarClock
                          className="w-3.5 h-3.5 flex-shrink-0"
                          strokeWidth={1.5}
                        />
                        One time slot for the whole family
                      </div>
                      <button
                        disabled={!dropOffSlot || dropOffSaving}
                        onClick={handleSaveDropOff}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-body bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {dropOffSaving ? "Saving…" : "Save drop-off time"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Rewards Banner */}
          <Link href="/parent/rewards">
            <section
              className="rounded-2xl p-6 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
              style={{
                background:
                  "linear-gradient(135deg, #2e5940 0%, #3d6b4a 45%, #4a7c59 100%)",
              }}
            >
              {/* Top label */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                  <Sparkles
                    className="w-3 h-3 text-[#a8d5b5]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-xs font-body font-semibold text-white/70 uppercase tracking-wide">
                  Rewards
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-xl font-heading font-bold text-white leading-tight mb-1">
                Earn up to $515 in gift cards
              </h2>

              {/* Subtext */}
              <p className="text-sm font-body text-white/70 leading-relaxed mb-4">
                Refer a family and share your story — we&apos;ll reward you for
                both.
                {earnedDollars > 0 && (
                  <span className="ml-1 text-white/90 font-medium">
                    ${earnedDollars} earned so far.
                  </span>
                )}
              </p>

              {/* Reward pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1.5">
                  <Gift
                    className="w-3.5 h-3.5 text-[#a8d5b5]"
                    strokeWidth={1.5}
                  />
                  <span className="text-xs font-body font-medium text-white">
                    Refer a Family · <strong>$500 gift card</strong>
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 ${testimonialSubmitted ? "bg-white/10 border-white/15" : "bg-white/15 border-white/20"}`}
                >
                  {testimonialSubmitted ? (
                    <Check
                      className="w-3.5 h-3.5 text-white/60"
                      strokeWidth={2}
                    />
                  ) : (
                    <Coffee
                      className="w-3.5 h-3.5 text-[#f0c080]"
                      strokeWidth={1.5}
                    />
                  )}
                  <span
                    className={`text-xs font-body font-medium ${testimonialSubmitted ? "text-white/50" : "text-white"}`}
                  >
                    Share Your Experience ·{" "}
                    <strong
                      className={testimonialSubmitted ? "line-through" : ""}
                    >
                      $15 Starbucks
                    </strong>
                    {testimonialSubmitted && (
                      <span className="ml-1 no-underline not-italic">✓</span>
                    )}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="inline-flex items-center gap-1.5 bg-white text-[#2e5940] font-semibold font-body text-sm px-4 py-2 rounded-xl hover:bg-white/90 transition-colors">
                View Rewards
                <ChevronRight className="w-4 h-4" />
              </div>
            </section>
          </Link>

          {/* Today's Photos Banner */}
          <Link
            href="/parent/photos"
            className="w-full rounded-2xl bg-gradient-to-br from-[#4a7c59] to-[#2d5a2d] px-4 py-3 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <span className="text-xl shrink-0">📸</span>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-bold text-white leading-snug">
                Check out today&apos;s photos!
              </span>
              <span className="text-xs text-white/70">
                ✨ New memories from school
              </span>
            </div>
            <span className="text-white/70 text-sm shrink-0">→</span>
          </Link>

          {/* Quick Actions */}
          <section>
            <h2 className="text-base font-heading font-semibold text-gray-800 mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  {
                    label: "Pay Tuition",
                    icon: CreditCard,
                    href: "/parent/billing",
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600",
                  },
                  {
                    label: "Messages",
                    icon: MessageCircle,
                    href: "/parent/messages",
                    iconBg: "bg-blue-100",
                    iconColor: "text-blue-600",
                  },
                  {
                    label: "Events",
                    icon: CalendarDays,
                    href: "/parent/calendar",
                    iconBg: "bg-violet-100",
                    iconColor: "text-violet-600",
                  },
                  {
                    label: "Attendance",
                    icon: ClipboardList,
                    href: "/parent/children?tab=attendance",
                    iconBg: "bg-amber-100",
                    iconColor: "text-amber-600",
                  },
                  {
                    label: "School Feed",
                    icon: Rss,
                    href: "/parent/feed",
                    iconBg: "bg-sky-100",
                    iconColor: "text-sky-600",
                  },
                  {
                    label: "My Children",
                    icon: Users,
                    href: "/parent/children",
                    iconBg: "bg-rose-100",
                    iconColor: "text-rose-600",
                  },
                  {
                    label: "Volunteer",
                    icon: Heart,
                    href: "/parent/volunteer",
                    iconBg: "bg-pink-100",
                    iconColor: "text-pink-600",
                  },
                ] as {
                  label: string;
                  icon: React.ElementType;
                  href: string;
                  iconBg: string;
                  iconColor: string;
                }[]
              ).map(({ label, icon: Icon, href, iconBg, iconColor }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${iconColor}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-xs font-semibold font-body text-gray-700 leading-tight">
                    {label}
                  </span>
                </Link>
              ))}
              <button
                onClick={() => setHelpOpen(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100">
                  <HelpCircle
                    className="w-5 h-5 text-teal-600"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-xs font-semibold font-body text-gray-700 leading-tight">
                  Help
                </span>
              </button>
            </div>
            <HelpWidget
              hideFloatingButton
              open={helpOpen}
              onOpenChange={setHelpOpen}
            />
          </section>
        </div>

        {/* Right column: Events + Billing */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-[65px] lg:self-start">
          {/* Onboarding checklist prompt */}
          {!checklistComplete && (
            <section
              className={
                checklistInteractive ? "pointer-events-auto" : undefined
              }
            >
              <h2 className="text-base font-heading font-semibold text-gray-800 mb-4">
                Get started
              </h2>
              <button
                onClick={() => setChecklistOpen(true)}
                className="w-full flex items-center gap-3 bg-[#4a7c59]/10 hover:bg-[#4a7c59]/15 border border-[#4a7c59]/20 rounded-2xl px-4 py-3 transition-colors text-left cursor-pointer"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#4a7c59]/15 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-[#4a7c59]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body text-[#4a7c59] leading-snug">
                    Complete your onboarding
                  </p>
                  <p className="text-xs font-body text-[#4a7c59]/70 mt-0.5">
                    Finish setting up your account
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#4a7c59]/60 flex-shrink-0" />
              </button>
            </section>
          )}

          {/* Upcoming Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-heading font-semibold text-gray-800">
                Upcoming events
              </h2>
              <Link
                href="/parent/calendar"
                className="flex items-center gap-1 text-xs font-body text-[#4a7c59] hover:underline"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm font-body text-gray-400">
                No upcoming events.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingEvents.map((evt) => {
                  const { day, month } = getEventDayMonth(evt.event_date);
                  const timeStr = formatEventTime(evt);
                  return (
                    <div
                      key={evt.id}
                      className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm"
                    >
                      {/* Calendar day block */}
                      <div
                        className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
                        style={{ backgroundColor: evt.color + "22" }}
                      >
                        <span
                          className="text-xs font-semibold uppercase leading-none"
                          style={{ color: evt.color }}
                        >
                          {month}
                        </span>
                        <span
                          className="text-base font-bold font-heading leading-tight"
                          style={{ color: evt.color }}
                        >
                          {day}
                        </span>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold font-heading text-gray-800 truncate">
                          {evt.title}
                        </p>
                        {timeStr && (
                          <p className="text-xs font-body text-gray-500 mt-0.5">
                            {timeStr}
                          </p>
                        )}
                        {evt.category && (
                          <span
                            className="inline-block mt-1 text-xs font-body font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: evt.color + "22",
                              color: evt.color,
                            }}
                          >
                            {evt.category}
                          </span>
                        )}
                        {isFieldFridayCalendarEvent(evt) && (
                          <Link
                            href="/parent/billing"
                            className="inline-block mt-2 text-xs font-semibold font-body text-[#4a7c59] hover:underline"
                          >
                            Register now!
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-heading font-semibold text-gray-800">
                Tuition & billing
              </h2>
              <Link
                href="/parent/billing"
                className="flex items-center gap-1 text-xs font-body text-[#4a7c59] hover:underline"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {(() => {
              const schoolYearHomeschoolApps = homeschoolDropInApps.filter(
                (a) =>
                  a.drop_in_program === "school_year_26_27" ||
                  a.drop_in_program === "both",
              );

              const bothEnrollments = summerEnrollments.filter(
                (e) => e.program === "both",
              );

              const schoolYearTuitionStudentIds = new Set([
                ...schoolYearOnlyApps.map((a) => a.student_id),
                ...bothEnrollments.map((e) => e.student_id),
              ]);

              const schoolYearStudentIds = new Set([
                ...schoolYearOnlyApps.map((a) => a.student_id),
                ...bothEnrollments.map((e) => e.student_id),
                ...schoolYearHomeschoolApps.map((a) => a.student_id),
              ]);

              const schoolYearNames = [...schoolYearStudentIds]
                .map((id) => studentMap[id]?.name)
                .filter(Boolean) as string[];

              const tuitionNames = [...schoolYearTuitionStudentIds]
                .map((id) => studentMap[id]?.name)
                .filter(Boolean) as string[];

              const allSupplyFeesPaid =
                schoolYearStudentIds.size > 0 &&
                [...schoolYearStudentIds].every(
                  (id) => paidSupplyFeeByStudent[id],
                );

              const anyTuitionSupplyFeeUnpaid = [...schoolYearTuitionStudentIds].some(
                (id) => !paidSupplyFeeByStudent[id],
              );

              const totalTuitionMonthsPaid = [...schoolYearTuitionStudentIds].reduce(
                (acc, id) =>
                  acc + (paidSchoolYearByStudent[id]?.length ?? 0),
                0,
              );

              const totalAftercareMonths = [...schoolYearStudentIds].reduce(
                (acc, id) => {
                  const months =
                    paidAftercareByStudent[id]?.months?.filter((k) =>
                      SCHOOL_YEAR_AFTERCARE_KEYS.has(k),
                    ) ?? [];
                  return acc + months.length;
                },
                0,
              );

              const totalFunFridayMonths = [...schoolYearStudentIds].reduce(
                (acc, id) => {
                  const months =
                    paidFunFridayByStudent[id]?.months?.filter((k) =>
                      SCHOOL_YEAR_FUN_FRIDAY_KEYS.has(k),
                    ) ?? [];
                  return acc + months.length;
                },
                0,
              );

              const hasAnything =
                pendingPayments.length > 0 || schoolYearStudentIds.size > 0;

              if (!hasAnything) {
                return (
                  <div
                    className="rounded-2xl px-5 py-5"
                    style={{ backgroundColor: "#D6EAD8" }}
                  >
                    <p className="text-sm font-semibold font-heading text-[#4a7c59]">
                      All caught up!
                    </p>
                    <p
                      className="text-xs font-body mt-1"
                      style={{ color: "#4a7c59bb" }}
                    >
                      No pending payments
                    </p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3">
                  {/* Annual Supply Fee */}
                  {schoolYearNames.length > 0 && (
                    <Link
                      href="/parent/billing"
                      className="rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col group"
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src="/assets/Stock2.jpg"
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ objectPosition: "center 65%" }}
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
                          $300
                        </span>
                      </div>
                      <div className="p-3.5 flex flex-col gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">
                            {schoolYearNames.join(", ")}
                          </p>
                          <p className="text-xs font-medium text-gray-400 mb-0.5">
                            School Year 26–27
                          </p>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            Annual Supply Fee
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: "#4a7c59" }}
                        >
                          {allSupplyFeesPaid ? (
                            <>
                              <Check className="w-3 h-3" /> Paid
                            </>
                          ) : (
                            <>
                              Pay now <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* School Year Tuition */}
                  {tuitionNames.length > 0 && (
                    <Link
                      href="/parent/billing"
                      className={`rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col group ${anyTuitionSupplyFeeUnpaid ? "pointer-events-none" : ""}`}
                      aria-disabled={anyTuitionSupplyFeeUnpaid}
                      onClick={
                        anyTuitionSupplyFeeUnpaid
                          ? (e) => e.preventDefault()
                          : undefined
                      }
                    >
                      <div className="relative h-28 overflow-hidden bg-gray-200">
                        <img
                          src="/assets/Stock1.jpg"
                          alt=""
                          className={`w-full h-full object-cover object-center transition-transform duration-500 ${anyTuitionSupplyFeeUnpaid ? "" : "group-hover:scale-105"}`}
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        {totalTuitionMonthsPaid > 0 && (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                            {totalTuitionMonthsPaid} mo. paid
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 flex flex-col gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">
                            {tuitionNames.join(", ")}
                          </p>
                          <p className="text-xs font-medium text-gray-400 mb-0.5">
                            School Year 26–27
                          </p>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            School Year Tuition
                          </p>
                        </div>
                        {anyTuitionSupplyFeeUnpaid ? (
                          <span
                            className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500"
                          >
                            <Lock className="w-3 h-3" /> Pay supply fee first
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: "#4a7c59" }}
                          >
                            Pay tuition <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Homeschool Drop-In — school year, one card per student */}
                  {schoolYearHomeschoolApps.map((app) => {
                    const studentName =
                      studentMap[app.student_id]?.name ?? null;
                    const paidData = paidHomeschoolByStudent[app.student_id];
                    const hasSchoolYear =
                      (paidData?.schoolYear?.length ?? 0) > 0;
                    const badgeLabel = hasSchoolYear
                      ? "School year active"
                      : null;
                    return (
                      <Link
                        key={`homeschool-sy-${app.id}`}
                        href="/parent/billing"
                        className="rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col group"
                      >
                        <div className="relative h-28 overflow-hidden">
                          <img
                            src="/assets/Homeschool.jpg"
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/10" />
                          {badgeLabel && (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-sm">
                              {badgeLabel}
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 flex flex-col gap-2">
                          <div>
                            {studentName && (
                              <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">
                                {studentName}
                              </p>
                            )}
                            <p className="text-xs font-medium text-gray-400 mb-0.5">
                              School Year 26–27
                            </p>
                            <p className="text-sm font-semibold text-gray-800 leading-snug">
                              Homeschool Drop-In
                            </p>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: "#4a7c59" }}
                          >
                            {badgeLabel ? "Manage plan" : "Set up plan"}{" "}
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Extended Learning — school year */}
                  {schoolYearNames.length > 0 && (
                    <Link
                      href="/parent/billing"
                      className="rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col group"
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src="/assets/Stock3.jpg"
                          alt=""
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
                          Optional
                        </span>
                        {totalAftercareMonths > 0 && (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                            {totalAftercareMonths}mo paid
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 flex flex-col gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">
                            {schoolYearNames.join(", ")}
                          </p>
                          <p className="text-xs font-medium text-gray-400 mb-0.5">
                            School Year 26–27
                          </p>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            Extended Learning (3:00 – 5:00pm)
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: "#e07a3a" }}
                        >
                          {totalAftercareMonths > 0
                            ? "Add months"
                            : "Select plan"}{" "}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Friday Enrichment — school year */}
                  {schoolYearNames.length > 0 && (
                    <Link
                      href="/parent/billing"
                      className="rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col group"
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src="/assets/Stock4.jpg"
                          alt=""
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        {totalFunFridayMonths > 0 ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                            {totalFunFridayMonths} mo. paid
                          </span>
                        ) : (
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm">
                            Optional
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 flex flex-col gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">
                            {schoolYearNames.join(", ")}
                          </p>
                          <p className="text-xs font-medium text-gray-400 mb-0.5">
                            School Year 26–27
                          </p>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            Friday Enrichment Day
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: "#7c3aed" }}
                        >
                          {totalFunFridayMonths > 0
                            ? "Add months"
                            : "Select plan"}{" "}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Pending payment requests */}
                  {pendingPayments.map((payment) => {
                    const studentName = payment.student_id
                      ? (studentMap[payment.student_id]?.name ?? "Student")
                      : "Student";
                    return (
                      <Link
                        key={payment.id}
                        href="/parent/billing"
                        className="rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col group"
                      >
                        <div className="relative h-28 overflow-hidden">
                          <img
                            src="/assets/ImageTen.jpg"
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/10" />
                        </div>
                        <div className="p-3.5 flex flex-col gap-2">
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">
                              {studentName}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 leading-snug truncate">
                              {payment.label}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: "#4a7c59" }}
                            >
                              Pay now <ArrowRight className="w-3 h-3" />
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                              {formatCents(payment.amount_cents)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>
      </div>

      {/* Attendance sidebar */}
      <AttendanceSidebar
        key={attendanceStudent?.id ?? "none"}
        student={attendanceStudent}
        onClose={() => setAttendanceStudent(null)}
      />

      <ParentActivityPreferenceSheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        activity={selectedActivity}
        students={students}
        readOnly={readOnlyPreview}
        onSaved={handleActivitySaved}
      />

      <AutoFillPreferencesSheet
        open={autoFillSheetOpen}
        onOpenChange={setAutoFillSheetOpen}
        students={students}
        studentDefaults={studentDefaults}
        paidDateSets={paidDateSets}
        upcomingActivities={upcomingActivities}
        readOnly={readOnlyPreview}
        onDefaultsChange={setStudentDefaults}
      />
    </div>
  );
}
