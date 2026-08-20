export type AcademicSeason = "summer" | "fall" | "winter" | "spring";

export const ACADEMIC_YEAR_LABEL = "2026–2027";

export const KEY_DATES = {
  firstDay: {
    label: "First Day of School",
    monthDay: "August 17,",
    year: "2026",
    iso: "2026-08-17",
  },
  lastDay: {
    label: "Last Day of School",
    monthDay: "May 27,",
    year: "2027",
    iso: "2027-05-27",
  },
} as const;

export type AcademicHoliday = {
  name: string;
  dates: string;
  closedFrom: string;
  closedTo: string;
  season: Exclude<AcademicSeason, "summer">;
  note: string;
};

export const HOLIDAYS: AcademicHoliday[] = [
  {
    name: "Labor Day",
    dates: "September 7, 2026",
    closedFrom: "2026-09-07",
    closedTo: "2026-09-07",
    season: "fall",
    note: "School closed",
  },
  {
    name: "Student Holiday",
    dates: "October 12, 2026",
    closedFrom: "2026-10-12",
    closedTo: "2026-10-12",
    season: "fall",
    note: "School closed",
  },
  {
    name: "Thanksgiving Break",
    dates: "November 23–27, 2026",
    closedFrom: "2026-11-23",
    closedTo: "2026-11-27",
    season: "fall",
    note: "School closed",
  },
  {
    name: "Winter Break",
    dates: "December 18, 2026 – January 1, 2027",
    closedFrom: "2026-12-18",
    closedTo: "2027-01-01",
    season: "winter",
    note: "School closed",
  },
  {
    name: "MLK Jr. Day",
    dates: "January 18, 2027",
    closedFrom: "2027-01-18",
    closedTo: "2027-01-18",
    season: "winter",
    note: "School closed",
  },
  {
    name: "President's Day",
    dates: "February 15, 2027",
    closedFrom: "2027-02-15",
    closedTo: "2027-02-15",
    season: "winter",
    note: "School closed",
  },
  {
    name: "Spring Break",
    dates: "March 15–19, 2027",
    closedFrom: "2027-03-15",
    closedTo: "2027-03-19",
    season: "spring",
    note: "School closed",
  },
  {
    name: "Good Friday",
    dates: "March 26, 2027",
    closedFrom: "2027-03-26",
    closedTo: "2027-03-26",
    season: "spring",
    note: "School closed",
  },
];

export const seasonStyles: Record<
  AcademicSeason,
  { bg: string; text: string; dot: string }
> = {
  summer: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  fall: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  winter: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
  spring: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export const SHADOW_CAL_MIN = parseIsoDate(KEY_DATES.firstDay.iso);
export const SHADOW_CAL_MAX = parseIsoDate(KEY_DATES.lastDay.iso);

let _closedDatesCache: Set<string> | null = null;

export function expandClosedDates(): Set<string> {
  if (_closedDatesCache) return _closedDatesCache;

  const closed = new Set<string>();

  for (const holiday of HOLIDAYS) {
    const start = parseIsoDate(holiday.closedFrom);
    const end = parseIsoDate(holiday.closedTo);
    const cursor = new Date(start);

    while (cursor <= end) {
      closed.add(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  _closedDatesCache = closed;
  return closed;
}

export function isShadowDayBookable(
  date: Date,
  today: Date = new Date(),
): boolean {
  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const day = normalizedDate.getDay();
  if (day < 1 || day > 4) return false;
  if (normalizedDate < SHADOW_CAL_MIN || normalizedDate > SHADOW_CAL_MAX) {
    return false;
  }
  if (normalizedDate < normalizedToday) return false;
  if (expandClosedDates().has(toDateKey(normalizedDate))) return false;

  return true;
}
