import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import QuickStep2Form from "./QuickStep2Form";

export default async function QuickApplyStep2({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>;
}) {
  const params = await searchParams;
  const appId = params.appId;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData = null;
  let guardianPrefill = null;
  let accountInfo = null;

  if (user) {
    const adminClient = createAdminClient();

    const { data: userRecord } = await adminClient
      .schema('admin')
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();
    accountInfo = userRecord;

    if (appId) {
      const { data } = await adminClient
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("id", appId)
        .eq("user_id", user.id)
        .single();
      initialData = data;

      const hasGuardianData = !!(data?.g1_full_name || data?.g1_email || data?.g1_cell_phone);
      if (!hasGuardianData) {
        const { data: prior } = await adminClient
          .schema("parent_app")
          .from("applications")
          .select(
            "g1_full_name,g1_relationship,g1_relationship_other,g1_email,g1_cell_phone,g1_preferred_contact,g1_lives_with_child,g1_has_custody,has_custody_orders,custody_orders_description"
          )
          .eq("user_id", user.id)
          .neq("id", appId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        guardianPrefill = prior;
      }
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

  return (
    <QuickStep2Form
      initialData={initialData}
      applicationId={appId ?? initialData?.id ?? null}
      guardianPrefill={guardianPrefill}
      accountInfo={accountInfo}
    />
  );
}
