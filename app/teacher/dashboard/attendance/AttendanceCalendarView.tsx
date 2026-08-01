"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekHeadcounts } from "@/app/actions/attendanceOverview";
import type { DayHeadcounts, EnrolledStudentPreview } from "@/app/actions/attendanceOverview";

type Program = "aftercare" | "field-friday" | "summer";

interface Props {
  onBlockClick: (program: Program, date: string) => void;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const SUMMER_WEEKS = [
  { label: "May 25 – May 29" },
  { label: "Jun 1 – Jun 5" },
  { label: "Jun 8 – Jun 12" },
  { label: "Jun 15 – Jun 19" },
  { label: "Jun 22 – Jun 26" },
  { label: "Jun 29 – Jul 3" },
  { label: "Jul 6 – Jul 10" },
  { label: "Jul 13 – Jul 17" },
  { label: "Jul 20 – Jul 24" },
  { label: "Jul 27 – Jul 31" },
  { label: "Aug 3 – Aug 7" },
  { label: "Aug 10 – Aug 14" },
];

const TOTAL_WEEKS = SUMMER_WEEKS.length - 1; // max offset = 11

// Calendar always starts from Summer Week 1 — offset 0 = May 25, 2026
const CALENDAR_BASE_MONDAY = "2026-05-25";

function getWeekMonday(offset: number): string {
  const [y, m, d] = CALENDAR_BASE_MONDAY.split("-").map(Number);
  const base = new Date(y, m - 1, d + offset * 7);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}

function getWeekDates(weekMonday: string): string[] {
  const [y, m, d] = weekMonday.split("-").map(Number);
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(y, m - 1, d + i);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

function formatWeekRange(weekMonday: string): string {
  const dates = getWeekDates(weekMonday);
  return `${formatShortDate(dates[0])} – ${formatShortDate(dates[4])}`;
}

function getTodayStr(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  "#4a7c59", "#d97706", "#2563eb", "#7c3aed",
  "#db2777", "#0891b2", "#dc2626", "#059669",
  "#0d9488", "#6d28d9",
];

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) & 0xfffffff;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function AvatarCircle({ student }: { student: EnrolledStudentPreview }) {
  if (student.profile_image_url) {
    return (
      <img
        src={student.profile_image_url}
        alt=""
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
      style={{ backgroundColor: avatarColor(student.student_id) }}
    >
      {getInitials(student.name)}
    </div>
  );
}

function OverflowPill({ count, color }: { count: number; color: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
      style={{ backgroundColor: hexToRgba(color, 0.2), color }}
    >
      +{count}
    </div>
  );
}

interface ProgramBlockProps {
  label: string;
  color: string;
  enrolled: number;
  students: EnrolledStudentPreview[];
  isLoading: boolean;
  onClick: () => void;
}

function ProgramBlock({ label, color, enrolled, students, isLoading, onClick }: ProgramBlockProps) {
  const preview = students.slice(0, 3);
  const overflow = students.length - 3;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl transition-opacity hover:opacity-90"
      style={{
        backgroundColor: hexToRgba(color, 0.10),
        border: `1px solid ${hexToRgba(color, 0.22)}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold font-body truncate" style={{ color }}>
            {label}
          </p>
          {isLoading ? (
            <div className="h-3 w-16 rounded animate-pulse mt-1" style={{ backgroundColor: hexToRgba(color, 0.2) }} />
          ) : (
            <p className="text-xs mt-0.5 font-body" style={{ color: hexToRgba(color, 0.7) }}>
              {enrolled} enrolled
            </p>
          )}
        </div>
        <div className="flex items-center flex-shrink-0" style={{ marginRight: "-2px" }}>
          <div className="flex -space-x-1.5">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full animate-pulse flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(color, 0.2) }}
                />
              ))
            ) : (
              <>
                {preview.map((s) => (
                  <AvatarCircle key={s.student_id} student={s} />
                ))}
                {overflow > 0 && <OverflowPill count={overflow} color={color} />}
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function AttendanceCalendarView({ onBlockClick, weekOffset, onWeekOffsetChange }: Props) {
  const [headcounts, setHeadcounts] = useState<DayHeadcounts[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeWeekRef = useRef<HTMLButtonElement | null>(null);

  const weekMonday = getWeekMonday(weekOffset);
  const dates = getWeekDates(weekMonday);
  const todayStr = getTodayStr();

  useEffect(() => {
    let cancelled = false;
    getWeekHeadcounts(weekMonday).then((data) => {
      if (cancelled) return;
      setHeadcounts(data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [weekMonday]);

  useEffect(() => {
    activeWeekRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [weekOffset]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left week navigation panel */}
      <aside className="w-44 flex-shrink-0 border-r border-gray-100 overflow-y-auto py-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2 font-body">
          Weeks
        </p>
        {SUMMER_WEEKS.map((week, i) => {
          const isActive = weekOffset === i;
          return (
            <button
              key={i}
              ref={isActive ? activeWeekRef : undefined}
              onClick={() => onWeekOffsetChange(i)}
              className={`w-full text-left px-4 py-2.5 font-body transition-colors ${
                isActive
                  ? "bg-[#4a7c59]/10 text-[#4a7c59]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                className="block text-[10px] font-semibold uppercase tracking-wide mb-0.5 font-body"
                style={{ color: isActive ? "#4a7c59" : "#9ca3af" }}
              >
                Week {i + 1}
              </span>
              <span className={`text-xs font-body ${isActive ? "font-semibold" : ""}`}>
                {week.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Right: header + calendar grid */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-800 font-body">Week Overview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onWeekOffsetChange(Math.max(0, weekOffset - 1))}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              disabled={weekOffset === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 font-body min-w-[130px] text-center">
              {formatWeekRange(weekMonday)}
            </span>
            <button
              onClick={() => onWeekOffsetChange(Math.min(TOTAL_WEEKS, weekOffset + 1))}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              disabled={weekOffset === TOTAL_WEEKS}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-5 gap-3 border-t border-gray-100 pt-5">
          {dates.map((date, i) => {
            const dayData = headcounts?.find((h) => h.date === date);
            const isToday = date === todayStr;
            const isFriday = i === 4;

            return (
              <div key={date} className="flex flex-col gap-2">
                {/* Day header */}
                <div className="flex flex-col items-start gap-0.5 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">
                      {DAY_NAMES[i]}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-semibold bg-[#4a7c59] text-white px-1.5 py-0.5 rounded-full font-body">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 font-body">{formatShortDate(date)}</span>
                </div>

                {/* Program blocks — Summer first, then Aftercare on Mon–Thu; Field Friday on Fri */}
                {isFriday ? (
                  <ProgramBlock
                    label="Field Fun Fridays"
                    color="#16a34a"
                    enrolled={dayData?.fieldFriday?.enrolled ?? 0}
                    students={dayData?.fieldFriday?.students ?? []}
                    isLoading={isLoading}
                    onClick={() => onBlockClick("field-friday", date)}
                  />
                ) : (
                  <>
                    <ProgramBlock
                      label="Summer 2026"
                      color="#d97706"
                      enrolled={dayData?.summer.enrolled ?? 0}
                      students={dayData?.summer.students ?? []}
                      isLoading={isLoading}
                      onClick={() => onBlockClick("summer", date)}
                    />
                    <ProgramBlock
                      label="Aftercare"
                      color="#4a7c59"
                      enrolled={dayData?.aftercare.enrolled ?? 0}
                      students={dayData?.aftercare.students ?? []}
                      isLoading={isLoading}
                      onClick={() => onBlockClick("aftercare", date)}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
