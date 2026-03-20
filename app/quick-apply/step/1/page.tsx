import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import QuickStep1Form from "./QuickStep1Form";

export default async function QuickApplyStep1({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; appId?: string }>;
}) {
  const params = await searchParams;
  const isNew = params.new === "1";
  const appId = params.appId;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData = null;
  let applicationId: string | null = null;

  if (user && !isNew) {
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
      applicationId = data?.id ?? null;
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
      applicationId = data?.id ?? null;
    }
  }

  return <QuickStep1Form initialData={initialData} applicationId={applicationId} />;
}
