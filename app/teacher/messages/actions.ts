"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export async function searchParents(query: string): Promise<{ id: string; full_name: string }[]> {
  if (!query.trim()) return [];
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name")
    .ilike("full_name", `%${query}%`)
    .eq("role", "parent")
    .limit(10);

  if (error) return [];
  return data ?? [];
}
