/** Returns Monday–Sunday range for the week containing `today` (YYYY-MM-DD). */
export function getCurrentWeekRange(today: string): { start: string; end: string } {
  const date = new Date(`${today}T12:00:00`);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(monday), end: fmt(sunday) };
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}
