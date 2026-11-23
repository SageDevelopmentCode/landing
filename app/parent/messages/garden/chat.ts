import type { ConversationWithMeta, MessageRow } from "../actions";

/** Inbox preview for a message that only carries a photo or file (mobile copy). */
export const ATTACHMENT_PREVIEW = "Sent an attachment";

/** Same sender within this window renders as one bubble group. */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type LocalStatus = "sending" | "failed";

/** What a not-yet-confirmed message needs so it can be retried without losing anything. */
export type PendingPayload = {
  body: string;
  imageFile: File | null;
  /** Set once the image upload succeeded, so a retry doesn't upload it twice. */
  imageUrl?: string;
  /** Local object URL used to preview the photo in the bubble. Revoked when the bubble goes away. */
  imagePreview: string | null;
  attachedFile: File | null;
  fileUrl?: string;
  fileName?: string;
};

/** A message in the thread: a server row, or a local one that is sending or failed. */
export type ThreadMessage = MessageRow & {
  status?: LocalStatus;
  pending?: PendingPayload;
};

export type ChatItem =
  | { type: "day"; key: string; iso: string }
  | { type: "message"; key: string; msg: ThreadMessage; groupStart: boolean; groupEnd: boolean };

function sameGroup(a: ThreadMessage | undefined, b: ThreadMessage | undefined): boolean {
  if (!a || !b) return false;
  if (a.sender_id !== b.sender_id) return false;
  if (new Date(a.created_at).toDateString() !== new Date(b.created_at).toDateString()) return false;
  return Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < GROUP_WINDOW_MS;
}

/** Day separators + sender grouping (same sender within 5 minutes). Oldest first. */
export function buildChatItems(messages: ThreadMessage[]): ChatItem[] {
  const items: ChatItem[] = [];
  let lastDay = "";
  messages.forEach((msg, i) => {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: "day", key: `day-${day}`, iso: msg.created_at });
      lastDay = day;
    }
    items.push({
      type: "message",
      key: msg.id,
      msg,
      groupStart: !sameGroup(messages[i - 1], msg),
      groupEnd: !sameGroup(msg, messages[i + 1]),
    });
  });
  return items;
}

export function sortByRecent(convos: ConversationWithMeta[]): ConversationWithMeta[] {
  return [...convos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

/** Moves the conversation's preview to the given message and re-sorts the inbox. */
export function withLastMessage(
  convos: ConversationWithMeta[],
  conversationId: string,
  msg: { body: string; created_at: string; sender_id: string },
): ConversationWithMeta[] {
  return sortByRecent(
    convos.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: { body: msg.body, created_at: msg.created_at, sender_id: msg.sender_id }, updated_at: msg.created_at }
        : c,
    ),
  );
}

export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif");
}

/** Converts HEIC/HEIF → JPEG (browsers can't display HEIC natively). Throws if conversion fails. */
export async function toDisplayableImage(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
}

export const IMAGE_ACCEPT = "image/*,.heic,.heif";
export const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

export function roleLabel(role: string | null | undefined): string {
  if (role === "teacher" || role === "super_admin") return "Teacher";
  if (role === "parent") return "Parent";
  return "";
}

export type Recipient = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  role?: string | null;
};
