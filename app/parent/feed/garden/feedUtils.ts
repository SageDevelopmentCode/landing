"use client";

import { useSyncExternalStore } from "react";
import type { FeedCommentRow, FeedPost, FeedReactionSummary } from "@/app/teacher/feed/actions";
import type { ReelPost } from "@/app/teacher/feed/reelActions";
import { DEFAULT_REACTIONS } from "@/app/teacher/feed/constants";
import type { LightboxItem } from "@/app/parent/_garden/Lightbox";

export type FeedMode = "feed" | "reel";
export type FeedKind = "post" | "reel";

export type CommentWithImage = FeedCommentRow & { profile_image_url?: string | null };
export type ThreadedComment = CommentWithImage & { depth: number; pending?: boolean };

export type CurrentUser = { full_name: string; role: string; id: string } | null;

/** Max visual nesting for replies. */
export const MAX_DEPTH = 4;

// ─── Feed / Reels mode (sessionStorage `parentFeedMode`) ─────────────────────
// Read through useSyncExternalStore with a `null` server snapshot, so the server
// render and hydration always agree and the stored mode applies right after.

const MODE_KEY = "parentFeedMode";
const modeListeners = new Set<() => void>();

function subscribeMode(cb: () => void) {
  modeListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    modeListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readStoredMode(): FeedMode | null {
  try {
    const v = window.sessionStorage.getItem(MODE_KEY);
    return v === "feed" || v === "reel" ? v : null;
  } catch {
    return null;
  }
}

export function writeStoredMode(mode: FeedMode) {
  try {
    window.sessionStorage.setItem(MODE_KEY, mode);
  } catch {
    // Private mode / storage disabled: the URL still carries the mode.
  }
  modeListeners.forEach((l) => l());
}

export function useStoredFeedMode(): FeedMode | null {
  return useSyncExternalStore(subscribeMode, readStoredMode, () => null);
}

export function parseMode(v: string | null): FeedMode | null {
  return v === "feed" || v === "reel" ? v : null;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function formatDuration(secs: number | null): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRole(role: string): string {
  if (role === "super_admin") return "Teacher";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatAuthorSubtitle(classroom: string | null, role: string): string {
  if (classroom?.trim()) return `${classroom.trim()} guide`;
  return formatRole(role);
}

export function profileHref(teacherId: string) {
  return `/parent/profile/${teacherId}`;
}

// ─── Reactions ───────────────────────────────────────────────────────────────

/** The 4 default emojis first, then any custom ones people used. */
export function reactionList(reactions: FeedReactionSummary[]): FeedReactionSummary[] {
  const byEmoji = new Map(reactions.map((r) => [r.emoji, r]));
  const custom = reactions.map((r) => r.emoji).filter((e) => !DEFAULT_REACTIONS.includes(e));
  return [...DEFAULT_REACTIONS, ...custom].map((emoji) => byEmoji.get(emoji) ?? { emoji, count: 0, reacted_by_me: false });
}

/**
 * Flips my reaction locally. It is its own inverse, so a failed request rolls back
 * by applying it again.
 */
export function toggleLocalReaction(reactions: FeedReactionSummary[], emoji: string): FeedReactionSummary[] {
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) return [...reactions, { emoji, count: 1, reacted_by_me: true }];
  return reactions
    .map((r) =>
      r.emoji === emoji
        ? { ...r, count: Math.max(0, r.reacted_by_me ? r.count - 1 : r.count + 1), reacted_by_me: !r.reacted_by_me }
        : r,
    )
    .filter((r) => r.count > 0 || DEFAULT_REACTIONS.includes(r.emoji));
}

// ─── Threads ─────────────────────────────────────────────────────────────────

/**
 * Depth-first thread order, nested up to MAX_DEPTH. A reply whose parent is gone
 * (deleted) is shown at the top level instead of disappearing with it.
 */
export function buildThreadedList(comments: (CommentWithImage & { pending?: boolean })[]): ThreadedComment[] {
  const ids = new Set(comments.map((c) => c.id));
  const childMap = new Map<string | null, typeof comments>();
  for (const c of comments) {
    const key = c.parent_comment_id && ids.has(c.parent_comment_id) ? c.parent_comment_id : null;
    const list = childMap.get(key);
    if (list) list.push(c);
    else childMap.set(key, [c]);
  }
  const result: ThreadedComment[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const c of childMap.get(parentId) ?? []) {
      result.push({ ...c, depth: Math.min(depth, MAX_DEPTH) });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

export function insertByDate<T extends { created_at: string }>(list: T[], item: T): T[] {
  return [...list, item].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// ─── Reels ───────────────────────────────────────────────────────────────────

/** Lets a reel open in the same post detail sheet as a feed post. */
export function reelToFeedPost(reel: ReelPost): FeedPost {
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

// ─── Media ───────────────────────────────────────────────────────────────────

export function mediaNoun(media: FeedPost["media"]): string {
  if (media.every((m) => m.kind === "image")) return "photo";
  if (media.every((m) => m.kind === "video")) return "video";
  return "item";
}

export function mediaAlt(kind: "image" | "video", i: number, total: number, teacherName: string): string {
  const noun = kind === "video" ? "Video" : "Photo";
  return total > 1 ? `${noun} ${i + 1} of ${total} from ${teacherName}` : `${noun} from ${teacherName}`;
}

export function toLightboxItems(post: FeedPost): LightboxItem[] {
  return post.media.map((m, i) => ({
    key: m.id,
    url: m.storage_url,
    alt: mediaAlt(m.kind, i, post.media.length, post.teacher_name),
    kind: m.kind,
  }));
}
