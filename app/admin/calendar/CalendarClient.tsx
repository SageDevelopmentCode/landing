"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Merriweather } from "next/font/google";
import { colors, radius, shadows } from "../design-system";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

type ProgramKey = "summer" | "school";
type ViewMode = "monthly" | "weekly";

const SHARE_GROUPS = ["Teachers", "Parents", "Students", "Staff"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM → 9 PM
const HOUR_HEIGHT = 64; // px per hour slot

const programs: Record<ProgramKey, { label: string; start: Date; end: Date }> =
  {
    summer: {
      label: "Summer 2026",
      start: new Date(2026, 4, 1),
      end: new Date(2026, 7, 31),
    },
    school: {
      label: "School Year 2026–2027",
      start: new Date(2026, 7, 1),
      end: new Date(2027, 4, 31),
    },
  };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  if (rem < 7) for (let i = 1; i <= rem; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Add Event Panel ───────────────────────────────────────────────────────────

function AddEventPanel({
  onClose,
  initialDate,
}: {
  onClose: () => void;
  initialDate?: Date | null;
}) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  function toggleGroup(g: string) {
    setSelectedGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "376px",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.07)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          <div>
            <h2
              className={`text-base font-bold leading-none ${merriweather.className}`}
              style={{ color: colors.mistyForest }}
            >
              New Event
            </h2>
            {initialDate && (
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                {MONTHS[initialDate.getMonth()]} {initialDate.getDate()},{" "}
                {initialDate.getFullYear()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
            style={{
              backgroundColor: colors.warmLinen,
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            <X className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
          <Field label="Event name">
            <input
              type="text"
              placeholder="e.g. Swimming Lessons"
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              defaultValue={initialDate ? formatDateInput(initialDate) : ""}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </Field>

          <Field label="Time">
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="flex-1 px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
                onBlur={(e) => (e.target.style.borderColor = colors.border)}
              />
              <span className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                to
              </span>
              <input
                type="time"
                className="flex-1 px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
                onBlur={(e) => (e.target.style.borderColor = colors.border)}
              />
            </div>
          </Field>

          <Field label="Share with">
            <div className="flex flex-wrap gap-2">
              {SHARE_GROUPS.map((g) => {
                const sel = selectedGroups.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    className="px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{
                      backgroundColor: sel ? colors.pastelSage : colors.softCloud,
                      color: sel ? colors.mistyForest : colors.textSecondary,
                      border: `1px solid ${sel ? colors.pastelSage : colors.border}`,
                      borderRadius: radius.full,
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex gap-2"
          style={{ borderTop: `1px solid ${colors.divider}` }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-70"
            style={{
              backgroundColor: colors.warmLinen,
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
            style={{
              backgroundColor: colors.mistyForest,
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Event
          </button>
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: colors.softCloud,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  color: colors.textPrimary,
  transition: "border-color 150ms",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5 uppercase tracking-wide"
        style={{ color: colors.textTertiary }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CalendarClient() {
  const [selectedProgram, setSelectedProgram] = useState<ProgramKey>("summer");
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(programs.summer.start)
  );
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);

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

  function openAddEvent(date?: Date) {
    setAddEventDate(date ?? null);
    setAddEventOpen(true);
  }

  const navLabel =
    view === "monthly"
      ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const ws = startOfWeek(currentDate);
          const we = addDays(ws, 4);
          const sm = MONTHS[ws.getMonth()].slice(0, 3);
          const em = MONTHS[we.getMonth()].slice(0, 3);
          return ws.getMonth() === we.getMonth()
            ? `${sm} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
            : `${sm} ${ws.getDate()} – ${em} ${we.getDate()}, ${we.getFullYear()}`;
        })();

  const prevDisabled = view === "monthly" ? atMonthStart : atWeekStart;
  const nextDisabled = view === "monthly" ? atMonthEnd : atWeekEnd;

  const monthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const ws = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(ws, i));

  return (
    <>
      {/* Full-bleed layout that cancels the main's padding */}
      <div
        className="-mx-3 sm:-mx-4 lg:-mx-6 flex h-full"
        style={{ minHeight: 0 }}
      >
        {/* ── Left Panel ── */}
        <aside
          className="flex-shrink-0 flex flex-col pt-7 pb-6"
          style={{
            width: "168px",
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: colors.warmLinen,
          }}
        >
          <p
            className="px-4 text-[10px] font-semibold uppercase tracking-[0.12em] mb-3"
            style={{ color: colors.textTertiary }}
          >
            Programs
          </p>
          <nav className="space-y-0.5 px-2">
            {(
              Object.entries(programs) as [
                ProgramKey,
                (typeof programs)[ProgramKey]
              ][]
            ).map(([key, prog]) => {
              const active = selectedProgram === key;
              return (
                <button
                  key={key}
                  onClick={() => handleProgramSelect(key)}
                  className="w-full text-left px-3 py-2 text-sm transition-all duration-150"
                  style={{
                    backgroundColor: active ? colors.pastelSage : "transparent",
                    color: active ? colors.mistyForest : colors.textSecondary,
                    fontWeight: active ? 600 : 400,
                    borderRadius: radius.sm,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {prog.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Calendar Area ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "white" }}>
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{
              backgroundColor: "white",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {/* Left: nav + label */}
            <div className="flex items-center gap-1">
              <NavButton onClick={handlePrev} disabled={prevDisabled} aria-label="Previous">
                <ChevronLeft className="w-4 h-4" />
              </NavButton>
              <NavButton onClick={handleNext} disabled={nextDisabled} aria-label="Next">
                <ChevronRight className="w-4 h-4" />
              </NavButton>
              <span
                className="ml-2 text-sm font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {navLabel}
              </span>
            </div>

            {/* Right: Add Event + view toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddEvent()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: colors.mistyForest,
                  color: "white",
                  border: "none",
                  borderRadius: radius.md,
                  cursor: "pointer",
                  boxShadow: shadows.soft,
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event
              </button>

              {/* Segmented control */}
              <div
                className="flex p-0.5"
                style={{
                  backgroundColor: colors.warmLinen,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                }}
              >
                {(["monthly", "weekly"] as ViewMode[]).map((v) => {
                  const active = view === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="px-3.5 py-1 text-sm font-medium transition-all duration-150 capitalize"
                      style={{
                        backgroundColor: active ? "white" : "transparent",
                        color: active ? colors.textPrimary : colors.textTertiary,
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: active ? shadows.soft : "none",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar body — flush, no padding */}
          <div className="flex-1 overflow-hidden">
            {view === "monthly" ? (
              <MonthlyGrid
                days={monthDays}
                currentMonth={currentDate.getMonth()}
                today={today}
                onAddEvent={openAddEvent}
              />
            ) : (
              <WeeklyGrid
                weekDays={weekDays}
                today={today}
                onAddEvent={openAddEvent}
              />
            )}
          </div>
        </div>
      </div>

      {addEventOpen && (
        <AddEventPanel
          onClose={() => setAddEventOpen(false)}
          initialDate={addEventDate}
        />
      )}
    </>
  );
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
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="p-1.5 rounded-lg transition-all duration-150"
      style={{
        backgroundColor: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        color: colors.textSecondary,
      }}
    >
      {children}
    </button>
  );
}

// ─── Monthly Grid ──────────────────────────────────────────────────────────────

function MonthlyGrid({
  days,
  currentMonth,
  today,
  onAddEvent,
}: {
  days: Date[];
  currentMonth: number;
  today: Date;
  onAddEvent: (date: Date) => void;
}) {
  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Day name header */}
      <div
        className="grid grid-cols-7 flex-shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: colors.textTertiary }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1" style={{ alignContent: "start" }}>
        {days.map((day, i) => {
          const inMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className="group relative p-2 flex flex-col transition-colors duration-100 hover:bg-gray-50"
              style={{
                minHeight: "128px",
                borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold mb-1 transition-colors"
                style={{
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.mistyForest : "transparent",
                  color: isToday ? "white" : inMonth ? colors.textPrimary : colors.textTertiary,
                  opacity: inMonth ? 1 : 0.4,
                }}
              >
                {day.getDate()}
              </span>

              {/* Add button — appears on hover */}
              {inMonth && (
                <button
                  onClick={() => onAddEvent(day)}
                  className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-5 h-5"
                  style={{
                    backgroundColor: colors.pastelSage,
                    color: colors.mistyForest,
                    borderRadius: radius.sm,
                    border: "none",
                    cursor: "pointer",
                  }}
                  title={`Add event on ${MONTHS[day.getMonth()]} ${day.getDate()}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly Grid ───────────────────────────────────────────────────────────────
// Header is sticky *inside* the scroll container so it shares the exact same
// width as the body — this prevents the scrollbar from causing misalignment.

function WeeklyGrid({
  weekDays,
  today,
  onAddEvent,
}: {
  weekDays: Date[];
  today: Date;
  onAddEvent: (date: Date) => void;
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
      scrollRef.current.scrollTop = offset;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const GUTTER = 52; // px — time label column width

  return (
    // Single scrollable container — header is sticky inside it
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {/* ── Sticky day header ── */}
      <div
        className="sticky top-0 z-10 flex bg-white"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {/* Gutter spacer */}
        <div
          style={{
            width: `${GUTTER}px`,
            flexShrink: 0,
            borderRight: `1px solid ${colors.border}`,
          }}
        />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className="flex-1 py-3 flex flex-col items-center gap-1 relative group"
              style={{
                borderRight: i === 4 ? "none" : `1px solid ${colors.border}`,
                backgroundColor: isToday ? "#f8fbf9" : "white",
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: isToday ? colors.mistyForest : colors.textTertiary }}
              >
                {WEEK_DAYS[i]}
              </span>
              <div
                className="flex items-center justify-center w-8 h-8 text-sm font-semibold"
                style={{
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.mistyForest : "transparent",
                  color: isToday ? "white" : colors.textPrimary,
                }}
              >
                {day.getDate()}
              </div>
              <button
                onClick={() => onAddEvent(day)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-5 h-5"
                style={{
                  backgroundColor: colors.pastelSage,
                  color: colors.mistyForest,
                  borderRadius: radius.sm,
                  border: "none",
                  cursor: "pointer",
                }}
                title={`Add event on ${MONTHS[day.getMonth()]} ${day.getDate()}`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Time grid ── */}
      <div
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
              className="absolute flex items-start justify-end pr-2"
              style={{
                top: `${i * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`,
                width: `${GUTTER}px`,
                paddingTop: "6px",
              }}
            >
              {i > 0 && (
                <span
                  className="text-[10px] font-medium"
                  style={{ color: colors.textTertiary }}
                >
                  {h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns — flex (not grid) to match header exactly */}
        <div className="flex-1 flex relative">
          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div
                className="rounded-full flex-shrink-0"
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  marginLeft: "-4px",
                }}
              />
              <div
                className="flex-1"
                style={{ height: "1.5px", backgroundColor: "#ef4444" }}
              />
            </div>
          )}

          {weekDays.map((day, colIdx) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={colIdx}
                className="flex-1 relative"
                style={{
                  borderRight: colIdx === 4 ? "none" : `1px solid ${colors.border}`,
                  backgroundColor: isToday ? "#f8fbf9" : "white",
                }}
              >
                {HOURS.map((_, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                      borderBottom:
                        rowIdx === HOURS.length - 1
                          ? "none"
                          : `1px solid ${colors.border}`,
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
