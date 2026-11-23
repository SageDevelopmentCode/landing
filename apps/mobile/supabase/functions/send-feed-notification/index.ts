  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

  const POST_TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
    announcement: { emoji: "📢", label: "Announcement" },
    field_friday:  { emoji: "🌿", label: "Field Friday" },
    aftercare:     { emoji: "🌙", label: "Aftercare" },
    event:         { emoji: "🎉", label: "Event" },
    reminder:      { emoji: "🔔", label: "Reminder" },
    newsletter:    { emoji: "📰", label: "Newsletter" },
    update:        { emoji: "📝", label: "Update" },
    activity:      { emoji: "🎨", label: "Activity" },
    primary:       { emoji: "⭐", label: "Primary" },
    upper_school:  { emoji: "📚", label: "Upper School" },
    general:       { emoji: "💬", label: "General" },
  };

  Deno.serve(async (req) => {
    const secret = Deno.env.get("WEBHOOK_SECRET");
    if (!secret || req.headers.get("x-webhook-secret") !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const record = payload.record;

    if (!record?.id || !record?.teacher_id) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      (Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
    );

    const [{ data: parents }, { data: teacher }] = await Promise.all([
      admin
        .schema("admin")
        .from("users")
        .select("push_token")
        .eq("role", "parent")
        .not("push_token", "is", null),
      admin
        .schema("admin")
        .from("users")
        .select("full_name")
        .eq("id", record.teacher_id)
        .single(),
    ]);

    if (!parents?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const postTypeInfo = POST_TYPE_LABELS[record.post_type ?? ""] ?? { emoji: "📬",
   label: "Post" };
    const title = `${postTypeInfo.emoji} New ${postTypeInfo.label}`;
    const body = (record.body ?? "").slice(0, 140);

    const messages = parents.map((u: { push_token: string }) => ({
      to: u.push_token,
      title,
      body,
      sound: "default",
      channelId: "messages",
      data: { postId: record.id },
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

