import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import Step3Form from "./Step3Form";

export default async function ApplicationStep3() {
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

  return <Step3Form initialData={initialData} />;
}
