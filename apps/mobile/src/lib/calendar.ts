// Keep in sync with shared/parent/calendar.ts (web uses repo-root shared/).

export function isFieldFridayCalendarEvent(event: { title: string }): boolean {
  return event.title.startsWith("Field Friday:");
}
