import { getReels } from "@/app/teacher/feed/reelActions";
import ReelsPageClient from "./ReelsPageClient";

export default async function ReelsPage() {
  const reels = await getReels();
  return <ReelsPageClient initialReels={reels} />;
}
