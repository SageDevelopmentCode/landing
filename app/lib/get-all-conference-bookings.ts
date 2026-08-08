import { createAdminClient } from "@/app/lib/supabase-server";
import {
  CONFERENCE_SEASON,
  CONFERENCE_TEACHERS,
} from "@/app/lib/parent-teacher-conference";

export type AdminConferenceBooking = {
  id: string;
  conferenceDate: string;
  timeSlot: string;
  format: "in_person" | "virtual";
  accommodationNote: string | null;
  createdAt: string;
  childName: string;
  parentName: string;
  parentEmail: string | null;
  teacherName: string;
  teacherId: string;
};

export type AllConferenceBookingsResult = {
  bookings: AdminConferenceBooking[];
  countsByTeacherId: Record<string, number>;
};

export async function getAllConferenceBookings(): Promise<AllConferenceBookingsResult> {
  const adminClient = createAdminClient();

  const { data: rows, error } = await adminClient
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select(
      "id, parent_id, student_id, teacher_id, conference_date, time_slot, format, accommodation_note, created_at",
    )
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed")
    .order("conference_date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (error) {
    throw new Error(`Failed to load conference bookings: ${error.message}`);
  }

  const bookingRows = rows ?? [];

  if (bookingRows.length === 0) {
    const countsByTeacherId: Record<string, number> = {};
    for (const t of CONFERENCE_TEACHERS) {
      countsByTeacherId[t.id] = 0;
    }
    return { bookings: [], countsByTeacherId };
  }

  const studentIds = [...new Set(bookingRows.map((r) => r.student_id))];
  const userIds = [
    ...new Set(
      bookingRows.flatMap((r) => [r.parent_id, r.teacher_id]),
    ),
  ];

  const [{ data: students }, { data: users }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name")
      .in("id", studentIds),
    adminClient
      .schema("admin")
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds),
  ]);

  const studentNameById = new Map(
    (students ?? []).map((s) => [s.id, s.child_legal_name ?? "Unknown child"]),
  );
  const userById = new Map(
    (users ?? []).map((u) => [
      u.id,
      { name: u.full_name ?? "Unknown", email: u.email ?? null },
    ]),
  );

  const teacherNameById = new Map(
    CONFERENCE_TEACHERS.map((t) => [t.id, t.name]),
  );

  const countsByTeacherId: Record<string, number> = {};
  for (const t of CONFERENCE_TEACHERS) {
    countsByTeacherId[t.id] = 0;
  }

  const bookings: AdminConferenceBooking[] = bookingRows.map((row) => {
    countsByTeacherId[row.teacher_id] =
      (countsByTeacherId[row.teacher_id] ?? 0) + 1;

    const parent = userById.get(row.parent_id);
    return {
      id: row.id,
      conferenceDate: row.conference_date,
      timeSlot: row.time_slot,
      format: row.format as "in_person" | "virtual",
      accommodationNote: row.accommodation_note ?? null,
      createdAt: row.created_at,
      childName: studentNameById.get(row.student_id) ?? "Unknown child",
      parentName: parent?.name ?? "Unknown parent",
      parentEmail: parent?.email ?? null,
      teacherName:
        teacherNameById.get(row.teacher_id) ??
        userById.get(row.teacher_id)?.name ??
        "Unknown teacher",
      teacherId: row.teacher_id,
    };
  });

  return { bookings, countsByTeacherId };
}
