import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  PARENT_CALENDAR_EVENT_COLOR,
  PARENT_CALENDAR_EVENT_SHARED_WITH,
} from "@/shared/parent/parentCalendarAddEvent";

export const parentCalendarEventInputSchema = z.object({
  title: z.string().min(1, "Event name is required").max(200),
  event_date: z.string().min(1, "Date is required"),
  is_all_day: z.boolean(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
});

export type ParentCalendarEventInput = z.infer<
  typeof parentCalendarEventInputSchema
>;

export async function isEnrolledParentUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: ownApp } = await admin
    .schema("parent_app")
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "enrolled")
    .limit(1);

  if ((ownApp ?? []).length > 0) return true;

  const { data: grant } = await admin
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!grant?.owner_id) return false;

  const { data: ownerApp } = await admin
    .schema("parent_app")
    .from("applications")
    .select("id")
    .eq("user_id", grant.owner_id)
    .eq("status", "enrolled")
    .limit(1);

  return (ownerApp ?? []).length > 0;
}

export function parentCalendarEventDefaults(
  validated: ParentCalendarEventInput,
  createdBy: string,
) {
  return {
    title: validated.title.trim(),
    event_date: validated.event_date,
    is_all_day: validated.is_all_day,
    start_time: validated.is_all_day ? null : validated.start_time || null,
    end_time: validated.is_all_day ? null : validated.end_time || null,
    description: validated.description?.trim() || null,
    location: validated.location?.trim() || null,
    shared_with: [...PARENT_CALENDAR_EVENT_SHARED_WITH],
    programs: [] as string[],
    category: null,
    color: PARENT_CALENDAR_EVENT_COLOR,
    recurrence: "None",
    recurrence_end_date: null,
    attachment_links: [] as string[],
    rsvp_enabled: false,
    reminder_email: false,
    reminder_in_app: false,
    reminder_timing: "30 min before",
    internal_notes: null,
    created_by: createdBy,
  };
}

export const parentCalendarEventSelect =
  "id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing, created_by";
