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

  if (!record?.conversation_id || !record?.sender_id) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: parts } = await admin
    .schema("messaging")
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", record.conversation_id)
    .neq("user_id", record.sender_id);

  const recipientIds = (parts ?? []).map((p: { user_id: string }) => p.user_id);

  const { data: sender } = await admin
    .schema("admin")
    .from("users")
    .select("full_name, role, email")
    .eq("id", record.sender_id)
    .single();

  if (sender?.role === "parent" && recipientIds.length > 0) {
    const notifyEmail =
      Deno.env.get("MESSAGES_NOTIFY_EMAIL") ?? DEFAULT_NOTIFY_EMAIL;
    const { data: recipients } = await admin
      .schema("admin")
      .from("users")
      .select("email")
      .in("id", recipientIds);

    const shouldNotifyDiscord = (recipients ?? []).some(
      (r: { email: string | null }) =>
        r.email?.toLowerCase() === notifyEmail.toLowerCase(),
    );

    if (shouldNotifyDiscord) {
      notifyParentMessageDiscord({
        parentName: sender.full_name ?? "Unknown",
        parentEmail: sender.email ?? "unknown",
        body: record.body ?? "",
        messageType: "dm",
        hasImage: Boolean(record.image_url),
        hasFile: Boolean(record.file_url),
      });
    }
  }

  if (!recipientIds.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: users } = await admin
    .schema("admin")
    .from("users")
    .select("push_token, role")
    .in("id", recipientIds)
    .not("push_token", "is", null);

  if (!users?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = users.map((u: { push_token: string; role: string }) => ({
    to: u.push_token,
    title: sender?.full_name ?? "New Message",
    body: record.body || "Sent an attachment",
    sound: "default",
    channelId: "messages",
    data: {
      conversationId: record.conversation_id,
      role: u.role,
    },
  }));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate",
  };

  const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (expoToken) headers["Authorization"] = `Bearer ${expoToken}`;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  return new Response(
    JSON.stringify({ ok: true, sent: messages.length, expo: await res.json() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
