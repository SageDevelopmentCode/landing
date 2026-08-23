export function isFieldFridayCalendarEvent(event: { title: string }): boolean {
  return event.title.startsWith("Field Friday:");
}
