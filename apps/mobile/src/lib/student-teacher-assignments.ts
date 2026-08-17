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

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

type AssignmentRow = {
  teacher_id: string;
  student_id: string;
  program: string | null;
};

function pickTeacherName(
  assignments: { program: string | null; teacherName: string }[],
): string | null {
  if (assignments.length === 0) return null;

  const schoolYear = assignments.find((a) => a.program === SCHOOL_YEAR_PROGRAM);
  if (schoolYear) return schoolYear.teacherName;

  const sorted = [...assignments].sort((a, b) =>
    a.teacherName.localeCompare(b.teacherName),
  );
  return sorted[0]?.teacherName ?? null;
}

export async function fetchTeacherNamesByStudentId(
  studentIds: string[],
): Promise<Record<string, string>> {
  if (studentIds.length === 0) return {};

  const { data: assignmentRows } = await supabase
    .schema("teachers")
    .from("teacher_students")
    .select("teacher_id, student_id, program")
    .in("student_id", studentIds)
    .eq("is_deleted", false);

  if (!assignmentRows?.length) return {};

  const teacherIds = [...new Set(assignmentRows.map((r) => r.teacher_id))];
  const { data: teacherUsers } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name")
    .in("id", teacherIds);

  const nameById: Record<string, string> = {};
  for (const u of teacherUsers ?? []) {
    if (u.full_name) nameById[u.id] = u.full_name;
  }

  const byStudent: Record<string, { program: string | null; teacherName: string }[]> =
    {};
  for (const row of assignmentRows as AssignmentRow[]) {
    const teacherName = nameById[row.teacher_id];
    if (!teacherName) continue;
    if (!byStudent[row.student_id]) byStudent[row.student_id] = [];
    byStudent[row.student_id].push({ program: row.program, teacherName });
  }

  const result: Record<string, string> = {};
  for (const studentId of studentIds) {
    const name = pickTeacherName(byStudent[studentId] ?? []);
    if (name) result[studentId] = abbreviateName(name);
  }
  return result;
}
