import { supabase } from "@/lib/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export type ChannelWithMeta = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  isMember: boolean;
  memberCount: number;
  lastMessage: { body: string; created_at: string; sender_id: string } | null;
  unreadCount: number;
  updated_at: string;
};

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type ChannelMessageRow = {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  sender_image_url: string | null;
  body: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  reactions: ReactionSummary[];
};

type RawProfile = { id: string; full_name: string; profile_image_url: string | null };
type RawReaction = { message_id: string; user_id: string; emoji: string };

const DONT_INCLUDE_TAG = "Don't Include";

async function isEligibleForDefaultChannel(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "parent") return true;

  const { data: enrolled } = await supabase
    .schema("parent_app")
    .from("applications")
    .select("admin_tags")
    .eq("user_id", userId)
    .eq("status", "enrolled");

  if (!enrolled?.length) return false;
  return enrolled.some((a: { admin_tags: string[] | null }) =>
    !(a.admin_tags ?? []).includes(DONT_INCLUDE_TAG)
  );
}

export async function getChannels(userId: string): Promise<ChannelWithMeta[]> {
  const { data: channels } = await supabase
    .schema("messaging")
    .from("channels")
    .select("id, name, description, is_default, updated_at")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (!channels?.length) return [];

  const { data: memberships } = await supabase
    .schema("messaging")
    .from("channel_members")
    .select("channel_id, last_read_at")
    .eq("user_id", userId);

  const memberMap = new Map<string, string | null>();
  (memberships ?? []).forEach((m: { channel_id: string; last_read_at: string | null }) => {
    memberMap.set(m.channel_id, m.last_read_at);
  });

  const results = await Promise.all(
    channels.map(async (ch: { id: string; name: string; description: string | null; is_default: boolean; updated_at: string }) => {
      const isMember = memberMap.has(ch.id);
      const lastReadAt = memberMap.get(ch.id) ?? null;

      let unreadQuery = supabase
        .schema("messaging")
        .from("channel_messages")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", ch.id)
        .neq("sender_id", userId);

      if (lastReadAt) {
        unreadQuery = unreadQuery.gt("created_at", lastReadAt);
      }

      const [memberCount, lastMsgRes, unreadRes] = await Promise.all([
        (async () => {
          const { data, error } = await supabase.rpc("get_channel_members", { p_channel_id: ch.id });
          if (!error && data) return (data as any[]).length;
          const { count } = await supabase
            .schema("messaging")
            .from("channel_members")
            .select("user_id", { count: "exact", head: true })
            .eq("channel_id", ch.id);
          return count ?? 0;
        })(),
        supabase
          .schema("messaging")
          .from("channel_messages")
          .select("body, created_at, sender_id")
          .eq("channel_id", ch.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        isMember ? unreadQuery : Promise.resolve({ count: 0 }),
      ]);

      return {
        id: ch.id,
        name: ch.name,
        description: ch.description,
        is_default: ch.is_default,
        updated_at: ch.updated_at,
        isMember,
        memberCount,
        lastMessage: lastMsgRes.data
          ? {
              body: lastMsgRes.data.body,
              created_at: lastMsgRes.data.created_at,
              sender_id: lastMsgRes.data.sender_id,
            }
          : null,
        unreadCount: isMember ? (unreadRes.count ?? 0) : 0,
      } satisfies ChannelWithMeta;
    })
  );

  return results;
}

export async function createChannel(
  name: string,
  description: string | null,
  creatorId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .schema("messaging")
    .from("channels")
    .insert({ name, description, created_by: creatorId, is_default: false })
    .select("id")
    .single();

  if (error || !data) return null;

  await supabase
    .schema("messaging")
    .from("channel_members")
    .upsert({ channel_id: data.id, user_id: creatorId }, { onConflict: "channel_id,user_id" });

  return (data as any).id as string;
}

export async function ensureDefaultChannelMembership(userId: string): Promise<void> {
  if (!(await isEligibleForDefaultChannel(userId))) return;

  const { data: defaultChannels } = await supabase
    .schema("messaging")
    .from("channels")
    .select("id")
    .eq("is_default", true);

  if (!defaultChannels?.length) return;

  const { error } = await supabase
    .schema("messaging")
    .from("channel_members")
    .upsert(
      defaultChannels.map((ch: { id: string }) => ({ channel_id: ch.id, user_id: userId })),
      { onConflict: "channel_id,user_id", ignoreDuplicates: true }
    );
  if (error) console.error("[ensureDefaultChannelMembership] error:", error);
}

export async function joinChannel(channelId: string, userId: string): Promise<boolean> {
  const { data: ch } = await supabase
    .schema("messaging")
    .from("channels")
    .select("is_default")
    .eq("id", channelId)
    .single();

  if ((ch as { is_default?: boolean } | null)?.is_default && !(await isEligibleForDefaultChannel(userId))) {
    return false;
  }

  const { error } = await supabase
    .schema("messaging")
    .from("channel_members")
    .upsert(
      { channel_id: channelId, user_id: userId },
      { onConflict: "channel_id,user_id", ignoreDuplicates: true }
    );
  if (error) console.error("[joinChannel] error:", error);
  return !error;
}

export async function leaveChannel(channelId: string, userId: string): Promise<boolean> {
  const { data: ch } = await supabase
    .schema("messaging")
    .from("channels")
    .select("is_default")
    .eq("id", channelId)
    .single();

  if ((ch as any)?.is_default) return false;

  const { error } = await supabase
    .schema("messaging")
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  return !error;
}

export async function getChannelMessages(
  channelId: string,
  userId: string
): Promise<ChannelMessageRow[]> {
  const { data: messages } = await supabase
    .schema("messaging")
    .from("channel_messages")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });

  if (!messages?.length) return [];

  const senderIds = [...new Set(messages.map((m: any) => m.sender_id as string))];
  const messageIds = messages.map((m: any) => m.id as string);

  const [profilesRes, reactionsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, profile_image_url")
      .in("id", senderIds),
    supabase
      .schema("messaging")
      .from("message_reactions")
      .select("message_id, user_id, emoji")
      .in("message_id", messageIds),
  ]);

  const profileMap = new Map<string, { full_name: string; profile_image_url: string | null }>();
  ((profilesRes.data ?? []) as RawProfile[]).forEach((p) => {
    profileMap.set(p.id, { full_name: p.full_name, profile_image_url: p.profile_image_url });
  });

  const reactionsMap = new Map<string, ReactionSummary[]>();
  for (const r of ((reactionsRes.data ?? []) as RawReaction[])) {
    const list = reactionsMap.get(r.message_id) ?? [];
    const entry = list.find((e) => e.emoji === r.emoji);
    if (entry) {
      entry.count++;
      if (r.user_id === userId) entry.reactedByMe = true;
    } else {
      list.push({ emoji: r.emoji, count: 1, reactedByMe: r.user_id === userId });
    }
    reactionsMap.set(r.message_id, list);
  }

  return messages.map((m: any) => {
    const profile = profileMap.get(m.sender_id);
    return {
      id: m.id,
      channel_id: m.channel_id,
      sender_id: m.sender_id,
      sender_name: profile?.full_name ?? "Unknown",
      sender_image_url: profile?.profile_image_url ?? null,
      body: m.body,
      image_url: m.image_url,
      file_url: m.file_url,
      file_name: m.file_name,
      created_at: m.created_at,
      reactions: reactionsMap.get(m.id) ?? [],
    } satisfies ChannelMessageRow;
  });
}

