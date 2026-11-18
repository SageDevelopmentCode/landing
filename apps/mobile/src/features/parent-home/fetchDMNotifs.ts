import { supabase } from "@/lib/supabase";
import type { NotifItem } from "./types";

export async function fetchDMNotifs(userId: string): Promise<NotifItem[]> {
  const { data: participantRows } = await supabase
    .schema("messaging")
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const convIds =
    participantRows?.map(
      (r: { conversation_id: string }) => r.conversation_id,
    ) ?? [];
  if (!convIds.length) return [];

  // Fetch unread messages and all other participants in parallel (both only need convIds)
  const [unreadMsgsResult, allOtherParticipantsResult] = await Promise.all([
    supabase
      .schema("messaging")
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", convIds)
      .neq("sender_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .schema("messaging")
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", userId),
  ]);

  const unreadMsgs = unreadMsgsResult.data;
  if (!unreadMsgs?.length) return [];

  const convUnread = new Map<
    string,
    { count: number; latestBody: string; latestAt: string }
  >();
  for (const msg of unreadMsgs as {
    conversation_id: string;
    body: string;
    created_at: string;
  }[]) {
    const existing = convUnread.get(msg.conversation_id);
    if (!existing) {
      convUnread.set(msg.conversation_id, {
        count: 1,
        latestBody: msg.body,
        latestAt: msg.created_at,
      });
    } else {
      existing.count++;
    }
  }

  const unreadConvIds = [...convUnread.keys()];

  const otherParticipants = (
    (allOtherParticipantsResult.data as { conversation_id: string; user_id: string }[]) ?? []
  ).filter((p) => unreadConvIds.includes(p.conversation_id));

  const otherUserIds = [
    ...new Set(otherParticipants.map((p) => p.user_id)),
  ];
  if (!otherUserIds.length) return [];

  const { data: profiles } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", otherUserIds);

  const profileMap = new Map(
    (
      (profiles as {
        id: string;
        full_name: string;
        profile_image_url: string | null;
      }[]) ?? []
    ).map((p) => [p.id, p]),
  );
  const participantMap = new Map(
    (
      (otherParticipants as { conversation_id: string; user_id: string }[]) ??
      []
    ).map((p) => [p.conversation_id, p.user_id]),
  );

  return unreadConvIds.map((convId) => {
    const data = convUnread.get(convId)!;
    const otherUserId = participantMap.get(convId) ?? "";
    const profile = profileMap.get(otherUserId);
    return {
      id: convId,
      kind: "direct" as const,
      name: profile?.full_name ?? "Unknown",
      preview: data.latestBody.slice(0, 60),
      timestamp: data.latestAt,
      unreadCount: data.count,
      conversationId: convId,
      otherUserName: profile?.full_name ?? "Unknown",
      otherUserAvatar: profile?.profile_image_url ?? "",
      otherUserId,
    };
  });
}
