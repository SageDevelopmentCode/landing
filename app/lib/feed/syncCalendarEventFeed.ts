import {
  calendarEventCtaRoute,
  calendarEventFeedBody,
  createAutoFeedPost,
  softDeleteAutoFeedPost,
} from "@/app/lib/feed/autoFeedPost";

type CalendarEventRow = {
  id: string;
  title: string;
  event_date: string;
  shared_with: string[];
  created_by: string | null;
};

export async function syncCalendarEventFeedPost(
  event: CalendarEventRow,
): Promise<void> {
  const visibleToParents = (event.shared_with ?? []).includes("Parents");
  if (!visibleToParents) {
    await softDeleteAutoFeedPost("calendar_event", event.id);
    return;
  }

  const authorId = event.created_by;
  if (!authorId) return;

  await createAutoFeedPost({
    authorUserId: authorId,
    postType: "event",
    body: calendarEventFeedBody(event.title, event.event_date),
    sourceType: "calendar_event",
    sourceId: event.id,
    ctaLabel: "View calendar",
    ctaRoute: calendarEventCtaRoute(event.event_date, false),
    ctaRouteStaff: calendarEventCtaRoute(event.event_date, true),
  });
}

export async function removeCalendarEventFeedPost(eventId: string): Promise<void> {
  await softDeleteAutoFeedPost("calendar_event", eventId);
}
