import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type {
  PostAttachmentRow,
  PostMediaRow,
  PostReactionRow,
  PostWithMeta,
  TeacherOption,
} from "./feedTypes";

const PAGE_SIZE = 4;

export function useFeedPosts(filterTeacherId: string | null) {
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPage(0);
    setHasMore(true);
    setPosts([]);
    loadPage(0, false, () => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTeacherId]);

  useEffect(() => {
    supabase
      .schema("admin")
      .from("users")
      .select("id, full_name")
      .in("role", ["teacher", "super_admin"])
      .order("full_name")
      .then(({ data }) => {
        if (data) setTeachers(data);
      });
  }, []);

  async function loadPage(pageIndex: number, isRefresh: boolean, isCancelled: () => boolean) {
    const isInitial = pageIndex === 0 && !isRefresh;
    if (isRefresh) setRefreshing(true);
    else if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || isCancelled()) {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }
    setCurrentUserId(user.id);

    let postsQuery = supabase
      .schema("feed")
      .from("posts")
      .select(
        "id, teacher_id, body, school_year, classroom, created_at, post_type, source_type, cta_label, cta_route",
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);
    if (filterTeacherId) postsQuery = postsQuery.eq("teacher_id", filterTeacherId) as typeof postsQuery;

    const { data: postRows, error: postsErr } = await postsQuery;
    if (postsErr || !postRows || isCancelled()) {
      if (!isCancelled()) {
        if (postsErr) notifyError("parent-feed-fetch", postsErr);
        setError(postsErr?.message ?? "Failed to load feed.");
      }
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    if (postRows.length === 0) {
      if (!isCancelled()) {
        if (pageIndex === 0) setPosts([]);
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
      return;
    }

    const postIds = postRows.map((p) => p.id);
    const teacherIds = [...new Set(postRows.map((p) => p.teacher_id))];

    const [mediaRes, attachRes, reactRes, commentRes, usersRes] = await Promise.all([
      supabase
        .schema("feed")
        .from("post_media")
        .select("id, post_id, kind, storage_url, display_order, duration_secs")
        .in("post_id", postIds)
        .order("display_order"),
      supabase
        .schema("feed")
        .from("post_attachments")
        .select("id, post_id, file_name, file_size_bytes, kind, storage_url")
        .in("post_id", postIds),
      supabase
        .schema("feed")
        .from("post_reactions")
        .select("post_id, user_id, emoji")
        .in("post_id", postIds),
      supabase
        .schema("feed")
        .from("post_comments")
        .select("post_id")
        .eq("is_deleted", false)
        .in("post_id", postIds),
      supabase
        .schema("admin")
        .from("users")
        .select("id, full_name, role, profile_image_url")
        .in("id", teacherIds)
        .limit(teacherIds.length),
    ]);

    if (isCancelled()) return;

    const mediaRows: PostMediaRow[] = (mediaRes.data ?? []).map((m) => ({
      ...m,
      kind: m.kind as "image" | "video",
      signed_url: null,
    }));

    const mediaPaths = mediaRows.map((m) => m.storage_url);
    const { data: signedResults } = await supabase.storage
      .from("feed-media")
      .createSignedUrls(mediaPaths, 86400);
    const mediaWithUrls = mediaRows.map((m, i) => ({
      ...m,
      signed_url: signedResults?.[i]?.signedUrl ?? null,
    }));

    if (isCancelled()) return;

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
      post_type: (p as { post_type?: string | null }).post_type ?? null,
      source_type: (p as { source_type?: string | null }).source_type ?? null,
      cta_label: (p as { cta_label?: string | null }).cta_label ?? null,
      cta_route: (p as { cta_route?: string | null }).cta_route ?? null,
      authorName: nameById[p.teacher_id] ?? "Sage Field",
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

  function handleRefresh() {
    let cancelled = false;
    setPage(0);
    setHasMore(true);
    loadPage(0, true, () => cancelled);
  }

  function loadMore() {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      let cancelled = false;
      loadPage(nextPage, false, () => cancelled);
    }
  }

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
      }),
    );

    if (isMine) {
      const { error } = await supabase
        .schema("feed")
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji);
      if (error) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              reactions: [...p.reactions, { post_id: postId, user_id: currentUserId, emoji }],
            };
          }),
        );
      }
    } else {
      const { error } = await supabase.schema("feed").from("post_reactions").insert({
        post_id: postId,
        user_id: currentUserId,
        emoji,
      });
      if (error) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              reactions: p.reactions.filter((r) => !(r.user_id === currentUserId && r.emoji === emoji)),
            };
          }),
        );
      }
    }
  }

  function removePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return {
    posts,
    setPosts,
    teachers,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    currentUserId,
    handleRefresh,
    loadMore,
    toggleReactionForPost,
    removePost,
  };
}
