// Messages inbox (parents and staff): DMs + community channels, realtime, search.
// Audience and routes come from MessagingRoutesProvider (default: parent).
import { useAuth } from "@/contexts/AuthContext";
import {
  createChannel as createChannelRow,
  ensureDefaultChannelMembership,
  getChannels,
  type ChannelWithMeta,
} from "@/lib/channel-actions";
import { notifyError } from "@/lib/discord";
import { fetchParentVisibleTeachers } from "@/lib/parent-visible-teachers";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ATTACHMENT_PREVIEW,
  fetchConversationRows,
  findOrCreateConversation,
  type ConversationRow,
  type Result,
  type TeacherSuggestion,
} from "./messagingApi";
import { useMessagingRoutes } from "./messagingRoutes";

export type InboxTab = "dm" | "community";
type LoadMode = "initial" | "quiet" | "refresh";

export function useInbox() {
  const router = useRouter();
  const routes = useMessagingRoutes();
  const isStaff = routes.audience === "staff";
  const { parentViewUserId, isReadOnlyPreview: parentPreview } = useAuth();
  // Read-only preview is a parent-side concept (an admin viewing as a parent).
  const isReadOnlyPreview = !isStaff && parentPreview;
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<InboxTab>(tabParam === "community" ? "community" : "dm");
  useEffect(() => {
    if (tabParam === "community") setActiveTab("community");
  }, [tabParam]);

  // DMs
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<TeacherSuggestion[]>([]);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);
  const messagingUserIdRef = useRef<string | null>(null);
  const loadedOnce = useRef(false);

  // Channels (as the signed-in user, like before)
  const [channelUserId, setChannelUserId] = useState<string | null>(null);
  const channelUserIdRef = useRef<string | null>(null);
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsRefreshing, setChannelsRefreshing] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const channelsLoadedOnce = useRef(false);

  const loadDMs = useCallback(
    async (mode: LoadMode): Promise<Result> => {
      if (mode === "refresh") setRefreshing(true);
      else if (mode === "initial") setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id && channelUserIdRef.current !== user.id) {
          channelUserIdRef.current = user.id;
          setChannelUserId(user.id);
        }
        const uid = (isStaff ? null : parentViewUserId) ?? user?.id ?? null;
        if (!uid) throw new Error("Not authenticated");
        messagingUserIdRef.current = uid;
        setMessagingUserId(uid);
        const r = await fetchConversationRows(uid);
        if (!r.ok) throw new Error(r.error);
        setRows(r.rows);
        setError(null);
        if (!isStaff && !isReadOnlyPreview && r.rows.length === 0) setTeachers(await fetchParentVisibleTeachers());
        else setTeachers([]);
        loadedOnce.current = true;
        return { ok: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't load conversations";
        if (!loadedOnce.current) setError(msg);
        return { ok: false, error: msg };
      } finally {
        if (mode === "refresh") setRefreshing(false);
        setLoading(false);
      }
    },
    [isStaff, parentViewUserId, isReadOnlyPreview],
  );

  const loadChannels = useCallback(async (mode: LoadMode): Promise<Result> => {
    const uid = channelUserIdRef.current;
    if (!uid) return { ok: false };
    if (mode === "refresh") setChannelsRefreshing(true);
    else if (mode === "initial") setChannelsLoading(true);
    try {
      await ensureDefaultChannelMembership(uid);
      const data = await getChannels(uid);
      setChannels(data);
      setChannelsError(null);
      channelsLoadedOnce.current = true;
      return { ok: true };
    } catch (e) {
      notifyError(isStaff ? "staff-messages-channels" : "parent-messages-channels", e);
      const msg = e instanceof Error ? e.message : "Couldn't load channels";
      if (!channelsLoadedOnce.current) setChannelsError(msg);
      return { ok: false, error: msg };
    } finally {
      if (mode === "refresh") setChannelsRefreshing(false);
      setChannelsLoading(false);
    }
  }, [isStaff]);

  // Quiet refresh on every focus; skeletons only on the very first load.
  useFocusEffect(
    useCallback(() => {
      void loadDMs(loadedOnce.current ? "quiet" : "initial");
      if (channelsLoadedOnce.current) void loadChannels("quiet");
    }, [loadDMs, loadChannels]),
  );

  // First channel load as soon as we know the signed-in user.
  useEffect(() => {
    if (channelUserId && !channelsLoadedOnce.current) void loadChannels("initial");
  }, [channelUserId, loadChannels]);

  // Realtime: DM previews / unread, and pick up brand-new conversations.
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!messagingUserId) return;
    const ch = supabase
      .channel("conversation-list-updates")
      .on("postgres_changes", { event: "INSERT", schema: "messaging", table: "messages" }, (payload) => {
        const msg = payload.new as {
          conversation_id: string;
          sender_id: string;
          body: string | null;
          created_at: string;
        };
        let known = true;
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === msg.conversation_id);
          if (idx === -1) {
            known = false;
            return prev;
          }
          const updated = {
            ...prev[idx],
            lastMessagePreview: msg.body || ATTACHMENT_PREVIEW,
            updatedAt: msg.created_at,
            unreadCount: msg.sender_id !== messagingUserId ? prev[idx].unreadCount + 1 : prev[idx].unreadCount,
          };
          const next = [...prev];
          next.splice(idx, 1);
          return [updated, ...next];
        });
        if (!known) {
          if (reloadTimer.current) clearTimeout(reloadTimer.current);
          reloadTimer.current = setTimeout(() => void loadDMs("quiet"), 600);
        }
      })
      .subscribe();
    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      void supabase.removeChannel(ch);
    };
  }, [messagingUserId, loadDMs]);

  // Realtime: community, on both tabs so the badge stays honest.
  useEffect(() => {
    if (!channelUserId) return;
    const sub = supabase
      .channel("community-tab-updates")
      .on("postgres_changes", { event: "INSERT", schema: "messaging", table: "channel_messages" }, (payload) => {
        const msg = payload.new as { channel_id: string; sender_id: string; body: string; created_at: string };
        setChannels((prev) =>
          prev.map((c) =>
            c.id !== msg.channel_id
              ? c
              : {
                  ...c,
                  lastMessage: { body: msg.body, created_at: msg.created_at, sender_id: msg.sender_id },
                  unreadCount: c.isMember && msg.sender_id !== channelUserId ? c.unreadCount + 1 : c.unreadCount,
                },
          ),
        );
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [channelUserId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? rows.filter((r) => r.otherUserName.toLowerCase().includes(q)) : rows;
  }, [rows, searchQuery]);

  const dmUnread = rows.reduce((s, r) => s + r.unreadCount, 0);
  const communityUnread = channels.reduce((s, c) => s + (c.isMember ? c.unreadCount : 0), 0);

  const openConversation = useCallback(
    (item: ConversationRow) => {
      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, unreadCount: 0 } : r)));
      router.push({
        pathname: routes.thread,
        params: {
          id: item.id,
          otherUserName: item.otherUserName,
          otherUserAvatar: item.otherUserProfileImageUrl ?? "",
          otherUserId: item.otherUserId,
          isGroup: item.isGroup ? "true" : "false",
        },
      });
    },
    [router, routes.thread],
  );

  const openChannel = useCallback(
    (c: ChannelWithMeta) => {
      setChannels((prev) => prev.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));
      router.push({
        pathname: routes.channel,
        params: {
          channelId: c.id,
          channelName: c.name,
          isMember: c.isMember ? "true" : "false",
          isDefault: c.is_default ? "true" : "false",
          memberCount: String(c.memberCount),
        },
      });
    },
    [router, routes.channel],
  );

  const startConversation = useCallback(
    async (teacher: TeacherSuggestion): Promise<Result> => {
      if (startingId) return { ok: true };
      setStartingId(teacher.id);
      const r = await findOrCreateConversation(teacher.id);
      setStartingId(null);
      if (!r.ok) return { ok: false, error: r.error };
      router.push({
        pathname: routes.thread,
        params: {
          id: r.conversationId,
          otherUserName: teacher.full_name,
          otherUserAvatar: teacher.profile_image_url ?? "",
          otherUserId: teacher.id,
        },
      });
      return { ok: true };
    },
    [router, routes.thread, startingId],
  );

  /** Staff: create a channel (creator joins it), refresh the list, return its id. */
  const [creatingChannel, setCreatingChannel] = useState(false);
  const createChannel = useCallback(
    async (name: string, description: string): Promise<Result & { channelId?: string }> => {
      const uid = channelUserIdRef.current;
      const n = name.trim();
      if (!uid || !n) return { ok: false };
      setCreatingChannel(true);
      try {
        const channelId = await createChannelRow(n, description.trim() || null, uid);
        if (!channelId) return { ok: false, error: "Couldn't create the channel" };
        void loadChannels("quiet");
        return { ok: true, channelId };
      } catch (e) {
        notifyError("staff-messages-create-channel", e);
        return { ok: false, error: e instanceof Error ? e.message : undefined };
      } finally {
        setCreatingChannel(false);
      }
    },
    [loadChannels],
  );

  /** Open a channel the user just created (they're its only member). */
  const openCreatedChannel = useCallback(
    (channelId: string, name: string) => {
      router.push({
        pathname: routes.channel,
        params: { channelId, channelName: name.trim(), isMember: "true", isDefault: "false", memberCount: "1" },
      });
    },
    [router, routes.channel],
  );

  return {
    router,
    routes,
    isStaff,
    isReadOnlyPreview,
    activeTab,
    setActiveTab,
    rows,
    filtered,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    teachers,
    startingId,
    channels,
    channelsLoading,
    channelsRefreshing,
    channelsError,
    dmUnread,
    communityUnread,
    loadDMs,
    loadChannels,
    openConversation,
    openChannel,
    startConversation,
    creatingChannel,
    createChannel,
    openCreatedChannel,
  };
}

export type Inbox = ReturnType<typeof useInbox>;
