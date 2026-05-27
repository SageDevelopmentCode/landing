import { createAdminClient } from "@/app/lib/supabase-server";

export async function resolveEffectiveParentId(parentId: string): Promise<{
  effectiveParentId: string;
  isSharedAccess: boolean;
  ownerName: string | null;
}> {
  const adminClient = createAdminClient();
  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", parentId)
    .eq("status", "active")
    .maybeSingle();

  if (!grant?.owner_id) {
    return { effectiveParentId: parentId, isSharedAccess: false, ownerName: null };
  }

  const { data: ownerUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", grant.owner_id)
    .single();

  return {
    effectiveParentId: grant.owner_id,
    isSharedAccess: true,
    ownerName: ownerUser?.full_name ?? null,
  };
}
