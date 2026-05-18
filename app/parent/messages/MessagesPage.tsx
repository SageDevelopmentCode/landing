"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, ChevronLeft, SquarePen, X, Loader2, ImageIcon, Paperclip, FileText, Download, Hash } from "lucide-react";
import { createClient } from "@/app/lib/supabase-browser";
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  searchUsers,
  markMessagesRead,
  uploadMessageImage,
  uploadMessageFile,
  getTeachersAndAdmins,
  type TeacherOrAdmin,
  type ConversationWithMeta,
  type MessageRow,
} from "./actions";
import {
  getChannels,
  ensureDefaultChannelMembership,
  type ChannelWithMeta,
} from "@/app/messages/channel-actions";
import ChannelChatArea from "@/app/messages/components/ChannelChatArea";

// Renders images, converting HEIC/HEIF URLs on-the-fly for browsers that can't display them natively
function HeicImage({ src, className, onClick }: { src: string; className?: string; onClick?: () => void }) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const isHeic = /\.(heic|heif)(\?|$)/i.test(src);

  useEffect(() => {
    if (!isHeic) {
      setDisplaySrc(src);
      return;
    }
    let objectUrl: string | null = null;
    (async () => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.85 });
        const out = Array.isArray(converted) ? converted[0] : converted;
        objectUrl = URL.createObjectURL(out);
        setDisplaySrc(objectUrl);
      } catch {
        setError(true);
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src, isHeic]);

  if (error) return <span className="text-xs text-gray-400">Image could not be displayed</span>;
  if (!displaySrc) return <div className="h-20 w-20 rounded-xl bg-gray-100 animate-pulse" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={displaySrc} alt="attachment" className={className} onClick={onClick} />;
}

// Deterministic color from a string (user id)
const AVATAR_COLORS = [
  "bg-[#4a7c59]",
  "bg-[#7c6b4a]",
  "bg-[#5a6b8a]",
  "bg-[#8a5a6b]",
  "bg-[#6b7c4a]",
  "bg-[#4a6b7c]",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function roleLabel(role: string | null): string {
  if (role === "teacher" || role === "super_admin") return "Teacher";
  if (role === "parent") return "Parent";
  return "";
}

function staffCardRoleLabel(role: string): string {
  return "Teacher";
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
    <div className={`${colorForId(id)} ${dim} rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0`}>
      {initialsFor(name)}
    </div>
  );
}

