import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function runInBackground(promise: Promise<unknown>): void {
  const waitUntil = (
    globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }
  ).EdgeRuntime?.waitUntil;
  if (waitUntil) waitUntil(promise);
  else void promise;
}

function postJsonInBackground(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): void {
  runInBackground(
    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }).catch(() => {}),
  );
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const DEFAULT_NOTIFY_EMAIL = "sabrina.sagefield@gmail.com";
const NOTIFY_API_URL = "https://sagefield.co/api/notify/discord";
const FEED_AUTO_CHANNEL_MESSAGE_URL =
  Deno.env.get("FEED_AUTO_NOTIFY_URL") ??
  "https://sagefield.co/api/feed/auto/channel-message";

function syncCommunityChannelFeedPost(messageId: string): void {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret) return;

  postJsonInBackground(
    FEED_AUTO_CHANNEL_MESSAGE_URL,
    {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    { messageId },
  );
}

function notifyParentMessageDiscord(data: {
  parentName: string;
  parentEmail: string;
  body: string;
  messageType: "dm" | "channel";
  channelName?: string | null;
  hasImage?: boolean;
  hasFile?: boolean;
}) {
  const notifyKey = Deno.env.get("DISCORD_NOTIFY_KEY");
  if (!notifyKey) return;

  postJsonInBackground(
    NOTIFY_API_URL,
    {
      "Content-Type": "application/json",
      "x-notify-key": notifyKey,
    },
    { type: "parent_message", data },
  );
}

type PushDeliveryRecipient = {
  parentName: string;
  parentEmail: string;
  studentNames?: string[];
  userId?: string;
  pushStatus: "sent" | "skipped" | "failed";
  skipReason?: string;
};

function notifyPushDeliveryDiscord(data: {
  source: string;
  pushTitle: string;
  pushBody: string;
  recipients: PushDeliveryRecipient[];
  metadata?: Record<string, string | undefined>;
}) {
  const notifyKey = Deno.env.get("DISCORD_NOTIFY_KEY");
  if (!notifyKey) return;

  postJsonInBackground(
    NOTIFY_API_URL,
    {
      "Content-Type": "application/json",
      "x-notify-key": notifyKey,
    },
    { type: "push_delivery", data },
  );
}

async function studentNamesByParentId(
  admin: ReturnType<typeof createClient>,
  parentIds: string[],
): Promise<Map<string, string[]>> {
  if (!parentIds.length) return new Map();

  const { data: students } = await admin
    .schema("admin")
    .from("students")
    .select("parent_id, child_legal_name")
    .in("parent_id", parentIds)
    .eq("is_deleted", false);

  const map = new Map<string, string[]>();
  for (const s of students ?? []) {
    const pid = s.parent_id as string;
    const list = map.get(pid) ?? [];
    const name = s.child_legal_name as string | null;
    if (name && list.length < 3) list.push(name);
    map.set(pid, list);
  }
  return map;
}

function formatMessageBody(record: {
  body?: string | null;
  image_url?: string | null;
  file_url?: string | null;
}): string {
  if (record.body?.trim()) return record.body.slice(0, 140);
  if (record.image_url) return "Sent a photo";
  if (record.file_url) return "Sent an attachment";
  return "New message";
}

