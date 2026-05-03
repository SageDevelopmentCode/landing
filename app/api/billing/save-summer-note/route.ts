import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createSummerCommitmentNoteEmbed,
} from "@/app/lib/discord";

const schema = z.object({
  parentId:      z.string().uuid(),
  studentId:     z.string().uuid(),
  applicationId: z.string().uuid(),
  note:          z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let validated: z.infer<typeof schema>;
  try {
    validated = schema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (validated.parentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("billing")
    .from("summer_week_commitments")
    .upsert(
      {
        parent_id:      validated.parentId,
        student_id:     validated.studentId,
        application_id: validated.applicationId,
        note:           validated.note,
        updated_at:     new Date().toISOString(),
      },
      { onConflict: "parent_id,student_id,application_id" },
    );

  if (error) {
    console.error("save-summer-note error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  // Fire-and-forget Discord notification
  adminClient
    .schema("admin")
    .from("students")
    .select("child_legal_name")
    .eq("id", validated.studentId)
    .single()
    .then(({ data: student }) => {
      sendDiscordNotification(
        createSummerCommitmentNoteEmbed({
          parentEmail: user.email ?? validated.parentId,
          childName: student?.child_legal_name ?? "Unknown",
          note: validated.note,
        }),
      );
    });

  return NextResponse.json({ success: true });
}
