"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, ChevronLeft, SquarePen, X, Loader2, ImageIcon } from "lucide-react";
import { createClient } from "@/app/lib/supabase-browser";
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  searchUsers,
  markMessagesRead,
  uploadMessageImage,
  type ConversationWithMeta,
  type MessageRow,
} from "./actions";

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
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage({ userId }: { userId: string }) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New message modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientResults, setRecipientResults] = useState<{ id: string; full_name: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [creatingConvo, setCreatingConvo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Load conversations on mount
  useEffect(() => {
    getConversations(userId).then((data) => {
      setConversations(data);
      setLoadingConvos(false);
    });
  }, [userId]);

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

  const handleSelectRecipient = async (recipient: { id: string; full_name: string }) => {
    setCreatingConvo(true);
    const convoId = await createConversation(userId, recipient.id);
    if (convoId) {
      // Refresh conversations
      const updated = await getConversations(userId);
      setConversations(updated);
      setActiveId(convoId);
      setMobileShowChat(true);
    }
    setShowNewModal(false);
    setRecipientSearch("");
    setRecipientResults([]);
    setCreatingConvo(false);
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
    if ((!draft.trim() && !imageFile) || !activeId || sending) return;
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
    };
    setMessages((prev) => [...prev, optimistic]);

    const saved = await sendMessage(activeId, body, imageUrl);

    // Replace optimistic with real row
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
  };

  const filtered = conversations.filter(
    (c) =>
      c.otherUser.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-0 bg-white overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 md:min-w-[320px] border-r border-gray-100 flex flex-col min-h-0 overflow-hidden ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
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
            onClick={() => setShowNewModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#3d6849] text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
            New Message
          </button>
        </div>

        {/* List */}
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
                  setMobileShowChat(true);
                }}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                  convo.id === activeId
                    ? "bg-[#4a7c59]/5 border-r-2 border-[#4a7c59]"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className={`${colorForId(convo.otherUser.id)} w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0`}>
                  {initialsFor(convo.otherUser.full_name)}
                </div>
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
      </div>

      {/* Chat area */}
      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 font-body">Select a conversation or start a new one</p>
          </div>
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
              <div className={`${colorForId(active.otherUser.id)} w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body`}>
                {initialsFor(active.otherUser.full_name)}
              </div>
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={msg.image_url}
                            alt="attachment"
                            className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer mb-1"
                            onClick={() => window.open(msg.image_url!, "_blank")}
                          />
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0"
                >
                  <ImageIcon className="w-5 h-5" />
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
                  disabled={(!draft.trim() && !imageFile) || sending}
                  className="w-10 h-10 rounded-xl bg-[#4a7c59] hover:bg-[#3d6849] disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Message Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold font-body text-gray-800">New Message</p>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setRecipientSearch("");
                  setRecipientResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name..."
                  value={recipientSearch}
                  onChange={(e) => handleRecipientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-body bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <div className="mt-2 max-h-60 overflow-y-auto">
                {searchingUsers || creatingConvo ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                  </div>
                ) : recipientResults.length === 0 && recipientSearch.trim() ? (
                  <p className="text-sm text-gray-400 font-body text-center py-6">No users found</p>
                ) : recipientResults.length === 0 ? (
                  <p className="text-sm text-gray-400 font-body text-center py-6">
                    Type a name to search
                  </p>
                ) : (
                  recipientResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectRecipient(user)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
                    >
                      <div className={`${colorForId(user.id)} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0`}>
                        {initialsFor(user.full_name)}
                      </div>
                      <span className="text-sm font-body text-gray-800">{user.full_name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
