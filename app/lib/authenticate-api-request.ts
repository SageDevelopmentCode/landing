import type { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/app/lib/supabase-server";

export async function authenticateApiRequest(
  request: NextRequest,
): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser();
  if (cookieUser) return cookieUser;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const adminClient = createAdminClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser(token);
  return user ?? null;
}

export async function canAccessParentDashboard(
  userId: string,
  parentId: string,
): Promise<boolean> {
  if (userId === parentId) return true;

  const adminClient = createAdminClient();
  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("id")
    .eq("grantee_id", userId)
    .eq("owner_id", parentId)
    .eq("status", "active")
    .maybeSingle();

  return !!grant;
}
