import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import {
  getChannels,
  ensureDefaultChannelMembership,
  type ChannelWithMeta,
} from "@/lib/channel-actions";
import { Brand, FontFamilies } from "@/constants/theme";
import { useAuth, useReadOnlyPreview } from "@/contexts/AuthContext";

type ConversationRow = {
  id: string;
  updatedAt: string;
  otherUserId: string;
  otherUserName: string;
  otherUserProfileImageUrl: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
};

type TeacherSuggestion = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d}d`;
}

async function fetchTeachers(): Promise<TeacherSuggestion[]> {
  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("role", ["teacher", "super_admin"])
    .order("full_name", { ascending: true });
  return (data ?? []) as TeacherSuggestion[];
}

async function fetchRows(userId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabase.rpc("get_conversation_list", {
    p_user_id: userId,
  });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id,
    updatedAt: r.last_message_at,
    otherUserId: r.other_user_id ?? "",
    otherUserName: r.other_user_name ?? "Unknown",
    otherUserProfileImageUrl: r.other_user_profile_image ?? null,
    lastMessagePreview: r.last_message_preview ?? null,
    unreadCount: Number(r.unread_count ?? 0),
  }));
}

export default function ConversationListScreen() {
  const router = useRouter();
  const { parentViewUserId, isReadOnlyPreview } = useAuth();

  // DM state
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherSuggestion[]>([]);
  const [startingConv, setStartingConv] = useState(false);

  // Tab state
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"dm" | "community">(
    tabParam === "community" ? "community" : "dm"
  );

  useEffect(() => {
    if (tabParam === "community") setActiveTab("community");
  }, [tabParam]);

  // Community state
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsRefreshing, setChannelsRefreshing] = useState(false);
  const channelsLoadedRef = useRef(false);

  const loadDMs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const messagingUserId = parentViewUserId ?? user?.id ?? null;
    if (messagingUserId) {
      setCurrentUserId(messagingUserId);
      currentUserIdRef.current = messagingUserId;
      const built = await fetchRows(messagingUserId);
      setRows(built);
      if (!isReadOnlyPreview && built.length === 0) {
        const suggestions = await fetchTeachers();
        setTeachers(suggestions);
      } else {
        setTeachers([]);
      }
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [parentViewUserId, isReadOnlyPreview]);

  const loadChannelsList = useCallback(async (isRefresh = false) => {
    const uid = currentUserIdRef.current;
    if (!uid) return;
    if (isRefresh) setChannelsRefreshing(true);
    else setChannelsLoading(true);

    await ensureDefaultChannelMembership(uid);
    const data = await getChannels(uid);
    setChannels(data);

    if (isRefresh) setChannelsRefreshing(false);
    else setChannelsLoading(false);
  }, []);

  async function handleStartConversation(teacher: TeacherSuggestion) {
    if (isReadOnlyPreview) return;
    if (!currentUserIdRef.current || startingConv) return;
    setStartingConv(true);
    try {
      const { data: conversationId, error } = await supabase
        .rpc("find_or_create_conversation", { other_user_id: teacher.id });

      if (error) { notifyError("parent-messages-start-conversation", error); return; }

      if (conversationId) {
        router.push({
          pathname: "/(tabs)/messages/[id]",
          params: {
            id: conversationId,
            otherUserName: teacher.full_name,
            otherUserAvatar: teacher.profile_image_url ?? "",
            otherUserId: teacher.id,
          },
        });
      }
    } catch (e) {
      notifyError("parent-messages-start-conversation", e);
    } finally {
      setStartingConv(false);
    }
  }

  useFocusEffect(useCallback(() => { loadDMs(); }, [loadDMs]));

  // Load channels as soon as we have a user ID so the unread badge is available on the DM tab
  useEffect(() => {
    if (currentUserId && !channelsLoadedRef.current) {
      channelsLoadedRef.current = true;
      loadChannelsList();
    }
  }, [currentUserId, loadChannelsList]);

  // DM real-time subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("conversation-list-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "messages" },
        (payload) => {
          const msg = payload.new as {
            id: string; conversation_id: string; sender_id: string;
            body: string; created_at: string;
          };

          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === msg.conversation_id);
            if (idx === -1) return prev;

            const updated = {
              ...prev[idx],
              lastMessagePreview: msg.body,
              updatedAt: msg.created_at,
              unreadCount:
                msg.sender_id !== currentUserId
                  ? prev[idx].unreadCount + 1
                  : prev[idx].unreadCount,
            };

            const next = [...prev];
            next.splice(idx, 1);
            return [updated, ...next];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Community tab real-time subscription
  useEffect(() => {
    if (activeTab !== "community" || !currentUserId) return;

    const sub = supabase
      .channel("community-tab-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "channel_messages" },
        (payload) => {
          const msg = payload.new as {
            id: string; channel_id: string; sender_id: string;
            body: string; created_at: string;
          };

          setChannels((prev) =>
            prev.map((ch) => {
              if (ch.id !== msg.channel_id) return ch;
              return {
                ...ch,
                lastMessage: { body: msg.body, created_at: msg.created_at, sender_id: msg.sender_id },
                unreadCount:
                  ch.isMember && msg.sender_id !== currentUserId
                    ? ch.unreadCount + 1
                    : ch.unreadCount,
              };
            })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeTab, currentUserId]);

  const filtered = searchQuery.trim()
    ? rows.filter((r) => r.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()))
    : rows;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Messages</Text>
        {activeTab === "dm" && !isReadOnlyPreview && (
          <Pressable
            onPress={() => router.push("/(tabs)/messages/compose")}
            style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={24} color={Brand.sage700} />
          </Pressable>
        )}
      </View>

      {/* Tab switcher */}
      {(() => {
        const totalCommunityUnread = channels.reduce(
          (sum, ch) => sum + (ch.isMember ? ch.unreadCount : 0), 0
        );
        return (
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabBtn, activeTab === "dm" && styles.tabBtnActive]}
              onPress={() => setActiveTab("dm")}
            >
              <Text style={[styles.tabBtnText, activeTab === "dm" && styles.tabBtnTextActive]}>
                Direct Messages
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === "community" && styles.tabBtnActive]}
              onPress={() => setActiveTab("community")}
            >
              <View style={styles.tabBtnInner}>
                <Text style={[styles.tabBtnText, activeTab === "community" && styles.tabBtnTextActive]}>
                  Community
                </Text>
                {totalCommunityUnread > 0 && activeTab !== "community" && (
                  <View style={styles.communityDot} />
                )}
              </View>
            </Pressable>
          </View>
        );
      })()}

      {/* DM tab */}
      {activeTab === "dm" && (
        <>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations"
              placeholderTextColor="#9ca3af"
              clearButtonMode="while-editing"
            />
          </View>

          {loading ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}>
                    <SkeletonBox width={48} height={48} borderRadius={24} style={{ flexShrink: 0 }} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <SkeletonBox width="55%" height={13} borderRadius={4} />
                        <SkeletonBox width={32} height={11} borderRadius={4} />
                      </View>
                      <SkeletonBox width="75%" height={12} borderRadius={4} />
                    </View>
                  </View>
                  {i < 4 && <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 60 }} />}
                </View>
              ))}
            </View>
          ) : filtered.length === 0 ? (
            teachers.length > 0 ? (
              <ScrollView contentContainerStyle={styles.suggestionsContainer}>
                <View style={styles.suggestionsIntro}>
                  <Text style={styles.suggestionsIntroTitle}>Who would you like to reach?</Text>
                  <Text style={styles.suggestionsIntroBody}>Message your child's teachers directly from here.</Text>
                </View>
                <Text style={styles.suggestionsHeader}>START A CONVERSATION</Text>
                {teachers.map((teacher, index) => (
                  <View key={teacher.id}>
                    <View style={styles.suggestionRow}>
                      {teacher.profile_image_url ? (
                        <Image source={{ uri: teacher.profile_image_url }} style={styles.avatar} resizeMode="cover" />
                      ) : (
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{getInitials(teacher.full_name)}</Text>
                        </View>
                      )}
                      <View style={styles.suggestionInfo}>
                        <Text style={styles.suggestionName}>{teacher.full_name}</Text>
                        <Text style={styles.suggestionRole}>Teacher</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.messageButton, pressed && { opacity: 0.7 }]}
                        onPress={() => handleStartConversation(teacher)}
                        disabled={startingConv}
                      >
                        <Text style={styles.messageButtonText}>Message</Text>
                      </Pressable>
                    </View>
                    {index < teachers.length - 1 && <View style={styles.suggestionSeparator} />}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.centered}>
                <View style={styles.emptyCard}>
                  <Ionicons name="chatbubbles-outline" size={32} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.emptyBody}>Tap the compose button to start a conversation.</Text>
                </View>
              </View>
            )
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadDMs(true)} tintColor={Brand.sage700} />
              }
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => {
                    setRows((prev) => prev.map((r) => r.id === item.id ? { ...r, unreadCount: 0 } : r));
                    router.push({
                      pathname: "/(tabs)/messages/[id]",
                      params: {
                        id: item.id,
                        otherUserName: item.otherUserName,
                        otherUserAvatar: item.otherUserProfileImageUrl ?? "",
                        otherUserId: item.otherUserId,
                      },
                    });
                  }}
                >
                  {item.otherUserProfileImageUrl ? (
                    <Image source={{ uri: item.otherUserProfileImageUrl }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(item.otherUserName)}</Text>
                    </View>
                  )}
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowName} numberOfLines={1}>{item.otherUserName}</Text>
                      <Text style={styles.rowTime}>{timeAgo(item.updatedAt)}</Text>
                    </View>
                    <View style={styles.rowBottom}>
                      <Text style={styles.rowPreview} numberOfLines={1}>
                        {item.lastMessagePreview ?? "No messages yet"}
                      </Text>
                      {item.unreadCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      {/* Community tab */}
      {activeTab === "community" && (
        <>
          {channelsLoading ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}>
                    <SkeletonBox width={44} height={44} borderRadius={22} style={{ flexShrink: 0 }} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <SkeletonBox width="45%" height={13} borderRadius={4} />
                        <SkeletonBox width={28} height={11} borderRadius={4} />
                      </View>
                      <SkeletonBox width="70%" height={12} borderRadius={4} />
                    </View>
                  </View>
                  {i < 3 && <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 56 }} />}
                </View>
              ))}
            </View>
          ) : channels.length === 0 ? (
            <View style={styles.centered}>
              <View style={styles.emptyCard}>
                <Ionicons name="chatbubbles-outline" size={32} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No channels yet</Text>
                <Text style={styles.emptyBody}>Channels will appear here once they're created by your school.</Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={channels}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              refreshControl={
                <RefreshControl
                  refreshing={channelsRefreshing}
                  onRefresh={() => loadChannelsList(true)}
                  tintColor={Brand.sage700}
                />
              }
              renderItem={({ item: ch }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => {
                    setChannels((prev) =>
                      prev.map((c) => c.id === ch.id ? { ...c, unreadCount: 0 } : c)
                    );
                    router.push({
                      pathname: "/(tabs)/messages/channel/[channelId]",
                      params: {
                        channelId: ch.id,
                        channelName: ch.name,
                        isMember: ch.isMember ? "true" : "false",
                        isDefault: ch.is_default ? "true" : "false",
                        memberCount: String(ch.memberCount),
                      },
                    });
                  }}
                >
                  <View style={styles.channelHashCircle}>
                    <Text style={styles.channelHash}>#</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowName} numberOfLines={1}>{ch.name}</Text>
                      {ch.lastMessage && (
                        <Text style={styles.rowTime}>{timeAgo(ch.lastMessage.created_at)}</Text>
                      )}
                    </View>
                    <View style={styles.rowBottom}>
                      <Text style={styles.rowPreview} numberOfLines={1}>
                        {ch.lastMessage
                          ? ch.lastMessage.body || "Sent an attachment"
                          : ch.description
                            ? ch.description
                            : `${ch.memberCount} ${ch.memberCount === 1 ? "member" : "members"}`}
                      </Text>
                      <View style={styles.channelBadgeRow}>
                        {!ch.isMember && (
                          <View style={styles.joinBadge}>
                            <Text style={styles.joinBadgeText}>Join</Text>
                          </View>
                        )}
                        {ch.isMember && ch.unreadCount > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{ch.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  heading: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: Brand.sage700,
  },
  composeButton: { padding: 4 },

  // Tab switcher
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  tabBtnTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#1f2937",
  },
  tabBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  communityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f29a8f",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  emptyTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
  emptyBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  separator: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 64 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  pressed: { opacity: 0.6 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: Brand.sage700,
  },

  // Channel # circle
  channelHashCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  channelHash: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 20,
    color: Brand.sage700,
  },

  rowContent: { flex: 1, gap: 3 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowName: {
    flex: 1,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  rowTime: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    flexShrink: 0,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowPreview: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  badge: {
    backgroundColor: "#f29a8f",
    borderRadius: 9999,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#ffffff",
  },
  channelBadgeRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  joinBadge: {
    borderWidth: 1,
    borderColor: Brand.sage700,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  joinBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
  },

  // Teacher suggestions
  suggestionsContainer: { paddingBottom: 32 },
  suggestionsIntro: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
    gap: 4,
  },
  suggestionsIntroTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
  },
  suggestionsIntroBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  suggestionsHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  suggestionInfo: { flex: 1, gap: 2 },
  suggestionName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  suggestionRole: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  messageButton: {
    backgroundColor: Brand.sage700,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexShrink: 0,
  },
  messageButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#ffffff",
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginLeft: 80,
  },
});
