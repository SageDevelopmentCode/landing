"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  Paperclip,
  MoreHorizontal,
  MessageCircle,
  Play,
  FileText,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import {
  createPost,
  uploadFeedMedia,
  uploadFeedAttachment,
  addComment,
  deletePost,
  deleteComment,
  toggleReaction,
  type FeedPost,
  type FeedCommentRow,
  type FeedReactionSummary,
} from "./actions";
import { DEFAULT_REACTIONS } from "./constants";

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
  onDelete,
  onClick,
}: {
  post: FeedPost;
  currentUserId: string | undefined;
  onReactionToggle: (postId: string, emoji: string) => void;
  onDelete: (postId: string) => void;
  onClick: () => void;
}) {
  const isOwner = currentUserId === post.teacher_id;
  const [menuOpen, setMenuOpen] = useState(false);

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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: "easeOut" as const }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 pt-5 px-5">
        <div className="flex items-center gap-2.5">
          <AuthorAvatar
            initials={getInitials(post.teacher_name)}
            color={avatarColor(post.teacher_id)}
            imageUrl={post.teacher_profile_image_url}
          />
          <div>
            <p className="text-sm font-semibold font-body text-gray-800 leading-tight">
              {post.teacher_name}
            </p>
            <p className="text-xs text-gray-400 font-body">
              {formatRole(post.teacher_role)} · {formatTimestamp(post.created_at)}
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
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(post.id);
                  }}
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

      {/* Body */}
      <p className="text-sm font-body text-gray-700 leading-relaxed px-5">{post.body}</p>

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
          <p className="text-xs text-gray-400 font-body">{formatTimestamp(comment.created_at)}</p>
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
}: {
  post: FeedPost;
  currentUserId: string | undefined;
  currentUserInitials?: string;
  currentUserProfileImageUrl?: string | null;
  onReactionToggle: (postId: string, emoji: string) => void;
  onCommentAdded: (postId: string, comment: FeedCommentRow & { profile_image_url?: string | null }) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
  onClose: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
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
      const newComment = await addComment(post.id, text, parentId);
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
            {formatRole(post.teacher_role)} · {formatTimestamp(post.created_at)}
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

      {/* Full body */}
      <p className="text-sm font-body text-gray-700 leading-relaxed">{post.body}</p>

      {/* Full media */}
      {media.length > 0 && (
        <div>
          {media.length === 1 ? (
            <div className="rounded-xl overflow-hidden relative flex items-center justify-center bg-gray-100 h-80">
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media[0].storage_url} alt={media[0].label} className="w-full h-full object-cover" />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {media.map((item) => (
                <div
                  key={item.label}
                  className="h-32 rounded-xl relative overflow-hidden flex items-center justify-center bg-gray-100"
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.storage_url}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Comment input (inside sidebar content so it scrolls with content) */}
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

const MEDIA_ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic", "video/mp4", "video/quicktime", "video/webm"];
const ATTACHMENT_ACCEPTED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
const MAX_MEDIA = 10;
const MAX_ATTACHMENTS = 5;
const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

type QueuedFile = { file: File; previewUrl: string | null };

function ComposeBar({
  initials,
  onPost,
  profileImageUrl,
}: {
  initials: string;
  onPost: () => void;
  profileImageUrl?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const [mediaQueue, setMediaQueue] = useState<QueuedFile[]>([]);
  const [attachmentQueue, setAttachmentQueue] = useState<QueuedFile[]>([]);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  function addMediaFiles(files: FileList | File[]) {
    setUploadError(null);
    const arr = Array.from(files);
    const valid: QueuedFile[] = [];
    for (const f of arr) {
      if (!MEDIA_ACCEPTED.includes(f.type)) {
        setUploadError(`"${f.name}" is not a supported media type.`);
        continue;
      }
      if (f.size > MAX_MEDIA_SIZE) {
        setUploadError(`"${f.name}" exceeds the 50 MB limit.`);
        continue;
      }
      if (mediaQueue.length + valid.length >= MAX_MEDIA) {
        setUploadError(`Maximum ${MAX_MEDIA} media files allowed.`);
        break;
      }
      const previewUrl = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
      valid.push({ file: f, previewUrl });
    }
    setMediaQueue((q) => [...q, ...valid]);
  }

  function addAttachmentFiles(files: FileList | File[]) {
    setUploadError(null);
    const arr = Array.from(files);
    const valid: QueuedFile[] = [];
    for (const f of arr) {
      if (!ATTACHMENT_ACCEPTED.includes(f.type)) {
        setUploadError(`"${f.name}" is not a supported file type.`);
        continue;
      }
      if (f.size > MAX_ATTACHMENT_SIZE) {
        setUploadError(`"${f.name}" exceeds the 25 MB limit.`);
        continue;
      }
      if (attachmentQueue.length + valid.length >= MAX_ATTACHMENTS) {
        setUploadError(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`);
        break;
      }
      valid.push({ file: f, previewUrl: null });
    }
    setAttachmentQueue((q) => [...q, ...valid]);
  }

  function removeMedia(index: number) {
    setMediaQueue((q) => {
      const next = [...q];
      if (next[index].previewUrl) URL.revokeObjectURL(next[index].previewUrl!);
      next.splice(index, 1);
      return next;
    });
  }

  function removeAttachment(index: number) {
    setAttachmentQueue((q) => {
      const next = [...q];
      next.splice(index, 1);
      return next;
    });
  }

  function reset() {
    mediaQueue.forEach((m) => { if (m.previewUrl) URL.revokeObjectURL(m.previewUrl); });
    setMediaQueue([]);
    setAttachmentQueue([]);
    setBody("");
    setExpanded(false);
    setUploadError(null);
  }

  function handlePost() {
    const text = body.trim();
    if (!text || isPending) return;
    startTransition(async () => {
      setUploadError(null);
      // 1. Create the post
      const fd = new FormData();
      fd.append("body", text);
      let postId: string;
      try {
        postId = await createPost(fd);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Failed to create post");
        return;
      }

      // 2. Upload media in order
      for (let i = 0; i < mediaQueue.length; i++) {
        const mfd = new FormData();
        mfd.append("postId", postId);
        mfd.append("file", mediaQueue[i].file);
        mfd.append("displayOrder", String(i));
        const result = await uploadFeedMedia(mfd);
        if (result.error) {
          setUploadError(`Media upload failed: ${result.error}`);
          return;
        }
      }

      // 3. Upload attachments
      for (const { file } of attachmentQueue) {
        const afd = new FormData();
        afd.append("postId", postId);
        afd.append("file", file);
        const result = await uploadFeedAttachment(afd);
        if (result.error) {
          setUploadError(`Attachment upload failed: ${result.error}`);
          return;
        }
      }

      reset();
      onPost();
    });
  }

  const hasContent = body.trim() || mediaQueue.length > 0 || attachmentQueue.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AuthorAvatar initials={initials} color="bg-[#4a7c59]" imageUrl={profileImageUrl} />
        </div>
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {!expanded ? (
              <motion.button
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setExpanded(true)}
                className="w-full text-left bg-gray-50 rounded-full px-4 py-2.5 border border-gray-100 text-sm font-body text-gray-400 hover:bg-gray-100 transition-colors"
              >
                Share something with parents...
              </motion.button>
            ) : (
              <motion.textarea
                key="textarea"
                initial={{ opacity: 0, scaleY: 0.8, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" as const }}
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's happening in the classroom today?"
                rows={3}
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 text-sm font-body text-gray-700 placeholder-gray-400 outline-none resize-none focus:border-[#4a7c59]/40 transition-colors"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            style={{ overflow: "hidden" }}
          >
            {/* Media queue preview */}
            <AnimatePresence>
              {mediaQueue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <AnimatePresence>
                    {mediaQueue.map((m, i) => (
                      <motion.div
                        key={`${m.file.name}-${i}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        transition={{ duration: 0.18, ease: "easeOut" as const }}
                        className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0"
                      >
                        {m.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-6 h-6 text-gray-400" />
                        )}
                        <button
                          onClick={() => removeMedia(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attachment queue */}
            <AnimatePresence>
              {attachmentQueue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 flex flex-col gap-1.5"
                >
                  <AnimatePresence>
                    {attachmentQueue.map((a, i) => (
                      <motion.div
                        key={`${a.file.name}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2"
                      >
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-body text-gray-600 flex-1 truncate min-w-0">{a.file.name}</span>
                        <span className="text-xs text-gray-400 font-body flex-shrink-0">{formatFileSize(a.file.size)}</span>
                        <button onClick={() => removeAttachment(i)} className="text-gray-300 hover:text-rose-400 transition-colors flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Media drop zone */}
            {mediaQueue.length < MAX_MEDIA && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingMedia(true); }}
                onDragLeave={() => setIsDraggingMedia(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingMedia(false);
                  addMediaFiles(e.dataTransfer.files);
                }}
                onClick={() => mediaInputRef.current?.click()}
                className={`mt-3 border-2 border-dashed rounded-xl px-4 py-4 text-center cursor-pointer transition-all duration-200 ${
                  isDraggingMedia
                    ? "border-[#4a7c59] bg-[#4a7c59]/5 scale-[1.01]"
                    : "border-gray-200 bg-gray-50 hover:border-[#4a7c59]/40"
                } ${isPending ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
              >
                <Upload className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs font-body text-gray-400">Drop photos or videos, or click to select</p>
                <p className="text-xs text-gray-300 font-body mt-0.5">JPEG, PNG, WEBP, GIF, HEIC, MP4, MOV · max 50 MB</p>
              </div>
            )}

            {/* Attachment drop zone */}
            {attachmentQueue.length < MAX_ATTACHMENTS && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingAttachment(true); }}
                onDragLeave={() => setIsDraggingAttachment(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingAttachment(false);
                  addAttachmentFiles(e.dataTransfer.files);
                }}
                onClick={() => attachmentInputRef.current?.click()}
                className={`mt-2 border-2 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer transition-all duration-200 ${
                  isDraggingAttachment
                    ? "border-amber-400 bg-amber-50 scale-[1.01]"
                    : "border-gray-200 bg-gray-50 hover:border-amber-300"
                } ${isPending ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
              >
                <Paperclip className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs font-body text-gray-400">Drop a document, or click to select</p>
                <p className="text-xs text-gray-300 font-body mt-0.5">PDF, Word, Excel · max 25 MB</p>
              </div>
            )}

            <AnimatePresence>
              {uploadError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 text-xs text-rose-500 font-body"
                >
                  {uploadError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-3 mt-3">
              <button
                onClick={reset}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-body text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePost}
                disabled={!hasContent || isPending}
                className="px-4 py-1.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-full hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Posting..." : "Post"}
              </motion.button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addMediaFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addAttachmentFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherFeedClient({
  currentUser,
  initialPosts,
  profileImageUrl,
  teachers,
}: {
  currentUser: { full_name: string; role: string; id: string } | null;
  initialPosts: FeedPost[];
  profileImageUrl?: string | null;
  teachers: Teacher[];
}) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const displayedPosts = selectedTeacherId
    ? posts.filter((p) => p.teacher_id === selectedTeacherId)
    : posts;

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "T";

  function handleReactionToggle(postId: string, emoji: string) {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
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
        const updated = { ...p, reactions: newReactions };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      })
    );
    toggleReaction(postId, emoji).catch(() => {
      // Revert on error — simplest approach is to refresh
      window.location.reload();
    });
  }

  function handleDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPost?.id === postId) setSelectedPost(null);
    deletePost(postId).catch(() => window.location.reload());
  }

  function handleCommentAdded(postId: string, comment: FeedCommentRow & { profile_image_url?: string | null }) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, comments: [...p.comments, comment] };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      })
    );
  }

  function handleCommentDeleted(postId: string, commentId: string) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, comments: p.comments.filter((c) => c.id !== commentId) };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      })
    );
    deleteComment(commentId).catch(() => window.location.reload());
  }

  // Keep selectedPost in sync with posts state
  const liveSelectedPost = selectedPost
    ? (posts.find((p) => p.id === selectedPost.id) ?? selectedPost)
    : null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left: Teachers panel ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto px-3 pt-8 gap-1">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">
          Teachers
        </p>

        {/* "All Teachers" tab */}
        <button
          onClick={() => setSelectedTeacherId(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
            selectedTeacherId === null
              ? "bg-[#4a7c59]/8 text-gray-800"
              : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-gray-500 font-bold">All</span>
          </div>
          <span className="text-sm font-body font-medium truncate">All Teachers</span>
        </button>

        {/* Teacher tabs */}
        {teachers.map((teacher) => {
          const isSelected = selectedTeacherId === teacher.id;
          return (
            <button
              key={teacher.id}
              onClick={() => setSelectedTeacherId(isSelected ? null : teacher.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#4a7c59]/8 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              <AuthorAvatar
                initials={getInitials(teacher.full_name)}
                color={avatarColor(teacher.id)}
                size="sm"
                imageUrl={teacher.profile_image_url}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium truncate leading-tight">
                  {teacher.full_name}
                </p>
                <p className="text-[11px] font-body text-gray-400 truncate">
                  {formatRole(teacher.role)}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      {/* ── Right: Feed column ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold font-heading text-gray-800">Class Feed</h1>
            <p className="text-sm font-body text-gray-400 mt-1">
              Updates, photos, and moments from the classroom
            </p>
          </motion.div>

          {/* Compose bar */}
          <ComposeBar
            initials={initials}
            profileImageUrl={profileImageUrl}
            onPost={() => {
              window.location.reload();
            }}
          />

          {/* Posts */}
          <AnimatePresence mode="wait">
            {displayedPosts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-center py-16 text-gray-400 font-body text-sm"
              >
                {selectedTeacherId
                  ? `No posts from ${teachers.find((t) => t.id === selectedTeacherId)?.full_name ?? "this teacher"} yet.`
                  : "No posts yet. Share your first update above!"}
              </motion.div>
            ) : (
              <motion.div
                key="posts"
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
                        post={post}
                        currentUserId={currentUser?.id}
                        onReactionToggle={handleReactionToggle}
                        onDelete={handleDeletePost}
                        onClick={() => setSelectedPost(post)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          />
        )}
      </DetailSidebar>
    </div>
  );
}
