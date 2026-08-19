import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type ActivityRecord = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  is_deleted: boolean;
  activity_date: string | null;
};

function formatTitle(record: ActivityRecord): string {
  if (record.activity_date) {
    const d = new Date(`${record.activity_date}T12:00:00`);
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `🎨 New Activity · ${formatted}`;
  }
  return "🎨 New Activity";
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
  const record = payload.record as ActivityRecord | undefined;

  if (
    !record?.id ||
    record.status !== "published" ||
    record.visibility !== "public" ||
    record.is_deleted
  ) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: parents } = await admin
    .schema("admin")
    .from("users")
    .select("push_token")
    .eq("role", "parent")
    .not("push_token", "is", null);

  if (!parents?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const title = formatTitle(record);
  const body = (record.title ?? "New activity").slice(0, 140);

  const messages = parents.map((p: { push_token: string }) => ({
    to: p.push_token,
    title,
    body,
    sound: "default",
    channelId: "messages",
    data: { activityId: record.id },
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

  return new Response(
    JSON.stringify({ ok: true, sent: messages.length, expo: await res.json() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
