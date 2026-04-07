"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  CalendarDays,
  LayoutGrid,
  TrendingUp,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  clockIn,
  clockOut,
  deleteSession,
  updateSessionNote,
} from "@/app/actions/teacherHours";
import type { ClockSession, SessionsByDay } from "@/app/actions/teacherHours";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";

const WEEKLY_GOAL = 40;

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
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sessionDurationHours(session: ClockSession): number {
  if (!session.clockOutAt) return 0;
  const diff = new Date(session.clockOutAt).getTime() - new Date(session.clockInAt).getTime();
  return Math.max(0, diff / 1000 / 3600);
}

function getDayTotalHours(sessions: ClockSession[]): number {
  return sessions.reduce((acc, s) => acc + sessionDurationHours(s), 0);
}

function getWeekTotalHours(monday: Date, sessionsByDay: SessionsByDay): number {
  return getWeekDays(monday).reduce((acc, d) => {
    return acc + getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []);
  }, 0);
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m === 0) return "0h";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmt12(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

// ─── Live Elapsed Timer ───────────────────────────────────────────────────────

function ElapsedTimer({ clockInAt }: { clockInAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [clockInAt]);

  return <span className="tabular-nums">{formatElapsed(elapsed)}</span>;
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onDelete,
  onNoteChange,
}: {
  session: ClockSession;
  onDelete: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const [note, setNote] = useState(session.note);
  const [editing, setEditing] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  const hours = sessionDurationHours(session);

  function handleNoteBlur() {
    setEditing(false);
    if (note !== session.note) {
      onNoteChange(session.id, note);
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-100 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-gray-700 font-body tabular-nums">
            {fmt12(session.clockInAt)}
            {session.clockOutAt && (
              <> &ndash; {fmt12(session.clockOutAt)}</>
            )}
          </span>
          {session.clockOutAt && (
            <span className="text-xs font-semibold text-[#4a7c59] bg-[#4a7c59]/8 px-2 py-0.5 rounded-full font-body">
              {formatDuration(hours)}
            </span>
          )}
        </div>
        {session.clockOutAt && (
          editing ? (
            <input
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              onKeyDown={(e) => { if (e.key === "Enter") noteRef.current?.blur(); }}
              autoFocus
              placeholder="Add a note..."
              className="w-full text-xs text-gray-500 font-body bg-transparent border-b border-gray-200 focus:outline-none focus:border-[#4a7c59] py-0.5"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 font-body hover:text-gray-600 transition-colors text-left truncate max-w-[260px] cursor-pointer"
            >
              {note || "Add a note…"}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onDelete(session.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  selectedDate,
  onDateChange,
  sessionsByDay,
  activeSession,
  onClockIn,
  onClockOut,
  onDeleteSession,
  onNoteChange,
}: {
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  sessionsByDay: SessionsByDay;
  activeSession: ClockSession | null;
  onClockIn: () => void;
  onClockOut: () => void;
  onDeleteSession: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const todayKey = toISOKey(new Date());
  const selectedKey = toISOKey(selectedDate);
  const isToday = selectedKey === todayKey;
  const isFuture = selectedKey > todayKey;

  const daySessions = sessionsByDay[selectedKey] ?? [];
  const completedSessions = daySessions.filter((s) => !!s.clockOutAt);
  const dayTotalHours = getDayTotalHours(daySessions);

  const isActiveDay = activeSession !== null && toISOKey(new Date(activeSession.clockInAt)) === selectedKey;

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
        transition={{ duration: 0.2, ease: "easeOut" as const }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6"
      >
        {/* Day header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-semibold font-heading text-gray-800">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </h2>
            {isToday && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium font-body bg-amber-50 text-amber-600 border border-amber-200">
                Today
              </span>
            )}
            {dayTotalHours > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#4a7c59]/8 rounded-full">
                <Clock className="w-3.5 h-3.5 text-[#4a7c59]" />
                <span className="text-sm font-semibold text-[#4a7c59] font-body tabular-nums">
                  {formatDuration(dayTotalHours)}
                </span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 font-body">
            {dayFull.split(", ").slice(1).join(", ")}
          </p>
        </div>

        {/* Clock in / out — only for today */}
        {isToday && (
          <div className={`flex items-center justify-between px-6 py-5 rounded-2xl border ${
            isActiveDay
              ? "bg-[#4a7c59]/5 border-[#4a7c59]/20"
              : "bg-gray-50 border-gray-100"
          }`}>
            <div>
              {isActiveDay ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#4a7c59] font-body mb-1">
                    Clocked In
                  </p>
                  <p className="text-2xl font-bold font-heading text-gray-800 tabular-nums leading-none">
                    <ElapsedTimer clockInAt={activeSession!.clockInAt} />
                  </p>
                  <p className="text-xs text-gray-400 font-body mt-1">
                    Since {fmt12(activeSession!.clockInAt)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-1">
                    Not clocked in
                  </p>
                  <p className="text-sm text-gray-400 font-body">
                    {completedSessions.length > 0
                      ? "Clock in again to log more time"
                      : "Tap Clock In to start tracking"}
                  </p>
                </>
              )}
            </div>

            {isActiveDay ? (
              <button
                onClick={onClockOut}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-semibold font-body text-sm rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Clock Out
              </button>
            ) : (
              <button
                onClick={onClockIn}
                disabled={isFuture}
                className="flex items-center gap-2 px-5 py-3 bg-[#4a7c59] text-white font-semibold font-body text-sm rounded-xl hover:bg-[#3d6b4a] transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                Clock In
              </button>
            )}
          </div>
        )}

        {/* Past / non-today: no clock controls, just show sessions */}
        {!isToday && !isFuture && daySessions.length === 0 && (
          <div className="px-6 py-5 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-400 font-body">No sessions logged for this day.</p>
          </div>
        )}

        {/* Sessions list */}
        {daySessions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-1">
              Sessions
            </p>
            {daySessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onDelete={onDeleteSession}
                onNoteChange={onNoteChange}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  sessionsByDay,
  activeSession,
  onDayClick,
}: {
  sessionsByDay: SessionsByDay;
  activeSession: ClockSession | null;
  onDayClick: (date: Date, switchView: boolean) => void;
}) {
  const todayKey = toISOKey(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = getMondayOfWeek(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(monday);
  const totalHours = getWeekTotalHours(monday, sessionsByDay);

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

        <div className="flex flex-col gap-3">
          {weekDays.map((d, i) => {
            const key = toISOKey(d);
            const daySessions = sessionsByDay[key] ?? [];
            const isActiveDay = activeSession !== null && toISOKey(new Date(activeSession.clockInAt)) === key;
            const isLogged = daySessions.some((s) => !!s.clockOutAt);
            const isToday = key === todayKey;
            const hours = getDayTotalHours(daySessions);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => onDayClick(d, true)}
                className={`flex items-center gap-5 px-5 py-4 rounded-xl border cursor-pointer transition-all duration-150 group
                  ${isLogged || isActiveDay
                    ? "border-l-[3px] border-l-[#4a7c59] border-t-gray-100 border-r-gray-100 border-b-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm"
                    : isToday
                    ? "border border-[#4a7c59]/20 bg-[#4a7c59]/5 hover:shadow-sm"
                    : key > todayKey
                    ? "border border-gray-50 bg-gray-50/50 opacity-50"
                    : "border border-gray-100 hover:bg-gray-50 hover:shadow-sm"
                  }`}
              >
                <div className="w-16 shrink-0">
                  <p className="text-sm font-semibold text-gray-700 font-body">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className="text-xs text-gray-400 font-body">
                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>

                <div className="shrink-0">
                  {isActiveDay ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-body bg-[#4a7c59]/10 text-[#4a7c59]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />
                      Active
                    </span>
                  ) : isLogged ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-body bg-[#4a7c59]/10 text-[#4a7c59]">
                      Logged
                    </span>
                  ) : isToday ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium font-body bg-amber-50 text-amber-500 border border-amber-200">
                      Today
                    </span>
                  ) : key > todayKey ? (
                    <span className="text-xs text-gray-300 font-body">Upcoming</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-body bg-gray-100 text-gray-400">
                      Not logged
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {hours > 0 && (
                    <span className="text-xs text-[#4a7c59] font-semibold font-body bg-[#4a7c59]/8 px-2.5 py-1 rounded-full">
                      {formatDuration(hours)}
                    </span>
                  )}
                  {isActiveDay && activeSession && (
                    <span className="text-xs text-gray-400 font-body ml-2">
                      Clocked in {fmt12(activeSession.clockInAt)}
                    </span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.div>
            );
          })}
        </div>

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
  sessionsByDay,
  onDayClick,
}: {
  sessionsByDay: SessionsByDay;
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

  const loggedCount = cells.filter((d) => {
    if (!d) return false;
    return getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []) > 0;
  }).length;

  const totalLoggedHours = cells.reduce((acc, d) => {
    if (!d) return acc;
    return acc + getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []);
  }, 0);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 font-body">{monthLabel}</h2>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              {loggedCount} day{loggedCount !== 1 ? "s" : ""} logged · {formatDuration(totalLoggedHours)} total
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-300 font-body py-1.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const key = toISOKey(d);
            const hours = getDayTotalHours(sessionsByDay[key] ?? []);
            const isLogged = hours > 0;
            const isToday = key === todayKey;
            const isFuture = key > todayKey;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;

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

function SummaryPanel({
  sessionsByDay,
  activeSession,
}: {
  sessionsByDay: SessionsByDay;
  activeSession: ClockSession | null;
}) {
  const today = new Date();
  const todayKey = toISOKey(today);

  const monday = getMondayOfWeek(today);
  const weekDays = getWeekDays(monday);
  const weekTotal = getWeekTotalHours(monday, sessionsByDay);
  const weekLogged = weekDays.filter((d) => getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []) > 0).length;

  const monthCells = getMonthDays(today.getFullYear(), today.getMonth());
  const monthTotal = monthCells.reduce((acc, d) => {
    if (!d) return acc;
    return acc + getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []);
  }, 0);
  const monthLogged = monthCells.filter((d) => d && getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []) > 0).length;

  const todayHours = getDayTotalHours(sessionsByDay[todayKey] ?? []);
  const todaySessions = sessionsByDay[todayKey] ?? [];

  const recentDays = Object.entries(sessionsByDay)
    .filter(([k]) => k <= todayKey && getDayTotalHours(sessionsByDay[k]) > 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  const weekPct = Math.min(1, weekTotal / WEEKLY_GOAL);
  const weekRemaining = Math.max(0, WEEKLY_GOAL - weekTotal);

  return (
    <div className="flex flex-col h-full">
      {/* This Week */}
      <div className="px-6 py-6 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-4">This Week</p>
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
            transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.2 }}
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
          {activeSession ? (
            <>
              <p className="text-[11px] font-semibold text-[#4a7c59] font-body mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse inline-block" />
                Clocked in
              </p>
              <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">
                <ElapsedTimer clockInAt={activeSession.clockInAt} />
              </p>
            </>
          ) : todayHours > 0 ? (
            <>
              <p className="text-xl font-bold font-heading text-gray-800 tabular-nums leading-none">
                {formatDuration(todayHours)}
              </p>
              <p className="text-[11px] text-gray-400 font-body mt-1">
                {todaySessions.length} session{todaySessions.length !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold font-heading text-gray-300 leading-none">—</p>
              <p className="text-[11px] text-gray-300 font-body mt-1">Not clocked in</p>
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
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">Recent</p>
        </div>
        {recentDays.length === 0 ? (
          <p className="text-sm text-gray-300 font-body">No entries yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recentDays.map(([key]) => {
              const d = new Date(key + "T00:00:00");
              const isToday = key === todayKey;
              const hours = getDayTotalHours(sessionsByDay[key] ?? []);
              const sessionCount = (sessionsByDay[key] ?? []).filter(s => !!s.clockOutAt).length;
              return (
                <div key={key} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 font-body leading-none mb-0.5">
                      {isToday
                        ? "Today"
                        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-body">
                      {sessionCount} session{sessionCount !== 1 ? "s" : ""}
                    </p>
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
  initialSessions,
}: {
  teacherName: string | null;
  initialSessions: SessionsByDay;
}) {
  const [view, setView] = useState<ViewMode>("day");
  const [sessionsByDay, setSessionsByDay] = useState<SessionsByDay>(initialSessions);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    if (day === 6) { const fri = new Date(today); fri.setDate(today.getDate() - 1); return fri; }
    if (day === 0) { const fri = new Date(today); fri.setDate(today.getDate() - 2); return fri; }
    return today;
  });

  // Find active (open) session across all days
  const activeSession = Object.values(sessionsByDay)
    .flat()
    .find((s) => !s.clockOutAt) ?? null;

  async function handleClockIn() {
    const session = await clockIn();
    if (!session) return;
    const dateKey = toISOKey(new Date(session.clockInAt));
    setSessionsByDay((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] ?? []), session],
    }));
  }

  async function handleClockOut() {
    if (!activeSession) return;
    const clockOutAt = await clockOut(activeSession.id);
    if (!clockOutAt) return;
    const dateKey = toISOKey(new Date(activeSession.clockInAt));
    setSessionsByDay((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map((s) =>
        s.id === activeSession.id ? { ...s, clockOutAt } : s
      ),
    }));
  }

  function handleDeleteSession(id: string) {
    deleteSession(id);
    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((s) => s.id !== id);
        if (next[key].length === 0) delete next[key];
      }
      return next;
    });
  }

  function handleNoteChange(id: string, note: string) {
    updateSessionNote(id, note);
    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((s) => (s.id === id ? { ...s, note } : s));
      }
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-end justify-between mb-7"
        >
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-800">My Hours</h1>
            <p className="text-sm text-gray-400 font-body mt-1">
              Clock in and out to track your daily work time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

        <AnimatePresence mode="wait">
          {view === "day" && (
            <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <DayView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                sessionsByDay={sessionsByDay}
                activeSession={activeSession}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onDeleteSession={handleDeleteSession}
                onNoteChange={handleNoteChange}
              />
            </motion.div>
          )}
          {view === "week" && (
            <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <WeekView sessionsByDay={sessionsByDay} activeSession={activeSession} onDayClick={handleDayClick} />
            </motion.div>
          )}
          {view === "month" && (
            <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <MonthView sessionsByDay={sessionsByDay} onDayClick={handleDayClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: fixed sidebar */}
      <div className="w-72 shrink-0 border-l border-gray-100 bg-white overflow-y-auto">
        <SummaryPanel sessionsByDay={sessionsByDay} activeSession={activeSession} />
      </div>
    </div>
  );
}
