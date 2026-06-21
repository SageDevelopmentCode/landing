import { cookies } from "next/headers";
import { getReels } from "@/app/teacher/feed/reelActions";
import ReelsPasswordGate from "./ReelsPasswordGate";

const REELS_COOKIE = "reels_auth";

export default async function ReelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(REELS_COOKIE)?.value === "1";

  if (!isAuthed) {
    const reels = await getReels();
    const bgVideoUrl = reels[0]?.storage_url ?? null;
    return <ReelsPasswordGate bgVideoUrl={bgVideoUrl} />;
  }

  return <>{children}</>;
}
