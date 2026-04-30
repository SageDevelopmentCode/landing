"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  ClipboardList,
  Gift,
  Copy,
  Check,
  Car,
  CalendarClock,
} from "lucide-react";
import {
  getParentStudentAttendance,
  type ParentCheckInRecord,
} from "@/app/actions/getParentStudentAttendance";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import {
  SidebarField,
  SidebarSection,
} from "@/app/components/SidebarPrimitives";
import type {
  HomeStudent,
  HomeEvent,
  HomePendingPayment,
  HomeReferral,
  StudentMap,
} from "./page";

// Update each year to match the first school week
const DROPOFF_WEEK_START = new Date("2026-04-28T00:00:00");
const DROPOFF_WEEK_END = new Date("2026-04-30T23:59:59");

const DROP_OFF_SLOTS = [
  { label: "8:15 – 8:30", value: "8:15" },
  { label: "8:30 – 8:45", value: "8:30" },
  { label: "8:45 – 9:00", value: "8:45" },
] as const;

const BANNER_IMAGES = [
  "/assets/ImageSix.jpg",
  "/assets/ImageTen.jpg",
  "/assets/ImageFive.jpg",
  "/assets/After1.png",
  "/assets/After3.png",
];

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

function formatAttendanceDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAttendanceTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isPastDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() !== today.toDateString() && d < today;
}

interface AttendanceSidebarProps {
  student: HomeStudent | null;
  onClose: () => void;
}

