export const CHICAGO_TZ = "America/Chicago";

export type ChicagoDateTimeParts = {
  ymd: string;
  hour: number;
  minute: number;
  dayOfWeek: number;
};

export type AwaitingPickupRecord = {
  marked_absent?: boolean | null;
  picked_up_by_name?: string | null;
};

export function getChicagoDateTimeParts(now = new Date()): ChicagoDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const weekday = get("weekday");

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    ymd: `${year}-${month}-${day}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    dayOfWeek: weekdayMap[weekday] ?? 0,
  };
}

/** Mon–Thu in America/Chicago (for daily cron Discord alert). */
export function isSchoolYearChicagoWeekday(now = new Date()): boolean {
  const { dayOfWeek } = getChicagoDateTimeParts(now);
  return dayOfWeek >= 1 && dayOfWeek <= 4;
}

/** Mon–Thu from 3:30 PM Central onward (staff mobile in-app card). */
export function isSchoolYearPickupReminderWindow(now = new Date()): boolean {
  const { hour, minute, dayOfWeek } = getChicagoDateTimeParts(now);
  if (dayOfWeek < 1 || dayOfWeek > 4) return false;
  if (hour > 15) return true;
  if (hour === 15 && minute >= 30) return true;
  return false;
}

export function isStudentAwaitingPickup(
  record: AwaitingPickupRecord | null | undefined,
): boolean {
  if (!record) return false;
  if (record.marked_absent) return false;
  if (record.picked_up_by_name) return false;
  return true;
}
