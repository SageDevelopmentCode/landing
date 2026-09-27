import { createAdminClient } from "@/app/lib/supabase-server";

export async function isTeacherOrAdmin(userId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = data?.role;
  return role === "teacher" || role === "super_admin";
}
