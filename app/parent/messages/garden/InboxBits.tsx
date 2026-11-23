"use client";

import type { ChannelWithMeta } from "@/app/messages/channel-actions";
import { conversationSubtitle, conversationTitle, isGroupConversation } from "@/app/messages/conversation-display";
import { KidAvatar } from "@/app/parent/_garden/ui";
import { Skeleton } from "@/app/parent/_garden/states";
import { formatRelative } from "@/app/parent/_garden/time";
import type { ConversationWithMeta } from "../actions";
import { ATTACHMENT_PREVIEW } from "./chat";

/** Rows in the inbox (after mobile InboxBits): tinted when unread, coral time, count bubble. */
const rowBase =
  "group flex w-full min-h-[74px] items-center gap-3 rounded-[22px] px-3 py-3 text-left ring-1 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]";

function rowTone(selected: boolean, unread: boolean): string {
  if (selected) return "bg-[var(--sf-mint)]/70 ring-[var(--sf-sage)]/40";
  if (unread) return "bg-[#fffaf6] ring-[#f3c9c2] hover:-translate-y-0.5 hover:bg-white";
  return "bg-white ring-[var(--sf-ink)]/[0.06] hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/15 focus-visible:-translate-y-0.5";
}

export function CountBadge({ count, label = "unread" }: { count: number; label?: string }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--sf-coral-deep)] px-1.5 text-[11px] font-extrabold leading-5 text-white">
      {count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

export function GroupIcon({ size = "h-[50px] w-[50px]" }: { size?: string }) {
  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[var(--sf-sky)] text-[#2d5d86]`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-[45%] w-[45%]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M16.5 14c2.4.2 4 1.7 4.5 4.5" />
      </svg>
    </span>
  );
}

export function ConversationRow({
  convo,
  selected,
  now,
  onOpen,
}: {
  convo: ConversationWithMeta;
  selected: boolean;
  now: Date | null;
  onOpen: (c: ConversationWithMeta) => void;
}) {
  const unread = convo.unreadCount > 0 && !selected;
  const title = conversationTitle(convo);
  const subtitle = conversationSubtitle(convo);
  const preview = convo.lastMessage ? convo.lastMessage.body || ATTACHMENT_PREVIEW : "No messages yet";
  return (
    <button
      type="button"
      onClick={() => onOpen(convo)}
      aria-current={selected ? "true" : undefined}
      className={`${rowBase} ${rowTone(selected, unread)}`}
    >
      {isGroupConversation(convo) || !convo.otherUser ? (
        <GroupIcon />
      ) : (
        <KidAvatar
          id={convo.otherUser.id}
          name={convo.otherUser.full_name}
          imageUrl={convo.otherUser.profile_image_url}
          size="h-[50px] w-[50px] text-sm"
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[15px] ${unread ? "font-black" : "font-extrabold"}`}>{title}</span>
          {convo.lastMessage && now ? (
            <span
              className={`shrink-0 text-xs ${unread ? "font-extrabold text-[var(--sf-coral-deep)]" : "font-semibold text-[var(--sf-soft)]/80"}`}
            >
              {formatRelative(convo.lastMessage.created_at, now)}
            </span>
          ) : null}
        </span>
        {subtitle ? <span className="text-xs font-semibold text-[var(--sf-soft)]/80">{subtitle}</span> : null}
        <span className="flex items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-bold text-[var(--sf-ink)]" : "text-[var(--sf-soft)]"}`}
          >
            {preview}
          </span>
          {unread ? <CountBadge count={convo.unreadCount} /> : null}
        </span>
      </span>
    </button>
  );
}

export function ChannelRow({
  channel,
  selected,
  now,
  onOpen,
}: {
  channel: ChannelWithMeta;
  selected: boolean;
  now: Date | null;
  onOpen: (c: ChannelWithMeta) => void;
}) {
  const unread = channel.isMember && channel.unreadCount > 0 && !selected;
  const preview = channel.lastMessage ? channel.lastMessage.body || ATTACHMENT_PREVIEW : "No messages yet";
  return (
    <button
      type="button"
      onClick={() => onOpen(channel)}
      aria-current={selected ? "true" : undefined}
      className={`${rowBase} ${rowTone(selected, unread)}`}
    >
      <span
        className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl sf-display text-2xl ${
          channel.is_default ? "bg-[var(--sf-butter)] text-[#7a5b00]" : "bg-[var(--sf-mint)] text-[#2f6b44]"
        }`}
        aria-hidden="true"
      >
        #
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[15px] ${unread ? "font-black" : "font-extrabold"}`}>{channel.name}</span>
          {channel.lastMessage && now ? (
            <span
              className={`shrink-0 text-xs ${unread ? "font-extrabold text-[var(--sf-coral-deep)]" : "font-semibold text-[var(--sf-soft)]/80"}`}
            >
              {formatRelative(channel.lastMessage.created_at, now)}
            </span>
          ) : null}
        </span>
        <span className="text-xs font-semibold text-[var(--sf-soft)]/80">
          {channel.memberCount} member{channel.memberCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-bold text-[var(--sf-ink)]" : "text-[var(--sf-soft)]"}`}
          >
            {preview}
          </span>
          {!channel.isMember ? (
            <span className="shrink-0 rounded-full bg-[var(--sf-coral-deep)] px-3 py-0.5 text-xs font-extrabold text-white">
              Join
              <span className="sr-only"> (not joined yet)</span>
            </span>
          ) : unread ? (
            <CountBadge count={channel.unreadCount} />
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function RowSkeletons({ rows = 5, label = "Loading conversations…" }: { rows?: number; label?: string }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-[74px] items-center gap-3 rounded-[22px] bg-white px-3 py-3 ring-1 ring-[var(--sf-ink)]/[0.05]">
          <Skeleton className="h-[50px] w-[50px] shrink-0 rounded-full" />
          <span className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-[55%] rounded-md" />
            <Skeleton className="h-3 w-[80%] rounded-md" />
          </span>
        </div>
      ))}
    </div>
  );
}
