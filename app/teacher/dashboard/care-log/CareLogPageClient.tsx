"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  Search,
  Droplets,
  Bug,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getCareLogStudentsForDate,
  logCareActivityBatch,
  logCareActivity,
} from "@/app/actions/careLog";
import type { CareLogStudentRow, CareActivity } from "@/app/actions/careLog";

interface Props {
  initialStudents: CareLogStudentRow[];
  initialDate: string;
}

type PageMode = "batch" | "individual";

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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const ACTIVITIES: { value: CareActivity; label: string; Icon: typeof Droplets }[] = [
  { value: "sunscreen", label: "Sunscreen", Icon: Droplets },
  { value: "bug_spray", label: "Bug Spray", Icon: Bug },
];

export default function CareLogPageClient({ initialStudents, initialDate }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [students, setStudents] = useState<CareLogStudentRow[]>(initialStudents);
  const [loadingDate, setLoadingDate] = useState(false);

  const [calOpen, setCalOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => Number(initialDate.split("-")[0]));
  const [calMonth, setCalMonth] = useState(() => Number(initialDate.split("-")[1]) - 1);
  const calRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [pageMode, setPageMode] = useState<PageMode>("batch");

  // Batch mode
  const [selectedActivity, setSelectedActivity] = useState<CareActivity | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [savingBatch, setSavingBatch] = useState(false);

  // Individual mode
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [loggingFor, setLoggingFor] = useState<{ studentId: string; activity: CareActivity } | null>(null);
  const [savingIndividual, setSavingIndividual] = useState(false);

  const todayStr = getTodayWeekday();
  const isToday = selectedDate === todayStr;

  useEffect(() => {
    if (!calOpen) return;
    function handleOutside(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [calOpen]);

  async function handleDateChange(newDate: string) {
    setLoadingDate(true);
    setSelectedDate(newDate);
    setSelectedStudentIds(new Set());
    setExpandedStudentId(null);
    const rows = await getCareLogStudentsForDate(newDate);
    setStudents(rows);
    setLoadingDate(false);
  }

  async function handleBatchSubmit() {
    if (!selectedActivity || selectedStudentIds.size === 0) return;
    setSavingBatch(true);
    const ids = [...selectedStudentIds];
    const newEntryMap = await logCareActivityBatch(ids, selectedDate, selectedActivity);
    setStudents((prev) =>
      prev.map((s) => {
        const newEntry = newEntryMap.get(s.student_id);
        if (!newEntry) return s;
        return { ...s, entries: [...s.entries, newEntry] };
      })
    );
    setSelectedStudentIds(new Set());
    setSavingBatch(false);
  }

  function switchMode(m: PageMode) {
    setPageMode(m);
    setSelectedStudentIds(new Set());
    setSelectedActivity(null);
    setExpandedStudentId(null);
  }

  const totalEntriesToday = students.reduce((acc, s) => acc + s.entries.length, 0);

  const filteredStudents = search.trim()
    ? students.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
    : students;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 px-6 py-6 overflow-y-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#4a7c59]">Care Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalEntriesToday} application{totalEntriesToday !== 1 ? "s" : ""} logged today
          </p>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-3 mb-6 justify-between">
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

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59]/20 transition-colors w-56"
            />
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-5">
          {(["batch", "individual"] as PageMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-3 py-1.5 text-sm font-body rounded-lg transition-colors ${
                pageMode === m
                  ? "bg-[#4a7c59]/10 text-[#4a7c59] font-semibold"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {m === "batch" ? "Batch Log" : "Individual"}
            </button>
          ))}
        </div>

        {/* Batch mode: activity selector */}
        {pageMode === "batch" && (
          <>
            <div className="flex gap-2 mb-3">
              {ACTIVITIES.map(({ value, label, Icon }) => {
                const isActive = selectedActivity === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSelectedActivity(isActive ? null : value);
                      setSelectedStudentIds(new Set());
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      isActive
                        ? "bg-[#4a7c59] border-[#4a7c59] text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-[#4a7c59]/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            {selectedActivity && !loadingDate && (
              <div className="flex gap-3 mb-4 text-xs">
                <button
                  onClick={() => setSelectedStudentIds(new Set(filteredStudents.map((s) => s.student_id)))}
                  className="text-[#4a7c59] font-medium hover:underline"
                >
                  Select all ({filteredStudents.length})
                </button>
                {selectedStudentIds.size > 0 && (
                  <button
                    onClick={() => setSelectedStudentIds(new Set())}
                    className="text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Student list */}
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {loadingDate && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                  </div>
                  <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                </div>
              ))}
            </>
          )}

          {!loadingDate && filteredStudents.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              {search.trim() ? `No students match "${search}".` : "No enrolled students found."}
            </div>
          )}

          {!loadingDate && filteredStudents.map((row) => {
            const isExpanded = expandedStudentId === row.student_id;
            const isChecked = selectedStudentIds.has(row.student_id);

            return (
              <div key={row.student_id}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-5 py-3 transition-colors">
                  {/* Avatar */}
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

                  {/* Name + grade */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{row.name ?? "—"}</p>
                    {row.grade && (
                      <p className="text-xs text-gray-400 truncate">{row.grade}</p>
                    )}
                  </div>

                  {/* Entry count badge */}
                  {row.entries.length > 0 && (
                    <span className="text-xs font-semibold text-[#4a7c59] bg-[#4a7c59]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      {row.entries.length}×
                    </span>
                  )}

                  {/* Batch mode: checkbox */}
                  {pageMode === "batch" && (
                    <button
                      disabled={!selectedActivity || savingBatch}
                      onClick={() => {
                        if (!selectedActivity) return;
                        setSelectedStudentIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(row.student_id)) next.delete(row.student_id);
                          else next.add(row.student_id);
                          return next;
                        });
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isChecked
                          ? "bg-[#4a7c59] border-[#4a7c59]"
                          : "bg-transparent border-gray-300 hover:border-[#4a7c59]"
                      } ${!selectedActivity ? "opacity-30 cursor-not-allowed" : ""}`}
                      aria-label={isChecked ? "Deselect student" : "Select student"}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Individual mode: expand toggle */}
                  {pageMode === "individual" && (
                    <button
                      onClick={() => setExpandedStudentId(isExpanded ? null : row.student_id)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                      aria-label={isExpanded ? "Collapse" : "Expand log"}
                    >
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </button>
                  )}
                </div>

                {/* Individual mode: expanded entry panel */}
                {pageMode === "individual" && isExpanded && (
                  <div className="px-5 pb-4 pt-2 bg-gray-50 border-b border-gray-100">
                    {/* Existing entries */}
                    {row.entries.length === 0 ? (
                      <p className="text-xs text-gray-400 mb-3">No entries logged for this date yet.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5 mb-3">
                        {row.entries.map((entry) => {
                          const act = ACTIVITIES.find((a) => a.value === entry.activity);
                          const Icon = act?.Icon ?? Droplets;
                          return (
                            <div key={entry.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <Icon className="w-3.5 h-3.5 text-[#4a7c59] flex-shrink-0" />
                              <span className="font-medium">{act?.label ?? entry.activity}</span>
                              <span className="text-gray-400">{formatTime(entry.logged_at)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick-log buttons */}
                    <div className="flex gap-2">
                      {ACTIVITIES.map(({ value, label, Icon }) => {
                        const isLoggingThis =
                          loggingFor?.studentId === row.student_id &&
                          loggingFor?.activity === value;
                        return (
                          <button
                            key={value}
                            disabled={savingIndividual}
                            onClick={async () => {
                              setLoggingFor({ studentId: row.student_id, activity: value });
                              setSavingIndividual(true);
                              const newEntry = await logCareActivity(row.student_id, selectedDate, value);
                              if (newEntry) {
                                setStudents((prev) =>
                                  prev.map((s) =>
                                    s.student_id === row.student_id
                                      ? { ...s, entries: [...s.entries, newEntry] }
                                      : s
                                  )
                                );
                              }
                              setLoggingFor(null);
                              setSavingIndividual(false);
                            }}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#4a7c59]/30 text-[#4a7c59] hover:bg-[#4a7c59]/10 disabled:opacity-40 transition-colors"
                          >
                            {isLoggingThis && savingIndividual
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Icon className="w-3 h-3" />
                            }
                            + {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky batch submit bar */}
      {pageMode === "batch" && selectedStudentIds.size > 0 && selectedActivity && (
        <div className="border-t border-gray-100 bg-white px-6 py-3 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-gray-600">
            {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            disabled={savingBatch}
            onClick={handleBatchSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-[#4a7c59] text-white text-sm font-semibold rounded-xl hover:bg-[#3d6b4a] disabled:opacity-40 transition-colors"
          >
            {savingBatch && <Loader2 className="w-4 h-4 animate-spin" />}
            Log {selectedActivity === "sunscreen" ? "Sunscreen" : "Bug Spray"} for {selectedStudentIds.size}
          </button>
        </div>
      )}
    </div>
  );
}
