// Pure date helpers for the parent calendar. All dates are local "YYYY-MM-DD".
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
  attachment_links: string[] | null;
  created_by: string | null;
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOW_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function isValidYMD(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = parseYMD(ymd);
  return toYMD(d) === ymd;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthKeyOfYMD(ymd: string): string {
  return ymd.slice(0, 7);
}

export function monthRange(key: string): { start: string; end: string } {
  const [y, m] = key.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { start: `${key}-01`, end: `${key}-${String(last).padStart(2, "0")}` };
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Sunday-first week containing `date`. */
export function weekDaysOf(date: Date): Date[] {
  const sunday = addDays(date, -date.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

/** Sunday-first month grid cells (null = padding). */
export function monthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from<null>({ length: firstDow }).fill(null),
    ...Array.from({ length: last }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function ymdOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "HH:MM[:SS]" → minutes since midnight, or NaN. */
export function timeToMinutes(time: string | null | undefined): number {
  if (!time) return NaN;
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fmt12(time: string): string {
  const mins = timeToMinutes(time);
  if (Number.isNaN(mins)) return time;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatEventTime(evt: Pick<CalendarEvent, "is_all_day" | "start_time" | "end_time">): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time) return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "All day";
}

export function formatFullDate(ymd: string): string {
  return parseYMD(ymd).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDay(ymd: string): string {
  return parseYMD(ymd).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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

export function normalizeEvent<T extends { event_date: string; created_by?: string | null; attachment_links?: string[] | null }>(
  e: T,
): T & { created_by: string | null } {
  return {
    ...e,
    event_date: e.event_date.split("T")[0],
    created_by: e.created_by ?? null,
  };
}

export function sortEvents(list: CalendarEvent[]): CalendarEvent[] {
  return [...list].sort((a, b) => {
    const d = a.event_date.localeCompare(b.event_date);
    if (d !== 0) return d;
    if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });
}
