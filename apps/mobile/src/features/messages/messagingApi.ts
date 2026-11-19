// Small messaging helpers shared by the parent inbox, compose and threads.
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";

export type Result = { ok: boolean; error?: string };

export type ConversationRow = {
  id: string;
  updatedAt: string;
  otherUserId: string;
  otherUserName: string;
  otherUserProfileImageUrl: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isGroup: boolean;
  participantCount: number;
};

export type TeacherSuggestion = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

export const ATTACHMENT_PREVIEW = "Sent an attachment";

/** Inbox-style relative time ("just now", "5m", "3h", "yesterday", "4d"). */
export function shortTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d}d`;
}

export async function fetchConversationRows(
  userId: string,
): Promise<{ ok: true; rows: ConversationRow[] } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("get_conversation_list", { p_user_id: userId });
  if (error || !data) {
    if (error) notifyError("parent-messages-list", error);
    return { ok: false, error: error?.message ?? "Couldn't load conversations" };
  }
  return {
    ok: true,
    rows: (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      updatedAt: r.last_message_at as string,
      otherUserId: (r.other_user_id as string) ?? "",
      otherUserName: (r.other_user_name as string) ?? "Unknown",
      otherUserProfileImageUrl: (r.other_user_profile_image as string | null) ?? null,
      lastMessagePreview: (r.last_message_preview as string | null) ?? null,
      unreadCount: Number(r.unread_count ?? 0),
      isGroup: Boolean(r.is_group),
      participantCount: Number(r.participant_count ?? 0),
    })),
  };
}

export async function findOrCreateConversation(
  otherUserId: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("find_or_create_conversation", { other_user_id: otherUserId });
    if (error || !data) {
      if (error) notifyError("parent-messages-start-conversation", error);
      return { ok: false, error: error?.message };
    }
    return { ok: true, conversationId: data as string };
  } catch (e) {
    notifyError("parent-messages-start-conversation", e);
    return { ok: false, error: e instanceof Error ? e.message : undefined };
  }
}

/** Escape LIKE wildcards so a search for "50%" doesn't match everything. */
export function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`);
}
