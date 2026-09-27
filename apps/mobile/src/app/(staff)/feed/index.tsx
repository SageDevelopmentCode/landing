import { FeedScreen } from "@/components/feed/FeedScreen";

export default function StaffFeedScreen() {
  return (
    <FeedScreen
      config={{
        title: "Class feed",
        subtitle: "Posts and automatic updates for families",
        staffFeed: true,
        emptyHeading: "No Posts Yet",
        emptyBody: "Share a post or publish photos, activities, and events to notify parents.",
        teacherProfilePath: "/(staff)/teacher/[teacherId]",
        postDetailPath: "/(staff)/feed/[postId]",
        showComposeFab: true,
        composePath: "/(staff)/feed/compose",
        allowDelete: true,
      }}
    />
  );
}
