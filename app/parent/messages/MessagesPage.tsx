"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase-browser";
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  findOrCreateHouseholdTeacherConversation,
  getConversationParticipants,
  markMessagesRead,
  uploadMessageImage,
  uploadMessageFile,
  getTeachersAndAdmins,
  type TeacherOrAdmin,
  type ConversationWithMeta,
  type ConversationParticipant,
  type MessageRow,
} from "./actions";
import { getChannels, ensureDefaultChannelMembership, type ChannelWithMeta } from "@/app/messages/channel-actions";
import ChannelChatArea from "@/app/messages/components/ChannelChatArea";
import { conversationSubtitle, conversationTitle, isGroupConversation } from "@/app/messages/conversation-display";
import PortalShell from "@/app/parent/_garden/PortalShell";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { PillTabs } from "@/app/parent/_garden/tabs";
import { EmptyState, ErrorCard } from "@/app/parent/_garden/states";
import { KidAvatar, btnGhostSm, btnInkSm, btnSageSm } from "@/app/parent/_garden/ui";
import { formatDayHeading, useNow } from "@/app/parent/_garden/time";
import { buildChatItems, toDisplayableImage, withLastMessage, type PendingPayload, type Recipient, type ThreadMessage } from "./garden/chat";
import { ChannelRow, ConversationRow, RowSkeletons } from "./garden/InboxBits";
import {
  Bubble,
  ComposeIcon,
  Composer,
  DaySeparator,
  HeaderAvatar,
  MessageMeta,
  SearchIcon,
  ThreadHeader,
  ThreadSkeleton,
} from "./garden/ChatBits";
import ComposePane from "./garden/ComposePane";

type Props = {
  userId: string;
  effectiveParentId: string;
  initialRecipientId?: string | null;
  initialRecipientName?: string | null;
  initialStudentId?: string | null;
  initialTab?: "direct" | "community";
  /** Admin "view as parent": browse only. Writes show the Preview toast; nothing is marked read. */
  readOnlyPreview?: boolean;
};

export default function MessagesPage(props: Props) {
  return (
    <PortalShell className="flex min-h-0 flex-1 flex-col">
      <Messages {...props} />
    </PortalShell>
  );
}

type LoadState = "loading" | "error" | "ready";
type Tab = "direct" | "community";
type Draft = { draft: string; imageFile: File | null; imagePreview: string | null; attachedFile: File | null };
type View = { kind: "dm"; id: string } | { kind: "channel"; id: string } | { kind: "compose"; recipient?: Recipient | null; studentId?: string | null } | { kind: "none" };

const EMPTY_DRAFT: Draft = { draft: "", imageFile: null, imagePreview: null, attachedFile: null };
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();

// Panel ids for the inbox tabs (aria-controls).
const DM_PANEL = "messages-panel-direct";
const CHANNEL_PANEL = "messages-panel-community";

/**
 * Lets the shared ChannelChatArea pick up the Garden type and ink colours without changing it for teachers or admins.
 * (Its accent colour and shapes switch through its own `gardenStyle` prop.)
 */
const CHANNEL_SKIN =
  "[&_.font-body]:[font-family:inherit] [&_.text-gray-800]:text-[var(--sf-ink)] [&_.text-gray-500]:text-[var(--sf-soft)] [&_.text-gray-400]:text-[var(--sf-soft)]/80";

