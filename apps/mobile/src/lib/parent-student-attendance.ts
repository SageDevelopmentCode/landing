// Keep in sync with shared/parent/student-attendance.ts (web uses repo-root shared/).

import { supabase } from "@/lib/supabase";

export type AttendanceProgram =
  | "summer"
  | "aftercare"
  | "field_friday"
  | "school_year"
  | "school_year_field_friday";

export type AttendanceFilter =
  | "all"
  | "school_year"
  | "summer"
  | "aftercare"
  | "field_friday";

export type AttendanceRecordRow = {
  id: string;
  date: string;
  recorded_by: string;
  notes: string | null;
  paid_for_day: boolean;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  picked_up_by_relationship: string | null;
  pickup_recorded_by: string | null;
  marked_absent?: boolean;
};

export type UnifiedAttendanceRecord = AttendanceRecordRow & {
  program: AttendanceProgram;
};

export type UserProfile = { full_name: string; profile_image_url: string | null };
export type UserMap = Record<string, UserProfile>;

export type AttendanceProgramConfig = {
  label: string;
  icon: string;
  color: string;
  bg: string;
};

export const ATTENDANCE_SELECT_COLS =
  "id, date, recorded_by, notes, paid_for_day, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by";

export const SCHOOL_YEAR_ATTENDANCE_SELECT_COLS = `${ATTENDANCE_SELECT_COLS}, marked_absent`;

export type AttendanceSource = {
  table: string;
  program: AttendanceProgram;
  selectCols: string;
};

export const ATTENDANCE_SOURCES: AttendanceSource[] = [
  { table: "summer_records", program: "summer", selectCols: ATTENDANCE_SELECT_COLS },
  { table: "aftercare_records", program: "aftercare", selectCols: ATTENDANCE_SELECT_COLS },
  { table: "field_friday_records", program: "field_friday", selectCols: ATTENDANCE_SELECT_COLS },
  { table: "school_year_records", program: "school_year", selectCols: SCHOOL_YEAR_ATTENDANCE_SELECT_COLS },
  {
    table: "school_year_field_friday_records",
    program: "school_year_field_friday",
    selectCols: SCHOOL_YEAR_ATTENDANCE_SELECT_COLS,
  },
];

export const PROGRAM_CONFIG: Record<AttendanceProgram, AttendanceProgramConfig> = {
  summer: { label: "Summer 2026", icon: "sunny-outline", color: "#d97706", bg: "#fef9ee" },
  aftercare: { label: "Aftercare", icon: "home-outline", color: "#7c3aed", bg: "#f5f3ff" },
  field_friday: { label: "Field Fun Fridays", icon: "leaf-outline", color: "#0891b2", bg: "#ecfeff" },
  school_year: { label: "School Year 26–27", icon: "school-outline", color: "#4a7c59", bg: "#eaf2ec" },
  school_year_field_friday: {
    label: "SY Field Fun Fridays",
    icon: "leaf-outline",
    color: "#0e7490",
    bg: "#e0f2fe",
  },
};

export const ATT_FILTER_TABS: { key: AttendanceFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "school_year", label: "School Year" },
  { key: "summer", label: "Summer" },
  { key: "aftercare", label: "Aftercare" },
  { key: "field_friday", label: "Fridays" },
];

export type AttendanceStatus = "absent" | "picked_up" | "attended";

export function mapRowsToUnified(
  rows: AttendanceRecordRow[],
  program: AttendanceProgram,
): UnifiedAttendanceRecord[] {
  return rows.map((row) => ({
    ...row,
    program,
    marked_absent: row.marked_absent ?? false,
  }));
}

export function mergeAttendanceRecords(
  chunks: UnifiedAttendanceRecord[][],
): UnifiedAttendanceRecord[] {
  return chunks.flat().sort((a, b) => b.date.localeCompare(a.date));
}

export function filterAttendanceRecords(
  records: UnifiedAttendanceRecord[],
  filter: AttendanceFilter,
): UnifiedAttendanceRecord[] {
  if (filter === "all") return records;
  if (filter === "school_year") {
    return records.filter(
      (r) => r.program === "school_year" || r.program === "school_year_field_friday",
    );
  }
  return records.filter((r) => r.program === filter);
}

export function getAttendanceStatus(record: UnifiedAttendanceRecord): AttendanceStatus {
  if (record.marked_absent) return "absent";
  if (record.picked_up_by_name || record.pickup_time) return "picked_up";
  return "attended";
}

export function collectStaffIds(records: UnifiedAttendanceRecord[]): string[] {
  return [
    ...new Set(
      records
        .flatMap((r) => [r.recorded_by, r.pickup_recorded_by])
        .filter(Boolean) as string[],
    ),
  ];
}

export async function fetchParentStudentAttendanceRecords(
  studentId: string,
): Promise<{ records: UnifiedAttendanceRecord[]; userMap: UserMap }> {
  const results = await Promise.all(
    ATTENDANCE_SOURCES.map(({ table, program, selectCols }) =>
      supabase
        .schema("attendance")
        .from(table)
        .select(selectCols)
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .then(({ data }) => mapRowsToUnified((data ?? []) as unknown as AttendanceRecordRow[], program)),
    ),
  );

  const merged = mergeAttendanceRecords(results);
  const staffIds = collectStaffIds(merged);

  const userMap: UserMap = {};
  if (staffIds.length > 0) {
    const { data: users } = await supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, profile_image_url")
      .in("id", staffIds);
    for (const u of users ?? []) {
      userMap[u.id] = { full_name: u.full_name, profile_image_url: u.profile_image_url };
    }
  }

  return { records: merged, userMap };
}
