"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** Month grid + date helpers shared by the Tour and Shadow Day booking forms. */

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const isSameDay = (a: Date, b: Date | null) =>
  !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isToday = (date: Date) => isSameDay(date, new Date());

/** e.g. "Mon, Jan 5" */
export const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function CalendarGrid({
  selectedDate,
  onSelectDate,
  month,
  year,
  onPrev,
  onNext,
  canPrev,
  canNext,
  isAvailable,
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isAvailable: (date: Date) => boolean;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfMonth(year, month);
  const paddedCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const navBtn =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.15)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 cursor-pointer";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <button type="button" onClick={onPrev} disabled={!canPrev} className={navBtn} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="sf-display text-2xl" aria-live="polite">
          {MONTHS[month]} {year}
        </p>
        <button type="button" onClick={onNext} disabled={!canNext} className={navBtn} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1" aria-hidden="true">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: paddedCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} />;
          const date = new Date(year, month, dayNum);
          const available = isAvailable(date);
          const selected = isSameDay(date, selectedDate);
          const today = isToday(date);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => available && onSelectDate(date)}
              disabled={!available}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 ${
                selected
                  ? "bg-[var(--sf-coral)] text-white shadow-[0_4px_0_0_var(--sf-coral-deep)] -rotate-3"
                  : available
                    ? `cursor-pointer bg-white text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.1)] hover:-translate-y-0.5 hover:bg-[var(--sf-mint)] ${
                        today ? "ring-2 ring-[var(--sf-sage)]" : ""
                      }`
                    : "cursor-not-allowed text-[var(--sf-ink)]/25"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
