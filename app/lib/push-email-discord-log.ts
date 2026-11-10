import { sendDiscordNotification } from "@/app/lib/discord";

export type PushDeliverySource =
  | "activity_preference_reminder"
  | "dm_message"
  | "channel_message"
  | "activity_published"
  | "staff_broadcast";

export type DeliveryStatus = "sent" | "skipped" | "failed";

export type PushDeliveryRecipient = {
  parentName: string;
  parentEmail: string;
  studentNames?: string[];
  userId?: string;
  pushStatus: DeliveryStatus;
  skipReason?: string;
  emailStatus?: DeliveryStatus;
  emailSubject?: string;
};

export type PushDeliveryEvent = {
  source: PushDeliverySource;
  pushTitle: string;
  pushBody: string;
  recipients: PushDeliveryRecipient[];
  metadata?: {
    channelName?: string | null;
    activityId?: string;
    conversationId?: string;
    expoTicketSummary?: string;
  };
};

const SOURCE_LABEL: Record<PushDeliverySource, string> = {
  activity_preference_reminder: "Activity preference reminder",
  dm_message: "Direct message push",
  channel_message: "Community channel push",
  activity_published: "New activity push",
  staff_broadcast: "Staff broadcast push",
};

const SOURCE_COLOR: Record<PushDeliverySource, number> = {
  activity_preference_reminder: 0x4a7c59,
  dm_message: 0x5865f2,
  channel_message: 0x6b8a6b,
  activity_published: 0xe07a3a,
  staff_broadcast: 0x9b59b6,
};

function formatRecipientLine(r: PushDeliveryRecipient): string {
  const students =
    r.studentNames?.length ? ` · ${r.studentNames.join(", ")}` : "";
  const emailPart = r.emailStatus
    ? ` · email: ${r.emailStatus}${r.emailSubject ? ` (${r.emailSubject.slice(0, 60)})` : ""}`
    : "";
  const pushPart =
    r.pushStatus === "sent"
      ? " · push: sent"
      : ` · push: ${r.pushStatus}${r.skipReason ? ` (${r.skipReason})` : ""}`;
  return `• **${r.parentName}** (${r.parentEmail})${students}${emailPart}${pushPart}`;
}

function buildRecipientField(
  label: string,
  rows: PushDeliveryRecipient[],
  filter: (r: PushDeliveryRecipient) => boolean,
): { name: string; value: string; inline: false } | null {
  const filtered = rows.filter(filter);
  if (!filtered.length) return null;

  const lines: string[] = [];
  let truncated = 0;
  for (const r of filtered) {
    const line = formatRecipientLine(r);
    const next = [...lines, line].join("\n");
    if (next.length > 1020) {
      truncated = filtered.length - lines.length;
      break;
    }
    lines.push(line);
  }

  let value = lines.join("\n");
  if (truncated > 0) {
    value += `\n_+${truncated} more_`;
  }

  return { name: `${label} (${filtered.length})`, value, inline: false };
}

export function createPushDeliveryEmbed(event: PushDeliveryEvent) {
  const sent = event.recipients.filter((r) => r.pushStatus === "sent").length;
  const skipped = event.recipients.filter((r) => r.pushStatus === "skipped").length;
  const failed = event.recipients.filter((r) => r.pushStatus === "failed").length;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Push title", value: event.pushTitle.slice(0, 256) || "—", inline: false },
    { name: "Push body", value: event.pushBody.slice(0, 1024) || "—", inline: false },
    {
      name: "Summary",
      value: `Push: **${sent}** sent · **${skipped}** skipped · **${failed}** failed`,
      inline: false,
    },
  ];

  if (event.metadata?.channelName) {
    fields.push({
      name: "Channel",
      value: event.metadata.channelName,
      inline: true,
    });
  }
  if (event.metadata?.conversationId) {
    fields.push({
      name: "Conversation",
      value: event.metadata.conversationId.slice(0, 36),
      inline: true,
    });
  }
  if (event.metadata?.expoTicketSummary) {
    fields.push({
      name: "Expo",
      value: event.metadata.expoTicketSummary.slice(0, 1024),
      inline: false,
    });
  }

  const sentField = buildRecipientField("Delivered", event.recipients, (r) => r.pushStatus === "sent");
  const skippedField = buildRecipientField(
    "Skipped (no device / token)",
    event.recipients,
    (r) => r.pushStatus === "skipped",
  );
  const failedField = buildRecipientField("Failed", event.recipients, (r) => r.pushStatus === "failed");

  if (sentField) fields.push(sentField);
  if (skippedField) fields.push(skippedField);
  if (failedField) fields.push(failedField);

  if (event.recipients.length === 1) {
    const r = event.recipients[0];
    fields.push({
      name: "Recipient",
      value: formatRecipientLine(r).replace(/^•\s*/, ""),
      inline: false,
    });
  }

  return {
    title: `📲 ${SOURCE_LABEL[event.source]}`,
    color: SOURCE_COLOR[event.source],
    fields,
    timestamp: new Date().toISOString(),
  };
}

export async function notifyPushDelivery(event: PushDeliveryEvent): Promise<void> {
  const url = process.env.DISCORD_PUSH_EMAIL_SENT_WEBHOOK_URL;
  if (!url) return;

  const embed = createPushDeliveryEmbed(event);
  await sendDiscordNotification(embed, url).catch(() => {});
}
