"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, ChevronLeft, Loader2 } from "lucide-react";
import { Merriweather } from "next/font/google";
import { createClient } from "@/app/lib/supabase-browser";
import { colors, shadows } from "@/app/admin/design-system";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  type ConversationWithMeta,
  type MessageRow,
} from "@/app/parent/messages/actions";

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
});

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

export default function AdminMessagesPage({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    getConversations(userId).then((data) => {
      setConversations(data);
      setLoadingConvos(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    getMessages(activeId).then((data) => {
      setMessages(data);
      setLoadingMessages(false);
      markMessagesRead(activeId, userId);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, [activeId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "messaging",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? {
                    ...c,
                    lastMessage: {
                      body: newMsg.body,
                      created_at: newMsg.created_at,
                      sender_id: newMsg.sender_id,
                    },
                    updated_at: newMsg.created_at,
                  }
                : c
            )
          );
          if (newMsg.sender_id !== userId) {
            markMessagesRead(activeId, userId);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, userId]);

  const handleSend = useCallback(async () => {
    if (!draft.trim() || !activeId || sending) return;
    const body = draft.trim();
    setDraft("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: tempId,
      conversation_id: activeId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const saved = await sendMessage(activeId, body);
    if (saved) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: { body: saved.body, created_at: saved.created_at, sender_id: saved.sender_id },
                updated_at: saved.created_at,
              }
            : c
        )
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  }, [draft, activeId, sending, userId]);

  const filtered = conversations.filter((c) =>
    c.otherUser.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="-mx-3 sm:-mx-4 lg:-mx-6 flex flex-col"
      style={{ height: "calc(100vh - 0px)" }}
    >
      {/* Page header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-3 shrink-0"
        style={{ borderColor: colors.border, backgroundColor: colors.softCloud }}
      >
        <h1
          className={`text-xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Messages
        </h1>
        {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
          <span
            className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
            style={{ backgroundColor: colors.successText }}
          >
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </span>
        )}
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Conversation list */}
        <div
          className={`w-full md:w-80 md:min-w-[300px] flex flex-col border-r ${mobileShowChat ? "hidden md:flex" : "flex"}`}
          style={{ borderColor: colors.border }}
        >
          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: colors.textTertiary }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: colors.warmLinen,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textTertiary }} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>
                {search ? "No conversations found" : "No messages yet"}
              </p>
            ) : (
              filtered.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => { setActiveId(convo.id); setMobileShowChat(true); }}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer"
                  style={{
                    backgroundColor: convo.id === activeId ? colors.pastelSage + "40" : "transparent",
                    borderRight: convo.id === activeId ? `2px solid ${colors.mistyForest}` : "2px solid transparent",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ backgroundColor: colorForId(convo.otherUser.id) }}
                  >
                    {initialsFor(convo.otherUser.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                        {convo.otherUser.full_name}
                      </span>
                      {convo.lastMessage && (
                        <span className="text-[11px] shrink-0 ml-2" style={{ color: colors.textTertiary }}>
                          {formatTime(convo.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs truncate flex-1" style={{ color: colors.textSecondary }}>
                        {convo.lastMessage?.body ?? "No messages yet"}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span
                          className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: colors.successText }}
                        >
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                Select a conversation to view messages
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 border-b shrink-0"
                style={{ borderColor: colors.border }}
              >
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden cursor-pointer"
                  style={{ color: colors.textSecondary }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: colorForId(active.otherUser.id) }}
                >
                  {initialsFor(active.otherUser.full_name)}
                </div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {active.otherUser.full_name}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textTertiary }} />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>
                    No messages yet
                  </p>
                ) : (
                  messages.map((msg) => {
                    const fromMe = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                          style={{
                            backgroundColor: fromMe ? colors.mistyForest : colors.warmLinen,
                            color: fromMe ? "white" : colors.textPrimary,
                            borderBottomRightRadius: fromMe ? "4px" : undefined,
                            borderBottomLeftRadius: fromMe ? undefined : "4px",
                          }}
                        >
                          <p>{msg.body}</p>
                          <p
                            className="text-[10px] mt-1"
                            style={{ color: fromMe ? "rgba(255,255,255,0.6)" : colors.textTertiary }}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a reply..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.warmLinen,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    style={{ backgroundColor: colors.mistyForest, color: "white" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
