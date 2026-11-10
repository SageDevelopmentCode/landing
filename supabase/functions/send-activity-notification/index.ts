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

type ActivityRecord = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  is_deleted: boolean;
  activity_date: string | null;
};

type PushDeliveryRecipient = {
  parentName: string;
  parentEmail: string;
  studentNames?: string[];
  userId?: string;
  pushStatus: "sent" | "skipped" | "failed";
  skipReason?: string;
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

  const pushTitle = formatTitle(record);
  const pushBody = (record.title ?? "New activity").slice(0, 140);

  const { data: parents } = await admin
    .schema("admin")
    .from("users")
    .select("id, full_name, email, push_token")
    .eq("role", "parent")
    .eq("is_deleted", false);

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
    source: "activity_published",
    pushTitle,
    pushBody,
    recipients: deliveryRecipients,
    metadata: {
      activityId: record.id,
      expoTicketSummary: expoSummary || undefined,
    },
  });

  return new Response(
    JSON.stringify({ ok: true, sent, expo: expoSummary }),
    { headers: { "Content-Type": "application/json" } },
  );
});