export async function sendChannelMessage(
  channelId: string,
  body: string,
  senderId: string,
  imageUrl?: string | null,
  fileUrl?: string | null,
  fileName?: string | null
): Promise<ChannelMessageRow | null> {
  const { data: inserted, error } = await supabase
    .schema("messaging")
    .from("channel_messages")
    .insert({
      channel_id: channelId,
      sender_id: senderId,
      body: body || "",
      image_url: imageUrl ?? null,
      file_url: fileUrl ?? null,
      file_name: fileName ?? null,
    })
    .select("*")
    .single();

  if (error || !inserted) return null;

  const { data: profile } = await supabase
    .schema("admin")
    .from("users")
    .select("full_name, profile_image_url")
    .eq("id", senderId)
    .single();

  return {
    id: inserted.id,
    channel_id: inserted.channel_id,
    sender_id: inserted.sender_id,
    sender_name: (profile as any)?.full_name ?? "Unknown",
    sender_image_url: (profile as any)?.profile_image_url ?? null,
    body: inserted.body,
    image_url: inserted.image_url,
    file_url: inserted.file_url,
    file_name: inserted.file_name,
    created_at: inserted.created_at,
    reactions: [],
  };
}

export async function editChannelMessage(messageId: string, newBody: string): Promise<boolean> {
  const { error } = await supabase
    .schema("messaging")
    .from("channel_messages")
    .update({ body: newBody })
    .eq("id", messageId);
  return !error;
}

