import { supabase } from "@/lib/supabase";

export type ImpersonateStudent = {
  id: string;
  name: string;
  profileImageUrl: string | null;
  program: string | null;
};

export type ImpersonateParent = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  hasPaid: boolean;
  children: ImpersonateStudent[];
  isSharedAccess: boolean;
  ownerName: string | null;
};

const STATUS_PRIORITY: Record<string, number> = {
  enrolled: 5,
  enrolling: 4,
  in_review: 3,
  in_progress: 2,
  denied: 1,
};

function deriveStatus(
  apps: {
    approved: boolean | null;
    status: string | null;
    denied: boolean | null;
  }[],
): string | null {
  let best: string | null = null;
  let bestPri = 0;
  for (const row of apps) {
    let next: string;
    if (row.approved && row.status === "enrolled") next = "enrolled";
    else if (row.approved) next = "enrolling";
    else if (row.denied) next = "denied";
    else if (row.status === "in_review") next = "in_review";
    else next = "in_progress";

    const pri = STATUS_PRIORITY[next] ?? 0;
    if (pri > bestPri) {
      bestPri = pri;
      best = next;
    }
  }
  return best;
}

export function groupPriority(p: ImpersonateParent): number {
  if (p.hasPaid && p.status === "enrolled") return 0;
  if (p.status === "enrolled") return 1;
  if (p.status === "enrolling") return 2;
  if (p.status === "in_progress") return 3;
  return 4;
}

export async function fetchImpersonateParents(): Promise<ImpersonateParent[]> {
  const [
    { data: parents },
    { data: appRows },
    { data: txData },
    { data: grantRows },
  ] = await Promise.all([
    supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, email")
      .eq("role", "parent")
      .eq("is_deleted", false)
      .order("full_name"),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("user_id, status, approved, denied, student_id, program, drop_in_program"),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("parent_id")
      .eq("status", "completed")
      .eq("is_deleted", false)
      .in("payment_type", [
        "summer_tuition",
        "custom_tuition",
        "homeschool_dropin",
        "aftercare_tuition",
        "fun_friday_tuition",
      ]),
    supabase
      .schema("parent_app")
      .from("dashboard_access_grants")
      .select("grantee_id, owner_id")
      .eq("status", "active"),
  ]);

  const appsByParent: Record<
    string,
    { approved: boolean | null; status: string | null; denied: boolean | null }[]
  > = {};
  const programByStudent: Record<string, string> = {};

  for (const row of appRows ?? []) {
    const uid = row.user_id as string;
    if (!appsByParent[uid]) appsByParent[uid] = [];
    appsByParent[uid].push({
      approved: row.approved,
      status: row.status,
      denied: row.denied,
    });
    const prog = row.program ?? row.drop_in_program;
    if (row.student_id && prog && !programByStudent[row.student_id]) {
      programByStudent[row.student_id] = prog;
    }
  }

  const paidParentIds = new Set(
    (txData ?? [])
      .map((r: { parent_id: string | null }) => r.parent_id)
      .filter(Boolean) as string[],
  );

  const grantByGrantee: Record<string, string> = {};
  for (const g of grantRows ?? []) {
    if (g.grantee_id && g.owner_id) grantByGrantee[g.grantee_id] = g.owner_id;
  }

  const parentIds = (parents ?? []).map((p) => p.id);
  const { data: studentRows } =
    parentIds.length > 0
      ? await supabase
          .schema("admin")
          .from("students")
          .select("id, child_legal_name, profile_image_url, parent_id")
          .in("parent_id", parentIds)
          .eq("is_deleted", false)
          .order("child_legal_name")
      : { data: [] as { id: string; child_legal_name: string; profile_image_url: string | null; parent_id: string }[] };

  const childrenByParent: Record<string, ImpersonateStudent[]> = {};
  for (const s of studentRows ?? []) {
    if (!s.parent_id || !s.child_legal_name) continue;
    if (!childrenByParent[s.parent_id]) childrenByParent[s.parent_id] = [];
    childrenByParent[s.parent_id].push({
      id: s.id,
      name: s.child_legal_name,
      profileImageUrl: s.profile_image_url ?? null,
      program: programByStudent[s.id] ?? null,
    });
  }

  const parentNameById = new Map(
    (parents ?? []).map((p) => [p.id, p.full_name ?? null]),
  );

  return (parents ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    status: deriveStatus(appsByParent[p.id] ?? []),
    hasPaid: paidParentIds.has(p.id),
    children: childrenByParent[p.id] ?? [],
    isSharedAccess: p.id in grantByGrantee,
    ownerName:
      p.id in grantByGrantee
        ? (parentNameById.get(grantByGrantee[p.id]) ?? null)
        : null,
  }));
}

export function filterParents(
  parents: ImpersonateParent[],
  search: string,
): ImpersonateParent[] {
  const q = search.toLowerCase().trim();
  const filtered = q
    ? parents.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.children.some((c) => c.name.toLowerCase().includes(q)),
      )
    : parents;

  return [...filtered].sort((a, b) => {
    const diff = groupPriority(a) - groupPriority(b);
    if (diff !== 0) return diff;
    return (a.full_name ?? "").localeCompare(b.full_name ?? "");
  });
}
