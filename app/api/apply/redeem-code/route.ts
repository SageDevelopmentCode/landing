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

  const { code } = await request.json();

  if (typeof code !== "string" || code.trim().toUpperCase() !== "WELCOME") {
    return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  await adminClient
    .schema("parent_app")
    .from("applications")
    .update({ approved: true })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
