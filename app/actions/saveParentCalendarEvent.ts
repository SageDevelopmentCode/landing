"use server";

import { z } from "zod";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/app/lib/supabase-server";
import {
  isEnrolledParentUser,
  parentCalendarEventDefaults,
  parentCalendarEventInputSchema,
  parentCalendarEventSelect,
} from "@/app/lib/parent-calendar-event";
import { syncCalendarEventFeedPost } from "@/app/lib/feed/syncCalendarEventFeed";

export type SaveParentCalendarEventResponse = {
  success: boolean;
  message: string;
  event?: Record<string, unknown>;
  error?: string;
};

export async function saveParentCalendarEvent(
  data: z.infer<typeof parentCalendarEventInputSchema>,
): Promise<SaveParentCalendarEventResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Please sign in to continue." };
    }

    if (!(await isEnrolledParentUser(user.id))) {
      return {
        success: false,
        message: "Only enrolled families can add calendar events.",
      };
    }

    const validated = parentCalendarEventInputSchema.parse(data);
    const row = parentCalendarEventDefaults(validated, user.id);

    const { data: inserted, error } = await createAdminClient()
      .schema("calendar")
      .from("events")
      .insert(row)
      .select(parentCalendarEventSelect)
      .single();

    if (error) {
      console.error("Save parent calendar event error:", error);
      return {
        success: false,
        message: "Failed to save event. Please try again.",
        error: error.message,
      };
    }

    if (inserted) {
      syncCalendarEventFeedPost({
        id: inserted.id as string,
        title: inserted.title as string,
        event_date: inserted.event_date as string,
        shared_with: inserted.shared_with as string[],
        created_by: inserted.created_by as string | null,
      }).catch((e) => console.error("syncCalendarEventFeedPost:", e));
    }

    return {
      success: true,
      message: "Event added to the calendar.",
      event: inserted,
    };
  } catch (error) {
    console.error("Save parent calendar event error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error",
        error: "Validation error",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
