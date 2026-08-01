import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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

  if (!parts?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: users } = await admin
    .schema("admin")
    .from("users")
    .select("push_token, role")
    .in("id", parts.map((p: { user_id: string }) => p.user_id))
    .not("push_token", "is", null);

  if (!users?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: sender } = await admin
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", record.sender_id)
    .single();

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
