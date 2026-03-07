import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import Step3Form from "./Step3Form";

export default async function ApplicationStep3({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>;
}) {
  const params = await searchParams;
  const appId = params.appId;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData = null;

  if (user) {
    const adminClient = createAdminClient();
    if (appId) {
      const { data } = await adminClient
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("id", appId)
        .eq("user_id", user.id)
        .single();
      initialData = data;
    } else {
      const { data } = await adminClient
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      initialData = data;
    }
  }

  return <Step3Form initialData={initialData} applicationId={appId ?? initialData?.id ?? null} />;
}
