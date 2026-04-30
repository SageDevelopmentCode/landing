import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";

const VALID_PROGRAMS = ["summer_26", "school_year_26_27", "both"] as const;
type TargetProgram = (typeof VALID_PROGRAMS)[number];

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId, targetProgram } = await request.json();

  if (typeof applicationId !== "string" || !applicationId) {
    return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
  }

  if (!VALID_PROGRAMS.includes(targetProgram as TargetProgram)) {
    return NextResponse.json({ error: "Invalid targetProgram" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Verify the application belongs to this parent and is a homeschool drop-in
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

  if (app.program !== "homeschool_drop_in") {
    return NextResponse.json({ error: "Application is not a homeschool drop-in" }, { status: 400 });
  }

  const { error: updateError } = await adminClient
    .schema("parent_app")
    .from("applications")
    .update({ program: targetProgram, drop_in_program: null })
    .eq("id", applicationId);

  if (updateError) {
    console.error("switch-program error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
