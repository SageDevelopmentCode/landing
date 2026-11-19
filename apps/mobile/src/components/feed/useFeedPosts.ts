import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PostAttachmentRow,
  PostMediaRow,
  PostReactionRow,
  PostWithMeta,
  TeacherOption,
} from "./feedTypes";

const DEFAULT_PAGE_SIZE = 4;

export type FeedResult = { ok: boolean; error?: string };

type FetchResult =
  | { ok: true; rows: PostWithMeta[]; rawCount: number }
  | { ok: false; error: string };

/**
 * Shared by the parent (Garden) feed and the staff feed.
 * Handlers return a result so callers can give feedback; staff can ignore it.
 */
export function useFeedPosts(
  filterTeacherId: string | null,
  options?: { pageSize?: number; errorTag?: string },
) {
  const PAGE_SIZE = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const ERROR_TAG = options?.errorTag ?? "parent-feed-fetch";
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** A failed "load more" — shown inline under the list, never wipes it. */
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const postsRef = useRef<PostWithMeta[]>([]);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  /** Highest page index currently loaded. */
  const pageRef = useRef(0);
  /** Bumped on every full reload / filter change so stale responses are dropped. */
  const genRef = useRef(0);
  const loadMoreInFlight = useRef(false);
  const hasMoreRef = useRef(true);
  const reactionLocks = useRef(new Set<string>());
  const userIdRef = useRef<string | null>(null);

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

  /** Fetch posts in [from, to] with their media, attachments, reactions and counts. */
  const fetchRange = useCallback(
    async (from: number, to: number): Promise<FetchResult> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { ok: false, error: "Not authenticated." };
        if (userIdRef.current !== user.id) {
          userIdRef.current = user.id;
          setCurrentUserId(user.id);
          const { data: me } = await supabase
            .schema("admin")
            .from("users")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          setCurrentUserRole(me?.role ?? null);
        }

        let postsQuery = supabase
          .schema("feed")
          .from("posts")
          .select(
            "id, teacher_id, body, school_year, classroom, created_at, post_type, source_type, cta_label, cta_route",
          )
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .range(from, to);
        if (filterTeacherId) postsQuery = postsQuery.eq("teacher_id", filterTeacherId) as typeof postsQuery;

        const { data: postRows, error: postsErr } = await postsQuery;
        if (postsErr || !postRows) {
          if (postsErr) notifyError(ERROR_TAG, postsErr);
          return { ok: false, error: postsErr?.message ?? "Failed to load feed." };
        }
        if (postRows.length === 0) return { ok: true, rows: [], rawCount: 0 };

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

        const mediaRows: PostMediaRow[] = (mediaRes.data ?? []).map((m) => ({
          ...m,
          kind: m.kind as "image" | "video",
          signed_url: null,
        }));

        let mediaWithUrls = mediaRows;
        if (mediaRows.length > 0) {
          const { data: signedResults } = await supabase.storage
            .from("feed-media")
            .createSignedUrls(
              mediaRows.map((m) => m.storage_url),
              86400,
            );
          mediaWithUrls = mediaRows.map((m, i) => ({
            ...m,
            signed_url: signedResults?.[i]?.signedUrl ?? null,
          }));
        }

        const nameById: Record<string, string> = {};
        const roleById: Record<string, string | null> = {};
        const profileImageById: Record<string, string | null> = {};
        for (const u of usersRes.data ?? []) {
          nameById[u.id] = u.full_name;
          roleById[u.id] = u.role ?? null;
          profileImageById[u.id] = u.profile_image_url ?? null;
        }

        const mediaByPost: Record<string, PostMediaRow[]> = {};
        for (const m of mediaWithUrls) (mediaByPost[m.post_id] ??= []).push(m);

        const attachByPost: Record<string, PostAttachmentRow[]> = {};
        for (const a of attachRes.data ?? []) {
          (attachByPost[a.post_id] ??= []).push({ ...a, kind: a.kind as PostAttachmentRow["kind"] });
        }

        const reactionsByPost: Record<string, PostReactionRow[]> = {};
        for (const r of reactRes.data ?? []) (reactionsByPost[r.post_id] ??= []).push(r);

        const commentCountByPost: Record<string, number> = {};
        for (const c of commentRes.data ?? []) {
          commentCountByPost[c.post_id] = (commentCountByPost[c.post_id] ?? 0) + 1;
        }

        const rows: PostWithMeta[] = postRows.map((p) => ({
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
        return { ok: true, rows, rawCount: postRows.length };
      } catch (e) {
        notifyError(ERROR_TAG, e);
        return { ok: false, error: e instanceof Error ? e.message : "Failed to load feed." };
      }
    },
    [filterTeacherId, ERROR_TAG],
  );

  const setMore = (v: boolean) => {
    hasMoreRef.current = v;
    setHasMore(v);
  };

  // Initial load + whenever the teacher filter changes.
  useEffect(() => {
    const gen = ++genRef.current;
    pageRef.current = 0;
    setMore(true);
    setPosts([]);
    setError(null);
    setLoadMoreError(false);
    setLoading(true);
    void fetchRange(0, PAGE_SIZE - 1).then((r) => {
      if (gen !== genRef.current) return;
      if (r.ok) {
        setPosts(r.rows);
        setMore(r.rawCount === PAGE_SIZE);
      } else {
        setError(r.error);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per filter
  }, [filterTeacherId]);

  /**
   * Re-fetch everything that's loaded (all pages so far) without clearing the
   * list. `showSpinner` drives the pull-to-refresh spinner.
   */
  const reloadAll = useCallback(
    async (showSpinner: boolean): Promise<FeedResult> => {
      const gen = ++genRef.current;
      if (showSpinner) setRefreshing(true);
      const pages = pageRef.current + 1;
      const r = await fetchRange(0, pages * PAGE_SIZE - 1);
      if (gen !== genRef.current) return { ok: r.ok };
      if (showSpinner) setRefreshing(false);
      if (r.ok) {
        setPosts(r.rows);
        setMore(r.rawCount === pages * PAGE_SIZE);
        setError(null);
        setLoadMoreError(false);
        setLoading(false);
        return { ok: true };
      }
      // Keep what's on screen; only show the blocking error when nothing is.
      if (postsRef.current.length === 0) setError(r.error);
      setLoading(false);
      return { ok: false, error: r.error };
    },
    [fetchRange, PAGE_SIZE],
  );

  const handleRefresh = useCallback(() => reloadAll(true), [reloadAll]);
  /** Quiet refresh (no spinner, no skeleton). */
  const reload = useCallback(() => reloadAll(false), [reloadAll]);

  const loadMore = useCallback(async (): Promise<FeedResult> => {
    if (loadMoreInFlight.current || !hasMoreRef.current || loadingRef.current) return { ok: true };
    loadMoreInFlight.current = true;
    const gen = genRef.current;
    const next = pageRef.current + 1;
    setLoadingMore(true);
    setLoadMoreError(false);
    const r = await fetchRange(next * PAGE_SIZE, next * PAGE_SIZE + PAGE_SIZE - 1);
    loadMoreInFlight.current = false;
    setLoadingMore(false);
    if (gen !== genRef.current) return { ok: r.ok };
    if (r.ok) {
      pageRef.current = next;
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...r.rows.filter((p) => !seen.has(p.id))];
      });
      setMore(r.rawCount === PAGE_SIZE);
      return { ok: true };
    }
    setLoadMoreError(true);
    return { ok: false, error: r.error };
  }, [fetchRange, PAGE_SIZE]);

  const toggleReactionForPost = useCallback(
    async (postId: string, emoji: string): Promise<FeedResult & { added?: boolean }> => {
      const uid = userIdRef.current;
      if (!uid) return { ok: false };
      const lock = `${postId}:${emoji}`;
      if (reactionLocks.current.has(lock)) return { ok: true };
      const post = postsRef.current.find((p) => p.id === postId);
      if (!post) return { ok: false };
      reactionLocks.current.add(lock);

      const isMine = post.reactions.some((r) => r.user_id === uid && r.emoji === emoji);
      const without = (list: PostReactionRow[]) => {
        const i = list.findIndex((r) => r.user_id === uid && r.emoji === emoji);
        return i < 0 ? list : [...list.slice(0, i), ...list.slice(i + 1)];
      };
      const withMine = (list: PostReactionRow[]) =>
        list.some((r) => r.user_id === uid && r.emoji === emoji)
          ? list
          : [...list, { post_id: postId, user_id: uid, emoji }];

      const apply = (fn: (l: PostReactionRow[]) => PostReactionRow[]) =>
        setPosts((prev) => {
          const next = prev.map((p) => (p.id === postId ? { ...p, reactions: fn(p.reactions) } : p));
          postsRef.current = next;
          return next;
        });

      apply(isMine ? without : withMine);
      try {
        const { error: err } = isMine
          ? await supabase
              .schema("feed")
              .from("post_reactions")
              .delete()
              .eq("post_id", postId)
              .eq("user_id", uid)
              .eq("emoji", emoji)
          : await supabase.schema("feed").from("post_reactions").insert({
              post_id: postId,
              user_id: uid,
              emoji,
            });
        if (err) {
          apply(isMine ? withMine : without);
          return { ok: false, error: err.message };
        }
        return { ok: true, added: !isMine };
      } finally {
        reactionLocks.current.delete(lock);
      }
    },
    [],
  );

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    setPosts,
    teachers,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    loadMoreError,
    currentUserId,
    currentUserRole,
    handleRefresh,
    reload,
    loadMore,
    toggleReactionForPost,
    removePost,
  };
}
