import { FeedScreen } from "@/components/feed/FeedScreen";

export default function ParentFeedScreen() {
  return (
    <FeedScreen
      config={{
        title: "Family feed",
        subtitle: "Updates, events, and announcements",
        emptyHeading: "No Posts Yet",
        emptyBody: "Check back soon for updates from teachers and the school calendar.",
        teacherProfilePath: "/(tabs)/teacher/[teacherId]",
        postDetailPath: "/(tabs)/feed/[postId]",
      }}
    />
  );
}
