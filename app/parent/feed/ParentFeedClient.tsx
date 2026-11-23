"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  addComment,
  deleteComment,
  toggleReaction,
  type FeedPost,
  type FeedReactionSummary,
} from "@/app/teacher/feed/actions";
import {
  addReelComment,
  deleteReelComment,
  toggleReelReaction,
  type ReelPost,
} from "@/app/teacher/feed/reelActions";
import PortalShell from "@/app/parent/_garden/PortalShell";
import Lightbox, { type LightboxItem } from "@/app/parent/_garden/Lightbox";
import { Segmented } from "@/app/parent/_garden/tabs";
import { EmptyState } from "@/app/parent/_garden/states";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import PostCard from "./garden/PostCard";
import PostDetailSheet, { type DetailComment } from "./garden/PostDetailSheet";
import ReelsView from "./garden/Reels";
import {
  insertByDate,
  mediaNoun,
  parseMode,
  reelToFeedPost,
  toLightboxItems,
  toggleLocalReaction,
  useStoredFeedMode,
  writeStoredMode,
  type CurrentUser,
  type FeedKind,
  type FeedMode,
} from "./garden/feedUtils";

type Teacher = {
  id: string;
  full_name: string;
  role: string;
  profile_image_url: string | null;
};

type Props = {
  currentUser: CurrentUser;
  initialPosts: FeedPost[];
  initialReelPosts: ReelPost[];
  profileImageUrl?: string | null;
  /** Kept for callers; the unused teacher filter was removed. */
  teachers: Teacher[];
  /** Admin "view as parent": reactions and comments show the Preview toast instead of saving. */
  readOnlyPreview?: boolean;
};

export default function ParentFeedClient(props: Props) {
  return (
    <PortalShell>
      <FeedPage {...props} />
    </PortalShell>
  );
}

const PANEL: Record<FeedMode, { title: string; desc: string }> = {
  feed: { title: "Class Feed", desc: "Updates, photos, and moments from the classroom" },
  reel: { title: "Class Reels", desc: "Short video moments captured by teachers" },
};

type Selected = { kind: FeedKind; id: string; focusComposer: boolean };
type ReactionTarget = { reactions: FeedReactionSummary[]; comments: DetailComment[] };

