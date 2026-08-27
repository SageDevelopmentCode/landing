import { supabase } from "@/lib/supabase";
import { studentHasDontIncludeTag } from "@/lib/application-tags";
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

export type HouseholdComposeRow = {
  studentId: string;
  studentName: string;
  studentGrade: string | null;
  program: string | null;
  profileImageUrl: string | null;
  primaryParentId: string;
  primaryParentName: string;
  guardianNames: string[];
};

export type ComposeTarget =
  | { kind: "parent"; section: "mine" | "all"; parent: ParentWithChildren }
  | { kind: "household"; household: HouseholdComposeRow };

export function composeTargetKey(target: ComposeTarget): string {
  return target.kind === "household"
    ? `household:${target.household.studentId}`
    : `parent:${target.parent.id}`;
}

export function composeTargetLabel(target: ComposeTarget): string {
  return target.kind === "household"
    ? target.household.studentName
    : (target.parent.full_name ?? "Unknown");
}

function buildDontIncludeExclusions(
  apps: {
    student_id: string;
    user_id: string;
    admin_tags: string[] | null;
  }[],
  students: { id: string; parent_id: string | null }[],
) {
  const dontIncludeStudentIds = new Set<string>();
  const excludedParentIds = new Set<string>();

  for (const app of apps) {
    if (!studentHasDontIncludeTag(app.admin_tags)) continue;
    dontIncludeStudentIds.add(app.student_id);
    excludedParentIds.add(app.user_id);
  }

  for (const student of students) {
    if (dontIncludeStudentIds.has(student.id) && student.parent_id) {
      excludedParentIds.add(student.parent_id);
    }
  }

  return { dontIncludeStudentIds, excludedParentIds };
}

export async function getHouseholdsForCompose(): Promise<HouseholdComposeRow[]> {
  const { data: grants } = await supabase
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id, grantee_id")
    .eq("status", "active")
    .not("grantee_id", "is", null);

  const ownerIds = [
    ...new Set((grants ?? []).map((g: { owner_id: string }) => g.owner_id)),
  ];
  if (ownerIds.length === 0) return [];

  const granteeIdsByOwner = new Map<string, string[]>();
  for (const grant of grants ?? []) {
    const g = grant as { owner_id: string; grantee_id: string };
    const list = granteeIdsByOwner.get(g.owner_id) ?? [];
    if (!list.includes(g.grantee_id)) list.push(g.grantee_id);
    granteeIdsByOwner.set(g.owner_id, list);
  }

  const { data: students } = await supabase
    .schema("admin")
    .from("students")
    .select("id, parent_id, child_legal_name, child_grade, profile_image_url")
    .eq("is_deleted", false)
    .in("parent_id", ownerIds);

  if (!students?.length) return [];

  const studentIds = students.map((s: { id: string }) => s.id);
  const { data: apps } = await supabase
    .schema("parent_app")
    .from("applications")
    .select("student_id, program, preferred_name, child_legal_name, status, admin_tags")
    .in("student_id", studentIds)
    .eq("status", "enrolled");

  const enrolledIds = new Set(
    (apps ?? []).map((a: { student_id: string }) => a.student_id),
  );
  if (enrolledIds.size === 0) return [];

  const dontIncludeStudentIds = new Set(
    (apps ?? [])
      .filter((a: { admin_tags: string[] | null }) =>
        studentHasDontIncludeTag(a.admin_tags),
      )
      .map((a: { student_id: string }) => a.student_id),
  );

  const programMap = new Map(
    (apps ?? []).map((a: { student_id: string; program: string }) => [
      a.student_id,
      a.program,
    ]),
  );
  const displayNameMap = new Map(
    (apps ?? []).map(
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

  const parentIds = [
    ...new Set(
      students
        .map((s: { parent_id: string | null }) => s.parent_id)
        .filter(Boolean) as string[],
    ),
  ];
  const allUserIds = [
    ...new Set([
      ...parentIds,
      ...(grants ?? [])
        .map((g: { grantee_id: string }) => g.grantee_id)
        .filter(Boolean),
    ]),
  ];

  const { data: users } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name")
    .in("id", allUserIds);

  const nameById = new Map(
    (users ?? []).map((u: { id: string; full_name: string | null }) => [
      u.id,
      u.full_name ?? "Unknown",
    ]),
  );

  const rows: HouseholdComposeRow[] = [];
  for (const student of students as {
    id: string;
    parent_id: string | null;
    child_legal_name: string;
    child_grade: string | null;
    profile_image_url: string | null;
  }[]) {
    if (!student.parent_id || !enrolledIds.has(student.id)) continue;
    if (dontIncludeStudentIds.has(student.id)) continue;
    if (!granteeIdsByOwner.has(student.parent_id)) continue;

    const primaryName = nameById.get(student.parent_id) ?? "Parent";
    const granteeNames = (granteeIdsByOwner.get(student.parent_id) ?? [])
      .map((id) => nameById.get(id))
      .filter((n): n is string => Boolean(n));

    const guardianNames = [primaryName];
    for (const name of granteeNames) {
      if (!guardianNames.includes(name)) guardianNames.push(name);
    }

    const rawProgram = programMap.get(student.id) ?? null;
    rows.push({
      studentId: student.id,
      studentName:
        displayNameMap.get(student.id) ??
        getStudentDisplayName(null, student.child_legal_name),
      studentGrade: student.child_grade,
      program: rawProgram
        ? (PROGRAM_LABELS[rawProgram as string] ?? (rawProgram as string))
        : null,
      profileImageUrl: student.profile_image_url,
      primaryParentId: student.parent_id,
      primaryParentName: primaryName,
      guardianNames,
    });
  }

  rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  return rows;
}

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
    .select("student_id, program, preferred_name, child_legal_name, admin_tags, user_id")
    .eq("status", "enrolled");

  const { dontIncludeStudentIds, excludedParentIds } = buildDontIncludeExclusions(
    (applications ?? []) as {
      student_id: string;
      user_id: string;
      admin_tags: string[] | null;
    }[],
    (students ?? []) as { id: string; parent_id: string | null }[],
  );

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
    if (excludedParentIds.has(s.parent_id)) continue;
    if (dontIncludeStudentIds.has(s.id)) continue;
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

  const allParentsArr = Array.from(parentMap.values()).filter(
    (p) => !excludedParentIds.has(p.id) && p.children.length > 0,
  );
  return {
    myStudentsParents: allParentsArr.filter((p) => myParentIds.has(p.id)),
    allParents: allParentsArr.filter((p) => !myParentIds.has(p.id)),
  };
}
