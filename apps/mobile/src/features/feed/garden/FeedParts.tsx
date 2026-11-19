// Garden UI for the feed list — parent "Family feed" and staff "Class feed"
// (f.isStaff adds back, compose and delete).
import type { PostReactionRow, PostWithMeta } from "@/components/feed/feedTypes";
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
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  HandNote,
  PressableScale,
  gardenCard,
  gardenSheetChrome,
  haptic,
} from "@/components/garden";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { supabase } from "@/lib/supabase";
import { BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { FeedList as ParentFeed } from "../useParentFeed";
import { AttachmentRow, MediaMosaic, PostTypePill, ReactionBar } from "./FeedBits";
import type { FeedFeedback } from "./useFeedFeedback";

export const GUTTER = 18;
const CARD_PAD = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Hero + active filter chip
// ─────────────────────────────────────────────────────────────────────────────
export function FeedHero({ f, onBack }: { f: ParentFeed; onBack?: () => void }) {
  return (
    <View style={hero.wrap}>
      <View style={hero.row}>
        {onBack ? <GardenIconButton icon="chevron-back" label="Back" onPress={onBack} /> : null}
        <View style={{ flex: 1 }}>
          <Display size={onBack ? 30 : 34} numberOfLines={1}>
            {f.copy.title}
          </Display>
          <Text style={hero.sub} maxFontSizeMultiplier={1.35}>
            {f.copy.subtitle}
          </Text>
        </View>
        <GardenIconButton
          icon={f.filterTeacherId ? "funnel" : "funnel-outline"}
          label={f.filterTeacherName ? `Filter by Teacher, showing ${f.filterTeacherName}` : "Filter by Teacher"}
          onPress={() => f.filterSheetRef.current?.present()}
          dot={!!f.filterTeacherId}
        />
      </View>
      {f.filterTeacherName ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ flexDirection: "row", marginTop: 12 }}>
          <PressableScale
            haptics="select"
            onPress={() => f.selectTeacher(null)}
            accessibilityLabel={`Showing posts from ${f.filterTeacherName}. Double tap to show All Teachers`}
            style={hero.chip}
          >
            <GardenAvatar name={f.filterTeacherName} size={24} />
            <Text style={hero.chipText} numberOfLines={1}>
              {f.filterTeacherName}
            </Text>
            <Ionicons name="close-circle" size={18} color={Garden.sageDeep} />
          </PressableScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

const hero = StyleSheet.create({
  wrap: { paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: GardenRadii.pill,
    backgroundColor: "#e1eee3",
    maxWidth: "100%",
  },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep, flexShrink: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Post card
// ─────────────────────────────────────────────────────────────────────────────
type CardProps = {
  post: PostWithMeta;
  f: ParentFeed;
  fb: FeedFeedback;
  index: number;
};

function PostCardImpl({ post, f, fb, index }: CardProps) {
  const { width } = useWindowDimensions();
  const innerW = width - GUTTER * 2 - CARD_PAD * 2;
  const subtitle = formatAuthorSubtitle(post.classroom, post.authorRole);
  const isTeacher = post.authorRole === "teacher" || post.authorRole === "super_admin";
  const ctaRoute = post.cta_route && post.cta_label ? resolveFeedCtaRoute(post.cta_route, f.isStaff) : null;
  const isNewsletter = post.post_type === "newsletter" || post.source_type === "newsletter";
  // Parents open the public newsletter page; staff go to the in-app editor.
  const newsletterUrl =
    !f.isStaff && isNewsletter && post.cta_route ? newsletterPublicUrlFromCtaRoute(post.cta_route) : null;
  const deletable = f.canDelete(post);

  return (
    <Animated.View entering={index < 4 ? FadeInDown.delay(index * 60).springify().damping(18) : undefined}>
      <PressableScale
        pressedScale={0.985}
        haptics={false}
        onPress={() => f.openPost(post)}
        accessibilityLabel={`Post from ${post.authorName}, ${timeAgo(post.created_at)}`}
        accessibilityHint="Opens the post and comments"
        style={card.card}
      >
        {/* Author */}
        <View style={card.header}>
          <PressableScale
            disabled={!isTeacher}
            haptics={isTeacher ? "tap" : false}
            pressedScale={0.97}
            onPress={() => f.openTeacher(post)}
            accessibilityRole={isTeacher ? "link" : "text"}
            accessibilityLabel={isTeacher ? `${post.authorName}, view profile` : post.authorName}
            style={card.author}
          >
            <GardenAvatar name={post.authorName} uri={post.authorProfileImageUrl} seed={post.teacher_id} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={card.name} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {post.authorName}
              </Text>
              <Text style={card.meta} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {subtitle} · {timeAgo(post.created_at)}
              </Text>
            </View>
          </PressableScale>
          {deletable ? (
            <GardenIconButton
              icon="ellipsis-horizontal"
              tone="ghost"
              size={40}
              label={`Post options for ${post.authorName}'s post`}
              onPress={() => fb.openPostMenu(post)}
            />
          ) : null}
        </View>

        {/* Body */}
        {post.post_type || post.body.length > 0 ? (
          <View style={card.body}>
            <PostTypePill value={post.post_type} />
            {post.body.length > 0 ? <MarkdownBody body={post.body} collapsible leadBold garden /> : null}
          </View>
        ) : null}

        {/* Media */}
        {post.media.length > 0 ? (
          <View style={{ paddingHorizontal: CARD_PAD, paddingBottom: 12 }}>
            <MediaMosaic media={post.media} width={innerW} onOpen={(i) => f.setViewer({ post, index: i })} />
          </View>
        ) : null}

        {/* CTA */}
        {ctaRoute && post.cta_label ? (
          <View style={{ paddingHorizontal: CARD_PAD, paddingBottom: 12 }}>
            <GardenButton
              label={post.cta_label}
              tone="sage"
              size="md"
              iconRight="arrow-forward"
              fullWidth
              onPress={() => {
                if (newsletterUrl) {
                  void fb.openLink(newsletterUrl);
                  return;
                }
                pushFeedCtaRoute(f.router, ctaRoute);
              }}
            />
          </View>
        ) : null}

        {/* Attachments (open from the post) */}
        {post.attachments.length > 0 ? (
          <View style={{ paddingHorizontal: CARD_PAD, paddingBottom: 12, gap: 6 }}>
            {post.attachments.map((a) => (
              <AttachmentRow key={a.id} att={a} onPress={() => f.openPost(post)} hint="Opens the post to view the file" />
            ))}
          </View>
        ) : null}

        {/* Footer */}
        <View style={card.footer}>
          <View style={{ flex: 1 }}>
            <ReactionBar
              reactions={post.reactions}
              currentUserId={f.currentUserId}
              onReact={(emoji) => fb.react(post, emoji)}
              onLongPress={(emoji) => f.showReactions(post, emoji)}
            />
          </View>
          <PressableScale
            pressedScale={0.94}
            onPress={() => f.openPost(post)}
            accessibilityLabel={`Reply${post.commentCount ? `, ${post.commentCount} comment${post.commentCount === 1 ? "" : "s"}` : ""}`}
            style={card.reply}
          >
            <Ionicons name="chatbubble-outline" size={17} color={Garden.sageDeep} />
            {post.commentCount > 0 ? (
              <Text style={card.replyCount} maxFontSizeMultiplier={1.2}>
                {post.commentCount}
              </Text>
            ) : (
              <Text style={card.replyText} maxFontSizeMultiplier={1.2}>
                Reply
              </Text>
            )}
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export const PostCard = memo(PostCardImpl);

const card = StyleSheet.create({
  card: { ...gardenCard, borderRadius: 26, marginHorizontal: GUTTER, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: CARD_PAD, paddingTop: 14, paddingBottom: 10 },
  author: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minHeight: 44 },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  meta: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.muted, marginTop: 1 },
  body: { paddingHorizontal: CARD_PAD, paddingBottom: 12, gap: 10 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: CARD_PAD - 4,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5ede1",
  },
  reply: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#e1eee3",
  },
  replyText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep },
  replyCount: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep },
});

// ─────────────────────────────────────────────────────────────────────────────
// List states
// ─────────────────────────────────────────────────────────────────────────────
export function FeedSkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 16 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[card.card, { padding: CARD_PAD, gap: 12, marginBottom: 0 }]}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <GardenSkeleton width={44} height={44} radius={22} />
            <View style={{ gap: 6, flex: 1 }}>
              <GardenSkeleton width="50%" height={14} radius={6} />
              <GardenSkeleton width="35%" height={11} radius={6} />
            </View>
          </View>
          <GardenSkeleton width={90} height={20} radius={10} />
          <GardenSkeleton width="100%" height={13} radius={6} />
          <GardenSkeleton width="80%" height={13} radius={6} />
          {i === 0 ? <GardenSkeleton width="100%" height={180} radius={14} /> : null}
          <View style={{ flexDirection: "row", gap: 7 }}>
            {[0, 1, 2, 3].map((k) => (
              <GardenSkeleton key={k} width={44} height={40} radius={20} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function FeedEmptyOrError({ f, fb }: { f: ParentFeed; fb: FeedFeedback }) {
  if (f.loading) return <FeedSkeletonCards />;
  if (f.error) {
    return (
      <View style={{ paddingHorizontal: GUTTER }}>
        <GardenErrorCard title="We couldn't load the feed" onRetry={() => void fb.retryLoad()} retrying={fb.retrying} />
      </View>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(220)} style={{ paddingHorizontal: GUTTER }}>
      <GardenEmpty
        emoji="🌱"
        title={f.copy.emptyHeading}
        body={f.copy.emptyBody}
        tint="mint"
        actionLabel={f.filterTeacherId ? "All Teachers" : f.isStaff ? "Write a post" : undefined}
        onAction={
          f.filterTeacherId ? () => f.selectTeacher(null) : f.isStaff ? f.openCompose : undefined
        }
      />
    </Animated.View>
  );
}

export function FeedFooter({ f }: { f: ParentFeed }) {
  if (f.posts.length === 0) return null;
  if (f.loadingMore) {
    return (
      <View style={{ paddingTop: 2 }}>
        <FeedSkeletonCards count={1} />
      </View>
    );
  }
  if (f.loadMoreError) {
    return (
      <View style={{ paddingHorizontal: GUTTER }}>
        <GardenErrorCard
          title="Couldn't load more posts"
          onRetry={() => {
            haptic.tap();
            void f.loadMore();
          }}
        />
      </View>
    );
  }
  if (!f.hasMore) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 18 }}>
        <HandNote size={18}>you're all caught up 🌿</HandNote>
      </View>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheets: teacher filter + who reacted
// ─────────────────────────────────────────────────────────────────────────────
export function TeacherFilterSheet({ f }: { f: ParentFeed }) {
  const data = useMemo(
    () => [{ id: "__all__", full_name: "All Teachers" }, ...f.teachers],
    [f.teachers],
  );
  return (
    <BottomSheetModal ref={f.filterSheetRef} {...gardenSheetChrome} snapPoints={["55%", "88%"]} enableDynamicSizing={false}>
      <View style={sh.head}>
        <Display size={24}>Filter by Teacher</Display>
        <HandNote size={16}>see posts from one guide</HandNote>
      </View>
      <BottomSheetFlatList
        data={data}
        keyExtractor={(t: { id: string }) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 6 }}
        renderItem={({ item }: { item: { id: string; full_name: string } }) => {
          const isAll = item.id === "__all__";
          const selected = isAll ? !f.filterTeacherId : f.filterTeacherId === item.id;
          return (
            <PressableScale
              haptics="select"
              pressedScale={0.98}
              onPress={() => f.selectTeacher(isAll ? null : item.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={item.full_name}
              style={[sh.row, selected && sh.rowOn]}
            >
              {isAll ? (
                <View style={[sh.allIcon]}>
                  <Ionicons name="people" size={18} color={Garden.white} />
                </View>
              ) : (
                <GardenAvatar name={item.full_name} seed={item.id} size={38} />
              )}
              <Text style={sh.rowText} numberOfLines={1}>
                {item.full_name}
              </Text>
              {selected ? <Ionicons name="checkmark-circle" size={22} color={Garden.sageDeep} /> : null}
            </PressableScale>
          );
        }}
      />
    </BottomSheetModal>
  );
}

export function ReactionViewersSheet({ f }: { f: ParentFeed }) {
  const reactions: PostReactionRow[] = f.reactionTarget?.reactions ?? [];
  const emojis = useMemo(() => [...new Set(reactions.map((r) => r.emoji))], [reactions]);
  const [selected, setSelected] = useState<string>("");
  const [people, setPeople] = useState<Record<string, { name: string; img: string | null }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelected(f.reactionTarget?.initialEmoji || emojis[0] || "");
  }, [f.reactionTarget, emojis]);

  const idsKey = useMemo(() => [...new Set(reactions.map((r) => r.user_id))].sort().join(","), [reactions]);
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    setLoading(true);
    void supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, profile_image_url")
      .in("id", idsKey.split(","))
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, { name: string; img: string | null }> = {};
        for (const u of data ?? []) map[u.id] = { name: u.full_name, img: u.profile_image_url ?? null };
        setPeople(map);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const list = reactions.filter((r) => r.emoji === selected);

  return (
    <BottomSheetModal ref={f.reactionSheetRef} {...gardenSheetChrome} snapPoints={["50%", "85%"]} enableDynamicSizing={false}>
      <View style={sh.head}>
        <Display size={24}>Reactions</Display>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {emojis.map((e) => {
            const on = e === selected;
            const count = reactions.filter((r) => r.emoji === e).length;
            return (
              <Pressable
                key={e}
                onPress={() => {
                  haptic.select();
                  setSelected(e);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${e}, ${count}`}
                style={[sh.tab, on && sh.tabOn]}
              >
                <Text style={{ fontSize: 18 }}>{e}</Text>
                <Text style={[sh.tabCount, on && { color: Garden.white }]}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 4 }}>
        {loading
          ? [0, 1, 2].map((i) => (
              <View key={i} style={[sh.row, { backgroundColor: "transparent" }]}>
                <GardenSkeleton width={38} height={38} radius={19} />
                <GardenSkeleton width="50%" height={14} radius={6} />
              </View>
            ))
          : list.map((r) => {
              const p = people[r.user_id];
              return (
                <View key={r.user_id} style={[sh.row, { backgroundColor: "transparent" }]}>
                  <GardenAvatar name={p?.name ?? "User"} uri={p?.img} seed={r.user_id} size={38} />
                  <Text style={sh.rowText}>{p?.name ?? "User"}</Text>
                </View>
              );
            })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const sh = StyleSheet.create({
  head: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: Garden.white,
  },
  rowOn: { backgroundColor: "#e1eee3" },
  rowText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  allIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Garden.sageDeep,
    alignItems: "center",
    justifyContent: "center",
  },
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
});

// ─────────────────────────────────────────────────────────────────────────────
// Staff: compose FAB
// ─────────────────────────────────────────────────────────────────────────────
export function ComposeFab({ f, bottom }: { f: ParentFeed; bottom: number }) {
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[fab.wrap, { bottom }]} pointerEvents="box-none">
      <PressableScale
        haptics="press"
        onPress={f.openCompose}
        accessibilityLabel="Write a post"
        accessibilityHint="Opens the post composer"
        style={fab.btn}
      >
        <Ionicons name="create-outline" size={20} color={Garden.white} />
        <Text style={fab.text} maxFontSizeMultiplier={1.2}>
          New post
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const fab = StyleSheet.create({
  wrap: { position: "absolute", right: GUTTER },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.coralDeep,
    borderBottomWidth: 4,
    borderBottomColor: "#c0594d",
    shadowColor: "#2b2a26",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  text: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.white },
});
