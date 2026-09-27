import { createAdminClient } from "@/app/lib/supabase-server";
import { FEED_SCHOOL_YEAR } from "@/shared/feed/schoolYear";

export type AutoFeedSourceType =
  | "photo_batch"
  | "activity"
  | "calendar_event"
  | "newsletter"
  | "channel_message";

export type CreateAutoFeedPostInput = {
  authorUserId: string;
  schoolYear?: string;
  postType: string;
  body: string;
  sourceType: AutoFeedSourceType;
  sourceId: string;
  ctaLabel: string;
  /** Parent-facing mobile route (staff routes duplicated at call sites when needed). */
  ctaRoute: string;
  ctaRouteStaff?: string;
};

export type AutoFeedPostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export async function createAutoFeedPost(
  input: CreateAutoFeedPostInput,
): Promise<AutoFeedPostResult> {
  const admin = createAdminClient();
  const schoolYear = input.schoolYear ?? FEED_SCHOOL_YEAR;
  const row = {
    teacher_id: input.authorUserId,
    body: input.body.trim(),
    school_year: schoolYear,
    classroom: null,
    post_type: input.postType,
    feed_mode: "feed",
    source_type: input.sourceType,
    source_id: input.sourceId,
    cta_label: input.ctaLabel,
    cta_route: input.ctaRoute,
    is_deleted: false,
  };

  const { data: existing } = await admin
    .schema("feed")
    .from("posts")
    .select("id")
    .eq("source_type", input.sourceType)
    .eq("source_id", input.sourceId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (existing?.id) {
    const { data: updated, error } = await admin
      .schema("feed")
      .from("posts")
      .update({
        body: row.body,
        post_type: row.post_type,
        cta_label: row.cta_label,
        cta_route: row.cta_route,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      console.error("[createAutoFeedPost] update error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, postId: updated.id };
  }

  const { data: inserted, error } = await admin
    .schema("feed")
    .from("posts")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[createAutoFeedPost] insert error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, postId: inserted.id };
}

export async function softDeleteAutoFeedPost(
  sourceType: AutoFeedSourceType,
  sourceId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .schema("feed")
    .from("posts")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
}

export function formatCalendarEventDateLabel(eventDate: string): string {
  const dateOnly = eventDate.split("T")[0];
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function calendarEventFeedBody(title: string, eventDate: string): string {
  const label = formatCalendarEventDateLabel(eventDate);
  return `**${title}** was added to the school calendar for ${label}.`;
}

export function parentCalendarEventFeedBody(
  parentName: string,
  title: string,
  eventDate: string,
): string {
  const label = formatCalendarEventDateLabel(eventDate);
  const name = parentName.trim() || "A parent";
  return `${name} added **${title}** to the community calendar for ${label}.`;
}

export function calendarEventCtaRoute(eventDate: string, staff = false): string {
  const dateOnly = eventDate.split("T")[0];
  const prefix = staff ? "/(staff)" : "/(tabs)";
  return `${prefix}/calendar?selectDate=${dateOnly}`;
}

export function activityFeedBody(title: string): string {
  return `A new activity is ready for families: **${title}**.`;
}

export function activityCtaRoute(activityId: string, staff = false): string {
  const prefix = staff ? "/(staff)" : "/(tabs)";
  return `${prefix}/activities/${activityId}`;
}

export function newsletterFeedBody(title: string): string {
  return `The latest newsletter is live: **${title}**.`;
}

export function newsletterCtaRoute(newsletterId: string, staff = false): string {
  const prefix = staff ? "/(staff)" : "/(tabs)";
  return `${prefix}/newsletters/${newsletterId}`;
}

export function photoBatchFeedBody(count: number, caption?: string | null): string {
  const noun = count === 1 ? "photo" : "photos";
  const base = `**${count} new ${noun}** were shared with families.`;
  if (caption?.trim()) {
    return `${base}\n\n_${caption.trim()}_`;
  }
  return base;
}

export function photoBatchCtaRoute(staff = false): string {
  return staff ? "/(staff)/photos" : "/(tabs)/photos";
}

export type ChannelMessagePreviewInput = {
  body?: string | null;
  image_url?: string | null;
  file_url?: string | null;
};

export function channelMessagePreviewText(
  record: ChannelMessagePreviewInput,
): string {
  if (record.body?.trim()) {
    const text = record.body.trim();
    return text.length > 200 ? `${text.slice(0, 197)}...` : text;
  }
  if (record.image_url) return "shared a photo";
  if (record.file_url) return "shared a file";
  return "shared an update";
}

export function channelMessageFeedBody(
  senderName: string,
  channelName: string,
  record: ChannelMessagePreviewInput,
): string {
  const preview = channelMessagePreviewText(record);
  return `**${senderName}** posted in **${channelName}**: _${preview}_`;
}

export function channelMessageCtaRoute(channelId: string, staff = false): string {
  const prefix = staff ? "/(staff)" : "/(tabs)";
  return `${prefix}/messages/channel/${channelId}`;
}
