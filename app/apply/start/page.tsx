import { redirect } from "next/navigation";
import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import StartPageClient from "./StartPageClient";

export default async function StartPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const adminClient = createAdminClient();
    const { data: enrolledApp } = await adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "enrolled")
      .limit(1);
    if ((enrolledApp ?? []).length > 0) {
      redirect("/parent/home");
    }
    redirect("/apply/dashboard");
  }
  return <StartPageClient />;
}
