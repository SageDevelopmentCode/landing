import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  if (!notifyUser?.id) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_notify_user" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: membership } = await admin
    .schema("messaging")
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", record.channel_id)
    .eq("user_id", notifyUser.id)
    .maybeSingle();

  if (!membership) {
    return new Response(JSON.stringify({ ok: true, skipped: "not_member" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

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

  return new Response(JSON.stringify({ ok: true, discord: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
