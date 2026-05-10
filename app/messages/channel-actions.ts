"use server";

import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";

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
};

export async function getChannels(userId: string): Promise<ChannelWithMeta[]> {
  const adminClient = createAdminClient();

  const [{ data: channels }, { data: memberships }] = await Promise.all([
    adminClient
      .schema("messaging")
      .from("channels")
      .select("id, name, description, is_default, updated_at")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true }),
    adminClient
      .schema("messaging")
      .from("channel_members")
      .select("channel_id, last_read_at")
      .eq("user_id", userId),
  ]);

  if (!channels?.length) return [];

  const membershipMap = new Map(
    (memberships ?? []).map((m) => [m.channel_id, m.last_read_at as string | null])
  );

  const result: ChannelWithMeta[] = await Promise.all(
    channels.map(async (ch) => {
      const isMember = membershipMap.has(ch.id);
      const lastReadAt = membershipMap.get(ch.id) ?? null;

      const [{ count: memberCount }, { data: lastMsgRows }, { count: unreadCount }] =
        await Promise.all([
          adminClient
            .schema("messaging")
            .from("channel_members")
            .select("user_id", { count: "exact", head: true })
            .eq("channel_id", ch.id),
          adminClient
            .schema("messaging")
            .from("channel_messages")
            .select("body, created_at, sender_id")
            .eq("channel_id", ch.id)
            .order("created_at", { ascending: false })
            .limit(1),
          isMember && lastReadAt
            ? adminClient
                .schema("messaging")
                .from("channel_messages")
                .select("id", { count: "exact", head: true })
                .eq("channel_id", ch.id)
                .neq("sender_id", userId)
                .gt("created_at", lastReadAt)
            : isMember
            ? adminClient
                .schema("messaging")
                .from("channel_messages")
                .select("id", { count: "exact", head: true })
                .eq("channel_id", ch.id)
                .neq("sender_id", userId)
            : Promise.resolve({ count: 0 }),
        ]);

      const lastMsg = lastMsgRows?.[0] ?? null;

      return {
        id: ch.id,
        name: ch.name,
        description: ch.description ?? null,
        is_default: ch.is_default,
        isMember,
        memberCount: memberCount ?? 0,
        lastMessage: lastMsg
          ? { body: lastMsg.body, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id }
          : null,
        unreadCount: isMember ? (unreadCount ?? 0) : 0,
        updated_at: ch.updated_at,
      };
    })
  );

  return result;
}

export async function ensureDefaultChannelMembership(userId: string): Promise<void> {
  const adminClient = createAdminClient();

  const { data: defaultChannels } = await adminClient
    .schema("messaging")
    .from("channels")
    .select("id")
    .eq("is_default", true);

  if (!defaultChannels?.length) return;

  await Promise.all(
    defaultChannels.map((ch) =>
      adminClient
        .schema("messaging")
        .from("channel_members")
        .upsert({ channel_id: ch.id, user_id: userId }, { onConflict: "channel_id,user_id", ignoreDuplicates: true })
    )
  );
}

export async function joinChannel(channelId: string, userId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .schema("messaging")
    .from("channel_members")
    .upsert({ channel_id: channelId, user_id: userId }, { onConflict: "channel_id,user_id", ignoreDuplicates: true });
  if (error) console.error("[joinChannel] error:", error);
  return !error;
}

export async function leaveChannel(channelId: string, userId: string): Promise<boolean> {
  const adminClient = createAdminClient();

  // Refuse to leave default channels
  const { data: ch } = await adminClient
    .schema("messaging")
    .from("channels")
    .select("is_default")
    .eq("id", channelId)
    .single();
  if (ch?.is_default) return false;

  const { error } = await adminClient
    .schema("messaging")
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", userId);
  if (error) console.error("[leaveChannel] error:", error);
  return !error;
}

