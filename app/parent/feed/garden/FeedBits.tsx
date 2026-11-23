"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import type { FeedPost, FeedReactionSummary } from "@/app/teacher/feed/actions";
import { splitFeedBodyLead } from "@/shared/feed/feedBodyLead";
import { getPostTypeDisplay } from "@/shared/feed/postTypeDisplay";
import { KidAvatar } from "@/app/parent/_garden/ui";
import { formatRelative, useNow } from "@/app/parent/_garden/time";
import { formatAuthorSubtitle, formatDuration, formatFileSize, mediaAlt, profileHref, reactionList } from "./feedUtils";

// ─── Time ────────────────────────────────────────────────────────────────────

/** Relative time that renders after hydration and stays fresh (shared 60s clock). */
export function RelTime({ iso, className }: { iso: string; className?: string }) {
  const now = useNow();
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {now ? formatRelative(iso, now) : ""}
    </time>
  );
}

// ─── Markdown ────────────────────────────────────────────────────────────────
// Headings in a post body render as bold paragraphs, so the page keeps one h1 and
// the sheet keeps its own h2.

const md: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-extrabold text-[var(--sf-ink)]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <p className="mb-2 mt-5 text-base font-extrabold text-[var(--sf-ink)] first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mb-2 mt-5 text-[15px] font-extrabold text-[var(--sf-ink)] first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mb-1 mt-4 text-[15px] font-bold text-[var(--sf-ink)] first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => <code className="rounded bg-[var(--sf-ink)]/[0.06] px-1 py-0.5 font-mono text-xs">{children}</code>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto relative z-[2] font-bold text-[var(--sf-sage-deep)] underline underline-offset-2 hover:text-[var(--sf-ink)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-[var(--sf-mint)] pl-3 italic text-[var(--sf-soft)]">{children}</blockquote>
  ),
};

/**
 * Bold lead line + markdown. With `clamp`, bodies past 300 characters fold behind
 * "Read more / Show less".
 */
