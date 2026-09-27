import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiRequest } from "@/app/lib/authenticate-api-request";
import { createAdminClient } from "@/app/lib/supabase-server";
import { syncActivityFeedPostIfPublished } from "@/app/lib/feed/syncActivityFeed";

const bodySchema = z.object({
  activityId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await authenticateApiRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validated: z.infer<typeof bodySchema>;
  try {
    validated = bodySchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: activity, error } = await admin
    .schema("teachers")
    .from("activities")
    .select("id, title, status, visibility, created_by")
    .eq("id", validated.activityId)
    .single();

  if (error || !activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (activity.created_by !== user.id) {
    const { data: u } = await admin
      .schema("admin")
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (u?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await syncActivityFeedPostIfPublished({
    activityId: activity.id,
    title: activity.title,
    status: activity.status as "draft" | "published",
    visibility: activity.visibility as "public" | "private",
    authorUserId: activity.created_by ?? user.id,
  });

  return NextResponse.json({ success: true });
}
