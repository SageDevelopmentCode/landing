"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Link2,
  MapPin,
  Users,
  RefreshCw,
  Bell,
  Calendar,
  Sun,
  BookOpen,
  Clock,
  Paperclip,
} from "lucide-react";
import { Merriweather } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
// ─── Parent-only design tokens (light mode, fully standalone) ─────────────────
const colors = {
  bg:           '#F0F4F1',
  surface:      '#FFFFFF',
  elevated:     '#F7FAF8',
  border:       '#E4EDE7',
  borderStrong: '#C8DAD0',
  textPrimary:   '#1A2A20',
  textSecondary: '#4B6356',
  textTertiary:  '#8FA898',
  mistyForest:  '#5E7C68',
  pastelSage:   '#EBF3EE',
  accentLight:  'rgba(94,124,104,0.12)',
  warmLinen:    '#F7FAF8',
};
const radius = { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' };
const shadows = { soft: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' };

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

type ProgramKey = "summer" | "school";
type ViewMode = "monthly" | "weekly";

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  shared_with: string[];
  programs: string[];
  description: string | null;
  location: string | null;
  recurrence: string | null;
  recurrence_end_date: string | null;
  attachment_links: string[];
  rsvp_enabled: boolean;
  reminder_email: boolean;
  reminder_in_app: boolean;
  reminder_timing: string | null;
};

const programs: Record<ProgramKey, { label: string; shortLabel: string; start: Date; end: Date; dateRange: string }> =
  {
    summer: {
      label: "Summer 2026",
      shortLabel: "SUMMER",
      start: new Date(2026, 4, 1),
      end: new Date(2026, 7, 31),
      dateRange: "May – Aug 2026",
    },
    school: {
      label: "School Year 2026–2027",
      shortLabel: "SCHOOL",
      start: new Date(2026, 7, 1),
      end: new Date(2027, 4, 31),
      dateRange: "Aug 2026 – May 2027",
    },
  };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM → 9 PM
const HOUR_HEIGHT = 120; // px per hour slot

// ─── Animation constants ────────────────────────────────────────────────────────

const panelSpring = { type: "spring" as const, stiffness: 380, damping: 36, mass: 0.7 };

const fadeUpVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

// ─── Helper functions ───────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  d.setDate(1);
  return d;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  for (let i = startPad - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const rem = 7 - (days.length % 7);
  if (rem < 7)
    for (let i = 1; i <= rem; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function getOverlapClusters(events: CalendarEvent[]): CalendarEvent[][] {
  if (events.length === 0) return [];
  const toMin = (t: string | null) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const sorted = [...events].sort(
    (a, b) => toMin(a.start_time) - toMin(b.start_time),
  );
  const clusters: CalendarEvent[][] = [];
  for (const ev of sorted) {
    const evStart = toMin(ev.start_time);
    const evEnd = toMin(ev.end_time) || evStart + 60;
    let placed = false;
    for (const cluster of clusters) {
      const clusterEnd = Math.max(
        ...cluster.map((c) => toMin(c.end_time) || toMin(c.start_time) + 60),
      );
      const clusterStart = toMin(cluster[0].start_time);
      if (evStart < clusterEnd && evEnd > clusterStart) {
        cluster.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([ev]);
  }
  return clusters;
}

// ─── Nav Button ────────────────────────────────────────────────────────────────

function NavButton({
  onClick,
  disabled,
  children,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={disabled ? {} : { backgroundColor: colors.warmLinen, scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.93 }}
      transition={{ duration: 0.12 }}
      style={{
        padding: 6,
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.25 : 1,
        color: colors.textSecondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Overlap Panel ─────────────────────────────────────────────────────────────

function OverlapPanel({
  events,
  onClose,
  onViewEvent,
}: {
  events: CalendarEvent[];
  onClose: () => void;
  onViewEvent: (ev: CalendarEvent) => void;
}) {
  const first = events[0];
  const timeLabel = first?.start_time
    ? `${formatTime(first.start_time)}${first.end_time ? ` – ${formatTime(first.end_time)}` : ""}`
    : "";

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="fixed top-0 right-0 h-full z-[70] flex flex-col"
        style={{
          width: "380px",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-16px 0 48px rgba(0,0,0,0.10)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={panelSpring}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ backgroundColor: colors.warmLinen, borderBottom: `1px solid ${colors.border}` }}
        >
          <div>
            {timeLabel && (
              <p className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>
                {timeLabel}
              </p>
            )}
            <h2
              className={`text-base font-bold ${merriweather.className}`}
              style={{ color: colors.textPrimary }}
            >
              {events.length} Events
            </h2>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ backgroundColor: colors.border }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              padding: 6,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              color: colors.textSecondary,
              backgroundColor: "white",
              display: "flex",
            }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
          {events.map((ev) => {
            const evTime = ev.start_time
              ? `${formatTime(ev.start_time)}${ev.end_time ? ` – ${formatTime(ev.end_time)}` : ""}`
              : "All day";
            return (
              <motion.button
                key={ev.id}
                onClick={() => onViewEvent(ev)}
                whileHover={{ x: 4, backgroundColor: `${ev.color}20` }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.12 }}
                className="w-full text-left relative"
                style={{
                  backgroundColor: `${ev.color}12`,
                  border: `1px solid ${ev.color}30`,
                  borderLeft: `3px solid ${ev.color}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <p className="text-sm font-semibold leading-tight" style={{ color: colors.textPrimary }}>
                  {ev.title}
                </p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {evTime}
                </p>
                {ev.category && (
                  <span
                    className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${ev.color}18`,
                      color: ev.color,
                      borderRadius: radius.full,
                    }}
                  >
                    {ev.category}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ─── Event Detail Panel ────────────────────────────────────────────────────────

function EventDetailPanel({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const [eventDate] = event.event_date.split("T");
  const [year, month, day] = eventDate.split("-").map(Number);
  const dateLabel = `${MONTHS[month - 1]} ${day}, ${year}`;

  const timeLabel = event.is_all_day
    ? "All day"
    : event.start_time
      ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ""}`
      : null;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="fixed top-0 right-0 h-full z-[70] flex flex-col"
        style={{
          width: "420px",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-16px 0 48px rgba(0,0,0,0.10)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={panelSpring}
      >
        {/* Full-color header band */}
        <motion.div
          key={event.id + "-header"}
          animate={{ backgroundColor: event.color }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
          style={{ padding: "24px 24px 20px 24px", position: "relative" }}
        >
          {/* Top row: category pill + close */}
          <div className="flex items-start justify-between mb-3">
            <div>
              {event.category && (
                <span
                  className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.22)",
                    color: "white",
                    borderRadius: radius.full,
                  }}
                >
                  {event.category}
                </span>
              )}
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.30)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                padding: 6,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                backgroundColor: "rgba(255,255,255,0.20)",
                color: "white",
                display: "flex",
                flexShrink: 0,
              }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Title */}
          <h2
            className={`text-xl font-bold leading-snug ${merriweather.className}`}
            style={{ color: "white" }}
          >
            {event.title}
          </h2>

          {/* Date + time */}
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.82)" }}>
            {dateLabel}
            {timeLabel ? <> &middot; {timeLabel}</> : null}
          </p>

          {/* Program chips */}
          {(event.programs ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(event.programs ?? []).map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 text-[10px] font-medium"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.90)",
                    borderRadius: radius.full,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Body */}
        <motion.div
          className="flex-1 overflow-auto px-6 py-5"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {event.description && (
            <motion.div variants={fadeUpVariants} className="mb-4">
              <div
                style={{
                  backgroundColor: "#F2F7F3",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>
                  Description
                </p>
                <p className="text-sm leading-relaxed" style={{ color: colors.textPrimary, lineHeight: 1.65 }}>
                  {event.description}
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col" style={{ gap: 0 }}>
            {event.location && (
              <motion.div
                variants={fadeUpVariants}
                className="flex items-start gap-3"
                style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: colors.warmLinen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: colors.textTertiary }}>Location</p>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>{event.location}</p>
                </div>
              </motion.div>
            )}

            {!event.is_all_day && event.start_time && (
              <motion.div
                variants={fadeUpVariants}
                className="flex items-start gap-3"
                style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: colors.warmLinen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: colors.textTertiary }}>Time</p>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>
                    {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
                  </p>
                </div>
              </motion.div>
            )}

            {event.recurrence && event.recurrence !== "None" && (
              <motion.div
                variants={fadeUpVariants}
                className="flex items-start gap-3"
                style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: colors.warmLinen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: colors.textTertiary }}>Recurrence</p>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>
                    Repeats {event.recurrence.toLowerCase()}
                    {event.recurrence_end_date ? ` until ${event.recurrence_end_date}` : ""}
                  </p>
                </div>
              </motion.div>
            )}

            {(event.attachment_links ?? []).length > 0 && (
              <motion.div
                variants={fadeUpVariants}
                className="flex items-start gap-3"
                style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: colors.warmLinen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Paperclip className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
                </div>
                <div className="min-w-0 pt-1 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.textTertiary }}>Attachments</p>
                  <div className="flex flex-col gap-1">
                    {(event.attachment_links ?? []).map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs truncate hover:underline"
                        style={{ color: colors.mistyForest }}
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {(event.reminder_email || event.reminder_in_app) && (
              <motion.div
                variants={fadeUpVariants}
                className="flex items-start gap-3"
                style={{ padding: "12px 0", borderBottom: event.rsvp_enabled ? `1px solid ${colors.border}` : "none" }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: colors.warmLinen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Bell className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: colors.textTertiary }}>Reminder</p>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>
                    {event.reminder_timing ?? "30 min before"}
                    {event.reminder_email && event.reminder_in_app
                      ? " · email + in-app"
                      : event.reminder_email
                        ? " · email"
                        : " · in-app"}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {event.rsvp_enabled && (
            <motion.div
              variants={fadeUpVariants}
              className="flex items-center gap-3 mt-4"
              style={{
                backgroundColor: colors.pastelSage,
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <Users className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />
              <p className="text-sm font-semibold flex-1" style={{ color: colors.mistyForest }}>
                RSVP enabled for parents
              </p>
              <span style={{ color: colors.mistyForest, fontSize: 16, fontWeight: 300 }}>→</span>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Monthly Grid ──────────────────────────────────────────────────────────────

function MonthlyGrid({
  days,
  currentMonth,
  today,
  onViewEvent,
  events,
}: {
  days: Date[];
  currentMonth: number;
  today: Date;
  onViewEvent: (event: CalendarEvent) => void;
  events: CalendarEvent[];
}) {
  const isWeekend = (colIndex: number) => colIndex === 0 || colIndex === 6;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-auto">
      {/* Day name header */}
      <div
        className="grid grid-cols-7 flex-shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F2F7F3" }}
      >
        {DAY_NAMES.map((d, i) => (
          <div
            key={d}
            className="py-3 text-center text-[11px] font-bold uppercase tracking-wider"
            style={{ color: isWeekend(i) ? `${colors.textTertiary}99` : colors.textSecondary }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1" style={{ alignContent: "start" }}>
        {days.map((day, i) => {
          const colIndex = i % 7;
          const inMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);
          const dateStr = formatDateInput(day);
          const dayEvents = events.filter((e) => e.event_date === dateStr);
          const visibleEvents = dayEvents.slice(0, 3);
          const overflowEvents = dayEvents.slice(3);
          const overflow = overflowEvents.length;

          return (
            <div
              key={i}
              className="relative flex flex-col"
              style={{
                minHeight: "140px",
                padding: "10px 8px 8px 8px",
                borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: isToday
                  ? "#F4F8F5"
                  : isWeekend(colIndex)
                    ? "#FAFBFA"
                    : "white",
              }}
            >
              <motion.span
                whileHover={inMonth ? { scale: 1.08 } : {}}
                transition={{ duration: 0.12 }}
                className="inline-flex items-center justify-center self-start"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.mistyForest : "transparent",
                  color: isToday ? "white" : inMonth ? colors.textPrimary : colors.textTertiary,
                  fontSize: 14,
                  fontWeight: isToday ? 700 : 500,
                  opacity: inMonth ? 1 : 0.35,
                  boxShadow: isToday ? "0 0 0 3px rgba(94,124,104,0.18)" : "none",
                  cursor: inMonth ? "default" : "default",
                  flexShrink: 0,
                }}
              >
                {day.getDate()}
              </motion.span>

              {inMonth && (
                <div className="flex flex-col gap-0.5 mt-1.5">
                  {visibleEvents.map((ev) => (
                    <motion.button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEvent(ev);
                      }}
                      whileHover={{ opacity: 0.85 }}
                      transition={{ duration: 0.1 }}
                      className="truncate text-left w-full"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: ev.is_all_day ? "2px 6px" : "2px 6px 2px 5px",
                        borderRadius: ev.is_all_day ? 4 : "0 4px 4px 0",
                        borderLeft: ev.is_all_day ? "none" : `3px solid ${ev.color}`,
                        backgroundColor: ev.is_all_day ? ev.color : `${ev.color}18`,
                        color: ev.is_all_day ? "white" : colors.textPrimary,
                        border: ev.is_all_day ? "none" : `1px solid transparent`,
                        borderLeftColor: ev.is_all_day ? "transparent" : ev.color,
                        cursor: "pointer",
                        lineHeight: "1.4",
                      }}
                    >
                      {ev.title}
                    </motion.button>
                  ))}
                  {overflow > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 px-1">
                      {overflowEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: ev.color,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                      {overflow > 3 && (
                        <span style={{ fontSize: 9, color: colors.textTertiary, marginLeft: 2 }}>
                          +{overflow - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly Grid ───────────────────────────────────────────────────────────────

function WeeklyGrid({
  weekDays,
  today,
  onViewEvent,
  onViewOverlap,
  events,
}: {
  weekDays: Date[];
  today: Date;
  onViewEvent: (event: CalendarEvent) => void;
  onViewOverlap: (events: CalendarEvent[]) => void;
  events: CalendarEvent[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const todayInWeek = weekDays.some((d) => isSameDay(d, today));
  const currentTimeTop =
    todayInWeek && now.getHours() >= 7 && now.getHours() < 22
      ? (now.getHours() - 7 + now.getMinutes() / 60) * HOUR_HEIGHT
      : null;

  useEffect(() => {
    if (scrollRef.current) {
      const offset = Math.max(0, (now.getHours() - 7 - 1.5) * HOUR_HEIGHT);
      window.scrollTo(0, scrollRef.current.getBoundingClientRect().top + window.scrollY + offset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const GUTTER = 56;

  return (
    <div className="flex flex-col">
      {/* ── Day header ── */}
      <div
        className="flex flex-shrink-0 bg-white"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div style={{ width: `${GUTTER}px`, flexShrink: 0, borderRight: `1px solid ${colors.border}` }} />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dateStr = formatDateInput(day);
          const allDayEvents = events.filter((e) => e.event_date === dateStr && e.is_all_day);
          const timedEvents = events
            .filter((e) => e.event_date === dateStr && !e.is_all_day && !!e.start_time)
            .sort((a, b) => (a.start_time! > b.start_time! ? 1 : -1));

          return (
            <div
              key={i}
              className="flex-1 py-3 flex flex-col items-center gap-1 relative"
              style={{
                borderRight: i === 4 ? "none" : `1px solid ${colors.border}`,
                backgroundColor: isToday ? "#F2F7F3" : "white",
                borderBottom: isToday ? `2px solid ${colors.mistyForest}` : "2px solid transparent",
                height: 72,
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isToday ? colors.mistyForest : colors.textTertiary }}
              >
                {WEEK_DAYS[i]}
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.mistyForest : "transparent",
                  color: isToday ? "white" : colors.textPrimary,
                  fontSize: 15,
                  fontWeight: isToday ? 700 : 500,
                  boxShadow: isToday ? "0 0 0 4px rgba(94,124,104,0.15)" : "none",
                }}
              >
                {day.getDate()}
              </div>

              {allDayEvents.length > 0 && (
                <div className="w-full px-1 flex flex-col gap-0.5">
                  {allDayEvents.slice(0, 1).map((ev) => (
                    <div
                      key={ev.id}
                      className="truncate px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{ backgroundColor: ev.color, color: "white", borderRadius: 3 }}
                      onClick={() => onViewEvent(ev)}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )}

              {timedEvents.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  {timedEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: ev.color, flexShrink: 0 }}
                    />
                  ))}
                  {timedEvents.length > 3 && (
                    <span style={{ fontSize: 8, color: colors.textTertiary }}>+{timedEvents.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Time grid ── */}
      <div
        ref={scrollRef}
        className="flex relative"
        style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
      >
        {/* Time label gutter */}
        <div
          className="flex-shrink-0 relative"
          style={{ width: `${GUTTER}px`, borderRight: `1px solid ${colors.border}` }}
        >
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute flex items-center justify-end pr-2.5"
              style={{ top: `${i * HOUR_HEIGHT}px`, width: `${GUTTER}px` }}
            >
              {i > 0 && (
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: colors.textTertiary,
                    transform: "translateY(-50%)",
                    display: "block",
                  }}
                >
                  {h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex-1 flex relative">
          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.75, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#f29a8f",
                  boxShadow: "0 0 0 3px rgba(242,154,143,0.25), 0 0 8px rgba(242,154,143,0.4)",
                  flexShrink: 0,
                  marginLeft: -5,
                  zIndex: 30,
                }}
              />
              <div
                className="flex-1"
                style={{
                  height: 2,
                  background: "linear-gradient(90deg, #f29a8f 0%, rgba(242,154,143,0.25) 100%)",
                }}
              />
            </div>
          )}

          {weekDays.map((day, colIdx) => {
            const isToday = isSameDay(day, today);
            const dateStr = formatDateInput(day);
            const timedEvents = events.filter(
              (e) => e.event_date === dateStr && !e.is_all_day && e.start_time,
            );
            return (
              <div
                key={colIdx}
                className="flex-1 relative"
                style={{
                  borderRight: colIdx === 4 ? "none" : `1px solid ${colors.border}`,
                  backgroundColor: isToday ? "#F4F8F5" : "white",
                }}
              >
                {HOURS.map((h, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="relative"
                    style={{
                      width: "100%",
                      height: `${HOUR_HEIGHT}px`,
                      borderBottom: rowIdx === HOURS.length - 1 ? "none" : `1px solid ${colors.border}`,
                      backgroundColor: rowIdx % 2 === 1 ? "#FAFBFA" : "transparent",
                    }}
                  >
                    {/* Half-hour dashed line */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        right: 0,
                        borderTop: "1px dashed rgba(229,231,235,0.65)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                ))}

                {/* Timed event blocks */}
                {getOverlapClusters(timedEvents).map((cluster) => {
                  const ev = cluster[0];
                  const [sh, sm] = (ev.start_time ?? "").split(":").map(Number);
                  const startMinutes = sh * 60 + (sm || 0);
                  const gridStart = 7 * 60;
                  const topPx = ((startMinutes - gridStart) / 60) * HOUR_HEIGHT;
                  let basePx = HOUR_HEIGHT;
                  if (ev.end_time) {
                    const [eh, em] = ev.end_time.split(":").map(Number);
                    const endMinutes = eh * 60 + (em || 0);
                    basePx = Math.max(22, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT);
                  }

                  const isMulti = cluster.length > 1;
                  const CARD_H = 56;
                  const MORE_BAR_H = 14;
                  const needsMoreBar = cluster.length > 2;
                  const moreCount = cluster.length - 2;
                  const heightPx = isMulti
                    ? Math.max(basePx, 2 * CARD_H + 1 + (needsMoreBar ? MORE_BAR_H : 0))
                    : basePx;
                  const singleShowMeta = !isMulti && basePx >= 52;

                  const renderCard = (
                    cardEv: CalendarEvent,
                    cardTop: number,
                    cardHeight: number | undefined,
                    cardBottom: number | undefined,
                    cardRadius: string,
                  ) => {
                    const showMeta =
                      cardHeight != null
                        ? cardHeight >= 52
                        : cardBottom != null
                          ? heightPx - cardTop - cardBottom >= 52
                          : singleShowMeta;
                    return (
                      <motion.button
                        key={cardEv.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewEvent(cardEv);
                        }}
                        whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="absolute overflow-hidden text-left"
                        style={{
                          top: cardTop,
                          bottom: cardBottom,
                          height: cardHeight,
                          left: 2,
                          right: 2,
                          backgroundColor: cardEv.color,
                          borderRadius: cardRadius,
                          border: "1px solid rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          padding: "4px 6px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                        }}
                      >
                        <p
                          className="text-[11px] font-bold leading-tight truncate"
                          style={{ color: "white" }}
                        >
                          {cardEv.title}
                        </p>
                        {showMeta && cardEv.start_time && (
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.82)", marginTop: 2 }}>
                            {formatTime(cardEv.start_time)}{cardEv.end_time ? ` – ${formatTime(cardEv.end_time)}` : ""}
                          </p>
                        )}
                        {showMeta && cardEv.category && (
                          <p
                            style={{
                              color: "rgba(255,255,255,0.68)",
                              fontSize: 9,
                              fontWeight: 500,
                              marginTop: 1,
                            }}
                          >
                            {cardEv.category}
                          </p>
                        )}
                      </motion.button>
                    );
                  };

                  return (
                    <div
                      key={ev.id}
                      style={{
                        position: "absolute",
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: 2,
                        right: 2,
                        zIndex: 10,
                      }}
                    >
                      {isMulti
                        ? renderCard(cluster[0], 0, CARD_H, undefined, "6px 6px 0 0")
                        : renderCard(cluster[0], 0, undefined, 0, "6px")}

                      {isMulti &&
                        renderCard(
                          cluster[1],
                          CARD_H + 1,
                          needsMoreBar ? CARD_H : undefined,
                          needsMoreBar ? undefined : 0,
                          needsMoreBar ? "0" : "0 0 6px 6px",
                        )}

                      {needsMoreBar && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOverlap(cluster);
                          }}
                          className="absolute flex items-center justify-center transition-colors hover:brightness-95"
                          style={{
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${MORE_BAR_H}px`,
                            backgroundColor: cluster[1].color,
                            opacity: 0.78,
                            borderRadius: "0 0 6px 6px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.3)",
                            cursor: "pointer",
                            fontSize: 8,
                            fontWeight: 700,
                            color: "white",
                            letterSpacing: "0.02em",
                          }}
                        >
                          View {moreCount} more
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ParentCalendarClient({
  initialEvents = [],
}: {
  initialEvents?: CalendarEvent[];
}) {
  const [events] = useState<CalendarEvent[]>(initialEvents);
  const [viewEvent, setViewEvent] = useState<CalendarEvent | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramKey>("summer");
  const [view, setView] = useState<ViewMode>("weekly");
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 4, 25));
  const [overlapEvents, setOverlapEvents] = useState<CalendarEvent[] | null>(null);

  useEffect(() => {
    const isOpen = !!viewEvent || !!overlapEvents;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [viewEvent, overlapEvents]);

  const program = programs[selectedProgram];
  const today = new Date();

  const atMonthStart =
    currentDate.getFullYear() === program.start.getFullYear() &&
    currentDate.getMonth() === program.start.getMonth();
  const atMonthEnd =
    currentDate.getFullYear() === program.end.getFullYear() &&
    currentDate.getMonth() === program.end.getMonth();

  const weekStart = startOfWeek(currentDate);
  const weekEnd = addDays(weekStart, 4);
  const atWeekStart = weekStart <= program.start;
  const atWeekEnd = weekEnd >= program.end;

  const ws = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(ws, i));

  const isOnToday =
    view === "monthly"
      ? currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
      : weekDays.some((d) => isSameDay(d, today));

  function handleProgramSelect(key: ProgramKey) {
    setSelectedProgram(key);
    setCurrentDate(new Date(programs[key].start));
  }

  function handlePrev() {
    if (view === "monthly" && !atMonthStart) setCurrentDate((d) => addMonths(d, -1));
    if (view === "weekly" && !atWeekStart) setCurrentDate((d) => addDays(d, -7));
  }

  function handleNext() {
    if (view === "monthly" && !atMonthEnd) setCurrentDate((d) => addMonths(d, 1));
    if (view === "weekly" && !atWeekEnd) setCurrentDate((d) => addDays(d, 7));
  }

  function handleToday() {
    const t = new Date();
    setCurrentDate(
      view === "monthly"
        ? new Date(t.getFullYear(), t.getMonth(), 1)
        : startOfWeek(t),
    );
  }

  const navLabel =
    view === "monthly"
      ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const wstart = startOfWeek(currentDate);
          const wend = addDays(wstart, 4);
          const sm = MONTHS[wstart.getMonth()].slice(0, 3);
          const em = MONTHS[wend.getMonth()].slice(0, 3);
          return wstart.getMonth() === wend.getMonth()
            ? `${sm} ${wstart.getDate()}–${wend.getDate()}, ${wstart.getFullYear()}`
            : `${sm} ${wstart.getDate()} – ${em} ${wend.getDate()}, ${wend.getFullYear()}`;
        })();

  const prevDisabled = view === "monthly" ? atMonthStart : atWeekStart;
  const nextDisabled = view === "monthly" ? atMonthEnd : atWeekEnd;

  const monthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Collect unique categories from events for the legend
  const categoryEntries = Array.from(
    new Map(
      events
        .filter((e) => e.category && e.color)
        .map((e) => [e.category!, e.color])
    ).entries()
  ).slice(0, 5);

  return (
    <>
      <div className="flex flex-1">
        {/* ── Left Rail ── */}
        <aside
          className="flex-shrink-0 flex flex-col"
          style={{
            width: 220,
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: "white",
          }}
        >
          {/* Branding strip */}
          <div
            className="flex items-center gap-2 px-4 flex-shrink-0"
            style={{
              height: 56,
              background: "linear-gradient(90deg, #F2F7F3 0%, white 100%)",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.mistyForest }} />
            <span
              className={`text-[13px] font-bold ${merriweather.className}`}
              style={{ color: colors.mistyForest }}
            >
              My Calendar
            </span>
          </div>

          {/* Program label */}
          <p
            className="px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: colors.textTertiary }}
          >
            Programs
          </p>

          {/* Program cards */}
          <nav className="space-y-1.5 px-3">
            {(Object.entries(programs) as [ProgramKey, (typeof programs)[ProgramKey]][]).map(
              ([key, prog]) => {
                const active = selectedProgram === key;
                const Icon = key === "summer" ? Sun : BookOpen;
                return (
                  <motion.button
                    key={key}
                    onClick={() => handleProgramSelect(key)}
                    whileHover={active ? {} : { x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="w-full text-left relative"
                    style={{
                      backgroundColor: active ? "#F2F7F3" : "transparent",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "none",
                      borderLeft: `3px solid ${active ? colors.mistyForest : "transparent"}`,
                      borderRadius: 12,
                      padding: "12px 12px 12px 11px",
                      cursor: "pointer",
                      boxShadow: active ? shadows.soft : "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {/* Top row: icon chip + label */}
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: colors.pastelSage,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: 10, height: 10, color: colors.mistyForest }} />
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.10em",
                          color: colors.mistyForest,
                          textTransform: "uppercase",
                        }}
                      >
                        {prog.shortLabel}
                      </span>
                      {active && (
                        <motion.div
                          layoutId="program-indicator"
                          style={{
                            marginLeft: "auto",
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            backgroundColor: colors.mistyForest,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    {/* Program name */}
                    <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
                      {prog.label}
                    </p>
                    {/* Date range */}
                    <p style={{ fontSize: 10, color: colors.textTertiary }}>
                      {prog.dateRange}
                    </p>
                  </motion.button>
                );
              },
            )}
          </nav>

          {/* Category legend */}
          {categoryEntries.length > 0 && (
            <div className="mt-auto px-4 pb-6 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.12em] mb-3"
                style={{ color: colors.textTertiary }}
              >
                Categories
              </p>
              <div className="flex flex-col gap-2">
                {categoryEntries.map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: colors.textSecondary }}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Calendar Area ── */}
        <div className="flex-1 flex p-4" style={{ backgroundColor: "#F0F4F1" }}>
          <div
            className="flex-1 flex flex-col"
            style={{
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 4px 24px rgba(94,124,104,0.10)",
              overflow: "hidden",
              backgroundColor: "white",
            }}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                height: 68,
                padding: "0 24px",
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: "white",
              }}
            >
              {/* Left: nav cluster + label */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center"
                  style={{
                    backgroundColor: colors.warmLinen,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: 3,
                    gap: 2,
                    display: "flex",
                  }}
                >
                  <NavButton onClick={handlePrev} disabled={prevDisabled} aria-label="Previous">
                    <ChevronLeft className="w-5 h-5" />
                  </NavButton>
                  <NavButton onClick={handleNext} disabled={nextDisabled} aria-label="Next">
                    <ChevronRight className="w-5 h-5" />
                  </NavButton>
                </div>

                <h1
                  className={`text-xl ${merriweather.className}`}
                  style={{ color: colors.textPrimary, fontWeight: 700, lineHeight: 1 }}
                >
                  {view === "monthly" ? (
                    <>
                      <span>{MONTHS[currentDate.getMonth()]}</span>{" "}
                      <span style={{ fontWeight: 300, color: colors.textSecondary }}>
                        {currentDate.getFullYear()}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 16 }}>{navLabel}</span>
                  )}
                </h1>
              </div>

              {/* Center: Today button */}
              <motion.button
                onClick={handleToday}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  padding: "6px 18px",
                  borderRadius: radius.full,
                  backgroundColor: isOnToday ? colors.pastelSage : "white",
                  color: isOnToday ? colors.mistyForest : colors.textSecondary,
                  border: `1px solid ${isOnToday ? colors.pastelSage : colors.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 150ms, color 150ms, border-color 150ms",
                }}
              >
                Today
              </motion.button>

              {/* Right: view toggle with sliding bg */}
              <div
                className="relative flex"
                style={{
                  backgroundColor: colors.warmLinen,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 3,
                }}
              >
                {(["monthly", "weekly"] as ViewMode[]).map((v) => {
                  const active = view === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="relative px-4 py-1.5 text-xs font-medium capitalize z-10"
                      style={{
                        color: active ? colors.textPrimary : colors.textTertiary,
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "transparent",
                        fontWeight: active ? 600 : 400,
                        borderRadius: 9,
                        transition: "color 150ms",
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="view-toggle-pill"
                          className="absolute inset-0"
                          style={{
                            backgroundColor: "white",
                            borderRadius: 9,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(94,124,104,0.08)",
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{v}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar body with animated transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={view + navLabel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" as const }}
                className="flex flex-col flex-1"
              >
                {view === "monthly" ? (
                  <MonthlyGrid
                    days={monthDays}
                    currentMonth={currentDate.getMonth()}
                    today={today}
                    onViewEvent={setViewEvent}
                    events={events}
                  />
                ) : (
                  <WeeklyGrid
                    weekDays={weekDays}
                    today={today}
                    onViewEvent={setViewEvent}
                    onViewOverlap={setOverlapEvents}
                    events={events}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {overlapEvents && !viewEvent && (
          <OverlapPanel
            events={overlapEvents}
            onClose={() => setOverlapEvents(null)}
            onViewEvent={(ev) => {
              setOverlapEvents(null);
              setViewEvent(ev);
            }}
          />
        )}
        {viewEvent && (
          <EventDetailPanel
            event={viewEvent}
            onClose={() => setViewEvent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
