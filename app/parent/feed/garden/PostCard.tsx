"use client";

import { MessageCircle } from "lucide-react";
import type { FeedPost } from "@/app/teacher/feed/actions";
import { cardBase } from "@/app/parent/_garden/ui";
import { AttachmentList, AuthorLink, AuthorMeta, MediaGrid, PostBody, PostTypePill, ReactionPills } from "./FeedBits";

/**
 * Feed post card. The whole card opens the post (a stretched button underneath the
 * content), while the author link, reactions, media and attachments stay their own controls.
 */
export default function PostCard({
  post,
  linkAuthors,
  reactionsDisabled,
  onOpen,
  onReply,
  onReact,
  onOpenMedia,
}: {
  post: FeedPost;
  linkAuthors: boolean;
  reactionsDisabled: boolean;
  onOpen: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onOpenMedia: (index: number) => void;
}) {
  const commentCount = post.comments.length;

  return (
    <article className={`${cardBase} group/card relative transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-30px_rgba(43,42,38,0.55)] focus-within:shadow-[0_26px_60px_-30px_rgba(43,42,38,0.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open post from ${post.teacher_name}`}
        className="absolute inset-0 z-[1] rounded-[28px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
      />

      <div className="pointer-events-none relative z-[1] flex flex-col gap-4 px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <AuthorLink post={post} linked={linkAuthors} meta={<AuthorMeta post={post} />} />
          {post.post_type ? (
            <span className="shrink-0 pt-1">
              <PostTypePill value={post.post_type} />
            </span>
          ) : null}
        </div>

        <PostBody body={post.body} clamp />

        {post.media.length > 0 ? <MediaGrid post={post} onOpen={onOpenMedia} /> : null}

        <AttachmentList attachments={post.attachments} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-[var(--sf-ink)]/[0.08] pt-4">
          <ReactionPills reactions={post.reactions} onToggle={onReact} disabled={reactionsDisabled} />
          <button
            type="button"
            onClick={onReply}
            aria-label={`Reply${commentCount ? `, ${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : ""}`}
            className="pointer-events-auto relative z-[2] inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--sf-ink)]/[0.05] px-4 text-sm font-extrabold text-[var(--sf-ink)] transition hover:bg-[var(--sf-butter)] focus-visible:bg-[var(--sf-butter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            Reply
            {commentCount > 0 ? (
              <span className="rounded-full bg-white px-1.5 text-xs tabular-nums text-[var(--sf-soft)]" aria-hidden="true">
                {commentCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </article>
  );
}
