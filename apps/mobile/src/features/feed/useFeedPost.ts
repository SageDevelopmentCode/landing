// Post detail for both apps: loads one post with media, attachments, comments
// and reactions; handlers return { ok } and the Garden UI reacts with feedback.
// mode "staff" adds the poster's role check + delete.
import type { PostReactionRow } from "@/components/feed/feedTypes";
import { canDeleteFeedPost, feedPostDeleteRpcName } from "@/components/feed/feedUtils";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface DetailMedia {
  id: string;
  post_id: string;
  kind: "image" | "video";
  storage_url: string;
  display_order: number;
  duration_secs: number | null;
  signed_url: string | null;
}

export interface DetailAttachment {
  id: string;
  post_id: string;
  file_name: string;
  file_size_bytes: number | null;
  kind: "pdf" | "doc" | "sheet" | "other";
  storage_url: string;
  signed_url: string | null;
}

export interface CommentWithAuthor {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
  authorName: string;
  authorProfileImageUrl: string | null;
  /** Local-only: a comment still being sent. */
  sending?: boolean;
  /** Local-only: deleted while it still had replies (keeps the thread grouped). */
  deleted?: boolean;
}

export interface CommentNode extends CommentWithAuthor {
  children: CommentNode[];
}

export interface PostDetail {
  id: string;
  teacher_id: string;
  body: string;
  created_at: string;
  post_type: string | null;
  source_type: string | null;
  cta_label: string | null;
  cta_route: string | null;
  classroom: string | null;
  authorName: string;
  authorRole: string | null;
  authorProfileImageUrl: string | null;
  media: DetailMedia[];
  attachments: DetailAttachment[];
}

export type Result = { ok: boolean; error?: string };

function buildCommentTree(comments: CommentWithAuthor[]): CommentNode[] {
  const map: Record<string, CommentNode> = {};
  const roots: CommentNode[] = [];
  for (const c of comments) map[c.id] = { ...c, children: [] };
  for (const c of comments) {
    if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id].children.push(map[c.id]);
    else roots.push(map[c.id]);
  }
  return roots;
}

function flatten(
  nodes: CommentNode[],
  expanded: Set<string>,
  depth = 0,
): { comment: CommentNode; depth: number }[] {
  const out: { comment: CommentNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ comment: n, depth });
    if (n.children.length > 0 && expanded.has(n.id)) out.push(...flatten(n.children, expanded, depth + 1));
  }
  return out;
}

