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

type PushDeliveryRecipient = {
  parentName: string;
  parentEmail: string;
  studentNames?: string[];
  userId?: string;
  pushStatus: "sent" | "skipped" | "failed";
  skipReason?: string;
};

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

  const pushTitle = sender?.full_name ?? "New Message";
  const pushBody = record.body?.trim()
    ? record.body.slice(0, 140)
    : record.image_url
      ? "Sent a photo"
      : record.file_url
        ? "Sent an attachment"
        : "New message";

  const deliveryRecipients: PushDeliveryRecipient[] = [];

  if (!recipientIds.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
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
        conversationId: record.conversation_id,
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

  notifyPushDeliveryDiscord({
    source: "dm_message",
    pushTitle,
    pushBody,
    recipients: deliveryRecipients,
    metadata: {
      conversationId: record.conversation_id,
      expoTicketSummary: expoSummary || undefined,
    },
  });

  return new Response(
    JSON.stringify({ ok: true, sent, expo: expoSummary }),
    { headers: { "Content-Type": "application/json" } },
  );
});
