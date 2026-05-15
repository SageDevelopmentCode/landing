"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export type ModerationParticipant = {
  id: string;
  full_name: string;
  role: string | null;
  profile_image_url: string | null;
};

export type ModerationConversation = {
  id: string;
  updated_at: string;
  participants: [ModerationParticipant, ModerationParticipant];
  lastMessage: { body: string; created_at: string; sender_id: string } | null;
  messageCount: number;
};

export type ModerationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_image_url: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
};

export async function getAllConversations(): Promise<ModerationConversation[]> {
  const adminClient = createAdminClient();

  const { data: convos } = await adminClient
    .schema("messaging")
    .from("conversations")
    .select("id, updated_at")
    .order("updated_at", { ascending: false });

  if (!convos?.length) return [];

  const convoIds = convos.map((c) => c.id);

  // Fetch participants and messages in parallel
  const [{ data: participants }, { data: allMsgs }] = await Promise.all([
    adminClient
      .schema("messaging")
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convoIds),
    adminClient
      .schema("messaging")
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false }),
  ]);

  // Batch-resolve user profiles from unique participant IDs
  const allUserIds = [...new Set((participants ?? []).map((p) => p.user_id))];
  const { data: users } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, role, profile_image_url")
    .in("id", allUserIds);

  const userMap = Object.fromEntries(
    (users ?? []).map((u) => [u.id, u as ModerationParticipant])
  );

  const participantsByConvo = (participants ?? []).reduce<Record<string, string[]>>(
    (acc, p) => {
      (acc[p.conversation_id] ??= []).push(p.user_id);
      return acc;
    },
    {}
  );

  type MsgMeta = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };
  const msgsByConvo = (allMsgs ?? []).reduce<Record<string, MsgMeta[]>>(
    (acc, m) => {
      (acc[m.conversation_id] ??= []).push(m);
      return acc;
    },
    {}
  );

  return convos
    .map((c) => {
      const participantIds = participantsByConvo[c.id] ?? [];
      const resolvedParticipants = participantIds
        .map((uid) => userMap[uid])
        .filter(Boolean);

      if (resolvedParticipants.length !== 2) return null;

      const msgs = msgsByConvo[c.id] ?? [];
      const lastMsg = msgs[0] ?? null;

      return {
        id: c.id,
        updated_at: c.updated_at,
        participants: resolvedParticipants as [ModerationParticipant, ModerationParticipant],
        lastMessage: lastMsg
          ? { body: lastMsg.body, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id }
          : null,
        messageCount: msgs.length,
      };
    })
    .filter(Boolean) as ModerationConversation[];
}

export async function getConversationMessages(conversationId: string): Promise<ModerationMessage[]> {
  const adminClient = createAdminClient();

  const { data: messages } = await adminClient
    .schema("messaging")
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, read_at, image_url, file_url, file_name")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!messages?.length) return [];

  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: senders } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", senderIds);

  const senderMap = Object.fromEntries(
    (senders ?? []).map((u) => [u.id, u])
  );

  return messages.map((m) => ({
    ...m,
    sender_name: senderMap[m.sender_id]?.full_name ?? "Unknown",
    sender_image_url: senderMap[m.sender_id]?.profile_image_url ?? null,
  }));
}
