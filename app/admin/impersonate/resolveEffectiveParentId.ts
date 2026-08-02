import { createAdminClient } from "@/app/lib/supabase-server";
import { resolveActingParentId } from "@/app/lib/parent-access";

export async function resolveEffectiveParentId(parentId: string): Promise<{
  effectiveParentId: string;
  isSharedAccess: boolean;
  ownerName: string | null;
}> {
  const effectiveParentId = await resolveActingParentId(parentId);
  const isSharedAccess = effectiveParentId !== parentId;

  if (!isSharedAccess) {
    return { effectiveParentId, isSharedAccess: false, ownerName: null };
  }

  const adminClient = createAdminClient();
  const { data: ownerUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", effectiveParentId)
    .single();

  return {
    effectiveParentId,
    isSharedAccess: true,
    ownerName: ownerUser?.full_name ?? null,
  };
}