function sortByRecent(convos: ConversationWithMeta[]): ConversationWithMeta[] {
  return [...convos].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage({
  userId,
  initialRecipientId,
  initialRecipientName,
  initialTab,
}: {
  userId: string;
  initialRecipientId?: string | null;
  initialRecipientName?: string | null;
  initialTab?: "direct" | "community";
}) {
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Community channels
  const [activeTab, setActiveTab] = useState<"direct" | "community">(initialTab ?? "direct");
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Compose new message
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; full_name: string; profile_image_url: string | null } | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientResults, setRecipientResults] = useState<{ id: string; full_name: string; profile_image_url: string | null }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [creatingConvo, setCreatingConvo] = useState(false);
  const [suggestedStaff, setSuggestedStaff] = useState<TeacherOrAdmin[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  // Load conversations on mount
  useEffect(() => {
    getConversations(userId).then((data) => {
      setConversations(data);
      setLoadingConvos(false);
    });
  }, [userId]);

  // Load channels on mount (auto-join defaults first)
  useEffect(() => {
    ensureDefaultChannelMembership(userId).then(() => {
      getChannels(userId).then((data) => {
        setChannels(data);
        setLoadingChannels(false);
      });
    });
  }, [userId]);

  // Fetch teachers/admins once for the empty state suggestions
  useEffect(() => {
    getTeachersAndAdmins().then(setSuggestedStaff);
  }, []);

  // Handle deep-link to a specific recipient (e.g. from teacher card)
  useEffect(() => {
    if (!initialRecipientId || loadingConvos) return;
    const existing = conversations.find((c) => c.otherUser.id === initialRecipientId);
    if (existing) {
      setActiveId(existing.id);
      setMobileShowChat(true);
    } else if (initialRecipientName) {
      setIsComposingNew(true);
      setSelectedRecipient({ id: initialRecipientId, full_name: initialRecipientName, profile_image_url: null });
      setMobileShowChat(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConvos]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    getMessages(activeId).then((data) => {
      setMessages(data);
      setLoadingMessages(false);
      markMessagesRead(activeId, userId);
      // Clear unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, [activeId, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!activeId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${activeId}`)
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
            // Avoid duplicate if we already optimistically added it
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Update last message in sidebar
          setConversations((prev) =>
            sortByRecent(
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
            )
          );
          // Mark read immediately if it's from the other person
          if (newMsg.sender_id !== userId) {
            markMessagesRead(activeId, userId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, userId]);

  // Debounced user search
  const handleRecipientSearch = useCallback((query: string) => {
    setRecipientSearch(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query.trim()) {
      setRecipientResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      const results = await searchUsers(query);
      setRecipientResults(results);
      setSearchingUsers(false);
    }, 300);
  }, []);

  const handleSelectRecipient = (recipient: { id: string; full_name: string; profile_image_url: string | null }) => {
    setSelectedRecipient(recipient);
    setRecipientSearch("");
    setRecipientResults([]);
  };

  const handleRemoveRecipient = () => {
    setSelectedRecipient(null);
    setRecipientSearch("");
    setRecipientResults([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAttachedFile(file);
  };

  const handleSendNew = async () => {
    if (!selectedRecipient || (!draft.trim() && !imageFile && !attachedFile) || sending) return;
    const body = draft.trim();
    setDraft("");
    setSendError(null);
    setCreatingConvo(true);

    const convoId = await createConversation(userId, selectedRecipient.id);
    if (!convoId) {
      setSendError("Could not create conversation. Please try again.");
      setCreatingConvo(false);
      return;
    }

    setSending(true);
    setCreatingConvo(false);

    let imageUrl: string | undefined;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("conversationId", convoId);
      const result = await uploadMessageImage(fd);
      if ("url" in result) {
        imageUrl = result.url;
      } else {
        setSendError(`Image upload failed: ${result.error}`);
        setSending(false);
        return;
      }
      setImageFile(null);
      setImagePreview(null);
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    if (attachedFile) {
      const fd = new FormData();
      fd.append("file", attachedFile);
      fd.append("conversationId", convoId);
      const result = await uploadMessageFile(fd);
      if ("url" in result) {
        fileUrl = result.url;
        fileName = result.name;
      } else {
        setSendError(`File upload failed: ${result.error}`);
        setSending(false);
        return;
      }
      setAttachedFile(null);
    }

    const saved = await sendMessage(convoId, body, imageUrl, fileUrl, fileName);
    const updated = await getConversations(userId);
    setConversations(updated);
    if (saved) setMessages([saved]);

    setActiveId(convoId);
    setIsComposingNew(false);
    setSelectedRecipient(null);
    setRecipientSearch("");
    setRecipientResults([]);
    setSending(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Convert HEIC/HEIF → JPEG (browsers can't display HEIC natively)
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
  };

  const handleSend = async () => {
    if ((!draft.trim() && !imageFile && !attachedFile) || !activeId || sending) return;
    const body = draft.trim();
    setDraft("");
    setSendError(null);
    setSending(true);

    // Upload image first if selected
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

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    if (attachedFile) {
      const fd = new FormData();
      fd.append("file", attachedFile);
      fd.append("conversationId", activeId);
      const result = await uploadMessageFile(fd);
      if ("url" in result) {
        fileUrl = result.url;
        fileName = result.name;
      } else {
        setSendError(`File upload failed: ${result.error}`);
        setSending(false);
        return;
      }
      setAttachedFile(null);
    }

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: tempId,
      conversation_id: activeId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
      image_url: imageUrl ?? null,
      file_url: fileUrl ?? null,
      file_name: fileName ?? null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const saved = await sendMessage(activeId, body, imageUrl, fileUrl, fileName);

    // Replace optimistic with real row
    if (saved) {
      setMessages((prev) => {
        const deduped = prev.filter((m) => m.id !== saved.id);
        return deduped.map((m) => (m.id === tempId ? saved : m));
      });
      setConversations((prev) =>
        sortByRecent(
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  lastMessage: { body: saved.body, created_at: saved.created_at, sender_id: saved.sender_id },
                  updated_at: saved.created_at,
                }
              : c
          )
        )
      );
    } else {
      console.error("[handleSend] sendMessage returned null");
      setSendError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  };

  const filtered = conversations.filter(
    (c) =>
      c.otherUser.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-0 bg-white overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 md:min-w-[320px] bg-white border-r border-gray-100 flex flex-col min-h-0 overflow-hidden ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab("direct")}
            className={`flex-1 py-2.5 text-xs font-semibold font-body transition-colors relative ${
              activeTab === "direct" ? "text-[#4a7c59]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Messages
            {activeTab === "direct" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a7c59]" />}
            {activeTab !== "direct" && conversations.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4a7c59] text-white text-[9px] font-bold">
                {conversations.reduce((s, c) => s + c.unreadCount, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`flex-1 py-2.5 text-xs font-semibold font-body transition-colors relative ${
              activeTab === "community" ? "text-[#4a7c59]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Community
            <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-[#4a7c59] text-white leading-none">
              New!
            </span>
            {activeTab === "community" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a7c59]" />}
            {activeTab !== "community" && channels.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4a7c59] text-white text-[9px] font-bold">
                {channels.reduce((s, c) => s + c.unreadCount, 0)}
              </span>
            )}
          </button>
        </div>

        {activeTab === "direct" ? (
          <>
            {/* Search + New Message */}
            <div className="p-3 border-b border-gray-100 shrink-0">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-body bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <button
                onClick={() => {
                  setIsComposingNew(true);
                  setActiveId(null);
                  setActiveChannelId(null);
                  setMessages([]);
                  setSelectedRecipient(null);
                  setRecipientSearch("");
                  setRecipientResults([]);
                  setMobileShowChat(true);
                }}
                className={`w-full flex items-center justify-center gap-2 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer ${
                  isComposingNew ? "bg-[#3d6849]" : "bg-[#4a7c59] hover:bg-[#3d6849]"
                }`}
              >
                <SquarePen className="w-4 h-4" />
                New Message
              </button>
            </div>

            {/* DM List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 font-body text-center py-8">
                  {search ? "No conversations found" : "No messages yet. Start one!"}
                </p>
              ) : (
                filtered.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => {
                      setActiveId(convo.id);
                      setActiveChannelId(null);
                      setIsComposingNew(false);
                      setSelectedRecipient(null);
                      setMobileShowChat(true);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                      convo.id === activeId
                        ? "bg-[#4a7c59]/5 border-r-2 border-[#4a7c59]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <UserAvatar id={convo.otherUser.id} name={convo.otherUser.full_name} imageUrl={convo.otherUser.profile_image_url} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold font-body text-gray-800 truncate">
                          {convo.otherUser.full_name}
                        </span>
                        {convo.lastMessage && (
                          <span className="text-[11px] text-gray-400 font-body shrink-0 ml-2">
                            {formatTime(convo.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      {roleLabel(convo.otherUser.role) && (
                        <p className="text-[11px] text-gray-400 font-body">
                          {roleLabel(convo.otherUser.role)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 font-body truncate flex-1">
                          {convo.lastMessage?.body ?? "No messages yet"}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="bg-[#4a7c59] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
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
          <div className="flex-1 overflow-y-auto">
            {loadingChannels ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : channels.length === 0 ? (
              <p className="text-sm text-gray-400 font-body text-center py-8">No channels yet</p>
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannelId(ch.id);
                    setActiveId(null);
                    setIsComposingNew(false);
                    setMobileShowChat(true);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                    ch.id === activeChannelId
                      ? "bg-[#4a7c59]/5 border-r-2 border-[#4a7c59]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#4a7c59] flex items-center justify-center text-white shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold font-body text-gray-800 truncate">{ch.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ch.lastMessage && (
                          <span className="text-[11px] text-gray-400 font-body">{formatTime(ch.lastMessage.created_at)}</span>
                        )}
                        {!ch.isMember && (
                          <span className="text-[10px] font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 px-1.5 py-0.5 rounded-full">
                            Join
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-body">{ch.memberCount} member{ch.memberCount !== 1 ? "s" : ""}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 font-body truncate flex-1">
                        {ch.lastMessage?.body ?? "No messages yet"}
                      </p>
                      {ch.isMember && ch.unreadCount > 0 && (
                        <span className="bg-[#4a7c59] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {ch.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`flex-1 min-h-0 flex flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {activeChannel ? (
          <ChannelChatArea
            channel={activeChannel}
            userId={userId}
            userRole="parent"
            onBack={() => { setActiveChannelId(null); setMobileShowChat(false); }}
            onMembershipChange={(channelId, isMember) => {
              setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, isMember } : c));
            }}
            onMessageSent={(channelId, lastMsg) => {
              setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, lastMessage: lastMsg, unreadCount: 0 } : c));
            }}
          />
        ) : isComposingNew ? (
          <>
            {/* Compose header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0">
              <button
                onClick={() => { setIsComposingNew(false); setMobileShowChat(false); }}
                className="md:hidden text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-sm font-semibold font-body text-gray-800">New Message</p>
            </div>

            {/* To: row */}
            <div className="px-5 py-3 border-b border-gray-100 shrink-0 relative">
              <div className="flex items-center gap-2">
                <span className="text-sm font-body text-gray-500 shrink-0">To:</span>
                {!selectedRecipient ? (
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by name..."
                    value={recipientSearch}
                    onChange={(e) => handleRecipientSearch(e.target.value)}
                    className="flex-1 text-sm font-body bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#4a7c59]/10 text-[#4a7c59] text-sm font-body px-3 py-1 rounded-full">
                    <span>{selectedRecipient.full_name}</span>
                    <button
                      onClick={handleRemoveRecipient}
                      className="text-[#4a7c59] hover:text-[#3d6849] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown results */}
              {!selectedRecipient && recipientSearch.trim() && (
                <div className="absolute left-0 right-0 top-full z-20 bg-white border border-gray-100 shadow-lg max-h-60 overflow-y-auto">
                  {searchingUsers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                    </div>
                  ) : recipientResults.length === 0 ? (
                    <p className="text-sm text-gray-400 font-body text-center py-6">No users found</p>
                  ) : (
                    recipientResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectRecipient(user)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <UserAvatar id={user.id} name={user.full_name} imageUrl={user.profile_image_url} size="sm" />
                        <span className="text-sm font-body text-gray-800">{user.full_name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Empty message area */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!selectedRecipient && (
                <p className="text-sm text-gray-400 font-body text-center py-8">
                  Search for someone to start a conversation
                </p>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 shrink-0">
              {sendError && (
                <p className="px-4 pt-2 text-xs text-red-500">{sendError}</p>
              )}
              {imagePreview && (
                <div className="px-4 pt-2 flex items-center gap-2">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
              {attachedFile && (
                <div className="px-4 pt-2 flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs font-body text-gray-700 truncate">{attachedFile.name}</span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
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
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedRecipient}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Attach image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={!selectedRecipient}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder={selectedRecipient ? "Type a message..." : "Select a recipient first..."}
                  value={draft}
                  disabled={!selectedRecipient}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendNew();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-body bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400 disabled:opacity-60"
                />
                <button
                  onClick={handleSendNew}
                  disabled={!selectedRecipient || (!draft.trim() && !imageFile && !attachedFile) || sending || creatingConvo}
                  className="w-10 h-10 rounded-xl bg-[#4a7c59] hover:bg-[#3d6849] disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {(sending || creatingConvo) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : !active ? (
          conversations.length === 0 && !loadingConvos && !search ? (
            <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center">
              <div className="mb-8 text-center max-w-sm">
                <h2 className="text-xl font-semibold font-body text-gray-800 mb-2">
                  Who would you like to reach?
                </h2>
                <p className="text-sm text-gray-400 font-body leading-relaxed">
                  Message your child&apos;s teachers and school staff directly from here.
                </p>
              </div>

              {suggestedStaff.length > 0 && (
                <div className="w-full max-w-2xl">
                  <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider mb-4">
                    Start a conversation
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {suggestedStaff.map((person) => (
                      <div
                        key={person.id}
                        className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center gap-3 shadow-sm"
                      >
                        <UserAvatar
                          id={person.id}
                          name={person.full_name}
                          imageUrl={person.profile_image_url}
                        />
                        <div className="min-w-0 w-full">
                          <p className="text-sm font-semibold font-body text-gray-800 truncate">
                            {person.full_name}
                          </p>
                          <p className="text-xs text-gray-400 font-body mt-0.5">
                            {staffCardRoleLabel(person.role)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsComposingNew(true);
                            setActiveId(null);
                            setMessages([]);
                            handleSelectRecipient({
                              id: person.id,
                              full_name: person.full_name,
                              profile_image_url: person.profile_image_url,
                            });
                            setMobileShowChat(true);
                          }}
                          className="w-full py-1.5 rounded-xl text-xs font-semibold font-body text-white bg-[#4a7c59] hover:bg-[#3d6849] transition-colors cursor-pointer"
                        >
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400 font-body">Select a conversation or start a new one</p>
            </div>
          )
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0">
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <UserAvatar id={active.otherUser.id} name={active.otherUser.full_name} imageUrl={active.otherUser.profile_image_url} size="sm" />
              <div>
                <p className="text-sm font-semibold font-body text-gray-800">
                  {active.otherUser.full_name}
                </p>
                {roleLabel(active.otherUser.role) && (
                  <p className="text-[11px] text-gray-400 font-body">
                    {roleLabel(active.otherUser.role)}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-400 font-body text-center py-8">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg) => {
                  const fromMe = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                          fromMe
                            ? "bg-[#4a7c59] text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {msg.image_url && (
                          <HeicImage
                            src={msg.image_url}
                            className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1"
                            onClick={() => window.open(msg.image_url!, "_blank")}
                          />
                        )}
                        {msg.file_url && msg.file_name && (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 mb-1 px-3 py-2 rounded-xl border ${fromMe ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-gray-200 bg-white hover:bg-gray-50"} transition-colors`}
                          >
                            <FileText className={`w-4 h-4 shrink-0 ${fromMe ? "text-white/80" : "text-gray-400"}`} />
                            <span className={`text-xs font-body truncate max-w-[160px] ${fromMe ? "text-white" : "text-gray-700"}`}>
                              {msg.file_name}
                            </span>
                            <Download className={`w-3.5 h-3.5 shrink-0 ${fromMe ? "text-white/70" : "text-gray-400"}`} />
                          </a>
                        )}
                        {msg.body && <p>{msg.body}</p>}
                        <p className={`text-[10px] mt-1 ${fromMe ? "text-white/60" : "text-gray-400"}`}>
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
            <div className="border-t border-gray-100 shrink-0">
              {sendError && (
                <p className="px-4 pt-2 text-xs text-red-500">{sendError}</p>
              )}
              {imagePreview && (
                <div className="px-4 pt-2 flex items-center gap-2">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
              {attachedFile && (
                <div className="px-4 pt-2 flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs font-body text-gray-700 truncate">{attachedFile.name}</span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
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
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0"
                  title="Attach image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => attachmentInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-body bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={(!draft.trim() && !imageFile && !attachedFile) || sending}
                  className="w-10 h-10 rounded-xl bg-[#4a7c59] hover:bg-[#3d6849] disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