export async function deleteChannelMessage(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .schema("messaging")
    .from("channel_messages")
    .delete()
    .eq("id", messageId);
  return !error;
}

export async function markChannelRead(channelId: string, userId: string): Promise<void> {
  await supabase
    .schema("messaging")
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", userId);
}

export async function toggleReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<ReactionSummary[] | null> {
  const { data: existing } = await supabase
    .schema("messaging")
    .from("message_reactions")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase
      .schema("messaging")
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
  } else {
    await supabase
      .schema("messaging")
      .from("message_reactions")
      .insert({ message_id: messageId, user_id: userId, emoji });
  }

  const { data: reactions } = await supabase
    .schema("messaging")
    .from("message_reactions")
    .select("user_id, emoji")
    .eq("message_id", messageId);

  if (!reactions) return null;

  const map = new Map<string, ReactionSummary>();
  for (const r of (reactions as RawReaction[])) {
    const entry = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false };
    entry.count++;
    if (r.user_id === userId) entry.reactedByMe = true;
    map.set(r.emoji, entry);
  }

  return Array.from(map.values());
}

export async function uploadChannelMedia(
  bucket: "message-images" | "message-files",
  uri: string,
  contentType: string,
  channelId: string,
  userId: string,
  fileName: string
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/channel-${channelId}/${Date.now()}-${safeName}`;

  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": contentType,
    },
    body: blob,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${bodyText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function getSenderProfile(
  userId: string
): Promise<{ full_name: string; profile_image_url: string | null } | null> {
  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("full_name, profile_image_url")
    .eq("id", userId)
    .single();
  return (data as any) ?? null;
}

export type ChannelMember = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  role: string | null;
  children: { id: string; child_legal_name: string; profile_image_url: string | null }[];
};

export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
  const { data, error } = await supabase.rpc("get_channel_members", { p_channel_id: channelId });
  if (!error && data) return data as ChannelMember[];

  const { data: memberRows } = await supabase
    .schema("messaging")
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", channelId);

  const userIds = (memberRows ?? []).map((m: any) => m.user_id as string);
  if (!userIds.length) return [];

  const { data: profiles } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url, role")
    .in("id", userIds)
    .order("full_name", { ascending: true });

  return ((profiles ?? []) as any[]).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? "Unknown",
    profile_image_url: p.profile_image_url ?? null,
    role: p.role ?? null,
    children: [],
  }));
}

export async function getChannelMemberCount(channelId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_channel_members", { p_channel_id: channelId });
  if (!error && data) return (data as any[]).length;
  const { count } = await supabase
    .schema("messaging")
    .from("channel_members")
    .select("user_id", { count: "exact", head: true })
    .eq("channel_id", channelId);
  return count ?? 0;
}
