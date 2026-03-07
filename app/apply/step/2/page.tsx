import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import Step2Form from "./Step2Form";

export default async function ApplicationStep2() {
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

  return <Step2Form initialData={initialData} />;
}
