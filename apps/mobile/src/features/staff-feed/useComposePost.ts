// Staff "New Post": body + post type, up to 10 photos/videos and 5 documents.
// The post row is created first, then each file uploads and is tracked per
// item, so a failed upload can be retried against the same post (instead of
// silently going live without its photos). Handlers return { ok } results;
// the Garden UI (./garden) turns them into toasts and step states.
import { notifyError } from "@/lib/discord";
import { FEED_SCHOOL_YEAR } from "@/lib/feedSchoolYear";
import { supabase } from "@/lib/supabase";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_MEDIA = 10;
export const MAX_DOCS = 5;

export type UploadStatus = "idle" | "uploading" | "done" | "failed";

export interface PendingMediaItem {
  key: string;
  uri: string;
  type: "image" | "video";
  mimeType: string;
  duration?: number;
  /** Original slot so retried files keep their order in the post. */
  order: number;
  status: UploadStatus;
}

export interface PendingAttachment {
  key: string;
  uri: string;
  name: string;
  size: number | null;
  mimeType: string;
  status: UploadStatus;
}

export type SubmitResult =
  | { ok: true; uploaded: number }
  | { ok: false; stage: "post"; error: string }
  | { ok: false; stage: "uploads"; failed: number; total: number };

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const MAX_DIMENSION = 900;
const COMPRESS_QUALITY = 0.75;

