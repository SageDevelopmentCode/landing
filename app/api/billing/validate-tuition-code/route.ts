import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  authenticateApiRequest,
  canAccessParentDashboard,
} from "@/app/lib/authenticate-api-request";

const schema = z.object({
  code: z.string().min(1),
  parentId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await authenticateApiRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validated: z.infer<typeof schema>;
  try {
    validated = schema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const allowed = await canAccessParentDashboard(user.id, validated.parentId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const normalizedCode = validated.code.trim().toUpperCase();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .schema("billing")
    .from("tuition_codes")
    .select("label, amount_cents, parent_id")
    .eq("active", true)
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    console.error("validate-tuition-code error:", error);
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Invalid or inactive tuition code" }, { status: 404 });
  }

  if (data.parent_id && data.parent_id !== validated.parentId) {
    return NextResponse.json({ error: "This code is not associated with your account" }, { status: 403 });
  }

  return NextResponse.json({
    label: data.label,
    amount_cents: data.amount_cents,
    code: normalizedCode,
  });
}
