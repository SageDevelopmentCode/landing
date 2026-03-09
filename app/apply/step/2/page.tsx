import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import Step2Form from "./Step2Form";

export default async function ApplicationStep2({
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
      // Fetch the specific application being filled out
      const { data } = await adminClient
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("id", appId)
        .eq("user_id", user.id)
        .single();
      initialData = data;

      // If this app has no guardian data yet, prefill from the most recent other app
      const hasGuardianData = !!(data?.g1_full_name || data?.g1_email || data?.g1_cell_phone);
      if (!hasGuardianData) {
        const { data: prior } = await adminClient
          .schema("parent_app")
          .from("applications")
          .select(
            "g1_full_name,g1_relationship,g1_relationship_other,g1_email,g1_cell_phone,g1_work_phone,g1_preferred_contact,g1_lives_with_child,g1_has_custody,g2_full_name,g2_relationship,g2_relationship_other,g2_email,g2_cell_phone,g2_work_phone,g2_preferred_contact,g2_lives_with_child,g2_has_custody,has_custody_orders,custody_orders_description"
          )
          .eq("user_id", user.id)
          .neq("id", appId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        guardianPrefill = prior;
      }
    } else {
      // Fallback: no appId in URL — fetch most recent app
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
    <Step2Form
      initialData={initialData}
      applicationId={appId ?? initialData?.id ?? null}
      guardianPrefill={guardianPrefill}
      accountInfo={accountInfo}
    />
  );
}
