"use client";

/**
 * Garden pieces for the parent calendar (web), after mobile `features/calendar/garden/CalendarParts`:
 * hero, "next up" sticky note, month grid, week strip, hourly week grid (lg only) and the agenda.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as Chevron, Plus, X } from "lucide-react";
import { Segmented } from "@/app/parent/_garden/tabs";
import { EmptyState } from "@/app/parent/_garden/states";
import { SectionHeader, btnCoralSm, cardBase } from "@/app/parent/_garden/ui";
import { fmt12, formatEventTime, toYmd } from "@/app/parent/_garden/format";
import {
  DOW_LETTER,
  DOW_SHORT,
  GRID_END_MIN,
  GRID_HOURS,
  GRID_START_MIN,
  PROGRAMS,
  formatFullDate,
  formatShortDay,
  layoutDay,
  monthCells,
  parseYmd,
  timeToMinutes,
  tint,
  type CalendarEvent,
  type ProgramKey,
  type ViewMode,
} from "./calendarUtils";

const roundBtn =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.12)] ring-1 ring-[var(--sf-ink)]/10 transition hover:-translate-y-0.5 hover:bg-[var(--sf-butter)] focus-visible:-translate-y-0.5 focus-visible:bg-[var(--sf-butter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:bg-white cursor-pointer";

const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]";

// ─────────────────────────────────────────────────────────────────────────────
// Hero: month/week label, chevrons, view toggle, Today, program toggle
// ─────────────────────────────────────────────────────────────────────────────
export function CalendarHero({
  label,
  viewMode,
  onViewMode,
  program,
  onProgram,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  showToday,
  onToday,
  addButton,
}: {
  label: string;
  viewMode: ViewMode;
  onViewMode: (v: ViewMode) => void;
  program: ProgramKey;
  onProgram: (p: ProgramKey) => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  showToday: boolean;
  onToday: () => void;
  addButton?: ReactNode;
}) {
  const unit = viewMode === "monthly" ? "month" : "week";
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="sf-display text-[2.3rem] leading-[0.95] sm:text-6xl">{label}</h1>
          <p className="sf-hand mt-2 text-xl leading-tight text-[var(--sf-sage-deep)]">{PROGRAMS[program].label}</p>
        </div>
        <div className="pointer-events-auto flex gap-2 pb-1">
          <button type="button" onClick={onPrev} disabled={prevDisabled} aria-label={`Previous ${unit}`} className={roundBtn}>
            <ChevronLeft className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
          </button>
          <button type="button" onClick={onNext} disabled={nextDisabled} aria-label={`Next ${unit}`} className={roundBtn}>
            <ChevronRight className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {label}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <Segmented
            label="Calendar view"
            value={viewMode}
            onChange={onViewMode}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
          {showToday ? (
            <button
              type="button"
              onClick={onToday}
              aria-label="Jump to today"
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--sf-butter)] px-4 text-sm font-extrabold text-[#5c4500] shadow-[0_3px_0_0_#c9a93f] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 active:translate-y-0.5 cursor-pointer ${focusRing}`}
            >
              <span aria-hidden="true">☀</span> Today
            </button>
          ) : null}
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Segmented
            label="Program"
            value={program}
            onChange={onProgram}
            options={(Object.keys(PROGRAMS) as ProgramKey[]).map((k) => ({ value: k, label: PROGRAMS[k].toggleLabel }))}
          />
          <span className="text-xs font-bold text-[var(--sf-soft)]">{PROGRAMS[program].dateRange}</span>
        </div>
        {addButton ? <div className="w-full sm:ml-auto sm:w-auto">{addButton}</div> : null}
      </div>
    </header>
  );
}

export function AddEventButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${btnCoralSm} w-full sm:w-auto ${className}`}>
      <Plus className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
      Add your event!
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Next up" sticky note: the single most time-relevant event
// ─────────────────────────────────────────────────────────────────────────────
export function NextUpNote({ event, todayYmd, onOpen }: { event: CalendarEvent | null; todayYmd: string; onOpen: (e: CalendarEvent) => void }) {
  if (!event) return null;
  const isToday = event.event_date === todayYmd;
  const time = formatEventTime(event);
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className={`sf-wiggle group flex w-full items-center gap-3 rounded-[6px] bg-[var(--sf-butter)] px-5 pb-4 pt-3 text-left shadow-[0_18px_30px_-18px_rgba(43,42,38,0.55)] transition hover:!rotate-0 focus-visible:!rotate-0 cursor-pointer ${focusRing}`}
      style={{ rotate: "-1.2deg" }}
    >
      <span className="min-w-0 flex-1">
        <span className="sf-hand block text-lg leading-none text-[#7a5a00]">{isToday ? "today at Sage Field" : "coming up next"}</span>
        <span className="sf-display mt-1.5 line-clamp-2 block text-[1.35rem] leading-tight text-[var(--sf-ink)]">{event.title}</span>
        <span className="mt-1 block text-[13px] font-bold text-[#5c4500]">
          {isToday ? time : `${formatShortDay(event.event_date)} · ${time}`}
        </span>
      </span>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7a5a00] text-[var(--sf-butter)] transition group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        <Chevron className="h-5 w-5" strokeWidth={3} />
      </span>
      <span className="sr-only">Shows event details</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Roving focus helpers: a whole grid is one Tab stop, arrows move inside it.
// ─────────────────────────────────────────────────────────────────────────────
function focusYmdIn(root: HTMLElement | null, ymd: string) {
  root?.querySelector<HTMLElement>(`[data-ymd="${ymd}"]`)?.focus();
}

function dayLabel(ymd: string, todayYmd: string | null, count?: number) {
  const base = formatFullDate(ymd);
  const today = ymd === todayYmd ? ", today" : "";
  const evts = count === undefined ? "" : count ? `, ${count} event${count === 1 ? "" : "s"}` : ", no events";
  return `${base}${today}${evts}`;
}

function EventDots({ events, light }: { events: CalendarEvent[]; light?: boolean }) {
  const colors = [...new Set(events.map((e) => e.color))];
  return (
    <span className="flex h-2 items-center gap-[3px]" aria-hidden="true">
      {colors.slice(0, 3).map((c) => (
        <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: light ? "#fff" : c }} />
      ))}
      {events.length > 3 ? <span className={`text-[10px] font-extrabold leading-none ${light ? "text-white" : "text-[var(--sf-soft)]"}`}>+</span> : null}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Month grid. `board`: phone = compact with dots, ≥sm = event chips.
// `picker`: compact date picker for the add sheet.
// ─────────────────────────────────────────────────────────────────────────────
export function MonthGrid({
  year,
  month,
  todayYmd,
  selected,
  onSelect,
  eventsByDate,
  variant = "board",
  dimPast,
  onOpenEvent,
  onAddDay,
  label,
}: {
  year: number;
  month: number;
  todayYmd: string;
  selected: string | null;
  onSelect: (ymd: string) => void;
  eventsByDate?: Record<string, CalendarEvent[]>;
  variant?: "board" | "picker";
  dimPast?: boolean;
  onOpenEvent?: (e: CalendarEvent) => void;
  onAddDay?: (ymd: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cells = monthCells(year, month);
  const days = cells.filter((c): c is string => c !== null);
  const [focus, setFocus] = useState<string | null>(null);
  const tabTarget =
    (focus && days.includes(focus) && focus) ||
    (selected && days.includes(selected) && selected) ||
    (days.includes(todayYmd) && todayYmd) ||
    days[0];
  const board = variant === "board";

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, ymd: string) {
    const i = days.indexOf(ymd);
    const dow = parseYmd(ymd).getDay();
    let next: number | null = null;
    if (e.key === "ArrowRight") next = i + 1;
    else if (e.key === "ArrowLeft") next = i - 1;
    else if (e.key === "ArrowDown") next = i + 7;
    else if (e.key === "ArrowUp") next = i - 7;
    else if (e.key === "Home") next = i - dow;
    else if (e.key === "End") next = i + (6 - dow);
    if (next === null) return;
    e.preventDefault();
    const clamped = Math.min(Math.max(next, 0), days.length - 1);
    setFocus(days[clamped]);
    focusYmdIn(ref.current, days[clamped]);
  }

  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <div ref={ref} role="grid" aria-label={label} className="w-full">
      <div role="row" className="grid grid-cols-7">
        {DOW_SHORT.map((d, i) => (
          <span
            key={d}
            role="columnheader"
            aria-label={DOW_LONG[i]}
            className={`pb-2 text-center text-[11px] font-extrabold uppercase tracking-wide ${i === 0 || i === 6 ? "text-[var(--sf-soft)]/70" : "text-[var(--sf-soft)]"}`}
          >
            <span className={board ? "sm:hidden" : ""}>{DOW_LETTER[i]}</span>
            {board ? <span className="hidden sm:inline">{d}</span> : null}
          </span>
        ))}
      </div>
      {weeks.map((week, w) => (
        <div role="row" key={w} className={`grid grid-cols-7 ${board ? `sm:border-t sm:border-[var(--sf-ink)]/[0.07] ${w === weeks.length - 1 ? "sm:border-b" : ""}` : ""}`}>
          {week.map((ymd, i) => {
            const weekend = i === 0 || i === 6;
            if (!ymd) return <span key={`e${w}-${i}`} role="gridcell" className={`${board ? `sm:border-l sm:border-[var(--sf-ink)]/[0.07] ${i === 6 ? "sm:border-r" : ""} ${weekend ? "sm:bg-[#f7efe2]/50" : ""}` : ""}`} />;
            const dayEvents = eventsByDate?.[ymd] ?? [];
            const isToday = ymd === todayYmd;
            const isSel = ymd === selected;
            const past = dimPast && ymd < todayYmd;
            const visible = dayEvents.slice(0, 3);
            const overflow = dayEvents.length - visible.length;
            return (
              <div
                key={ymd}
                role="gridcell"
                aria-selected={isSel}
                onClick={board ? () => onSelect(ymd) : undefined}
                className={`group relative flex flex-col items-center ${
                  board
                    ? `sm:min-h-[118px] sm:items-stretch sm:border-l sm:border-[var(--sf-ink)]/[0.07] sm:px-1.5 sm:pb-2 sm:pt-1.5 sm:cursor-pointer ${i === 6 ? "sm:border-r" : ""} ${weekend ? "sm:bg-[#f7efe2]/50" : ""} ${isSel ? "sm:bg-[var(--sf-mint)]/45" : "sm:hover:bg-[var(--sf-butter)]/25"}`
                    : ""
                }`}
              >
                <button
                  type="button"
                  data-ymd={ymd}
                  tabIndex={ymd === tabTarget ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(ymd);
                  }}
                  onKeyDown={(e) => onKeyDown(e, ymd)}
                  onFocus={() => setFocus(ymd)}
                  aria-label={dayLabel(ymd, todayYmd, eventsByDate ? dayEvents.length : undefined)}
                  aria-pressed={isSel}
                  className={`flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-2xl cursor-pointer ${focusRing} ${
                    board ? "min-h-12 sm:min-h-0 sm:w-auto sm:self-start sm:rounded-full" : ""
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold transition-colors ${
                      isSel
                        ? "bg-[var(--sf-sage-deep)] font-extrabold text-white"
                        : isToday
                          ? "font-extrabold text-[var(--sf-coral-deep)] ring-2 ring-[var(--sf-coral)]"
                          : past
                            ? "text-[#b9b2a5]"
                            : weekend
                              ? "text-[var(--sf-soft)]"
                              : "text-[var(--sf-ink)]"
                    } ${!isSel ? "group-hover:bg-white" : ""}`}
                  >
                    {Number(ymd.slice(8))}
                  </span>
                  {board ? (
                    <span className="sm:hidden">
                      <EventDots events={dayEvents} />
                    </span>
                  ) : null}
                </button>

                {board && onAddDay ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddDay(ymd);
                    }}
                    aria-label={`Add an event on ${formatFullDate(ymd)}`}
                    className="absolute right-1.5 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--sf-sage-deep)] opacity-0 shadow-[0_2px_0_0_rgba(43,42,38,0.12)] ring-1 ring-[var(--sf-ink)]/10 transition hover:bg-[var(--sf-mint)] group-hover:opacity-100 sm:flex cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                  </button>
                ) : null}

                {board && dayEvents.length > 0 ? (
                  <div className="mt-1 hidden min-w-0 flex-col gap-1 sm:flex">
                    {visible.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEvent?.(ev);
                        }}
                        title={`${ev.title} · ${formatEventTime(ev)}`}
                        className="flex min-w-0 items-center gap-1 truncate rounded-md px-1.5 py-[3px] text-left text-[11.5px] font-bold leading-tight text-[var(--sf-ink)] transition hover:brightness-95 cursor-pointer"
                        style={{
                          backgroundColor: ev.is_all_day ? tint(ev.color, "40") : tint(ev.color, "1f"),
                          boxShadow: ev.is_all_day ? undefined : `inset 3px 0 0 ${ev.color}`,
                        }}
                      >
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                    {overflow > 0 ? (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(ymd);
                        }}
                        className="self-start rounded-full px-1.5 text-[11px] font-extrabold text-[var(--sf-sage-deep)] hover:underline cursor-pointer"
                      >
                        +{overflow} more
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Week strip: 7 day pills (weekends included) with event dots
// ─────────────────────────────────────────────────────────────────────────────
export function WeekStrip({
  days,
  todayYmd,
  selected,
  onSelect,
  eventsByDate,
  label,
}: {
  days: Date[];
  todayYmd: string;
  selected: string | null;
  onSelect: (ymd: string) => void;
  eventsByDate: Record<string, CalendarEvent[]>;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ymds = days.map(toYmd);
  const [focus, setFocus] = useState<string | null>(null);
  const tabTarget =
    (focus && ymds.includes(focus) && focus) || (selected && ymds.includes(selected) && selected) || (ymds.includes(todayYmd) && todayYmd) || ymds[0];

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(i + 1, 6);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(i - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 6;
    if (next === null) return;
    e.preventDefault();
    setFocus(ymds[next]);
    focusYmdIn(ref.current, ymds[next]);
  }

  return (
    <div ref={ref} role="group" aria-label={label} className="grid grid-cols-7 gap-1.5 sm:gap-2 lg:ml-[52px]">
      {days.map((d, i) => {
        const ymd = ymds[i];
        const isToday = ymd === todayYmd;
        const isSel = ymd === selected;
        const weekend = i === 0 || i === 6;
        const dayEvents = eventsByDate[ymd] ?? [];
        return (
          <button
            key={ymd}
            type="button"
            data-ymd={ymd}
            tabIndex={ymd === tabTarget ? 0 : -1}
            onClick={() => onSelect(ymd)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={() => setFocus(ymd)}
            aria-pressed={isSel}
            aria-label={dayLabel(ymd, todayYmd, dayEvents.length)}
            className={`flex min-h-[78px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[18px] border transition hover:-translate-y-0.5 cursor-pointer ${focusRing} ${
              isSel
                ? "border-[var(--sf-sage-deep)] bg-[var(--sf-sage-deep)] text-white shadow-[0_4px_0_0_#33473b]"
                : isToday
                  ? "border-2 border-[var(--sf-coral)] bg-white"
                  : weekend
                    ? "border-[var(--sf-ink)]/[0.07] bg-[#f7efe2]"
                    : "border-[var(--sf-ink)]/[0.07] bg-white"
            }`}
          >
            <span
              className={`text-[11px] font-extrabold uppercase ${isSel ? "text-white/85" : isToday ? "text-[var(--sf-coral-deep)]" : "text-[var(--sf-soft)]/80"}`}
            >
              <span className="sm:hidden">{DOW_LETTER[i]}</span>
              <span className="hidden sm:inline">{DOW_SHORT[i]}</span>
            </span>
            <span
              className={`sf-display text-[1.35rem] leading-none ${isSel ? "text-white" : isToday ? "text-[var(--sf-coral-deep)]" : weekend ? "text-[var(--sf-soft)]" : "text-[var(--sf-ink)]"}`}
            >
              {d.getDate()}
            </span>
            <EventDots events={dayEvents} light={isSel} />
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hourly week grid (lg only). A visual aid: every event in it is also in the
// agenda, so it's hidden from screen readers and adds no Tab stops.
// ─────────────────────────────────────────────────────────────────────────────
const HOUR_PX = 52;
const MAX_COLS = 3;

function hourLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

export function WeekTimeGrid({
  days,
  todayYmd,
  now,
  selected,
  eventsByDate,
  onOpenEvent,
  onSelectDay,
  onAddAt,
}: {
  days: Date[];
  todayYmd: string;
  now: Date;
  selected: string | null;
  eventsByDate: Record<string, CalendarEvent[]>;
  onOpenEvent: (e: CalendarEvent) => void;
  onSelectDay: (ymd: string) => void;
  onAddAt?: (ymd: string, hour: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ymds = days.map(toYmd);
  const weekKey = ymds[0];

  // Scroll the grid itself (never the page) to the current time, or the week's first event.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = new Date();
    let minute: number;
    if (ymds.includes(toYmd(t))) minute = t.getHours() * 60 + t.getMinutes();
    else {
      const starts = ymds.flatMap((y) => (eventsByDate[y] ?? []).filter((e) => !e.is_all_day).map((e) => timeToMinutes(e.start_time)));
      const first = starts.filter((m) => !Number.isNaN(m));
      minute = first.length ? Math.min(...first) + 90 : 9 * 60 + 90;
    }
    el.scrollTop = Math.max(0, ((minute - GRID_START_MIN) / 60 - 1.5) * HOUR_PX);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reposition only when the week changes
  }, [weekKey]);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayCol = ymds.indexOf(todayYmd);
  const showNow = todayCol >= 0 && nowMin >= GRID_START_MIN && nowMin < GRID_END_MIN;
  const cols = "grid grid-cols-[52px_repeat(7,minmax(0,1fr))]";
  const anyAllDay = ymds.some((y) => (eventsByDate[y] ?? []).some((e) => e.is_all_day));

  return (
    <div className="hidden overflow-hidden border-y border-r border-[var(--sf-ink)]/[0.07] lg:block" aria-hidden="true">
      {anyAllDay ? (
        <div className={`${cols} border-b border-[var(--sf-ink)]/[0.07] bg-[var(--sf-cream)]/60`}>
          <span className="sf-hand self-center pr-2 text-right text-sm leading-none text-[var(--sf-soft)]">all day</span>
          {ymds.map((y) => {
            const allDay = (eventsByDate[y] ?? []).filter((e) => e.is_all_day);
            const shown = allDay.length > 3 ? allDay.slice(0, 2) : allDay;
            return (
              <div key={y} className="flex min-w-0 flex-col gap-1 border-l border-[var(--sf-ink)]/[0.06] p-1">
                {shown.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    tabIndex={-1}
                    onClick={() => onOpenEvent(ev)}
                    title={ev.title}
                    className="truncate rounded-md px-1.5 py-[3px] text-left text-[11px] font-bold text-[var(--sf-ink)] transition hover:brightness-95 cursor-pointer"
                    style={{ backgroundColor: tint(ev.color, "40") }}
                  >
                    {ev.title}
                  </button>
                ))}
                {allDay.length > shown.length ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onSelectDay(y)}
                    className="self-start px-1.5 text-[11px] font-extrabold text-[var(--sf-sage-deep)] hover:underline cursor-pointer"
                  >
                    +{allDay.length - shown.length} more
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div ref={scrollRef} className="max-h-[540px] overflow-y-auto overscroll-contain" data-lenis-prevent>
        <div className={`${cols} relative`} style={{ height: GRID_HOURS.length * HOUR_PX }}>
          <div className="relative">
            {GRID_HOURS.map((h, i) =>
              i > 0 ? (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[10.5px] font-bold text-[var(--sf-soft)]/80" style={{ top: i * HOUR_PX }}>
                  {hourLabel(h)}
                </span>
              ) : null,
            )}
          </div>

          {ymds.map((y, ci) => {
            const blocks = layoutDay(eventsByDate[y] ?? []);
            const clusters = new Map<number, number>();
            for (const b of blocks) clusters.set(b.cluster, Math.max(clusters.get(b.cluster) ?? 0, b.cols));
            const weekend = ci === 0 || ci === 6;
            return (
              <div
                key={y}
                onClick={
                  onAddAt
                    ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const hour = 7 + Math.floor((e.clientY - rect.top) / HOUR_PX);
                        onAddAt(y, Math.min(Math.max(hour, 7), 21));
                      }
                    : undefined
                }
                className={`relative border-l border-[var(--sf-ink)]/[0.06] ${onAddAt ? "cursor-copy" : ""} ${
                  y === selected ? "bg-[var(--sf-mint)]/30" : y === todayYmd ? "bg-[var(--sf-butter)]/20" : weekend ? "bg-[#f7efe2]/45" : ""
                }`}
              >
                {GRID_HOURS.map((h, i) => (
                  <span key={h} className="pointer-events-none absolute inset-x-0 border-t border-[var(--sf-ink)]/[0.06]" style={{ top: i * HOUR_PX }} />
                ))}
                {blocks.map((b) => {
                  const total = Math.min(clusters.get(b.cluster) ?? b.cols, MAX_COLS);
                  const crowded = (clusters.get(b.cluster) ?? 0) > MAX_COLS;
                  if (crowded && b.col >= MAX_COLS - 1) return null;
                  const height = (b.height / 60) * HOUR_PX;
                  const ev = b.event;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEvent(ev);
                      }}
                      title={`${ev.title} · ${formatEventTime(ev)}`}
                      className="absolute flex flex-col overflow-hidden rounded-lg px-1.5 py-1 text-left text-white shadow-[0_2px_6px_-2px_rgba(43,42,38,0.4)] ring-1 ring-white/40 transition hover:z-20 hover:brightness-105 cursor-pointer"
                      style={{
                        top: (b.top / 60) * HOUR_PX + 1,
                        height: Math.max(height - 2, 20),
                        left: `calc(${(b.col / total) * 100}% + 2px)`,
                        width: `calc(${100 / total}% - 4px)`,
                        backgroundColor: ev.color,
                        zIndex: 10,
                      }}
                    >
                      <span className="truncate text-[11px] font-extrabold leading-tight">
                        {b.clippedStart ? "↑ " : ""}
                        {ev.title}
                      </span>
                      {height >= 40 && ev.start_time ? (
                        <span className="truncate text-[10px] font-semibold text-white/85">
                          {fmt12(ev.start_time)}
                          {ev.end_time ? ` – ${fmt12(ev.end_time)}` : ""}
                          {b.clippedEnd ? " ↓" : ""}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {[...clusters.entries()]
                  .filter(([, n]) => n > MAX_COLS)
                  .map(([cid, n]) => {
                    const first = blocks.find((b) => b.cluster === cid)!;
                    const hidden = blocks.filter((b) => b.cluster === cid && b.col >= MAX_COLS - 1).length;
                    return (
                      <button
                        key={`more-${cid}`}
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDay(y);
                        }}
                        className="absolute z-10 rounded-lg bg-[var(--sf-ink)] px-1 py-1 text-[10.5px] font-extrabold text-white hover:bg-[var(--sf-sage-deep)] cursor-pointer"
                        style={{
                          top: (first.top / 60) * HOUR_PX + 1,
                          left: `calc(${((MAX_COLS - 1) / MAX_COLS) * 100}% + 2px)`,
                          width: `calc(${100 / MAX_COLS}% - 4px)`,
                        }}
                        aria-label={`${n} overlapping events`}
                      >
                        +{hidden}
                      </button>
                    );
                  })}
              </div>
            );
          })}

          {showNow ? (
            <div
              className="pointer-events-none absolute z-30 flex items-center"
              style={{
                top: ((nowMin - GRID_START_MIN) / 60) * HOUR_PX,
                left: `calc(52px + (100% - 52px) * ${todayCol} / 7)`,
                width: `calc((100% - 52px) / 7)`,
              }}
            >
              <span className="-ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-coral-deep)] shadow-[0_0_0_3px_rgba(242,154,143,0.3)]" />
              <span className="h-0.5 flex-1 bg-[var(--sf-coral-deep)]" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category legend
// ─────────────────────────────────────────────────────────────────────────────
export function CategoryLegend({ entries }: { entries: [string, string][] }) {
  if (entries.length === 0) return null;
  return (
    <ul aria-label="Event categories" className="flex flex-wrap gap-2">
      {entries.map(([cat, color]) => (
        <li key={cat} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--sf-soft)] ring-1 ring-[var(--sf-ink)]/[0.07]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
          {cat}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Agenda: events for the selected day, week or month, grouped by day
// ─────────────────────────────────────────────────────────────────────────────
function AgendaRow({ event, mine, onOpen }: { event: CalendarEvent; mine: boolean; onOpen: (e: CalendarEvent) => void }) {
  const d = parseYmd(event.event_date);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(event)}
        className={`${cardBase} group flex min-h-[68px] w-full items-center gap-3 rounded-[22px] p-3 text-left transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 cursor-pointer ${focusRing}`}
      >
        <span className="flex w-12 shrink-0 flex-col items-center rounded-[14px] py-1.5" style={{ backgroundColor: tint(event.color, "2e") }} aria-hidden="true">
          <span className="text-[10.5px] font-extrabold uppercase text-[var(--sf-soft)]">{d.toLocaleDateString("en-US", { month: "short" })}</span>
          <span className="sf-display text-xl leading-none text-[var(--sf-ink)]">{d.getDate()}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-[15px] font-extrabold leading-snug text-[var(--sf-ink)]">{event.title}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12.5px] font-semibold text-[var(--sf-soft)]">
              <span className="sr-only">{formatFullDate(event.event_date)}, </span>
              <span aria-hidden="true">{d.toLocaleDateString("en-US", { weekday: "short" })} · </span>
              {formatEventTime(event)}
            </span>
            {mine ? <span className="sf-hand rounded-full bg-[var(--sf-mint)] px-2 text-[13px] leading-5 text-[var(--sf-sage-deep)]">yours</span> : null}
          </span>
        </span>
        {event.category ? (
          <span
            className="hidden max-w-[110px] shrink-0 items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[var(--sf-ink)] min-[420px]:inline-flex"
            style={{ backgroundColor: tint(event.color, "2e") }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: event.color }} aria-hidden="true" />
            <span className="truncate">{event.category}</span>
          </span>
        ) : null}
        <Chevron className="h-4 w-4 shrink-0 text-[var(--sf-soft)]/70 transition group-hover:translate-x-0.5" strokeWidth={2.6} aria-hidden="true" />
      </button>
    </li>
  );
}

export function Agenda({
  title,
  events,
  selectedDate,
  viewMode,
  todayYmd,
  onClearSelection,
  onOpen,
  isMine,
  onAdd,
}: {
  title: string;
  events: CalendarEvent[];
  selectedDate: string | null;
  viewMode: ViewMode;
  todayYmd: string;
  onClearSelection: () => void;
  onOpen: (e: CalendarEvent) => void;
  isMine: (e: CalendarEvent) => boolean;
  onAdd?: () => void;
}) {
  const groups: { ymd: string; items: CalendarEvent[] }[] = [];
  for (const e of events) {
    const last = groups[groups.length - 1];
    if (last && last.ymd === e.event_date) last.items.push(e);
    else groups.push({ ymd: e.event_date, items: [e] });
  }

  return (
    <section aria-labelledby="calendar-agenda">
      <SectionHeader
        id="calendar-agenda"
        title={title}
        note={events.length > 0 ? "tap any event for details" : undefined}
        action={
          selectedDate ? (
            <button
              type="button"
              onClick={onClearSelection}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--sf-mint)]/70 px-3.5 text-[13px] font-extrabold text-[var(--sf-sage-deep)] transition hover:bg-[var(--sf-mint)] cursor-pointer ${focusRing}`}
              aria-label={viewMode === "weekly" ? "Show the whole week" : "Show the whole month"}
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
              {viewMode === "weekly" ? "Whole week" : "Whole month"}
            </button>
          ) : undefined
        }
      />
      {events.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="No events scheduled"
          tint="sky"
          action={
            onAdd ? (
              <button type="button" onClick={onAdd} className={btnCoralSm}>
                <Plus className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                Add your event!
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.ymd} className="flex flex-col gap-2">
              {!selectedDate && groups.length > 1 ? (
                <h3 className="flex items-center gap-2 pt-1 text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">
                  {formatShortDay(g.ymd)}
                  {g.ymd === todayYmd ? (
                    <span className="rounded-full bg-[var(--sf-coral)]/25 px-2 py-0.5 text-[10.5px] normal-case tracking-normal text-[var(--sf-coral-deep)]">Today</span>
                  ) : null}
                </h3>
              ) : null}
              <ul className="flex flex-col gap-2.5">
                {g.items.map((e) => (
                  <AgendaRow key={e.id} event={e} mine={isMine(e)} onOpen={onOpen} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
