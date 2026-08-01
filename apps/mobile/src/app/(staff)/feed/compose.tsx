import { Brand, FontFamilies } from "@/constants/theme";
import { POST_TYPES } from "@/constants/postTypes";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingMediaItem {
  uri: string;
  type: "image" | "video";
  mimeType: string;
  duration?: number;
  fileName?: string;
}

interface PendingAttachment {
  uri: string;
  name: string;
  size: number | null;
  mimeType: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

async function uploadFileToStorage(
  bucket: string,
  storagePath: string,
  uri: string,
  contentType: string
): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { console.log("[uploadFileToStorage] no session"); return false; }

  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();
  console.log("[uploadFileToStorage] blob size:", blob.size);

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;
  console.log("[uploadFileToStorage] POST", uploadUrl);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": contentType,
    },
    body: blob,
  });
  const bodyText = await response.text();
  console.log("[uploadFileToStorage] status:", response.status, "body:", bodyText);
  return response.ok;
}

const MAX_DIMENSION = 900;
const COMPRESS_QUALITY = 0.75;

async function compressImage(uri: string): Promise<{ uri: string; mimeType: string }> {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return { uri: manipResult.uri, mimeType: "image/jpeg" };
}

function inferAttachmentKind(mimeType: string): "pdf" | "doc" | "sheet" | "other" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("msword")) return "doc";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "sheet";
  return "other";
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ComposeScreen() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [postType, setPostType] = useState<string>("announcement");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  async function pickMedia() {
    const remaining = 10 - pendingMedia.length;
    if (remaining <= 0) {
      Alert.alert("Limit reached", "You can attach up to 10 images or videos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled) return;
    const newItems: PendingMediaItem[] = result.assets.map((a) => ({
      uri: a.uri,
      type: a.type === "video" ? "video" : "image",
      mimeType: a.mimeType ?? (a.type === "video" ? "video/mp4" : "image/jpeg"),
      duration: a.duration ? Math.round(a.duration / 1000) : undefined,
      fileName: a.fileName ?? undefined,
    }));
    setPendingMedia((prev) => [...prev, ...newItems].slice(0, 10));
  }

  async function pickAttachment() {
    const remaining = 5 - pendingAttachments.length;
    if (remaining <= 0) {
      Alert.alert("Limit reached", "You can attach up to 5 documents.");
      return;
    }
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
    if (result.canceled) return;
    const newItems: PendingAttachment[] = result.assets.map((a) => ({
      uri: a.uri,
      name: a.name,
      size: a.size ?? null,
      mimeType: a.mimeType ?? "application/octet-stream",
    }));
    setPendingAttachments((prev) => [...prev, ...newItems].slice(0, 5));
  }

  async function handleSubmit() {
    if (!body.trim() || !currentUserId) return;
    setSubmitting(true);

    // 1. Insert post
    const { data: postRow, error: postErr } = await supabase
      .schema("feed")
      .from("posts")
      .insert({
        teacher_id: currentUserId,
        body: body.trim(),
        school_year: "2025-2026",
        classroom: null,
        post_type: postType,
      })
      .select("id")
      .single();

    if (postErr || !postRow) {
      setSubmitting(false);
      if (postErr) notifyError("staff-compose-post-create", postErr);
      Alert.alert("Could not post", postErr?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const postId = postRow.id;

    // 2. Upload media
    const mediaInserts: object[] = [];
    console.log("[compose] pendingMedia count:", pendingMedia.length);
    for (let i = 0; i < pendingMedia.length; i++) {
      const item = pendingMedia[i];
      try {
        let uploadUri = item.uri;
        let uploadMimeType = item.mimeType;
        if (item.type === "image") {
          try {
            const compressed = await compressImage(item.uri);
            uploadUri = compressed.uri;
            uploadMimeType = compressed.mimeType;
          } catch (compressErr) {
            console.warn(`[compose] compression failed for media[${i}], uploading original:`, compressErr);
          }
        }
        const ext = item.type === "image" ? "jpg" : (item.uri.split(".").pop()?.split("?")[0] ?? "mp4");
        const storagePath = `${currentUserId}/${postId}/${Date.now()}_${i}.${ext}`;
        console.log(`[compose] uploading media[${i}] uri=${uploadUri} mimeType=${uploadMimeType} storagePath=${storagePath}`);
        const ok = await uploadFileToStorage("feed-media", storagePath, uploadUri, uploadMimeType);
        console.log(`[compose] upload result[${i}]:`, ok);
        if (!ok) { console.log(`[compose] upload failed for media[${i}], skipping`); continue; }
        mediaInserts.push({
          post_id: postId,
          kind: item.type,
          storage_url: storagePath,
          display_order: i,
          duration_secs: item.duration ?? null,
        });
      } catch (e) {
        console.log(`[compose] upload exception for media[${i}]:`, e);
        notifyError('staff-compose-media-upload', e);
      }
    }
    console.log("[compose] mediaInserts:", JSON.stringify(mediaInserts));
    if (mediaInserts.length > 0) {
      const { error: mediaErr } = await supabase.schema("feed").from("post_media").insert(mediaInserts);
      if (mediaErr) notifyError("staff-compose-media-insert", mediaErr);
      console.log("[compose] post_media insert error:", mediaErr);
    }

    // 3. Upload attachments
    const attachInserts: object[] = [];
    for (const att of pendingAttachments) {
      try {
        const storagePath = `${currentUserId}/${postId}/${Date.now()}_${att.name}`;
        const ok = await uploadFileToStorage("feed-attachments", storagePath, att.uri, att.mimeType);
        if (!ok) continue;
        attachInserts.push({
          post_id: postId,
          file_name: att.name,
          file_size_bytes: att.size,
          kind: inferAttachmentKind(att.mimeType),
          storage_url: storagePath,
        });
      } catch (e) {
        notifyError('staff-compose-attachment-upload', e);
      }
    }
    if (attachInserts.length > 0) {
      await supabase.schema("feed").from("post_attachments").insert(attachInserts);
    }

    setSubmitting(false);
    router.back();
  }

  const canPost = body.trim().length > 0 && !submitting;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={submitting} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={submitting ? "#d1d5db" : "#374151"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canPost}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Post type selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeSelectorRow}
        style={styles.typeSelectorScroll}
      >
        {POST_TYPES.map((pt) => {
          const selected = postType === pt.value;
          return (
            <TouchableOpacity
              key={pt.value}
              style={[
                styles.typePill,
                selected
                  ? { backgroundColor: pt.color, borderColor: pt.color }
                  : { backgroundColor: "#f9fafb", borderColor: "#e5e7eb" },
              ]}
              onPress={() => setPostType(pt.value)}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.typePillText,
                  { color: selected ? "#ffffff" : "#6b7280" },
                ]}
              >
                {pt.emoji}{"  "}{pt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Text area */}
          <TextInput
            style={styles.textArea}
            placeholder="Share something with parents..."
            placeholderTextColor="#9ca3af"
            multiline
            value={body}
            onChangeText={setBody}
            autoFocus
            editable={!submitting}
          />

          {/* Pending media previews */}
          {pendingMedia.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Images & Videos ({pendingMedia.length}/10)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.mediaThumbnailRow}>
                  {pendingMedia.map((item, idx) => (
                    <View key={idx} style={styles.mediaThumbnail}>
                      <Image
                        source={{ uri: item.uri }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                      />
                      {item.type === "video" && (
                        <View style={styles.videoOverlay}>
                          <Ionicons name="play" size={16} color="#fff" />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => setPendingMedia((prev) => prev.filter((_, i) => i !== idx))}
                        hitSlop={4}
                      >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Pending attachments */}
          {pendingAttachments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Documents ({pendingAttachments.length}/5)</Text>
              <View style={{ gap: 6 }}>
                {pendingAttachments.map((att, idx) => (
                  <View key={idx} style={styles.attachmentRow}>
                    <Ionicons name="document-text" size={16} color="#6b7280" />
                    <Text style={styles.attachmentName} numberOfLines={1}>{att.name}</Text>
                    {att.size != null && (
                      <Text style={styles.attachmentSize}>{formatFileSize(att.size)}</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={pickMedia}
              disabled={submitting || pendingMedia.length >= 10}
              activeOpacity={0.75}
            >
              <Ionicons
                name="images-outline"
                size={22}
                color={pendingMedia.length >= 10 ? "#d1d5db" : Brand.sage700}
              />
              <Text style={[styles.actionBtnText, pendingMedia.length >= 10 && { color: "#d1d5db" }]}>
                Photo / Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={pickAttachment}
              disabled={submitting || pendingAttachments.length >= 5}
              activeOpacity={0.75}
            >
              <Ionicons
                name="attach-outline"
                size={22}
                color={pendingAttachments.length >= 5 ? "#d1d5db" : Brand.sage700}
              />
              <Text style={[styles.actionBtnText, pendingAttachments.length >= 5 && { color: "#d1d5db" }]}>
                Document
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  postBtn: {
    backgroundColor: Brand.coral,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 9999,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnDisabled: {
    backgroundColor: "#f3d0cc",
  },
  postBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  textArea: {
    fontFamily: FontFamilies.body,
    fontSize: 16,
    color: "#1f2937",
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 24,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mediaThumbnailRow: {
    flexDirection: "row",
    gap: 8,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    position: "relative",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attachmentName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
  },
  attachmentSize: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#F2F7F3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0ede2",
  },
  actionBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  typeSelectorScroll: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  typeSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typePill: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typePillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
  },
});
