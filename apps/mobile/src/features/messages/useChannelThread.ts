// Community channel thread: messages, reactions, edit/delete, join/leave,
// members. Handlers return results; the Garden UI gives the feedback.
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteChannelMessage,
  editChannelMessage,
  getChannelMemberCount,
  getChannelMembers,
  getChannelMessages,
  getChannelMeta,
  getSenderProfile,
  joinChannel,
  leaveChannel,
  markChannelRead,
  sendChannelMessage,
  toggleReaction,
  uploadChannelMedia,
  type ChannelMember,
  type ChannelMessageRow,
  type ReactionSummary,
} from "@/lib/channel-actions";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PendingFile, PendingImage } from "./chatShared";
import type { Result } from "./messagingApi";

export const QUICK_EMOJIS = ["❤️", "🎉", "🙌", "👀", "💡", "✅"];

export type ChannelMessage = ChannelMessageRow & {
  status?: "sending" | "failed";
  draft?: { text: string; image: PendingImage | null; file: PendingFile | null };
};

export function useChannelThread() {
  const params = useLocalSearchParams<{
    channelId: string;
    channelName?: string;
    isMember?: string;
    isDefault?: string;
    memberCount?: string;
  }>();
  const channelId = params.channelId;
  const { isReadOnlyPreview } = useAuth();

  const [channelName, setChannelName] = useState(params.channelName ?? "");
  const [isDefault, setIsDefault] = useState(params.isDefault === "true");
  const [isMember, setIsMember] = useState(params.isMember === "true");
  const [memberCount, setMemberCount] = useState(parseInt(params.memberCount ?? "0", 10) || 0);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  /** Bumped when a message from someone else arrives (UI decides whether to scroll). */
  const [incomingTick, setIncomingTick] = useState(0);

  const uidRef = useRef<string | null>(null);
  const isMemberRef = useRef(isMember);
  useEffect(() => {
    isMemberRef.current = isMember;
  }, [isMember]);
  const messageIdsRef = useRef(new Set<string>());
  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages]);
  const senderCache = useRef(new Map<string, { sender_name: string; sender_image_url: string | null }>());
  const membersLoadedRef = useRef(false);

  const load = useCallback(async (): Promise<Result> => {
    if (!channelId) return { ok: false };
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      uidRef.current = user.id;
      setUserId(user.id);

      const [count, own, meta, msgs] = await Promise.all([
        getChannelMemberCount(channelId),
        supabase.schema("admin").from("users").select("full_name, profile_image_url").eq("id", user.id).maybeSingle(),
        // Opened from a notification (only channelId)? Resolve name + membership.
        !params.channelName || params.isMember === undefined ? getChannelMeta(channelId, user.id) : Promise.resolve(null),
        getChannelMessages(channelId, user.id),
      ]);
      setMemberCount(count);
      if (own.data) {
        senderCache.current.set(user.id, {
          sender_name: (own.data as { full_name?: string }).full_name ?? "You",
          sender_image_url: (own.data as { profile_image_url?: string | null }).profile_image_url ?? null,
        });
      }
      let member = isMemberRef.current;
      if (meta) {
        setChannelName(meta.name);
        setIsDefault(meta.is_default);
        setIsMember(meta.isMember);
        member = meta.isMember;
      }
      for (const m of msgs) {
        if (!senderCache.current.has(m.sender_id)) {
          senderCache.current.set(m.sender_id, { sender_name: m.sender_name, sender_image_url: m.sender_image_url });
        }
      }
      setMessages((prev) => [...msgs, ...prev.filter((m) => m.status)]);
      setLoading(false);
      if (member && !isReadOnlyPreview) void markChannelRead(channelId, user.id);
      return { ok: true };
    } catch (e) {
      notifyError("parent-channel-load", e);
      setError(e instanceof Error ? e.message : "Couldn't load this channel");
      setLoading(false);
      return { ok: false };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params are read once per channel
  }, [channelId, isReadOnlyPreview]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: inserts, edits, deletes, reactions.
  useEffect(() => {
    if (!channelId) return;
    const onInsert = async (payload: { new: Record<string, unknown> }) => {
      const raw = payload.new as unknown as Omit<ChannelMessageRow, "sender_name" | "sender_image_url" | "reactions">;
      let sender = senderCache.current.get(raw.sender_id);
      if (!sender) {
        const p = await getSenderProfile(raw.sender_id);
        sender = { sender_name: p?.full_name ?? "Unknown", sender_image_url: p?.profile_image_url ?? null };
        senderCache.current.set(raw.sender_id, sender);
      }
      const row: ChannelMessage = { ...raw, ...sender, reactions: [] };
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        if (row.sender_id === uidRef.current) {
          const i = prev.findIndex((m) => m.status === "sending" && m.body === (row.body ?? ""));
          if (i >= 0) return [...prev.slice(0, i), row, ...prev.slice(i + 1)];
        }
        return [...prev, row];
      });
      if (row.sender_id !== uidRef.current) {
        setIncomingTick((n) => n + 1);
        if (isMemberRef.current && uidRef.current && !isReadOnlyPreview) void markChannelRead(channelId, uidRef.current);
      }
    };
    const onUpdate = (payload: { new: Record<string, unknown> }) => {
      const raw = payload.new as { id: string; body: string };
      setMessages((prev) => prev.map((m) => (m.id === raw.id ? { ...m, body: raw.body } : m)));
    };
    const onDelete = (payload: { old: Record<string, unknown> }) => {
      const raw = payload.old as { id: string };
      setMessages((prev) => prev.filter((m) => m.id !== raw.id));
    };
    const onReaction = async (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const messageId = (payload.new?.message_id ?? payload.old?.message_id) as string | undefined;
      // Ignore reactions on messages that aren't in this channel's list.
      if (!messageId || !uidRef.current || !messageIdsRef.current.has(messageId)) return;
      const { data } = await supabase.schema("messaging").from("message_reactions").select("user_id, emoji").eq("message_id", messageId);
      if (!data) return;
      const map = new Map<string, ReactionSummary>();
      for (const r of data as { user_id: string; emoji: string }[]) {
        const e = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false };
        e.count++;
        if (r.user_id === uidRef.current) e.reactedByMe = true;
        map.set(r.emoji, e);
      }
      const reactions = [...map.values()];
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };
    const sub = supabase
      .channel(`channel-messages:${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, (p) => void onInsert(p))
      .on("postgres_changes", { event: "UPDATE", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, onUpdate)
      .on("postgres_changes", { event: "DELETE", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channelId}` }, onDelete)
      .on("postgres_changes", { event: "*", schema: "messaging", table: "message_reactions" }, (p) => void onReaction(p))
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [channelId, isReadOnlyPreview]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const deliver = useCallback(
    async (tempId: string, draft: NonNullable<ChannelMessage["draft"]>): Promise<Result> => {
      const uid = uidRef.current;
      if (!uid || !channelId) return { ok: false };
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "sending" } : m)));
      setSending(true);
      try {
        let imageUrl: string | null = null;
        let fileUrl: string | null = null;
        let fileName: string | null = null;
        if (draft.image) {
          imageUrl = await uploadChannelMedia("message-images", draft.image.uri, draft.image.mimeType, channelId, uid, draft.image.fileName);
        } else if (draft.file) {
          fileUrl = await uploadChannelMedia("message-files", draft.file.uri, draft.file.mimeType, channelId, uid, draft.file.name);
          fileName = draft.file.name;
        }
        const real = await sendChannelMessage(channelId, draft.text, uid, imageUrl, fileUrl, fileName);
        if (!real) throw new Error("Send failed");
        setMessages((prev) =>
          prev.some((m) => m.id === real.id) ? prev.filter((m) => m.id !== tempId) : prev.map((m) => (m.id === tempId ? real : m)),
        );
        return { ok: true };
      } catch (e) {
        notifyError("parent-channel-send", e);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
        return { ok: false };
      } finally {
        setSending(false);
      }
    },
    [channelId],
  );

  const send = useCallback(async (): Promise<Result & { tempId?: string }> => {
    const text = inputText.trim();
    const uid = uidRef.current;
    if ((!text && !pendingImage && !pendingFile) || !uid || !channelId) return { ok: false };
    const draft = { text, image: pendingImage, file: pendingFile };
    const me = senderCache.current.get(uid);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        channel_id: channelId,
        sender_id: uid,
        sender_name: me?.sender_name ?? "You",
        sender_image_url: me?.sender_image_url ?? null,
        body: text,
        image_url: pendingImage?.uri ?? null,
        file_url: null,
        file_name: pendingFile?.name ?? null,
        created_at: new Date().toISOString(),
        reactions: [],
        status: "sending",
        draft,
      },
    ]);
    setInputText("");
    setPendingImage(null);
    setPendingFile(null);
    const r = await deliver(tempId, draft);
    return { ...r, tempId };
  }, [inputText, pendingImage, pendingFile, channelId, deliver]);

  const retry = useCallback(
    async (tempId: string) => {
      const m = messages.find((x) => x.id === tempId);
      if (!m?.draft) return { ok: false };
      return deliver(tempId, m.draft);
    },
    [messages, deliver],
  );

  // ── Reactions (optimistic) ─────────────────────────────────────────────────
  const react = useCallback(
    async (messageId: string, emoji: string): Promise<Result> => {
      const uid = uidRef.current;
      if (!uid || !isMemberRef.current) return { ok: false };
      const before = messages.find((m) => m.id === messageId)?.reactions ?? [];
      const optimistic = (() => {
        const list = before.map((r) => ({ ...r }));
        const e = list.find((r) => r.emoji === emoji);
        if (e?.reactedByMe) {
          e.count--;
          e.reactedByMe = false;
          return list.filter((r) => r.count > 0);
        }
        if (e) {
          e.count++;
          e.reactedByMe = true;
          return list;
        }
        return [...list, { emoji, count: 1, reactedByMe: true }];
      })();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: optimistic } : m)));
      const updated = await toggleReaction(messageId, emoji, uid);
      if (!updated) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: before } : m)));
        return { ok: false };
      }
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: updated } : m)));
      return { ok: true };
    },
    [messages],
  );

  // ── Edit / delete ──────────────────────────────────────────────────────────
  const startEdit = useCallback((m: ChannelMessage) => {
    setEditingId(m.id);
    setEditingText(m.body);
  }, []);
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText("");
  }, []);
  const saveEdit = useCallback(async (): Promise<Result> => {
    const text = editingText.trim();
    if (!editingId || !text) return { ok: false };
    setSavingEdit(true);
    const ok = await editChannelMessage(editingId, text);
    setSavingEdit(false);
    if (!ok) return { ok: false }; // stay in edit mode so nothing is lost
    setMessages((prev) => prev.map((m) => (m.id === editingId ? { ...m, body: text } : m)));
    setEditingId(null);
    setEditingText("");
    return { ok: true };
  }, [editingId, editingText]);

  const deleteMessage = useCallback(async (id: string): Promise<Result> => {
    const ok = await deleteChannelMessage(id);
    if (ok) setMessages((prev) => prev.filter((m) => m.id !== id));
    return { ok };
  }, []);

  // ── Membership ─────────────────────────────────────────────────────────────
  const join = useCallback(async (): Promise<Result> => {
    const uid = uidRef.current;
    if (!uid || joining || !channelId) return { ok: false };
    setJoining(true);
    const ok = await joinChannel(channelId, uid);
    setJoining(false);
    if (!ok) return { ok: false };
    setIsMember(true);
    setMemberCount((c) => c + 1);
    membersLoadedRef.current = false; // refresh the members list next time
    void markChannelRead(channelId, uid);
    return { ok: true };
  }, [channelId, joining]);

  const leave = useCallback(async (): Promise<Result> => {
    const uid = uidRef.current;
    if (!uid || !channelId) return { ok: false };
    const ok = await leaveChannel(channelId, uid);
    return { ok };
  }, [channelId]);

  const loadMembers = useCallback(async () => {
    if (membersLoadedRef.current || !channelId) return;
    setMembersLoading(true);
    try {
      setMembers(await getChannelMembers(channelId));
      membersLoadedRef.current = true;
    } finally {
      setMembersLoading(false);
    }
  }, [channelId]);

  return {
    channelId,
    channelName,
    isDefault,
    isMember,
    memberCount,
    messages,
    loading,
    error,
    retryLoad: load,
    userId,
    inputText,
    setInputText,
    pendingImage,
    setPendingImage,
    pendingFile,
    setPendingFile,
    sending,
    send,
    retry,
    react,
    editingId,
    editingText,
    setEditingText,
    savingEdit,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteMessage,
    joining,
    join,
    leave,
    members,
    membersLoading,
    loadMembers,
    incomingTick,
    isReadOnlyPreview,
  };
}

export type ChannelThread = ReturnType<typeof useChannelThread>;
