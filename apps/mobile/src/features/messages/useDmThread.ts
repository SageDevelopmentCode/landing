// Direct-message thread: paging, realtime, optimistic send with retry,
// read receipts. Handlers return results; the Garden UI gives feedback.
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type PendingFile, type PendingImage, uploadDmAttachment } from "./chatShared";
import type { Result } from "./messagingApi";

const PAGE_SIZE = 30;

export type DmMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  read_at: string | null;
  /** Local-only optimistic state. */
  status?: "sending" | "failed";
  /** Local-only: what to resend on retry. */
  draft?: { text: string; image: PendingImage | null; file: PendingFile | null };
};

export function useDmThread() {
  const { id, otherUserName, otherUserAvatar, otherUserId, isGroup: isGroupParam } = useLocalSearchParams<{
    id: string;
    otherUserName?: string;
    otherUserAvatar?: string;
    otherUserId?: string;
    isGroup?: string;
  }>();
  const { parentViewUserId, isReadOnlyPreview } = useAuth();

  const [name, setName] = useState(otherUserName ?? "");
  const [avatar, setAvatar] = useState(otherUserAvatar ?? "");
  const [otherId, setOtherId] = useState(otherUserId ?? "");
  const [isGroup, setIsGroup] = useState(isGroupParam === "true");
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [signedInId, setSignedInId] = useState<string | null>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [sending, setSending] = useState(false);

  const signedInRef = useRef<string | null>(null);
  const messagesRef = useRef<DmMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const loadingMoreRef = useRef(false);
  const focusedRef = useRef(false);

  /** A message is "mine" when sent by me or by the parent account I'm viewing. */
  const isMine = useCallback(
    (senderId: string) => senderId === signedInId || (!!parentViewUserId && senderId === parentViewUserId),
    [signedInId, parentViewUserId],
  );

  const markRead = useCallback(async () => {
    const uid = signedInRef.current;
    if (!uid || isReadOnlyPreview || !id) return;
    await supabase
      .schema("messaging")
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .neq("sender_id", uid)
      .is("read_at", null);
  }, [id, isReadOnlyPreview]);

  const load = useCallback(async (): Promise<Result> => {
    if (!id) return { ok: false };
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      signedInRef.current = user.id;
      setSignedInId(user.id);

      // Fill in the header when we arrived without params (e.g. a notification).
      if (!otherUserId || !otherUserName) {
        const listUser = parentViewUserId ?? user.id;
        const { data: convs } = await supabase.rpc("get_conversation_list", { p_user_id: listUser });
        const match = (convs as Record<string, unknown>[] | null)?.find((c) => c.id === id);
        if (match) {
          if (!otherUserName) setName((match.other_user_name as string) ?? "");
          if (!otherUserId) {
            setOtherId((match.other_user_id as string) ?? "");
            if (match.other_user_profile_image) setAvatar(match.other_user_profile_image as string);
          }
          setIsGroup(Boolean(match.is_group));
        }
      }

      const [{ data: meta }, { data, error: msgErr }] = await Promise.all([
        supabase.schema("messaging").from("conversations").select("kind").eq("id", id).maybeSingle(),
        supabase
          .schema("messaging")
          .from("messages")
          .select("*")
          .eq("conversation_id", id)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
      ]);
      if (msgErr) throw msgErr;
      if (meta?.kind === "household_teacher") setIsGroup(true);

      if (otherUserId) {
        const { data: profile } = await supabase
          .schema("admin")
          .from("users")
          .select("profile_image_url")
          .eq("id", otherUserId)
          .maybeSingle();
        if (profile?.profile_image_url) setAvatar(profile.profile_image_url);
      }

      const rows = ([...(data ?? [])] as DmMessage[]).reverse();
      setMessages((prev) => [...rows, ...prev.filter((m) => m.status)]);
      setHasMore((data ?? []).length === PAGE_SIZE);
      setLoading(false);
      if (focusedRef.current) void markRead();
      return { ok: true };
    } catch (e) {
      notifyError("parent-dm-load", e);
      setError(e instanceof Error ? e.message : "Couldn't load messages");
      setLoading(false);
      return { ok: false };
    }
  }, [id, otherUserId, otherUserName, parentViewUserId, markRead]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sender names for group threads — fetched for any sender we haven't seen.
  useEffect(() => {
    if (!isGroup) return;
    const missing = [...new Set(messages.map((m) => m.sender_id))].filter((s) => !(s in senderNames));
    if (!missing.length) return;
    void supabase
      .schema("admin")
      .from("users")
      .select("id, full_name")
      .in("id", missing)
      .then(({ data }) => {
        setSenderNames((prev) => {
          const next = { ...prev };
          for (const s of missing) next[s] = "Unknown";
          for (const u of data ?? []) next[u.id] = u.full_name ?? "Unknown";
          return next;
        });
      });
  }, [isGroup, messages, senderNames]);

  const loadMore = useCallback(async () => {
    const real = messagesRef.current.filter((m) => !m.status);
    if (!hasMore || loadingMoreRef.current || real.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const { data } = await supabase
      .schema("messaging")
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .lt("created_at", real[0].created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (data) {
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...([...data].reverse() as DmMessage[]).filter((m) => !seen.has(m.id)), ...prev];
      });
      setHasMore(data.length === PAGE_SIZE);
    }
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [hasMore, id]);

  // Realtime: new messages + read receipts.
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const incoming = payload.new as DmMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // My own message echoing back: swap it in for its optimistic copy.
            if (incoming.sender_id === signedInRef.current) {
              const i = prev.findIndex((m) => m.status === "sending" && m.body === (incoming.body ?? ""));
              if (i >= 0) return [...prev.slice(0, i), incoming, ...prev.slice(i + 1)];
            }
            return [...prev, incoming];
          });
          if (incoming.sender_id !== signedInRef.current && focusedRef.current) void markRead();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "messaging", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const u = payload.new as DmMessage;
          setMessages((prev) => prev.map((m) => (m.id === u.id ? { ...m, read_at: u.read_at, body: u.body } : m)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [id, markRead]);

  // Mark read whenever the thread gains focus.
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      void markRead();
      return () => {
        focusedRef.current = false;
      };
    }, [markRead]),
  );

  /** Send (or resend) a message optimistically. */
  const deliver = useCallback(
    async (tempId: string, draft: NonNullable<DmMessage["draft"]>): Promise<Result> => {
      const uid = signedInRef.current;
      if (!uid || !id) return { ok: false };
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "sending" } : m)));
      setSending(true);
      try {
        let imageUrl: string | null = null;
        let fileUrl: string | null = null;
        let fileName: string | null = null;
        if (draft.image) {
          imageUrl = await uploadDmAttachment("message-images", uid, id, draft.image.uri, draft.image.fileName, draft.image.mimeType);
        } else if (draft.file) {
          fileUrl = await uploadDmAttachment("message-files", uid, id, draft.file.uri, draft.file.name, draft.file.mimeType);
          fileName = draft.file.name;
        }
        const { data, error: insErr } = await supabase
          .schema("messaging")
          .from("messages")
          .insert({
            conversation_id: id,
            sender_id: uid,
            body: draft.text || "",
            image_url: imageUrl,
            file_url: fileUrl,
            file_name: fileName,
          })
          .select("*")
          .single();
        if (insErr || !data) throw insErr ?? new Error("Insert failed");
        const real = data as DmMessage;
        setMessages((prev) =>
          prev.some((m) => m.id === real.id)
            ? prev.filter((m) => m.id !== tempId)
            : prev.map((m) => (m.id === tempId ? real : m)),
        );
        return { ok: true };
      } catch (e) {
        notifyError("parent-send-message", e);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
        return { ok: false, error: e instanceof Error ? e.message : undefined };
      } finally {
        setSending(false);
      }
    },
    [id],
  );

  const send = useCallback(async (): Promise<Result & { tempId?: string }> => {
    const text = inputText.trim();
    const uid = signedInRef.current;
    if ((!text && !pendingImage && !pendingFile) || !uid || !id) return { ok: false };
    const draft = { text, image: pendingImage, file: pendingFile };
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversation_id: id,
        sender_id: uid,
        body: text,
        image_url: pendingImage?.uri ?? null,
        file_url: null,
        file_name: pendingFile?.name ?? null,
        created_at: new Date().toISOString(),
        read_at: null,
        status: "sending",
        draft,
      },
    ]);
    setInputText("");
    setPendingImage(null);
    setPendingFile(null);
    const r = await deliver(tempId, draft);
    return { ...r, tempId };
  }, [inputText, pendingImage, pendingFile, id, deliver]);

  const retry = useCallback(
    async (tempId: string): Promise<Result> => {
      const msg = messagesRef.current.find((m) => m.id === tempId);
      if (!msg?.draft) return { ok: false };
      return deliver(tempId, msg.draft);
    },
    [deliver],
  );

  const discard = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  /** Id of my newest delivered message, for the "Seen" / "Sent" label. */
  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (isMine(m.sender_id) && !m.status) return m.id;
      if (!isMine(m.sender_id)) return null;
    }
    return null;
  }, [messages, isMine]);

  return {
    id,
    name,
    avatar,
    otherId,
    isGroup,
    messages,
    loading,
    error,
    retryLoad: load,
    hasMore,
    loadingMore,
    loadMore,
    isMine,
    senderNames,
    inputText,
    setInputText,
    pendingImage,
    setPendingImage,
    pendingFile,
    setPendingFile,
    sending,
    send,
    retry,
    discard,
    lastMineId,
    isReadOnlyPreview,
  };
}

export type DmThread = ReturnType<typeof useDmThread>;
