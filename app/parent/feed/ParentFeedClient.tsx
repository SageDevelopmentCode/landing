"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  MessageCircle,
  Play,
  FileText,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import ImageLightbox from "@/app/components/ImageLightbox";
import {
  addComment,
  deleteComment,
  toggleReaction,
  type FeedPost,
  type FeedCommentRow,
  type FeedReactionSummary,
} from "@/app/teacher/feed/actions";
import {
  toggleReelReaction,
  addReelComment,
  deleteReelComment,
  type ReelPost,
} from "@/app/teacher/feed/reelActions";
import { DEFAULT_REACTIONS } from "@/app/teacher/feed/constants";
import { getPostType } from "@/app/teacher/feed/postTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaItem =
  | { type: "image"; storage_url: string; label: string }
  | { type: "video"; storage_url: string; duration_secs: number | null; label: string };

type Attachment = {
  id: string;
  name: string;
  size: string;
  kind: "pdf" | "doc" | "sheet" | "other";
};

type Teacher = {
  id: string;
  full_name: string;
  role: string;
  profile_image_url: string | null;
};

// ─── Markdown components ───────────────────────────────────────────────────────

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm font-body text-gray-700 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold font-body text-gray-900 mt-7 mb-2">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold font-body text-gray-900 mt-7 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold font-body text-gray-800 mt-5 mb-1">{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 my-3 space-y-1 text-sm font-body text-gray-700">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 my-3 space-y-1 text-sm font-body text-gray-700">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-gray-100 text-gray-800 text-xs rounded px-1 py-0.5 font-mono">{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#4a7c59] underline hover:text-[#3d6b4a]">{children}</a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-gray-300 pl-3 my-2 text-sm text-gray-500 italic">{children}</blockquote>
  ),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ClientTimestamp({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(formatTimestamp(iso));
  }, [iso]);
  return <span>{label}</span>;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDuration(secs: number | null): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRole(role: string): string {
  if (role === "super_admin") return "Teacher";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-[#4a7c59]",
  "bg-[#5a6b8a]",
  "bg-[#8a5a6b]",
  "bg-[#7c6b4a]",
  "bg-[#6b7c4a]",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Thread Utilities ─────────────────────────────────────────────────────────

type ThreadedComment = FeedCommentRow & {
  profile_image_url?: string | null;
  depth: number;
};

function buildThreadedList(
  comments: (FeedCommentRow & { profile_image_url?: string | null })[]
): ThreadedComment[] {
  const childMap = new Map<string | null, typeof comments>();
  for (const c of comments) {
    const key = c.parent_comment_id ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(c);
  }
  const result: ThreadedComment[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const c of childMap.get(parentId) ?? []) {
      result.push({ ...c, depth: Math.min(depth, 4) });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthorAvatar({
  initials,
  color,
  size = "md",
  imageUrl,
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  imageUrl?: string | null;
}) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={initials}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

function PostTypeBadge({ value }: { value: string | null }) {
  const config = getPostType(value);
  if (!config) return null;
  return (
    <span
      style={{
        backgroundColor: config.color,
        color: config.textColor,
        borderRadius: 6,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {config.label}
    </span>
  );
}

function FileIcon({ kind }: { kind: Attachment["kind"] }) {
  const map = {
    pdf: { bg: "bg-rose-50", text: "text-rose-500" },
    doc: { bg: "bg-blue-50", text: "text-blue-500" },
    sheet: { bg: "bg-emerald-50", text: "text-emerald-500" },
    other: { bg: "bg-gray-100", text: "text-gray-500" },
  };
  const { bg, text } = map[kind];
  return (
    <div
      className={`${bg} ${text} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}
    >
      <FileText className="w-4 h-4" />
    </div>
  );
}

function MediaGrid({ media }: { media: MediaItem[] }) {
  if (media.length === 0) return null;

  const renderItem = (item: MediaItem, className: string) => (
    <div
      key={item.label}
      className={`${className} relative overflow-hidden flex items-center justify-center bg-gray-100`}
    >
      {item.type === "video" ? (
        <>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md">
              <Play className="w-5 h-5 text-gray-700 ml-0.5" fill="currentColor" />
            </div>
            {item.duration_secs && (
              <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">
                {formatDuration(item.duration_secs)}
              </span>
            )}
          </div>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.storage_url} alt={item.label} className="w-full h-full object-cover" />
      )}
    </div>
  );

  if (media.length === 1) {
    return (
      <div className="mt-3">
        {renderItem(media[0], "w-full h-80")}
      </div>
    );
  }

  if (media.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1">
        {media.map((item) => renderItem(item, "h-64"))}
      </div>
    );
  }

  if (media.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1">
        {renderItem(media[0], "row-span-2 h-full min-h-[256px]")}
        <div className="flex flex-col gap-1">
          {renderItem(media[1], "h-[124px]")}
          {renderItem(media[2], "h-[124px]")}
        </div>
      </div>
    );
  }

  const visible = media.slice(0, 4);
  const extra = media.length - 4;
  return (
    <div className="mt-3 grid grid-cols-2 gap-1">
      {visible.map((item, i) => {
        const isLast = i === 3 && extra > 0;
        return (
          <div key={item.label} className="relative">
            {renderItem(item, "h-40 w-full")}
            {isLast && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{extra}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReactionPills({
  reactions,
  onToggle,
  currentUserId,
}: {
  reactions: FeedReactionSummary[];
  onToggle: (emoji: string) => void;
  currentUserId: string | undefined;
}) {
  const [justToggled, setJustToggled] = useState<string | null>(null);

  function handleToggle(emoji: string) {
    if (!currentUserId) return;
    setJustToggled(emoji);
    onToggle(emoji);
    setTimeout(() => setJustToggled(null), 400);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {reactions.map((r) => (
        <motion.button
          key={r.emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
          animate={justToggled === r.emoji ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.25, ease: "easeOut" as const }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(r.emoji);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border cursor-pointer select-none ${
            r.reacted_by_me
              ? "bg-[#4a7c59]/12 border-[#4a7c59]/40 text-[#4a7c59]"
              : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          <span className="text-base leading-none">{r.emoji}</span>
          {r.count > 0 && <span className="text-xs font-semibold">{r.count}</span>}
        </motion.button>
      ))}
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  onReactionToggle,
  onClick,
  profileHref,
}: {
  post: FeedPost;
  currentUserId: string | undefined;
  onReactionToggle: (postId: string, emoji: string) => void;
  onClick: () => void;
  profileHref: string;
}) {
  // Parents are never post owners — the menu will never show, but keep
  // the isOwner check for structural parity.
  const isOwner = currentUserId === post.teacher_id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false)
  const isLongBody = post.body.length > 300

  const media: MediaItem[] = post.media.map((m, i) => ({
    type: m.kind,
    storage_url: m.storage_url,
    label: `media-${i}`,
    duration_secs: m.kind === "video" ? m.duration_secs : undefined,
  })) as MediaItem[];

  const attachments: Attachment[] = post.attachments.map((a) => ({
    id: a.id,
    name: a.file_name,
    size: formatFileSize(a.file_size_bytes),
    kind: a.kind,
  }));

  return (
    <motion.div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 pt-5 px-5">
        <div className="flex items-center gap-2.5">
          <Link
            href={profileHref}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <AuthorAvatar
              initials={getInitials(post.teacher_name)}
              color={avatarColor(post.teacher_id)}
              imageUrl={post.teacher_profile_image_url}
            />
          </Link>
          <div>
            <p className="text-sm font-semibold font-body text-gray-800 leading-tight">
              {post.teacher_name}
            </p>
            <p className="text-xs text-gray-400 font-body">
              {formatRole(post.teacher_role)} · <ClientTimestamp iso={post.created_at} />
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 min-w-[130px]"
              >
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors font-body"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post type badge */}
      {post.post_type && (
        <div className="px-5 mb-2">
          <PostTypeBadge value={post.post_type} />
        </div>
      )}

      {/* Body */}
      <div className="px-5">
        <div
          className={`relative text-sm font-body text-gray-700 leading-relaxed [&>*:last-child]:mb-0 ${
            isLongBody && !bodyExpanded ? 'max-h-24 overflow-hidden' : ''
          }`}
        >
          <ReactMarkdown components={markdownComponents}>{post.body}</ReactMarkdown>
          {isLongBody && !bodyExpanded && (
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
        {isLongBody && (
          <button
            onClick={(e) => { e.stopPropagation(); setBodyExpanded(v => !v) }}
            className="mt-1 text-xs font-semibold text-[#4a7c59] hover:text-[#3d6b4a] transition-colors"
          >
            {bodyExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Media — full bleed */}
      {media.length > 0 && <MediaGrid media={media} />}

      {/* Attachments — full bleed */}
      {attachments.length > 0 && (
        <div className="mt-3 flex flex-col gap-0">
          {attachments.map((att) => (
            <div
              key={att.id}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 bg-gray-50 px-5 py-3 border-t border-gray-100 hover:bg-gray-100 transition-colors cursor-default"
            >
              <FileIcon kind={att.kind} />
              <div className="min-w-0">
                <p className="text-sm font-body font-medium text-gray-700 truncate">{att.name}</p>
                <p className="text-xs text-gray-400 font-body">{att.size}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reactions + Comments */}
      <div className="mt-4 pt-3.5 pb-4 px-5 border-t border-gray-50 flex items-center justify-between">
        <ReactionPills
          reactions={post.reactions}
          onToggle={(emoji) => onReactionToggle(post.id, emoji)}
          currentUserId={currentUserId}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#4a7c59] transition-colors font-body ml-3 flex-shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.comments.length} comments
        </button>
      </div>
    </motion.div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  imageUrl,
  onDelete,
  depth = 0,
  onReply,
}: {
  comment: ThreadedComment;
  currentUserId: string | undefined;
  imageUrl?: string | null;
  onDelete: (commentId: string) => void;
  depth?: number;
  onReply: (commentId: string, authorName: string) => void;
}) {
  const isOwner = currentUserId === comment.author_id;
  return (
    <div className="flex gap-2.5 group/comment" style={{ marginLeft: `${depth * 24}px` }}>
      <AuthorAvatar
        initials={getInitials(comment.author_name)}
        color={avatarColor(comment.author_id)}
        size="sm"
        imageUrl={imageUrl ?? comment.profile_image_url}
      />
      <div className="flex-1 min-w-0">
        <div className="bg-[#eef4ef] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <p className="text-xs font-semibold font-body text-gray-700 mb-0.5">
            {comment.author_name}
          </p>
          <p className="text-sm font-body text-gray-600 leading-relaxed">{comment.body}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <p className="text-xs text-gray-400 font-body"><ClientTimestamp iso={comment.created_at} /></p>
          <button
            onClick={() => onReply(comment.id, comment.author_name)}
            className="text-xs text-gray-300 hover:text-[#4a7c59] transition-colors opacity-0 group-hover/comment:opacity-100 font-body"
          >
            Reply
          </button>
          {isOwner && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-gray-300 hover:text-rose-400 transition-colors opacity-0 group-hover/comment:opacity-100 font-body"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PostSidebarContent({
  post,
  currentUserId,
  currentUserInitials,
  currentUserProfileImageUrl,
  onReactionToggle,
  onCommentAdded,
  onCommentDeleted,
  onClose,
  addCommentFn = addComment,
}: {
  post: FeedPost;
  currentUserId: string | undefined;
  currentUserInitials?: string;
  currentUserProfileImageUrl?: string | null;
  onReactionToggle: (postId: string, emoji: string) => void;
  onCommentAdded: (postId: string, comment: FeedCommentRow & { profile_image_url?: string | null }) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
  onClose: () => void;
  addCommentFn?: (postId: string, body: string, parentId?: string | null) => Promise<FeedCommentRow>;
}) {
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const media: MediaItem[] = post.media.map((m, i) => ({
    type: m.kind,
    storage_url: m.storage_url,
    label: `media-${i}`,
    duration_secs: m.kind === "video" ? m.duration_secs : undefined,
  })) as MediaItem[];

  const attachments: Attachment[] = post.attachments.map((a) => ({
    id: a.id,
    name: a.file_name,
    size: formatFileSize(a.file_size_bytes),
    kind: a.kind,
  }));

  function handleSubmitComment() {
    const text = commentText.trim();
    if (!text || isPending) return;
    const parentId = replyingTo?.id ?? null;
    setCommentText("");
    setReplyingTo(null);
    startTransition(async () => {
      const newComment = await addCommentFn(post.id, text, parentId);
      onCommentAdded(post.id, { ...newComment, profile_image_url: currentUserProfileImageUrl ?? null });
    });
  }

  return (
    <div className="space-y-5">
      {/* Post header — avatar + name + X in one row */}
      <div className="flex items-center gap-2.5">
        <AuthorAvatar
          initials={getInitials(post.teacher_name)}
          color={avatarColor(post.teacher_id)}
          size="lg"
          imageUrl={post.teacher_profile_image_url}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-body text-gray-800">{post.teacher_name}</p>
          <p className="text-xs text-gray-400 font-body">
            {formatRole(post.teacher_role)} · <ClientTimestamp iso={post.created_at} />
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Post type badge */}
      {post.post_type && <PostTypeBadge value={post.post_type} />}

      {/* Full body */}
      <div className="text-sm font-body text-gray-700 leading-relaxed [&>*:last-child]:mb-0">
        <ReactMarkdown components={markdownComponents}>{post.body}</ReactMarkdown>
      </div>

      {/* Full media */}
      {media.length > 0 && (
        <div>
          {media.length === 1 ? (
            <div
              className={`rounded-xl overflow-hidden relative flex items-center justify-center bg-gray-100 h-80 ${media[0].type === "image" ? "group cursor-pointer" : ""}`}
              onClick={() => { if (media[0].type === "image") setLightboxIndex(0); }}
            >
              {media[0].type === "video" ? (
                <>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                      <Play className="w-5 h-5 text-gray-700 ml-0.5" fill="currentColor" />
                    </div>
                    {media[0].duration_secs && (
                      <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">
                        {formatDuration(media[0].duration_secs)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 z-10" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media[0].storage_url} alt={media[0].label} className="w-full h-full object-cover" />
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {media.map((item, i) => (
                <div
                  key={item.label}
                  className={`h-32 rounded-xl relative overflow-hidden flex items-center justify-center bg-gray-100 ${item.type === "image" ? "group cursor-pointer" : ""}`}
                  onClick={() => { if (item.type === "image") setLightboxIndex(i); }}
                >
                  {item.type === "video" ? (
                    <>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 text-gray-700 ml-0.5" fill="currentColor" />
                        </div>
                        {item.duration_secs && (
                          <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">
                            {formatDuration(item.duration_secs)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 z-10" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.storage_url}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && (() => {
        const imageItems = media.filter((m) => m.type === "image");
        const imageOnlyIndex = media.slice(0, lightboxIndex + 1).filter((m) => m.type === "image").length - 1;
        return (
          <ImageLightbox
            images={imageItems.map((m) => ({ src: m.storage_url, alt: m.label }))}
            initialIndex={Math.max(0, imageOnlyIndex)}
            onClose={() => setLightboxIndex(null)}
          />
        );
      })()}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100"
            >
              <FileIcon kind={att.kind} />
              <div className="min-w-0">
                <p className="text-sm font-body font-medium text-gray-700 truncate">{att.name}</p>
                <p className="text-xs text-gray-400 font-body">{att.size}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-3">
          Reactions
        </p>
        <ReactionPills
          reactions={post.reactions}
          onToggle={(emoji) => onReactionToggle(post.id, emoji)}
          currentUserId={currentUserId}
        />
      </div>

      {/* Comments */}
      {(() => {
        const threadedComments = buildThreadedList(
          post.comments.map((c) => ({
            ...c,
            profile_image_url: currentUserId === c.author_id ? currentUserProfileImageUrl : null,
          }))
        );
        return (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wide mb-4">
              Comments · {post.comments.length}
            </p>
            <div className="flex flex-col gap-4">
              {threadedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  imageUrl={comment.profile_image_url}
                  depth={comment.depth}
                  onDelete={(commentId) => onCommentDeleted(post.id, commentId)}
                  onReply={(commentId, authorName) => setReplyingTo({ id: commentId, authorName })}
                />
              ))}
              {post.comments.length === 0 && (
                <p className="text-sm text-gray-400 font-body">No comments yet.</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Comment input */}
      <div className="border-t border-gray-100 pt-4">
        {replyingTo && (
          <div className="flex items-center justify-between bg-[#eef4ef] rounded-xl px-3.5 py-2 mb-2 text-xs font-body text-[#4a7c59]">
            <span>
              Replying to <span className="font-semibold">{replyingTo.authorName}</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-[#4a7c59]/60 hover:text-[#4a7c59] transition-colors ml-2"
              aria-label="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {currentUserId && currentUserInitials && (
            <AuthorAvatar initials={currentUserInitials} color="bg-[#4a7c59]" size="sm" imageUrl={currentUserProfileImageUrl} />
          )}
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitComment();
              }}
              placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Add a comment..."}
              className="flex-1 bg-transparent text-sm font-body text-gray-700 placeholder-gray-400 outline-none"
              disabled={isPending}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isPending}
              className="text-[#4a7c59] hover:text-[#3d6b4a] transition-colors flex-shrink-0 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReelCard({
  post,
  currentUserId,
  onReactionToggle,
  onClick,
}: {
  post: ReelPost;
  currentUserId: string | undefined;
  onReactionToggle: (postId: string, emoji: string) => void;
  onClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          const v = videoRef.current;
          if (v) { v.muted = isMuted; v.play().then(() => setIsPlaying(true)).catch(() => {}); }
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full snap-start flex items-center justify-center bg-[#f5f3ef] py-4"
    >
      {/* Video column */}
      <div
        className="relative bg-black flex items-center justify-center shadow-xl rounded-2xl overflow-hidden"
        style={{ height: "calc(100vh - 2rem)", width: "calc((100vh - 2rem) * 9 / 16)" }}
        onClick={togglePlay}
      >
        {post.storage_url ? (
          <video
            ref={videoRef}
            src={isVisible ? post.storage_url : undefined}
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Play/pause indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Bottom overlay: author + caption */}
        <div className="absolute bottom-6 left-4 right-4 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <AuthorAvatar
              initials={getInitials(post.teacher_name)}
              color={avatarColor(post.teacher_id)}
              imageUrl={post.teacher_profile_image_url}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold font-body text-white leading-tight drop-shadow">{post.teacher_name}</p>
              <p className="text-xs text-white/70 font-body drop-shadow"><ClientTimestamp iso={post.created_at} /></p>
            </div>
          </div>
          {post.caption && (
            <p className="text-sm font-body text-white/90 leading-snug mt-1 drop-shadow">{post.caption}</p>
          )}
        </div>

        {/* Mute toggle — top left */}
        <button
          onClick={toggleMute}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18l2.45 2.45c.04-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Right action column */}
      <div className="absolute right-3 bottom-8 flex flex-col items-center gap-5">
        {DEFAULT_REACTIONS.map((emoji) => {
          const reaction = post.reactions.find((r) => r.emoji === emoji);
          const reacted = reaction?.reacted_by_me ?? false;
          return (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); onReactionToggle(post.id, emoji); }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all shadow-sm ${
                reacted ? "bg-[#4a7c59]/15 ring-2 ring-[#4a7c59]/50 scale-110" : "bg-white/80 hover:bg-white"
              }`}>
                {emoji}
              </div>
              <span className="text-xs font-semibold text-gray-700">{reaction?.count ?? 0}</span>
            </button>
          );
        })}

        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm text-gray-600">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-gray-700">{post.comments.length}</span>
        </button>
      </div>
    </div>
  );
}

function reelToFeedPost(reel: ReelPost): FeedPost {
  return {
    id: reel.id,
    teacher_id: reel.teacher_id,
    teacher_name: reel.teacher_name,
    teacher_role: reel.teacher_role,
    teacher_profile_image_url: reel.teacher_profile_image_url,
    body: reel.caption,
    school_year: reel.school_year,
    classroom: null,
    post_type: null,
    created_at: reel.created_at,
    media: reel.storage_url
      ? [{ id: reel.id, kind: "video" as const, storage_url: reel.storage_url, display_order: 0, duration_secs: reel.duration_secs }]
      : [],
    attachments: [],
    reactions: reel.reactions,
    comments: reel.comments,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParentFeedClient({
  currentUser,
  initialPosts,
  initialReelPosts,
  profileImageUrl,
  teachers,
}: {
  currentUser: { full_name: string; role: string; id: string } | null;
  initialPosts: FeedPost[];
  initialReelPosts: ReelPost[];
  profileImageUrl?: string | null;
  teachers: Teacher[];
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [reelPosts, setReelPosts] = useState<ReelPost[]>(initialReelPosts);
  const [feedMode, setFeedMode] = useState<"feed" | "reel">(() => {
    if (tabParam === "feed" || tabParam === "reel") return tabParam;
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("parentFeedMode");
      if (saved === "feed" || saved === "reel") return saved;
    }
    return "feed";
  });
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => { sessionStorage.setItem("parentFeedMode", feedMode); }, [feedMode]);

  const displayedPosts = feedMode === "feed"
    ? (selectedTeacherId ? posts.filter((p) => p.teacher_id === selectedTeacherId) : posts)
    : (selectedTeacherId ? reelPosts.filter((p) => p.teacher_id === selectedTeacherId) : reelPosts);

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "P";

  function isReelId(id: string) {
    return reelPosts.some((r) => r.id === id);
  }

  function handleReactionToggle(postId: string, emoji: string) {
    const updateReactions = <T extends { reactions: FeedReactionSummary[] }>(p: T): T => {
      const existing = p.reactions.find((r) => r.emoji === emoji);
      let newReactions: FeedReactionSummary[];
      if (existing) {
        newReactions = p.reactions
          .map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.reacted_by_me ? r.count - 1 : r.count + 1, reacted_by_me: !r.reacted_by_me }
              : r
          )
          .filter((r) => r.count > 0 || DEFAULT_REACTIONS.includes(r.emoji));
      } else {
        newReactions = [...p.reactions, { emoji, count: 1, reacted_by_me: true }];
      }
      return { ...p, reactions: newReactions };
    };

    if (isReelId(postId)) {
      setReelPosts((prev) => prev.map((r) => {
        if (r.id !== postId) return r;
        const updated = updateReactions(r);
        if (selectedPost?.id === postId) setSelectedPost(reelToFeedPost(updated));
        return updated;
      }));
      toggleReelReaction(postId, emoji).catch(() => window.location.reload());
    } else {
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = updateReactions(p);
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      }));
      toggleReaction(postId, emoji).catch(() => window.location.reload());
    }
  }

  function handleCommentAdded(postId: string, comment: FeedCommentRow & { profile_image_url?: string | null }) {
    if (isReelId(postId)) {
      setReelPosts((prev) => prev.map((r) => {
        if (r.id !== postId) return r;
        const updated = { ...r, comments: [...r.comments, comment] };
        if (selectedPost?.id === postId) setSelectedPost(reelToFeedPost(updated));
        return updated;
      }));
    } else {
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, comments: [...p.comments, comment] };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      }));
    }
  }

  function handleCommentDeleted(postId: string, commentId: string) {
    if (isReelId(postId)) {
      setReelPosts((prev) => prev.map((r) => {
        if (r.id !== postId) return r;
        const updated = { ...r, comments: r.comments.filter((c) => c.id !== commentId) };
        if (selectedPost?.id === postId) setSelectedPost(reelToFeedPost(updated));
        return updated;
      }));
      deleteReelComment(commentId).catch(() => window.location.reload());
    } else {
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, comments: p.comments.filter((c) => c.id !== commentId) };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      }));
      deleteComment(commentId).catch(() => window.location.reload());
    }
  }

  const liveSelectedPost = selectedPost
    ? (() => {
        const feedPost = posts.find((p) => p.id === selectedPost.id);
        if (feedPost) return feedPost;
        const reel = reelPosts.find((r) => r.id === selectedPost.id);
        if (reel) return reelToFeedPost(reel);
        return selectedPost;
      })()
    : null;

  const isSelectedReel = selectedPost ? isReelId(selectedPost.id) : false;

  const panelContent = feedMode === "feed"
    ? { title: "Class Feed", desc: "Updates, photos, and moments from the classroom" }
    : { title: "Class Reels", desc: "Short video moments captured by teachers" };

  return (
    <div className={`flex-1 flex overflow-hidden transition-colors duration-300 ${feedMode === "reel" ? "bg-[#f5f3ef]" : ""}`}>
      {/* ── Left: Nav panel ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 px-5 pt-8 gap-4 sticky top-0 h-screen">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
        >
          <h1 className="text-2xl font-bold font-heading text-gray-800">{panelContent.title}</h1>
          <p className="text-sm font-body mt-1 text-gray-400">{panelContent.desc}</p>
        </motion.div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(["feed", "reel"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFeedMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold font-body transition-colors ${
                feedMode === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {m === "feed" ? "Feed" : "Reels"}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Right: Feed column ── */}
      <div className={`flex-1 ${feedMode === "reel" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}>

        {/* Posts */}
        {feedMode === "reel" ? (
          <div className="flex-1 overflow-y-auto snap-y snap-mandatory">
            {displayedPosts.length === 0 ? (
              <div className="h-screen flex items-center justify-center text-gray-500 font-body text-sm snap-start">
                {selectedTeacherId
                  ? `No reels from ${teachers.find((t) => t.id === selectedTeacherId)?.full_name ?? "this teacher"} yet.`
                  : "No reels yet."}
              </div>
            ) : (
              displayedPosts.map((post) => (
                <ReelCard
                  key={post.id}
                  post={post as ReelPost}
                  currentUserId={currentUser?.id}
                  onReactionToggle={handleReactionToggle}
                  onClick={() => setSelectedPost(reelToFeedPost(post as ReelPost))}
                />
              ))
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
            <AnimatePresence mode="wait">
              {displayedPosts.length === 0 ? (
                <motion.div
                  key="feed-empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-center py-16 text-gray-400 font-body text-sm"
                >
                  {selectedTeacherId
                    ? `No posts from ${teachers.find((t) => t.id === selectedTeacherId)?.full_name ?? "this teacher"} yet.`
                    : "No posts yet."}
                </motion.div>
              ) : (
                <motion.div
                  key="feed-list"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.07 } },
                  }}
                  className="flex flex-col gap-4"
                >
                  <AnimatePresence>
                    {displayedPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        variants={{
                          hidden: { opacity: 0, y: 18 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
                        }}
                        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                        layout
                      >
                        <PostCard
                          post={post as FeedPost}
                          currentUserId={currentUser?.id}
                          onReactionToggle={handleReactionToggle}
                          onClick={() => setSelectedPost(post as FeedPost)}
                          profileHref={`/parent/profile/${post.teacher_id}`}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Post detail sidebar */}
      <DetailSidebar
        isOpen={!!liveSelectedPost}
        onClose={() => setSelectedPost(null)}
        title=""
        footer={null}
      >
        {liveSelectedPost && (
          <PostSidebarContent
            post={liveSelectedPost}
            currentUserId={currentUser?.id}
            currentUserInitials={initials}
            currentUserProfileImageUrl={profileImageUrl}
            onReactionToggle={handleReactionToggle}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            onClose={() => setSelectedPost(null)}
            addCommentFn={isSelectedReel ? addReelComment : addComment}
          />
        )}
      </DetailSidebar>
    </div>
  );
}
