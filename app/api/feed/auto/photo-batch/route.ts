import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { authenticateApiRequest } from "@/app/lib/authenticate-api-request";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createAutoFeedPost,
  photoBatchCtaRoute,
  photoBatchFeedBody,
} from "@/app/lib/feed/autoFeedPost";

const bodySchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
  caption: z.string().max(2000).optional(),
});

async function isTeacherOrAdmin(userId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = data?.role;
  return role === "teacher" || role === "super_admin";
}

export async function POST(request: NextRequest) {
  const user = await authenticateApiRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isTeacherOrAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const batchId = randomUUID();
  const result = await createAutoFeedPost({
    authorUserId: user.id,
    postType: "photos",
    body: photoBatchFeedBody(validated.photoIds.length, validated.caption),
    sourceType: "photo_batch",
    sourceId: batchId,
    ctaLabel: "View photos",
    ctaRoute: photoBatchCtaRoute(false),
    ctaRouteStaff: photoBatchCtaRoute(true),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, postId: result.postId });
}
