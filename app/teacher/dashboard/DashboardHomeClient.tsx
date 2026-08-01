"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  TrendingUp,
  LogIn,
  LogOut,
  MapPin,
  Paperclip,
  ChevronRight,
  Banknote,
} from "lucide-react";

const BANNER_IMAGES = [
  "/assets/ImageTwo.jpg",
  "/assets/ImageThree.jpg",
  "/assets/ImageFive.jpg",
  "/assets/ImageNine.jpg",
  "/assets/ImageTen.jpg",
];
import { clockIn, clockOut } from "@/app/actions/teacherHours";
import type { SessionsByDay } from "@/app/actions/teacherHours";
import {
  toISOKey,
  getMondayOfWeek,
  getWeekDays,
  getDayTotalHours,
  getWeekTotalHours,
  formatDuration,
  fmt12,
  ElapsedTimer,
} from "@/app/lib/clock-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  category: string | null;
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
};

// ─── Clock Widget ─────────────────────────────────────────────────────────────

function ClockWidget({
  sessionsByDay,
  onClockIn,
  onClockOut,
}: {
  sessionsByDay: SessionsByDay;
  onClockIn: () => Promise<void>;
  onClockOut: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const todayKey = toISOKey(today);
  const monday = getMondayOfWeek(today);
  const todaySessions = sessionsByDay[todayKey] ?? [];
  const activeSession =
    Object.values(sessionsByDay)
      .flat()
      .find((s) => !s.clockOutAt) ?? null;
  const todayHours = getDayTotalHours(todaySessions);
  const weekTotal = getWeekTotalHours(monday, sessionsByDay);

  async function handleClockIn() {
    setLoading(true);
    await onClockIn();
    setLoading(false);
  }

  async function handleClockOut() {
    setLoading(true);
    await onClockOut();
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
          Clock
        </h2>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold font-body px-2.5 py-1 rounded-full ${
            activeSession
              ? "bg-[#4a7c59]/10 text-[#4a7c59]"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeSession ? "bg-[#4a7c59] animate-pulse" : "bg-gray-300"
            }`}
          />
          {activeSession ? "Clocked In" : "Not Clocked In"}
        </span>
      </div>

      <div
        className={`rounded-xl px-5 py-4 ${
          activeSession
            ? "bg-[#4a7c59]/5 border border-[#4a7c59]/15"
            : "bg-gray-50 border border-gray-100"
        }`}
      >
        {activeSession ? (
          <div>
            <p className="text-3xl font-bold font-heading text-gray-800 leading-none mb-1">
              <ElapsedTimer clockInAt={activeSession.clockInAt} />
            </p>
            <p className="text-xs text-gray-400 font-body">
              Since {fmt12(activeSession.clockInAt)}
            </p>
          </div>
        ) : todayHours > 0 ? (
          <div>
            <p className="text-3xl font-bold font-heading text-gray-800 leading-none mb-1">
              {formatDuration(todayHours)}
            </p>
            <p className="text-xs text-gray-400 font-body">
              Logged today · clock in again to add more
            </p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-bold font-heading text-gray-300 leading-none mb-1">
              0h
            </p>
            <p className="text-xs text-gray-400 font-body">
              Clock in to start tracking
            </p>
          </div>
        )}
      </div>

      {activeSession ? (
        <button
          onClick={handleClockOut}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-semibold font-body text-sm rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4" />
          Clock Out
        </button>
      ) : (
        <button
          onClick={handleClockIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#4a7c59] text-white font-semibold font-body text-sm rounded-xl hover:bg-[#3d6b4a] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogIn className="w-4 h-4" />
          Clock In
        </button>
      )}

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5 text-center">
          <p className="text-[11px] text-gray-400 font-body mb-0.5">Today</p>
          <p className="text-sm font-semibold text-gray-700 font-body tabular-nums">
            {formatDuration(todayHours)}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5 text-center">
          <p className="text-[11px] text-gray-400 font-body mb-0.5">This Week</p>
          <p className="text-sm font-semibold text-gray-700 font-body tabular-nums">
            {formatDuration(weekTotal)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────

function formatEventDate(event: CalendarEvent): string {
  const d = new Date(event.event_date + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (event.is_all_day) return `${dateStr} · All day`;
  if (event.start_time) {
    const [sh, sm] = event.start_time.split(":").map(Number);
    const startD = new Date();
    startD.setHours(sh, sm);
    const startStr = startD.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (event.end_time) {
      const [eh, em] = event.end_time.split(":").map(Number);
      const endD = new Date();
      endD.setHours(eh, em);
      const endStr = endD.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${dateStr} · ${startStr} – ${endStr}`;
    }
    return `${dateStr} · ${startStr}`;
  }
  return dateStr;
}

