import { saveImageToLibrary } from "@/utils/saveMedia";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { getPostType } from "@/constants/postTypes";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { forwardRef, useEffect, useRef, useState } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiKeyboard from "rn-emoji-keyboard";
import type { EmojiType } from "rn-emoji-keyboard";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostMediaRow {
  id: string;
  post_id: string;
  kind: "image" | "video";
  storage_url: string;
  display_order: number;
  duration_secs: number | null;
  signed_url: string | null;
}

interface PostAttachmentRow {
  id: string;
  post_id: string;
  file_name: string;
  file_size_bytes: number | null;
  kind: "pdf" | "doc" | "sheet" | "other";
  storage_url: string;
}

interface PostReactionRow {
  post_id: string;
  user_id: string;
  emoji: string;
}

interface PostWithMeta {
  id: string;
  teacher_id: string;
  body: string;
  school_year: string | null;
  classroom: string | null;
  created_at: string;
  post_type: string | null;
  authorName: string;
  authorRole: string | null;
  authorProfileImageUrl: string | null;
  media: PostMediaRow[];
  attachments: PostAttachmentRow[];
  reactions: PostReactionRow[];
  commentCount: number;
}

interface TeacherOption {
  id: string;
  full_name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentIcon(kind: PostAttachmentRow["kind"]): string {
  switch (kind) {
    case "pdf": return "document-text";
    case "doc": return "document";
    case "sheet": return "grid";
    default: return "attach";
  }
}

function avatarColor(id: string): string {
  const colors = ["#7FA888", "#f29a8f", "#97C09B", "#BFD8C0", "#6B9474", "#e88d82"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

const DEFAULT_REACTIONS = ["❤️", "🌱", "🌻", "🦋"];

interface ParticleData {
  id: string;
  emoji: string;
  x: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthorAvatar({ name, userId, profileImageUrl, size = 40 }: { name: string; userId: string; profileImageUrl?: string | null; size?: number }) {
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(userId),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: FontFamilies.bodySemiBold, fontSize: size * 0.35, color: "#fff" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function MediaGrid({ media }: { media: PostMediaRow[] }) {
  if (media.length === 0) return null;
  const sorted = [...media].sort((a, b) => a.display_order - b.display_order);

  if (sorted.length === 1) {
    return (
      <View style={styles.mediaGrid1}>
        <MediaItem item={sorted[0]} style={StyleSheet.absoluteFillObject} />
      </View>
    );
  }
  if (sorted.length === 2) {
    return (
      <View style={styles.mediaGrid2}>
        {sorted.map((m) => <MediaItem key={m.id} item={m} style={{ flex: 1 }} />)}
      </View>
    );
  }
  // 3+ → 2 on top, up to 3 on bottom
  const top = sorted.slice(0, 2);
  const bottom = sorted.slice(2, 5);
  const extraCount = sorted.length - 5;
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", height: 200, gap: 2 }}>
        {top.map((m) => (
          <MediaItem key={m.id} item={m} style={{ flex: 1 }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", height: 130, gap: 2 }}>
        {bottom.map((m, idx) => {
          const isLast = idx === bottom.length - 1;
          return (
            <View key={m.id} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <MediaItem item={m} style={StyleSheet.absoluteFillObject} />
              {isLast && extraCount > 0 && (
                <View style={styles.overflayBadge}>
                  <Text style={styles.overlayText}>+{extraCount}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MediaItem({ item, style, rounded = false }: { item: PostMediaRow; style?: object; rounded?: boolean }) {
  const uri = item.signed_url;
  const [viewerVisible, setViewerVisible] = useState(false);
  return (
    <>
      <Pressable
        style={[{ overflow: "hidden", borderRadius: rounded ? 6 : 0 }, style]}
        onPress={() => { if (uri && item.kind === "image") setViewerVisible(true); }}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" recyclingKey={item.id} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#e5e7eb" }]} />
        )}
        {item.kind === "video" && (
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </Pressable>
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setViewerVisible(false)}
        >
          <Image source={{ uri: uri! }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
        </Pressable>
        <Pressable
          style={{ position: "absolute", top: 56, right: 20, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 }}
          onPress={() => setViewerVisible(false)}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <View style={{ position: "absolute", bottom: 60, left: 0, right: 0, alignItems: "center" }}>
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 }}
            onPress={() => { if (uri) saveImageToLibrary(uri); }}
            hitSlop={12}
          >
            <Ionicons name="download-outline" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Save</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function EmojiParticle({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue((Math.random() - 0.5) * 36);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withTiming(-68, { duration: 850 });
    translateX.value = withTiming((Math.random() - 0.5) * 52, { duration: 850 });
    scale.value = withSequence(
      withTiming(1.4, { duration: 180 }),
      withTiming(1.0, { duration: 670 }),
    );
    opacity.value = withDelay(
      320,
      withTiming(0, { duration: 530 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[{ position: "absolute", bottom: 6, left: x, fontSize: 15, zIndex: 50 }, animStyle]}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Reaction Viewers Sheet ───────────────────────────────────────────────────

interface ReactionViewersSheetProps {
  reactions: PostReactionRow[];
  initialEmoji: string;
}

const ReactionViewersSheet = forwardRef(
  ({ reactions, initialEmoji }: ReactionViewersSheetProps, ref) => {
    const emojisWithReactions = [...new Set(reactions.map((r) => r.emoji))];
    const [selectedEmoji, setSelectedEmoji] = useState<string>(initialEmoji || (emojisWithReactions[0] ?? ""));
    const [userNameById, setUserNameById] = useState<Record<string, string>>({});
    const [userProfileImageById, setUserProfileImageById] = useState<Record<string, string | null>>({});
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
      if (initialEmoji) setSelectedEmoji(initialEmoji);
    }, [initialEmoji]);

    useEffect(() => {
      if (reactions.length === 0) return;
      const userIds = [...new Set(reactions.map((r) => r.user_id))];
      setLoadingUsers(true);
      supabase
        .schema("admin")
        .from("users")
        .select("id, full_name, profile_image_url")
        .in("id", userIds)
        .then(({ data }) => {
          const nameMap: Record<string, string> = {};
          const imageMap: Record<string, string | null> = {};
          for (const u of data ?? []) {
            nameMap[u.id] = u.full_name;
            imageMap[u.id] = u.profile_image_url ?? null;
          }
          setUserNameById(nameMap);
          setUserProfileImageById(imageMap);
          setLoadingUsers(false);
        });
    }, [reactions]);

    useEffect(() => {
      if (emojisWithReactions.length > 0 && !emojisWithReactions.includes(selectedEmoji)) {
        setSelectedEmoji(emojisWithReactions[0]);
      }
    }, [reactions]);

    const usersForEmoji = reactions.filter((r) => r.emoji === selectedEmoji);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
      >
        <View style={rvSheetStyles.header}>
          <Text style={rvSheetStyles.title}>Reactions</Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={rvSheetStyles.listContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rvSheetStyles.tabRow}>
            {emojisWithReactions.map((emoji) => {
              const count = reactions.filter((r) => r.emoji === emoji).length;
              const active = emoji === selectedEmoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[rvSheetStyles.tab, active && rvSheetStyles.tabActive]}
                  onPress={() => setSelectedEmoji(emoji)}
                  activeOpacity={0.75}
                >
                  <Text style={rvSheetStyles.tabEmoji}>{emoji}</Text>
                  <Text style={[rvSheetStyles.tabCount, active && rvSheetStyles.tabCountActive]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {loadingUsers ? (
            <View style={rvSheetStyles.loadingRow}>
              <Text style={rvSheetStyles.loadingText}>Loading...</Text>
            </View>
          ) : (
            usersForEmoji.map((r) => (
              <View key={r.user_id} style={rvSheetStyles.userRow}>
                <AuthorAvatar
                  name={userNameById[r.user_id] ?? "User"}
                  userId={r.user_id}
                  profileImageUrl={userProfileImageById[r.user_id] ?? null}
                  size={38}
                />
                <Text style={rvSheetStyles.userName}>{userNameById[r.user_id] ?? "User"}</Text>
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

function ReactionPills({
  reactions,
  currentUserId,
  onReact,
  onLongPressReaction,
}: {
  reactions: PostReactionRow[];
  currentUserId: string | null;
  onReact: (emoji: string) => void;
  onLongPressReaction?: (emoji: string) => void;
}) {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pillX = useRef<Record<string, number>>({});

  const summary: Record<string, { count: number; mine: boolean }> = {};
  for (const r of reactions) {
    if (!summary[r.emoji]) summary[r.emoji] = { count: 0, mine: false };
    summary[r.emoji].count++;
    if (r.user_id === currentUserId) summary[r.emoji].mine = true;
  }

  const customEmojis = Object.keys(summary).filter((e) => !DEFAULT_REACTIONS.includes(e));
  const allEmojis = [...DEFAULT_REACTIONS, ...customEmojis];

  function handlePress(emoji: string) {
    onReact(emoji);
    const x = pillX.current[emoji] ?? 0;
    const burst: ParticleData[] = Array.from({ length: 5 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      emoji,
      x,
    }));
    setParticles((prev) => [...prev, ...burst]);
  }

  return (
    <View style={{ marginBottom: 2, overflow: "visible" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {allEmojis.map((emoji) => {
            const count = summary[emoji]?.count ?? 0;
            const mine = summary[emoji]?.mine ?? false;
            return (
              <TouchableOpacity
                key={emoji}
                onLayout={(e) => { pillX.current[emoji] = e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2 - 8; }}
                style={[styles.reactionPill, mine && styles.reactionPillMine]}
                onPress={() => handlePress(emoji)}
                onLongPress={count > 0 && onLongPressReaction ? () => onLongPressReaction(emoji) : undefined}
                delayLongPress={350}
                activeOpacity={0.75}
              >
                <Text style={styles.reactionPillText}>{emoji}{count > 0 ? ` ${count}` : ""}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.reactionPill, { paddingHorizontal: 10 }]}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.75}
          >
            <Text style={[styles.reactionPillText, { color: "#6b7280" }]}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {particles.length > 0 && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "visible" }} pointerEvents="none">
          {particles.map((p) => (
            <EmojiParticle
              key={p.id}
              emoji={p.emoji}
              x={p.x}
              onDone={() => setParticles((prev) => prev.filter((pp) => pp.id !== p.id))}
            />
          ))}
        </View>
      )}
      <EmojiKeyboard
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(emojiObj: EmojiType) => {
          handlePress(emojiObj.emoji);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

function PostTypeBadge({ value }: { value: string | null }) {
  const config = getPostType(value);
  if (!config) return null;
  return (
    <View style={{ backgroundColor: config.color, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: config.textColor, fontSize: 11, fontFamily: FontFamilies.bodySemiBold }}>
        {config.label}
      </Text>
    </View>
  );
}

interface PostCardProps {
  post: PostWithMeta;
  currentUserId: string | null;
  onPress: () => void;
  onDeletePress: () => void;
  onReact: (emoji: string) => void;
  onLongPressReaction?: (emoji: string) => void;
}

function PostCard({ post, currentUserId, onPress, onDeletePress, onReact, onLongPressReaction }: PostCardProps) {
  const isOwn = post.teacher_id === currentUserId;
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.97} onPress={onPress}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: "/(staff)/teacher/[teacherId]" as any,
              params: {
                teacherId: post.teacher_id,
                teacherName: post.authorName,
                classroom: post.classroom ?? "",
                program: "",
              },
            });
          }}
        >
          <AuthorAvatar name={post.authorName} userId={post.teacher_id} profileImageUrl={post.authorProfileImageUrl} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName} numberOfLines={1}>{post.authorName}</Text>
            <Text style={styles.authorMeta}>
              {post.authorRole === "super_admin" || post.authorRole === "teacher" ? "Teacher" : (post.authorRole ?? "Teacher")} · {timeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwn && (
          <TouchableOpacity onPress={onDeletePress} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Badge + Body */}
      {(post.post_type || post.body.length > 0) && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 10, gap: 6 }}>
          <PostTypeBadge value={post.post_type} />
          {post.body.length > 0 && (
            <MarkdownBody body={post.body} collapsible />
          )}
        </View>
      )}

      {/* Media — full bleed, no horizontal padding */}
      <MediaGrid media={post.media} />

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <View style={styles.attachmentList}>
          {post.attachments.map((att) => (
            <View key={att.id} style={styles.attachmentRow}>
              <Ionicons name={attachmentIcon(att.kind) as any} size={16} color="#6b7280" />
              <Text style={styles.attachmentName} numberOfLines={1}>{att.file_name}</Text>
              {att.file_size_bytes != null && (
                <Text style={styles.attachmentSize}>{formatFileSize(att.file_size_bytes)}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={{ flex: 1 }}>
          <ReactionPills reactions={post.reactions} currentUserId={currentUserId} onReact={onReact} onLongPressReaction={onLongPressReaction} />
        </View>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={22} color="#374151" />
          {post.commentCount > 0 && <Text style={styles.actionCount}>{post.commentCount}</Text>}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ backgroundColor: "#ffffff" }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
            <SkeletonBox width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width="50%" height={13} borderRadius={4} />
              <SkeletonBox width="30%" height={11} borderRadius={4} />
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, gap: 6, paddingBottom: 10 }}>
            <SkeletonBox width="100%" height={13} borderRadius={4} />
            <SkeletonBox width="75%" height={13} borderRadius={4} />
          </View>
          <SkeletonBox width="100%" height={240} borderRadius={0} />
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, flexDirection: "row", gap: 16 }}>
            <SkeletonBox width={56} height={14} borderRadius={4} />
            <SkeletonBox width={56} height={14} borderRadius={4} />
          </View>
          {i < 2 && <View style={{ height: 1, backgroundColor: "#f0f0f0" }} />}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;

export default function FeedListScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [filterTeacherId, setFilterTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const reactionViewersSheetRef = useRef<BottomSheetModal>(null);
  const [reactionViewersTarget, setReactionViewersTarget] = useState<{
    reactions: PostReactionRow[];
    initialEmoji: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPage(0);
    setHasMore(true);
    setPosts([]);
    loadPage(0, false, cancelled, () => cancelled);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTeacherId]);

  async function loadPage(pageIndex: number, isRefresh: boolean, _cancelled: boolean, isCancelled: () => boolean) {
    const isInitial = pageIndex === 0 && !isRefresh;
    if (isRefresh) setRefreshing(true);
    else if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || isCancelled()) { setLoading(false); setRefreshing(false); setLoadingMore(false); return; }
    setCurrentUserId(user.id);

    // Fetch posts
    let postsQuery = supabase
      .schema("feed")
      .from("posts")
      .select("id, teacher_id, body, school_year, classroom, created_at, post_type")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);
    if (filterTeacherId) postsQuery = postsQuery.eq("teacher_id", filterTeacherId) as any;

    const { data: postRows, error: postsErr } = await postsQuery;
    if (postsErr || !postRows || isCancelled()) {
      if (!isCancelled()) setError(postsErr?.message ?? "Failed to load feed.");
      setLoading(false); setRefreshing(false); setLoadingMore(false);
      return;
    }

    if (postRows.length === 0) {
      if (!isCancelled()) {
        if (pageIndex === 0) setPosts([]);
        setHasMore(false);
        setLoading(false); setRefreshing(false); setLoadingMore(false);
      }
      return;
    }

    const postIds = postRows.map((p) => p.id);
    const teacherIds = [...new Set(postRows.map((p) => p.teacher_id))];

    // Parallel batch queries
    const [mediaRes, attachRes, reactRes, commentRes, usersRes] = await Promise.all([
      supabase.schema("feed").from("post_media")
        .select("id, post_id, kind, storage_url, display_order, duration_secs")
        .in("post_id", postIds)
        .order("display_order"),
      supabase.schema("feed").from("post_attachments")
        .select("id, post_id, file_name, file_size_bytes, kind, storage_url")
        .in("post_id", postIds),
      supabase.schema("feed").from("post_reactions")
        .select("post_id, user_id, emoji")
        .in("post_id", postIds),
      supabase.schema("feed").from("post_comments")
        .select("post_id")
        .eq("is_deleted", false)
        .in("post_id", postIds),
      supabase.schema("admin").from("users")
        .select("id, full_name, role, profile_image_url")
        .in("id", teacherIds),
    ]);

    if (isCancelled()) return;

    // Signed URLs for media
    const mediaRows: PostMediaRow[] = (mediaRes.data ?? []).map((m) => ({
      ...m,
      kind: m.kind as "image" | "video",
      signed_url: null,
    }));

    const mediaPaths = mediaRows.map((m) => m.storage_url);
    const { data: signedResults } = await supabase.storage
      .from("feed-media")
      .createSignedUrls(mediaPaths, 3600);
    const mediaWithUrls = mediaRows.map((m, i) => ({
      ...m,
      signed_url: signedResults?.[i]?.signedUrl ?? null,
    }));

    if (isCancelled()) return;

    // Build lookup maps
    const nameById: Record<string, string> = {};
    const roleById: Record<string, string | null> = {};
    const profileImageById: Record<string, string | null> = {};
    for (const u of usersRes.data ?? []) {
      nameById[u.id] = u.full_name;
      roleById[u.id] = u.role ?? null;
      profileImageById[u.id] = u.profile_image_url ?? null;
    }

    const mediaByPost: Record<string, PostMediaRow[]> = {};
    for (const m of mediaWithUrls) {
      (mediaByPost[m.post_id] ??= []).push(m);
    }

    const attachByPost: Record<string, PostAttachmentRow[]> = {};
    for (const a of attachRes.data ?? []) {
      (attachByPost[a.post_id] ??= []).push({ ...a, kind: a.kind as PostAttachmentRow["kind"] });
    }

    const reactionsByPost: Record<string, PostReactionRow[]> = {};
    for (const r of reactRes.data ?? []) {
      (reactionsByPost[r.post_id] ??= []).push(r);
    }

    const commentCountByPost: Record<string, number> = {};
    for (const c of commentRes.data ?? []) {
      commentCountByPost[c.post_id] = (commentCountByPost[c.post_id] ?? 0) + 1;
    }

    const enriched: PostWithMeta[] = postRows.map((p) => ({
      ...p,
      post_type: (p as any).post_type ?? null,
      authorName: nameById[p.teacher_id] ?? "Teacher",
      authorRole: roleById[p.teacher_id] ?? null,
      authorProfileImageUrl: profileImageById[p.teacher_id] ?? null,
      media: mediaByPost[p.id] ?? [],
      attachments: attachByPost[p.id] ?? [],
      reactions: reactionsByPost[p.id] ?? [],
      commentCount: commentCountByPost[p.id] ?? 0,
    }));

    if (!isCancelled()) {
      if (pageIndex === 0) {
        setPosts(enriched);
      } else {
        setPosts((prev) => [...prev, ...enriched]);
      }
      if (postRows.length < PAGE_SIZE) setHasMore(false);
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  // Load teacher filter list once on mount
  useEffect(() => {
    supabase.schema("admin").from("users")
      .select("id, full_name")
      .in("role", ["teacher", "super_admin"])
      .order("full_name")
      .then(({ data }) => {
        if (data) setTeachers(data);
      });
  }, []);

  async function toggleReactionForPost(postId: string, emoji: string) {
    if (!currentUserId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isMine = post.reactions.some((r) => r.user_id === currentUserId && r.emoji === emoji);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          reactions: isMine
            ? p.reactions.filter((r) => !(r.user_id === currentUserId && r.emoji === emoji))
            : [...p.reactions, { post_id: postId, user_id: currentUserId, emoji }],
        };
      })
    );

    if (isMine) {
      const { error } = await supabase.schema("feed").from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji);
      if (error) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return { ...p, reactions: [...p.reactions, { post_id: postId, user_id: currentUserId, emoji }] };
          })
        );
      }
    } else {
      const { error } = await supabase.schema("feed").from("post_reactions")
        .insert({ post_id: postId, user_id: currentUserId, emoji });
      if (error) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return { ...p, reactions: p.reactions.filter((r) => !(r.user_id === currentUserId && r.emoji === emoji)) };
          })
        );
      }
    }
  }

  function handleDeletePost(post: PostWithMeta) {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          console.log("[deletePost] auth.uid =", user?.id);
          console.log("[deletePost] post.id =", post.id, "post.teacher_id =", post.teacher_id);
          console.log("[deletePost] uid match =", user?.id === post.teacher_id);

          const { data, error: err } = await supabase.schema("feed").rpc("delete_own_post", { p_post_id: post.id });
          console.log("[deletePost] rpc result — data:", data, "error:", JSON.stringify(err));

          if (err) {
            Alert.alert("Error", `${err.code}: ${err.message}`);
          } else {
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          }
        },
      },
    ]);
  }

  function handleRefresh() {
    let cancelled = false;
    setPage(0);
    setHasMore(true);
    loadPage(0, true, cancelled, () => cancelled);
  }

  function handleLongPressReaction(post: PostWithMeta, emoji: string) {
    if (post.reactions.filter((r) => r.emoji === emoji).length === 0) return;
    setReactionViewersTarget({ reactions: post.reactions, initialEmoji: emoji });
    reactionViewersSheetRef.current?.present();
  }

  const activeTeacher = teachers.find((t) => t.id === filterTeacherId);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Feed</Text>
          <Ionicons name="funnel-outline" size={22} color={Brand.sage700} />
        </View>
        <FeedSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Feed</Text>
        </View>
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Feed</Text>
          {activeTeacher && (
            <Text style={styles.filterLabel}>{activeTeacher.full_name}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => filterSheetRef.current?.present()}
          style={styles.filterBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="funnel"
            size={18}
            color={filterTeacherId ? Brand.coral : Brand.sage700}
          />
          {filterTeacherId && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Feed list */}
      {posts.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyHeading}>No Posts Yet</Text>
            <Text style={styles.emptyBody}>Be the first to share something with parents.</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Brand.sage700} />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) {
              const nextPage = page + 1;
              setPage(nextPage);
              let cancelled = false;
              loadPage(nextPage, false, cancelled, () => cancelled);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={Brand.sage700} style={{ marginVertical: 16 }} />
              : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={currentUserId}
              onPress={() =>
                router.push({
                  pathname: "/(staff)/feed/[postId]" as any,
                  params: { postId: item.id },
                })
              }
              onDeletePress={() => handleDeletePost(item)}
              onReact={(emoji) => toggleReactionForPost(item.id, emoji)}
              onLongPressReaction={(emoji) => handleLongPressReaction(item, emoji)}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/(staff)/feed/compose" as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Teacher filter sheet */}
      <BottomSheetModal
        ref={filterSheetRef}
        snapPoints={["45%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Filter by Teacher</Text>
          <TouchableOpacity
            style={[styles.teacherRow, !filterTeacherId && styles.teacherRowActive]}
            onPress={() => { setFilterTeacherId(null); filterSheetRef.current?.dismiss(); }}
          >
            <View style={[styles.teacherAvatar, { backgroundColor: Brand.sage700 }]}>
              <Ionicons name="people" size={18} color="#fff" />
            </View>
            <Text style={styles.teacherName}>All Teachers</Text>
            {!filterTeacherId && <Ionicons name="checkmark" size={18} color={Brand.sage700} />}
          </TouchableOpacity>
          <FlatList
            data={teachers}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.teacherRow, filterTeacherId === item.id && styles.teacherRowActive]}
                onPress={() => { setFilterTeacherId(item.id); filterSheetRef.current?.dismiss(); }}
              >
                <AuthorAvatar name={item.full_name} userId={item.id} size={36} />
                <Text style={styles.teacherName}>{item.full_name}</Text>
                {filterTeacherId === item.id && (
                  <Ionicons name="checkmark" size={18} color={Brand.sage700} />
                )}
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>

      {reactionViewersTarget && (
        <ReactionViewersSheet
          ref={reactionViewersSheetRef}
          reactions={reactionViewersTarget.reactions}
          initialEmoji={reactionViewersTarget.initialEmoji}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pageTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: "#5E7C68",
  },
  filterLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: Brand.coral,
    marginTop: 1,
  },
  filterBtn: {
    padding: 6,
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.coral,
  },
  listContent: {
    paddingBottom: 100,
  },
  postSeparator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  // Post card
  card: {
    backgroundColor: "#ffffff",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  authorName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#111827",
  },
  authorMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },


  // Media grid
  mediaGrid1: {
    height: 280,
    overflow: "hidden",
  },
  mediaGrid2: {
    flexDirection: "row",
    height: 200,
    gap: 0,
    overflow: "hidden",
  },
  mediaGrid4: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 220,
    gap: 0,
  },
  mediaGridCell: {
    width: "49.5%",
    height: 108,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e5e7eb",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  overflayBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 20,
    color: "#fff",
  },

  // Attachments
  attachmentList: { gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
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

  // Card footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  reactionPill: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reactionPillMine: {
    borderColor: "#f29a8f",
    backgroundColor: "#fde8e6",
  },
  reactionPillText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
  // FAB
  fab: {
    position: "absolute",
    bottom: BottomTabInset + 8,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.coral,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  // States
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#e0ede2",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  emptyHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 6,
  },
  emptyBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },

  // Filter sheet
  sheetContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, flex: 1 },
  sheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 14,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  teacherRowActive: {
    backgroundColor: "#F2F7F3",
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  teacherName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
});

const rvSheetStyles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  title: { fontFamily: FontFamilies.bodySemiBold, fontSize: 16, color: "#1f2937" },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, paddingVertical: 2 },
  tab: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  tabActive: { borderColor: "#f29a8f", backgroundColor: "#fde8e6" },
  tabEmoji: { fontSize: 18 },
  tabCount: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#6b7280" },
  tabCountActive: { color: "#d47f75" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  userName: { fontFamily: FontFamilies.body, fontSize: 15, color: "#1f2937" },
  loadingRow: { paddingVertical: 20, alignItems: "center" },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
});
