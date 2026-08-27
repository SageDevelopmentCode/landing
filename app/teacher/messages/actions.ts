"use server";

import { createAdminClient } from "@/app/lib/supabase-server";
import { applicationHasDontIncludeTag } from "@/app/lib/application-tags";
import { getStudentDisplayName } from "@/app/lib/student-display-name";

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 26–27",
  both: "Summer + School Year",
  homeschool_drop_in: "Homeschool Drop-In",
  aftercare: "Aftercare",
  field_friday: "Field Friday",
};

export async function searchParents(query: string): Promise<{ id: string; full_name: string; profile_image_url: string | null }[]> {
  if (!query.trim()) return [];
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .ilike("full_name", `%${query}%`)
    .eq("role", "parent")
    .limit(10);

  if (error) return [];
  return (data ?? []).map((u) => ({ ...u, profile_image_url: u.profile_image_url ?? null }));
}

export type ParentWithChildren = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  children: {
    id: string;
    child_legal_name: string | null;
    child_grade: string | null;
    program: string | null;
    profile_image_url: string | null;
  }[];
};

export type ParentsForTeacher = {
  myStudentsParents: ParentWithChildren[];
  allParents: ParentWithChildren[];
};

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
    if (!applicationHasDontIncludeTag(app.admin_tags)) continue;
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

export async function getParentsForTeacher(teacherId: string): Promise<ParentsForTeacher> {
  const client = createAdminClient();

  // 1. Get teacher's assigned student IDs
  const { data: assignments } = await client
    .schema("teachers")
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId)
    .eq("is_deleted", false);

  const myStudentIds = new Set((assignments ?? []).map((a) => a.student_id as string));

  // 2. Get all active students with parent_id
  const { data: students } = await client
    .schema("admin")
    .from("students")
    .select("id, parent_id, child_legal_name, child_grade, profile_image_url")
    .eq("is_deleted", false);

  if (!students || students.length === 0) {
    return { myStudentsParents: [], allParents: [] };
  }

  // 3. Get enrolled application info
  const studentIds = students.map((s) => s.id);
  const { data: apps } = await client
    .schema("parent_app")
    .from("applications")
    .select("student_id, program, admin_tags, user_id")
    .in("student_id", studentIds)
    .eq("status", "enrolled");

  const { dontIncludeStudentIds, excludedParentIds } = buildDontIncludeExclusions(
    (apps ?? []) as {
      student_id: string;
      user_id: string;
      admin_tags: string[] | null;
    }[],
    students,
  );

  const programMap = Object.fromEntries(
    (apps ?? []).map((a) => [a.student_id as string, a.program as string | null])
  );

  // 4. Get all parent users
  const { data: parents } = await client
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .eq("role", "parent")
    .eq("is_deleted", false)
    .order("full_name", { ascending: true });

  if (!parents || parents.length === 0) {
    return { myStudentsParents: [], allParents: [] };
  }

  // Build parent map
  const parentMap = new Map<string, ParentWithChildren>();
  for (const p of parents) {
    parentMap.set(p.id, {
      id: p.id,
      full_name: p.full_name ?? "",
      profile_image_url: p.profile_image_url ?? null,
      children: [],
    });
  }

  // Attach children to parents; track which parents have teacher's students
  const myParentIds = new Set<string>();
  for (const s of students) {
    if (!s.parent_id) continue;
    if (excludedParentIds.has(s.parent_id)) continue;
    if (dontIncludeStudentIds.has(s.id)) continue;
    const parent = parentMap.get(s.parent_id);
    if (!parent) continue;
    parent.children.push({
      id: s.id,
      child_legal_name: s.child_legal_name ?? null,
      child_grade: s.child_grade ?? null,
      program: programMap[s.id] ?? null,
      profile_image_url: (s as { profile_image_url?: string | null }).profile_image_url ?? null,
    });
    if (myStudentIds.has(s.id)) {
      myParentIds.add(s.parent_id);
    }
  }

  const myStudentsParents: ParentWithChildren[] = [];
  const allParents: ParentWithChildren[] = [];

  for (const parent of parentMap.values()) {
    if (excludedParentIds.has(parent.id) || parent.children.length === 0) continue;
    if (myParentIds.has(parent.id)) {
      myStudentsParents.push(parent);
    } else {
      allParents.push(parent);
    }
  }

  // Already sorted by full_name from the DB query
  return { myStudentsParents, allParents };
}

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

export async function getHouseholdsForCompose(): Promise<HouseholdComposeRow[]> {
  const client = createAdminClient();

  const { data: grants } = await client
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id, grantee_id")
    .eq("status", "active")
    .not("grantee_id", "is", null);

  const ownerIds = [
    ...new Set((grants ?? []).map((g) => g.owner_id as string)),
  ];
  if (ownerIds.length === 0) return [];

  const granteeIdsByOwner = new Map<string, string[]>();
  for (const grant of grants ?? []) {
    if (!grant.grantee_id) continue;
    const list = granteeIdsByOwner.get(grant.owner_id) ?? [];
    if (!list.includes(grant.grantee_id)) list.push(grant.grantee_id);
    granteeIdsByOwner.set(grant.owner_id, list);
  }

  const { data: students } = await client
    .schema("admin")
    .from("students")
    .select("id, parent_id, child_legal_name, child_grade, profile_image_url")
    .eq("is_deleted", false)
    .in("parent_id", ownerIds);

  if (!students?.length) return [];

  const studentIds = students.map((s) => s.id);
  const { data: apps } = await client
    .schema("parent_app")
    .from("applications")
    .select("student_id, program, preferred_name, child_legal_name, status, admin_tags")
    .in("student_id", studentIds)
    .eq("status", "enrolled");

  const enrolledIds = new Set((apps ?? []).map((a) => a.student_id as string));
  if (enrolledIds.size === 0) return [];

  const dontIncludeStudentIds = new Set(
    (apps ?? [])
      .filter((a) => applicationHasDontIncludeTag(a.admin_tags as string[] | null))
      .map((a) => a.student_id as string),
  );

  const programMap = Object.fromEntries(
    (apps ?? []).map((a) => [a.student_id as string, a.program as string | null]),
  );
  const displayNameMap = Object.fromEntries(
    (apps ?? []).map((a) => [
      a.student_id as string,
      getStudentDisplayName(
        a.preferred_name as string | null,
        a.child_legal_name as string | null,
      ),
    ]),
  );

  const parentIds = [
    ...new Set(students.map((s) => s.parent_id).filter(Boolean) as string[]),
  ];
  const allUserIds = [
    ...new Set([
      ...parentIds,
      ...(grants ?? []).map((g) => g.grantee_id).filter(Boolean) as string[],
    ]),
  ];

  const { data: users } = await client
    .schema("admin")
    .from("users")
    .select("id, full_name")
    .in("id", allUserIds);

  const nameById = new Map(
    (users ?? []).map((u) => [u.id as string, u.full_name ?? "Unknown"]),
  );

  const rows: HouseholdComposeRow[] = [];
  for (const student of students) {
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

    const rawProgram = programMap[student.id] ?? null;
    rows.push({
      studentId: student.id,
      studentName:
        displayNameMap[student.id] ??
        getStudentDisplayName(null, student.child_legal_name),
      studentGrade: student.child_grade ?? null,
      program: rawProgram
        ? (PROGRAM_LABELS[rawProgram] ?? rawProgram)
        : null,
      profileImageUrl:
        (student as { profile_image_url?: string | null }).profile_image_url ??
        null,
      primaryParentId: student.parent_id,
      primaryParentName: primaryName,
      guardianNames,
    });
  }

  rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  return rows;
}
