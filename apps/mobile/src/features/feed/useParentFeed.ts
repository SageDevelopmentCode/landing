// Feed list for both apps: wraps the shared useFeedPosts with the filter,
// sheets and a quiet refresh on focus (so reactions/comments made in a post's
// detail screen — or a new post from compose — show up when you come back).
// mode "parent" is the family feed; mode "staff" adds compose + delete and
// routes into /(staff). UI lives in ./garden.
import type { PostReactionRow, PostWithMeta } from "@/components/feed/feedTypes";
import { canDeleteFeedPost, feedPostDeleteRpcName } from "@/components/feed/feedUtils";
import { useFeedPosts } from "@/components/feed/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export type FeedMode = "parent" | "staff";

export const PARENT_FEED_COPY = {
  title: "Family feed",
  subtitle: "Updates, events, and announcements",
  emptyHeading: "No Posts Yet",
  emptyBody: "Check back soon for updates from teachers and the school calendar.",
} as const;

export const STAFF_FEED_COPY = {
  title: "Class feed",
  subtitle: "Posts and automatic updates for families",
  emptyHeading: "No Posts Yet",
  emptyBody: "Share a post or publish photos, activities, and events to notify parents.",
} as const;

const ROUTES = {
  parent: {
    post: "/(tabs)/feed/[postId]",
    teacher: "/(tabs)/teacher/[teacherId]",
    compose: null,
  },
  staff: {
    post: "/(staff)/feed/[postId]",
    teacher: "/(staff)/teacher/[teacherId]",
    compose: "/(staff)/feed/compose",
  },
} as const;

export function useFeedList(mode: FeedMode = "parent") {
  const router = useRouter();
  const { isReadOnlyPreview: authReadOnly } = useAuth();
  // Read-only preview is a parent-side concept (admin viewing as a parent).
  const isReadOnlyPreview = mode === "parent" ? authReadOnly : false;
  const isStaff = mode === "staff";
  const copy = isStaff ? STAFF_FEED_COPY : PARENT_FEED_COPY;
  const routes = ROUTES[mode];

  const [filterTeacherId, setFilterTeacherId] = useState<string | null>(null);
  const feed = useFeedPosts(filterTeacherId, {
    pageSize: 8,
    errorTag: isStaff ? "staff-feed-fetch" : "parent-feed-fetch",
  });

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const reactionSheetRef = useRef<BottomSheetModal>(null);
  const [reactionTarget, setReactionTarget] = useState<{
    reactions: PostReactionRow[];
    initialEmoji: string;
  } | null>(null);

  // Photo viewer
  const [viewer, setViewer] = useState<{ post: PostWithMeta; index: number } | null>(null);

  const reloadRef = useRef(feed.reload);
  useEffect(() => {
    reloadRef.current = feed.reload;
  }, [feed.reload]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void reloadRef.current();
      focusedOnce.current = true;
    }, []),
  );

  const filterTeacherName =
    feed.teachers.find((t) => t.id === filterTeacherId)?.full_name ?? null;

  const openPost = useCallback(
    (post: PostWithMeta) => {
      router.push({ pathname: routes.post, params: { postId: post.id } });
    },
    [router, routes.post],
  );

  const openTeacher = useCallback(
    (post: PostWithMeta) => {
      router.push({
        pathname: routes.teacher as never,
        params: {
          teacherId: post.teacher_id,
          teacherName: post.authorName,
          classroom: post.classroom ?? "",
          program: "",
        },
      });
    },
    [router, routes.teacher],
  );

  const openCompose = useCallback(() => {
    if (routes.compose) router.push(routes.compose as never);
  }, [router, routes.compose]);

  const showReactions = useCallback((post: PostWithMeta, emoji: string) => {
    // The sheet is always mounted, so present() works on the first long-press.
    setReactionTarget({ reactions: post.reactions, initialEmoji: emoji });
    reactionSheetRef.current?.present();
  }, []);

  const selectTeacher = useCallback((id: string | null) => {
    setFilterTeacherId(id);
    filterSheetRef.current?.dismiss();
  }, []);

  // ── Staff: delete ─────────────────────────────────────────────────────────
  const canDelete = useCallback(
    (post: PostWithMeta) =>
      isStaff && canDeleteFeedPost(post, feed.currentUserId, feed.currentUserRole),
    [isStaff, feed.currentUserId, feed.currentUserRole],
  );

  const deletingRef = useRef(new Set<string>());
  const { removePost, currentUserRole } = feed;
  const deletePost = useCallback(
    async (post: PostWithMeta): Promise<{ ok: boolean; error?: string }> => {
      if (!canDelete(post)) return { ok: false, error: "You can't delete this post." };
      if (deletingRef.current.has(post.id)) return { ok: true };
      deletingRef.current.add(post.id);
      try {
        const { error } = await supabase
          .schema("feed")
          .rpc(feedPostDeleteRpcName(currentUserRole), { p_post_id: post.id });
        if (error) {
          notifyError("staff-feed-delete-post", error);
          return { ok: false, error: error.message };
        }
        removePost(post.id);
        return { ok: true };
      } catch (e) {
        notifyError("staff-feed-delete-post", e);
        return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
      } finally {
        deletingRef.current.delete(post.id);
      }
    },
    [canDelete, currentUserRole, removePost],
  );

  return {
    ...feed,
    mode,
    isStaff,
    copy,
    router,
    isReadOnlyPreview,
    filterTeacherId,
    filterTeacherName,
    selectTeacher,
    filterSheetRef,
    reactionSheetRef,
    reactionTarget,
    showReactions,
    openPost,
    openTeacher,
    openCompose,
    canDelete,
    deletePost,
    viewer,
    setViewer,
  };
}

/** The family feed (parent app). */
export function useParentFeed() {
  return useFeedList("parent");
}

export type FeedList = ReturnType<typeof useFeedList>;
/** @deprecated kept for existing imports — same shape as FeedList. */
export type ParentFeed = FeedList;
