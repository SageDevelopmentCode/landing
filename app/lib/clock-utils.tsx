"use client";

import { useState, useEffect } from "react";
import type { ClockSession, SessionsByDay } from "@/app/actions/teacherHours";

export function toISOKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function sessionDurationHours(session: ClockSession): number {
  if (!session.clockOutAt) return 0;
  const diff =
    new Date(session.clockOutAt).getTime() -
    new Date(session.clockInAt).getTime();
  return Math.max(0, diff / 1000 / 3600);
}

export function getDayTotalHours(sessions: ClockSession[]): number {
  return sessions.reduce((acc, s) => acc + sessionDurationHours(s), 0);
}

export function getWeekTotalHours(
  monday: Date,
  sessionsByDay: SessionsByDay,
): number {
  return getWeekDays(monday).reduce((acc, d) => {
    return acc + getDayTotalHours(sessionsByDay[toISOKey(d)] ?? []);
  }, 0);
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m === 0) return "0h";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function fmt12(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

// ─── Biweekly Pay Periods ────────────────────────────────────────────────────

// Adjust this to the school's actual first payroll Monday
const PAYROLL_ANCHOR = new Date('2025-01-06T00:00:00')

export type PayPeriod = {
  label: string  // e.g. "Apr 14 – Apr 27, 2025"
  start: string  // 'YYYY-MM-DD'
  end: string    // 'YYYY-MM-DD'
}

export function getPastPayPeriods(count = 12): PayPeriod[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const msPerPeriod = 14 * 24 * 60 * 60 * 1000
  const completedCycles = Math.floor((today.getTime() - PAYROLL_ANCHOR.getTime()) / msPerPeriod)
  const periods: PayPeriod[] = []
  for (let i = completedCycles - 1; i >= Math.max(0, completedCycles - count); i--) {
    const start = new Date(PAYROLL_ANCHOR.getTime() + i * msPerPeriod)
    const end   = new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    periods.push({ label: `${fmt(start)} – ${fmt(end)}`, start: toISOKey(start), end: toISOKey(end) })
  }
  return periods
}

export function ElapsedTimer({ clockInAt }: { clockInAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(
        Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [clockInAt]);

  return <span className="tabular-nums">{formatElapsed(elapsed)}</span>;
}
