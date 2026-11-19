// Staff post detail — Garden. Same screen as the parent post detail
// (features/feed/garden/PostDetail.tsx) in staff mode: staff routes, and a
// ⋮ → Delete post for the author (or any post for a super admin).
import { PostDetailScreen } from "@/features/feed/garden/PostDetail";

export default function StaffPostDetailScreen() {
  return <PostDetailScreen mode="staff" />;
}
