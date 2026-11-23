/**
 * Pure helpers for the parent calendar (web). Dates are local `YYYY-MM-DD` strings,
 * matching the mobile `features/calendar/calendarUtils.ts`.
 */
import { toYmd } from "@/app/parent/_garden/format";

export type CalendarEvent = {
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
  created_by?: string | null;
};

export type ProgramKey = "school" | "summer";
export type ViewMode = "monthly" | "weekly";

export const PROGRAMS: Record<ProgramKey, { label: string; toggleLabel: string; start: Date; end: Date; dateRange: string }> = {
  school: {
    label: "School Year 2026–2027",
    toggleLabel: "School Year",
    start: new Date(2026, 7, 17),
    end: new Date(2027, 4, 31),
    dateRange: "Aug 2026 – May 2027",
  },
  summer: {
    label: "Summer 2026",
    toggleLabel: "Summer",
    start: new Date(2026, 4, 1),
    end: new Date(2026, 7, 31),
    dateRange: "May – Aug 2026",
  },
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOW_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

/** Hourly grid range (week view at lg): 7:00 am → 10:00 pm. */
export const GRID_START_MIN = 7 * 60;
export const GRID_END_MIN = 22 * 60;
export const GRID_HOURS = Array.from({ length: (GRID_END_MIN - GRID_START_MIN) / 60 }, (_, i) => 7 + i);

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isValidYmd(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = parseYmd(ymd);
  return !Number.isNaN(d.getTime()) && toYmd(d) === ymd;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Sunday-start week, like the month grid and the mobile calendar. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function weekDaysOf(date: Date): Date[] {
  const s = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

/** Month cells, Sunday first. `null` pads the leading / trailing days. */
export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= count; d++) cells.push(toYmd(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function inProgram(key: ProgramKey, d: Date): boolean {
  const p = PROGRAMS[key];
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return t >= p.start.getTime() && t <= p.end.getTime();
}

/**
 * The program that contains `today`. During the late-August overlap the school year wins;
 * before summer starts it's summer, after the school year ends it's the school year.
 */
export function programFor(today: Date): ProgramKey {
  if (inProgram("school", today)) return "school";
  if (inProgram("summer", today)) return "summer";
  return today < PROGRAMS.summer.start ? "summer" : "school";
}

/** Today when it falls inside the program, otherwise the program's first day. */
export function anchorFor(key: ProgramKey, today: Date): Date {
  return inProgram(key, today) ? today : new Date(PROGRAMS[key].start);
}

export function timeToMinutes(t: string | null | undefined): number {
  if (!t) return Number.NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function sortEvents<T extends CalendarEvent>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const d = a.event_date.localeCompare(b.event_date);
    if (d !== 0) return d;
    if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });
}

export function groupByDate(list: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const out: Record<string, CalendarEvent[]> = {};
  for (const e of list) (out[e.event_date] ??= []).push(e);
  return out;
}

export function formatFullDate(ymd: string): string {
  return parseYmd(ymd).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function formatShortDay(ymd: string): string {
  return parseYmd(ymd).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Mon, Jun 1, 2027" for recurrence end dates. Falls back to the raw value. */
export function formatDateWithYear(value: string): string {
  const ymd = value.split("T")[0];
  if (!isValidYmd(ymd)) return value;
  return parseYmd(ymd).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function weekLabel(days: Date[]): string {
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(days[0])} – ${f(days[days.length - 1])}`;
}

/** Readable file name from an attachment URL (no query string, decoded). */
export function attachmentName(url: string, index: number): string {
  const raw = url.split("?")[0]?.split("#")[0]?.split("/").pop() ?? "";
  let name = raw;
  try {
    name = decodeURIComponent(raw);
  } catch {
    // keep raw
  }
  return name || `Attachment ${index + 1}`;
}

/** Hex colour with alpha, for event tints (`#6B8F9C` → `#6B8F9C26`). */
export function tint(hex: string, alpha = "26"): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;
}

/**
 * Lays timed events out for the hourly grid: clamps them to 7am–10pm and splits
 * overlapping events into side-by-side columns.
 */
export type GridBlock = {
  event: CalendarEvent;
  top: number; // minutes from GRID_START_MIN
  height: number; // minutes
  col: number;
  cols: number;
  /** Index of the overlap group this block belongs to. */
  cluster: number;
  /** Starts before 7am or ends after 10pm, so the block is cut off. */
  clippedStart: boolean;
  clippedEnd: boolean;
};

export function layoutDay(events: CalendarEvent[]): GridBlock[] {
  const items = events
    .filter((e) => !e.is_all_day && e.start_time)
    .map((e) => {
      const s = timeToMinutes(e.start_time);
      const rawEnd = timeToMinutes(e.end_time);
      const end = Number.isNaN(rawEnd) || rawEnd <= s ? s + 60 : rawEnd;
      const cs = Math.min(Math.max(s, GRID_START_MIN), GRID_END_MIN - 30);
      const ce = Math.max(Math.min(end, GRID_END_MIN), cs + 30);
      return { event: e, s: cs, e: ce, clippedStart: s < GRID_START_MIN, clippedEnd: end > GRID_END_MIN };
    })
    .sort((a, b) => a.s - b.s || b.e - a.e);

  const blocks: GridBlock[] = [];
  let cluster: typeof items = [];
  let clusterEnd = -1;
  let clusterIdx = 0;
  const flush = () => {
    const colEnds: number[] = [];
    const placed = cluster.map((it) => {
      let col = colEnds.findIndex((end) => end <= it.s);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(it.e);
      } else colEnds[col] = it.e;
      return { it, col };
    });
    for (const { it, col } of placed) {
      blocks.push({
        event: it.event,
        top: it.s - GRID_START_MIN,
        height: it.e - it.s,
        col,
        cols: colEnds.length,
        cluster: clusterIdx,
        clippedStart: it.clippedStart,
        clippedEnd: it.clippedEnd,
      });
    }
    cluster = [];
    clusterIdx += 1;
  };
  for (const it of items) {
    if (cluster.length && it.s >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.e);
  }
  if (cluster.length) flush();
  return blocks;
}
