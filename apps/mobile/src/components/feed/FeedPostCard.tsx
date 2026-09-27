import { Brand, FontFamilies } from "@/constants/theme";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { FeedMediaGrid } from "./FeedMediaGrid";
import { FeedPostTypeBadge } from "./FeedPostTypeBadge";
import { FeedReactionRow } from "./FeedReactionRow";
import { FeedTheme } from "./feedTheme";
import type { PostAttachmentRow, PostWithMeta } from "./feedTypes";
import {
  attachmentIcon,
  formatAuthorSubtitle,
  formatFileSize,
  isManualFeedPost,
  pushFeedCtaRoute,
  resolveFeedCtaRoute,
  timeAgo,
} from "./feedUtils";

export function FeedPostCard({
  post,
  currentUserId,
  onPress,
  onReact,
  onLongPressReaction,
  onDeletePress,
  teacherProfilePath,
  staffFeed,
}: {
  post: PostWithMeta;
  currentUserId: string | null;
  onPress: () => void;
  onReact: (emoji: string) => void;
  onLongPressReaction?: (emoji: string) => void;
  onDeletePress?: () => void;
  teacherProfilePath: "/(tabs)/teacher/[teacherId]" | "/(staff)/teacher/[teacherId]";
  staffFeed?: boolean;
}) {
  const router = useRouter();
  const canDelete =
    onDeletePress &&
    post.teacher_id === currentUserId &&
    isManualFeedPost(post.source_type);
  const isOwn = canDelete;
  const subtitle = formatAuthorSubtitle(post.classroom, post.authorRole);
  const showTeacherProfile =
    post.authorRole === "teacher" || post.authorRole === "super_admin";
  const ctaRoute =
    post.cta_route && post.cta_label
      ? resolveFeedCtaRoute(post.cta_route, !!staffFeed)
      : null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.97} onPress={onPress}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          activeOpacity={showTeacherProfile ? 0.8 : 1}
          style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
          onPress={(e) => {
            if (!showTeacherProfile) return;
            e.stopPropagation?.();
            router.push({
              pathname: teacherProfilePath as any,
              params: {
                teacherId: post.teacher_id,
                teacherName: post.authorName,
                classroom: post.classroom ?? "",
                program: "",
              },
            });
          }}
        >
          <AuthorAvatar
            name={post.authorName}
            userId={post.teacher_id}
            profileImageUrl={post.authorProfileImageUrl}
            size={46}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName} numberOfLines={1}>{post.authorName}</Text>
            <Text style={styles.authorMeta}>
              {subtitle} · {timeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwn && (
          <TouchableOpacity onPress={onDeletePress} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {(post.post_type || post.body.length > 0) && (
        <View style={styles.bodyBlock}>
          <FeedPostTypeBadge value={post.post_type} />
          {post.body.length > 0 && <MarkdownBody body={post.body} collapsible leadBold />}
        </View>
      )}

      <FeedMediaGrid media={post.media} />

      {ctaRoute && post.cta_label ? (
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={(e) => {
              e.stopPropagation?.();
              pushFeedCtaRoute(router, ctaRoute);
            }}
          >
            <Text style={styles.ctaBtnText}>{post.cta_label}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {post.attachments.length > 0 && (
        <View style={styles.attachmentList}>
          {post.attachments.map((att: PostAttachmentRow) => (
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

      <View style={styles.cardFooter}>
        <View style={{ flex: 1 }}>
          <FeedReactionRow
            reactions={post.reactions}
            currentUserId={currentUserId}
            onReact={onReact}
            onLongPressReaction={onLongPressReaction}
          />
        </View>
        <TouchableOpacity style={styles.replyBtn} activeOpacity={0.7} onPress={onPress}>
          <Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FeedTheme.cardBg,
    borderRadius: FeedTheme.cardRadius,
    marginHorizontal: FeedTheme.cardMarginH,
    marginBottom: FeedTheme.cardGap,
    paddingBottom: 4,
    ...FeedTheme.shadow,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: FeedTheme.cardPaddingH,
    paddingTop: 18,
    paddingBottom: 10,
  },
  authorName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: FeedTheme.authorName,
  },
  authorMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: FeedTheme.meta,
    marginTop: 3,
  },
  bodyBlock: {
    paddingHorizontal: FeedTheme.cardPaddingH,
    paddingBottom: 10,
    gap: 10,
  },
  ctaWrap: {
    paddingHorizontal: FeedTheme.cardPaddingH,
    paddingBottom: 12,
  },
  ctaBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  attachmentList: { gap: 6, paddingHorizontal: FeedTheme.cardPaddingH, paddingBottom: 8 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAF7F4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#EDE8E2",
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
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: FeedTheme.cardPaddingH,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3EDE6",
    marginTop: 4,
  },
  replyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  replyText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: FeedTheme.reply,
  },
});