export async function getChannelMessages(channelId: string): Promise<ChannelMessageRow[]> {
  const adminClient = createAdminClient();

  const { data: msgs, error } = await adminClient
    .schema("messaging")
    .from("channel_messages")
    .select("id, channel_id, sender_id, body, image_url, file_url, file_name, created_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });

  if (error || !msgs?.length) return [];

  const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
  const { data: senderProfiles } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", senderIds);

  const senderMap = new Map(
    (senderProfiles ?? []).map((u) => [u.id, { full_name: u.full_name ?? "Unknown", profile_image_url: u.profile_image_url ?? null }])
  );

  return msgs.map((m) => {
    const sender = senderMap.get(m.sender_id);
    return {
      id: m.id,
      channel_id: m.channel_id,
      sender_id: m.sender_id,
      sender_name: sender?.full_name ?? "Unknown",
      sender_image_url: sender?.profile_image_url ?? null,
      body: m.body,
      image_url: m.image_url ?? null,
      file_url: m.file_url ?? null,
      file_name: m.file_name ?? null,
      created_at: m.created_at,
    };
  });
}

export async function sendChannelMessage(
  channelId: string,
  body: string,
  imageUrl?: string,
  fileUrl?: string,
  fileName?: string
): Promise<ChannelMessageRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .schema("messaging")
    .from("channel_messages")
    .insert({
      channel_id: channelId,
      sender_id: user.id,
      body,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(fileUrl ? { file_url: fileUrl, file_name: fileName ?? "attachment" } : {}),
    })
    .select("id, channel_id, sender_id, body, image_url, file_url, file_name, created_at")
    .single();

  if (error || !data) {
    console.error("[sendChannelMessage] error:", error);
    return null;
  }

  await adminClient
    .schema("messaging")
    .from("channels")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", channelId);

  const { data: profile } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, profile_image_url")
    .eq("id", user.id)
    .single();

  return {
    id: data.id,
    channel_id: data.channel_id,
    sender_id: data.sender_id,
    sender_name: profile?.full_name ?? "Unknown",
    sender_image_url: profile?.profile_image_url ?? null,
    body: data.body,
    image_url: data.image_url ?? null,
    file_url: data.file_url ?? null,
    file_name: data.file_name ?? null,
    created_at: data.created_at,
  };
}

export async function markChannelRead(channelId: string, userId: string): Promise<void> {
  const adminClient = createAdminClient();
  await adminClient
    .schema("messaging")
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", userId);
}

export async function createChannel(
  name: string,
  description: string | null,
  creatorId: string
): Promise<string | null> {
  const adminClient = createAdminClient();

  // Verify caller is teacher or admin
  const { data: profile } = await adminClient
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", creatorId)
    .single();

  if (!profile || !["teacher", "super_admin"].includes(profile.role ?? "")) {
    console.error("[createChannel] unauthorized role:", profile?.role);
    return null;
  }

  const { data: channel, error: chErr } = await adminClient
    .schema("messaging")
    .from("channels")
    .insert({ name: name.trim(), description: description?.trim() ?? null, created_by: creatorId })
    .select("id")
    .single();

  if (chErr || !channel) {
    console.error("[createChannel] insert error:", chErr);
    return null;
  }

  await adminClient
    .schema("messaging")
    .from("channel_members")
    .insert({ channel_id: channel.id, user_id: creatorId });

  return channel.id;
}

export async function uploadChannelImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  const channelId = formData.get("channelId") as string;
  if (!file || !channelId) return { error: "Missing fields" };

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/channel-${channelId}/${timestamp}-${safeName}`;

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from("message-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = adminClient.storage
    .from("message-images")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function uploadChannelFile(
  formData: FormData
): Promise<{ url: string; name: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  const channelId = formData.get("channelId") as string;
  if (!file || !channelId) return { error: "Missing fields" };

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/channel-${channelId}/${timestamp}-${safeName}`;

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from("message-files")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = adminClient.storage
    .from("message-files")
    .getPublicUrl(path);

  return { url: publicUrl, name: file.name };
}

export async function getSenderProfile(
  userId: string
): Promise<{ full_name: string; profile_image_url: string | null } | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, profile_image_url")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return { full_name: data.full_name ?? "Unknown", profile_image_url: data.profile_image_url ?? null };
}
