import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";

const STAFF_ROLES = new Set(["teacher", "super_admin"]);

export async function requireStaffFromRequest(
  request: NextRequest,
): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminUser } = await supabase
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminUser?.role || !STAFF_ROLES.has(adminUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: user.id };
}
