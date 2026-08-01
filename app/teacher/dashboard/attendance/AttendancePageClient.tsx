"use client";

import { useState, useEffect } from "react";
import { Sun, Leaf, Umbrella, ChevronLeft } from "lucide-react";
import AftercarePageClient from "../aftercare/AftercarePageClient";
import FieldFridayPageClient from "../field-friday/FieldFridayPageClient";
import SummerPageClient from "../summer/SummerPageClient";
import SummerLazyLoader from "../summer/SummerLazyLoader";
import AttendanceCalendarView from "./AttendanceCalendarView";
import { getFieldFridayStudentsForDate } from "@/app/actions/fieldFridayAttendance";
import { getAftercareStudentsForDate } from "@/app/actions/aftercareAttendance";
import { getSummerStudentsForWeek } from "@/app/actions/summerAttendance";
import type { AftercareStudentRow } from "@/app/actions/aftercareAttendance";
import type { FieldFridayStudentRow } from "@/app/actions/fieldFridayAttendance";
import type { SummerDayData } from "@/app/actions/summerAttendance";

type Program = "aftercare" | "field-friday" | "summer";

type ViewMode =
  | { view: "programs" }
  | { view: "calendar" }
  | { view: "program-from-calendar"; program: Program; date: string };

interface Props {
  initialAftercareStudents: AftercareStudentRow[];
  initialAftercareDate: string;
}

// Summer week 1 anchor
const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25);
const TOTAL_SUMMER_WEEKS = 12;

function dateToWeekMonday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + daysToMon);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateToSummerWeekNum(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const diffDays = Math.floor((date.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000);
  if (diffDays < 0) return 1;
  const w = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(w, TOTAL_SUMMER_WEEKS));
}

function getInitialFriday(): string {
  const d = new Date();
  const day = d.getDay();
  if (day !== 5) {
    const daysUntilFriday = day === 6 ? 6 : 5 - day;
    d.setDate(d.getDate() + daysUntilFriday);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 px-6 py-6 overflow-y-auto w-full">
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-gray-100 rounded-lg w-48" />
        <div className="h-px bg-gray-100 w-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
}

function FieldFridayLazyLoader() {
  const [data, setData] = useState<{ students: FieldFridayStudentRow[]; date: string } | null>(null);

  useEffect(() => {
    const initialFriday = getInitialFriday();
    getFieldFridayStudentsForDate(initialFriday).then((students) => {
      setData({ students, date: initialFriday });
    });
  }, []);

  if (!data) return <LoadingSkeleton />;
  return <FieldFridayPageClient initialStudents={data.students} initialDate={data.date} />;
}

function AftercareFromCalendar({ date }: { date: string }) {
  const [data, setData] = useState<{ students: AftercareStudentRow[]; date: string } | null>(null);

  useEffect(() => {
    getAftercareStudentsForDate(date).then((students) => {
      setData({ students, date });
    });
  }, [date]);

  if (!data) return <LoadingSkeleton />;
  return <AftercarePageClient initialStudents={data.students} initialDate={data.date} />;
}

function FieldFridayFromCalendar({ date }: { date: string }) {
  const [data, setData] = useState<{ students: FieldFridayStudentRow[]; date: string } | null>(null);

  useEffect(() => {
    getFieldFridayStudentsForDate(date).then((students) => {
      setData({ students, date });
    });
  }, [date]);

  if (!data) return <LoadingSkeleton />;
  return <FieldFridayPageClient initialStudents={data.students} initialDate={data.date} />;
}

function SummerFromCalendar({ date }: { date: string }) {
  const [data, setData] = useState<{ weekData: SummerDayData[]; weekNum: number } | null>(null);

  useEffect(() => {
    const monday = dateToWeekMonday(date);
    const weekNum = dateToSummerWeekNum(date);
    getSummerStudentsForWeek(monday).then((weekData) => {
      setData({ weekData, weekNum });
    });
  }, [date]);

  if (!data) return <LoadingSkeleton />;
  return <SummerPageClient initialWeekData={data.weekData} initialWeekNum={data.weekNum} />;
}

const programs: { id: Program; label: string; icon: React.ElementType }[] = [
  { id: "aftercare", label: "Aftercare", icon: Sun },
  { id: "field-friday", label: "Field Fun Fridays", icon: Leaf },
  { id: "summer", label: "Summer 2026", icon: Umbrella },
];

export default function AttendancePageClient({ initialAftercareStudents, initialAftercareDate }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>({ view: "programs" });
  const [activeProgram, setActiveProgram] = useState<Program>("aftercare");
  const [weekOffset, setWeekOffset] = useState(0);
  const [navKey, setNavKey] = useState(0);

  function handleCalendarBlockClick(program: Program, date: string) {
    setNavKey((k) => k + 1);
    setViewMode({ view: "program-from-calendar", program, date });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Top toggle bar */}
      <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-1">
        <button
          onClick={() => setViewMode({ view: "programs" })}
          className={`px-3 py-1.5 text-sm font-body rounded-lg transition-colors ${
            viewMode.view === "programs"
              ? "bg-[#4a7c59]/10 text-[#4a7c59] font-semibold"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Programs
        </button>
        <button
          onClick={() => setViewMode({ view: "calendar" })}
          className={`px-3 py-1.5 text-sm font-body rounded-lg transition-colors ${
            viewMode.view !== "programs"
              ? "bg-[#4a7c59]/10 text-[#4a7c59] font-semibold"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Calendar
        </button>
        {viewMode.view === "program-from-calendar" && (
          <button
            onClick={() => setViewMode({ view: "calendar" })}
            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors font-body"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Calendar
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — only visible in Programs mode */}
        {viewMode.view === "programs" && (
          <aside className="w-52 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col py-6 px-3 gap-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2 font-body">
              Programs
            </p>
            {programs.map(({ id, label, icon: Icon }) => {
              const isActive = activeProgram === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveProgram(id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-body rounded-xl transition-colors ${
                    isActive
                      ? id === "summer"
                        ? "bg-[#d97706]/8 text-[#d97706] font-semibold border-l-2 border-[#d97706]"
                        : "bg-[#4a7c59]/8 text-[#4a7c59] font-semibold border-l-2 border-[#4a7c59]"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-l-2 border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              );
            })}
          </aside>
        )}

        <div className="flex-1 overflow-hidden flex">
          {/* Programs view */}
          {viewMode.view === "programs" && activeProgram === "aftercare" && (
            <AftercarePageClient
              initialStudents={initialAftercareStudents}
              initialDate={initialAftercareDate}
            />
          )}
          {viewMode.view === "programs" && activeProgram === "field-friday" && (
            <FieldFridayLazyLoader />
          )}
          {viewMode.view === "programs" && activeProgram === "summer" && (
            <SummerLazyLoader />
          )}

          {/* Calendar view */}
          {viewMode.view === "calendar" && (
            <AttendanceCalendarView
              key={weekOffset}
              weekOffset={weekOffset}
              onWeekOffsetChange={setWeekOffset}
              onBlockClick={handleCalendarBlockClick}
            />
          )}

          {/* Program from calendar */}
          {viewMode.view === "program-from-calendar" && viewMode.program === "aftercare" && (
            <AftercareFromCalendar key={navKey} date={viewMode.date} />
          )}
          {viewMode.view === "program-from-calendar" && viewMode.program === "field-friday" && (
            <FieldFridayFromCalendar key={navKey} date={viewMode.date} />
          )}
          {viewMode.view === "program-from-calendar" && viewMode.program === "summer" && (
            <SummerFromCalendar key={navKey} date={viewMode.date} />
          )}
        </div>
      </div>
    </div>
  );
}
