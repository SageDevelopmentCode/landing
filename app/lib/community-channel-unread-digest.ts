import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createCommunityChannelDigestSentEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import { notifyPushDelivery } from "@/app/lib/push-email-discord-log";
import type {
  CommunityChannelDigestChannel,
  CommunityChannelDigestMessage,
} from "@/app/lib/community-channel-digest-types";
import {
  buildCommunityChannelUnreadDigestEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

const DONT_INCLUDE_TAG = "Don't Include";
const MESSAGES_PER_CHANNEL = 8;

type ApplicationRow = {
  user_id: string | null;
  g1_email: string | null;
  g1_full_name: string | null;
  admin_tags: string[] | null;
};

type ParentRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type ChannelMetaRow = {
  channel_id: string;
  name: string;
  is_member: boolean;
  unread_count: number;
};

type ChannelMessageRow = {
  id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

export type CommunityChannelDigestSentRow = {
  userId: string;
  parentName: string;
  parentEmail: string;
  channelNames: string[];
  messageCount: number;
  emailSent: boolean;
  emailSubject: string;
};

export type CommunityChannelDigestCronResult = {
  sent: number;
  skipped: number;
  errors: string[];
  digests: CommunityChannelDigestSentRow[];
};

function messagePreview(m: ChannelMessageRow): string {
  if (m.body?.trim()) return m.body.trim();
  if (m.image_url) return "📷 Shared a photo";
  if (m.file_url) return `📎 Shared ${m.file_name?.trim() || "an attachment"}`;
  return "New message";
}

function isEligibleParent(apps: ApplicationRow[]): boolean {
  return apps.some((a) => !(a.admin_tags ?? []).includes(DONT_INCLUDE_TAG));
}

async function fetchLastDigestSentByUser(
  db: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await db.rpc(
    "get_last_community_channel_digest_sent",
    { p_user_ids: userIds },
  );

  if (error) throw new Error(error.message);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.user_id as string, row.sent_at as string);
  }
  return map;
}

async function buildDigestChannelsForUser(
  db: SupabaseClient,
  userId: string,
  lastSentAt: string | null,
  channelsWithUnread: ChannelMetaRow[],
  digestCutoffIso?: string,
): Promise<CommunityChannelDigestChannel[]> {
  const digestChannels: CommunityChannelDigestChannel[] = [];
  const cutoff = lastSentAt ?? "1970-01-01T00:00:00.000Z";

  for (const ch of channelsWithUnread) {
    const { data: membership } = await db
      .schema("messaging")
      .from("channel_members")
      .select("last_read_at")
      .eq("channel_id", ch.channel_id)
      .eq("user_id", userId)
      .maybeSingle();

    const lastReadAt = membership?.last_read_at as string | null;
    const readFloor = lastReadAt ?? "1970-01-01T00:00:00.000Z";
    const floorIso = new Date(
      Math.max(new Date(readFloor).getTime(), new Date(cutoff).getTime()),
    ).toISOString();

    let msgQuery = db
      .schema("messaging")
      .from("channel_messages")
      .select("id, sender_id, body, image_url, file_url, file_name, created_at")
      .eq("channel_id", ch.channel_id)
      .neq("sender_id", userId)
      .gt("created_at", floorIso);

    if (digestCutoffIso) {
      msgQuery = msgQuery.lte("created_at", digestCutoffIso);
    }

    const { data: msgs, error } = await msgQuery.order("created_at", {
      ascending: true,
    });

    if (error) throw new Error(error.message);

    const allUnread = (msgs ?? []) as ChannelMessageRow[];
    if (allUnread.length === 0) continue;

    const capped = allUnread.slice(0, MESSAGES_PER_CHANNEL);
    const senderIds = [...new Set(capped.map((m) => m.sender_id))];

    const { data: senders } = await db
      .schema("admin")
      .from("users")
      .select("id, full_name")
      .in("id", senderIds.length ? senderIds : ["00000000-0000-0000-0000-000000000000"]);

    const senderMap = new Map(
      (senders ?? []).map((u: { id: string; full_name: string | null }) => [
        u.id,
        u.full_name ?? "Someone",
      ]),
    );

    const messages: CommunityChannelDigestMessage[] = capped.map((m) => ({
      senderName: senderMap.get(m.sender_id) ?? "Someone",
      preview: messagePreview(m),
      createdAt: m.created_at,
    }));

    const unreadCount = Number(ch.unread_count ?? allUnread.length);
    const moreUnreadCount = Math.max(0, allUnread.length - capped.length);

    digestChannels.push({
      channelId: ch.channel_id,
      channelName: ch.name,
      unreadCount,
      messages,
      moreUnreadCount,
    });
  }

  return digestChannels;
}

