"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, X } from "lucide-react";
import type { FeedPost } from "@/app/teacher/feed/actions";
import GardenSheet from "@/app/parent/_garden/sheet";
import ConfirmDialog from "@/app/parent/_garden/ConfirmDialog";
import { KidAvatar, Spinner } from "@/app/parent/_garden/ui";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { AttachmentList, AuthorMeta, MediaGrid, PostBody, PostTypePill, ReactionPills, RelTime } from "./FeedBits";
import { buildThreadedList, profileHref, type CommentWithImage, type CurrentUser, type ThreadedComment } from "./feedUtils";
import Link from "next/link";

type Reply = { id: string; authorName: string };

export type DetailComment = CommentWithImage & { pending?: boolean };

/**
 * Post (or reel) detail: full body, media, reactions and threaded comments, with a
 * sticky composer. All writes are passed in; they return `true` when they worked.
 */
export default function PostDetailSheet({
  open,
  onClose,
  post,
  isReel,
  currentUser,
  profileImageUrl,
  readOnlyPreview,
  linkAuthors,
  focusComposer,
  reactionsDisabled,
  onReact,
  onAddComment,
  onDeleteComment,
  onOpenMedia,
}: {
  open: boolean;
  onClose: () => void;
  post: (Omit<FeedPost, "comments"> & { comments: DetailComment[] }) | null;
  isReel: boolean;
  currentUser: CurrentUser;
  profileImageUrl?: string | null;
  readOnlyPreview: boolean;
  linkAuthors: boolean;
  focusComposer: boolean;
  reactionsDisabled: boolean;
  onReact: (emoji: string) => void;
  onAddComment: (body: string, parentId: string | null) => Promise<boolean>;
  onDeleteComment: (comment: DetailComment) => void;
  onOpenMedia: (index: number) => void;
}) {
  const { toast, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState<DetailComment | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(text: string, reply: Reply | null) => void>(() => {});

  // Reply focuses the composer.
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  async function send(text: string, reply: Reply | null) {
    if (!text || sending) return;
    if (blockedByPreview()) return;
    setDraft("");
    setReplyingTo(null);
    setSending(true);
    const ok = await onAddComment(text, reply?.id ?? null);
    setSending(false);
    if (ok) {
      if (!reply) {
        requestAnimationFrame(() => {
          const el = bodyRef.current;
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
      }
      return;
    }
    // Put the words back so nothing typed is lost.
    setDraft((cur) => (cur.trim() ? cur : text));
    setReplyingTo((cur) => cur ?? reply);
    toast.show({
      tone: "error",
      title: "Your comment didn't post",
      message: "It's still in the box — try again.",
      action: { label: "Retry", onClick: () => sendRef.current(text, reply) },
    });
  }

  useEffect(() => {
    sendRef.current = (text, reply) => void send(text, reply);
  });

  function onComposerKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft.trim(), replyingTo);
    }
  }

  function askDelete(c: DetailComment) {
    if (blockedByPreview()) return;
    setConfirming(c);
  }

  const threaded = post
    ? buildThreadedList(post.comments.map((c) => ({ ...c, profile_image_url: c.author_id === currentUser?.id ? profileImageUrl : (c.profile_image_url ?? null) })))
    : [];
  const count = post?.comments.filter((c) => !c.pending).length ?? 0;

  const composer = (
    <div className="flex flex-col gap-2">
      {replyingTo ? (
        <div className="flex items-center justify-between gap-2 self-start rounded-full bg-[var(--sf-mint)] py-1 pl-3.5 pr-1 text-sm font-bold text-[var(--sf-sage-deep)]">
          <span className="min-w-0 truncate">
            Replying to <span className="font-extrabold">{replyingTo.authorName}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setReplyingTo(null);
              inputRef.current?.focus();
            }}
            aria-label="Cancel reply"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/70 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-sage)] cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <form
        className="flex items-end gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft.trim(), replyingTo);
        }}
      >
        {currentUser ? (
          <span className="hidden pb-1 sm:block">
            <KidAvatar id={currentUser.id} name={currentUser.full_name || "P"} imageUrl={profileImageUrl} size="h-9 w-9 text-xs" />
          </span>
        ) : null}
        <label className="sr-only" htmlFor="feed-comment-input">
          {replyingTo ? `Reply to ${replyingTo.authorName}` : "Add a comment"}
        </label>
        <textarea
          id="feed-comment-input"
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onComposerKey}
          placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Add a comment..."}
          data-autofocus={focusComposer ? true : undefined}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] bg-white px-4 py-2.5 text-[15px] font-semibold text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/10 [field-sizing:content] placeholder:text-[var(--sf-soft)]/70 focus:outline-none focus:ring-[var(--sf-sage)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label={sending ? "Sending" : replyingTo ? "Send reply" : "Send comment"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white shadow-[0_3px_0_0_var(--sf-sage-deep)] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)] active:translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
        >
          {sending ? <Spinner /> : <Send className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />}
        </button>
      </form>
      <p className="hidden text-xs font-bold text-[var(--sf-soft)] sm:block">Enter to send · Shift + Enter for a new line</p>
    </div>
  );

  return (
    <GardenSheet
      open={open}
      onClose={onClose}
      size="wide"
      bodyRef={bodyRef}
      title={post ? (linkAuthors ? <TitleLink post={post} /> : post.teacher_name) : ""}
      note={post ? <AuthorMeta post={post} /> : null}
      icon={post ? <KidAvatar id={post.teacher_id} name={post.teacher_name} imageUrl={post.teacher_profile_image_url} size="h-11 w-11 text-sm" /> : null}
      footer={post ? composer : null}
    >
      {post ? (
        <div className="flex flex-col gap-6 pb-2">
          <div className="flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-[0_16px_40px_-30px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06]">
            {post.post_type ? (
              <div>
                <PostTypePill value={post.post_type} />
              </div>
            ) : null}
            {post.body.trim() ? <PostBody body={post.body} /> : null}
            {post.media.length > 0 ? <MediaGrid post={post} onOpen={onOpenMedia} compact={isReel} /> : null}
            <AttachmentList attachments={post.attachments} />
            <ReactionPills reactions={post.reactions} onToggle={onReact} disabled={reactionsDisabled} />
          </div>

          <section aria-labelledby="feed-comments-heading">
            <div className="mb-3 flex items-baseline gap-2">
              <h3 id="feed-comments-heading" className="sf-display text-2xl leading-none">
                Comments
              </h3>
              {count > 0 ? <span className="sf-hand text-lg text-[var(--sf-sage-deep)]">{count}</span> : null}
            </div>
            {threaded.length === 0 ? (
              <p className="rounded-[20px] bg-[var(--sf-mint)]/50 px-4 py-4 text-sm font-bold text-[var(--sf-soft)]">No comments yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 [--feed-indent:0.75rem] sm:[--feed-indent:1.5rem]">
                {threaded.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    mine={!!currentUser && c.author_id === currentUser.id}
                    onReply={() => setReplyingTo({ id: c.id, authorName: c.author_name })}
                    onDelete={() => askDelete(c)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) onDeleteComment(confirming);
          setConfirming(null);
        }}
        title="Delete this comment?"
        body="It will be removed for everyone."
        confirmLabel="Delete"
      />
    </GardenSheet>
  );
}

function TitleLink({ post }: { post: Pick<FeedPost, "teacher_id" | "teacher_name"> }) {
  return (
    <Link
      href={profileHref(post.teacher_id)}
      className="rounded-lg underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]"
    >
      {post.teacher_name}
    </Link>
  );
}

function CommentItem({
  comment,
  mine,
  onReply,
  onDelete,
}: {
  comment: ThreadedComment;
  mine: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  const pending = !!comment.pending;
  return (
    <li
      className={`flex gap-2.5 ${comment.depth > 0 ? "border-l-2 border-dashed border-[var(--sf-ink)]/10 pl-2.5" : ""}`}
      style={{ marginLeft: comment.depth > 0 ? `calc(${comment.depth - 1} * var(--feed-indent) + 0.25rem)` : undefined }}
    >
      <KidAvatar id={comment.author_id} name={comment.author_name || "?"} imageUrl={comment.profile_image_url} size="h-8 w-8 text-[11px]" />
      <div className={`min-w-0 flex-1 ${pending ? "opacity-60" : ""}`}>
        <div className={`rounded-[18px] rounded-tl-[6px] px-3.5 py-2.5 ${mine ? "bg-[var(--sf-mint)]/70" : "bg-white ring-1 ring-[var(--sf-ink)]/[0.06]"}`}>
          <p className="text-xs font-extrabold text-[var(--sf-ink)]">
            {comment.author_name}
            {mine ? <span className="ml-1.5 font-bold text-[var(--sf-sage-deep)]">· You</span> : null}
          </p>
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-relaxed text-[var(--sf-ink)]/80">{comment.body}</p>
        </div>
        <div className="-ml-2 flex flex-wrap items-center gap-x-1 text-xs font-bold text-[var(--sf-soft)]">
          <span className="px-2">{pending ? "Sending…" : <RelTime iso={comment.created_at} />}</span>
          {pending ? null : (
            <>
              <button
                type="button"
                onClick={onReply}
                aria-label={`Reply to ${comment.author_name}`}
                className="inline-flex min-h-11 items-center rounded-full px-2 font-extrabold text-[var(--sf-sage-deep)] transition hover:bg-[var(--sf-mint)]/60 focus-visible:bg-[var(--sf-mint)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-sage)] cursor-pointer"
              >
                Reply
              </button>
              {mine ? (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete comment"
                  className="inline-flex min-h-11 items-center rounded-full px-2 font-extrabold text-[var(--sf-coral-deep)] transition hover:bg-[var(--sf-coral)]/20 focus-visible:bg-[var(--sf-coral)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-coral)] cursor-pointer"
                >
                  Delete
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
