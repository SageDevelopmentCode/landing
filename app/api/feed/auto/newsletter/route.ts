import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiRequest } from "@/app/lib/authenticate-api-request";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createAutoFeedPost,
  newsletterCtaRoute,
  newsletterFeedBody,
} from "@/app/lib/feed/autoFeedPost";
import { isTeacherOrAdmin } from "@/app/lib/feed/isTeacherOrAdmin";

const bodySchema = z.object({
  newsletterId: z.string().uuid(),
});

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

  const admin = createAdminClient();
  const { data: nl, error } = await admin
    .schema("newsletters")
    .from("newsletters")
    .select("id, title, status, created_by")
    .eq("id", validated.newsletterId)
    .single();

  if (error || !nl) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  if (nl.status !== "published") {
    return NextResponse.json({ error: "Newsletter is not published" }, { status: 400 });
  }

  const result = await createAutoFeedPost({
    authorUserId: nl.created_by ?? user.id,
    postType: "newsletter",
    body: newsletterFeedBody(nl.title),
    sourceType: "newsletter",
    sourceId: nl.id,
    ctaLabel: "Read newsletter",
    ctaRoute: newsletterCtaRoute(nl.id, false),
    ctaRouteStaff: newsletterCtaRoute(nl.id, true),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, postId: result.postId });
}