async function sendChannelMemberPush(
  admin: ReturnType<typeof createClient>,
  record: {
    channel_id: string;
    sender_id: string;
    body?: string | null;
    image_url?: string | null;
    file_url?: string | null;
  },
  senderName: string,
  channelName: string | null,
): Promise<{ sent: number; pushTitle: string; pushBody: string; recipients: PushDeliveryRecipient[]; expoSummary: string }> {
  const pushBody = formatMessageBody(record);
  const pushTitle =
    channelName && channelName !== "General"
      ? `#${channelName} · ${senderName}`
      : senderName;

  const { data: members } = await admin
    .schema("messaging")
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", record.channel_id)
    .neq("user_id", record.sender_id);

  const recipientIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  const deliveryRecipients: PushDeliveryRecipient[] = [];

  if (!recipientIds.length) {
    return { sent: 0, pushTitle, pushBody, recipients: deliveryRecipients, expoSummary: "" };
  }

  const { data: allRecipients } = await admin
    .schema("admin")
    .from("users")
    .select("id, full_name, email, push_token, role")
    .in("id", recipientIds);

  const parentIds = (allRecipients ?? [])
    .filter((u: { role: string | null }) => u.role === "parent")
    .map((u: { id: string }) => u.id);
  const studentMap = await studentNamesByParentId(admin, parentIds);

  const withToken = (allRecipients ?? []).filter(
    (u: { push_token: string | null }) => u.push_token,
  );
  const withoutToken = (allRecipients ?? []).filter(
    (u: { push_token: string | null }) => !u.push_token,
  );

  for (const u of withoutToken as {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
  }[]) {
    deliveryRecipients.push({
      parentName: u.full_name ?? "Unknown",
      parentEmail: u.email ?? "unknown",
      userId: u.id,
      studentNames: u.role === "parent" ? studentMap.get(u.id) : undefined,
      pushStatus: "skipped",
      skipReason: "no_push_token",
    });
  }

  let sent = 0;
  let expoSummary = "";

  if (withToken.length) {
    const messages = withToken.map((u: { push_token: string; role: string }) => ({
      to: u.push_token,
      title: pushTitle,
      body: pushBody,
      sound: "default",
      channelId: "messages",
      data: {
        channelId: record.channel_id,
        role: u.role,
      },
    }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    };

    const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
    if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });

    const tickets = res.ok
      ? ((await res.json()) as { data?: { status?: string; message?: string }[] }).data ?? []
      : [];

    expoSummary = res.ok ? `${tickets.length} tickets` : `HTTP ${res.status}`;

    withToken.forEach(
      (
        u: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string | null;
        },
        i: number,
      ) => {
        const ticket = tickets[i];
        const ok = ticket?.status === "ok";
        if (ok) sent += 1;
        deliveryRecipients.push({
          parentName: u.full_name ?? "Unknown",
          parentEmail: u.email ?? "unknown",
          userId: u.id,
          studentNames: u.role === "parent" ? studentMap.get(u.id) : undefined,
          pushStatus: ok ? "sent" : "failed",
          skipReason: ok ? undefined : ticket?.message ?? "expo_ticket_error",
        });
      },
    );
  }

  return { sent, pushTitle, pushBody, recipients: deliveryRecipients, expoSummary };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();
  const record = payload.record;

  if (!record?.channel_id || !record?.sender_id) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: channelRow } = await admin
    .schema("messaging")
    .from("channels")
    .select("name, is_default")
    .eq("id", record.channel_id)
    .maybeSingle();

  if (channelRow?.is_default && record.id) {
    syncCommunityChannelFeedPost(record.id);
  }

  const { data: sender } = await admin
    .schema("admin")
    .from("users")
    .select("full_name, role, email")
    .eq("id", record.sender_id)
    .single();

  const senderName = sender?.full_name ?? "New message";
  const channelName = channelRow?.name ?? null;

  let discord = false;
  if (sender?.role === "parent") {
    const notifyEmail =
      Deno.env.get("MESSAGES_NOTIFY_EMAIL") ?? DEFAULT_NOTIFY_EMAIL;

    const { data: notifyUser } = await admin
      .schema("admin")
      .from("users")
      .select("id")
      .eq("email", notifyEmail)
      .maybeSingle();

    if (notifyUser?.id) {
      const { data: membership } = await admin
        .schema("messaging")
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", record.channel_id)
        .eq("user_id", notifyUser.id)
        .maybeSingle();

      if (membership) {
        notifyParentMessageDiscord({
          parentName: sender.full_name ?? "Unknown",
          parentEmail: sender.email ?? "unknown",
          body: record.body ?? "",
          messageType: "channel",
          channelName,
          hasImage: Boolean(record.image_url),
          hasFile: Boolean(record.file_url),
        });
        discord = true;
      }
    }
  }

  const pushResult = await sendChannelMemberPush(admin, record, senderName, channelName);

  notifyPushDeliveryDiscord({
    source: "channel_message",
    pushTitle: pushResult.pushTitle,
    pushBody: pushResult.pushBody,
    recipients: pushResult.recipients,
    metadata: {
      channelName: channelName ?? undefined,
      expoTicketSummary: pushResult.expoSummary || undefined,
    },
  });

  return new Response(JSON.stringify({ ok: true, sent: pushResult.sent, discord }), {
    headers: { "Content-Type": "application/json" },
  });
});
