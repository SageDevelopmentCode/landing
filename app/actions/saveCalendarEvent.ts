"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";

const saveCalendarEventSchema = z.object({
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
  created_by: z.string().uuid().optional(),
});

export type SaveCalendarEventData = z.infer<typeof saveCalendarEventSchema>;

export type SaveCalendarEventResponse = {
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
  };
  error?: string;
};

export async function saveCalendarEvent(
  data: SaveCalendarEventData
): Promise<SaveCalendarEventResponse> {
  try {
    const validated = saveCalendarEventSchema.parse(data);

    const { data: inserted, error } = await createAdminClient()
      .schema("calendar")
      .from("events")
      .insert({
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
        created_by: validated.created_by || null,
      })
      .select("id, title, event_date, is_all_day, start_time, end_time, color, category")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to save event. Please try again.",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Event saved successfully.",
      event: inserted,
    };
  } catch (error) {
    console.error("Save calendar event error:", error);

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
