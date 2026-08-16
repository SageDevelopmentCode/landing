import { supabase } from "@/lib/supabase";
import { getStudentDisplayName } from "@/lib/student-display-name";
import {
  CONFERENCE_TEACHER_IDS,
  formatConferenceDateForDisplay,
} from "@/lib/parent-teacher-conference";

export { formatConferenceDateForDisplay };

export const CONFERENCE_SEASON = "school_year_26_27";
export const UPCOMING_CONFERENCE_DAYS = 3;

export type StaffConferenceBooking = {
  id: string;
  conferenceDate: string;
  timeSlot: string;
  format: "in_person" | "virtual";
  accommodationNote: string | null;
  weekStart: string;
  studentId: string;
  studentName: string;
  studentGrade: string | null;
  studentProfileImageUrl: string | null;
  parentId: string;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string | null;
  g1Name: string | null;
  g1Relationship: string | null;
  g2Name: string | null;
  g2Relationship: string | null;
};

export function isConferenceTeacher(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return (CONFERENCE_TEACHER_IDS as readonly string[]).includes(userId);
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysUntilConference(
  conferenceDate: string,
  todayYmd: string,
): number {
  const start = parseYmd(todayYmd).getTime();
  const end = parseYmd(conferenceDate).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function formatConferenceFormatLabel(
  format: StaffConferenceBooking["format"],
): string {
  return format === "in_person" ? "In person" : "Virtual";
}

export function formatUpcomingRelativeDay(
  conferenceDate: string,
  todayYmd: string,
): string {
  const diff = daysUntilConference(conferenceDate, todayYmd);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  return formatConferenceDateForDisplay(conferenceDate);
}

export function getUpcomingBookings(
  bookings: StaffConferenceBooking[],
  todayYmd: string,
  withinDays = UPCOMING_CONFERENCE_DAYS,
): StaffConferenceBooking[] {
  const endYmd = addDaysYmd(todayYmd, withinDays);
  return bookings.filter(
    (b) =>
      b.conferenceDate >= todayYmd && b.conferenceDate <= endYmd,
  );
}

export function getNextUpcomingBooking(
  bookings: StaffConferenceBooking[],
  todayYmd: string,
): StaffConferenceBooking | null {
  return (
    bookings.find((b) => b.conferenceDate >= todayYmd) ?? null
  );
}

export async function fetchStaffConferenceBookings(
  teacherId: string,
): Promise<StaffConferenceBooking[]> {
  const { data: rows, error } = await supabase
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select(
      "id, parent_id, student_id, conference_date, time_slot, format, accommodation_note, week_start",
    )
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed")
    .eq("teacher_id", teacherId)
    .order("conference_date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (error) throw error;
  const bookingRows = rows ?? [];
  if (bookingRows.length === 0) return [];

  const studentIds = [...new Set(bookingRows.map((r) => r.student_id))];
  const parentIds = [...new Set(bookingRows.map((r) => r.parent_id))];

  const [studentsRes, appsRes, parentsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .in("id", studentIds),
    supabase
      .schema("parent_app")
      .from("applications")
      .select(
        "student_id, preferred_name, child_legal_name, g1_full_name, g1_relationship, g2_full_name, g2_relationship",
      )
      .in("student_id", studentIds)
      .eq("status", "enrolled"),
    supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, email, g1_cell_phone")
      .in("id", parentIds),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (appsRes.error) throw appsRes.error;
  if (parentsRes.error) throw parentsRes.error;

  const studentById = new Map(
    (studentsRes.data ?? []).map((s) => [s.id, s]),
  );
  const appByStudentId = new Map(
    (appsRes.data ?? []).map((a) => [a.student_id, a]),
  );
  const parentById = new Map(
    (parentsRes.data ?? []).map((p) => [p.id, p]),
  );

  return bookingRows.map((row) => {
    const student = studentById.get(row.student_id);
    const app = appByStudentId.get(row.student_id);
    const parent = parentById.get(row.parent_id);

    return {
      id: row.id,
      conferenceDate: row.conference_date,
      timeSlot: row.time_slot,
      format: row.format as "in_person" | "virtual",
      accommodationNote: row.accommodation_note ?? null,
      weekStart: row.week_start,
      studentId: row.student_id,
      studentName: getStudentDisplayName(
        app?.preferred_name ?? null,
        student?.child_legal_name ?? app?.child_legal_name ?? null,
      ),
      studentGrade: student?.child_grade ?? null,
      studentProfileImageUrl: student?.profile_image_url ?? null,
      parentId: row.parent_id,
      parentName: parent?.full_name?.trim() || "Parent",
      parentEmail: parent?.email ?? null,
      parentPhone: parent?.g1_cell_phone ?? null,
      g1Name: app?.g1_full_name ?? null,
      g1Relationship: app?.g1_relationship ?? null,
      g2Name: app?.g2_full_name ?? null,
      g2Relationship: app?.g2_relationship ?? null,
    };
  });
}
