// Parent feed list: wraps the shared useFeedPosts with the parent's filter,
// sheets and a quiet refresh on focus (so reactions/comments made in a post's
// detail screen show up when you come back). UI lives in ./garden.
import type { PostReactionRow, PostWithMeta } from "@/components/feed/feedTypes";
import { useFeedPosts } from "@/components/feed/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const PARENT_FEED_COPY = {
  title: "Family feed",
  subtitle: "Updates, events, and announcements",
  emptyHeading: "No Posts Yet",
  emptyBody: "Check back soon for updates from teachers and the school calendar.",
} as const;

export function useParentFeed() {
  const router = useRouter();
  const { isReadOnlyPreview } = useAuth();
  const [filterTeacherId, setFilterTeacherId] = useState<string | null>(null);
  const feed = useFeedPosts(filterTeacherId, { pageSize: 8 });

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
      router.push({ pathname: "/(tabs)/feed/[postId]", params: { postId: post.id } });
    },
    [router],
  );

  const openTeacher = useCallback(
    (post: PostWithMeta) => {
      router.push({
        pathname: "/(tabs)/teacher/[teacherId]" as never,
        params: {
          teacherId: post.teacher_id,
          teacherName: post.authorName,
          classroom: post.classroom ?? "",
          program: "",
        },
      });
    },
    [router],
  );

  const showReactions = useCallback((post: PostWithMeta, emoji: string) => {
    // The sheet is always mounted, so present() works on the first long-press.
    setReactionTarget({ reactions: post.reactions, initialEmoji: emoji });
    reactionSheetRef.current?.present();
  }, []);

  const selectTeacher = useCallback((id: string | null) => {
    setFilterTeacherId(id);
    filterSheetRef.current?.dismiss();
  }, []);

  return {
    ...feed,
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
    viewer,
    setViewer,
  };
}

export type ParentFeed = ReturnType<typeof useParentFeed>;
