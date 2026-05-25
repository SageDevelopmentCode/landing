"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISO(value: string): { y: number; m: number; d: number } | null {
  if (!value || value.length !== 10) return null;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7)) - 1;
  const d = Number(value.slice(8, 10));
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { y, m, d };
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDisplay(y: number, m: number, d: number): string {
  return `${MONTHS[m]} ${d}, ${y}`;
}

export default function ActivityDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = parseISO(value);
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const [viewY, setViewY] = useState(parsed?.y ?? todayY);
  const [viewM, setViewM] = useState(parsed?.m ?? todayM);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function toggleOpen() {
    if (!open && parsed) {
      setViewY(parsed.y);
      setViewM(parsed.m);
    }
    setOpen((v) => !v);
  }

  function prevMonth() {
    if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); }
    else setViewM((m) => m - 1);
  }

  function nextMonth() {
    if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); }
    else setViewM((m) => m + 1);
  }

  function selectDay(day: number) {
    onChange(toISO(viewY, viewM, day));
    setOpen(false);
  }

  function goToday() {
    onChange(toISO(todayY, todayM, todayD));
    setViewY(todayY);
    setViewM(todayM);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstDow = new Date(viewY, viewM, 1).getDay();

  const displayLabel = parsed
    ? formatDisplay(parsed.y, parsed.m, parsed.d)
    : "Select a date";

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 text-sm font-body bg-white transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] cursor-pointer"
      >
        <span className={parsed ? "text-gray-800" : "text-gray-400"}>
          {displayLabel}
        </span>
        <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl border border-gray-100 shadow-lg p-4 z-50">
          {/* Month / year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <span className="text-sm font-semibold font-heading text-gray-800">
              {MONTHS[viewM]} {viewY}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-gray-400 text-center uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsed?.y === viewY && parsed?.m === viewM && parsed?.d === day;
              const isToday =
                todayY === viewY && todayM === viewM && todayD === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`w-9 h-9 mx-auto flex items-center justify-center rounded-xl text-sm font-body transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#4a7c59] text-white font-semibold"
                      : isToday
                      ? "ring-1 ring-[#4a7c59]/50 text-[#4a7c59] font-semibold hover:bg-[#4a7c59]/8"
                      : "text-gray-700 hover:bg-[#4a7c59]/8 hover:text-[#4a7c59]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear / Today */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={clear}
              className="text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-body text-[#4a7c59] font-semibold hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
