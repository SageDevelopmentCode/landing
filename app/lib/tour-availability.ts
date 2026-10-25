export type TourUnavailabilityEntry = {
  unavailable_date: string;
  unavailable_time: string | null;
  is_recurring: boolean;
};

/** Stable YYYY-MM-DD for DB/API date strings. */
export function normalizeTourDateKey(value: string): string {
  return value.slice(0, 10);
}

export function formatTourDateKey(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyFromDate(date: Date): string {
  return formatTourDateKey(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function normalizeTourUnavailabilityEntries<
  T extends TourUnavailabilityEntry,
>(entries: T[]): T[] {
  return entries.map((e) => ({
    ...e,
    unavailable_date: normalizeTourDateKey(e.unavailable_date),
  }));
}

export function getFullDayBlockedDates(
  entries: TourUnavailabilityEntry[],
): Set<string> {
  return new Set(
    entries
      .filter((e) => e.unavailable_time === null)
      .map((e) => normalizeTourDateKey(e.unavailable_date)),
  );
}

export function entryAppliesToDate(
  entry: TourUnavailabilityEntry,
  dateKey: string,
): boolean {
  if (entry.unavailable_time === null) return false;
  const key = normalizeTourDateKey(dateKey);
  const uDate = normalizeTourDateKey(entry.unavailable_date);
  if (entry.is_recurring) {
    const [sy, sm, sd] = key.split("-").map(Number);
    const dayOfWeek = new Date(sy, sm - 1, sd).getDay();
    const [y, m, d] = uDate.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === dayOfWeek;
  }
  return uDate === key;
}

export function getBlockedTimesForDate(
  entries: TourUnavailabilityEntry[],
  dateKey: string,
): Set<string> {
  const times = entries
    .filter((u) => entryAppliesToDate(u, dateKey))
    .map((u) => u.unavailable_time as string);
  return new Set(times);
}

export function hasAvailableSlot(
  entries: TourUnavailabilityEntry[],
  dateKey: string,
  timeSlots: readonly string[],
): boolean {
  if (getFullDayBlockedDates(entries).has(normalizeTourDateKey(dateKey))) {
    return false;
  }
  const blocked = getBlockedTimesForDate(entries, dateKey);
  return timeSlots.some((slot) => !blocked.has(slot));
}

export function getPartialDateKeysForMonth(
  entries: TourUnavailabilityEntry[],
  year: number,
  month: number,
): Set<string> {
  const blockedDates = getFullDayBlockedDates(entries);
  const partialDates = new Set<string>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (const r of entries) {
    if (r.unavailable_time === null) continue;
    const uDate = normalizeTourDateKey(r.unavailable_date);
    if (r.is_recurring) {
      const [ry, rm, rd] = uDate.split("-").map(Number);
      const recurringDow = new Date(ry, rm - 1, rd).getDay();
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month, d).getDay() === recurringDow) {
          const key = formatTourDateKey(year, month, d);
          if (!blockedDates.has(key)) partialDates.add(key);
        }
      }
    } else if (!blockedDates.has(uDate)) {
      partialDates.add(uDate);
    }
  }

  return partialDates;
}