export function PostBody({ body, clamp = false }: { body: string; clamp?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { lead, rest } = splitFeedBodyLead(body);
  const text = lead ? rest : body;
  const isLong = clamp && text.length > 300;
  const folded = isLong && !expanded;

  return (
    <div>
      {lead ? <p className="mb-2 text-[16px] font-extrabold leading-snug text-[var(--sf-ink)]">{lead}</p> : null}
      {text.trim() ? (
        <div className={`relative text-[15px] font-semibold leading-relaxed text-[var(--sf-ink)]/80 ${folded ? "max-h-28 overflow-hidden" : ""}`}>
          <ReactMarkdown components={md}>{text}</ReactMarkdown>
          {folded ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
          ) : null}
        </div>
      ) : null}
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="pointer-events-auto relative z-[2] -ml-2 mt-1 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)] cursor-pointer"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

// ─── Author + type ───────────────────────────────────────────────────────────

export function PostTypePill({ value }: { value: string | null }) {
  const display = getPostTypeDisplay(value);
  if (!display) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wide"
      style={{ backgroundColor: display.bg, color: display.text }}
    >
      {display.labelUpper}
    </span>
  );
}

/** Teacher avatar + name, linking to the teacher profile (plain text in admin preview). */
export function AuthorLink({
  post,
  linked,
  meta,
  avatarSize = "h-11 w-11 text-sm",
  tone = "ink",
}: {
  post: Pick<FeedPost, "teacher_id" | "teacher_name" | "teacher_profile_image_url">;
  linked: boolean;
  meta?: ReactNode;
  avatarSize?: string;
  tone?: "ink" | "light";
}) {
  const inner = (
    <>
      <KidAvatar id={post.teacher_id} name={post.teacher_name} imageUrl={post.teacher_profile_image_url} size={avatarSize} />
      <span className="min-w-0">
        <span className={`block truncate text-[15px] font-extrabold leading-tight ${tone === "light" ? "text-white drop-shadow" : "text-[var(--sf-ink)]"}`}>
          {post.teacher_name}
        </span>
        {meta ? (
          <span className={`mt-0.5 block truncate text-xs font-bold ${tone === "light" ? "text-white/80 drop-shadow" : "text-[var(--sf-soft)]"}`}>{meta}</span>
        ) : null}
      </span>
    </>
  );
  if (!linked) return <div className="flex min-w-0 items-center gap-3">{inner}</div>;
  return (
    <Link
      href={profileHref(post.teacher_id)}
      aria-label={`${post.teacher_name}, view profile`}
      className="group/author pointer-events-auto relative z-[2] -m-1 flex min-w-0 items-center gap-3 rounded-2xl p-1 transition hover:bg-[var(--sf-mint)]/50 focus-visible:bg-[var(--sf-mint)]/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]"
    >
      {inner}
    </Link>
  );
}

export function AuthorMeta({ post }: { post: Pick<FeedPost, "classroom" | "teacher_role" | "created_at"> }) {
  return (
    <>
      {formatAuthorSubtitle(post.classroom, post.teacher_role)} · <RelTime iso={post.created_at} />
    </>
  );
}

// ─── Reactions ───────────────────────────────────────────────────────────────

export function ReactionPill({
  reaction,
  onToggle,
  disabled,
  variant = "pill",
}: {
  reaction: FeedReactionSummary;
  onToggle: (emoji: string) => void;
  disabled?: boolean;
  variant?: "pill" | "rail";
}) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const { emoji, count, reacted_by_me: mine } = reaction;

  function click() {
    if (!reduce && scope.current) void animate(scope.current, { scale: [1, 1.45, 1] }, { duration: 0.32, ease: "easeOut" });
    onToggle(emoji);
  }

  const label = `React with ${emoji}${count ? `, ${count} ${count === 1 ? "reaction" : "reactions"}` : ""}${mine ? ", you reacted" : ""}`;

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={click}
        disabled={disabled}
        aria-pressed={mine}
        aria-label={label}
        className="group/rx pointer-events-auto flex flex-col items-center gap-1 rounded-full focus-visible:outline-none disabled:cursor-not-allowed cursor-pointer"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-[0_3px_0_0_rgba(43,42,38,0.15)] ring-2 transition group-hover/rx:-translate-y-0.5 group-focus-visible/rx:-translate-y-0.5 group-focus-visible/rx:ring-[var(--sf-sky)] ${
            mine ? "bg-[var(--sf-mint)] ring-[var(--sf-sage)]" : "bg-white/90 ring-transparent group-hover/rx:bg-white"
          }`}
        >
          <span ref={scope} className="inline-block" aria-hidden="true">
            {emoji}
          </span>
        </span>
        <span className="rounded-full bg-white/80 px-1.5 text-xs font-extrabold tabular-nums text-[var(--sf-ink)]" aria-hidden="true">
          {count}
        </span>
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
      onClick={click}
      disabled={disabled}
      aria-pressed={mine}
      aria-label={label}
      className={`pointer-events-auto relative z-[2] inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-sm font-extrabold ring-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-not-allowed cursor-pointer ${
        mine
          ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)] ring-[var(--sf-sage)]/60"
          : "bg-white text-[var(--sf-soft)] ring-[var(--sf-ink)]/10 hover:bg-[var(--sf-butter)]/50 hover:ring-[var(--sf-ink)]/20"
      }`}
    >
      <span ref={scope} className="inline-block text-base leading-none" aria-hidden="true">
        {emoji}
      </span>
      {count > 0 ? (
        <span className="tabular-nums" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </motion.button>
  );
}

export function ReactionPills({
  reactions,
  onToggle,
  disabled,
}: {
  reactions: FeedReactionSummary[];
  onToggle: (emoji: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Reactions">
      {reactionList(reactions).map((r) => (
        <ReactionPill key={r.emoji} reaction={r} onToggle={onToggle} disabled={disabled} />
      ))}
    </div>
  );
}

// ─── Media ───────────────────────────────────────────────────────────────────

function MediaTile({
  post,
  index,
  className,
  onOpen,
  overlay,
}: {
  post: FeedPost;
  index: number;
  className: string;
  onOpen: (index: number) => void;
  overlay?: ReactNode;
}) {
  const m = post.media[index];
  const alt = mediaAlt(m.kind, index, post.media.length, post.teacher_name);
  if (m.kind === "video" && !overlay) {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        <video
          src={m.storage_url}
          controls
          preload="metadata"
          playsInline
          aria-label={alt}
          className="pointer-events-auto relative z-[2] h-full w-full object-contain"
        />
        {m.duration_secs ? (
          <span className="pointer-events-none absolute left-2 top-2 z-[3] rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-extrabold text-white">
            {formatDuration(m.duration_secs)}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      aria-label={overlay ? `${alt}. Open to see all ${post.media.length}` : `Open ${alt.charAt(0).toLowerCase()}${alt.slice(1)}`}
      className={`group/tile pointer-events-auto relative z-[2] block overflow-hidden bg-[var(--sf-ink)]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--sf-sky)] cursor-zoom-in ${className}`}
    >
      {m.kind === "video" ? (
        <video src={m.storage_url} preload="metadata" muted playsInline className="h-full w-full object-cover" aria-hidden="true" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs
        <img src={m.storage_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover/tile:scale-[1.03] group-focus-visible/tile:scale-[1.03] motion-reduce:transition-none" />
      )}
      {overlay}
    </button>
  );
}

/**
 * Card / sheet media: images open the Lightbox, videos play inline.
 * `compact` is the card layout (1 big, 2 side by side, 3 as 1+2, 4+ with a "+N" tile).
 */
export function MediaGrid({ post, onOpen, compact = true }: { post: FeedPost; onOpen: (index: number) => void; compact?: boolean }) {
  const n = post.media.length;
  if (n === 0) return null;
  const tile = (i: number, cls: string, overlay?: ReactNode) => <MediaTile key={post.media[i].id} post={post} index={i} className={cls} onOpen={onOpen} overlay={overlay} />;

  if (n === 1) return <div className="overflow-hidden rounded-[20px]">{tile(0, "aspect-[4/3] w-full sm:aspect-[16/10]")}</div>;

  if (!compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {post.media.map((_, i) => tile(i, "aspect-square w-full rounded-[18px]"))}
      </div>
    );
  }

  if (n === 2) {
    return <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-[20px]">{[0, 1].map((i) => tile(i, "aspect-[4/5] w-full"))}</div>;
  }
  if (n === 3) {
    return (
      <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-[20px]">
        {tile(0, "row-span-2 h-full w-full")}
        {tile(1, "h-full w-full")}
        {tile(2, "h-full w-full")}
      </div>
    );
  }
  const extra = n - 4;
  return (
    <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-[20px]">
      {[0, 1, 2, 3].map((i) =>
        tile(
          i,
          "aspect-[4/3] w-full",
          i === 3 && extra > 0 ? (
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--sf-ink)]/55 text-2xl font-extrabold text-white" aria-hidden="true">
              +{extra}
            </span>
          ) : undefined,
        ),
      )}
    </div>
  );
}

// ─── Attachments ─────────────────────────────────────────────────────────────

const FILE_TINT: Record<FeedPost["attachments"][number]["kind"], string> = {
  pdf: "bg-[var(--sf-coral)]/25 text-[var(--sf-coral-deep)]",
  doc: "bg-[var(--sf-sky)] text-[#2d5d86]",
  sheet: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
  other: "bg-[var(--sf-ink)]/[0.06] text-[var(--sf-soft)]",
};

const FILE_LABEL: Record<FeedPost["attachments"][number]["kind"], string> = {
  pdf: "PDF",
  doc: "Document",
  sheet: "Spreadsheet",
  other: "File",
};

export function AttachmentList({ attachments }: { attachments: FeedPost["attachments"] }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {attachments.map((a) => {
        const size = formatFileSize(a.file_size_bytes);
        return (
          <li key={a.id}>
            <a
              href={a.storage_url}
              target="_blank"
              rel="noopener noreferrer"
              download={a.file_name}
              className="group/att pointer-events-auto relative z-[2] flex min-h-14 items-center gap-3 rounded-[18px] bg-[var(--sf-cream)] px-3 py-2.5 ring-1 ring-[var(--sf-ink)]/[0.07] transition hover:-translate-y-0.5 hover:bg-[var(--sf-butter)]/40 focus-visible:-translate-y-0.5 focus-visible:bg-[var(--sf-butter)]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${FILE_TINT[a.kind]}`} aria-hidden="true">
                <FileText className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-[var(--sf-ink)]">{a.file_name}</span>
                <span className="block text-xs font-bold text-[var(--sf-soft)]">
                  {FILE_LABEL[a.kind]}
                  {size ? ` · ${size}` : ""}
                </span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-[var(--sf-soft)] transition group-hover/att:text-[var(--sf-ink)]" strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
