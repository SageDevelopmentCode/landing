import { saveImageToLibrary } from "@/utils/saveMedia";
import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import { getPostType } from "@/constants/postTypes";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiKeyboard from "rn-emoji-keyboard";
import type { EmojiType } from "rn-emoji-keyboard";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostMediaRow {
  id: string;
  kind: "image" | "video";
  storage_url: string;
  display_order: number;
  duration_secs: number | null;
  signed_url: string | null;
}

interface PostAttachmentRow {
  id: string;
  file_name: string;
  file_size_bytes: number | null;
  kind: "pdf" | "doc" | "sheet" | "other";
  storage_url: string;
  signed_url: string | null;
}

interface PostReactionRow {
  post_id: string;
  user_id: string;
  emoji: string;
}

interface CommentWithAuthor {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
  authorName: string;
  authorProfileImageUrl: string | null;
}

interface CommentNode extends CommentWithAuthor {
  children: CommentNode[];
}

interface PostDetail {
  id: string;
  teacher_id: string;
  body: string;
  created_at: string;
  post_type: string | null;
  authorName: string;
  authorRole: string | null;
  authorProfileImageUrl: string | null;
  media: PostMediaRow[];
  attachments: PostAttachmentRow[];
}

interface CommentAuthorMeta {
  name: string;
  profileImageUrl: string | null;
}

type ReactionSummary = Record<string, { count: number; iMine: boolean }>;

// ─── Comment Tree ─────────────────────────────────────────────────────────────

