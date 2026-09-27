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

const updateSchema = parentCalendarEventInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateParentCalendarEventResponse = {
  success: boolean;
  message: string;
  event?: Record<string, unknown>;
  error?: string;
};

export async function updateParentCalendarEvent(
  data: z.infer<typeof updateSchema>,
): Promise<UpdateParentCalendarEventResponse> {
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
        message: "Only enrolled families can edit calendar events.",
      };
    }

    const validated = updateSchema.parse(data);

    const admin = createAdminClient();
    const { data: existing, error: fetchError } = await admin
      .schema("calendar")
      .from("events")
      .select("id, created_by")
      .eq("id", validated.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, message: "Event not found." };
    }

    if (existing.created_by !== user.id) {
      return {
        success: false,
        message: "You can only edit events you created.",
      };
    }

    const row = parentCalendarEventDefaults(validated, user.id);

    const { data: updated, error } = await admin
      .schema("calendar")
      .from("events")
      .update(row)
      .eq("id", validated.id)
      .select(parentCalendarEventSelect)
      .single();

    if (error) {
      console.error("Update parent calendar event error:", error);
      return {
        success: false,
        message: "Failed to update event. Please try again.",
        error: error.message,
      };
    }

    if (updated) {
      syncCalendarEventFeedPost({
        id: updated.id as string,
        title: updated.title as string,
        event_date: updated.event_date as string,
        shared_with: updated.shared_with as string[],
        created_by: updated.created_by as string | null,
      }).catch((e) => console.error("syncCalendarEventFeedPost:", e));
    }

    return {
      success: true,
      message: "Event updated.",
      event: updated,
    };
  } catch (error) {
    console.error("Update parent calendar event error:", error);
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
