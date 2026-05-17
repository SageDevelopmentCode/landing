import { createAdminClient } from "@/app/lib/supabase-server";
import ImpersonateShell from "./ImpersonateShell";

export default async function ImpersonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminClient = createAdminClient();

  const [{ data: parents }, { data: appRows }, { data: authData }, { data: txData }] =
    await Promise.all([
      adminClient
        .schema("admin")
        .from("users")
        .select("id, full_name, email")
        .eq("role", "parent")
        .eq("is_deleted", false)
        .order("full_name"),
      adminClient
        .schema("parent_app")
        .from("applications")
        .select("user_id, status, approved, denied"),
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient
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
    ]);

  // Derive a single display status per parent from their applications
  const statusByParent: Record<string, string> = {};
  for (const row of appRows ?? []) {
    const uid = row.user_id as string;
    const current = statusByParent[uid];
    // Priority: enrolled > enrolling > in_review > in_progress > denied
    let next: string;
    if (row.approved && row.status === "enrolled") next = "enrolled";
    else if (row.approved) next = "enrolling";
    else if (row.denied) next = "denied";
    else if (row.status === "in_review") next = "in_review";
    else next = "in_progress";

    const priority: Record<string, number> = {
      enrolled: 5,
      enrolling: 4,
      in_review: 3,
      in_progress: 2,
      denied: 1,
    };
    if (!current || (priority[next] ?? 0) > (priority[current] ?? 0)) {
      statusByParent[uid] = next;
    }
  }

  const lastSignInMap: Record<string, string | null> = {};
  for (const u of authData?.users ?? []) {
    lastSignInMap[u.id] = u.updated_at ?? null;
  }

  const paidParentIds = new Set(
    (txData ?? [])
      .map((r: { parent_id: string | null }) => r.parent_id)
      .filter(Boolean) as string[]
  );

  const parentsWithStatus = (parents ?? []).map((p) => ({
    ...p,
    status: statusByParent[p.id] ?? null,
    lastSignIn: lastSignInMap[p.id] ?? null,
    hasPaid: paidParentIds.has(p.id),
  }));

  return (
    <ImpersonateShell parents={parentsWithStatus}>{children}</ImpersonateShell>
  );
}