export async function buildCommunityChannelDigestForUser(
  db: SupabaseClient,
  userId: string,
  lastSentAt: string | null,
  digestCutoffIso?: string,
): Promise<CommunityChannelDigestChannel[] | null> {
  const { data: meta, error } = await db.rpc("get_channels_with_meta", {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);

  const withUnread = ((meta ?? []) as ChannelMetaRow[]).filter(
    (row) => row.is_member && Number(row.unread_count ?? 0) > 0,
  );

  if (withUnread.length === 0) return null;

  const channels = await buildDigestChannelsForUser(
    db,
    userId,
    lastSentAt,
    withUnread,
    digestCutoffIso,
  );

  if (channels.length === 0) return null;

  return channels;
}

export async function maybeSendCommunityChannelUnreadDigests(
  db: SupabaseClient,
  now = new Date(),
): Promise<CommunityChannelDigestCronResult> {
  const appsRes = await db
    .schema("parent_app")
    .from("applications")
    .select("user_id, g1_email, g1_full_name, admin_tags")
    .eq("status", "enrolled")
    .not("user_id", "is", null);

  if (appsRes.error) throw new Error(appsRes.error.message);

  const appsByUser = new Map<string, ApplicationRow[]>();
  for (const row of (appsRes.data ?? []) as ApplicationRow[]) {
    if (!row.user_id) continue;
    const list = appsByUser.get(row.user_id) ?? [];
    list.push(row);
    appsByUser.set(row.user_id, list);
  }

  const eligibleUserIds = [...appsByUser.entries()]
    .filter(([, apps]) => isEligibleParent(apps))
    .map(([id]) => id);

  const result: CommunityChannelDigestCronResult = {
    sent: 0,
    skipped: 0,
    errors: [],
    digests: [],
  };

  if (eligibleUserIds.length === 0) return result;

  const [parentsRes, lastSentMap] = await Promise.all([
    db
      .schema("admin")
      .from("users")
      .select("id, email, full_name")
      .in("id", eligibleUserIds),
    fetchLastDigestSentByUser(db, eligibleUserIds),
  ]);

  if (parentsRes.error) throw new Error(parentsRes.error.message);

  const parentById = new Map(
    ((parentsRes.data ?? []) as ParentRow[]).map((p) => [p.id, p]),
  );

  for (const userId of eligibleUserIds) {
    const parent = parentById.get(userId);
    const apps = appsByUser.get(userId) ?? [];
    const fallbackApp = apps[0];
    const parentEmail = parent?.email ?? fallbackApp?.g1_email ?? null;
    const parentName =
      parent?.full_name ?? fallbackApp?.g1_full_name ?? "Parent";

    if (!parentEmail) {
      result.skipped += 1;
      result.errors.push(`No email for parent user ${userId}`);
      continue;
    }

    try {
      const lastSentAt = lastSentMap.get(userId) ?? null;
      const digestCutoffIso = new Date().toISOString();
      const channels = await buildCommunityChannelDigestForUser(
        db,
        userId,
        lastSentAt,
        digestCutoffIso,
      );

      if (!channels?.length) {
        result.skipped += 1;
        continue;
      }

      const messageCount = channels.reduce((s, c) => s + c.messages.length, 0);
      const { subject, content } = await buildCommunityChannelUnreadDigestEmail({
        parentFullName: parentName,
        channels,
      });

      const emailResult = await sendZohoEmail({
        toAddress: parentEmail,
        subject,
        content,
      });

      if (!emailResult.success) {
        result.errors.push(
          emailResult.error ?? `Failed to email ${parentEmail}`,
        );
        continue;
      }

      const logRes = await db
        .schema("parent_app")
        .from("community_channel_digest_log")
        .insert({
          user_id: userId,
          message_count: messageCount,
          channel_ids: channels.map((c) => c.channelId),
          sent_at: digestCutoffIso,
        });

      if (logRes.error) {
        result.errors.push(
          `Digest sent to ${parentEmail} but log failed: ${logRes.error.message}`,
        );
      }

      result.sent += 1;
      result.digests.push({
        userId,
        parentName,
        parentEmail,
        channelNames: channels.map((c) => c.channelName),
        messageCount,
        emailSent: true,
        emailSubject: subject,
      });
    } catch (err) {
      result.errors.push(
        err instanceof Error
          ? `${parentEmail}: ${err.message}`
          : `Unknown error for ${parentEmail}`,
      );
    }
  }

  if (result.digests.length > 0) {
    const familyWord = result.digests.length === 1 ? "family" : "families";
    const channelSummary = [
      ...new Set(
        result.digests.flatMap((d) =>
          d.channelNames.map((n) => n.split(" —")[0].trim()),
        ),
      ),
    ].join(", ");

    await notifyPushDelivery({
      source: "community_channel_digest",
      pushTitle: "Community unread digest",
      pushBody: `${result.digests.length} ${familyWord} · daily cron`,
      recipients: result.digests.map((d) => ({
        parentName: d.parentName,
        parentEmail: d.parentEmail,
        userId: d.userId,
        pushStatus: "skipped",
        skipReason: "email_only",
        emailStatus: d.emailSent ? "sent" : "failed",
        emailSubject: d.emailSubject,
      })),
      metadata: channelSummary ? { channelName: channelSummary } : undefined,
    });

    const dateLabel = now.toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const embed = createCommunityChannelDigestSentEmbed({
      date: dateLabel,
      digests: result.digests,
    });
    await sendDiscordNotification(
      embed,
      process.env.DISCORD_REMINDERS_SENT_WEBHOOK_URL,
    );
  }

  return result;
}
