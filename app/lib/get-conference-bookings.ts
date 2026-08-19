import { createAdminClient } from "@/app/lib/supabase-server";
import {
  CONFERENCE_SEASON,
  getAllConferenceDates,
  takenSlotKey,
  type ConferenceBookingRecord,
} from "@/app/lib/parent-teacher-conference";

export type ConferenceBookingsResult = {
  bookingsByStudentId: Record<string, ConferenceBookingRecord>;
  takenSlotKeys: string[];
};

export async function getConferenceBookings(
  parentId: string,
): Promise<ConferenceBookingsResult> {
  const adminClient = createAdminClient();
  const conferenceDates = getAllConferenceDates();

  const { data: parentRows } = await adminClient
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select(
      "student_id, teacher_id, conference_date, time_slot, format, accommodation_note",
    )
    .eq("parent_id", parentId)
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed");

  const { data: takenRows } = await adminClient
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select("teacher_id, conference_date, time_slot")
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed")
    .in("conference_date", conferenceDates);

  const bookingsByStudentId: Record<string, ConferenceBookingRecord> = {};
  for (const row of parentRows ?? []) {
    bookingsByStudentId[row.student_id] = {
      teacherId: row.teacher_id,
      conferenceDate: row.conference_date,
      timeSlot: row.time_slot,
      format: row.format as "in_person" | "virtual",
      accommodationNote: row.accommodation_note ?? null,
    };
  }

  const takenSlotKeys = (takenRows ?? []).map((row) =>
    takenSlotKey(row.conference_date, row.time_slot),
  );

  return { bookingsByStudentId, takenSlotKeys };
}
