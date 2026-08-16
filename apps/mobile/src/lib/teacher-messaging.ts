import { supabase } from "@/lib/supabase";
import { getStudentDisplayName } from "@/lib/student-display-name";

export type ChildInfo = {
  id: string;
  child_legal_name: string;
  child_grade: string | null;
  profile_image_url: string | null;
  program: string | null;
};

export type ParentWithChildren = {
  id: string;
  full_name: string | null;
  profile_image_url: string | null;
  children: ChildInfo[];
};

export type ParentsForTeacher = {
  myStudentsParents: ParentWithChildren[];
  allParents: ParentWithChildren[];
};

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 26–27",
  both: "Summer + School Year",
  homeschool_drop_in: "Homeschool Drop-In",
  aftercare: "Aftercare",
  field_friday: "Field Friday",
};

export async function getParentsForTeacher(
  teacherId: string
): Promise<ParentsForTeacher> {
  const { data: assignments } = await supabase
    .schema("teachers")
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId)
    .eq("is_deleted", false);

  const myStudentIds = new Set(
    (assignments ?? []).map((a: { student_id: string }) => a.student_id)
  );

  const { data: students } = await supabase
    .schema("admin")
    .from("students")
    .select("id, parent_id, child_legal_name, child_grade, profile_image_url")
    .eq("is_deleted", false);

  const { data: applications } = await supabase
    .schema("parent_app")
    .from("applications")
    .select("student_id, program, preferred_name, child_legal_name")
    .eq("status", "enrolled");

  const programMap = new Map(
    (applications ?? []).map(
      (a: { student_id: string; program: string }) => [a.student_id, a.program]
    )
  );
  const displayNameMap = new Map(
    (applications ?? []).map(
      (a: {
        student_id: string;
        preferred_name: string | null;
        child_legal_name: string | null;
      }) => [
        a.student_id,
        getStudentDisplayName(a.preferred_name, a.child_legal_name),
      ],
    ),
  );

  const { data: parents } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .eq("role", "parent")
    .eq("is_deleted", false)
    .order("full_name", { ascending: true });

  const parentMap = new Map<string, ParentWithChildren>();
  for (const p of (parents ?? []) as {
    id: string;
    full_name: string | null;
    profile_image_url: string | null;
  }[]) {
    if (!p.full_name?.trim()) continue;
    parentMap.set(p.id, {
      id: p.id,
      full_name: p.full_name,
      profile_image_url: p.profile_image_url,
      children: [],
    });
  }

  const myParentIds = new Set<string>();

  for (const s of (students ?? []) as {
    id: string;
    parent_id: string | null;
    child_legal_name: string;
    child_grade: string | null;
    profile_image_url: string | null;
  }[]) {
    if (!s.parent_id || !parentMap.has(s.parent_id)) continue;
    const parent = parentMap.get(s.parent_id)!;
    const rawProgram = programMap.get(s.id) ?? null;
    parent.children.push({
      id: s.id,
      child_legal_name:
        displayNameMap.get(s.id) ??
        getStudentDisplayName(null, s.child_legal_name),
      child_grade: s.child_grade,
      profile_image_url: s.profile_image_url,
      program: rawProgram
        ? (PROGRAM_LABELS[rawProgram as string] ?? (rawProgram as string))
        : null,
    });
    if (myStudentIds.has(s.id)) {
      myParentIds.add(s.parent_id);
    }
  }

  const allParentsArr = Array.from(parentMap.values());
  return {
    myStudentsParents: allParentsArr.filter((p) => myParentIds.has(p.id)),
    allParents: allParentsArr.filter((p) => !myParentIds.has(p.id)),
  };
}
