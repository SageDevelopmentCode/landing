import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const DEFAULT_NOTIFY_EMAIL = "sabrina.sagefield@gmail.com";
const NOTIFY_API_URL = "https://sagefield.co/api/notify/discord";

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

  void fetch(NOTIFY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-notify-key": notifyKey,
    },
    body: JSON.stringify({
      type: "parent_message",
      data,
    }),
  }).catch(() => {});
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

async function sendGeneralChannelPush(
  admin: ReturnType<typeof createClient>,
  record: { channel_id: string; sender_id: string; body?: string | null; image_url?: string | null; file_url?: string | null },
  senderName: string,
): Promise<number> {
  const { data: channel } = await admin
    .schema("messaging")
    .from("channels")
    .select("is_default")
    .eq("id", record.channel_id)
    .single();

  if (!channel?.is_default) return 0;

  const { data: members } = await admin
    .schema("messaging")
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", record.channel_id)
    .neq("user_id", record.sender_id);

  const recipientIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  if (!recipientIds.length) return 0;

  const { data: users } = await admin
    .schema("admin")
    .from("users")
    .select("push_token, role")
    .in("id", recipientIds)
    .not("push_token", "is", null);

  if (!users?.length) return 0;

  const body = formatMessageBody(record);
  const messages = users.map((u: { push_token: string; role: string }) => ({
    to: u.push_token,
    title: senderName,
    body,
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

  await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  return messages.length;
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

  const { data: sender } = await admin
    .schema("admin")
    .from("users")
    .select("full_name, role, email")
    .eq("id", record.sender_id)
    .single();

  if (sender?.role !== "parent") {
    return new Response(JSON.stringify({ ok: true, skipped: "not_parent" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const notifyEmail =
    Deno.env.get("MESSAGES_NOTIFY_EMAIL") ?? DEFAULT_NOTIFY_EMAIL;

  const { data: notifyUser } = await admin
    .schema("admin")
    .from("users")
    .select("id")
    .eq("email", notifyEmail)
    .maybeSingle();

  let discord = false;
  if (notifyUser?.id) {
    const { data: membership } = await admin
      .schema("messaging")
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", record.channel_id)
      .eq("user_id", notifyUser.id)
      .maybeSingle();

    if (membership) {
      const { data: channel } = await admin
        .schema("messaging")
        .from("channels")
        .select("name")
        .eq("id", record.channel_id)
        .single();

      notifyParentMessageDiscord({
        parentName: sender.full_name ?? "Unknown",
        parentEmail: sender.email ?? "unknown",
        body: record.body ?? "",
        messageType: "channel",
        channelName: channel?.name ?? null,
        hasImage: Boolean(record.image_url),
        hasFile: Boolean(record.file_url),
      });
      discord = true;
    }
  }

  const sent = await sendGeneralChannelPush(
    admin,
    record,
    sender.full_name ?? "New message",
  );

  return new Response(JSON.stringify({ ok: true, sent, discord }), {
    headers: { "Content-Type": "application/json" },
  });
});
