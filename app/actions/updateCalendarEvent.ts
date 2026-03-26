"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";

const updateCalendarEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Event name is required").max(200),
  event_date: z.string().min(1, "Date is required"),
  is_all_day: z.boolean(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
  shared_with: z.array(z.string()).default([]),
  programs: z.array(z.string()).default([]),
  category: z.string().optional(),
  color: z.string().default("#5E7C68"),
  recurrence: z.string().default("None"),
  recurrence_end_date: z.string().nullable().optional(),
  attachment_links: z.array(z.string()).default([]),
  rsvp_enabled: z.boolean().default(false),
  reminder_email: z.boolean().default(false),
  reminder_in_app: z.boolean().default(false),
  reminder_timing: z.string().default("30 min before"),
  internal_notes: z.string().max(2000).optional(),
});

export type UpdateCalendarEventData = z.infer<typeof updateCalendarEventSchema>;

export type UpdateCalendarEventResponse = {
  success: boolean;
  message: string;
  event?: {
    id: string;
    title: string;
    event_date: string;
    is_all_day: boolean;
    start_time: string | null;
    end_time: string | null;
    color: string;
    category: string | null;
    shared_with: string[];
    programs: string[];
    description: string | null;
    location: string | null;
    recurrence: string | null;
    recurrence_end_date: string | null;
    attachment_links: string[];
    rsvp_enabled: boolean;
    reminder_email: boolean;
    reminder_in_app: boolean;
    reminder_timing: string | null;
    internal_notes: string | null;
    created_by: string | null;
  };
  error?: string;
};

export async function updateCalendarEvent(
  data: UpdateCalendarEventData
): Promise<UpdateCalendarEventResponse> {
  try {
    const validated = updateCalendarEventSchema.parse(data);

    const { data: updated, error } = await createAdminClient()
      .schema("calendar")
      .from("events")
      .update({
        title: validated.title,
        event_date: validated.event_date,
        is_all_day: validated.is_all_day,
        start_time: validated.start_time || null,
        end_time: validated.end_time || null,
        description: validated.description || null,
        location: validated.location || null,
        shared_with: validated.shared_with,
        programs: validated.programs,
        category: validated.category || null,
        color: validated.color,
        recurrence: validated.recurrence,
        recurrence_end_date: validated.recurrence_end_date || null,
        attachment_links: validated.attachment_links,
        rsvp_enabled: validated.rsvp_enabled,
        reminder_email: validated.reminder_email,
        reminder_in_app: validated.reminder_in_app,
        reminder_timing: validated.reminder_timing,
        internal_notes: validated.internal_notes || null,
      })
      .eq("id", validated.id)
      .select(
        "id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing, internal_notes, created_by"
      )
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to update event. Please try again.",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Event updated successfully.",
      event: updated,
    };
  } catch (error) {
    console.error("Update calendar event error:", error);

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
