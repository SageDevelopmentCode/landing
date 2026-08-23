import { fetchDontIncludeStudentIds } from "@/lib/application-tags";
import type { ParticipationLevel } from "@/lib/participation-level-labels";
import { fetchSchoolYearTodayStudents } from "@/lib/school-year-today-students";
import { supabase } from "@/lib/supabase";
import type {
  EmergencySnackPreference,
  SharedFoodPreference,
} from "@/components/SchoolDayFoodPreferencesSheet";

export type StaffSchoolDayFoodPref = {
  studentId: string;
  name: string;
  photo: string | null;
  emergencySnack: EmergencySnackPreference;
  sharedFood: SharedFoodPreference;
  updatedAt: string;
};

export type StaffActivityPrefStudent = {
  studentId: string;
  name: string;
  photo: string | null;
  level: ParticipationLevel;
  notes: string;
  isDefault: boolean;
};

export type StaffActivityPrefUnsignedStudent = {
  studentId: string;
  name: string;
  photo: string | null;
};

export type StaffActivityPrefGroup = {
  activityId: string;
  students: StaffActivityPrefStudent[];
  unsignedStudents: StaffActivityPrefUnsignedStudent[];
  signedUpCount: number;
  totalCount: number;
};

export type WeekActivityInput = {
  id: string;
  activity_date: string | null;
};

export async function fetchStaffSchoolDayFoodPrefs(): Promise<
  StaffSchoolDayFoodPref[]
> {
  const excludedIds = await fetchDontIncludeStudentIds();

  const { data: prefData, error: prefErr } = await supabase
    .schema("parent_app")
    .from("student_school_day_food_preferences")
    .select(
      "student_id, emergency_snack_preference, shared_food_preference, updated_at",
    );

  if (prefErr) throw prefErr;
  if (!prefData?.length) return [];

  const studentIds = [
    ...new Set(
      prefData
        .map((row) => row.student_id as string)
        .filter((id) => !excludedIds.has(id)),
    ),
  ];
  if (studentIds.length === 0) return [];

  const { data: studentData, error: studentErr } = await supabase
    .schema("admin")
    .from("students")
    .select("id, child_legal_name, profile_image_url")
    .in("id", studentIds)
    .eq("is_deleted", false);

  if (studentErr) throw studentErr;

  const studentMap = new Map(
    (studentData ?? []).map((s) => [
      s.id as string,
      {
        name: s.child_legal_name as string,
        photo: (s.profile_image_url as string | null) ?? null,
      },
    ]),
  );

  const rows: StaffSchoolDayFoodPref[] = [];
  for (const row of prefData) {
    const studentId = row.student_id as string;
    if (excludedIds.has(studentId)) continue;
    const student = studentMap.get(studentId);
    if (!student) continue;
    rows.push({
      studentId,
      name: student.name,
      photo: student.photo,
      emergencySnack: row.emergency_snack_preference as EmergencySnackPreference,
      sharedFood: row.shared_food_preference as SharedFoodPreference,
      updatedAt: row.updated_at as string,
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

export async function fetchStaffWeekActivityPrefs(
  activities: WeekActivityInput[],
): Promise<StaffActivityPrefGroup[]> {
  if (activities.length === 0) return [];

  const excludedIds = await fetchDontIncludeStudentIds();
  const activityIds = activities.map((a) => a.id);

  const { data: prefData, error: prefErr } = await supabase
    .schema("parent_app")
    .from("activity_preferences")
    .select("student_id, activity_id, participation_level, notes")
    .in("activity_id", activityIds);

  if (prefErr) throw prefErr;

  const filteredPrefs = (prefData ?? []).filter(
    (row) => !excludedIds.has(row.student_id as string),
  );

  const explicitByActivity = new Map<
    string,
    Map<
      string,
      { participation_level: ParticipationLevel; notes: string }
    >
  >();
  for (const row of filteredPrefs) {
    const activityId = row.activity_id as string;
    if (!explicitByActivity.has(activityId)) {
      explicitByActivity.set(activityId, new Map());
    }
    explicitByActivity.get(activityId)!.set(row.student_id as string, {
      participation_level: row.participation_level as ParticipationLevel,
      notes: (row.notes as string) ?? "",
    });
  }

  const attendingByDate = new Map<
    string,
    Awaited<ReturnType<typeof fetchSchoolYearTodayStudents>>
  >();
  const uniqueDates = [
    ...new Set(
      activities
        .map((a) => a.activity_date)
        .filter((d): d is string => d != null),
    ),
  ];

  await Promise.all(
    uniqueDates.map(async (date) => {
      const rows = await fetchSchoolYearTodayStudents(date);
      attendingByDate.set(
        date,
        rows.filter((s) => !excludedIds.has(s.student_id)),
      );
    }),
  );

  const allAttendingIds = new Set<string>();
  for (const rows of attendingByDate.values()) {
    for (const s of rows) allAttendingIds.add(s.student_id);
  }

  const defaultMap = new Map<string, ParticipationLevel>();
  if (allAttendingIds.size > 0) {
    const { data: defaultData, error: defaultErr } = await supabase
      .schema("parent_app")
      .from("student_default_preferences")
      .select("student_id, participation_level")
      .in("student_id", [...allAttendingIds]);

    if (defaultErr) throw defaultErr;

    for (const row of defaultData ?? []) {
      const studentId = row.student_id as string;
      if (excludedIds.has(studentId)) continue;
      defaultMap.set(studentId, row.participation_level as ParticipationLevel);
    }
  }

  return activities.map((activity) => {
    const emptyGroup: StaffActivityPrefGroup = {
      activityId: activity.id,
      students: [],
      unsignedStudents: [],
      signedUpCount: 0,
      totalCount: 0,
    };

    if (!activity.activity_date) return emptyGroup;

    const attending = attendingByDate.get(activity.activity_date) ?? [];
    if (attending.length === 0) return emptyGroup;

    const explicitForActivity =
      explicitByActivity.get(activity.id) ?? new Map();

    const students: StaffActivityPrefStudent[] = [];
    const unsignedStudents: StaffActivityPrefUnsignedStudent[] = [];

    for (const attendee of attending) {
      const explicit = explicitForActivity.get(attendee.student_id);
      if (explicit) {
        students.push({
          studentId: attendee.student_id,
          name: attendee.name ?? "Unknown",
          photo: attendee.profile_image_url,
          level: explicit.participation_level,
          notes: explicit.notes,
          isDefault: false,
        });
        continue;
      }

      const defaultLevel = defaultMap.get(attendee.student_id);
      if (defaultLevel) {
        students.push({
          studentId: attendee.student_id,
          name: attendee.name ?? "Unknown",
          photo: attendee.profile_image_url,
          level: defaultLevel,
          notes: "",
          isDefault: true,
        });
        continue;
      }

      unsignedStudents.push({
        studentId: attendee.student_id,
        name: attendee.name ?? "Unknown",
        photo: attendee.profile_image_url,
      });
    }

    students.sort((a, b) => a.name.localeCompare(b.name));
    unsignedStudents.sort((a, b) => a.name.localeCompare(b.name));

    return {
      activityId: activity.id,
      students,
      unsignedStudents,
      signedUpCount: students.length,
      totalCount: attending.length,
    };
  });
}
