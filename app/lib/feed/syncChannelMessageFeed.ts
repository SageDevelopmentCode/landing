import { createAdminClient } from "@/app/lib/supabase-server";
import {
  channelMessageCtaRoute,
  channelMessageFeedBody,
  createAutoFeedPost,
} from "@/app/lib/feed/autoFeedPost";

export async function syncChannelMessageFeedPost(
  messageId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: message, error: msgErr } = await admin
    .schema("messaging")
    .from("channel_messages")
    .select("id, channel_id, sender_id, body, image_url, file_url")
    .eq("id", messageId)
    .maybeSingle();

  if (msgErr || !message) {
    return { ok: false, error: msgErr?.message ?? "Message not found" };
  }

  const { data: channel, error: chErr } = await admin
    .schema("messaging")
    .from("channels")
    .select("id, name, is_default")
    .eq("id", message.channel_id)
    .maybeSingle();

  if (chErr || !channel) {
    return { ok: false, error: chErr?.message ?? "Channel not found" };
  }

  if (!channel.is_default) {
    return { ok: true };
  }

  const { data: sender, error: senderErr } = await admin
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", message.sender_id)
    .maybeSingle();

  if (senderErr) {
    return { ok: false, error: senderErr.message };
  }

  const senderName = sender?.full_name?.trim() || "Someone";
  const channelName = channel.name?.trim() || "Community";

  const result = await createAutoFeedPost({
    authorUserId: message.sender_id,
    postType: "community",
    body: channelMessageFeedBody(senderName, channelName, message),
    sourceType: "channel_message",
    sourceId: message.id,
    ctaLabel: "View community",
    ctaRoute: channelMessageCtaRoute(message.channel_id, false),
    ctaRouteStaff: channelMessageCtaRoute(message.channel_id, true),
  });

  if (!result.success) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}
