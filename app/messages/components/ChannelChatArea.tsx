"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronLeft, Loader2, ImageIcon, Paperclip, FileText, Download, X, Hash, LogOut, Pencil, Trash2, Check, MoreVertical } from "lucide-react";
import { createClient } from "@/app/lib/supabase-browser";
import {
  getChannelMessages,
  sendChannelMessage,
  markChannelRead,
  joinChannel,
  leaveChannel,
  uploadChannelImage,
  uploadChannelFile,
  getSenderProfile,
  editChannelMessage,
  deleteChannelMessage,
  type ChannelWithMeta,
  type ChannelMessageRow,
} from "@/app/messages/channel-actions";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const AVATAR_COLORS = [
  "bg-[#4a7c59]", "bg-[#7c6b4a]", "bg-[#5a6b8a]", "bg-[#8a5a6b]", "bg-[#6b7c4a]", "bg-[#4a6b7c]",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialsFor(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function MsgAvatar({ senderId, senderName, senderImageUrl }: { senderId: string; senderName: string; senderImageUrl: string | null }) {
  if (senderImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={senderImageUrl} alt={senderName} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className={`${colorForId(senderId)} w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold font-body shrink-0`}>
      {initialsFor(senderName)}
    </div>
  );
}

interface ChannelChatAreaProps {
  channel: ChannelWithMeta;
  userId: string;
  userRole: string | null;
  onBack: () => void;
  onMembershipChange: (channelId: string, isMember: boolean) => void;
  onMessageSent: (channelId: string, lastMsg: { body: string; created_at: string; sender_id: string }) => void;
  // Design system: pass true for admin styling, false for the green-theme parent/teacher styling
  adminStyle?: boolean;
}

export default function ChannelChatArea({
  channel,
  userId,
  onBack,
  onMembershipChange,
  onMessageSent,
  adminStyle = false,
}: ChannelChatAreaProps) {
  const [messages, setMessages] = useState<ChannelMessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isMember, setIsMember] = useState(channel.isMember);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [bottomSheetMsgId, setBottomSheetMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  // sender profile cache
  const senderCacheRef = useRef<Map<string, { full_name: string; profile_image_url: string | null }>>(new Map());

  useEffect(() => {
    setIsMember(channel.isMember);
  }, [channel.isMember]);

  useEffect(() => {
    if (!isMember) { setLoadingMessages(false); return; }
    setLoadingMessages(true);
    setMessages([]);
    getChannelMessages(channel.id).then((data) => {
      data.forEach((m) => {
        senderCacheRef.current.set(m.sender_id, { full_name: m.sender_name, profile_image_url: m.sender_image_url });
      });
      setMessages(data);
      setLoadingMessages(false);
      markChannelRead(channel.id, userId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, isMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!isMember) return;
    const supabase = createClient();
    const sub = supabase
      .channel(`channel-messages:${channel.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channel.id}` },
        async (payload) => {
          const raw = payload.new as {
            id: string; channel_id: string; sender_id: string; body: string;
            image_url: string | null; file_url: string | null; file_name: string | null; created_at: string;
          };

          // Resolve sender from cache or fetch
          let senderInfo = senderCacheRef.current.get(raw.sender_id);
          if (!senderInfo) {
            const fetched = await getSenderProfile(raw.sender_id);
            if (fetched) {
              senderCacheRef.current.set(raw.sender_id, fetched);
              senderInfo = fetched;
            }
          }

          const newMsg: ChannelMessageRow = {
            id: raw.id,
            channel_id: raw.channel_id,
            sender_id: raw.sender_id,
            sender_name: senderInfo?.full_name ?? "Unknown",
            sender_image_url: senderInfo?.profile_image_url ?? null,
            body: raw.body,
            image_url: raw.image_url,
            file_url: raw.file_url,
            file_name: raw.file_name,
            created_at: raw.created_at,
          };

          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          onMessageSent(channel.id, { body: raw.body, created_at: raw.created_at, sender_id: raw.sender_id });

          if (raw.sender_id !== userId) {
            markChannelRead(channel.id, userId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channel.id}` },
        (payload) => {
          const updated = payload.new as { id: string; body: string };
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, body: updated.body } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channel.id}` },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, isMember, userId]);

  const handleJoin = async () => {
    setJoining(true);
    const ok = await joinChannel(channel.id, userId);
    if (ok) {
      setIsMember(true);
      onMembershipChange(channel.id, true);
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (channel.is_default) return;
    setLeaving(true);
    const ok = await leaveChannel(channel.id, userId);
    if (ok) {
      setIsMember(false);
      setMessages([]);
      onMembershipChange(channel.id, false);
    }
    setLeaving(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isHeic =
      file.type === "image/heic" || file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    if (isHeic) {
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
      } catch {
        setSendError("Failed to convert HEIC image. Please try a JPEG or PNG.");
        return;
      }
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAttachedFile(file);
  };

  const handleSend = async () => {
    if ((!draft.trim() && !imageFile && !attachedFile) || !isMember || sending) return;
    const body = draft.trim();
    setDraft("");
    setSendError(null);
    setSending(true);

    let imageUrl: string | undefined;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("channelId", channel.id);
      const result = await uploadChannelImage(fd);
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
      fd.append("channelId", channel.id);
      const result = await uploadChannelFile(fd);
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

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const cachedSelf = senderCacheRef.current.get(userId);
    const optimistic: ChannelMessageRow = {
      id: tempId,
      channel_id: channel.id,
      sender_id: userId,
      sender_name: cachedSelf?.full_name ?? "You",
      sender_image_url: cachedSelf?.profile_image_url ?? null,
      body,
      image_url: imageUrl ?? null,
      file_url: fileUrl ?? null,
      file_name: fileName ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const saved = await sendChannelMessage(channel.id, body, imageUrl, fileUrl, fileName);

    if (saved) {
      senderCacheRef.current.set(saved.sender_id, {
        full_name: saved.sender_name,
        profile_image_url: saved.sender_image_url,
      });
      setMessages((prev) => {
        const deduped = prev.filter((m) => m.id !== saved.id);
        return deduped.map((m) => (m.id === tempId ? saved : m));
      });
      onMessageSent(channel.id, { body: saved.body, created_at: saved.created_at, sender_id: saved.sender_id });
    } else {
      setSendError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  };

  const handleEditStart = (msg: ChannelMessageRow) => {
    setEditingMsgId(msg.id);
    setEditDraft(msg.body);
  };

  const handleEditSave = async (msgId: string) => {
    if (!editDraft.trim()) return;
    const ok = await editChannelMessage(msgId, editDraft);
    if (ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, body: editDraft.trim() } : m))
      );
    }
    setEditingMsgId(null);
    setEditDraft("");
  };

  const handleDelete = async (msgId: string) => {
    setDeletingMsgId(msgId);
    const ok = await deleteChannelMessage(msgId);
    if (ok) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
    setDeletingMsgId(null);
  };

  const green = "#4a7c59";
  const greenDark = "#3d6849";

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="md:hidden text-gray-500 hover:text-gray-700 cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-semibold font-body"
          style={{ backgroundColor: green }}
        >
          <Hash className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold font-body text-gray-800">{channel.name}</p>
          <p className="text-[11px] text-gray-400 font-body">{channel.memberCount} member{channel.memberCount !== 1 ? "s" : ""}</p>
        </div>
        {!channel.is_default && isMember && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Leave
          </button>
        )}
        {!isMember && (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-white disabled:opacity-50"
            style={{ backgroundColor: green }}
          >
            {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Join Channel
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {!isMember ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: green }}
            >
              <Hash className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold font-body text-gray-800">#{channel.name}</p>
              {channel.description && (
                <p className="text-xs text-gray-400 font-body mt-1">{channel.description}</p>
              )}
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-5 py-2 rounded-xl text-sm font-semibold font-body text-white transition-colors cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: green }}
            >
              {joining ? "Joining..." : "Join Channel"}
            </button>
          </div>
        ) : loadingMessages ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 font-body text-center py-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const fromMe = msg.sender_id === userId;
            const isEditing = editingMsgId === msg.id;
            const isDeleting = deletingMsgId === msg.id;
            const isTemp = msg.id.startsWith("temp-");
            return (
              <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"} gap-2 group`}>
                {!fromMe && (
                  <MsgAvatar senderId={msg.sender_id} senderName={msg.sender_name} senderImageUrl={msg.sender_image_url} />
                )}
                {fromMe && !isTemp && !isEditing && (
                  <button
                    onClick={() => setBottomSheetMsgId(msg.id)}
                    className="md:hidden self-center p-1 text-gray-400 cursor-pointer shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
                <div className="max-w-[75%] relative">
                  {!fromMe && (
                    <p className="text-[11px] text-gray-500 font-body mb-1 ml-1">{msg.sender_name}</p>
                  )}
                  {fromMe && !isTemp && !isEditing && (
                    <div className="hidden md:group-hover:flex absolute top-1/2 -translate-y-1/2 -left-[72px] items-center gap-0.5 bg-white border border-gray-100 rounded-lg shadow-sm px-1 py-0.5 z-10">
                      <button
                        onClick={() => handleEditStart(msg)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                        title="Edit message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        disabled={isDeleting}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer transition-colors disabled:opacity-50"
                        title="Delete message"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(msg.id); }
                          if (e.key === "Escape") { setEditingMsgId(null); setEditDraft(""); }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-2 text-sm font-body bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800"
                      />
                      <button
                        onClick={() => handleEditSave(msg.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 cursor-pointer"
                        style={{ backgroundColor: green }}
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingMsgId(null); setEditDraft(""); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 shrink-0 cursor-pointer transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                        fromMe
                          ? "text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                      style={fromMe ? { backgroundColor: green } : undefined}
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
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 shrink-0">
        {sendError && <p className="px-4 pt-2 text-xs text-red-500">{sendError}</p>}
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
              <button onClick={() => setAttachedFile(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        {isMember ? (
          <div className="px-4 py-3 flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleImageSelect} />
            <input ref={attachmentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileSelect} />
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
              placeholder={`Message #${channel.name}`}
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
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              style={{ backgroundColor: sending ? greenDark : green }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center justify-center">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-5 py-2 rounded-xl text-sm font-semibold font-body text-white transition-colors cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: green }}
            >
              {joining ? "Joining..." : "Join to participate"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {bottomSheetMsgId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setBottomSheetMsgId(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
            <button
              onClick={() => {
                const msg = messages.find((m) => m.id === bottomSheetMsgId);
                if (msg) handleEditStart(msg);
                setBottomSheetMsgId(null);
              }}
              className="w-full flex items-center gap-3 px-6 py-4 text-sm font-body text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-gray-400" />
              Edit Message
            </button>
            <button
              onClick={() => {
                handleDelete(bottomSheetMsgId);
                setBottomSheetMsgId(null);
              }}
              className="w-full flex items-center gap-3 px-6 py-4 text-sm font-body text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Message
            </button>
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  );
}
