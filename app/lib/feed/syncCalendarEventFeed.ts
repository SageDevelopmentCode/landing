import { createAdminClient } from "@/app/lib/supabase-server";
import {
  calendarEventCtaRoute,
  calendarEventFeedBody,
  createAutoFeedPost,
  parentCalendarEventFeedBody,
  softDeleteAutoFeedPost,
} from "@/app/lib/feed/autoFeedPost";
import { isTeacherOrAdmin } from "@/app/lib/feed/isTeacherOrAdmin";
import {
  PARENT_CALENDAR_EVENT_COLOR,
  PARENT_CALENDAR_EVENT_SHARED_WITH,
} from "@/shared/parent/parentCalendarAddEvent";

type CalendarEventRow = {
  id: string;
  title: string;
  event_date: string;
  shared_with: string[];
  created_by: string | null;
  color?: string | null;
};

function isParentSubmittedCalendarEvent(event: CalendarEventRow): boolean {
  const shared = event.shared_with ?? [];
  const expected = PARENT_CALENDAR_EVENT_SHARED_WITH as readonly string[];
  if (shared.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (shared[i] !== expected[i]) return false;
  }
  if (event.color != null && event.color !== PARENT_CALENDAR_EVENT_COLOR) {
    return false;
  }
  return true;
}

async function parentDisplayName(userId: string): Promise<string> {
  const { data } = await createAdminClient()
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.full_name?.trim() || "A parent";
}

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

  const staffAuthored = await isTeacherOrAdmin(authorId);
  const parentCommunityEvent =
    !staffAuthored && isParentSubmittedCalendarEvent(event);

  const ctaLabel = "View calendar";
  const ctaRoute = calendarEventCtaRoute(event.event_date, false);
  const ctaRouteStaff = calendarEventCtaRoute(event.event_date, true);

  if (parentCommunityEvent) {
    const parentName = await parentDisplayName(authorId);
    await createAutoFeedPost({
      authorUserId: authorId,
      postType: "community",
      body: parentCalendarEventFeedBody(parentName, event.title, event.event_date),
      sourceType: "calendar_event",
      sourceId: event.id,
      ctaLabel,
      ctaRoute,
      ctaRouteStaff,
    });
    return;
  }

  await createAutoFeedPost({
    authorUserId: authorId,
    postType: "event",
    body: calendarEventFeedBody(event.title, event.event_date),
    sourceType: "calendar_event",
    sourceId: event.id,
    ctaLabel,
    ctaRoute,
    ctaRouteStaff,
  });
}

export async function removeCalendarEventFeedPost(eventId: string): Promise<void> {
  await softDeleteAutoFeedPost("calendar_event", eventId);
}
