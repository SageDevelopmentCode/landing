"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, ChevronLeft, Loader2, ImageIcon, X, GraduationCap, Hash, Plus, Users } from "lucide-react";
import { Poppins } from 'next/font/google'
import { createClient } from "@/app/lib/supabase-browser";
import { cssColors as colors } from "@/app/admin/design-system";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  uploadMessageImage,
  type ConversationWithMeta,
  type MessageRow,
} from "@/app/parent/messages/actions";
import { getStudentsByParentId, getStudentById, type ChildInfo } from "./actions";
import {
  conversationTitle,
  conversationSubtitle,
  isGroupConversation,
} from "@/app/messages/conversation-display";
import {
  getChannels,
  ensureDefaultChannelMembership,
  createChannel,
  type ChannelWithMeta,
} from "@/app/messages/channel-actions";
import ChannelChatArea from "@/app/messages/components/ChannelChatArea";

const merriweather = Poppins({
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

function UserAvatar({ id, name, imageUrl, size = "md" }: { id: string; name: string; imageUrl: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-9 h-9" : "w-10 h-10";
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0`}
      style={{ backgroundColor: colorForId(id) }}
    >
      {initialsFor(name)}
    </div>
  );
}

function formatProgram(program: string | null): string {
  if (!program) return "—";
  const map: Record<string, string> = {
    summer_26: "Summer 2026",
    school_year_26_27: "School Year 26–27",
    both: "Summer + School Year",
    homeschool_drop_in: "Homeschool Drop-In",
    aftercare: "Aftercare",
    field_friday: "Field Friday",
  };
  return map[program] ?? program;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [childInfoData, setChildInfoData] = useState<ChildInfo[]>([]);
  const [loadingChildInfo, setLoadingChildInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Community channels
  const [activeTab, setActiveTab] = useState<"direct" | "community">("direct");
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  useEffect(() => {
    getConversations(userId).then((data) => {
      setConversations(data);
      setLoadingConvos(false);
    });
  }, [userId]);

  useEffect(() => {
    ensureDefaultChannelMembership(userId).then(() => {
      getChannels(userId).then((data) => {
        setChannels(data);
        setLoadingChannels(false);
      });
    });
  }, [userId]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || creatingChannel) return;
    setCreatingChannel(true);
    const id = await createChannel(newChannelName, newChannelDesc || null, userId);
    if (id) {
      const updated = await getChannels(userId);
      setChannels(updated);
      setActiveChannelId(id);
      setActiveId(null);
      setMobileShowChat(true);
    }
    setNewChannelName("");
    setNewChannelDesc("");
    setShowCreateChannel(false);
    setCreatingChannel(false);
  };

  useEffect(() => {
    setShowChildInfo(false);
    setChildInfoData([]);
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

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");
    if (isHeic) {
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        const jpegName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
        file = new File([blob], jpegName, { type: "image/jpeg" });
      } catch (err) {
        console.error("[handleImageSelect] HEIC conversion failed:", err);
        setSendError("Failed to convert HEIC image. Please try a JPEG or PNG.");
        return;
      }
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleSend = useCallback(async () => {
    if ((!draft.trim() && !imageFile) || !activeId || sending) return;
    const body = draft.trim();
    setDraft("");
    setSendError(null);
    setSending(true);

    let imageUrl: string | undefined;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("conversationId", activeId);
      const result = await uploadMessageImage(fd);
      if ("url" in result) {
        imageUrl = result.url;
      } else {
        console.error("[handleSend] image upload failed:", result.error);
        setSendError(`Image upload failed: ${result.error}`);
        setSending(false);
        return;
      }
      setImageFile(null);
      setImagePreview(null);
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: tempId,
      conversation_id: activeId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
      image_url: imageUrl ?? null,
      file_url: null,
      file_name: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const saved = await sendMessage(activeId, body, imageUrl);
    if (saved) {
      setMessages((prev) => {
        const deduped = prev.filter((m) => m.id !== saved.id);
        return deduped.map((m) => (m.id === tempId ? saved : m));
      });
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
      console.error("[handleSend] sendMessage returned null");
      setSendError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  }, [draft, imageFile, activeId, sending, userId]);

  const handleViewChild = async () => {
    if (!active) return;
    if (childInfoData.length > 0) { setShowChildInfo(true); return; }
    setLoadingChildInfo(true);
    setShowChildInfo(true);
    if (isGroupConversation(active) && active.studentId) {
      const student = await getStudentById(active.studentId);
      setChildInfoData(student ? [student] : []);
    } else if (active.otherUser?.id) {
      const data = await getStudentsByParentId(active.otherUser.id);
      setChildInfoData(data);
    } else {
      setChildInfoData([]);
    }
    setLoadingChildInfo(false);
  };

  const filtered = conversations.filter((c) =>
    conversationTitle(c).toLowerCase().includes(search.toLowerCase()),
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
          className={`w-full md:w-80 md:min-w-[300px] flex flex-col min-h-0 border-r overflow-hidden ${mobileShowChat ? "hidden md:flex" : "flex"}`}
          style={{ borderColor: colors.border }}
        >
          {/* Tabs */}
          <div className="flex border-b shrink-0" style={{ borderColor: colors.border }}>
            <button
              onClick={() => setActiveTab("direct")}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors relative"
              style={{ color: activeTab === "direct" ? colors.mistyForest : colors.textTertiary }}
            >
              Direct Messages
              {activeTab === "direct" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colors.mistyForest }} />
              )}
              {activeTab !== "direct" && conversations.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold" style={{ backgroundColor: colors.successText }}>
                  {conversations.reduce((s, c) => s + c.unreadCount, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors relative"
              style={{ color: activeTab === "community" ? colors.mistyForest : colors.textTertiary }}
            >
              Community
              {activeTab === "community" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colors.mistyForest }} />
              )}
              {activeTab !== "community" && channels.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold" style={{ backgroundColor: colors.successText }}>
                  {channels.reduce((s, c) => s + c.unreadCount, 0)}
                </span>
              )}
            </button>
          </div>

          {activeTab === "direct" ? (
            <>
              {/* Search */}
              <div className="p-3 border-b shrink-0" style={{ borderColor: colors.border }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textTertiary }} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400"
                    style={{ backgroundColor: colors.warmLinen, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                </div>
              </div>

              {/* DM List */}
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
                      onClick={() => { setActiveId(convo.id); setActiveChannelId(null); setMobileShowChat(true); }}
                      className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer"
                      style={{
                        backgroundColor: convo.id === activeId ? colors.pastelSage + "40" : "transparent",
                        borderRight: convo.id === activeId ? `2px solid ${colors.mistyForest}` : "2px solid transparent",
                      }}
                    >
                      {isGroupConversation(convo) ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.mistyForest}1A`, color: colors.mistyForest }}>
                          <Users className="w-4 h-4" />
                        </div>
                      ) : convo.otherUser ? (
                        <UserAvatar id={convo.otherUser.id} name={convo.otherUser.full_name} imageUrl={convo.otherUser.profile_image_url} />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.mistyForest}1A`, color: colors.mistyForest }}>
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                            {conversationTitle(convo)}
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
                            <span className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colors.successText }}>
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Community tab */
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-3 border-b shrink-0" style={{ borderColor: colors.border }}>
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg border transition-colors cursor-pointer"
                  style={{ color: colors.mistyForest, borderColor: colors.mistyForest + "50", backgroundColor: "transparent" }}
                >
                  <Plus className="w-4 h-4" />
                  New Channel
                </button>
              </div>

              {showCreateChannel && (
                <div className="p-3 border-b shrink-0" style={{ borderColor: colors.border, backgroundColor: colors.warmLinen }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Channel name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel(); if (e.key === "Escape") setShowCreateChannel(false); }}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400 mb-2"
                    style={{ backgroundColor: "white", border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel(); }}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400 mb-2"
                    style={{ backgroundColor: "white", border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateChannel}
                      disabled={!newChannelName.trim() || creatingChannel}
                      className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: colors.mistyForest }}
                    >
                      {creatingChannel ? "Creating..." : "Create"}
                    </button>
                    <button
                      onClick={() => { setShowCreateChannel(false); setNewChannelName(""); setNewChannelDesc(""); }}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer"
                      style={{ color: colors.textSecondary, borderColor: colors.border }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {loadingChannels ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textTertiary }} />
                  </div>
                ) : channels.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>No channels yet</p>
                ) : (
                  channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => { setActiveChannelId(ch.id); setActiveId(null); setMobileShowChat(true); }}
                      className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer"
                      style={{
                        backgroundColor: ch.id === activeChannelId ? colors.pastelSage + "40" : "transparent",
                        borderRight: ch.id === activeChannelId ? `2px solid ${colors.mistyForest}` : "2px solid transparent",
                      }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: colors.mistyForest }}>
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{ch.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ch.lastMessage && (
                              <span className="text-[11px]" style={{ color: colors.textTertiary }}>{formatTime(ch.lastMessage.created_at)}</span>
                            )}
                            {!ch.isMember && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border" style={{ color: colors.mistyForest, borderColor: colors.mistyForest + "50" }}>
                                Join
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px]" style={{ color: colors.textTertiary }}>{ch.memberCount} member{ch.memberCount !== 1 ? "s" : ""}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs truncate flex-1" style={{ color: colors.textSecondary }}>
                            {ch.lastMessage?.body ?? "No messages yet"}
                          </p>
                          {ch.isMember && ch.unreadCount > 0 && (
                            <span className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colors.successText }}>
                              {ch.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 min-h-0 flex flex-col overflow-hidden relative ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
          {activeChannel ? (
            <ChannelChatArea
              channel={activeChannel}
              userId={userId}
              userRole="super_admin"
              onBack={() => { setActiveChannelId(null); setMobileShowChat(false); }}
              onMembershipChange={(channelId, isMember) => {
                setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, isMember } : c));
              }}
              onMessageSent={(channelId, lastMsg) => {
                setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, lastMessage: lastMsg, unreadCount: 0 } : c));
              }}
              onMemberRemoved={(channelId) => {
                setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c));
              }}
              adminStyle
            />
          ) : !active ? (
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
                {isGroupConversation(active) ? (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.mistyForest}1A`, color: colors.mistyForest }}>
                    <Users className="w-4 h-4" />
                  </div>
                ) : active.otherUser ? (
                  <UserAvatar id={active.otherUser.id} name={active.otherUser.full_name} imageUrl={active.otherUser.profile_image_url} size="sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.mistyForest}1A`, color: colors.mistyForest }}>
                    <Users className="w-4 h-4" />
                  </div>
                )}
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {conversationTitle(active)}
                </p>
                {(isGroupConversation(active) && active.studentId) || active.otherUser?.role === "parent" ? (
                  <button
                    onClick={handleViewChild}
                    className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{ backgroundColor: colors.pastelSage + "40", color: colors.mistyForest }}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    View Child
                  </button>
                ) : null}
              </div>

              {/* Child info panel */}
              {showChildInfo && (
                <div
                  className="absolute inset-y-0 right-0 w-72 bg-white border-l shadow-lg z-20 flex flex-col"
                  style={{ borderColor: colors.border }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                    style={{ borderColor: colors.border }}
                  >
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Child Info</p>
                    <button
                      onClick={() => setShowChildInfo(false)}
                      className="cursor-pointer"
                      style={{ color: colors.textTertiary }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loadingChildInfo ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textTertiary }} />
                      </div>
                    ) : childInfoData.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>No students found</p>
                    ) : (
                      childInfoData.map((child) => (
                        <div key={child.id} className="p-4 flex gap-3 items-start border-b" style={{ borderColor: colors.border }}>
                          <div className="shrink-0">
                            {child.profile_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={child.profile_image_url}
                                alt={child.child_legal_name ?? ""}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                style={{ backgroundColor: colorForId(child.id) }}
                              >
                                {initialsFor(child.child_legal_name ?? "?")}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                              {child.child_legal_name ?? "—"}
                            </p>
                            {child.child_grade && (
                              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                                Grade: {child.child_grade}
                              </p>
                            )}
                            {child.program && (
                              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                                {formatProgram(child.program)}
                                {child.program === "homeschool_drop_in" && child.drop_in_program && (
                                  <span style={{ color: colors.textTertiary }}> · {formatProgram(child.drop_in_program)}</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

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
                          {msg.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.image_url}
                              alt="attachment"
                              className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1"
                              onClick={() => window.open(msg.image_url!, "_blank")}
                            />
                          )}
                          {msg.body && <p>{msg.body}</p>}
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
              <div className="border-t shrink-0" style={{ borderColor: colors.border }}>
                {sendError && (
                  <p className="px-4 pt-2 text-xs text-red-500">{sendError}</p>
                )}
                {imagePreview && (
                  <div className="px-4 pt-2 flex items-center gap-2">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-lg border" style={{ borderColor: colors.border }} />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" style={{ color: colors.textSecondary }} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    style={{ color: colors.textTertiary }}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
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
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 placeholder:text-gray-400"
                    style={{
                      backgroundColor: colors.warmLinen,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!draft.trim() && !imageFile) || sending}
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
