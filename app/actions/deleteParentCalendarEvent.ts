"use server";

import { z } from "zod";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/app/lib/supabase-server";
import { isEnrolledParentUser } from "@/app/lib/parent-calendar-event";
import { removeCalendarEventFeedPost } from "@/app/lib/feed/syncCalendarEventFeed";

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteParentCalendarEventResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function deleteParentCalendarEvent(
  data: z.infer<typeof deleteSchema>,
): Promise<DeleteParentCalendarEventResponse> {
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
        message: "Only enrolled families can remove calendar events.",
      };
    }

    const { id } = deleteSchema.parse(data);

    const admin = createAdminClient();
    const { data: existing, error: fetchError } = await admin
      .schema("calendar")
      .from("events")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return { success: false, message: "Event not found." };
    }

    if (existing.created_by !== user.id) {
      return {
        success: false,
        message: "You can only delete events you created.",
      };
    }

    const { error } = await admin
      .schema("calendar")
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete parent calendar event error:", error);
      return {
        success: false,
        message: "Failed to delete event. Please try again.",
        error: error.message,
      };
    }

    await removeCalendarEventFeedPost(id);

    return { success: true, message: "Event removed." };
  } catch (error) {
    console.error("Delete parent calendar event error:", error);
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
