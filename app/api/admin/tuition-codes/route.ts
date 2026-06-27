import { createAdminClient } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1).max(50),
  label: z.string().min(1),
  amount_cents: z.number().int().positive(),
  parent_id: z.string().uuid().nullable().optional(),
  active: z.boolean().optional().default(true),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

// GET — list all tuition codes with parent info
export async function GET() {
  const client = createAdminClient();

  const { data, error } = await client
    .schema("billing")
    .from("tuition_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("tuition-codes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tuition codes" }, { status: 500 });
  }

  const parentIds = [...new Set((data ?? []).map((r) => r.parent_id).filter(Boolean))] as string[];

  let parentMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (parentIds.length > 0) {
    const { data: parents } = await client
      .schema("admin")
      .from("users")
      .select("id, full_name, email")
      .in("id", parentIds);
    for (const p of parents ?? []) {
      if (p.id) parentMap[p.id] = { full_name: p.full_name ?? null, email: p.email ?? null };
    }
  }

  const enriched = (data ?? []).map((row) => ({
    ...row,
    parent_name: row.parent_id ? (parentMap[row.parent_id]?.full_name ?? null) : null,
    parent_email: row.parent_id ? (parentMap[row.parent_id]?.email ?? null) : null,
  }));

  return NextResponse.json({ data: enriched });
}

// POST — create a new tuition code
export async function POST(request: NextRequest) {
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = createAdminClient();

  const { data, error } = await client
    .schema("billing")
    .from("tuition_codes")
    .insert({
      code: body.code.trim().toUpperCase(),
      label: body.label.trim(),
      amount_cents: body.amount_cents,
      parent_id: body.parent_id ?? null,
      active: body.active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("tuition-codes POST error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "A code with that value already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create tuition code" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH — toggle active status
export async function PATCH(request: NextRequest) {
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = createAdminClient();

  const { data, error } = await client
    .schema("billing")
    .from("tuition_codes")
    .update({ active: body.active })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("tuition-codes PATCH error:", error);
    return NextResponse.json({ error: "Failed to update tuition code" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE — remove a tuition code
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const client = createAdminClient();

  const { error } = await client
    .schema("billing")
    .from("tuition_codes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("tuition-codes DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete tuition code" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
