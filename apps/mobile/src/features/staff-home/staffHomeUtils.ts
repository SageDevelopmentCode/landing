// Pure helpers + small fetchers for the staff Home. Moved out of
// app/(staff)/home.tsx unchanged so the data hook and Garden UI can share them.
import {
  type AttendanceSlim,
  type SchoolYearTodayStudent,
} from "@/lib/school-year-today-students";
import {
  buildDisplayNameMap,
  getStudentDisplayName,
} from "@/lib/student-display-name";
import { UNASSIGNED_TEACHER } from "@/lib/group-by-teacher";
import { supabase } from "@/lib/supabase";

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatTodayDate(dateStr: string): string {
  return parseYMD(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

export function shiftDay(dateStr: string, delta: 1 | -1): string {
  const dt = parseYMD(dateStr);
  dt.setDate(dt.getDate() + delta);
  return toYMD(dt);
}

// ─── Names ────────────────────────────────────────────────────────────────────

export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function shortName(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function roleLabel(role: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "teacher") return "Teacher";
  return role;
}

// ─── Attendance status ────────────────────────────────────────────────────────

export type StudentDayStatus = "unmarked" | "present" | "picked_up" | "absent";
export type StudentStatusFilter = StudentDayStatus | "all";

export function getStudentDayStatus(
  student: SchoolYearTodayStudent,
  isFriday: boolean,
): StudentDayStatus {
  const record = isFriday
    ? student.schoolYearFieldFridayRecord
    : student.schoolYearRecord;
  if (!record) return "unmarked";
  if (record.marked_absent) return "absent";
  if (!record.checked_in) return "unmarked";
  if (record.picked_up_by_name) return "picked_up";
  return "present";
}

export function isStudentCheckedIn(record: AttendanceSlim | null): boolean {
  return !!record?.checked_in && !record.marked_absent;
}

export type TeacherRosterSummaryBucket = "present" | "unmarked" | "absent";

export type TeacherRosterSummary = Record<TeacherRosterSummaryBucket, number>;

export function summarizeTeacherRosterStatus(
  status: StudentDayStatus,
): TeacherRosterSummaryBucket {
  if (status === "picked_up" || status === "present") return "present";
  if (status === "absent") return "absent";
  return "unmarked";
}

export function emptyTeacherRosterSummary(): TeacherRosterSummary {
  return { present: 0, unmarked: 0, absent: 0 };
}

export function buildTeacherRosterSummaries(
  students: SchoolYearTodayStudent[],
  isFriday: boolean,
): Map<string, TeacherRosterSummary> {
  const map = new Map<string, TeacherRosterSummary>();
  for (const student of students) {
    const key = student.teacherName ?? UNASSIGNED_TEACHER;
    let summary = map.get(key);
    if (!summary) {
      summary = emptyTeacherRosterSummary();
      map.set(key, summary);
    }
    const bucket = summarizeTeacherRosterStatus(
      getStudentDayStatus(student, isFriday),
    );
    summary[bucket]++;
  }
  return map;
}

export const STATUS_FILTER_CHIPS: {
  key: StudentStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "unmarked", label: "Unmarked" },
  { key: "present", label: "Present" },
  { key: "picked_up", label: "Picked Up" },
  { key: "absent", label: "Absent" },
];

export const SY_ATTENDANCE_SLIM_SELECT =
  "id, paid_for_day, pickup_time, picked_up_by_name, marked_absent, excluded_from_roster, checked_in";
export const AFTERCARE_SLIM_SELECT =
  "id, paid_for_day, pickup_time, picked_up_by_name";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PickupPerson = { name: string; relationship: string };

export type AllergyDetail = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
  allergies_description: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_emergency_medications: string | null;
  emergency_medications_description: string | null;
};

// ─── Calendar events (moved from StaffUpcomingEventsSection) ─────────────────

export type StaffUpcomingCalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
};

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatEventTime(evt: StaffUpcomingCalendarEvent): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time)
    return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "All day";
}

export function formatFullDate(dateStr: string): string {
  return parseYMD(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Add-student sheet fetch ──────────────────────────────────────────────────

export async function fetchUnpaidStudentsForDate(
  date: string,
  excludeIds: Set<string>,
): Promise<SchoolYearTodayStudent[]> {
  void date;
  const [studentsRes, appsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select(
        "student_id, admin_tags, has_allergies, program, drop_in_program, preferred_name, child_legal_name",
      )
      .eq("status", "enrolled"),
  ]);
  if (studentsRes.error) throw studentsRes.error;
  if (appsRes.error) throw appsRes.error;

  type AppRow = {
    student_id: string;
    admin_tags: string[] | null;
    has_allergies: string | null;
    program: string | null;
    drop_in_program: string | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  };

  const appsData = (appsRes.data ?? []) as AppRow[];
  const displayNameMap = buildDisplayNameMap(appsData);
  const isSchoolYearApp = (a: AppRow) =>
    a.program === "school_year_26_27" ||
    a.program === "both" ||
    (a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"));

  const enrolledIds = new Set(
    appsData
      .filter(
        (a) =>
          isSchoolYearApp(a) &&
          !(a.admin_tags ?? []).includes("Don't Include"),
      )
      .map((a) => a.student_id),
  );
  const allergyMap = new Map(
    appsData.map((a) => [a.student_id, a.has_allergies]),
  );
  const programMap = new Map(appsData.map((a) => [a.student_id, a.program]));

  type StudentRaw = {
    id: string;
    child_legal_name: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRaw[]).filter(
    (s) => enrolledIds.has(s.id) && !excludeIds.has(s.id),
  );

  return students.map((s) => ({
    student_id: s.id,
    name:
      displayNameMap.get(s.id) ??
      getStudentDisplayName(null, s.child_legal_name),
    profile_image_url: s.profile_image_url,
    has_allergies: allergyMap.get(s.id) ?? null,
    program: programMap.get(s.id) ?? null,
    hasSummerEnrollment: false,
    hasAftercareEnrollment: false,
    hasFridayEnrollment: false,
    hasSchoolYearEnrollment: false,
    hasSchoolYearFridayEnrollment: false,
    summerRecord: null,
    aftercareRecord: null,
    fieldFridayRecord: null,
    schoolYearRecord: null,
    schoolYearFieldFridayRecord: null,
    teacherName: null,
    teacherId: null,
    classroom: null,
  }));
}
