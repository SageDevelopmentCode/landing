import { API_BASE_URL } from "@/constants/config";
import { supabase } from "@/lib/supabase";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export async function notifyPhotoBatchFeedPost(
  photoIds: string[],
  caption?: string | null,
): Promise<void> {
  if (photoIds.length === 0) return;
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/feed/auto/photo-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ photoIds, caption: caption ?? undefined }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to create feed notification");
  }
}

export async function syncNewsletterFeedPost(newsletterId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/feed/auto/newsletter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newsletterId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to sync newsletter feed");
  }
}

export async function syncActivityFeedPost(activityId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/feed/auto/activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ activityId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to sync activity feed");
  }
}
