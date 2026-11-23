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
const NOTIFY_API_URL = "https://sagefield.co/api/notify/discord";

const POST_TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  announcement: { emoji: "📢", label: "Announcement" },
  field_friday: { emoji: "🌿", label: "Field Friday" },
  aftercare: { emoji: "🌙", label: "Aftercare" },
  event: { emoji: "🎉", label: "Event" },
  reminder: { emoji: "🔔", label: "Reminder" },
  newsletter: { emoji: "📰", label: "Newsletter" },
  update: { emoji: "📝", label: "Update" },
  activity: { emoji: "🎨", label: "Activity" },
  primary: { emoji: "⭐", label: "Primary" },
  upper_school: { emoji: "📚", label: "Upper School" },
  general: { emoji: "💬", label: "General" },
};

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

  const postTypeInfo = POST_TYPE_LABELS[record.post_type ?? ""] ?? {
    emoji: "📬",
    label: "Post",
  };
  const pushTitle = `${postTypeInfo.emoji} New ${postTypeInfo.label}`;
  const pushBody = (record.body ?? "").slice(0, 140);

  const [{ data: parents }, { data: teacher }] = await Promise.all([
    admin
      .schema("admin")
      .from("users")
      .select("id, full_name, email, push_token")
      .eq("role", "parent")
      .eq("is_deleted", false),
    admin
      .schema("admin")
      .from("users")
      .select("full_name")
      .eq("id", record.teacher_id)
      .single(),
  ]);

  void teacher;

  const allParents = parents ?? [];
  const parentIds = allParents.map((p: { id: string }) => p.id);
  const studentMap = await studentNamesByParentId(admin, parentIds);

  const deliveryRecipients: PushDeliveryRecipient[] = [];
  const withToken = allParents.filter((p: { push_token: string | null }) => p.push_token);
  const withoutToken = allParents.filter((p: { push_token: string | null }) => !p.push_token);

  for (const p of withoutToken as {
    id: string;
    full_name: string | null;
    email: string | null;
  }[]) {
    deliveryRecipients.push({
      parentName: p.full_name ?? "Unknown",
      parentEmail: p.email ?? "unknown",
      userId: p.id,
      studentNames: studentMap.get(p.id),
      pushStatus: "skipped",
      skipReason: "no_push_token",
    });
  }

  let sent = 0;
  let expoSummary = "";

  if (withToken.length) {
    const messages = withToken.map((p: { push_token: string }) => ({
      to: p.push_token,
      title: pushTitle,
      body: pushBody,
      sound: "default",
      channelId: "messages",
      data: { postId: record.id },
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
        p: { id: string; full_name: string | null; email: string | null },
        i: number,
      ) => {
        const ticket = tickets[i];
        const ok = ticket?.status === "ok";
        if (ok) sent += 1;
        deliveryRecipients.push({
          parentName: p.full_name ?? "Unknown",
          parentEmail: p.email ?? "unknown",
          userId: p.id,
          studentNames: studentMap.get(p.id),
          pushStatus: ok ? "sent" : "failed",
          skipReason: ok ? undefined : ticket?.message ?? "expo_ticket_error",
        });
      },
    );
  }

  notifyPushDeliveryDiscord({
    source: "feed_post",
    pushTitle,
    pushBody,
    recipients: deliveryRecipients,
    metadata: {
      postId: String(record.id),
      expoTicketSummary: expoSummary || undefined,
    },
  });

  return new Response(
    JSON.stringify({ ok: true, sent, expo: expoSummary }),
    { headers: { "Content-Type": "application/json" } },
  );
});
