import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import Step5Form from "./Step5Form";

export default async function ApplicationStep5() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData = null;
  if (user) {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .schema("parent_app")
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    initialData = data;
  }

  return <Step5Form initialData={initialData} />;
}