function AttendanceSidebar({ student, onClose }: AttendanceSidebarProps) {
  const [records, setRecords] = useState<ParentCheckInRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<ParentCheckInRecord | null>(null);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    setRecords([]);
    setSelectedRecord(null);
    getParentStudentAttendance(student.id)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [student?.id]);

  const firstName = student?.child_legal_name.split(" ")[0] ?? "";

  return (
    <>
      <DetailSidebar
        isOpen={!!student}
        onClose={onClose}
        title={`${firstName}'s Attendance`}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="space-y-0">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
                  >
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-6">
                No attendance records found.
              </p>
            ) : (
              <div>
                <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Date
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    In
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Out
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">
                    Status
                  </span>
                </div>
                {records.map((r, i) => {
                  const notCheckedOut =
                    !r.checked_out_at && isPastDay(r.checked_in_at);
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className={`grid grid-cols-4 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                        i < records.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <span className="text-xs text-gray-700">
                        {formatAttendanceDate(r.checked_in_at)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatAttendanceTime(r.checked_in_at)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {r.checked_out_at
                          ? formatAttendanceTime(r.checked_out_at)
                          : "—"}
                      </span>
                      <div className="flex justify-end">
                        {r.checked_out_at ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Out
                          </span>
                        ) : notCheckedOut ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Missed
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <Smartphone
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                strokeWidth={1.5}
              />
              <p className="text-xs text-gray-400">
                To check in or out, use the Sage Field mobile app.
              </p>
            </div>
          </div>
        </div>
      </DetailSidebar>

      {/* Record detail sidebar (layered on top) */}
      <DetailSidebar
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Check-In Details"
      >
        {selectedRecord && (
          <SidebarSection title="Check-In Record">
            <SidebarField
              label="Date"
              value={formatAttendanceDate(selectedRecord.checked_in_at)}
            />
            <SidebarField
              label="Checked In"
              value={formatAttendanceTime(selectedRecord.checked_in_at)}
            />
            <SidebarField
              label="Checked Out"
              value={
                selectedRecord.checked_out_at
                  ? formatAttendanceTime(selectedRecord.checked_out_at)
                  : "Not checked out"
              }
            />
            {selectedRecord.notes && (
              <SidebarField label="Notes" value={selectedRecord.notes} />
            )}
          </SidebarSection>
        )}
      </DetailSidebar>
    </>
  );
}

interface Props {
  fullName: string | null;
  email: string;
  userId: string;
  students: HomeStudent[];
  activeCheckIns: never[];
  upcomingEvents: HomeEvent[];
  pendingPayments: HomePendingPayment[];
  studentMap: StudentMap;
  referrals: HomeReferral[];
}

export default function HomePageClient({
  fullName,
  userId,
  students,
  upcomingEvents,
  pendingPayments,
  studentMap,
  referrals,
}: Props) {
  const [bannerIdx, setBannerIdx] = useState<number | null>(null);
  const [greeting, setGreeting] = useState("");
  const [attendanceStudent, setAttendanceStudent] =
    useState<HomeStudent | null>(null);
  const [copied, setCopied] = useState(false);
  const [dropOffSlot, setDropOffSlot] = useState<string | null>(null);

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
    referrals.filter((r) => r.status === "rewarded").length * 150;

  useEffect(() => {
    setBannerIdx(Math.floor(Math.random() * BANNER_IMAGES.length));
    setGreeting(getGreeting());
  }, []);

  const firstName = fullName?.split(" ")[0] ?? "there";

  const now = new Date();
  const showDropOff = now >= DROPOFF_WEEK_START && now <= DROPOFF_WEEK_END;

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Banner */}
      {bannerIdx !== null && (
        <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm">
          <img
            src={BANNER_IMAGES[bannerIdx]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-6">
            <p className="text-white/75 text-sm font-body">{greeting},</p>
            <p className="text-white text-3xl font-heading font-bold leading-tight">
              {firstName}.
            </p>
          </div>
        </div>
      )}

      {/* Two-column grid on desktop, single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start lg:items-stretch">
        {/* Left column: Students + Drop-Off + Referral */}
        <div className="flex flex-col gap-8">
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

            {/* Mobile app note */}
            <div className="flex items-center gap-2 mt-3">
              <Smartphone
                className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"
                strokeWidth={1.5}
              />
              <p className="text-xs text-gray-400">
                Check-in and pickup available on the Sage Field mobile app.
              </p>
            </div>
          </section>

          {/* First Week Drop-Off Schedule */}
          {showDropOff && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 bg-[#EEF5EF] border-b border-[#d3e9d5]">
                <div className="w-7 h-7 rounded-full bg-[#4a7c59]/15 flex items-center justify-center flex-shrink-0">
                  <Car
                    className="w-3.5 h-3.5 text-[#4a7c59]"
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

                <div className="flex items-center gap-2 flex-wrap">
                  {DROP_OFF_SLOTS.map((slot) => {
                    const isSelected = dropOffSlot === slot.value;
                    return (
                      <button
                        key={slot.value}
                        onClick={() => setDropOffSlot(slot.value)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold font-body transition-colors ${
                          isSelected
                            ? "bg-[#4a7c59] text-white"
                            : "bg-[#EEF5EF] text-[#4a7c59] hover:bg-[#ddeede]"
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
                    disabled={!dropOffSlot}
                    onClick={() => {}}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-body bg-[#4a7c59] text-white hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save drop-off time
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Referral Section */}
          <section
            className="rounded-2xl p-6 shadow-sm border border-[#c2ddc8]"
            style={{
              background: "linear-gradient(135deg, #eef5ef 0%, #ddeede 100%)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: heading + description */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#4a7c59]/15 flex items-center justify-center">
                    <Gift
                      className="w-3.5 h-3.5 text-[#4a7c59]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h2 className="text-base font-heading font-semibold text-gray-800">
                    Refer a Family
                  </h2>
                  <span className="bg-[#4a7c59] text-white text-xs font-body px-2 py-0.5 rounded-full font-medium">
                    $150 gift card
                  </span>
                </div>
                <p className="text-sm font-body text-gray-600 leading-relaxed max-w-lg">
                  Know a family who&apos;d be a great fit for Sage Field? Share
                  your link — when they enroll and pay their registration fee,
                  you&apos;ll receive a $150 gift card.
                </p>

                {/* How it works */}
                {/* <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {[
                    "Share your link with a family",
                    "They apply, get approved & enroll",
                    "You get a $150 gift card",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4a7c59]/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold font-heading text-[#4a7c59]">
                          {i + 1}
                        </span>
                      </div>
                      <p className="text-xs font-body text-gray-600">{step}</p>
                    </div>
                  ))}
                </div> */}
              </div>

              {/* Right: stats + copy link */}
              <div className="flex flex-col gap-3 sm:min-w-[260px]">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: String(referralCount), label: "Referred" },
                    { value: String(enrolledCount), label: "Enrolled" },
                    { value: `$${earnedDollars}`, label: "Earned" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="text-center bg-white/70 rounded-xl py-2.5 px-2 border border-[#c2ddc8]"
                    >
                      <p className="text-base font-semibold font-heading text-gray-800">
                        {value}
                      </p>
                      <p className="text-xs font-body text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Copy link */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-white/70 border border-[#c2ddc8] rounded-xl px-3 py-2">
                    <p className="text-xs font-body text-gray-600 truncate">
                      {referralLink}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-body transition-colors whitespace-nowrap ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: Events + Billing */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-[65px] lg:self-start">
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
            {pendingPayments.length === 0 ? (
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
            ) : (
              <div className="flex flex-col gap-2">
                {pendingPayments.map((payment) => {
                  const studentName = payment.student_id
                    ? (studentMap[payment.student_id]?.name ?? "Student")
                    : "Student";
                  return (
                    <div
                      key={payment.id}
                      className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold font-heading text-gray-800 truncate">
                            {studentName}
                          </p>
                          <p className="text-xs font-body text-gray-500 mt-0.5">
                            {formatProgram(payment.program)}
                          </p>
                          <p className="text-xs font-body text-gray-400 mt-1 truncate">
                            {payment.label}
                          </p>
                        </div>
                        <p className="text-sm font-semibold font-heading text-gray-800 whitespace-nowrap">
                          {formatCents(payment.amount_cents)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Attendance sidebar */}
      <AttendanceSidebar
        student={attendanceStudent}
        onClose={() => setAttendanceStudent(null)}
      />
    </div>
  );
}
