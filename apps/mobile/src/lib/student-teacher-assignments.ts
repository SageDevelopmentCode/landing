import { supabase } from "@/lib/supabase";

export const SCHOOL_YEAR_PROGRAM = "school_year_26_27";
const HOMESCHOOL_DROP_IN_PROGRAM = "homeschool_drop_in";

function isSchoolYearDropInBilling(
  dropInProgram: string | null | undefined,
): boolean {
  return dropInProgram === SCHOOL_YEAR_PROGRAM || dropInProgram === "both";
}

export function isSchoolYearTeacherAssignment(
  program: string,
  dropInProgram: string | null | undefined,
): boolean {
  if (program === SCHOOL_YEAR_PROGRAM) return true;
  if (program === HOMESCHOOL_DROP_IN_PROGRAM) {
    return isSchoolYearDropInBilling(dropInProgram);
  }
  return false;
}

export function isHomeschoolDropInTeacherAssignment(
  program: string,
  dropInProgram: string | null | undefined,
): boolean {
  if (program !== HOMESCHOOL_DROP_IN_PROGRAM) return false;
  return isSchoolYearDropInBilling(dropInProgram);
}

export function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

type AssignmentRow = {
  teacher_id: string;
  student_id: string;
  program: string | null;
};

type SchoolYearAssignment = {
  program: string | null;
  teacherId: string;
  teacherName: string;
};

export type SchoolYearTeacher = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

export type SchoolYearTeachersResult = {
  teacherNameByStudentId: Record<string, string>;
  schoolYearTeachers: SchoolYearTeacher[];
};

function pickSchoolYearTeacher(
  assignments: SchoolYearAssignment[],
): SchoolYearAssignment | null {
  if (assignments.length === 0) return null;
  return (
    assignments.find((a) => a.program === SCHOOL_YEAR_PROGRAM) ?? assignments[0]
  );
}

export async function fetchSchoolYearTeachersForStudents(
  studentIds: string[],
  dropInProgramByStudent: Record<string, string | null> = {},
): Promise<SchoolYearTeachersResult> {
  if (studentIds.length === 0) {
    return { teacherNameByStudentId: {}, schoolYearTeachers: [] };
  }

  const { data: assignmentRows } = await supabase
    .schema("teachers")
    .from("teacher_students")
    .select("teacher_id, student_id, program")
    .in("student_id", studentIds)
    .eq("is_deleted", false);

  if (!assignmentRows?.length) {
    return { teacherNameByStudentId: {}, schoolYearTeachers: [] };
  }

  const schoolYearRows = (assignmentRows as AssignmentRow[]).filter((row) =>
    isSchoolYearTeacherAssignment(
      row.program ?? "",
      dropInProgramByStudent[row.student_id],
    ),
  );

  if (schoolYearRows.length === 0) {
    return { teacherNameByStudentId: {}, schoolYearTeachers: [] };
  }

  const teacherIds = [...new Set(schoolYearRows.map((r) => r.teacher_id))];
  const { data: teacherUsers } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", teacherIds);

  const userById: Record<
    string,
    { full_name: string; profile_image_url: string | null }
  > = {};
  for (const u of teacherUsers ?? []) {
    if (u.full_name) {
      userById[u.id] = {
        full_name: u.full_name,
        profile_image_url: u.profile_image_url ?? null,
      };
    }
  }

  const byStudent: Record<string, SchoolYearAssignment[]> = {};
  for (const row of schoolYearRows) {
    const teacher = userById[row.teacher_id];
    if (!teacher) continue;
    if (!byStudent[row.student_id]) byStudent[row.student_id] = [];
    byStudent[row.student_id].push({
      program: row.program,
      teacherId: row.teacher_id,
      teacherName: teacher.full_name,
    });
  }

  const teacherNameByStudentId: Record<string, string> = {};
  const teacherById = new Map<string, SchoolYearTeacher>();

  for (const studentId of studentIds) {
    const picked = pickSchoolYearTeacher(byStudent[studentId] ?? []);
    if (!picked) continue;

    teacherNameByStudentId[studentId] = abbreviateName(picked.teacherName);

    const user = userById[picked.teacherId];
    if (user) {
      teacherById.set(picked.teacherId, {
        id: picked.teacherId,
        full_name: user.full_name,
        profile_image_url: user.profile_image_url,
      });
    }
  }

  const schoolYearTeachers = [...teacherById.values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );

  return { teacherNameByStudentId, schoolYearTeachers };
}

export async function fetchTeacherNamesByStudentId(
  studentIds: string[],
  dropInProgramByStudent: Record<string, string | null> = {},
): Promise<Record<string, string>> {
  const { teacherNameByStudentId } = await fetchSchoolYearTeachersForStudents(
    studentIds,
    dropInProgramByStudent,
  );
  return teacherNameByStudentId;
}