function UpcomingEventsCard({
  events,
  expandedId,
  onToggle,
}: {
  events: CalendarEvent[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
          Upcoming Events
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-gray-300 font-body">No upcoming events</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => {
            const accent = event.color ?? "#4a7c59";
            const isExpanded = expandedId === event.id;
            return (
              <div
                key={event.id}
                className="relative rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
                onClick={() => onToggle(event.id)}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: accent }}
                />
                <div className="pl-4 pr-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400 font-body mb-0.5">
                        {formatEventDate(event)}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 font-body leading-snug">
                        {event.title}
                      </p>
                      {event.category && (
                        <span
                          className="inline-block mt-1.5 text-[11px] font-semibold font-body px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: accent + "22",
                            color: accent,
                          }}
                        >
                          {event.category}
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-300 shrink-0 mt-1 transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
                          {event.description && (
                            <p className="text-xs text-gray-500 font-body leading-relaxed">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                              <p className="text-xs text-gray-400 font-body">
                                {event.location}
                              </p>
                            </div>
                          )}
                          {event.attachment_links &&
                            event.attachment_links.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Paperclip className="w-3 h-3 text-gray-300 shrink-0" />
                                <p className="text-xs text-gray-400 font-body">
                                  {event.attachment_links.length} attachment
                                  {event.attachment_links.length !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Weekly Hours Chart ───────────────────────────────────────────────────────

function WeeklyHoursChart({
  sessionsByDay,
}: {
  sessionsByDay: SessionsByDay;
}) {
  const today = new Date();
  const todayKey = toISOKey(today);
  const monday = getMondayOfWeek(today);
  const weekDays = getWeekDays(monday);

  const weekDayData = weekDays.map((d) => ({
    date: d,
    key: toISOKey(d),
    hours: getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []),
  }));

  const maxDayHours = Math.max(...weekDayData.map((d) => d.hours), 0.1);

  const weekLabel = (() => {
    const fri = new Date(monday);
    fri.setDate(monday.getDate() + 4);
    const s = monday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const e = fri.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${s} – ${e}`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
            Weekly Hours
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-body">{weekLabel}</span>
      </div>

      <div className="flex items-end gap-3 h-28">
        {weekDayData.map(({ date, key, hours }) => {
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const pct = hours > 0 ? (hours / maxDayHours) * 100 : 0;

          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1.5 flex-1 group relative"
            >
              {hours > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-body px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {formatDuration(hours)}
                </div>
              )}
              <div className="w-full flex items-end h-20">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 min-h-[4px] ${
                    isToday
                      ? "bg-[#4a7c59]"
                      : !isFuture && hours > 0
                      ? "bg-[#4a7c59]/40"
                      : "bg-gray-100"
                  }`}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <p
                className={`text-[11px] font-semibold font-body ${
                  isToday ? "text-[#4a7c59]" : "text-gray-400"
                }`}
              >
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              {isToday && (
                <span className="w-1 h-1 rounded-full bg-[#4a7c59]" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Payroll Card ─────────────────────────────────────────────────────────────

function PayrollCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body">
            Payroll
          </h2>
        </div>
        <span className="text-[11px] font-semibold font-body px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
          Coming soon
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-[#4a7c59]/5 border border-[#4a7c59]/10 px-4 py-3.5">
          <p className="text-[11px] text-gray-400 font-body mb-1">Next Payroll</p>
          <p className="text-base font-semibold text-gray-800 font-body">May 2, 2026</p>
          <p className="text-[11px] text-gray-400 font-body mt-0.5">in 12 days</p>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5">
          <p className="text-[11px] text-gray-400 font-body mb-1">Last Paid</p>
          <p className="text-base font-semibold text-gray-800 font-body">Apr 18, 2026</p>
          <p className="text-[11px] text-gray-400 font-body mt-0.5">2 weeks ago</p>
        </div>
      </div>

      <p className="text-xs text-gray-300 font-body">
        Full payroll details and history will be available here soon.
      </p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardHomeClient({
  fullName,
  initialSessions,
  upcomingEvents,
}: {
  fullName: string | null;
  initialSessions: SessionsByDay;
  upcomingEvents: CalendarEvent[];
}) {
  const [sessionsByDay, setSessionsByDay] =
    useState<SessionsByDay>(initialSessions);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(() =>
    Math.floor(Math.random() * BANNER_IMAGES.length),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
    const activeSession =
      Object.values(sessionsByDay)
        .flat()
        .find((s) => !s.clockOutAt) ?? null;
    if (!activeSession) return;
    const clockOutAt = await clockOut(activeSession.id);
    if (!clockOutAt) return;
    const dateKey = toISOKey(new Date(activeSession.clockInAt));
    setSessionsByDay((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map((s) =>
        s.id === activeSession.id ? { ...s, clockOutAt } : s,
      ),
    }));
  }

  function toggleEvent(id: string) {
    setExpandedEventId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner slideshow */}
      <motion.div
        initial={{ opacity: 0, scale: 1.01 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative h-44 rounded-2xl overflow-hidden shadow-sm"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={bannerIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={BANNER_IMAGES[bannerIndex]}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/45" />

        {/* Dot indicators */}
        <div className="absolute bottom-3 right-5 flex gap-1.5">
          {BANNER_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === bannerIndex ? "bg-white scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-7 pb-6">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-white/70 text-sm font-body mb-1"
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-white text-3xl font-bold font-heading leading-tight"
          >
            Welcome, {fullName ?? "Teacher"}.
          </motion.h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClockWidget
          sessionsByDay={sessionsByDay}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />
        <UpcomingEventsCard
          events={upcomingEvents}
          expandedId={expandedEventId}
          onToggle={toggleEvent}
        />
      </div>

      <WeeklyHoursChart sessionsByDay={sessionsByDay} />

      <PayrollCard />
    </div>
  );
}
