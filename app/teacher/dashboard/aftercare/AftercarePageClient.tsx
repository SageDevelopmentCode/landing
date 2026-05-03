"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import {
  getAftercareStudentsForDate,
  upsertAfterCareRecord,
  removeAfterCareRecord,
} from "@/app/actions/aftercareAttendance";
import type { AftercareStudentRow } from "@/app/actions/aftercareAttendance";

interface Props {
  initialStudents: AftercareStudentRow[];
  initialDate: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${d}`;
}

function getTodayWeekday(): string {
  const d = new Date();
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftWeekday(dateStr: string, delta: 1 | -1): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  do {
    date.setDate(date.getDate() + delta);
  } while (date.getDay() === 0 || date.getDay() === 6);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "#4a7c59", "#6b9e7a", "#3d6b4e", "#527a62", "#7aab8a",
  "#5c8f6e", "#436854", "#618f72", "#4e8060", "#3a5e49",
];

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) & 0xfffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function AftercarePageClient({ initialStudents, initialDate }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [students, setStudents] = useState<AftercareStudentRow[]>(initialStudents);
  const [loadingDate, setLoadingDate] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const [calOpen, setCalOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => Number(initialDate.split("-")[0]));
  const [calMonth, setCalMonth] = useState(() => Number(initialDate.split("-")[1]) - 1);
  const calRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayWeekday();
  const isToday = selectedDate === todayStr;

  useEffect(() => {
    if (!calOpen) return;
    function handleOutside(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setCalOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [calOpen]);

  async function handleDateChange(newDate: string) {
    setLoadingDate(true);
    setSelectedDate(newDate);
    const rows = await getAftercareStudentsForDate(newDate);
    setStudents(rows);
    setLoadingDate(false);
  }

  function addSaving(id: string) {
    setSavingIds((prev) => new Set(prev).add(id));
  }

  function removeSaving(id: string) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleCheckboxChange(row: AftercareStudentRow, checked: boolean) {
    addSaving(row.student_id);
    if (checked) {
      const record = await upsertAfterCareRecord(row.student_id, selectedDate, null);
      setStudents((prev) =>
        prev.map((s) => (s.student_id === row.student_id ? { ...s, record } : s))
      );
    } else if (row.record) {
      await removeAfterCareRecord(row.record.id);
      setStudents((prev) =>
        prev.map((s) => (s.student_id === row.student_id ? { ...s, record: null } : s))
      );
    }
    removeSaving(row.student_id);
  }

  function handleTimeChange(row: AftercareStudentRow, value: string) {
    const existing = debounceRefs.current.get(row.student_id);
    if (existing) clearTimeout(existing);

    // Optimistically update display value
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === row.student_id && s.record
          ? { ...s, record: { ...s.record, pickup_time: value || null } }
          : s
      )
    );

    const timeout = setTimeout(async () => {
      addSaving(row.student_id);
      const record = await upsertAfterCareRecord(row.student_id, selectedDate, value || null);
      if (record) {
        setStudents((prev) =>
          prev.map((s) => (s.student_id === row.student_id ? { ...s, record } : s))
        );
      }
      removeSaving(row.student_id);
      debounceRefs.current.delete(row.student_id);
    }, 800);

    debounceRefs.current.set(row.student_id, timeout);
  }

  const aftercareCount = students.filter((s) => s.record !== null).length;

  return (
    <div className="flex-1 px-6 py-6 overflow-y-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#4a7c59]">Aftercare Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">
          {aftercareCount} of {students.length} student{students.length !== 1 ? "s" : ""} in aftercare
        </p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => handleDateChange(shiftWeekday(selectedDate, -1))}
          disabled={loadingDate}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        <div className="relative" ref={calRef}>
          <button
            onClick={() => {
              const [y, m] = selectedDate.split("-").map(Number);
              setCalYear(y);
              setCalMonth(m - 1);
              setCalOpen((prev) => !prev);
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 min-w-[140px] justify-center px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {formatDateLabel(selectedDate)}
            {isToday && (
              <span className="ml-1 text-xs font-medium text-[#4a7c59] bg-[#4a7c59]/10 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
            <CalendarIcon className="w-3.5 h-3.5 text-gray-400 ml-0.5 flex-shrink-0" />
          </button>

          {calOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-xl border border-gray-200 shadow-lg p-3 w-64">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
                    else setCalMonth((m) => m - 1);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
                    else setCalMonth((m) => m + 1);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
                  <div
                    key={i}
                    className={`text-center text-xs font-semibold py-1 ${i >= 5 ? "text-gray-300" : "text-gray-400"}`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {getMonthDays(calYear, calMonth).map((d, i) => {
                  if (!d) return <div key={`e-${i}`} />;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const dateStr = toDateStr(d);
                  const isSel = dateStr === selectedDate;
                  const isTod = dateStr === todayStr;
                  return (
                    <button
                      key={dateStr}
                      disabled={isWeekend}
                      onClick={() => { handleDateChange(dateStr); setCalOpen(false); }}
                      className={`relative flex items-center justify-center w-full aspect-square rounded-lg text-xs font-medium transition-colors ${
                        isWeekend
                          ? "text-gray-300 cursor-not-allowed"
                          : isSel
                          ? "bg-[#4a7c59] text-white"
                          : "text-gray-700 hover:bg-[#4a7c59]/10 cursor-pointer"
                      }`}
                    >
                      {d.getDate()}
                      {isTod && !isSel && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#4a7c59]" />
                      )}
                      {isTod && isSel && (
                        <span className="absolute inset-0 rounded-lg ring-2 ring-[#4a7c59] ring-offset-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => handleDateChange(shiftWeekday(selectedDate, 1))}
          disabled={loadingDate}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>

        {!isToday && (
          <button
            onClick={() => handleDateChange(todayStr)}
            disabled={loadingDate}
            className="text-xs font-medium text-[#4a7c59] border border-[#4a7c59]/30 bg-[#4a7c59]/5 hover:bg-[#4a7c59]/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            Today
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_160px_100px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">In Aftercare</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Pickup Time</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</span>
        </div>

        {/* Loading skeleton */}
        {loadingDate && (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_160px_100px] gap-4 px-5 py-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-8" />
                <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-28" />
                <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Student rows */}
        {!loadingDate && students.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No enrolled students found.
          </div>
        )}

        {!loadingDate && students.length > 0 && (
          <div className="divide-y divide-gray-50">
            {students.map((row) => {
              const isSaving = savingIds.has(row.student_id);
              const isChecked = row.record !== null;

              return (
                <div
                  key={row.student_id}
                  className="grid grid-cols-[1fr_120px_160px_100px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50 transition-colors"
                >
                  {/* Student name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    {row.profile_image_url ? (
                      <img
                        src={row.profile_image_url}
                        alt={row.name ?? ""}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: avatarColor(row.student_id) }}
                      >
                        {getInitials(row.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{row.name ?? "—"}</p>
                      {row.grade && (
                        <p className="text-xs text-gray-400 truncate">{row.grade}</p>
                      )}
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#4a7c59]" />
                    ) : (
                      <button
                        onClick={() => handleCheckboxChange(row, !isChecked)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isChecked
                            ? "bg-[#4a7c59] border-[#4a7c59]"
                            : "bg-white border-gray-300 hover:border-[#4a7c59]"
                        }`}
                        aria-label={isChecked ? "Remove from aftercare" : "Mark in aftercare"}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Pickup time */}
                  <div className="flex items-center justify-center">
                    <input
                      type="time"
                      value={row.record?.pickup_time ?? ""}
                      disabled={!isChecked || isSaving}
                      onChange={(e) => handleTimeChange(row, e.target.value)}
                      className={`text-sm rounded-lg border px-2 py-1.5 w-28 text-center transition-colors ${
                        isChecked && !isSaving
                          ? "border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59]/20"
                          : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center">
                    {isSaving ? (
                      <span className="text-xs text-gray-400">Saving…</span>
                    ) : isChecked ? (
                      <span className="text-xs font-medium text-[#4a7c59] bg-[#4a7c59]/10 px-2.5 py-1 rounded-full">
                        Recorded
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
