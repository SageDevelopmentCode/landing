import { createAdminClient } from "@/app/lib/supabase-server";
import {
  CONFERENCE_TEACHER_IDS,
  mergeConferenceTeachersWithProfiles,
  type ConferenceTeacherDisplay,
} from "@/app/lib/parent-teacher-conference";

export type ConferenceStudentContext = {
  studentId: string;
  name: string;
  assignedTeacherId: string | null;
};

export type ConferenceAssignmentResult = {
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
};

function firstName(legalName: string): string {
  return legalName.trim().split(/\s+/)[0] ?? legalName;
}

function assignedTeacherForStudent(
  rows: { teacher_id: string; student_id: string; program: string }[],
  studentId: string,
  conferenceTeacherSet: Set<string>,
): string | null {
  const studentRows = rows.filter(
    (r) =>
      r.student_id === studentId && conferenceTeacherSet.has(r.teacher_id),
  );
  const schoolYear = studentRows.find((r) => r.program === "school_year_26_27");
  if (schoolYear) return schoolYear.teacher_id;
  return studentRows[0]?.teacher_id ?? null;
}

export async function getConferenceTeacherAssignments(
  students: Array<{ id: string; child_legal_name: string }>,
): Promise<ConferenceAssignmentResult> {
  const conferenceTeacherSet = new Set<string>(CONFERENCE_TEACHER_IDS);

  const profileMap: Record<string, string | null> = {};
  const adminClient = createAdminClient();

  const { data: teacherUsers } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, profile_image_url")
    .in("id", [...CONFERENCE_TEACHER_IDS]);

  for (const u of teacherUsers ?? []) {
    profileMap[u.id] = u.profile_image_url ?? null;
  }

  const conferenceTeachers = mergeConferenceTeachersWithProfiles(profileMap);

  if (students.length === 0) {
    return {
      conferenceTeachers,
      conferenceStudents: [],
    };
  }

  const studentIds = students.map((s) => s.id);

  const { data: rows } = await adminClient
    .schema("teachers")
    .from("teacher_students")
    .select("teacher_id, student_id, program")
    .in("student_id", studentIds)
    .in("teacher_id", [...CONFERENCE_TEACHER_IDS])
    .eq("is_deleted", false);

  const conferenceStudents: ConferenceStudentContext[] = students.map((s) => ({
    studentId: s.id,
    name: firstName(s.child_legal_name),
    assignedTeacherId: assignedTeacherForStudent(
      rows ?? [],
      s.id,
      conferenceTeacherSet,
    ),
  }));

  return {
    conferenceTeachers,
    conferenceStudents,
  };
}
