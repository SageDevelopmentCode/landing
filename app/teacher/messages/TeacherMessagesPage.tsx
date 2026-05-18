"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, ChevronLeft, SquarePen, X, Loader2, ImageIcon, Paperclip, FileText, Download, GraduationCap, Hash, Plus, Check } from "lucide-react";
import { createClient } from "@/app/lib/supabase-browser";
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markMessagesRead,
  uploadMessageImage,
  uploadMessageFile,
  type ConversationWithMeta,
  type MessageRow,
} from "@/app/parent/messages/actions";
import { getParentsForTeacher, type ParentWithChildren, type ParentsForTeacher } from "./actions";
import { getStudentsByParentId, type ChildInfo } from "@/app/admin/messages/actions";
import {
  getChannels,
  ensureDefaultChannelMembership,
  createChannel,
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
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function TeacherMessagesPage({
  userId,
  initialRecipientId,
  initialRecipientName,
}: {
  userId: string;
  initialRecipientId?: string | null;
  initialRecipientName?: string | null;
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

  const [showChildInfo, setShowChildInfo] = useState(false);
  const [childInfoData, setChildInfoData] = useState<ChildInfo[]>([]);
  const [loadingChildInfo, setLoadingChildInfo] = useState(false);

  // Community channels
  const [activeTab, setActiveTab] = useState<"direct" | "community">("direct");
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);

  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; full_name: string; profile_image_url: string | null }[]>([]);
  const [modalDraft, setModalDraft] = useState("");
  const [modalImageFile, setModalImageFile] = useState<File | null>(null);
  const [modalImagePreview, setModalImagePreview] = useState<string | null>(null);
  const [modalAttachedFile, setModalAttachedFile] = useState<File | null>(null);
  const [modalSendError, setModalSendError] = useState<string | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [creatingConvo, setCreatingConvo] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const modalAttachmentInputRef = useRef<HTMLInputElement>(null);
  const [parentDirectory, setParentDirectory] = useState<ParentsForTeacher | null>(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);

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
      setShowNewMessageModal(false);
      setMobileShowChat(true);
    }
    setNewChannelName("");
    setNewChannelDesc("");
    setShowCreateChannel(false);
    setCreatingChannel(false);
  };

  useEffect(() => {
    if (!initialRecipientId || loadingConvos) return;
    const existing = conversations.find((c) => c.otherUser.id === initialRecipientId);
    if (existing) {
      setActiveId(existing.id);
      setMobileShowChat(true);
    } else if (initialRecipientName) {
      setShowNewMessageModal(true);
      setSelectedRecipients([{ id: initialRecipientId, full_name: initialRecipientName, profile_image_url: null }]);
      setMobileShowChat(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConvos]);

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, userId]);

  const handleRecipientSearch = useCallback((query: string) => {
    setRecipientSearch(query);
  }, []);

  const handleSelectRecipient = (recipient: { id: string; full_name: string; profile_image_url: string | null }) => {
    if (selectedRecipients.find((r) => r.id === recipient.id)) return;
    setSelectedRecipients((prev) => [...prev, recipient]);
    setRecipientSearch("");
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== recipientId));
  };

  const handleSendNewMulti = async () => {
    if (selectedRecipients.length === 0 || (!modalDraft.trim() && !modalImageFile && !modalAttachedFile) || sending) return;
    const body = modalDraft.trim();
    setModalSendError(null);
    setCreatingConvo(true);

    const convoResults = await Promise.all(
      selectedRecipients.map((r) => createConversation(userId, r.id))
    );

    const failures: string[] = [];
    const successPairs: Array<{ recipient: typeof selectedRecipients[0]; convoId: string }> = [];
    selectedRecipients.forEach((r, i) => {
      if (!convoResults[i]) {
        failures.push(`Could not create conversation with ${r.full_name}.`);
      } else {
        successPairs.push({ recipient: r, convoId: convoResults[i]! });
      }
    });

    if (successPairs.length === 0) {
      setModalSendError("Failed to create any conversations. Please try again.");
      setCreatingConvo(false);
      return;
    }

    setSending(true);
    setCreatingConvo(false);

    const firstConvoId = successPairs[0].convoId;
    let imageUrl: string | undefined;
    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (modalImageFile) {
      const fd = new FormData();
      fd.append("file", modalImageFile);
      fd.append("conversationId", firstConvoId);
      const result = await uploadMessageImage(fd);
      if ("url" in result) {
        imageUrl = result.url;
      } else {
        setModalSendError(`Image upload failed: ${result.error}`);
        setSending(false);
        return;
      }
    }

    if (modalAttachedFile) {
      const fd = new FormData();
      fd.append("file", modalAttachedFile);
      fd.append("conversationId", firstConvoId);
      const result = await uploadMessageFile(fd);
      if ("url" in result) {
        fileUrl = result.url;
        fileName = result.name;
      } else {
        setModalSendError(`File upload failed: ${result.error}`);
        setSending(false);
        return;
      }
    }

    let lastSentConvoId: string | null = null;
    let lastSavedMessage: MessageRow | null = null;

    for (const { recipient, convoId } of successPairs) {
      const saved = await sendMessage(convoId, body, imageUrl, fileUrl, fileName);
      if (saved) {
        lastSentConvoId = convoId;
        lastSavedMessage = saved;
      } else {
        failures.push(`Message to ${recipient.full_name} failed to send.`);
      }
    }

    const updated = await getConversations(userId);
    setConversations(updated);

    if (lastSentConvoId && lastSavedMessage) {
      setActiveId(lastSentConvoId);
      setMessages([lastSavedMessage]);
      setActiveChannelId(null);
      setMobileShowChat(true);
    }

    setShowNewMessageModal(false);
    setModalStep(1);
    setSelectedRecipients([]);
    setModalDraft("");
    setModalImageFile(null);
    setModalImagePreview(null);
    setModalAttachedFile(null);
    setRecipientSearch("");
    setSending(false);

    if (failures.length > 0) {
      setSendError(failures.join(" "));
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAttachedFile(file);
  };

  const handleModalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error("[handleModalImageSelect] HEIC conversion failed:", err);
        setModalSendError("Failed to convert HEIC image. Please try a JPEG or PNG.");
        return;
      }
    }

    setModalImageFile(file);
    setModalImagePreview(URL.createObjectURL(file));
  };

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setModalAttachedFile(file);
  };

  const handleSend = async () => {
    if ((!draft.trim() && !imageFile && !attachedFile) || !activeId || sending) return;
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
      setSendError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  };

  const handleViewChild = async () => {
    if (!active) return;
    if (childInfoData.length > 0) { setShowChildInfo(true); return; }
    setLoadingChildInfo(true);
    setShowChildInfo(true);
    const data = await getStudentsByParentId(active.otherUser.id);
    setChildInfoData(data);
    setLoadingChildInfo(false);
  };

  const filtered = conversations.filter((c) =>
    c.otherUser.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-0 bg-white overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 md:min-w-[320px] border-r border-gray-100 flex flex-col min-h-0 overflow-hidden ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab("direct")}
            className={`flex-1 py-2.5 text-xs font-semibold font-body transition-colors relative ${
              activeTab === "direct" ? "text-[#4a7c59]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Direct Messages
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
                  setShowNewMessageModal(true);
                  setModalStep(1);
                  setSelectedRecipients([]);
                  setModalDraft("");
                  setModalImageFile(null);
                  setModalImagePreview(null);
                  setModalAttachedFile(null);
                  setModalSendError(null);
                  setRecipientSearch("");
                  if (!parentDirectory) {
                    setLoadingDirectory(true);
                    getParentsForTeacher(userId).then((data) => {
                      setParentDirectory(data);
                      setLoadingDirectory(false);
                    });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer bg-[#4a7c59] hover:bg-[#3d6849]"
              >
                <SquarePen className="w-4 h-4" />
                New Message
              </button>
            </div>

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
                      setShowNewMessageModal(false);
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
          <div className="flex flex-col flex-1 min-h-0">
            {/* New Channel button */}
            <div className="p-3 border-b border-gray-100 shrink-0">
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-full flex items-center justify-center gap-2 text-[#4a7c59] text-sm font-medium py-2 rounded-lg border border-[#4a7c59]/30 hover:bg-[#4a7c59]/5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Channel
              </button>
            </div>

            {/* Create channel form */}
            {showCreateChannel && (
              <div className="p-3 border-b border-gray-100 bg-gray-50 shrink-0">
                <input
                  autoFocus
                  type="text"
                  placeholder="Channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel(); if (e.key === "Escape") setShowCreateChannel(false); }}
                  className="w-full px-3 py-2 text-sm font-body bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400 mb-2"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel(); }}
                  className="w-full px-3 py-2 text-sm font-body bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateChannel}
                    disabled={!newChannelName.trim() || creatingChannel}
                    className="flex-1 py-1.5 text-xs font-semibold font-body text-white bg-[#4a7c59] hover:bg-[#3d6849] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {creatingChannel ? "Creating..." : "Create"}
                  </button>
                  <button
                    onClick={() => { setShowCreateChannel(false); setNewChannelName(""); setNewChannelDesc(""); }}
                    className="flex-1 py-1.5 text-xs font-semibold font-body text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
                      setShowNewMessageModal(false);
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
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`flex-1 min-h-0 flex flex-col relative ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {activeChannel ? (
          <ChannelChatArea
            channel={activeChannel}
            userId={userId}
            userRole="teacher"
            onBack={() => { setActiveChannelId(null); setMobileShowChat(false); }}
            onMembershipChange={(channelId, isMember) => {
              setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, isMember } : c));
            }}
            onMessageSent={(channelId, lastMsg) => {
              setChannels((prev) => prev.map((c) => c.id === channelId ? { ...c, lastMessage: lastMsg, unreadCount: 0 } : c));
            }}
          />
        ) : !active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 font-body">Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
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
              {active.otherUser.role === "parent" && (
                <button
                  onClick={handleViewChild}
                  className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-[#4a7c59]/10 text-[#4a7c59] hover:bg-[#4a7c59]/20"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  View Child
                </button>
              )}
            </div>

            {/* Child info panel */}
            {showChildInfo && (
              <div className="absolute inset-y-0 right-0 w-72 bg-white border-l border-gray-100 shadow-lg z-20 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                  <p className="text-sm font-semibold font-body text-gray-800">Child Info</p>
                  <button
                    onClick={() => setShowChildInfo(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingChildInfo ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                    </div>
                  ) : childInfoData.length === 0 ? (
                    <p className="text-sm text-gray-400 font-body text-center py-8">No students found</p>
                  ) : (
                    childInfoData.map((child) => (
                      <div key={child.id} className="p-4 flex gap-3 items-start border-b border-gray-100">
                        <div className="shrink-0">
                          {child.profile_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={child.profile_image_url}
                              alt={child.child_legal_name ?? ""}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`${colorForId(child.id)} w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0`}>
                              {initialsFor(child.child_legal_name ?? "?")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold font-body text-gray-800 truncate">
                            {child.child_legal_name ?? "—"}
                          </p>
                          {child.child_grade && (
                            <p className="text-xs font-body text-gray-500 mt-0.5">
                              Grade: {child.child_grade}
                            </p>
                          )}
                          {child.program && (
                            <p className="text-xs font-body text-gray-500 mt-0.5">
                              {formatProgram(child.program)}
                              {child.program === "homeschool_drop_in" && child.drop_in_program && (
                                <span className="text-gray-400"> · {formatProgram(child.drop_in_program)}</span>
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

      {/* New Message Modal */}
      {showNewMessageModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => { if (!sending && !creatingConvo) { setShowNewMessageModal(false); setModalStep(1); } }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl pointer-events-auto flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                {modalStep === 2 && (
                  <button
                    onClick={() => setModalStep(1)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <p className="text-base font-semibold font-body text-gray-800 flex-1">
                  {modalStep === 1
                    ? selectedRecipients.length > 0
                      ? `Select Recipients (${selectedRecipients.length})`
                      : "Select Recipients"
                    : "New Message"}
                </p>
                <button
                  onClick={() => { if (!sending && !creatingConvo) { setShowNewMessageModal(false); setModalStep(1); } }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalStep === 1 ? (
                <>
                  {/* Search input */}
                  <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search by name or child..."
                      value={recipientSearch}
                      onChange={(e) => handleRecipientSearch(e.target.value)}
                      className="w-full text-sm font-body bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Selected pills (when any selected) */}
                  {selectedRecipients.length > 0 && (
                    <div className="px-5 py-2 border-b border-gray-100 shrink-0 flex flex-wrap gap-1.5">
                      {selectedRecipients.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-body px-2.5 py-1 rounded-full"
                        >
                          <span>{r.full_name}</span>
                          <button onClick={() => handleRemoveRecipient(r.id)} className="text-[#4a7c59] hover:text-[#3d6849] cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Parent grid directory */}
                  <div className="flex-1 overflow-y-auto">
                    {loadingDirectory ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                      </div>
                    ) : parentDirectory ? (() => {
                      const q = recipientSearch.toLowerCase();
                      const filterParents = (list: ParentWithChildren[]) =>
                        q
                          ? list.filter(
                              (p) =>
                                p.full_name.toLowerCase().includes(q) ||
                                p.children.some((c) => c.child_legal_name?.toLowerCase().includes(q))
                            )
                          : list;

                      const mine = filterParents(parentDirectory.myStudentsParents);
                      const all = filterParents(parentDirectory.allParents);

                      if (mine.length === 0 && all.length === 0) {
                        return <p className="text-sm text-gray-400 font-body text-center py-10">No parents found</p>;
                      }

                      const renderParentCard = (parent: ParentWithChildren) => {
                        const isSelected = !!selectedRecipients.find((r) => r.id === parent.id);
                        return (
                          <button
                            key={parent.id}
                            onClick={() =>
                              isSelected
                                ? handleRemoveRecipient(parent.id)
                                : handleSelectRecipient({ id: parent.id, full_name: parent.full_name, profile_image_url: parent.profile_image_url })
                            }
                            className={`relative text-left rounded-xl border p-3 transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#4a7c59] bg-[#4a7c59]/5 ring-1 ring-[#4a7c59]/20"
                                : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#4a7c59] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </span>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <UserAvatar id={parent.id} name={parent.full_name} imageUrl={parent.profile_image_url} size="sm" />
                              <span className="text-sm font-semibold font-body text-gray-800 leading-tight pr-5">{parent.full_name}</span>
                            </div>
                            {parent.children.length > 0 && (
                              <div className="mt-2 pl-2">
                                {(() => {
                                  const first = parent.children[0];
                                  const extra = parent.children.length - 1;
                                  return (
                                    <div className="flex items-center gap-1.5">
                                      {first.profile_image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={first.profile_image_url} alt={first.child_legal_name ?? ""} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                      ) : (
                                        <div className={`${colorForId(first.id)} w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0`}>
                                          {initialsFor(first.child_legal_name ?? "?")}
                                        </div>
                                      )}
                                      <span className="text-[11px] font-body text-gray-500 leading-snug flex-1 min-w-0 truncate">
                                        {first.child_legal_name ?? "—"}
                                        {first.child_grade && <span className="text-gray-400"> · {first.child_grade}</span>}
                                        {first.program && <span className="text-gray-400"> · {formatProgram(first.program)}</span>}
                                      </span>
                                      {extra > 0 && (
                                        <span className="text-[10px] font-semibold font-body text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">+{extra}</span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </button>
                        );
                      };

                      return (
                        <div className="pb-2">
                          {mine.length > 0 && (
                            <>
                              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                                <p className="text-[11px] font-semibold font-body text-gray-400 uppercase tracking-wide">My Students&apos; Parents</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 p-4">
                                {mine.map(renderParentCard)}
                              </div>
                            </>
                          )}
                          {all.length > 0 && (
                            <>
                              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                                <p className="text-[11px] font-semibold font-body text-gray-400 uppercase tracking-wide">All Parents</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 p-4">
                                {all.map(renderParentCard)}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })() : null}
                  </div>

                  {/* Step 1 footer */}
                  <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
                    <button
                      onClick={() => { setShowNewMessageModal(false); setModalStep(1); }}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold font-body text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setModalStep(2)}
                      disabled={selectedRecipients.length === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a7c59] hover:bg-[#3d6849] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold font-body transition-colors cursor-pointer"
                    >
                      Next
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: To: pills summary (removable) */}
                  <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-start gap-2 flex-wrap min-h-[32px]">
                      <span className="text-sm font-body text-gray-500 shrink-0 mt-1">To:</span>
                      {selectedRecipients.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-body px-2.5 py-1 rounded-full"
                        >
                          <span>{r.full_name}</span>
                          <button onClick={() => handleRemoveRecipient(r.id)} className="text-[#4a7c59] hover:text-[#3d6849] cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Compose area */}
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {modalSendError && (
                      <p className="mb-2 text-xs text-red-500 font-body">{modalSendError}</p>
                    )}
                    {modalImagePreview && (
                      <div className="mb-3 flex items-center gap-2">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={modalImagePreview} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                          <button
                            onClick={() => { setModalImageFile(null); setModalImagePreview(null); }}
                            className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    )}
                    {modalAttachedFile && (
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs font-body text-gray-700 truncate">{modalAttachedFile.name}</span>
                          <button onClick={() => setModalAttachedFile(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    <textarea
                      autoFocus
                      placeholder="Type a message..."
                      value={modalDraft}
                      onChange={(e) => setModalDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendNewMulti();
                        }
                      }}
                      rows={6}
                      className="w-full text-sm font-body bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40 text-gray-800 placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  {/* Step 2: Footer */}
                  <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex items-center gap-2">
                    <input ref={modalFileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleModalImageSelect} />
                    <input ref={modalAttachmentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleModalFileSelect} />
                    <button
                      onClick={() => modalFileInputRef.current?.click()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0"
                      title="Attach image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => modalAttachmentInputRef.current?.click()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer shrink-0"
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={handleSendNewMulti}
                      disabled={
                        selectedRecipients.length === 0 ||
                        (!modalDraft.trim() && !modalImageFile && !modalAttachedFile) ||
                        sending ||
                        creatingConvo
                      }
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a7c59] hover:bg-[#3d6849] disabled:opacity-50 text-white text-sm font-semibold font-body transition-colors cursor-pointer"
                    >
                      {(sending || creatingConvo) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {selectedRecipients.length > 1 ? `Send to ${selectedRecipients.length}` : "Send"}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