function buildCommentTree(comments: CommentWithAuthor[]): CommentNode[] {
  const map: Record<string, CommentNode> = {};
  const roots: CommentNode[] = [];
  for (const c of comments) map[c.id] = { ...c, children: [] };
  for (const c of comments) {
    if (c.parent_comment_id && map[c.parent_comment_id]) {
      map[c.parent_comment_id].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  }
  return roots;
}

function flattenCommentTree(
  nodes: CommentNode[],
  expandedReplies: Set<string>,
  depth = 0,
): Array<{ comment: CommentNode; depth: number }> {
  const result: Array<{ comment: CommentNode; depth: number }> = [];
  for (const node of nodes) {
    result.push({ comment: node, depth });
    if (node.children.length > 0 && expandedReplies.has(node.id)) {
      result.push(...flattenCommentTree(node.children, expandedReplies, depth + 1));
    }
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function deriveReactionSummary(
  reactions: PostReactionRow[],
  userId: string | null,
): ReactionSummary {
  const summary: ReactionSummary = {};
  for (const r of reactions) {
    if (!summary[r.emoji]) summary[r.emoji] = { count: 0, iMine: false };
    summary[r.emoji].count++;
    if (r.user_id === userId) summary[r.emoji].iMine = true;
  }
  return summary;
}

const DEFAULT_REACTIONS = ["❤️", "🌱", "🌻", "🦋"];

// ─── Author Avatar ─────────────────────────────────────────────────────────────

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
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(userId), alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: FontFamilies.bodySemiBold, fontSize: size * 0.35, color: "#fff" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

// ─── Media Grid ───────────────────────────────────────────────────────────────

function MediaGrid({ media }: { media: PostMediaRow[] }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;

  if (media.length === 0) return null;
  const sorted = [...media].sort((a, b) => a.display_order - b.display_order);

  if (sorted.length === 1) {
    return (
      <View style={{ height: 240, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
        <MediaItem item={sorted[0]} style={StyleSheet.absoluteFillObject} />
      </View>
    );
  }
  if (sorted.length === 2) {
    return (
      <View style={{ flexDirection: "row", height: 180 }}>
        {sorted.map((m) => (
          <View key={m.id} style={{ flex: 1, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
            <MediaItem item={m} style={StyleSheet.absoluteFillObject} />
          </View>
        ))}
      </View>
    );
  }
  // 3+ → 2 on top, up to 3 on bottom
  const top = sorted.slice(0, 2);
  const bottom = sorted.slice(2, 5);
  const extraCount = sorted.length - 5;
  return (
    <>
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: "row", height: 200, gap: 2 }}>
          {top.map((m) => (
            <View key={m.id} style={{ flex: 1, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
              <MediaItem item={m} style={StyleSheet.absoluteFillObject} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", height: 130, gap: 2 }}>
          {bottom.map((m, idx) => {
            const isLast = idx === bottom.length - 1;
            return (
              <View key={m.id} style={{ flex: 1, overflow: "hidden", backgroundColor: "#e5e7eb", position: "relative" }}>
                <MediaItem item={m} style={StyleSheet.absoluteFillObject} />
                {isLast && extraCount > 0 && (
                  <Pressable
                    style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}
                    onPress={() => { setGalleryIndex(5); setGalleryOpen(true); }}
                  >
                    <Text style={{ fontFamily: FontFamilies.bodySemiBold, fontSize: 20, color: "#fff" }}>+{extraCount}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>
      <Modal visible={galleryOpen} transparent animationType="fade" onRequestClose={() => setGalleryOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
          <View style={{ position: "absolute", top: 56, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
            <Text style={{ color: "#fff", fontFamily: FontFamilies.body, fontSize: 14 }}>
              {galleryIndex + 1} / {sorted.length}
            </Text>
          </View>
          <Pressable
            style={{ position: "absolute", top: 56, right: 20, zIndex: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 }}
            onPress={() => setGalleryOpen(false)}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {sorted[galleryIndex]?.kind === "image" && sorted[galleryIndex]?.signed_url && (
            <View style={{ position: "absolute", bottom: 100, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 }}
                onPress={() => saveImageToLibrary(sorted[galleryIndex].signed_url!)}
                hitSlop={12}
              >
                <Ionicons name="download-outline" size={22} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Save</Text>
              </Pressable>
            </View>
          )}
          <FlatList
            data={sorted}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(m) => m.id}
            initialScrollIndex={galleryIndex}
            getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setGalleryIndex(idx);
            }}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth, flex: 1, justifyContent: "center", alignItems: "center" }}>
                {item.signed_url ? (
                  <Image source={{ uri: item.signed_url }} style={{ width: screenWidth, height: "80%" }} contentFit="contain" recyclingKey={item.id} />
                ) : (
                  <View style={{ width: screenWidth, height: 300, backgroundColor: "#333" }} />
                )}
              </View>
            )}
          />
          <View style={{ position: "absolute", bottom: 48, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 }}>
            {sorted.map((_, i) => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === galleryIndex ? "#fff" : "rgba(255,255,255,0.4)" }} />
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

function MediaItem({ item, style }: { item: PostMediaRow; style?: object }) {
  const uri = item.signed_url;
  const [viewerVisible, setViewerVisible] = useState(false);
  return (
    <>
      <Pressable
        style={style}
        onPress={() => { if (uri && item.kind === "image") setViewerVisible(true); }}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" recyclingKey={item.id} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#e5e7eb" }]} />
        )}
        {item.kind === "video" && (
          <View style={{ ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.15)" }}>
            <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
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

// ─── Reactions Sheet ──────────────────────────────────────────────────────────

interface ReactionsSheetProps {
  rawReactions: PostReactionRow[];
  userNameById: Record<string, string>;
  userProfileImageById: Record<string, string | null>;
}

const ReactionsSheet = forwardRef<BottomSheetModal, ReactionsSheetProps>(
  ({ rawReactions, userNameById, userProfileImageById }, ref) => {
    const emojisWithReactions = [...new Set(rawReactions.map((r) => r.emoji))];
    const [activeEmoji, setActiveEmoji] = useState<string>(emojisWithReactions[0] ?? "");

    // Keep activeEmoji in sync when rawReactions change (e.g. sheet opens fresh)
    useEffect(() => {
      if (!emojisWithReactions.includes(activeEmoji) && emojisWithReactions.length > 0) {
        setActiveEmoji(emojisWithReactions[0]);
      }
    }, [rawReactions]);

    const users = rawReactions.filter((r) => r.emoji === activeEmoji);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <View style={sheetStyles.header}>
          <Text style={sheetStyles.title}>Reactions</Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={sheetStyles.listContent}>
          {/* Emoji tab row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sheetStyles.tabRow}
          >
            {emojisWithReactions.map((emoji) => {
              const count = rawReactions.filter((r) => r.emoji === emoji).length;
              const active = emoji === activeEmoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[sheetStyles.tab, active && sheetStyles.tabActive]}
                  onPress={() => setActiveEmoji(emoji)}
                  activeOpacity={0.75}
                >
                  <Text style={sheetStyles.tabEmoji}>{emoji}</Text>
                  <Text style={[sheetStyles.tabCount, active && sheetStyles.tabCountActive]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* User list */}
          {users.map((r) => {
            const name = userNameById[r.user_id] ?? "User";
            const profileImageUrl = userProfileImageById[r.user_id] ?? null;
            return (
              <View key={r.user_id} style={sheetStyles.userRow}>
                <AuthorAvatar name={name} userId={r.user_id} profileImageUrl={profileImageUrl} size={38} />
                <Text style={sheetStyles.userName}>{name}</Text>
              </View>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

// ─── Post Type Badge ──────────────────────────────────────────────────────────

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

// ─── Post Header Component ────────────────────────────────────────────────────

function PostHeader({ post, onDelete, isOwn, reactionSummary, onToggleReaction, onViewReactions }: {
  post: PostDetail;
  onDelete: () => void;
  isOwn: boolean;
  reactionSummary: ReactionSummary;
  onToggleReaction: (emoji: string) => void;
  onViewReactions: () => void;
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const customEmojis = Object.keys(reactionSummary).filter(
    (e) => !DEFAULT_REACTIONS.includes(e) && reactionSummary[e].count > 0
  );
  const allEmojis = [...DEFAULT_REACTIONS, ...customEmojis];
  return (
    <View style={detailStyles.postSection}>
      <View style={[detailStyles.postHeaderRow, { paddingHorizontal: 16 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
          onPress={() =>
            router.push({
              pathname: "/(staff)/teacher/[teacherId]" as any,
              params: {
                teacherId: post.teacher_id,
                teacherName: post.authorName,
                classroom: "",
                program: "",
              },
            })
          }
        >
          <AuthorAvatar name={post.authorName} userId={post.teacher_id} profileImageUrl={post.authorProfileImageUrl} />
          <View style={{ flex: 1 }}>
            <Text style={detailStyles.authorName}>{post.authorName}</Text>
            <Text style={detailStyles.authorMeta}>
              {post.authorRole === "super_admin" || post.authorRole === "teacher" ? "Teacher" : (post.authorRole ?? "Teacher")} · {timeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwn && (
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      {(post.post_type || post.body.length > 0) && (
        <View style={{ gap: 6, marginBottom: 8, paddingHorizontal: 16 }}>
          <PostTypeBadge value={post.post_type} />
          {post.body.length > 0 && (
            <MarkdownBody body={post.body} />
          )}
        </View>
      )}
      <MediaGrid media={post.media} />
      {post.attachments.length > 0 && (
        <View style={{ gap: 6, marginTop: 4, paddingHorizontal: 16 }}>
          {post.attachments.map((att) => (
            <TouchableOpacity
              key={att.id}
              style={detailStyles.attachmentRow}
              activeOpacity={0.75}
              onPress={() => {
                if (att.signed_url) {
                  Alert.alert("Open File", `Opening ${att.file_name}...`);
                }
              }}
            >
              <Ionicons name={attachmentIcon(att.kind) as any} size={16} color="#6b7280" />
              <Text style={detailStyles.attachmentName} numberOfLines={1}>{att.file_name}</Text>
              {att.file_size_bytes != null && (
                <Text style={detailStyles.attachmentSize}>{formatFileSize(att.file_size_bytes)}</Text>
              )}
              <Ionicons name="download-outline" size={14} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Reactions inline */}
      <View style={[detailStyles.reactionsRow, { paddingHorizontal: 16 }]}>
        {allEmojis.map((emoji) => {
          const info = reactionSummary[emoji];
          const mine = info?.iMine ?? false;
          return (
            <TouchableOpacity
              key={emoji}
              style={[detailStyles.reactionPill, mine && detailStyles.reactionPillMine]}
              onPress={() => onToggleReaction(emoji)}
              activeOpacity={0.75}
            >
              <Text style={detailStyles.reactionEmoji}>{emoji}</Text>
              {(info?.count ?? 0) > 0 && (
                <Text style={[detailStyles.reactionCount, mine && detailStyles.reactionCountMine]}>
                  {info!.count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={detailStyles.reactionPill}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.75}
        >
          <Text style={[detailStyles.reactionEmoji, { fontSize: 16, color: "#6b7280" }]}>+</Text>
        </TouchableOpacity>
      </View>
      <EmojiKeyboard
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(emojiObj: EmojiType) => {
          onToggleReaction(emojiObj.emoji);
          setPickerOpen(false);
        }}
      />
      {Object.values(reactionSummary).some((r) => r.count > 0) && (
        <TouchableOpacity onPress={onViewReactions} hitSlop={8} style={{ paddingHorizontal: 16 }}>
          <Text style={detailStyles.seeReactionsLink}>See who reacted</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [rawReactions, setRawReactions] = useState<PostReactionRow[]>([]);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary>({});
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("You");
  const [myProfileImageUrl, setMyProfileImageUrl] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});
  const [userProfileImageById, setUserProfileImageById] = useState<Record<string, string | null>>({});

  const commentInputRef = useRef<TextInput>(null);
  const reactionsSheetRef = useRef<BottomSheetModal>(null);
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const replyCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    function count(nodes: CommentNode[]) {
      for (const n of nodes) {
        map[n.id] = n.children.length;
        count(n.children);
      }
    }
    count(commentTree);
    return map;
  }, [commentTree]);

  function toggleReplies(parentId: string) {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  }

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setLoading(false); return; }
    setCurrentUserId(user.id);

    const [postRes, mediaRes, attachRes, commentRes, reactionsRes] = await Promise.all([
      supabase.schema("feed").from("posts")
        .select("id, teacher_id, body, created_at, post_type")
        .eq("id", postId)
        .single(),
      supabase.schema("feed").from("post_media")
        .select("id, kind, storage_url, display_order, duration_secs")
        .eq("post_id", postId)
        .order("display_order"),
      supabase.schema("feed").from("post_attachments")
        .select("id, file_name, file_size_bytes, kind, storage_url")
        .eq("post_id", postId),
      supabase.schema("feed").from("post_comments")
        .select("id, author_id, body, created_at, parent_comment_id")
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true }),
      supabase.schema("feed").from("post_reactions")
        .select("post_id, user_id, emoji")
        .eq("post_id", postId),
    ]);

    if (postRes.error || !postRes.data) {
      setError("Post not found.");
      setLoading(false);
      return;
    }

    // Resolve author names
    const allUserIds = [...new Set([
      postRes.data.teacher_id,
      user.id,
      ...(commentRes.data ?? []).map((c) => c.author_id),
      ...(reactionsRes.data ?? []).map((r) => r.user_id),
    ])];
    const { data: userRows } = await supabase.schema("admin").from("users")
      .select("id, full_name, role, profile_image_url")
      .in("id", allUserIds);

    const nameById: Record<string, string> = {};
    const roleById: Record<string, string | null> = {};
    const profileImageById: Record<string, string | null> = {};
    for (const u of userRows ?? []) {
      nameById[u.id] = u.full_name;
      roleById[u.id] = u.role ?? null;
      profileImageById[u.id] = u.profile_image_url ?? null;
    }

    // Set my name + profile image for optimistic comments
    if (nameById[user.id]) setMyName(nameById[user.id]);
    setMyProfileImageUrl(profileImageById[user.id] ?? null);
    setUserNameById(nameById);
    setUserProfileImageById(profileImageById);

    // Signed URLs for media
    const mediaRows: PostMediaRow[] = (mediaRes.data ?? []).map((m) => ({
      ...m,
      kind: m.kind as "image" | "video",
      signed_url: null,
    }));
    const mediaPaths = mediaRows.map((m) => m.storage_url);
    const { data: signedMedia } = await supabase.storage
      .from("feed-media")
      .createSignedUrls(mediaPaths, 3600);
    const mediaWithUrls = mediaRows.map((m, i) => ({
      ...m,
      signed_url: signedMedia?.[i]?.signedUrl ?? null,
    }));

    // Signed URLs for attachments
    const attachRows: PostAttachmentRow[] = (attachRes.data ?? []).map((a) => ({
      ...a,
      kind: a.kind as PostAttachmentRow["kind"],
      signed_url: null,
    }));
    const signedAttach = await Promise.all(
      attachRows.map((a) => supabase.storage.from("feed-attachments").createSignedUrl(a.storage_url, 3600))
    );
    const attachWithUrls = attachRows.map((a, i) => ({
      ...a,
      signed_url: signedAttach[i]?.data?.signedUrl ?? null,
    }));

    const reactions = (reactionsRes.data ?? []) as PostReactionRow[];
    setRawReactions(reactions);
    setReactionSummary(deriveReactionSummary(reactions, user.id));

    setPost({
      id: postRes.data.id,
      teacher_id: postRes.data.teacher_id,
      body: postRes.data.body,
      created_at: postRes.data.created_at,
      post_type: (postRes.data as any).post_type ?? null,
      authorName: nameById[postRes.data.teacher_id] ?? "Teacher",
      authorRole: roleById[postRes.data.teacher_id] ?? null,
      authorProfileImageUrl: profileImageById[postRes.data.teacher_id] ?? null,
      media: mediaWithUrls,
      attachments: attachWithUrls,
    });

    setComments(
      (commentRes.data ?? []).map((c) => ({
        id: c.id,
        author_id: c.author_id,
        body: c.body,
        created_at: c.created_at,
        parent_comment_id: (c as any).parent_comment_id ?? null,
        authorName: nameById[c.author_id] ?? "User",
        authorProfileImageUrl: profileImageById[c.author_id] ?? null,
      }))
    );

    setLoading(false);
  }

  async function toggleReaction(emoji: string) {
    if (!currentUserId || !post) return;

    const isMine = reactionSummary[emoji]?.iMine ?? false;

    // Optimistic update
    setReactionSummary((prev) => ({
      ...prev,
      [emoji]: {
        count: isMine
          ? Math.max(0, (prev[emoji]?.count ?? 1) - 1)
          : (prev[emoji]?.count ?? 0) + 1,
        iMine: !isMine,
      },
    }));

    if (isMine) {
      const { error } = await supabase.schema("feed").from("post_reactions")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji);
      if (error) {
        setReactionSummary(deriveReactionSummary(rawReactions, currentUserId));
      } else {
        const updated = rawReactions.filter(
          (r) => !(r.emoji === emoji && r.user_id === currentUserId)
        );
        setRawReactions(updated);
        setReactionSummary(deriveReactionSummary(updated, currentUserId));
      }
    } else {
      const { data, error } = await supabase.schema("feed").from("post_reactions")
        .insert({ post_id: post.id, user_id: currentUserId, emoji })
        .select("post_id, user_id, emoji")
        .single();
      if (error) {
        setReactionSummary(deriveReactionSummary(rawReactions, currentUserId));
      } else {
        const updated = [...rawReactions, data as PostReactionRow];
        setRawReactions(updated);
        setReactionSummary(deriveReactionSummary(updated, currentUserId));
      }
    }
  }

  async function submitComment() {
    if (!commentText.trim() || !currentUserId || !post) return;
    const body = commentText.trim();
    const tempId = `temp-${Date.now()}`;
    const parentId = replyingTo?.id ?? null;

    setComments((prev) => [
      ...prev,
      { id: tempId, author_id: currentUserId, body, created_at: new Date().toISOString(), parent_comment_id: parentId, authorName: myName, authorProfileImageUrl: myProfileImageUrl },
    ]);
    if (parentId) {
      setExpandedReplies(prev => new Set(prev).add(parentId));
    }
    setCommentText("");
    setReplyingTo(null);
    setSubmittingComment(true);

    const { data, error } = await supabase.schema("feed").from("post_comments")
      .insert({ post_id: post.id, author_id: currentUserId, body, parent_comment_id: parentId })
      .select("id, created_at")
      .single();

    setSubmittingComment(false);

    if (error) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentText(body);
      setReplyingTo(parentId ? replyingTo : null);
    } else {
      setComments((prev) =>
        prev.map((c) => c.id === tempId ? { ...c, id: data.id, created_at: data.created_at } : c)
      );
    }
  }

  async function deleteComment(commentId: string) {
    if (!currentUserId) return;
    Alert.alert("Delete Comment", "Delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const { error } = await supabase.schema("feed").from("post_comments")
            .update({ is_deleted: true })
            .eq("id", commentId)
            .eq("author_id", currentUserId);
          if (!error) {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          }
        },
      },
    ]);
  }

  async function deletePost() {
    if (!post || !currentUserId) return;
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const { error } = await supabase.schema("feed").from("posts")
            .update({ is_deleted: true })
            .eq("id", post.id)
            .eq("teacher_id", currentUserId);
          if (error) {
            Alert.alert("Error", "Could not delete post.");
          } else {
            router.back();
          }
        },
      },
    ]);
  }

  // ── Render ──

  if (loading) {
    return (
      <SafeAreaView style={detailStyles.safe} edges={["top", "left", "right"]}>
        <View style={detailStyles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={detailStyles.navTitle}>Post</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <SkeletonBox width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width="45%" height={13} borderRadius={4} />
              <SkeletonBox width="28%" height={11} borderRadius={4} />
            </View>
          </View>
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="80%" height={14} borderRadius={4} />
          <SkeletonBox width="100%" height={160} borderRadius={10} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={detailStyles.safe} edges={["top", "left", "right"]}>
        <View style={detailStyles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={detailStyles.navTitle}>Post</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={detailStyles.errorCard}>
            <Text style={detailStyles.errorText}>{error ?? "Post not found."}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isOwn = post.teacher_id === currentUserId;

  // Reactions row content (header for FlatList)
  const ListHeader = (
    <>
      <PostHeader
        post={post}
        onDelete={deletePost}
        isOwn={isOwn}
        reactionSummary={reactionSummary}
        onToggleReaction={toggleReaction}
        onViewReactions={() => reactionsSheetRef.current?.present()}
      />

      {/* Comments heading */}
      <View style={detailStyles.commentsHeading}>
        <Text style={detailStyles.sectionTitle}>Comments</Text>
        <Text style={detailStyles.commentCountLabel}>{comments.length}</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={detailStyles.safe} edges={["top", "left", "right"]}>
      {/* Nav bar */}
      <View style={detailStyles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={detailStyles.navTitle} numberOfLines={1}>{post.authorName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={flattenCommentTree(commentTree, expandedReplies)}
          keyExtractor={(item) => item.comment.id}
          contentContainerStyle={detailStyles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          extraData={reactionSummary}
          ListEmptyComponent={
            <View style={detailStyles.emptyComments}>
              <Text style={detailStyles.emptyCommentsText}>No comments yet. Be the first!</Text>
            </View>
          }
          renderItem={({ item: { comment, depth } }) => {
            const indent = Math.min(depth, 4) * 28;
            const avatarSize = depth === 0 ? 34 : 26;
            const isOwnComment = comment.author_id === currentUserId;
            const childCount = replyCountMap[comment.id] ?? 0;
            const isExpanded = expandedReplies.has(comment.id);
            return (
              <TouchableOpacity
                style={[detailStyles.commentRow, { paddingLeft: 16 + indent }]}
                activeOpacity={0.85}
                onLongPress={() => {
                  if (comment.author_id === currentUserId) deleteComment(comment.id);
                }}
              >
                <AuthorAvatar name={comment.authorName} userId={comment.author_id} profileImageUrl={comment.authorProfileImageUrl} size={avatarSize} />
                <View style={detailStyles.commentContent}>
                  <View style={detailStyles.commentMeta}>
                    <Text style={[detailStyles.commentAuthor, isOwnComment && detailStyles.commentAuthorOwn]}>{comment.authorName}</Text>
                    <Text style={detailStyles.commentTime}>{timeAgo(comment.created_at)}</Text>
                  </View>
                  <View style={detailStyles.speechBubble}>
                    <View style={detailStyles.speechTail} />
                    <Text style={detailStyles.commentBody}>{comment.body}</Text>
                  </View>
                  <View style={detailStyles.commentActions}>
                    <TouchableOpacity
                      style={detailStyles.replyBtn}
                      onPress={() => {
                        setReplyingTo({ id: comment.id, authorName: comment.authorName });
                        commentInputRef.current?.focus();
                      }}
                      hitSlop={8}
                    >
                      <Text style={detailStyles.replyBtnText}>Reply</Text>
                    </TouchableOpacity>
                    {childCount > 0 && (
                      <TouchableOpacity
                        style={detailStyles.replyBtn}
                        onPress={() => toggleReplies(comment.id)}
                        hitSlop={8}
                      >
                        <Text style={detailStyles.replyBtnText}>
                          {isExpanded ? "Hide replies" : `Show ${childCount} ${childCount === 1 ? "reply" : "replies"}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Replying-to banner */}
        {replyingTo && (
          <View style={detailStyles.replyBanner}>
            <Text style={detailStyles.replyBannerText}>Replying to <Text style={{ fontFamily: FontFamilies.bodySemiBold }}>{replyingTo.authorName}</Text></Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={8}>
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Comment input */}
        <View style={detailStyles.commentInputBar}>
          {currentUserId && (
            <AuthorAvatar name={myName} userId={currentUserId} profileImageUrl={myProfileImageUrl} size={32} />
          )}
          <TextInput
            ref={commentInputRef}
            style={detailStyles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[detailStyles.sendBtn, (!commentText.trim() || submittingComment) && { opacity: 0.4 }]}
            onPress={submitComment}
            disabled={!commentText.trim() || submittingComment}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ReactionsSheet
        ref={reactionsSheetRef}
        rawReactions={rawReactions}
        userNameById={userNameById}
        userProfileImageById={userProfileImageById}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  navTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
  },
  listContent: { paddingBottom: 32 },

  // Post section
  postSection: {
    backgroundColor: "#ffffff",
    marginBottom: 8,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  authorMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
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

  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },

  // Reactions
  reactionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  reactionEmoji: { fontSize: 17 },
  reactionCount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
  },
  reactionCountMine: { color: "#d47f75" },
  seeReactionsLink: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  // Comments
  commentsHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  commentCountLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  commentContent: { flex: 1 },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    paddingLeft: 2,
  },
  commentAuthor: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#9ca3af",
  },
  commentAuthorOwn: {
    color: "#4b5563",
  },
  commentTime: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  speechBubble: {
    backgroundColor: "#EEF4EF",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignSelf: "flex-start",
    position: "relative",
  },
  speechTail: {
    position: "absolute",
    top: 0,
    left: -6,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopColor: "#EEF4EF",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  commentBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  emptyComments: {
    padding: 24,
    alignItems: "center",
  },
  emptyCommentsText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  commentActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  replyBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  replyBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  replyBannerText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },

  // Comment input
  commentInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.coral,
    alignItems: "center",
    justifyContent: "center",
  },

  // Error
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
});

const sheetStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    borderColor: "#f29a8f",
    backgroundColor: "#fde8e6",
  },
  tabEmoji: { fontSize: 18 },
  tabCount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
  },
  tabCountActive: { color: "#d47f75" },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },
});
