import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, applicationId } = await request.json();

  if (typeof code !== "string" || code.trim().toUpperCase() !== "WELCOME") {
    return NextResponse.json(
      { success: false, error: "Invalid code" },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  // Fetch submitted applications — scoped to a single app when applicationId is provided
  const baseQuery = adminClient
    .schema("parent_app")
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "in_progress");

  const { data: submittedApps, error: fetchError } = applicationId
    ? await baseQuery.eq("id", applicationId)
    : await baseQuery;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Update admin.users once with parent (G1/G2) data from the first submitted app
  if (submittedApps && submittedApps.length > 0) {
    const sourceApp = submittedApps[0];

    const { error: userUpdateError } = await adminClient
      .schema("admin")
      .from("users")
      .update({
        g1_cell_phone: sourceApp.g1_cell_phone,
        g1_work_phone: sourceApp.g1_work_phone,
        g1_preferred_contact: sourceApp.g1_preferred_contact,
        g1_lives_with_child: sourceApp.g1_lives_with_child,
        g1_has_custody: sourceApp.g1_has_custody,
        g2_full_name: sourceApp.g2_full_name,
        g2_relationship: sourceApp.g2_relationship,
        g2_relationship_other: sourceApp.g2_relationship_other,
        g2_email: sourceApp.g2_email,
        g2_cell_phone: sourceApp.g2_cell_phone,
        g2_work_phone: sourceApp.g2_work_phone,
        g2_preferred_contact: sourceApp.g2_preferred_contact,
        g2_lives_with_child: sourceApp.g2_lives_with_child,
        g2_has_custody: sourceApp.g2_has_custody,
        has_custody_orders: sourceApp.has_custody_orders,
        custody_orders_description: sourceApp.custody_orders_description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userUpdateError) {
      return NextResponse.json(
        { error: userUpdateError.message },
        { status: 500 },
      );
    }

    // For each submitted app: insert admin.students row, then update application
    for (const app of submittedApps) {
      const { data: studentRow, error: studentInsertError } = await adminClient
        .schema("admin")
        .from("students")
        .insert({
          parent_id: user.id,
          child_legal_name: app.child_legal_name,
          dob_month: app.dob_month,
          dob_day: app.dob_day,
          dob_year: app.dob_year,
          special_interests: app.special_interests,
          has_medical_conditions: app.has_medical_conditions,
          medical_conditions_description: app.medical_conditions_description,
          has_allergies: app.has_allergies,
          allergies_description: app.allergies_description,
          has_emergency_medications: app.has_emergency_medications,
          emergency_medications_description:
            app.emergency_medications_description,
          history_flags: app.history_flags,
          history_explanation: app.history_explanation,
          needs_aide: app.needs_aide,
          needs_aide_description: app.needs_aide_description,
          learning_style: app.learning_style,
          strengths_interests: app.strengths_interests,
          current_challenges: app.current_challenges,
          dysregulation_response: app.dysregulation_response,
          regulation_strategies: app.regulation_strategies,
          activities_to_avoid: app.activities_to_avoid,
          child_grade: app.child_grade,
        })
        .select("id")
        .single();

      if (studentInsertError) {
        return NextResponse.json(
          { error: studentInsertError.message },
          { status: 500 },
        );
      }

      const { error: appUpdateError } = await adminClient
        .schema("parent_app")
        .from("applications")
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          student_id: studentRow.id,
          status: "enrolling",
        })
        .eq("id", app.id);

      if (appUpdateError) {
        return NextResponse.json(
          { error: appUpdateError.message },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ success: true });
}
