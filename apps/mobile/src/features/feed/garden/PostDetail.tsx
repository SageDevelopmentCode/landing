// Garden parent post detail: post, reactions, threaded comments, composer.
import type { PostReactionRow } from "@/components/feed/feedTypes";
import {
  formatAuthorSubtitle,
  newsletterPublicUrlFromCtaRoute,
  pushFeedCtaRoute,
  resolveFeedCtaRoute,
  timeAgo,
} from "@/components/feed/feedUtils";
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  HandNote,
  PressableScale,
  READ_ONLY_TOAST,
  gardenCard,
  gardenSheetChrome,
  haptic,
  useToast,
} from "@/components/garden";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { floatingTabBarStyle } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { saveImageToLibrary } from "@/utils/saveMedia";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { type CommentNode, type DetailAttachment, useFeedPost } from "../useFeedPost";
import { AttachmentRow, MediaMosaic, PhotoViewer, PostTypePill, ReactionBar } from "./FeedBits";

const PAD = 18;

export function ParentPostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const p = useFeedPost(postId);
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const { isReadOnlyPreview } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const reactionsSheetRef = useRef<BottomSheetModal>(null);
  const listRef = useRef<FlatList>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const submitRef = useRef<(() => Promise<void>) | null>(null);
  const deleteRef = useRef<((id: string) => Promise<void>) | null>(null);

  // Hide the floating tab bar while reading a post.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKbOpen(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKbOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) router.back();
    else router.replace("/(tabs)/feed");
  }, [navigation, router]);

  // ── Feedback wrappers ──────────────────────────────────────────────────────
  const react = useCallback(
    async (emoji: string) => {
      if (isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return false;
      }
      haptic.select();
      const r = await p.toggleReaction(emoji);
      if (!r.ok) toast.show({ tone: "error", title: "Couldn't save your reaction", message: "Please try again." });
      return !!r.added;
    },
    [isReadOnlyPreview, p, toast],
  );

  const submit = useCallback(async () => {
    if (isReadOnlyPreview) {
      toast.show(READ_ONLY_TOAST);
      return;
    }
    if (!p.commentText.trim()) return;
    haptic.press();
    const r = await p.submitComment();
    if (r.ok) {
      haptic.success();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    } else {
      toast.show({
        tone: "error",
        title: "Your comment didn't post",
        message: "It's still in the box — try again.",
        action: { label: "Retry", onPress: () => void submitRef.current?.() },
      });
    }
  }, [isReadOnlyPreview, p, toast]);

  const runDelete = useCallback(
    async (id: string) => {
      const r = await p.deleteComment(id);
      if (r.ok) toast.show({ tone: "success", title: "Comment deleted", duration: 1800 });
      else
        toast.show({
          tone: "error",
          title: "Couldn't delete that comment",
          message: "Please try again.",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(id) },
        });
    },
    [p, toast],
  );

  const confirmDelete = useCallback(
    (c: CommentNode) => {
      if (c.sending || c.deleted || c.author_id !== p.currentUserId) return;
      if (isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      haptic.warning();
      Alert.alert("Delete Comment", "Delete this comment?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void runDelete(c.id) },
      ]);
    },
    [isReadOnlyPreview, p.currentUserId, runDelete, toast],
  );

  useEffect(() => {
    submitRef.current = submit;
    deleteRef.current = runDelete;
  }, [submit, runDelete]);

  const openAttachment = useCallback(
    async (att: DetailAttachment) => {
      if (!att.signed_url) {
        toast.show({ tone: "error", title: "Couldn't open that file", message: "Pull down to refresh and try again." });
        return;
      }
      const id = toast.show({ tone: "loading", title: `Opening ${att.file_name}…` });
      try {
        await WebBrowser.openBrowserAsync(att.signed_url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
        toast.dismiss(id);
      } catch {
        toast.update(id, {
          tone: "error",
          title: "Couldn't open that file",
          message: "Please try again in a moment.",
          action: { label: "Retry", onPress: () => void openAttachment(att) },
        });
      }
    },
    [toast],
  );

  const savePhoto = useCallback(
    async (uri: string) => {
      const id = toast.show({ tone: "loading", title: "Getting your photo ready…" });
      try {
        await saveImageToLibrary(uri, { throwOnError: true });
        toast.dismiss(id);
      } catch {
        toast.update(id, { tone: "error", title: "Error", message: "Could not save the photo. Please try again." });
      }
    },
    [toast],
  );

  const startReply = useCallback(
    (c: CommentNode) => {
      if (isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      haptic.tap();
      p.setReplyingTo({ id: c.id, authorName: c.authorName });
      inputRef.current?.focus();
    },
    [isReadOnlyPreview, p, toast],
  );

  // ── Loading / error ────────────────────────────────────────────────────────
  if (p.loading && !p.post) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <NavBar title="Post" onBack={handleBack} />
        <View style={{ padding: PAD, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <GardenSkeleton width={46} height={46} radius={23} />
            <View style={{ flex: 1, gap: 6 }}>
              <GardenSkeleton width="45%" height={14} radius={6} />
              <GardenSkeleton width="28%" height={11} radius={6} />
            </View>
          </View>
          <GardenSkeleton width={100} height={20} radius={10} />
          <GardenSkeleton width="100%" height={14} radius={6} />
          <GardenSkeleton width="85%" height={14} radius={6} />
          <GardenSkeleton width="100%" height={200} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (p.error || !p.post) {
    const notFound = p.error === "Post not found.";
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <NavBar title="Post" onBack={handleBack} />
        <View style={{ padding: PAD, gap: 14 }}>
          {notFound ? (
            <View style={s.notFound}>
              <Text style={{ fontSize: 30 }}>🍂</Text>
              <Text style={s.notFoundText}>Post not found.</Text>
              <GardenButton label="Family feed" tone="outline" icon="arrow-back" onPress={handleBack} />
            </View>
          ) : (
            <GardenErrorCard
              title={p.error ?? "We couldn't load this post."}
              retrying={retrying}
              onRetry={async () => {
                setRetrying(true);
                await p.retry();
                setRetrying(false);
              }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const post = p.post;
  const subtitle = formatAuthorSubtitle(post.classroom, post.authorRole);
  const isTeacher = post.authorRole === "teacher" || post.authorRole === "super_admin";
  const ctaRoute = post.cta_route && post.cta_label ? resolveFeedCtaRoute(post.cta_route, false) : null;
  const isNewsletter = post.post_type === "newsletter" || post.source_type === "newsletter";
  const newsletterUrl = isNewsletter && post.cta_route ? newsletterPublicUrlFromCtaRoute(post.cta_route) : null;
  const hasReactions = p.rawReactions.length > 0;
  const canSend = !!p.commentText.trim() && !p.submitting;

  const header = (
    <View>
      <View style={s.postCard}>
        <PressableScale
          disabled={!isTeacher}
          haptics={isTeacher ? "tap" : false}
          pressedScale={0.98}
          accessibilityRole={isTeacher ? "link" : "text"}
          accessibilityLabel={isTeacher ? `${post.authorName}, view profile` : post.authorName}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/teacher/[teacherId]" as never,
              params: { teacherId: post.teacher_id, teacherName: post.authorName, classroom: post.classroom ?? "", program: "" },
            })
          }
          style={s.author}
        >
          <GardenAvatar name={post.authorName} uri={post.authorProfileImageUrl} seed={post.teacher_id} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={s.authorName} numberOfLines={1}>
              {post.authorName}
            </Text>
            <Text style={s.authorMeta}>
              {subtitle} · {timeAgo(post.created_at)}
            </Text>
          </View>
          {isTeacher ? <Ionicons name="chevron-forward" size={16} color={Garden.muted} /> : null}
        </PressableScale>

        {post.post_type || post.body.length > 0 ? (
          <View style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
            <PostTypePill value={post.post_type} />
            {post.body.length > 0 ? <MarkdownBody body={post.body} leadBold garden /> : null}
          </View>
        ) : null}

        {post.media.length > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <MediaMosaic media={post.media} width={width - PAD * 2 - 32} onOpen={setViewerIndex} />
          </View>
        ) : null}

        {ctaRoute && post.cta_label ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <GardenButton
              label={post.cta_label}
              tone="sage"
              iconRight="arrow-forward"
              fullWidth
              onPress={async () => {
                if (newsletterUrl) {
                  try {
                    await Linking.openURL(newsletterUrl);
                  } catch {
                    toast.show({ tone: "error", title: "Couldn't open that link" });
                  }
                  return;
                }
                pushFeedCtaRoute(router, ctaRoute);
              }}
            />
          </View>
        ) : null}

        {post.attachments.length > 0 ? (
          <View style={{ gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}>
            {post.attachments.map((a) => (
              <AttachmentRow key={a.id} att={a} onPress={() => void openAttachment(a)} hint="Opens the file" />
            ))}
          </View>
        ) : null}

        <View style={s.reactRow}>
          <ReactionBar
            reactions={p.rawReactions}
            currentUserId={p.currentUserId}
            onReact={react}
            onLongPress={() => reactionsSheetRef.current?.present()}
          />
          {hasReactions ? (
            <Pressable
              onPress={() => {
                haptic.tap();
                reactionsSheetRef.current?.present();
              }}
              hitSlop={10}
              accessibilityRole="button"
              style={({ pressed }) => [s.seeWho, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="people-outline" size={15} color={Garden.sageDeep} />
              <Text style={s.seeWhoText}>See who reacted</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={s.commentsHead}>
        <Display size={22}>Comments</Display>
        <View style={s.countBubble}>
          <Text style={s.countText}>{p.visibleCommentCount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <NavBar title={post.authorName} onBack={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={p.rows}
          keyExtractor={(r) => r.comment.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <Animated.View entering={FadeIn} style={s.noComments}>
              <Text style={{ fontSize: 26 }}>💬</Text>
              <Text style={s.noCommentsText}>No comments yet. Be the first!</Text>
            </Animated.View>
          }
          renderItem={({ item: { comment, depth } }) => (
            <CommentRow
              c={comment}
              depth={depth}
              mine={comment.author_id === p.currentUserId}
              childCount={p.replyCount[comment.id] ?? 0}
              expanded={p.expandedReplies.has(comment.id)}
              onReply={() => startReply(comment)}
              onToggleReplies={() => {
                haptic.select();
                p.toggleReplies(comment.id);
              }}
              onDelete={() => confirmDelete(comment)}
            />
          )}
        />

        {p.replyingTo ? (
          <Animated.View entering={FadeInDown.duration(160)} style={s.replyBanner}>
            <Ionicons name="return-down-forward" size={15} color={Garden.sageDeep} />
            <Text style={s.replyBannerText} numberOfLines={1}>
              Replying to <Text style={{ fontFamily: GardenFonts.bodyHeavy }}>{p.replyingTo.authorName}</Text>
            </Text>
            <Pressable
              onPress={() => {
                haptic.tap();
                p.setReplyingTo(null);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
            >
              <Ionicons name="close-circle" size={20} color={Garden.muted} />
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={[s.composer, { paddingBottom: kbOpen ? 10 : Math.max(insets.bottom, 12) }]}>
          {p.currentUserId ? (
            <GardenAvatar name={p.myName} uri={p.myProfileImageUrl} seed={p.currentUserId} size={34} />
          ) : null}
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Write a reply..."
            placeholderTextColor={Garden.muted}
            value={p.commentText}
            onChangeText={p.setCommentText}
            multiline
            maxLength={2000}
            maxFontSizeMultiplier={1.4}
            accessibilityLabel="Write a reply"
            editable={!isReadOnlyPreview}
            onPressIn={() => {
              if (isReadOnlyPreview) toast.show(READ_ONLY_TOAST);
            }}
          />
          <SendButton enabled={canSend} sending={p.submitting} onPress={() => void submit()} />
        </View>
      </KeyboardAvoidingView>

      <WhoReactedSheet
        sheetRef={reactionsSheetRef}
        reactions={p.rawReactions}
        names={p.userNameById}
        images={p.userProfileImageById}
      />
      <PhotoViewer
        media={post.media}
        startIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        onSave={(uri) => void savePhoto(uri)}
        onOpenVideo={(uri) => void Linking.openURL(uri).catch(() => undefined)}
      />
    </SafeAreaView>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────
function NavBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={s.nav}>
      <GardenIconButton icon="chevron-back" label="Back" onPress={onBack} />
      <Text style={s.navTitle} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

function SendButton({ enabled, sending, onPress }: { enabled: boolean; sending: boolean; onPress: () => void }) {
  const sc = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={st}>
      <Pressable
        onPress={() => {
          if (!enabled) return;
          sc.value = withSequence(withSpring(0.82, { damping: 12, stiffness: 400 }), withSpring(1));
          onPress();
        }}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={sending ? "Sending" : "Send reply"}
        accessibilityState={{ disabled: !enabled, busy: sending }}
        style={[s.send, !enabled && { backgroundColor: "#d9d2c5" }]}
      >
        <Ionicons name={sending ? "hourglass-outline" : "arrow-up"} size={20} color={Garden.white} />
      </Pressable>
    </Animated.View>
  );
}

function CommentRow({
  c,
  depth,
  mine,
  childCount,
  expanded,
  onReply,
  onToggleReplies,
  onDelete,
}: {
  c: CommentNode;
  depth: number;
  mine: boolean;
  childCount: number;
  expanded: boolean;
  onReply: () => void;
  onToggleReplies: () => void;
  onDelete: () => void;
}) {
  const indent = Math.min(depth, 3) * 26;
  const size = depth === 0 ? 34 : 28;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[s.comment, { paddingLeft: PAD + indent }]}>
      <GardenAvatar name={c.authorName} uri={c.authorProfileImageUrl} seed={c.author_id} size={size} />
      <View style={{ flex: 1, gap: 4 }}>
        <Pressable
          onLongPress={mine && !c.sending && !c.deleted ? onDelete : undefined}
          delayLongPress={350}
          accessibilityHint={mine && !c.deleted ? "Hold to delete your comment" : undefined}
          style={[s.bubble, mine && s.bubbleMine, c.sending && { opacity: 0.6 }, c.deleted && s.bubbleDeleted]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[s.cAuthor, mine && { color: Garden.sageDeep }]} numberOfLines={1}>
              {c.authorName}
            </Text>
            <Text style={s.cTime}>{c.sending ? "Sending…" : timeAgo(c.created_at)}</Text>
          </View>
          <Text style={[s.cBody, c.deleted && { fontStyle: "italic", color: Garden.muted }]} selectable={!c.deleted}>
            {c.deleted ? "Comment deleted" : c.body}
          </Text>
        </Pressable>
        <View style={s.cActions}>
          {!c.deleted && !c.sending ? (
            <Pressable onPress={onReply} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Reply to ${c.authorName}`} style={s.cAction}>
              <Text style={s.cActionText}>Reply</Text>
            </Pressable>
          ) : null}
          {childCount > 0 ? (
            <Pressable onPress={onToggleReplies} hitSlop={10} accessibilityRole="button" style={s.cAction}>
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={13} color={Garden.sageDeep} />
              <Text style={s.cActionText}>
                {expanded ? "Hide replies" : `Show ${childCount} ${childCount === 1 ? "reply" : "replies"}`}
              </Text>
            </Pressable>
          ) : null}
          {mine && !c.sending && !c.deleted ? (
            <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete Comment" style={s.cAction}>
              <Ionicons name="ellipsis-horizontal" size={15} color={Garden.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

function WhoReactedSheet({
  sheetRef,
  reactions,
  names,
  images,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  reactions: PostReactionRow[];
  names: Record<string, string>;
  images: Record<string, string | null>;
}) {
  const emojis = useMemo(() => [...new Set(reactions.map((r) => r.emoji))], [reactions]);
  const [active, setActive] = useState(emojis[0] ?? "");
  useEffect(() => {
    if (!emojis.includes(active) && emojis.length) setActive(emojis[0]);
  }, [emojis, active]);
  const users = reactions.filter((r) => r.emoji === active);
  return (
    <BottomSheetModal ref={sheetRef} {...gardenSheetChrome} snapPoints={["50%", "85%"]} enableDynamicSizing={false}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Display size={24}>Reactions</Display>
        <HandNote size={16}>the families cheering this on</HandNote>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {emojis.map((e) => {
            const on = e === active;
            return (
              <Pressable
                key={e}
                onPress={() => {
                  haptic.select();
                  setActive(e);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[s.tab, on && s.tabOn]}
              >
                <Text style={{ fontSize: 18 }}>{e}</Text>
                <Text style={[s.tabCount, on && { color: Garden.white }]}>{reactions.filter((r) => r.emoji === e).length}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {users.map((r) => (
          <View key={r.user_id} style={s.personRow}>
            <GardenAvatar name={names[r.user_id] ?? "User"} uri={images[r.user_id]} seed={r.user_id} size={38} />
            <Text style={s.personName}>{names[r.user_id] ?? "User"}</Text>
          </View>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 6 },
  navTitle: { flex: 1, textAlign: "center", fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink },
  postCard: { ...gardenCard, borderRadius: 26, marginHorizontal: PAD, marginTop: 6 },
  author: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 12, minHeight: 44 },
  authorName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16.5, color: Garden.ink },
  authorMeta: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.muted, marginTop: 1 },
  reactRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f5ede1",
  },
  seeWho: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 4, paddingVertical: 4 },
  seeWhoText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep },
  commentsHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 10 },
  countBubble: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: "#e1eee3", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  countText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.sageDeep },
  noComments: { alignItems: "center", gap: 6, paddingVertical: 26 },
  noCommentsText: { fontFamily: GardenFonts.bodySemi, fontSize: 14.5, color: Garden.soft },
  comment: { flexDirection: "row", gap: 10, paddingRight: PAD, paddingVertical: 6 },
  bubble: {
    backgroundColor: Garden.white,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Garden.line,
    gap: 2,
  },
  bubbleMine: { backgroundColor: "#eef5ef", borderColor: "#d6e6da" },
  bubbleDeleted: { backgroundColor: "transparent", borderStyle: "dashed" },
  cAuthor: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.ink, flexShrink: 1 },
  cTime: { fontFamily: GardenFonts.body, fontSize: 11.5, color: Garden.muted },
  cBody: { fontFamily: GardenFonts.body, fontSize: 15, lineHeight: 21, color: Garden.ink },
  cActions: { flexDirection: "row", alignItems: "center", gap: 14, paddingLeft: 6 },
  cAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  cActionText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.sageDeep },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: GardenRadii.sm,
    backgroundColor: "#e1eee3",
  },
  replyBannerText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.sageDeep },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15.5,
    color: Garden.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Garden.sageDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: { ...gardenCard, borderRadius: 24, padding: 24, alignItems: "center", gap: 10 },
  notFoundText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  tabOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  tabCount: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.soft },
  personRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 54 },
  personName: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
});
