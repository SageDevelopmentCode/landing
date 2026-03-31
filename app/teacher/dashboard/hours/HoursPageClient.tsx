"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Clock,
  CalendarDays,
  LayoutGrid,
  Minus,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
type DayStatus = "logged" | "today" | "not-logged" | "future";

type TimeEntry = {
  startTime: string;
  endTime: string;
  note: string;
};

type TimesheetState = {
  [isoDateKey: string]: TimeEntry;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: TimesheetState = {
  "2026-03-23": { startTime: "08:00", endTime: "15:30", note: "Morning circle, outdoor math" },
  "2026-03-24": { startTime: "07:45", endTime: "15:00", note: "Reading groups & assessments" },
  "2026-03-25": { startTime: "08:15", endTime: "15:45", note: "Art project day" },
  "2026-03-26": { startTime: "08:00", endTime: "15:30", note: "Parent-teacher prep" },
  "2026-03-27": { startTime: "08:00", endTime: "13:00", note: "Half day — professional development" },
  "2026-03-30": { startTime: "08:00", endTime: "15:30", note: "Morning circle, outdoor math station" },
  "2026-03-31": { startTime: "07:45", endTime: "15:45", note: "Field day prep & parent check-ins" },
};

const WEEKLY_GOAL = 40;

const TIME_PRESETS = [
  { label: "8:00 AM", value: "08:00" },
  { label: "8:30 AM", value: "08:30" },
  { label: "9:00 AM", value: "09:00" },
];
const END_PRESETS = [
  { label: "3:00 PM", value: "15:00" },
  { label: "3:30 PM", value: "15:30" },
  { label: "4:00 PM", value: "16:00" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISOKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function computeHours(entry: TimeEntry): number {
  if (!entry.startTime || !entry.endTime) return 0;
  const diff = parseMinutes(entry.endTime) - parseMinutes(entry.startTime);
  return Math.max(0, diff / 60);
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m === 0) return "0h";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getDayStatus(isoKey: string, todayKey: string): DayStatus {
  if (isoKey === todayKey) return "today";
  if (isoKey < todayKey) return "not-logged";
  return "future";
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon-start
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekTotalHours(monday: Date, entries: TimesheetState): number {
  return getWeekDays(monday).reduce((acc, d) => {
    const entry = entries[toISOKey(d)];
    return acc + (entry ? computeHours(entry) : 0);
  }, 0);
}

function fmt12(time24: string): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  selectedDate,
  onDateChange,
  entries,
  onSave,
  onDelete,
}: {
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  entries: TimesheetState;
  onSave: (key: string, entry: TimeEntry) => void;
  onDelete: (key: string) => void;
}) {
  const todayKey = toISOKey(new Date());
  const selectedKey = toISOKey(selectedDate);
  const existing = entries[selectedKey] ?? null;

  const [startTime, setStartTime] = useState(existing?.startTime ?? "08:30");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "15:30");
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  // Sync form when selected date changes
  useEffect(() => {
    const e = entries[toISOKey(selectedDate)];
    setStartTime(e?.startTime ?? "08:30");
    setEndTime(e?.endTime ?? "15:30");
    setNote(e?.note ?? "");
    setSaved(false);
  }, [selectedDate, entries]);

  const duration =
    startTime && endTime ? computeHours({ startTime, endTime, note: "" }) : null;
  const canSave = !!startTime && !!endTime && endTime > startTime;
  const isLogged = !!existing;

  function handleSave() {
    if (!canSave) return;
    onSave(selectedKey, { startTime, endTime, note });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    onDelete(selectedKey);
  }

  const isToday = selectedKey === todayKey;
  const isFuture = selectedKey > todayKey;

  const dayFull = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col"
      >
        {/* Day header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-semibold font-heading text-gray-800">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </h2>
            {isToday && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium font-body bg-amber-50 text-amber-600 border border-amber-200">
                Today
              </span>
            )}
            {isLogged && !isToday && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-body bg-[#4a7c59]/10 text-[#4a7c59]">
                <Check className="w-3 h-3" /> Logged
              </span>
            )}
            <AnimatePresence>
              {duration !== null && duration > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#4a7c59]/8 rounded-full"
                >
                  <Clock className="w-3.5 h-3.5 text-[#4a7c59]" />
                  <span className="text-sm font-semibold text-[#4a7c59] font-body tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-sm text-gray-400 font-body">{dayFull.split(", ").slice(1).join(", ")}</p>
        </div>

          {/* Time inputs */}
          <div className="flex gap-6 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 font-body mb-3 uppercase tracking-wide">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setSaved(false); }}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl font-body text-lg text-gray-800 focus:outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10 transition-all bg-white tabular-nums"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setStartTime(p.value); setSaved(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all cursor-pointer
                      ${startTime === p.value
                        ? "bg-[#4a7c59] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center mt-7 shrink-0 px-2">
              <Minus className="w-5 h-5 text-gray-200" />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 font-body mb-3 uppercase tracking-wide">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setSaved(false); }}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl font-body text-lg text-gray-800 focus:outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10 transition-all bg-white tabular-nums"
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {END_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setEndTime(p.value); setSaved(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all cursor-pointer
                      ${endTime === p.value
                        ? "bg-[#4a7c59] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 font-body mb-3 uppercase tracking-wide">
              Notes{" "}
              <span className="normal-case font-normal tracking-normal text-gray-300">
                (optional)
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => { setNote(e.target.value); setSaved(false); }}
              placeholder="What did you work on today?"
              rows={3}
              className="w-full px-5 py-4 border border-gray-200 rounded-xl font-body text-sm text-gray-800 focus:outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10 transition-all bg-white resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#4a7c59] bg-[#4a7c59]/10 rounded-xl"
                  >
                    <Check className="w-4 h-4" />
                    Saved
                  </motion.div>
                ) : (
                  <motion.button
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleSave}
                    disabled={!canSave}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-[#4a7c59] rounded-xl hover:bg-[#5e7c68] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isLogged ? "Update Hours" : "Save Hours"}
                  </motion.button>
                )}
              </AnimatePresence>

              {isLogged && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-400 border border-red-100 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  entries,
  onDayClick,
}: {
  entries: TimesheetState;
  onDayClick: (date: Date, switchView: boolean) => void;
}) {
  const todayKey = toISOKey(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = getMondayOfWeek(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(monday);
  const totalHours = getWeekTotalHours(monday, entries);

  const weekLabel = (() => {
    const fri = new Date(monday);
    fri.setDate(monday.getDate() + 4);
    const s = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = fri.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  })();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 font-body">
              {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : weekLabel.split("–")[0].trim()}
            </h2>
            <p className="text-xs text-gray-400 font-body mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-body text-gray-500 tabular-nums mr-2">
              {formatDuration(totalHours)}
              <span className="text-xs font-normal text-gray-300 ml-1">/ {WEEKLY_GOAL}h</span>
            </span>
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day rows */}
        <div className="flex flex-col gap-3">
          {weekDays.map((d, i) => {
            const key = toISOKey(d);
            const entry = entries[key] ?? null;
            const isLogged = !!entry;
            const isToday = key === todayKey;
            const status = isLogged ? "logged" : getDayStatus(key, todayKey);
            const duration = entry ? computeHours(entry) : 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => onDayClick(d, true)}
                className={`flex items-center gap-5 px-5 py-4 rounded-xl border cursor-pointer transition-all duration-150 group
                  ${isLogged
                    ? "border-l-[3px] border-l-[#4a7c59] border-t-gray-100 border-r-gray-100 border-b-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm"
                    : isToday
                    ? "border border-[#4a7c59]/20 bg-[#4a7c59]/5 hover:shadow-sm"
                    : "border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#4a7c59]/15 hover:shadow-sm"
                  }`}
              >
                <div className="w-32 shrink-0">
                  <p className="text-sm font-semibold text-gray-800 font-body">
                    {d.toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                  <p className="text-xs text-gray-400 font-body mt-0.5">
                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>

                <div className="w-24 shrink-0">
                  {isLogged ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-body bg-[#4a7c59]/10 text-[#4a7c59]">
                      <Check className="w-3 h-3" /> Logged
                    </span>
                  ) : isToday ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-body bg-amber-50 text-amber-600 border border-amber-200">
                      Today
                    </span>
                  ) : status === "future" ? (
                    <span className="text-xs text-gray-300 font-body">Upcoming</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-body bg-gray-100 text-gray-400">
                      Not logged
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {entry ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-gray-700 font-body tabular-nums">
                        {fmt12(entry.startTime)} – {fmt12(entry.endTime)}
                      </span>
                      <span className="text-xs text-[#4a7c59] font-semibold font-body bg-[#4a7c59]/8 px-2.5 py-1 rounded-full">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300 font-body">—</span>
                  )}
                  {entry?.note && (
                    <p className="text-xs text-gray-400 font-body mt-1 truncate">{entry.note}</p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.div>
            );
          })}
        </div>

        {/* Week total */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-body font-semibold uppercase tracking-widest">
            Week total
          </span>
          <span className="text-base font-semibold text-gray-700 font-body tabular-nums">
            {formatDuration(totalHours)}{" "}
            <span className="text-sm font-normal text-gray-400">of {WEEKLY_GOAL}h</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  entries,
  onDayClick,
}: {
  entries: TimesheetState;
  onDayClick: (date: Date, switchView: boolean) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const todayKey = toISOKey(today);

  const cells = getMonthDays(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const loggedCount = cells.filter((d) => d && entries[toISOKey(d)]).length;
  const totalLoggedHours = cells.reduce((acc, d) => {
    if (!d) return acc;
    const e = entries[toISOKey(d)];
    return acc + (e ? computeHours(e) : 0);
  }, 0);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 font-body">{monthLabel}</h2>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              {loggedCount} day{loggedCount !== 1 ? "s" : ""} logged · {formatDuration(totalLoggedHours)} total
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-300 font-body py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) {
              return <div key={`empty-${i}`} />;
            }
            const key = toISOKey(d);
            const entry = entries[key];
            const isLogged = !!entry;
            const isToday = key === todayKey;
            const isFuture = key > todayKey;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const hours = entry ? computeHours(entry) : 0;

            return (
              <button
                key={key}
                onClick={() => !isWeekend && onDayClick(d, true)}
                disabled={isWeekend}
                className={`relative flex flex-col items-center justify-start rounded-xl py-2 px-1 transition-all cursor-pointer group
                  ${isWeekend ? "cursor-default opacity-30" : ""}
                  ${isLogged && !isWeekend
                    ? "bg-[#4a7c59]/8 hover:bg-[#4a7c59]/15"
                    : isToday
                    ? "ring-2 ring-[#4a7c59]/30 hover:bg-gray-50"
                    : !isWeekend
                    ? "hover:bg-gray-50"
                    : ""
                  }`}
              >
                <span className={`text-sm font-medium font-body leading-none mb-1.5
                  ${isToday
                    ? "w-6 h-6 flex items-center justify-center rounded-full bg-[#4a7c59] text-white text-xs"
                    : isLogged
                    ? "text-gray-800"
                    : isFuture
                    ? "text-gray-300"
                    : "text-gray-500"
                  }`}
                >
                  {d.getDate()}
                </span>
                {isLogged && (
                  <span className="text-[10px] font-semibold text-[#4a7c59] font-body tabular-nums leading-none">
                    {formatDuration(hours)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#4a7c59]/15" />
            <span className="text-xs text-gray-400 font-body">Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-[#4a7c59]/30" />
            <span className="text-xs text-gray-400 font-body">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span className="text-xs text-gray-400 font-body">Not logged</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Summary Panel ────────────────────────────────────────────────────────────

function SummaryPanel({ entries }: { entries: TimesheetState }) {
  const today = new Date();
  const todayKey = toISOKey(today);

  // This week
  const monday = getMondayOfWeek(today);
  const weekDays = getWeekDays(monday);
  const weekTotal = getWeekTotalHours(monday, entries);
  const weekLogged = weekDays.filter((d) => entries[toISOKey(d)]).length;

  // This month
  const monthCells = getMonthDays(today.getFullYear(), today.getMonth());
  const monthTotal = monthCells.reduce((acc, d) => {
    if (!d) return acc;
    const e = entries[toISOKey(d)];
    return acc + (e ? computeHours(e) : 0);
  }, 0);
  const monthLogged = monthCells.filter((d) => d && entries[toISOKey(d)]).length;

  // Today
  const todayEntry = entries[todayKey];
  const todayHours = todayEntry ? computeHours(todayEntry) : 0;

  // Last 5 logged days
  const recentEntries = Object.entries(entries)
    .filter(([k]) => k <= todayKey)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  // Weekly goal progress
  const weekPct = Math.min(1, weekTotal / WEEKLY_GOAL);
  const weekRemaining = Math.max(0, WEEKLY_GOAL - weekTotal);

  return (
    <div className="flex flex-col h-full">
      {/* This Week */}
      <div className="px-6 py-6 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-4">
          This Week
        </p>
        <div className="flex items-end justify-between mb-2.5">
          <span className="text-2xl font-bold font-heading text-gray-800 tabular-nums leading-none">
            {formatDuration(weekTotal)}
          </span>
          <span className="text-xs text-gray-400 font-body">of {WEEKLY_GOAL}h</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weekPct * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="h-full bg-[#4a7c59] rounded-full"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-body">{weekLogged}/5 days</span>
          {weekRemaining > 0 ? (
            <span className="text-xs text-gray-500 font-body">
              <span className="font-semibold text-gray-700">{formatDuration(weekRemaining)}</span> to go
            </span>
          ) : (
            <span className="text-xs font-semibold text-[#4a7c59] font-body">Goal reached!</span>
          )}
        </div>
      </div>

      {/* Today + Month */}
      <div className="grid grid-cols-2 border-b border-gray-100">
        <div className="px-6 py-5 border-r border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">Today</p>
          {todayEntry ? (
            <>
              <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">
                {formatDuration(todayHours)}
              </p>
              <p className="text-[11px] text-gray-400 font-body mt-1 tabular-nums leading-snug">
                {fmt12(todayEntry.startTime)} –<br />{fmt12(todayEntry.endTime)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold font-heading text-gray-300 leading-none">—</p>
              <p className="text-[11px] text-gray-300 font-body mt-1">Not logged</p>
            </>
          )}
        </div>
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">Month</p>
          <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">
            {formatDuration(monthTotal)}
          </p>
          <p className="text-[11px] text-gray-400 font-body mt-1 leading-snug">
            {monthLogged} day{monthLogged !== 1 ? "s" : ""}<br />logged
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-6 py-5 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-3 h-3 text-gray-400" />
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">
            Recent
          </p>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-sm text-gray-300 font-body">No entries yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recentEntries.map(([key, entry]) => {
              const d = new Date(key + "T00:00:00");
              const isToday = key === todayKey;
              const hours = computeHours(entry);
              return (
                <div key={key} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 font-body leading-none mb-0.5">
                      {isToday
                        ? "Today"
                        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    {entry.note && (
                      <p className="text-[11px] text-gray-400 font-body truncate max-w-[130px]">
                        {entry.note}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#4a7c59] font-body tabular-nums shrink-0">
                    {formatDuration(hours)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HoursPageClient({
  teacherName,
}: {
  teacherName: string | null;
}) {
  const [view, setView] = useState<ViewMode>("day");
  const [entries, setEntries] = useState<TimesheetState>(MOCK_ENTRIES);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    // If weekend, default to Friday
    if (day === 6) { const fri = new Date(today); fri.setDate(today.getDate() - 1); return fri; }
    if (day === 0) { const fri = new Date(today); fri.setDate(today.getDate() - 2); return fri; }
    return today;
  });

  function handleSave(key: string, entry: TimeEntry) {
    setEntries((prev) => ({ ...prev, [key]: entry }));
  }

  function handleDelete(key: string) {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleDayClick(date: Date, switchToDay: boolean) {
    setSelectedDate(date);
    if (switchToDay) setView("day");
  }

  function goDay(delta: number) {
    const d = new Date(selectedDate);
    const next = new Date(d);
    next.setDate(d.getDate() + delta);
    if (next.getDay() === 0) next.setDate(next.getDate() + (delta > 0 ? 1 : -2));
    if (next.getDay() === 6) next.setDate(next.getDate() + (delta > 0 ? 2 : -1));
    setSelectedDate(next);
  }

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "day", label: "Day", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "week", label: "Week", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "month", label: "Month", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT: scrollable main content */}
      <div className="flex-1 overflow-y-auto px-10 py-10">
        {/* Page heading + view switcher */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-end justify-between mb-7"
        >
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-800">My Hours</h1>
            <p className="text-sm text-gray-400 font-body mt-1">
              Track and log your daily work hours.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Day nav arrows — only in day view */}
            {view === "day" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goDay(-1)}
                  className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-600 font-body tabular-nums min-w-[110px] text-center">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={() => goDay(1)}
                  className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* View switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {views.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all cursor-pointer
                    ${view === id
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* View content */}
        <AnimatePresence mode="wait">
          {view === "day" && (
            <motion.div
              key="day"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DayView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                entries={entries}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            </motion.div>
          )}
          {view === "week" && (
            <motion.div
              key="week"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <WeekView entries={entries} onDayClick={handleDayClick} />
            </motion.div>
          )}
          {view === "month" && (
            <motion.div
              key="month"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MonthView entries={entries} onDayClick={handleDayClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: fixed sidebar */}
      <div className="w-72 shrink-0 border-l border-gray-100 bg-white overflow-y-auto">
        <SummaryPanel entries={entries} />
      </div>
    </div>
  );
}
