// Shared chat helpers: attachment picking/uploading and date labels.
import { supabase } from "@/lib/supabase";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export type PendingImage = { uri: string; fileName: string; mimeType: string };
export type PendingFile = { uri: string; name: string; mimeType: string };

export type PickResult<T> =
  | { ok: true; value: T }
  | { ok: false; canceled?: boolean; permissionDenied?: boolean; error?: string };

export async function pickChatImage(): Promise<PickResult<PendingImage>> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return { ok: false, permissionDenied: true };
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return { ok: false, canceled: true };
    const compressed = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    return { ok: true, value: { uri: compressed.uri, fileName: `photo_${Date.now()}.jpg`, mimeType: "image/jpeg" } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : undefined };
  }
}

export async function pickChatFile(): Promise<PickResult<PendingFile>> {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.canceled) return { ok: false, canceled: true };
    const a = result.assets[0];
    return { ok: true, value: { uri: a.uri, name: a.name, mimeType: a.mimeType ?? "application/octet-stream" } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : undefined };
  }
}

/** Upload for direct messages (same buckets/paths/public URL as before). */
export async function uploadDmAttachment(
  bucket: "message-images" | "message-files",
  userId: string,
  conversationId: string,
  uri: string,
  name: string,
  contentType: string,
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${conversationId}/${Date.now()}-${safeName}`;
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (days < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export type ChatListItem<M> =
  | { type: "message"; msg: M; isGroupStart: boolean; isGroupEnd: boolean; key: string }
  | { type: "date"; label: string; key: string };

/** Day separators + sender grouping (same sender within 5 minutes). Oldest first. */
export function buildChatItems<M extends { id: string; sender_id: string; created_at: string }>(
  messages: M[],
): ChatListItem<M>[] {
  const items: ChatListItem<M>[] = [];
  let lastDay: string | null = null;
  const sameGroup = (a?: M, b?: M) =>
    !!a &&
    !!b &&
    a.sender_id === b.sender_id &&
    new Date(a.created_at).toDateString() === new Date(b.created_at).toDateString() &&
    Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60 * 1000;
  messages.forEach((msg, i) => {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: "date", label: formatDateLabel(msg.created_at), key: `date-${day}` });
      lastDay = day;
    }
    items.push({
      type: "message",
      msg,
      isGroupStart: !sameGroup(messages[i - 1], msg),
      isGroupEnd: !sameGroup(msg, messages[i + 1]),
      key: msg.id,
    });
  });
  return items;
}
