"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronLeft, Eye, Loader2, Paperclip, Users } from "lucide-react";
import { Poppins } from "next/font/google";
import { cssColors as colors, radius, cssShadows as shadows } from "@/app/admin/design-system";
import {
  getConversationMessages,
  type ModerationConversation,
  type ModerationMessage,
  type ModerationParticipant,
} from "./actions";

const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"] });

// ── helpers ──────────────────────────────────────────────────────────────────

function colorForId(id: string): string {
  const palette = ["#4a7c59", "#7c6b4a", "#5a6b8a", "#8a5a6b", "#6b7c4a", "#4a6b7c"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function roleLabel(role: string | null): string {
  if (!role) return "";
  if (role === "super_admin") return "Admin";
  if (role === "teacher") return "Teacher";
  if (role === "parent") return "Parent";
  return role;
}

// ── sub-components ────────────────────────────────────────────────────────────

function Avatar({
  participant,
  size = "md",
}: {
  participant: ModerationParticipant;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? 28 : size === "lg" ? 40 : 34;
  const fontSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  if (participant.profile_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={participant.profile_image_url}
        alt={participant.full_name}
        style={{ width: dim, height: dim, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        backgroundColor: colorForId(participant.id),
        color: "#fff",
        fontSize,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initialsFor(participant.full_name)}
    </div>
  );
}

function AvatarPair({ p0, p1 }: { p0: ModerationParticipant; p1: ModerationParticipant }) {
  return (
    <div style={{ position: "relative", width: 44, height: 34, flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <Avatar participant={p0} size="sm" />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          outline: `2px solid ${colors.surface}`,
          borderRadius: "50%",
        }}
      >
        <Avatar participant={p1} size="sm" />
      </div>
    </div>
  );
}

function AvatarStack({ participants }: { participants: ModerationParticipant[] }) {
  const shown = participants.slice(0, 3);
  const extra = participants.length - shown.length;

  return (
    <div style={{ position: "relative", width: 44, height: 34, flexShrink: 0 }}>
      {shown.map((p, i) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: i === 1 ? 6 : 0,
            left: i * 10,
            outline: `2px solid ${colors.surface}`,
            borderRadius: "50%",
            zIndex: shown.length - i,
          }}
        >
          <Avatar participant={p} size="sm" />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            fontSize: 9,
            fontWeight: 600,
            color: colors.textSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

function bubbleStyleForSender(senderId: string) {
  const palette = [
    { bg: colors.accentLight, border: "1px solid rgba(94,124,104,0.3)" },
    { bg: colors.elevated, border: `1px solid ${colors.border}` },
    { bg: "#eef2f7", border: "1px solid #d8dee8" },
    { bg: "#f5f0ea", border: "1px solid #e5ddd2" },
  ];
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ── main component ────────────────────────────────────────────────────────────

export function ModerationClient({
  initialConversations,
}: {
  initialConversations: ModerationConversation[];
}) {
  const [conversations] = useState<ModerationConversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ModerationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (c.displayName.toLowerCase().includes(q)) return true;
    return c.participants.some((p) => p.full_name.toLowerCase().includes(q));
  });

  async function openConversation(id: string) {
    setActiveId(id);
    setMobileShowThread(true);
    setLoadingMessages(true);
    const msgs = await getConversationMessages(id);
    setMessages(msgs);
    setLoadingMessages(false);
  }

  useEffect(() => {
    if (messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── left panel ──────────────────────────────────────────────────────────────
  const LeftPanel = (
    <div
      className={`${mobileShowThread ? "hidden md:flex" : "flex"} flex-col`}
      style={{
        width: "100%",
        maxWidth: 340,
        minWidth: 0,
        borderRight: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        height: "100%",
        flexShrink: 0,
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-base font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Message Monitor
          </span>
          <span
            className="flex items-center justify-center text-xs font-semibold rounded-full"
            style={{
              backgroundColor: colors.elevated,
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              minWidth: 22,
              height: 22,
              padding: "0 6px",
            }}
          >
            {conversations.length}
          </span>
        </div>

        {/* search */}
        <div
          className="flex items-center gap-2"
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: "6px 10px",
          }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: colors.textPrimary }}
          />
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div
            className="flex items-center justify-center text-xs"
            style={{ padding: "32px 16px", color: colors.textTertiary }}
          >
            No conversations found
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.id === activeId;
            const preview = c.lastMessage?.body || (c.lastMessage ? "📎 Attachment" : "No messages yet");

            return (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className="w-full text-left transition-colors duration-100"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  backgroundColor: isActive ? colors.elevated : "transparent",
                  cursor: "pointer",
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom: `1px solid ${colors.border}`,
                  borderLeftColor: isActive ? colors.accent : "transparent",
                  borderLeftWidth: 2,
                  borderLeftStyle: "solid",
                }}
              >
                {c.isGroup ? (
                  <AvatarStack participants={c.participants} />
                ) : (
                  <AvatarPair p0={c.participants[0]} p1={c.participants[1]} />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className="text-xs font-semibold truncate"
                      style={{ color: isActive ? colors.textPrimary : colors.textSecondary }}
                    >
                      {c.displayName}
                    </span>
                    {c.lastMessage && (
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: colors.textTertiary, fontSize: 10 }}
                      >
                        {formatTime(c.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs truncate"
                      style={{ color: colors.textTertiary }}
                    >
                      {c.isGroup
                        ? `Household · ${c.participants.length} members · ${preview}`
                        : preview}
                    </span>
                    {c.messageCount > 0 && (
                      <span
                        className="flex items-center justify-center text-xs font-semibold rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: colors.elevated,
                          color: colors.textSecondary,
                          border: `1px solid ${colors.border}`,
                          minWidth: 18,
                          height: 18,
                          padding: "0 4px",
                          fontSize: 10,
                        }}
                      >
                        {c.messageCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── right panel ─────────────────────────────────────────────────────────────
  const RightPanel = (
    <div
      className={`${!mobileShowThread ? "hidden md:flex" : "flex"} flex-col flex-1 min-w-0`}
      style={{ backgroundColor: colors.bg, height: "100%" }}
    >
      {!active ? (
        <div
          className="flex flex-col items-center justify-center flex-1 gap-3"
          style={{ color: colors.textTertiary }}
        >
          <Eye className="w-8 h-8 opacity-30" />
          <p className="text-sm">Select a conversation to view messages</p>
        </div>
      ) : (
        <>
          {/* thread header */}
          <div
            className="flex items-center gap-3"
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              flexShrink: 0,
            }}
          >
            {/* mobile back button */}
            <button
              className="md:hidden"
              onClick={() => setMobileShowThread(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textSecondary,
                padding: 4,
                marginRight: 4,
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {active.isGroup ? (
                <>
                  <AvatarStack participants={active.participants} />
                  <Users className="w-4 h-4" style={{ color: colors.textTertiary }} />
                </>
              ) : (
                <>
                  <Avatar participant={active.participants[0]} size="md" />
                  <Avatar participant={active.participants[1]} size="md" />
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                {active.displayName}
              </div>
              <div className="text-xs truncate" style={{ color: colors.textTertiary }}>
                {active.isGroup
                  ? `Household · ${active.participants.length} members · ${active.participants.map((p) => p.full_name).join(", ")}`
                  : `${roleLabel(active.participants[0].role)} · ${roleLabel(active.participants[1].role)}`}
                {" · "}
                {active.messageCount} {active.messageCount === 1 ? "message" : "messages"}
              </div>
            </div>

            {/* read-only badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 flex-shrink-0"
              style={{
                backgroundColor: colors.warningBg,
                border: `1px solid ${colors.warningBorder}`,
                borderRadius: radius.md,
                padding: "4px 10px",
                fontSize: 11,
                color: colors.warning,
              }}
            >
              <Eye className="w-3 h-3" />
              Read-only
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "16px" }}>
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textTertiary }} />
              </div>
            ) : messages.length === 0 ? (
              <div
                className="flex items-center justify-center h-full text-sm"
                style={{ color: colors.textTertiary }}
              >
                No messages in this conversation
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => {
                  const senderParticipant = active.participants.find(
                    (p) => p.id === msg.sender_id,
                  );
                  const senderForAvatar: ModerationParticipant = senderParticipant ?? {
                    id: msg.sender_id,
                    full_name: msg.sender_name,
                    role: null,
                    profile_image_url: msg.sender_image_url,
                  };
                  const bubble = bubbleStyleForSender(msg.sender_id);

                  const prevMsg = messages[i - 1];
                  const showSenderLabel =
                    !prevMsg || prevMsg.sender_id !== msg.sender_id;

                  return (
                    <div key={msg.id}>
                      {showSenderLabel && (
                        <div
                          className="flex items-center gap-2 mb-1"
                        >
                          <Avatar participant={senderForAvatar} size="sm" />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: colors.textSecondary }}
                          >
                            {msg.sender_name}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: colors.textTertiary, fontSize: 10 }}
                          >
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <div style={{ paddingLeft: 36 }}>
                        {/* image attachment */}
                        {msg.image_url && (
                          <div className="mb-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.image_url}
                              alt="attachment"
                              className="rounded-lg cursor-pointer"
                              style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain" }}
                              onClick={() => window.open(msg.image_url!, "_blank")}
                            />
                          </div>
                        )}

                        {/* file attachment */}
                        {msg.file_url && (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mb-1"
                            style={{
                              backgroundColor: colors.elevated,
                              border: `1px solid ${colors.border}`,
                              borderRadius: radius.md,
                              padding: "5px 10px",
                              fontSize: 12,
                              color: colors.textSecondary,
                              textDecoration: "none",
                            }}
                          >
                            <Paperclip className="w-3 h-3" />
                            {msg.file_name ?? "attachment"}
                          </a>
                        )}

                        {/* text body */}
                        {msg.body && (
                          <div
                            className="inline-block text-sm"
                            style={{
                              backgroundColor: bubble.bg,
                              border: bubble.border,
                              borderRadius: radius.lg,
                              padding: "7px 12px",
                              color: colors.textPrimary,
                              maxWidth: "80%",
                              wordBreak: "break-word",
                              lineHeight: 1.5,
                            }}
                          >
                            {msg.body}
                          </div>
                        )}

                        {/* timestamp for non-label messages */}
                        {!showSenderLabel && (
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: colors.textTertiary, fontSize: 10 }}
                          >
                            {formatTime(msg.created_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      className={poppins.className}
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: colors.bg,
      }}
    >
      {LeftPanel}
      {RightPanel}
    </div>
  );
}
