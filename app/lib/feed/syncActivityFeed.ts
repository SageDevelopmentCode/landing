import {
  activityCtaRoute,
  activityFeedBody,
  createAutoFeedPost,
} from "@/app/lib/feed/autoFeedPost";

export async function syncActivityFeedPostIfPublished(params: {
  activityId: string;
  title: string;
  status: "draft" | "published";
  visibility: "public" | "private";
  authorUserId: string;
}): Promise<void> {
  const isPublishedPublic =
    params.status === "published" && params.visibility === "public";

  if (!isPublishedPublic) return;

  await createAutoFeedPost({
    authorUserId: params.authorUserId,
    postType: "activity",
    body: activityFeedBody(params.title),
    sourceType: "activity",
    sourceId: params.activityId,
    ctaLabel: "View activity",
    ctaRoute: activityCtaRoute(params.activityId, false),
    ctaRouteStaff: activityCtaRoute(params.activityId, true),
  });
}
