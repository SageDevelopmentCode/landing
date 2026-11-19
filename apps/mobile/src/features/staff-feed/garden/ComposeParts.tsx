// Garden "New Post" for staff: three clear steps (Write → Add photos or
// files → Post), a live preview of how families will see the post type, per-file
// upload states and a Retry that only re-sends what failed.
import { POST_TYPES } from "@/constants/postTypes";
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenHintBox,
  GardenIconButton,
  GardenRadii,
  GardenStepCard,
  HandNote,
  PressableScale,
  haptic,
  useDiscardGuard,
  useToast,
} from "@/components/garden";
import { PostTypePill } from "@/features/feed/garden/FeedBits";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MAX_DOCS,
  MAX_MEDIA,
  formatFileSize,
  useComposePost,
  type ComposePost,
  type UploadStatus,
} from "../useComposePost";

const GUTTER = 18;
const RETRY_MSG = "Check your connection and try again.";

export function StaffComposeScreen() {
  const c = useComposePost();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const submitRef = useRef<(() => Promise<void>) | null>(null);

  // Unsaved text/files ask before closing. Once posted with failed uploads,
  // leaving warns that those files won't be on the post.
  const posted = !!c.postedId;
  const guard = useDiscardGuard(posted ? c.failedCount > 0 : c.hasContent, {
    fallbackHref: "/(staff)/feed",
    ...(posted
      ? {
          title: "Leave without these files?",
          message: "Your post is live, but some files didn't upload. They won't be on the post.",
          discardLabel: "Leave",
          keepLabel: "Stay",
        }
      : { title: "Discard this post?", message: "What you've written and added will be lost." }),
  });

  const submit = useCallback(async () => {
    if (!c.canPost) return;
    haptic.press();
    let toastId = -1;
    const r = await c.submit((done, total) => {
      const title = `Uploading ${Math.min(done + 1, total)} of ${total}…`;
      if (toastId < 0) toastId = toast.show({ tone: "loading", title, silent: true });
      else if (done < total) toast.update(toastId, { title });
    });
    if (r.ok) {
      if (toastId >= 0) toast.dismiss(toastId);
      toast.show({
        tone: "success",
        title: "Posted to the class feed",
        message: r.uploaded ? `With ${r.uploaded} file${r.uploaded === 1 ? "" : "s"}.` : undefined,
      });
      guard.leave(() => (router.canGoBack() ? router.back() : router.replace("/(staff)/feed" as never)));
      return;
    }
    if (r.stage === "post") {
      if (toastId >= 0) toast.dismiss(toastId);
      toast.show({
        tone: "error",
        title: "Could not post",
        message: r.error,
        action: { label: "Retry", onPress: () => void submitRef.current?.() },
      });
      return;
    }
    const opts = {
      tone: "error" as const,
      title: `${r.failed} of ${r.total} file${r.total === 1 ? "" : "s"} didn't upload`,
      message: "Your post is live. Retry to add the rest.",
      action: { label: "Retry", onPress: () => void submitRef.current?.() },
    };
    if (toastId >= 0) toast.update(toastId, opts);
    else toast.show(opts);
  }, [c, toast, guard, router]);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  const pickMedia = useCallback(async () => {
    const r = await c.pickMedia();
    if (r.limit) {
      toast.show({ tone: "info", title: "Limit reached", message: `You can attach up to ${MAX_MEDIA} images or videos.` });
    } else if (r.added) {
      haptic.select();
    }
  }, [c, toast]);

  const pickDoc = useCallback(async () => {
    const r = await c.pickAttachment();
    if (r.limit) {
      toast.show({ tone: "info", title: "Limit reached", message: `You can attach up to ${MAX_DOCS} documents.` });
    } else if (r.added) {
      haptic.select();
    }
  }, [c, toast]);

  const wrote = c.body.trim().length > 0;
  const fileCount = c.media.length + c.attachments.length;
  const locked = c.submitting || posted;

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <View style={s.nav}>
        <GardenIconButton
          icon="close"
          label={posted ? "Close" : "Cancel new post"}
          onPress={guard.back}
          disabled={c.submitting}
        />
        <Display size={24} style={{ flex: 1 }}>
          New Post
        </Display>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* ① Write */}
          <GardenStepCard
            n={1}
            title="Write"
            note={posted ? "posted ✓" : "pick a type, then share your update"}
            state={wrote && posted ? "done" : "active"}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              style={{ marginHorizontal: -2 }}
              accessibilityRole="radiogroup"
              accessibilityLabel="Post type"
            >
              {POST_TYPES.map((pt) => {
                const on = c.postType === pt.value;
                return (
                  <PressableScale
                    key={pt.value}
                    haptics="select"
                    pressedScale={0.95}
                    disabled={locked}
                    onPress={() => c.setPostType(pt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled: locked }}
                    accessibilityLabel={pt.label}
                    style={[s.typeChip, on && { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep }]}
                  >
                    <Text style={{ fontSize: 15 }}>{pt.emoji}</Text>
                    <Text style={[s.typeText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
                      {pt.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
            <TextInput
              style={[s.textArea, locked && { opacity: 0.7 }]}
              placeholder="Share something with parents..."
              placeholderTextColor={Garden.muted}
              multiline
              value={c.body}
              onChangeText={c.setBody}
              autoFocus
              editable={!locked}
              maxFontSizeMultiplier={1.4}
              accessibilityLabel="Post text"
            />
            <View style={s.previewRow}>
              <Text style={s.previewLabel} maxFontSizeMultiplier={1.3}>
                Families will see
              </Text>
              <PostTypePill value={c.postType} />
            </View>
          </GardenStepCard>

          {/* ② Add photos or files */}
          <GardenStepCard
            n={2}
            title="Add photos or files"
            note="optional"
            state={posted && c.failedCount === 0 && fileCount > 0 ? "done" : "active"}
          >
            <View style={s.pickRow}>
              <PickTile
                icon="images-outline"
                label="Photo / Video"
                count={`${c.media.length} of ${MAX_MEDIA}`}
                disabled={locked || c.media.length >= MAX_MEDIA}
                onPress={() => void pickMedia()}
              />
              <PickTile
                icon="attach-outline"
                label="Document"
                count={`${c.attachments.length} of ${MAX_DOCS}`}
                disabled={locked || c.attachments.length >= MAX_DOCS}
                onPress={() => void pickDoc()}
              />
            </View>

            {c.media.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {c.media.map((m, i) => (
                  <Animated.View
                    key={m.key}
                    entering={reduce ? undefined : FadeIn.duration(180)}
                    exiting={reduce ? undefined : FadeOut.duration(140)}
                    layout={reduce ? undefined : LinearTransition}
                    style={[s.thumb, m.status === "failed" && s.thumbFailed]}
                  >
                    <Image source={{ uri: m.uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                    {m.type === "video" ? (
                      <View style={s.videoBadge}>
                        <Ionicons name="play" size={12} color={Garden.white} />
                      </View>
                    ) : null}
                    <StatusOverlay status={m.status} />
                    {!c.submitting && m.status !== "done" ? (
                      <PressableScale
                        haptics="tap"
                        onPress={() => c.removeMedia(m.key)}
                        accessibilityLabel={`Remove ${m.type === "video" ? "video" : "photo"} ${i + 1}`}
                        hitSlop={8}
                        style={s.remove}
                      >
                        <Ionicons name="close" size={13} color={Garden.white} />
                      </PressableScale>
                    ) : null}
                  </Animated.View>
                ))}
              </ScrollView>
            ) : null}

            {c.attachments.map((a) => (
              <Animated.View
                key={a.key}
                entering={reduce ? undefined : FadeIn.duration(180)}
                layout={reduce ? undefined : LinearTransition}
                style={[s.docRow, a.status === "failed" && { borderColor: Garden.coralDeep }]}
              >
                <View style={s.docIcon}>
                  <Ionicons name="document-text" size={17} color={Garden.sageDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.docName} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                    {a.name}
                  </Text>
                  <Text style={s.docMeta} maxFontSizeMultiplier={1.3}>
                    {a.status === "failed"
                      ? "Didn't upload"
                      : a.status === "done"
                        ? "Attached ✓"
                        : a.status === "uploading"
                          ? "Uploading…"
                          : formatFileSize(a.size)}
                  </Text>
                </View>
                {a.status === "uploading" ? <ActivityIndicator color={Garden.sage} /> : null}
                {!c.submitting && a.status !== "done" ? (
                  <PressableScale
                    haptics="tap"
                    onPress={() => c.removeAttachment(a.key)}
                    accessibilityLabel={`Remove ${a.name}`}
                    hitSlop={10}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={20} color={Garden.muted} />
                  </PressableScale>
                ) : null}
              </Animated.View>
            ))}
          </GardenStepCard>

          {/* ③ Post */}
          <GardenStepCard
            n={3}
            title={posted ? "Finish uploading" : "Post"}
            state={wrote ? "active" : "locked"}
            lockedHint="Write your post in step 1 first, then post it here."
          >
            {posted && c.failedCount > 0 ? (
              <GardenHintBox icon="cloud-offline-outline" tone="coral">
                Your post is live. {c.failedCount} file{c.failedCount === 1 ? "" : "s"} didn't upload — retry to add{" "}
                {c.failedCount === 1 ? "it" : "them"}, or remove {c.failedCount === 1 ? "it" : "them"} and close.
              </GardenHintBox>
            ) : (
              <Text style={s.summary} maxFontSizeMultiplier={1.4}>
                Goes to the class feed for families
                {fileCount ? ` with ${fileCount} file${fileCount === 1 ? "" : "s"}` : ""}.
              </Text>
            )}
            {c.progress ? <ProgressBar done={c.progress.done} total={c.progress.total} /> : null}
          </GardenStepCard>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {posted && c.failedCount === 0 ? (
            <GardenButton
              label="Done"
              tone="sage"
              icon="checkmark"
              fullWidth
              onPress={() => guard.leave()}
            />
          ) : (
            <GardenButton
              label={posted ? `Retry ${c.failedCount} upload${c.failedCount === 1 ? "" : "s"}` : "Post"}
              loadingLabel={c.progress ? `Uploading ${c.progress.done} of ${c.progress.total}…` : "Posting…"}
              loading={c.submitting}
              tone="coral"
              icon={posted ? "refresh" : "paper-plane"}
              fullWidth
              disabled={!c.canPost && !c.submitting}
              onPress={() => void submit()}
              accessibilityHint={wrote ? undefined : "Write something in step 1 first"}
            />
          )}
          {!wrote && !posted ? (
            <HandNote size={15} color={Garden.muted} style={{ textAlign: "center", marginTop: 6 }}>
              write something to post ✏️
            </HandNote>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PickTile({
  icon,
  label,
  count,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  count: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`Add ${label}, ${count}`}
      style={[s.pickTile, disabled && { opacity: 0.45 }]}
    >
      <View style={s.pickIcon}>
        <Ionicons name={icon} size={20} color={Garden.sageDeep} />
      </View>
      <Text style={s.pickLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text style={s.pickCount} maxFontSizeMultiplier={1.3}>
        {count}
      </Text>
    </PressableScale>
  );
}

function StatusOverlay({ status }: { status: UploadStatus }) {
  if (status === "idle") return null;
  return (
    <View
      style={[
        s.overlay,
        status === "done" && { backgroundColor: "rgba(74,99,84,0.45)" },
        status === "failed" && { backgroundColor: "rgba(224,122,110,0.55)" },
      ]}
      accessibilityLabel={status === "uploading" ? "Uploading" : status === "done" ? "Uploaded" : "Didn't upload"}
    >
      {status === "uploading" ? (
        <ActivityIndicator color={Garden.white} />
      ) : (
        <Ionicons name={status === "done" ? "checkmark-circle" : "alert-circle"} size={24} color={Garden.white} />
      )}
    </View>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} of ${total} files uploaded`}
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={s.track}
    >
      <View style={[s.fill, { width: `${pct}%` }]} />
    </View>
  );
}

export type { ComposePost };

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
  },
  typeText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.soft },
  textArea: {
    minHeight: 140,
    maxHeight: 320,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: "#fffdf9",
    padding: 14,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    color: Garden.ink,
    textAlignVertical: "top",
  },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewLabel: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.muted },
  pickRow: { flexDirection: "row", gap: 10 },
  pickTile: {
    flex: 1,
    minHeight: 92,
    borderRadius: GardenRadii.sm + 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.sage,
    backgroundColor: "#f4f9f5",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
  },
  pickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e1eee3",
    alignItems: "center",
    justifyContent: "center",
  },
  pickLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  pickCount: { fontFamily: GardenFonts.hand, fontSize: 15, color: Garden.muted },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f1e7d8",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbFailed: { borderColor: Garden.coralDeep },
  videoBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  remove: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(43,42,38,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(43,42,38,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
  },
  docIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#e1eee3",
    alignItems: "center",
    justifyContent: "center",
  },
  docName: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.ink },
  docMeta: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  summary: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft, lineHeight: 20 },
  track: { height: 8, borderRadius: 4, backgroundColor: "#efe6d8", overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: Garden.sage },
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
