// ─── Shared Clock Utilities ───────────────────────────────────────────────────

export interface ClockSession {
  id: string;
  clockInAt: string;
  clockOutAt: string | null;
  note: string;
}

export type SessionsByDay = Record<string, ClockSession[]>;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISO(ts: string): Date {
  return new Date(ts);
}

export function formatDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getDayTotalHours(sessions: ClockSession[]): number {
  let total = 0;
  for (const s of sessions) {
    const start = parseISO(s.clockInAt).getTime();
    const end = s.clockOutAt ? parseISO(s.clockOutAt).getTime() : Date.now();
    total += (end - start) / 3600000;
  }
  return total;
}

export function getWeekTotalHours(
  sessionsByDay: SessionsByDay,
  weekDays: Date[],
): number {
  return weekDays.reduce((sum, d) => {
    const sessions = sessionsByDay[toDateKey(d)] ?? [];
    return sum + getDayTotalHours(sessions);
  }, 0);
}

export function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function groupSessionsByDay(
  rows: {
    id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    note: string | null;
  }[],
): SessionsByDay {
  const map: SessionsByDay = {};
  for (const r of rows) {
    const key = toDateKey(parseISO(r.clock_in_at));
    if (!map[key]) map[key] = [];
    map[key].push({
      id: r.id,
      clockInAt: r.clock_in_at,
      clockOutAt: r.clock_out_at,
      note: r.note ?? "",
    });
  }
  return map;
}

export function fmt12(isoTs: string): string {
  const d = new Date(isoTs);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function sessionDurationHours(clockInAt: string, clockOutAt: string): number {
  const ms = new Date(clockOutAt).getTime() - new Date(clockInAt).getTime();
  return Math.round((ms / 3_600_000) * 100) / 100;
}

export function getPastPayPeriods(n: number): { start: string; end: string; label: string }[] {
  // Anchor to a known Monday that aligns with the web's bi-weekly schedule
  const anchor = new Date("2024-01-08T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - anchor.getTime()) / 86_400_000);
  const currentIdx = Math.floor(diffDays / 14);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const periods: { start: string; end: string; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const startDate = new Date(anchor);
    startDate.setDate(anchor.getDate() + (currentIdx - i) * 14);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 13);

    const start = toDateKey(startDate);
    const end = toDateKey(endDate);
    const label = `${monthNames[startDate.getMonth()]} ${startDate.getDate()} – ${monthNames[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
    periods.push({ start, end, label });
  }
  return periods;
}