let keySeq = 0;
const nextKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`;

/** Storage keys can't safely carry spaces, slashes or emoji. */
function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^\w]/g, "").slice(0, 8) : "";
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

async function uploadFileToStorage(bucket: string, storagePath: string, uri: string, contentType: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || !SUPABASE_URL) return false;
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": contentType },
    body: blob,
  });
  return res.ok;
}

async function compressImage(uri: string) {
  const r = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: MAX_DIMENSION } }], {
    compress: COMPRESS_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: r.uri, mimeType: "image/jpeg" };
}

function inferAttachmentKind(mimeType: string): "pdf" | "doc" | "sheet" | "other" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("msword")) return "doc";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "sheet";
  return "other";
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useComposePost() {
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<string>("announcement");
  const [media, setMedia] = useState<PendingMediaItem[]>([]);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  /** Set once the post row exists; uploads then attach to it. */
  const [postedId, setPostedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const lock = useRef(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  // ── Picking ───────────────────────────────────────────────────────────────
  const pickMedia = useCallback(async (): Promise<{ added: number; limit?: boolean }> => {
    const remaining = MAX_MEDIA - media.length;
    if (remaining <= 0) return { added: 0, limit: true };
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled) return { added: 0 };
    let added = 0;
    setMedia((prev) => {
      const seen = new Set(prev.map((m) => m.uri));
      const next = [...prev];
      for (const a of result.assets) {
        if (next.length >= MAX_MEDIA || seen.has(a.uri)) continue;
        seen.add(a.uri);
        next.push({
          key: nextKey(),
          uri: a.uri,
          type: a.type === "video" ? "video" : "image",
          mimeType: a.mimeType ?? (a.type === "video" ? "video/mp4" : "image/jpeg"),
          duration: a.duration ? Math.round(a.duration / 1000) : undefined,
          order: next.length,
          status: "idle",
        });
        added++;
      }
      return next;
    });
    return { added, limit: result.assets.length > remaining };
  }, [media.length]);

  const pickAttachment = useCallback(async (): Promise<{ added: number; limit?: boolean }> => {
    const remaining = MAX_DOCS - attachments.length;
    if (remaining <= 0) return { added: 0, limit: true };
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    });
    if (result.canceled) return { added: 0 };
    const items = result.assets.slice(0, remaining).map<PendingAttachment>((a) => ({
      key: nextKey(),
      uri: a.uri,
      name: a.name,
      size: a.size ?? null,
      mimeType: a.mimeType ?? "application/octet-stream",
      status: "idle",
    }));
    setAttachments((prev) => [...prev, ...items].slice(0, MAX_DOCS));
    return { added: items.length, limit: result.assets.length > remaining };
  }, [attachments.length]);

  const removeMedia = useCallback((key: string) => {
    setMedia((prev) => prev.filter((m) => m.key !== key).map((m, i) => (m.status === "done" ? m : { ...m, order: i })));
  }, []);
  const removeAttachment = useCallback((key: string) => {
    setAttachments((prev) => prev.filter((a) => a.key !== key));
  }, []);

  // ── Upload helpers (operate on explicit items + post id) ──────────────────
  const setMediaStatus = (keys: string[], status: UploadStatus) =>
    setMedia((prev) => prev.map((m) => (keys.includes(m.key) ? { ...m, status } : m)));
  const setDocStatus = (keys: string[], status: UploadStatus) =>
    setAttachments((prev) => prev.map((a) => (keys.includes(a.key) ? { ...a, status } : a)));

  const uploadAll = useCallback(
    async (
      postId: string,
      uid: string,
      mediaItems: PendingMediaItem[],
      docItems: PendingAttachment[],
      onProgress?: (done: number, total: number) => void,
    ) => {
      const total = mediaItems.length + docItems.length;
      let done = 0;
      let failed = 0;
      const tick = () => {
        done++;
        setProgress({ done, total });
        onProgress?.(done, total);
      };
      setProgress({ done: 0, total });

      // Media: upload each, then insert the rows that made it in one go.
      const mediaRows: { key: string; row: object }[] = [];
      for (const item of mediaItems) {
        setMediaStatus([item.key], "uploading");
        try {
          let uri = item.uri;
          let mime = item.mimeType;
          if (item.type === "image") {
            try {
              const c = await compressImage(item.uri);
              uri = c.uri;
              mime = c.mimeType;
            } catch {
              // Upload the original if compression fails.
            }
          }
          const ext = item.type === "image" ? "jpg" : (item.uri.split(".").pop()?.split("?")[0] ?? "mp4");
          const path = `${uid}/${postId}/${Date.now()}_${item.order}.${ext}`;
          const ok = await uploadFileToStorage("feed-media", path, uri, mime);
          if (!ok) throw new Error("upload failed");
          mediaRows.push({
            key: item.key,
            row: {
              post_id: postId,
              kind: item.type,
              storage_url: path,
              display_order: item.order,
              duration_secs: item.duration ?? null,
            },
          });
        } catch (e) {
          notifyError("staff-compose-media-upload", e);
          setMediaStatus([item.key], "failed");
          failed++;
        }
        tick();
      }
      if (mediaRows.length) {
        const { error } = await supabase.schema("feed").from("post_media").insert(mediaRows.map((r) => r.row));
        if (error) {
          notifyError("staff-compose-media-insert", error);
          setMediaStatus(mediaRows.map((r) => r.key), "failed");
          failed += mediaRows.length;
        } else {
          setMediaStatus(mediaRows.map((r) => r.key), "done");
        }
      }

      // Documents
      const docRows: { key: string; row: object }[] = [];
      for (const att of docItems) {
        setDocStatus([att.key], "uploading");
        try {
          const path = `${uid}/${postId}/${Date.now()}_${safeFileName(att.name)}`;
          const ok = await uploadFileToStorage("feed-attachments", path, att.uri, att.mimeType);
          if (!ok) throw new Error("upload failed");
          docRows.push({
            key: att.key,
            row: {
              post_id: postId,
              file_name: att.name,
              file_size_bytes: att.size,
              kind: inferAttachmentKind(att.mimeType),
              storage_url: path,
            },
          });
        } catch (e) {
          notifyError("staff-compose-attachment-upload", e);
          setDocStatus([att.key], "failed");
          failed++;
        }
        tick();
      }
      if (docRows.length) {
        const { error } = await supabase.schema("feed").from("post_attachments").insert(docRows.map((r) => r.row));
        if (error) {
          notifyError("staff-compose-attachment-insert", error);
          setDocStatus(docRows.map((r) => r.key), "failed");
          failed += docRows.length;
        } else {
          setDocStatus(docRows.map((r) => r.key), "done");
        }
      }
      return { failed, total };
    },
    [],
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(
    async (onProgress?: (done: number, total: number) => void): Promise<SubmitResult> => {
      const text = body.trim();
      if (!text) return { ok: false, stage: "post", error: "Write something first." };
      if (lock.current) return { ok: false, stage: "post", error: "Already posting." };
      lock.current = true;
      setSubmitting(true);
      try {
        let uid = userId;
        if (!uid) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          uid = user?.id ?? null;
          setUserId(uid);
        }
        if (!uid) return { ok: false, stage: "post", error: "You're signed out. Sign in and try again." };

        let postId = postedId;
        if (!postId) {
          const { data, error } = await supabase
            .schema("feed")
            .from("posts")
            .insert({
              teacher_id: uid,
              body: text,
              school_year: FEED_SCHOOL_YEAR,
              classroom: null,
              post_type: postType,
            })
            .select("id")
            .single();
          if (error || !data) {
            if (error) notifyError("staff-compose-post-create", error);
            return { ok: false, stage: "post", error: error?.message ?? "Something went wrong. Please try again." };
          }
          postId = data.id as string;
          setPostedId(postId);
        }

        // Only files not already attached (first run: all; retry: the failed ones).
        const mediaTodo = media.filter((m) => m.status !== "done");
        const docsTodo = attachments.filter((a) => a.status !== "done");
        const total = mediaTodo.length + docsTodo.length;
        if (total === 0) return { ok: true, uploaded: 0 };
        const { failed } = await uploadAll(postId, uid, mediaTodo, docsTodo, onProgress);
        if (failed > 0) return { ok: false, stage: "uploads", failed, total };
        return { ok: true, uploaded: total };
      } catch (e) {
        notifyError("staff-compose-submit", e);
        return { ok: false, stage: "post", error: e instanceof Error ? e.message : "Something went wrong." };
      } finally {
        lock.current = false;
        setSubmitting(false);
        setProgress(null);
      }
    },
    [body, postType, media, attachments, postedId, userId, uploadAll],
  );

  const failedCount =
    media.filter((m) => m.status === "failed").length + attachments.filter((a) => a.status === "failed").length;
  const hasContent = body.trim().length > 0 || media.length > 0 || attachments.length > 0;

  return {
    body,
    setBody,
    postType,
    setPostType,
    media,
    attachments,
    pickMedia,
    pickAttachment,
    removeMedia,
    removeAttachment,
    submit,
    submitting,
    progress,
    postedId,
    failedCount,
    hasContent,
    canPost: body.trim().length > 0 && !submitting,
  };
}

export type ComposePost = ReturnType<typeof useComposePost>;