function Messages({ userId, initialTab, readOnlyPreview }: Props) {
  const { toast, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const now = useNow(60_000);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // ─── Inbox ────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [convosState, setConvosState] = useState<LoadState>("loading");
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [channelsState, setChannelsState] = useState<LoadState>("loading");
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? "direct");
  const [search, setSearch] = useState("");
  const [suggestedStaff, setSuggestedStaff] = useState<TeacherOrAdmin[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // ─── What the right pane shows ───────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // ─── Thread ───────────────────────────────────────────────────────────────
  const [thread, setThread] = useState<{ id: string; state: LoadState; messages: MessageRow[] } | null>(null);
  /** Messages still sending or failed, per conversation (so they survive switching threads). */
  const [localByConvo, setLocalByConvo] = useState<Record<string, ThreadMessage[]>>({});
  const [participants, setParticipants] = useState<{ id: string; list: ConversationParticipant[] } | null>(null);

  // ─── Composer (shared by threads and New Message) ─────────────────────────
  const [{ draft, imageFile, imagePreview, attachedFile }, setComposer] = useState<Draft>(EMPTY_DRAFT);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [pendingHouseholdStudentId, setPendingHouseholdStudentId] = useState<string | null>(null);
  const [creatingConvo, setCreatingConvo] = useState(false);

  // ─── Refs (read only in handlers / effects) ───────────────────────────────
  const conversationsRef = useRef(conversations);
  const localRef = useRef(localByConvo);
  const participantsRef = useRef(participants);
  const staffRef = useRef<{ list: TeacherOrAdmin[]; ready: Promise<TeacherOrAdmin[]> } | null>(null);
  const activeIdRef = useRef(activeId);
  const threadReq = useRef(0);
  const creatingRef = useRef(false);
  const drafts = useRef(new Map<string, Draft>());
  const composerKeyRef = useRef("none");
  const composerRef = useRef<Draft>(EMPTY_DRAFT);
  const objectUrls = useRef(new Set<string>());
  const tempSeq = useRef(0);
  const lastQuietRefresh = useRef(0);
  const handledDeepKey = useRef<string | null>(null);
  const retrySendRef = useRef<(convoId: string, tempId: string) => void>(() => {});
  const retryComposeRef = useRef<() => void>(() => {});
  const retryDeepLinkRef = useRef<() => void>(() => {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    conversationsRef.current = conversations;
    localRef.current = localByConvo;
    participantsRef.current = participants;
    activeIdRef.current = activeId;
    composerRef.current = { draft, imageFile, imagePreview, attachedFile };
  });

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;
  const activeIsGroup = active ? isGroupConversation(active) : false;

  // ─── Object URLs: every preview is tracked and revoked when it goes away ──
  const trackUrl = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
  }, []);
  const releaseUrl = useCallback((url: string | null | undefined) => {
    if (!url || !objectUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
  }, []);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  // ─── Loading ──────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async (): Promise<ConversationWithMeta[] | null> => {
    try {
      const data = await getConversations(userId);
      // The open thread is being read, so it never shows as unread.
      const open = activeIdRef.current;
      const next = readOnlyPreview || !open ? data : data.map((c) => (c.id === open ? { ...c, unreadCount: 0 } : c));
      setConversations(next);
      setConvosState("ready");
      conversationsRef.current = next;
      return next;
    } catch {
      return null;
    }
  }, [userId, readOnlyPreview]);

  const loadChannels = useCallback(async (): Promise<boolean> => {
    try {
      const data = await getChannels(userId);
      setChannels(data);
      setChannelsState("ready");
      return true;
    } catch {
      return false;
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await loadConversations();
      if (!r && !cancelled) setConvosState("error");
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Auto-join the default channels first (skipped in admin preview: that's a write).
      if (!readOnlyPreview) await ensureDefaultChannelMembership(userId).catch(() => {});
      const ok = await loadChannels();
      if (!ok && !cancelled) setChannelsState("error");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, readOnlyPreview, loadChannels]);

  useEffect(() => {
    const ready = getTeachersAndAdmins().catch(() => [] as TeacherOrAdmin[]);
    staffRef.current = { list: [], ready };
    void ready.then((list) => {
      if (staffRef.current) staffRef.current.list = list;
      setSuggestedStaff(list);
      setStaffLoading(false);
    });
  }, []);

  // Fresh unread counts when the parent comes back to the tab (at most every 10s).
  useEffect(() => {
    function refresh() {
      if (Date.now() - lastQuietRefresh.current < 10_000) return;
      lastQuietRefresh.current = Date.now();
      void loadConversations();
      void loadChannels();
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadConversations, loadChannels]);

  // ─── Thread messages (stale responses are dropped) ───────────────────────
  const loadThread = useCallback(
    async (id: string) => {
      const token = ++threadReq.current;
      try {
        const data = await getMessages(id);
        if (token !== threadReq.current) return;
        setThread({ id, state: "ready", messages: data });
        if (!readOnlyPreview) {
          void markMessagesRead(id, userId).catch(() => {});
          setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
        }
      } catch {
        if (token === threadReq.current) setThread({ id, state: "error", messages: [] });
      }
    },
    [userId, readOnlyPreview],
  );

  useEffect(() => {
    if (!activeId) {
      threadReq.current++;
      return;
    }
    void (async () => {
      await loadThread(activeId);
    })();
  }, [activeId, loadThread]);

  // Participants for group chats, keyed on the conversation id (not the row object).
  useEffect(() => {
    if (!activeId || !activeIsGroup) return;
    let cancelled = false;
    getConversationParticipants(activeId)
      .then((list) => !cancelled && setParticipants({ id: activeId, list }))
      .catch(() => !cancelled && setParticipants({ id: activeId, list: [] }));
    return () => {
      cancelled = true;
    };
  }, [activeId, activeIsGroup]);

  const senderNameFor = useCallback(
    (convoId: string, senderId: string): string | null => {
      if (senderId === userId) return null;
      const p = participantsRef.current;
      if (p?.id === convoId) {
        const hit = p.list.find((m) => m.id === senderId);
        if (hit) return hit.full_name;
      }
      const convo = conversationsRef.current.find((c) => c.id === convoId);
      if (convo?.otherUser?.id === senderId) return convo.otherUser.full_name;
      return null;
    },
    [userId],
  );

  // Real-time inserts for the open thread.
  useEffect(() => {
    if (!activeId) return;
    const convoId = activeId;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${convoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "messages", filter: `conversation_id=eq.${convoId}` },
        (payload) => {
          const raw = payload.new as MessageRow;
          // Realtime rows don't carry sender_name: fill it from the participants we already have.
          const row: MessageRow = { ...raw, sender_name: raw.sender_name ?? senderNameFor(convoId, raw.sender_id) };
          setThread((prev) =>
            prev && prev.id === convoId && !prev.messages.some((m) => m.id === row.id)
              ? { ...prev, messages: [...prev.messages, row] }
              : prev,
          );
          setConversations((prev) => withLastMessage(prev, convoId, row));
          if (row.sender_id !== userId && !readOnlyPreview) void markMessagesRead(convoId, userId).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId, userId, readOnlyPreview, senderNameFor]);

  // ─── Navigation (drafts are kept per conversation) ───────────────────────
  const navigate = useCallback(
    (view: View) => {
      // Park the current draft under its key and bring back the one for where we're going.
      const current = composerRef.current;
      const key = composerKeyRef.current;
      const nextKey = view.kind === "dm" ? view.id : view.kind === "compose" ? "compose" : "none";
      if (key !== nextKey) {
        if (current.draft || current.imageFile || current.attachedFile) drafts.current.set(key, current);
        else drafts.current.delete(key);
        const restored = drafts.current.get(nextKey) ?? EMPTY_DRAFT;
        drafts.current.delete(nextKey);
        composerKeyRef.current = nextKey;
        composerRef.current = restored;
        setComposer(restored);
      }
      stickToBottom.current = true;
      setActiveId(view.kind === "dm" ? view.id : null);
      setActiveChannelId(view.kind === "channel" ? view.id : null);
      setIsComposingNew(view.kind === "compose");
      if (view.kind === "compose") {
        setRecipient(view.recipient ?? null);
        setPendingHouseholdStudentId(view.studentId ?? null);
      } else {
        setRecipient(null);
        setPendingHouseholdStudentId(null);
      }
      if (view.kind === "dm") setActiveTab("direct");
      if (view.kind === "channel") setActiveTab("community");
      setMobileShowChat(view.kind !== "none");
    },
    [],
  );

  // ─── Local (sending / failed) messages ────────────────────────────────────
  const updateLocal = useCallback((convoId: string, fn: (list: ThreadMessage[]) => ThreadMessage[]) => {
    const next = { ...localRef.current, [convoId]: fn(localRef.current[convoId] ?? []) };
    localRef.current = next;
    setLocalByConvo(next);
  }, []);

  const deliver = useCallback(
    async (convoId: string, tempId: string, isRetry: boolean) => {
      const msg = localRef.current[convoId]?.find((m) => m.id === tempId);
      if (!msg?.pending) return;
      let p: PendingPayload = msg.pending;
      const patch = (changes: Partial<ThreadMessage>) =>
        updateLocal(convoId, (list) => list.map((m) => (m.id === tempId ? { ...m, ...changes } : m)));
      patch({ status: "sending" });

      const fail = (title: string, message: string) => {
        patch({ status: "failed", pending: p });
        toast.show({
          tone: "error",
          title: isRetry && title === "Message didn't send" ? "Still couldn't send" : title,
          message,
          action: { label: "Try again", onClick: () => retrySendRef.current(convoId, tempId) },
        });
      };

      try {
        if (p.imageFile && !p.imageUrl) {
          const fd = new FormData();
          fd.append("file", p.imageFile);
          fd.append("conversationId", convoId);
          const r = await uploadMessageImage(fd);
          if (!("url" in r)) return fail("Couldn't upload the photo", `Image upload failed: ${r.error}`);
          p = { ...p, imageUrl: r.url };
        }
        if (p.attachedFile && !p.fileUrl) {
          const fd = new FormData();
          fd.append("file", p.attachedFile);
          fd.append("conversationId", convoId);
          const r = await uploadMessageFile(fd);
          if (!("url" in r)) return fail("Couldn't upload the file", `File upload failed: ${r.error}`);
          p = { ...p, fileUrl: r.url, fileName: r.name };
        }
        const saved = await sendMessage(convoId, p.body, p.imageUrl, p.fileUrl, p.fileName);
        if (!saved) return fail("Message didn't send", "We kept it, so nothing is lost. Tap Try again to resend it.");

        // Confirmed: swap the local bubble for the real row.
        releaseUrl(p.imagePreview);
        updateLocal(convoId, (list) => list.filter((m) => m.id !== tempId));
        setThread((prev) =>
          prev && prev.id === convoId && !prev.messages.some((m) => m.id === saved.id)
            ? { ...prev, messages: [...prev.messages, saved] }
            : prev,
        );
        setConversations((prev) => withLastMessage(prev, convoId, saved));
      } catch {
        fail("Message didn't send", "We kept it, so nothing is lost. Tap Try again to resend it.");
      }
    },
    [releaseUrl, toast, updateLocal],
  );

  const retrySend = useCallback(
    (convoId: string, tempId: string) => {
      if (blockedByPreview()) return;
      stickToBottom.current = true;
      void deliver(convoId, tempId, true);
    },
    [blockedByPreview, deliver],
  );

  /** Moves what's in the composer into a "Sending…" bubble for `convoId` and returns its temp id. */
  const queueFromComposer = useCallback(
    (convoId: string, c: Draft) => {
      const tempId = `temp-${Date.now()}-${tempSeq.current++}`;
      const pending: PendingPayload = {
        body: c.draft.trim(),
        imageFile: c.imageFile,
        imagePreview: c.imagePreview,
        attachedFile: c.attachedFile,
      };
      const optimistic: ThreadMessage = {
        id: tempId,
        conversation_id: convoId,
        sender_id: userId,
        body: pending.body,
        created_at: new Date().toISOString(),
        read_at: null,
        image_url: c.imagePreview,
        file_url: null,
        file_name: c.attachedFile?.name ?? null,
        status: "sending",
        pending,
      };
      updateLocal(convoId, (list) => [...list, optimistic]);
      return tempId;
    },
    [updateLocal, userId],
  );

  const composerState: Draft = { draft, imageFile, imagePreview, attachedFile };
  const hasContent = !!draft.trim() || !!imageFile || !!attachedFile;

  const handleSend = () => {
    if (!activeId || !hasContent) return;
    if (blockedByPreview()) return;
    const tempId = queueFromComposer(activeId, composerState);
    // The bubble owns the draft and files now, so nothing is lost if the send fails.
    setComposer(EMPTY_DRAFT);
    stickToBottom.current = true;
    void deliver(activeId, tempId, false);
    textareaRef.current?.focus();
  };

  const handleSendNew = async () => {
    if (!recipient || !hasContent) return;
    if (creatingRef.current) return;
    if (blockedByPreview()) return;
    creatingRef.current = true;
    setCreatingConvo(true);
    const to = recipient;
    const household = !!pendingHouseholdStudentId && to.role !== "parent";
    let convoId: string | null = null;
    try {
      convoId = household
        ? await findOrCreateHouseholdTeacherConversation(pendingHouseholdStudentId!, to.id)
        : await createConversation(userId, to.id);
    } catch {
      convoId = null;
    }
    creatingRef.current = false;
    setCreatingConvo(false);
    if (!convoId) {
      // The draft and files stay in the composer.
      toast.show({
        tone: "error",
        title: "Couldn't open the chat",
        message: "Could not create conversation. Please try again.",
        action: { label: "Try again", onClick: () => retryComposeRef.current() },
      });
      return;
    }

    const tempId = queueFromComposer(convoId, composerState);
    setComposer(EMPTY_DRAFT);
    drafts.current.delete("compose");
    const fresh = (await loadConversations()) ?? conversationsRef.current;
    if (!fresh.some((c) => c.id === convoId)) {
      const stub: ConversationWithMeta = {
        id: convoId,
        updated_at: new Date().toISOString(),
        otherUser: household ? null : { id: to.id, full_name: to.full_name, role: to.role ?? null, profile_image_url: to.profile_image_url },
        lastMessage: null,
        unreadCount: 0,
        isGroup: household,
        displayName: null,
        studentId: household ? pendingHouseholdStudentId : null,
        teacherId: household ? to.id : null,
        participantCount: 0,
      };
      setConversations((prev) => [stub, ...prev]);
    }
    composerKeyRef.current = convoId;
    stickToBottom.current = true;
    setActiveId(convoId);
    setIsComposingNew(false);
    setRecipient(null);
    setPendingHouseholdStudentId(null);
    setMobileShowChat(true);
    void deliver(convoId, tempId, false);
  };

  useEffect(() => {
    retrySendRef.current = retrySend;
    retryComposeRef.current = () => void handleSendNew();
  });

  // ─── Attachments ──────────────────────────────────────────────────────────
  const pickImage = async (picked: File) => {
    let file: File;
    try {
      file = await toDisplayableImage(picked);
    } catch {
      toast.show({ tone: "error", title: "Couldn't add that photo", message: "Failed to convert HEIC image. Please try a JPEG or PNG." });
      return;
    }
    const url = trackUrl(file);
    releaseUrl(composerRef.current.imagePreview);
    setComposer((c) => ({ ...c, imageFile: file, imagePreview: url }));
  };
  const clearImage = () => {
    releaseUrl(imagePreview);
    setComposer((c) => ({ ...c, imageFile: null, imagePreview: null }));
  };

  // ─── Deep links (?recipientId, ?studentId, ?tab), including bell clicks while already here ──
  const deepKey = searchParams.toString();
  const handleDeepLink = useCallback(
    async (q: { recipientId: string | null; recipientName: string | null; studentId: string | null; tab: string | null }) => {
      const { recipientId, recipientName, studentId, tab } = q;
      if (!recipientId) {
        if (tab === "community") navigate({ kind: "none" });
        if (tab === "community") setActiveTab("community");
        return;
      }
      let convos = conversationsRef.current;
      const household = (list: ConversationWithMeta[]) =>
        studentId ? list.find((c) => c.isGroup && c.studentId === studentId && c.teacherId === recipientId)?.id ?? null : null;
      // The notification bell passes the conversation id for group chats.
      const direct = (list: ConversationWithMeta[]) =>
        list.find((c) => c.id === recipientId)?.id ?? list.find((c) => !c.isGroup && c.otherUser?.id === recipientId)?.id ?? null;

      let target = household(convos);
      if (!target && studentId && !readOnlyPreview) {
        try {
          const id = await findOrCreateHouseholdTeacherConversation(studentId, recipientId);
          if (id) {
            convos = (await loadConversations()) ?? convos;
            target = id;
          }
        } catch {
          /* fall back to the direct chat / compose below, as before */
        }
      }
      if (!target) target = direct(convos);
      if (!target) {
        // The inbox may be older than the notification that brought us here.
        const fresh = await loadConversations();
        if (fresh) target = household(fresh) ?? direct(fresh);
      }
      if (target) {
        navigate({ kind: "dm", id: target });
        return;
      }
      const staff = staffRef.current ? await staffRef.current.ready : [];
      const known = staff.find((s) => s.id === recipientId);
      const name = recipientName ?? known?.full_name ?? null;
      if (name) {
        navigate({
          kind: "compose",
          recipient: { id: recipientId, full_name: name, profile_image_url: known?.profile_image_url ?? null, role: known?.role ?? null },
          studentId,
        });
        return;
      }
      toast.show({
        tone: "error",
        title: "Couldn't open the chat",
        message: "Please try again in a moment.",
        action: { label: "Try again", onClick: () => retryDeepLinkRef.current() },
      });
    },
    [loadConversations, navigate, readOnlyPreview, toast],
  );

  useEffect(() => {
    if (convosState !== "ready" || handledDeepKey.current === deepKey) return;
    handledDeepKey.current = deepKey;
    const q = {
      recipientId: searchParams.get("recipientId"),
      recipientName: searchParams.get("recipientName"),
      studentId: searchParams.get("studentId"),
      tab: searchParams.get("tab"),
    };
    if (!q.recipientId && !q.tab) return;
    // Drop the params so the same link (or bell item) works again later.
    window.history.replaceState(null, "", pathname);
    handledDeepKey.current = "";
    retryDeepLinkRef.current = () => void handleDeepLink(q);
    void (async () => {
      await handleDeepLink(q);
    })();
  }, [convosState, deepKey, searchParams, pathname, handleDeepLink]);

  // ─── Thread rendering data ────────────────────────────────────────────────
  const threadView = activeId && thread?.id === activeId ? thread : null;
  const threadState: LoadState = threadView?.state ?? "loading";
  const threadMessages = useMemo<ThreadMessage[]>(() => {
    if (!activeId) return [];
    const server = threadView?.messages ?? [];
    const local = localByConvo[activeId] ?? [];
    return [...server, ...local].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [activeId, threadView, localByConvo]);
  const chatItems = useMemo(() => buildChatItems(threadMessages), [threadMessages]);
  const lastMineId = useMemo(() => {
    for (let i = threadMessages.length - 1; i >= 0; i--) if (threadMessages[i].sender_id === userId && !threadMessages[i].status) return threadMessages[i].id;
    return null;
  }, [threadMessages, userId]);
  const members = activeIsGroup ? { list: participants?.id === activeId ? participants.list : null, count: active?.participantCount ?? 0 } : null;
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    if (participants && participants.id === activeId) participants.list.forEach((m) => map.set(m.id, m.full_name));
    return map;
  }, [participants, activeId]);

  // Keep the newest message in view (unless the parent scrolled up to read).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chatItems.length, threadState, activeId]);

  // ─── Inbox data ───────────────────────────────────────────────────────────
  const dmUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const channelUnread = channels.reduce((s, c) => s + (c.isMember ? c.unreadCount : 0), 0);
  const filtered = conversations.filter((c) => conversationTitle(c).toLowerCase().includes(search.toLowerCase()));
  const noConversations = convosState === "ready" && conversations.length === 0 && !search;

  const openCompose = (r?: Recipient | null) => navigate({ kind: "compose", recipient: r ?? null });
  const browse = readOnlyPreview ? "pointer-events-auto" : "";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden border-t border-[var(--sf-ink)]/[0.07] bg-[var(--sf-cream)]">
        {/* ─── Inbox ─── */}
        <section
          aria-label="Inbox"
          className={`${browse} min-h-0 w-full flex-col border-[var(--sf-ink)]/[0.07] bg-[#fbf4ea] md:flex md:w-[340px] md:shrink-0 md:border-r xl:w-[380px] ${
            mobileShowChat ? "hidden" : "flex"
          }`}
        >
          <div className="flex flex-col gap-3 px-4 pb-3 pt-5">
            <div className="flex items-center gap-3">
              <h1 className="sf-display min-w-0 flex-1 text-[1.8rem] leading-none">Messages</h1>
              {activeTab === "direct" ? (
                <button
                  type="button"
                  onClick={() => openCompose()}
                  aria-pressed={isComposingNew}
                  className={`${btnSageSm} shrink-0 gap-1.5 px-3.5`}
                >
                  <ComposeIcon />
                  New Message
                </button>
              ) : null}
            </div>
            <PillTabs<Tab>
              label="Message type"
              size="sm"
              className="mx-0! px-0!"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: "direct", label: "Messages", controls: DM_PANEL, badge: activeTab !== "direct" ? dmUnread : 0, badgeLabel: "unread" },
                {
                  value: "community",
                  controls: CHANNEL_PANEL,
                  label: (
                    <>
                      Community
                      <span className="rounded-full bg-[var(--sf-butter)] px-1.5 py-px text-[10px] font-black text-[#7a5b00]">New!</span>
                    </>
                  ),
                  badge: activeTab !== "community" ? channelUnread : 0,
                  badgeLabel: "unread",
                },
              ]}
            />
            {activeTab === "direct" ? (
              <label className="flex min-h-11 items-center gap-2 rounded-full bg-white px-4 ring-[1.5px] ring-[var(--sf-ink)]/10 focus-within:ring-[var(--sf-sage)]">
                <span className="text-[var(--sf-soft)]">
                  <SearchIcon />
                </span>
                <span className="sr-only">Search conversations</span>
                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:text-[var(--sf-soft)]/70"
                />
              </label>
            ) : null}
          </div>

          {activeTab === "direct" ? (
            <div id={DM_PANEL} role="tabpanel" aria-label="Messages" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              {convosState === "loading" ? (
                <RowSkeletons />
              ) : convosState === "error" ? (
                <ErrorCard
                  title="We couldn't load your messages"
                  onRetry={() => {
                    setConvosState("loading");
                    void loadConversations().then((r) => !r && setConvosState("error"));
                  }}
                />
              ) : filtered.length === 0 ? (
                search ? (
                  <EmptyState
                    emoji="🔍"
                    tint="sky"
                    title="No conversations found"
                    action={
                      <button type="button" className={btnGhostSm} onClick={() => setSearch("")}>
                        Clear
                      </button>
                    }
                  />
                ) : (
                  <>
                    {suggestedStaff.length > 0 ? (
                      <div className="md:hidden">
                        <ReachOut staff={suggestedStaff} onMessage={openCompose} compact />
                      </div>
                    ) : null}
                    <EmptyState
                      emoji="💬"
                      tint="mint"
                      title="No messages yet. Start one!"
                      className={suggestedStaff.length > 0 ? "hidden md:block" : ""}
                      action={
                        <button type="button" className={btnInkSm} onClick={() => openCompose()}>
                          New Message
                        </button>
                      }
                    />
                  </>
                )
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.map((convo) => (
                    <li key={convo.id}>
                      <ConversationRow convo={convo} selected={convo.id === activeId} now={now} onOpen={(c) => navigate({ kind: "dm", id: c.id })} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div id={CHANNEL_PANEL} role="tabpanel" aria-label="Community" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              {channelsState === "loading" ? (
                <RowSkeletons label="Loading channels…" />
              ) : channelsState === "error" ? (
                <ErrorCard
                  title="We couldn't load channels"
                  onRetry={() => {
                    setChannelsState("loading");
                    void loadChannels().then((ok) => !ok && setChannelsState("error"));
                  }}
                />
              ) : channels.length === 0 ? (
                <EmptyState emoji="🌻" tint="butter" title="No channels yet" body="Channels will appear here once they're created by your school." />
              ) : (
                <ul className="flex flex-col gap-2">
                  {channels.map((ch) => (
                    <li key={ch.id}>
                      <ChannelRow channel={ch} selected={ch.id === activeChannelId} now={now} onOpen={(c) => navigate({ kind: "channel", id: c.id })} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* ─── Right pane ─── */}
        <section
          aria-label={activeChannel ? `#${activeChannel.name}` : isComposingNew ? "New Message" : active ? conversationTitle(active) : "Conversation"}
          className={`relative min-h-0 min-w-0 flex-1 flex-col bg-[var(--sf-cream)] md:flex ${mobileShowChat ? "flex" : "hidden"}`}
        >
          {activeChannel ? (
            <div className={`${browse} flex min-h-0 flex-1 flex-col ${CHANNEL_SKIN}`}>
              <ChannelChatArea
                key={activeChannel.id}
                channel={activeChannel}
                userId={userId}
                userRole="parent"
                gardenStyle
                readOnlyPreview={readOnlyPreview}
                onReadOnlyAttempt={() => void blockedByPreview()}
                onBack={() => navigate({ kind: "none" })}
                onMembershipChange={(channelId, isMember) => {
                  setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, isMember } : c)));
                }}
                onMessageSent={(channelId, lastMsg) => {
                  setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, lastMessage: lastMsg, unreadCount: 0 } : c)));
                }}
              />
            </div>
          ) : isComposingNew ? (
            <>
              <div className={`${browse} flex min-h-0 flex-1 flex-col`}>
                <ComposePane
                  userId={userId}
                  recipient={recipient}
                  onSelect={(r) => {
                    setRecipient(r);
                    requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
                  onRemove={() => {
                    setRecipient(null);
                    setPendingHouseholdStudentId(null);
                  }}
                  onBack={() => navigate({ kind: "none" })}
                  suggestedStaff={suggestedStaff}
                  staffLoading={staffLoading}
                />
              </div>
              <Composer
                textareaRef={textareaRef}
                value={draft}
                onChange={(v) => setComposer((c) => ({ ...c, draft: v }))}
                onSend={() => void handleSendNew()}
                placeholder={recipient ? "Type a message..." : "Select a recipient first..."}
                disabled={!recipient}
                busy={creatingConvo}
                canSend={!!recipient && hasContent && !creatingConvo}
                onPickImage={(f) => void pickImage(f)}
                onPickFile={(f) => setComposer((c) => ({ ...c, attachedFile: f }))}
                imagePreview={imagePreview}
                fileName={attachedFile?.name ?? null}
                onClearImage={clearImage}
                onClearFile={() => setComposer((c) => ({ ...c, attachedFile: null }))}
                status={creatingConvo ? "Opening the chat…" : null}
              />
            </>
          ) : activeId ? (
            <>
              <div className={browse}>
                <ThreadHeader
                  title={active ? conversationTitle(active) : "Conversation"}
                  subtitle={active ? conversationSubtitle(active) : null}
                  avatar={
                    <HeaderAvatar
                      id={active?.otherUser?.id ?? activeId}
                      name={active ? conversationTitle(active) : "Conversation"}
                      imageUrl={active?.otherUser?.profile_image_url ?? null}
                      group={!active || activeIsGroup}
                    />
                  }
                  onBack={() => navigate({ kind: "none" })}
                  members={members}
                />
              </div>
              <div
                ref={scrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
                }}
                onLoadCapture={() => {
                  const el = scrollRef.current;
                  if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
                }}
                className={`${browse} flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 sm:px-5`}
              >
                {threadState === "loading" && threadMessages.length === 0 ? (
                  <ThreadSkeleton />
                ) : threadState === "error" ? (
                  <div className="p-2">
                    <ErrorCard
                      title="We couldn't load this chat"
                      onRetry={() => {
                        setThread(null);
                        void loadThread(activeId);
                      }}
                    />
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
                    <HeaderAvatar
                      id={active?.otherUser?.id ?? activeId}
                      name={active ? conversationTitle(active) : "Conversation"}
                      imageUrl={active?.otherUser?.profile_image_url ?? null}
                      group={!active || activeIsGroup}
                    />
                    <p className="mt-1 text-base font-extrabold">No messages yet. Say hello!</p>
                    <p className="sf-hand text-lg text-[var(--sf-sage-deep)]">say hi 👋</p>
                  </div>
                ) : (
                  <ol className="mx-auto flex w-full max-w-3xl flex-col" role="log" aria-live="polite" aria-label="Messages">
                    {chatItems.map((item) => {
                      if (item.type === "day")
                        return (
                          <li key={item.key}>
                            <DaySeparator label={formatDayHeading(item.iso, now ?? new Date())} />
                          </li>
                        );
                      const msg = item.msg;
                      const mine = msg.sender_id === userId;
                      const senderName = msg.sender_name ?? nameById.get(msg.sender_id) ?? (active ? conversationTitle(active) : "");
                      const showName = activeIsGroup && !mine && item.groupStart;
                      const failed = msg.status === "failed";
                      const sending = msg.status === "sending";
                      return (
                        <li key={item.key} className={`flex flex-col ${item.groupStart ? "mt-3" : "mt-0.5"}`}>
                          {showName && senderName ? (
                            <span className="mb-1 ml-2 text-xs font-extrabold text-[var(--sf-sage-deep)]" aria-hidden="true">
                              {senderName}
                            </span>
                          ) : null}
                          <Bubble
                            mine={mine}
                            body={msg.body}
                            imageUrl={msg.image_url}
                            fileUrl={msg.file_url}
                            fileName={msg.file_name}
                            sending={sending}
                            failed={failed}
                            groupStart={item.groupStart}
                            groupEnd={item.groupEnd}
                            srPrefix={`${mine ? "You" : senderName || "They"} (${clock(msg.created_at)}):`}
                          />
                          {failed ? (
                            <MessageMeta mine failed onRetry={() => retrySend(activeId, msg.id)} />
                          ) : sending ? (
                            <MessageMeta mine text="Sending…" />
                          ) : item.groupEnd ? (
                            <MessageMeta
                              mine={mine}
                              text={`${clock(msg.created_at)}${msg.id === lastMineId ? (msg.read_at ? " · Seen" : " · Sent") : ""}`}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
              <Composer
                textareaRef={textareaRef}
                value={draft}
                onChange={(v) => setComposer((c) => ({ ...c, draft: v }))}
                onSend={handleSend}
                placeholder="Type a message..."
                canSend={hasContent}
                onPickImage={(f) => void pickImage(f)}
                onPickFile={(f) => setComposer((c) => ({ ...c, attachedFile: f }))}
                imagePreview={imagePreview}
                fileName={attachedFile?.name ?? null}
                onClearImage={clearImage}
                onClearFile={() => setComposer((c) => ({ ...c, attachedFile: null }))}
              />
            </>
          ) : noConversations ? (
            <div className={`${browse} flex-1 overflow-y-auto px-6 py-10`}>
              <ReachOut staff={suggestedStaff} onMessage={openCompose} />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="text-5xl" aria-hidden="true">
                💌
              </span>
              <p className="text-base font-extrabold text-[var(--sf-soft)]">Select a conversation or start a new one</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** "Who would you like to reach?" with teacher cards (shown when there are no conversations yet). */
function ReachOut({ staff, onMessage, compact = false }: { staff: TeacherOrAdmin[]; onMessage: (r: Recipient) => void; compact?: boolean }) {
  return (
    <div className={`mx-auto flex w-full flex-col gap-4 ${compact ? "" : "max-w-2xl"}`}>
      <div className="flex items-center gap-3 rounded-[24px] bg-[#fff3c4] p-4">
        <span className="text-3xl" aria-hidden="true">
          👋
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold">Who would you like to reach?</h2>
          <p className="text-sm font-semibold leading-snug text-[var(--sf-soft)]">
            Message your child&apos;s teachers and school staff directly from here.
          </p>
        </div>
      </div>
      {staff.length > 0 ? (
        <>
          <p className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">Start a conversation</p>
          <ul
            className={
              compact
                ? "-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide"
                : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {staff.map((person) => (
              <li
                key={person.id}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-[24px] bg-white p-4 text-center shadow-[0_14px_36px_-28px_rgba(43,42,38,0.55)] ring-1 ring-[var(--sf-ink)]/[0.06] ${
                  compact ? "w-[156px] shrink-0 snap-start" : ""
                }`}
              >
                <KidAvatar id={person.id} name={person.full_name} imageUrl={person.profile_image_url} size="h-[72px] w-[72px] text-xl" />
                <span className="mt-1.5 line-clamp-2 w-full text-[15px] font-extrabold">{person.full_name}</span>
                <span className="sf-hand mb-1.5 text-base text-[var(--sf-sage-deep)]">Teacher</span>
                <button
                  type="button"
                  onClick={() => onMessage({ id: person.id, full_name: person.full_name, profile_image_url: person.profile_image_url, role: person.role })}
                  className={`${btnInkSm} w-full`}
                  aria-label={`Message ${person.full_name}`}
                >
                  Message
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
