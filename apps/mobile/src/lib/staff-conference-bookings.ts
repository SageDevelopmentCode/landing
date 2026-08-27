import { getChicagoDateTimeParts } from "@/lib/pickup-reminder";
import { supabase } from "@/lib/supabase";
import { getStudentDisplayName } from "@/lib/student-display-name";
import {
  CONFERENCE_TEACHER_IDS,
  CONFERENCE_TEACHERS,
  formatConferenceDateForDisplay,
} from "@/lib/parent-teacher-conference";

export { formatConferenceDateForDisplay };

export const CONFERENCE_SEASON = "school_year_26_27";
export const UPCOMING_CONFERENCE_DAYS = 3;

export type StaffConferenceBooking = {
  id: string;
  teacherId: string;
  teacherName: string;
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

export type ConferenceTeacherFilter = "all" | "mine" | string;

export type ConferenceCountdownUrgency =
  | "past"
  | "imminent"
  | "today"
  | "soon"
  | "later";

export type ConferenceCountdown = {
  label: string;
  urgency: ConferenceCountdownUrgency;
};

export const CONFERENCE_COUNTDOWN_STYLES: Record<
  ConferenceCountdownUrgency,
  { backgroundColor: string; color: string }
> = {
  past: { backgroundColor: "#f3f4f6", color: "#9ca3af" },
  imminent: { backgroundColor: "#fef2f2", color: "#dc2626" },
  today: { backgroundColor: "#fffbeb", color: "#b45309" },
  soon: { backgroundColor: "#fefce8", color: "#ca8a04" },
  later: { backgroundColor: "#f0fdf4", color: "#15803d" },
};

const teacherNameById = new Map(
  CONFERENCE_TEACHERS.map((t) => [t.id, t.name]),
);

function getTeacherName(teacherId: string): string {
  return teacherNameById.get(teacherId) ?? "Teacher";
}

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

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/** Parse conference slot start time (Chicago afternoon slots). */
export function parseConferenceSlotStart(timeSlot: string): {
  hour: number;
  minute: number;
} {
  const startPart = timeSlot.split(/[–-]/)[0]?.trim() ?? timeSlot;
  const match = startPart.match(/(\d{1,2}):(\d{2})/);
  if (!match) return { hour: 15, minute: 0 };

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const isPm = /pm/i.test(timeSlot);
  if (isPm && hour < 12) hour += 12;
  return { hour, minute };
}

export function getConferenceMinutesUntil(
  conferenceDate: string,
  timeSlot: string,
  now = new Date(),
): number {
  const chicago = getChicagoDateTimeParts(now);
  const dayDiff = daysUntilConference(conferenceDate, chicago.ymd);
  const slot = parseConferenceSlotStart(timeSlot);
  const nowMins = minutesSinceMidnight(chicago.hour, chicago.minute);
  const slotMins = minutesSinceMidnight(slot.hour, slot.minute);
  return dayDiff * 24 * 60 + (slotMins - nowMins);
}

export function getConferenceCountdown(
  conferenceDate: string,
  timeSlot: string,
  now = new Date(),
): ConferenceCountdown {
  const minutesUntil = getConferenceMinutesUntil(conferenceDate, timeSlot, now);

  if (minutesUntil < 0) {
    return { label: "Past", urgency: "past" };
  }
  if (minutesUntil < 1) {
    return { label: "Now", urgency: "imminent" };
  }
  if (minutesUntil < 60) {
    return {
      label: `in ${minutesUntil} min`,
      urgency: "imminent",
    };
  }
  if (minutesUntil < 24 * 60) {
    const hours = Math.floor(minutesUntil / 60);
    return {
      label: hours === 1 ? "in 1 hour" : `in ${hours} hours`,
      urgency: "today",
    };
  }
  const days = Math.floor(minutesUntil / (24 * 60));
  const label = days === 1 ? "in 1 day" : `in ${days} days`;
  if (days < UPCOMING_CONFERENCE_DAYS) {
    return { label, urgency: "soon" };
  }
  return { label, urgency: "later" };
}

export function isConferencePast(
  booking: Pick<StaffConferenceBooking, "conferenceDate" | "timeSlot">,
  now = new Date(),
): boolean {
  return getConferenceMinutesUntil(booking.conferenceDate, booking.timeSlot, now) < 0;
}

export function filterActiveConferenceBookings(
  bookings: StaffConferenceBooking[],
  now = new Date(),
): StaffConferenceBooking[] {
  return bookings.filter((b) => !isConferencePast(b, now));
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

export function filterBookingsByTeacher(
  bookings: StaffConferenceBooking[],
  filter: ConferenceTeacherFilter,
  currentTeacherId: string,
): StaffConferenceBooking[] {
  if (filter === "all") return bookings;
  if (filter === "mine") {
    return bookings.filter((b) => b.teacherId === currentTeacherId);
  }
  return bookings.filter((b) => b.teacherId === filter);
}

export function getAlertBooking(
  bookings: StaffConferenceBooking[],
  todayYmd: string,
  currentTeacherId: string,
): StaffConferenceBooking | null {
  const upcoming = getUpcomingBookings(bookings, todayYmd);
  const ownUpcoming = upcoming.find((b) => b.teacherId === currentTeacherId);
  return ownUpcoming ?? upcoming[0] ?? null;
}

type BookingRow = {
  id: string;
  parent_id: string;
  student_id: string;
  teacher_id: string;
  conference_date: string;
  time_slot: string;
  format: string;
  accommodation_note: string | null;
  week_start: string;
};

async function hydrateBookingRows(
  bookingRows: BookingRow[],
): Promise<StaffConferenceBooking[]> {
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
      teacherId: row.teacher_id,
      teacherName: getTeacherName(row.teacher_id),
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

export async function fetchAllStaffConferenceBookings(): Promise<
  StaffConferenceBooking[]
> {
  const { data: rows, error } = await supabase
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select(
      "id, parent_id, student_id, teacher_id, conference_date, time_slot, format, accommodation_note, week_start",
    )
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed")
    .order("conference_date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (error) throw error;
  return hydrateBookingRows((rows ?? []) as BookingRow[]);
}

export async function fetchStaffConferenceBookings(
  teacherId: string,
): Promise<StaffConferenceBooking[]> {
  const { data: rows, error } = await supabase
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select(
      "id, parent_id, student_id, teacher_id, conference_date, time_slot, format, accommodation_note, week_start",
    )
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed")
    .eq("teacher_id", teacherId)
    .order("conference_date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (error) throw error;
  return hydrateBookingRows((rows ?? []) as BookingRow[]);
}
