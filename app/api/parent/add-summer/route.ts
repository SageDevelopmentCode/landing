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

  const { applicationId } = await request.json();

  if (typeof applicationId !== "string" || !applicationId) {
    return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: app, error: fetchError } = await adminClient
    .schema("parent_app")
    .from("applications")
    .select("id, program, user_id")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (app.program !== "school_year_26_27") {
    return NextResponse.json(
      { error: "Application is not a school-year-only enrollment" },
      { status: 400 },
    );
  }

  const { error: updateError } = await adminClient
    .schema("parent_app")
    .from("applications")
    .update({ program: "both" })
    .eq("id", applicationId);

  if (updateError) {
    console.error("add-summer error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
