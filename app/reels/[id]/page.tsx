import { getReels } from "@/app/teacher/feed/reelActions";
import ReelsPageClient from "../ReelsPageClient";

export default async function ReelDeepLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reels = await getReels();
  const initialIndex = reels.findIndex((r) => r.id === id);
  return <ReelsPageClient initialReels={reels} initialIndex={initialIndex > -1 ? initialIndex : 0} />;
}