function FeedPage({ currentUser, initialPosts, initialReelPosts, profileImageUrl, readOnlyPreview = false }: Props) {
  const reduce = useReducedMotion();
  const { toast, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Mode: ?tab wins, then sessionStorage, then Feed ────────────────────────
  const tabParam = parseMode(searchParams.get("tab"));
  const storedMode = useStoredFeedMode();
  const mode: FeedMode = tabParam ?? storedMode ?? "feed";
  const prevTab = useRef(tabParam);

  useEffect(() => {
    if (tabParam) writeStoredMode(tabParam);
    // The nav's "Feed" link drops ?tab while Reels is showing: that means Feed.
    else if (prevTab.current) writeStoredMode("feed");
    prevTab.current = tabParam;
  }, [tabParam]);

  const changeMode = useCallback(
    (next: FeedMode) => {
      writeStoredMode(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      // Shallow URL update (no server round trip); useSearchParams follows it.
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    },
    [pathname, searchParams],
  );

  // ── Data ───────────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<(Omit<FeedPost, "comments"> & { comments: DetailComment[] })[]>(initialPosts);
  const [reels, setReels] = useState<(Omit<ReelPost, "comments"> & { comments: DetailComment[] })[]>(initialReelPosts);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number; noun: string } | null>(null);
  const [muted, setMuted] = useState(false);

  const patch = useCallback((kind: FeedKind, id: string, fn: (item: ReactionTarget) => Partial<ReactionTarget>) => {
    if (kind === "reel") setReels((prev) => prev.map((r) => (r.id === id ? { ...r, ...fn(r) } : r)));
    else setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)));
  }, []);

  const canReact = !!currentUser || readOnlyPreview;

  // ── Reactions (optimistic, rolled back on failure) ─────────────────────────
  const inflight = useRef(new Set<string>());
  const react = useCallback(
    async (kind: FeedKind, id: string, emoji: string) => {
      if (blockedByPreview()) return;
      if (!currentUser) return;
      const key = `${kind}:${id}:${emoji}`;
      if (inflight.current.has(key)) return;
      inflight.current.add(key);
      patch(kind, id, (p) => ({ reactions: toggleLocalReaction(p.reactions, emoji) }));
      try {
        if (kind === "reel") await toggleReelReaction(id, emoji);
        else await toggleReaction(id, emoji);
      } catch {
        patch(kind, id, (p) => ({ reactions: toggleLocalReaction(p.reactions, emoji) }));
        toast.show({ tone: "error", title: "Couldn't save your reaction", message: "Please try again." });
      } finally {
        inflight.current.delete(key);
      }
    },
    [blockedByPreview, currentUser, patch, toast],
  );

  // ── Comments ───────────────────────────────────────────────────────────────
  const tempSeq = useRef(0);
  const addCommentTo = useCallback(
    async (kind: FeedKind, id: string, body: string, parentId: string | null): Promise<boolean> => {
      if (blockedByPreview()) return false;
      tempSeq.current += 1;
      const tempId = `temp-${tempSeq.current}`;
      const temp: DetailComment = {
        id: tempId,
        author_id: currentUser?.id ?? "",
        author_name: currentUser?.full_name ?? "",
        body,
        created_at: new Date().toISOString(),
        parent_comment_id: parentId,
        profile_image_url: profileImageUrl ?? null,
        pending: true,
      };
      patch(kind, id, (p) => ({ comments: [...p.comments, temp] }));
      try {
        const saved = kind === "reel" ? await addReelComment(id, body, parentId) : await addComment(id, body, parentId);
        patch(kind, id, (p) => ({
          comments: p.comments.map((c) => (c.id === tempId ? { ...saved, profile_image_url: profileImageUrl ?? null } : c)),
        }));
        return true;
      } catch {
        patch(kind, id, (p) => ({ comments: p.comments.filter((c) => c.id !== tempId) }));
        return false;
      }
    },
    [blockedByPreview, currentUser, patch, profileImageUrl],
  );

  const deleteRef = useRef<(kind: FeedKind, id: string, comment: DetailComment) => void>(() => {});
  const deleteCommentFrom = useCallback(
    async (kind: FeedKind, id: string, comment: DetailComment) => {
      if (blockedByPreview()) return;
      patch(kind, id, (p) => ({ comments: p.comments.filter((c) => c.id !== comment.id) }));
      try {
        if (kind === "reel") await deleteReelComment(comment.id);
        else await deleteComment(comment.id);
        toast.show({ tone: "success", title: "Comment deleted", duration: 1800 });
      } catch {
        patch(kind, id, (p) => ({ comments: p.comments.some((c) => c.id === comment.id) ? p.comments : insertByDate(p.comments, comment) }));
        toast.show({
          tone: "error",
          title: "Couldn't delete that comment",
          message: "Please try again.",
          action: { label: "Retry", onClick: () => deleteRef.current(kind, id, comment) },
        });
      }
    },
    [blockedByPreview, patch, toast],
  );
  useEffect(() => {
    deleteRef.current = (kind, id, comment) => void deleteCommentFrom(kind, id, comment);
  }, [deleteCommentFrom]);

  // ── Sheet + lightbox ───────────────────────────────────────────────────────
  const openDetail = useCallback((kind: FeedKind, id: string, focusComposer = false) => {
    setSelected({ kind, id, focusComposer });
    setSheetOpen(true);
  }, []);

  const openMedia = useCallback((post: FeedPost, index: number) => {
    setLightbox({ items: toLightboxItems(post), index, noun: mediaNoun(post.media) });
  }, []);

  const selectedPost = (() => {
    if (!selected) return null;
    if (selected.kind === "reel") {
      const reel = reels.find((r) => r.id === selected.id);
      return reel ? { ...reelToFeedPost(reel as ReelPost), comments: reel.comments } : null;
    }
    return posts.find((p) => p.id === selected.id) ?? null;
  })();

  const panel = PANEL[mode];
  const linkAuthors = !readOnlyPreview;

  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${mode === "reel" ? "pb-4 pt-6 sm:pt-8" : "pb-20 pt-8 sm:pt-12"}`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
        {/* Left rail (desktop) / top bar (phones) */}
        <aside className="min-w-0 md:sticky md:top-32 md:self-start">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <h1 className="sf-display text-[2.2rem] leading-none sm:text-[2.6rem]">{panel.title}</h1>
              <p className="mt-2 text-sm font-bold leading-snug text-[var(--sf-soft)]">{panel.desc}</p>
            </div>
            <Segmented<FeedMode>
              label="Show"
              value={mode}
              onChange={changeMode}
              fullWidth
              className="max-w-xs md:max-w-none"
              options={[
                { value: "feed", label: "Feed", icon: <span>📰</span> },
                { value: "reel", label: "Reels", icon: <span>🎬</span> },
              ]}
            />
          </div>
        </aside>

        <div className="min-w-0">
          {mode === "reel" ? (
            <ReelsView
              reels={reels as ReelPost[]}
              muted={muted}
              onMutedChange={setMuted}
              suspended={sheetOpen || !!lightbox}
              linkAuthors={linkAuthors}
              reactionsDisabled={!canReact}
              onReact={(id, emoji) => void react("reel", id, emoji)}
              onOpen={(id) => openDetail("reel", id)}
            />
          ) : posts.length === 0 ? (
            <div className="mx-auto max-w-2xl">
              <EmptyState emoji="🌱" title="No posts yet." />
            </div>
          ) : (
            <ul className="mx-auto flex max-w-2xl flex-col gap-7" aria-label="Posts">
              {posts.map((post, i) => (
                <motion.li
                  key={post.id}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(i, 5) * 0.06 }}
                >
                  <PostCard
                    post={post}
                    linkAuthors={linkAuthors}
                    reactionsDisabled={!canReact}
                    onOpen={() => openDetail("post", post.id)}
                    onReply={() => openDetail("post", post.id, true)}
                    onReact={(emoji) => void react("post", post.id, emoji)}
                    onOpenMedia={(index) => openMedia(post, index)}
                  />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PostDetailSheet
        key={selected ? `${selected.kind}:${selected.id}` : "none"}
        open={sheetOpen && !!selectedPost}
        onClose={() => setSheetOpen(false)}
        post={selectedPost}
        isReel={selected?.kind === "reel"}
        currentUser={currentUser}
        profileImageUrl={profileImageUrl}
        readOnlyPreview={readOnlyPreview}
        linkAuthors={linkAuthors}
        focusComposer={!!selected?.focusComposer}
        reactionsDisabled={!canReact}
        onReact={(emoji) => selected && void react(selected.kind, selected.id, emoji)}
        onAddComment={(body, parentId) => (selected ? addCommentTo(selected.kind, selected.id, body, parentId) : Promise.resolve(false))}
        onDeleteComment={(c) => selected && void deleteCommentFrom(selected.kind, selected.id, c)}
        onOpenMedia={(index) => selectedPost && openMedia(selectedPost, index)}
      />

      <AnimatePresence>
        {lightbox ? (
          <Lightbox
            items={lightbox.items}
            index={lightbox.index}
            noun={lightbox.noun}
            onIndexChange={(index) => setLightbox((lb) => (lb ? { ...lb, index } : lb))}
            onClose={() => setLightbox(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