export function useFeedPost(postId: string | undefined, mode: "parent" | "staff" = "parent") {
  const errorTag = mode === "staff" ? "staff-feed-post" : "parent-feed-post";
  const [post, setPost] = useState<PostDetail | null>(null);
  const [rawReactions, setRawReactions] = useState<PostReactionRow[]>([]);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [myName, setMyName] = useState("You");
  const [myProfileImageUrl, setMyProfileImageUrl] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});
  const [userProfileImageById, setUserProfileImageById] = useState<Record<string, string | null>>({});

  const reactionsRef = useRef<PostReactionRow[]>([]);
  useEffect(() => {
    reactionsRef.current = rawReactions;
  }, [rawReactions]);
  const reactionLocks = useRef(new Set<string>());
  const loadSeq = useRef(0);

  const load = useCallback(
    async (quiet = false): Promise<Result> => {
      if (!postId) return { ok: false };
      const seq = ++loadSeq.current;
      if (!quiet) setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated.");
        setCurrentUserId(user.id);

        const [postRes, mediaRes, attachRes, commentRes, reactionsRes] = await Promise.all([
          supabase
            .schema("feed")
            .from("posts")
            .select("id, teacher_id, body, created_at, post_type, classroom, source_type, cta_label, cta_route")
            .eq("id", postId)
            .eq("is_deleted", false)
            .maybeSingle(),
          supabase
            .schema("feed")
            .from("post_media")
            .select("id, kind, storage_url, display_order, duration_secs")
            .eq("post_id", postId)
            .order("display_order"),
          supabase
            .schema("feed")
            .from("post_attachments")
            .select("id, file_name, file_size_bytes, kind, storage_url")
            .eq("post_id", postId),
          supabase
            .schema("feed")
            .from("post_comments")
            .select("id, author_id, body, created_at, parent_comment_id")
            .eq("post_id", postId)
            .eq("is_deleted", false)
            .order("created_at", { ascending: true }),
          supabase.schema("feed").from("post_reactions").select("post_id, user_id, emoji").eq("post_id", postId),
        ]);
        if (seq !== loadSeq.current) return { ok: true };

        if (postRes.error || !postRes.data) {
          if (postRes.error) notifyError(errorTag, postRes.error);
          setError(postRes.error ? "We couldn't load this post." : "Post not found.");
          setLoading(false);
          return { ok: false };
        }
        const p = postRes.data as typeof postRes.data & {
          post_type?: string | null;
          source_type?: string | null;
          cta_label?: string | null;
          cta_route?: string | null;
          classroom?: string | null;
        };

        const allUserIds = [
          ...new Set([
            p.teacher_id,
            user.id,
            ...(commentRes.data ?? []).map((c) => c.author_id),
            ...(reactionsRes.data ?? []).map((r) => r.user_id),
          ]),
        ];
        const { data: userRows } = await supabase
          .schema("admin")
          .from("users")
          .select("id, full_name, role, profile_image_url")
          .in("id", allUserIds);

        const nameById: Record<string, string> = {};
        const roleById: Record<string, string | null> = {};
        const imgById: Record<string, string | null> = {};
        for (const u of userRows ?? []) {
          nameById[u.id] = u.full_name;
          roleById[u.id] = u.role ?? null;
          imgById[u.id] = u.profile_image_url ?? null;
        }
        if (nameById[user.id]) setMyName(nameById[user.id]);
        setCurrentUserRole(roleById[user.id] ?? null);
        setMyProfileImageUrl(imgById[user.id] ?? null);
        setUserNameById(nameById);
        setUserProfileImageById(imgById);

        const mediaRows: DetailMedia[] = (mediaRes.data ?? []).map((m) => ({
          ...m,
          post_id: p.id,
          kind: m.kind as "image" | "video",
          signed_url: null,
        }));
        let media = mediaRows;
        if (mediaRows.length) {
          const { data: signed } = await supabase.storage
            .from("feed-media")
            .createSignedUrls(
              mediaRows.map((m) => m.storage_url),
              86400,
            );
          media = mediaRows.map((m, i) => ({ ...m, signed_url: signed?.[i]?.signedUrl ?? null }));
        }

        const attachRows: DetailAttachment[] = (attachRes.data ?? []).map((a) => ({
          ...a,
          post_id: p.id,
          kind: a.kind as DetailAttachment["kind"],
          signed_url: null,
        }));
        const signedAttach = await Promise.all(
          attachRows.map((a) => supabase.storage.from("feed-attachments").createSignedUrl(a.storage_url, 3600)),
        );
        const attachments = attachRows.map((a, i) => ({ ...a, signed_url: signedAttach[i]?.data?.signedUrl ?? null }));

        if (seq !== loadSeq.current) return { ok: true };
        setRawReactions((reactionsRes.data ?? []) as PostReactionRow[]);
        setPost({
          id: p.id,
          teacher_id: p.teacher_id,
          body: p.body,
          created_at: p.created_at,
          post_type: p.post_type ?? null,
          source_type: p.source_type ?? null,
          cta_label: p.cta_label ?? null,
          cta_route: p.cta_route ?? null,
          classroom: p.classroom ?? null,
          authorName: nameById[p.teacher_id] ?? "Teacher",
          authorRole: roleById[p.teacher_id] ?? null,
          authorProfileImageUrl: imgById[p.teacher_id] ?? null,
          media,
          attachments,
        });
        setComments((prev) => {
          const pending = prev.filter((c) => c.sending);
          const fresh = (commentRes.data ?? []).map((c) => ({
            id: c.id,
            author_id: c.author_id,
            body: c.body,
            created_at: c.created_at,
            parent_comment_id: (c as { parent_comment_id?: string | null }).parent_comment_id ?? null,
            authorName: nameById[c.author_id] ?? "User",
            authorProfileImageUrl: imgById[c.author_id] ?? null,
          }));
          return [...fresh, ...pending];
        });
        setLoading(false);
        return { ok: true };
      } catch (e) {
        if (seq !== loadSeq.current) return { ok: true };
        notifyError(errorTag, e);
        setError(e instanceof Error && e.message === "Not authenticated." ? e.message : "We couldn't load this post.");
        setLoading(false);
        return { ok: false };
      }
    },
    [postId, errorTag],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // ── Reactions (optimistic; pills move immediately) ─────────────────────────
  const toggleReaction = useCallback(
    async (emoji: string): Promise<Result & { added?: boolean }> => {
      const uid = currentUserId;
      if (!uid || !post) return { ok: false };
      const lock = emoji;
      if (reactionLocks.current.has(lock)) return { ok: true };
      reactionLocks.current.add(lock);
      const isMine = reactionsRef.current.some((r) => r.user_id === uid && r.emoji === emoji);
      const without = (l: PostReactionRow[]) => {
        const i = l.findIndex((r) => r.user_id === uid && r.emoji === emoji);
        return i < 0 ? l : [...l.slice(0, i), ...l.slice(i + 1)];
      };
      const withMine = (l: PostReactionRow[]) =>
        l.some((r) => r.user_id === uid && r.emoji === emoji) ? l : [...l, { post_id: post.id, user_id: uid, emoji }];
      const apply = (fn: (l: PostReactionRow[]) => PostReactionRow[]) =>
        setRawReactions((prev) => {
          const next = fn(prev);
          reactionsRef.current = next;
          return next;
        });
      apply(isMine ? without : withMine);
      try {
        const { error: err } = isMine
          ? await supabase
              .schema("feed")
              .from("post_reactions")
              .delete()
              .eq("post_id", post.id)
              .eq("user_id", uid)
              .eq("emoji", emoji)
          : await supabase.schema("feed").from("post_reactions").insert({ post_id: post.id, user_id: uid, emoji });
        if (err) {
          apply(isMine ? withMine : without);
          return { ok: false, error: err.message };
        }
        if (!isMine && !userNameById[uid]) {
          setUserNameById((m) => ({ ...m, [uid]: myName }));
        }
        return { ok: true, added: !isMine };
      } finally {
        reactionLocks.current.delete(lock);
      }
    },
    [currentUserId, post, userNameById, myName],
  );

  // ── Comments ───────────────────────────────────────────────────────────────
  const submitComment = useCallback(async (): Promise<Result> => {
    const body = commentText.trim();
    if (!body || !currentUserId || !post) return { ok: false };
    const tempId = `temp-${Date.now()}`;
    const reply = replyingTo;
    const parentId = reply?.id ?? null;
    setComments((prev) => [
      ...prev,
      {
        id: tempId,
        author_id: currentUserId,
        body,
        created_at: new Date().toISOString(),
        parent_comment_id: parentId,
        authorName: myName,
        authorProfileImageUrl: myProfileImageUrl,
        sending: true,
      },
    ]);
    if (parentId) setExpandedReplies((prev) => new Set(prev).add(parentId));
    setCommentText("");
    setReplyingTo(null);
    setSubmitting(true);

    const { data, error: err } = await supabase
      .schema("feed")
      .from("post_comments")
      .insert({ post_id: post.id, author_id: currentUserId, body, parent_comment_id: parentId })
      .select("id, created_at")
      .single();
    setSubmitting(false);

    if (err || !data) {
      // Put everything back so nothing the parent typed is lost.
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentText((cur) => cur || body);
      setReplyingTo(reply);
      return { ok: false, error: err?.message };
    }
    setComments((prev) =>
      prev.map((c) => (c.id === tempId ? { ...c, id: data.id, created_at: data.created_at, sending: false } : c)),
    );
    return { ok: true };
  }, [commentText, currentUserId, post, replyingTo, myName, myProfileImageUrl]);

  const deleteComment = useCallback(
    async (commentId: string): Promise<Result> => {
      if (!currentUserId) return { ok: false };
      const { error: err } = await supabase
        .schema("feed")
        .from("post_comments")
        .update({ is_deleted: true })
        .eq("id", commentId)
        .eq("author_id", currentUserId);
      if (err) return { ok: false, error: err.message };
      setComments((prev) => {
        const hasReplies = prev.some((c) => c.parent_comment_id === commentId);
        return hasReplies
          ? prev.map((c) => (c.id === commentId ? { ...c, deleted: true } : c))
          : prev.filter((c) => c.id !== commentId);
      });
      return { ok: true };
    },
    [currentUserId],
  );

  // ── Staff: delete the post ─────────────────────────────────────────────────
  const canDelete =
    mode === "staff" && !!post && canDeleteFeedPost(post, currentUserId, currentUserRole);
  const deletingRef = useRef(false);
  const deletePost = useCallback(async (): Promise<Result> => {
    if (!post || !canDelete || deletingRef.current) return { ok: false };
    deletingRef.current = true;
    try {
      const { error: err } = await supabase
        .schema("feed")
        .rpc(feedPostDeleteRpcName(currentUserRole), { p_post_id: post.id });
      if (err) {
        notifyError("staff-feed-delete-post", err);
        return { ok: false, error: err.message };
      }
      return { ok: true };
    } catch (e) {
      notifyError("staff-feed-delete-post", e);
      return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
    } finally {
      deletingRef.current = false;
    }
  }, [post, canDelete, currentUserRole]);

  const toggleReplies = useCallback((parentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);
  const rows = useMemo(() => flatten(commentTree, expandedReplies), [commentTree, expandedReplies]);
  const replyCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of comments) if (c.parent_comment_id) m[c.parent_comment_id] = (m[c.parent_comment_id] ?? 0) + 1;
    return m;
  }, [comments]);
  const visibleCommentCount = comments.filter((c) => !c.deleted).length;

  return {
    post,
    rawReactions,
    comments,
    rows,
    replyCount,
    visibleCommentCount,
    loading,
    error,
    reload: () => load(true),
    retry: () => load(false),
    currentUserId,
    currentUserRole,
    canDelete,
    deletePost,
    mode,
    myName,
    myProfileImageUrl,
    commentText,
    setCommentText,
    submitting,
    replyingTo,
    setReplyingTo,
    expandedReplies,
    toggleReplies,
    userNameById,
    userProfileImageById,
    toggleReaction,
    submitComment,
    deleteComment,
  };
}

export type FeedPost = ReturnType<typeof useFeedPost>;
