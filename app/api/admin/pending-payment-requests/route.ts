import { createAdminClient } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      parent_id,
      student_id,
      program,
      payment_type,
      week,
      month,
      label,
      amount_cents,
    } = body;

    if (!parent_id || !program || !payment_type || !label) {
      return NextResponse.json(
        { error: "Missing required fields: parent_id, program, payment_type, label" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check for existing non-dismissed request with same combo
    let existingQuery = adminClient
      .schema("billing")
      .from("pending_payment_requests")
      .select("*")
      .eq("parent_id", parent_id)
      .eq("program", program)
      .eq("payment_type", payment_type)
      .neq("status", "dismissed");

    if (student_id) {
      existingQuery = existingQuery.eq("student_id", student_id);
    } else {
      existingQuery = existingQuery.is("student_id", null);
    }

    if (week) {
      existingQuery = existingQuery.eq("week", week);
    } else {
      existingQuery = existingQuery.is("week", null);
    }

    if (month) {
      existingQuery = existingQuery.eq("month", month);
    } else {
      existingQuery = existingQuery.is("month", null);
    }

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();

    if (existingError) {
      console.error("Error checking for existing request:", existingError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ data: existing, duplicate: true });
    }

    // Insert new record
    const { data, error } = await adminClient
      .schema("billing")
      .from("pending_payment_requests")
      .insert({
        parent_id,
        student_id: student_id ?? null,
        program,
        payment_type,
        week: week ?? null,
        month: month ?? null,
        label,
        amount_cents: amount_cents ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting pending payment request:", error);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ data, duplicate: false }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
