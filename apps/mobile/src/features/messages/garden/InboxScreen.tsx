// Garden parent messages inbox: Direct Messages + Community.
import {
  CountBadge,
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSegmented,
  GardenSkeleton,
  HandNote,
  PressableScale,
  READ_ONLY_TOAST,
  gardenCard,
  haptic,
  useToast,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import type { ChannelWithMeta } from "@/lib/channel-actions";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ATTACHMENT_PREVIEW, shortTimeAgo, type ConversationRow, type TeacherSuggestion } from "../messagingApi";
import { useInbox, type Inbox } from "../useInbox";

const GUTTER = 18;

export function InboxScreen() {
  const m = useInbox();
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const startRef = useRef<((t: TeacherSuggestion) => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    const r = m.activeTab === "dm" ? await m.loadDMs("refresh") : await m.loadChannels("refresh");
    if (r.ok) {
      toast.show({ tone: "success", title: "You're up to date", duration: 1600, silent: true });
      haptic.tap();
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't refresh",
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void refreshRef.current?.() },
      });
    }
  }, [m, toast]);

  const start = useCallback(
    async (t: TeacherSuggestion) => {
      if (m.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      const r = await m.startConversation(t);
      if (!r.ok)
        toast.show({
          tone: "error",
          title: "Couldn't open the chat",
          message: "Please try again in a moment.",
          action: { label: "Retry", onPress: () => void startRef.current?.(t) },
        });
    },
    [m, toast],
  );

  useEffect(() => {
    refreshRef.current = refresh;
    startRef.current = start;
  }, [refresh, start]);

  const isDm = m.activeTab === "dm";

  const header = (
    <View>
      <View style={st.hero}>
        <View style={{ flex: 1 }}>
          <HandNote size={19}>{isDm ? "say hi to a teacher" : "chat with Sage Field families"}</HandNote>
          <Display size={34}>Messages</Display>
        </View>
        {isDm && !m.isReadOnlyPreview ? (
          <GardenIconButton
            icon="create-outline"
            tone="sage"
            label="New Message"
            onPress={() => m.router.push("/(tabs)/messages/compose")}
            style={{ marginTop: 8 }}
          />
        ) : null}
      </View>
      <View style={{ paddingHorizontal: GUTTER, gap: 12, marginBottom: 14 }}>
        <GardenSegmented
          accessibilityLabel="Message type"
          value={m.activeTab}
          onChange={m.setActiveTab}
          options={[
            { value: "dm", label: "Direct Messages", badge: !isDm ? m.dmUnread : 0 },
            { value: "community", label: "Community", badge: isDm ? m.communityUnread : 0 },
          ]}
        />
        {isDm && m.rows.length > 0 ? (
          <GardenField
            icon="search-outline"
            value={m.searchQuery}
            onChangeText={m.setSearchQuery}
            placeholder="Search conversations"
            clearable
            returnKeyType="search"
            accessibilityLabel="Search conversations"
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      {isDm ? (
        <FlatList
          key="dm"
          data={m.loading || m.error ? [] : m.filtered}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => <ConversationCard item={item} index={index} m={m} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <DmEmpty
              m={m}
              retrying={retrying}
              onRetry={async () => {
                setRetrying(true);
                await m.loadDMs("initial");
                setRetrying(false);
              }}
              onStart={(t) => void start(t)}
            />
          }
          contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={m.refreshing} onRefresh={() => void refresh()} tintColor={Garden.sage} />}
        />
      ) : (
        <FlatList
          key="community"
          data={m.channelsLoading || m.channelsError ? [] : m.channels}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => <ChannelCard c={item} index={index} m={m} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            m.channelsLoading ? (
              <RowSkeletons />
            ) : m.channelsError ? (
              <View style={{ paddingHorizontal: GUTTER }}>
                <GardenErrorCard
                  title="We couldn't load channels"
                  retrying={retrying}
                  onRetry={async () => {
                    setRetrying(true);
                    await m.loadChannels("initial");
                    setRetrying(false);
                  }}
                />
              </View>
            ) : (
              <View style={{ paddingHorizontal: GUTTER }}>
                <GardenEmpty
                  emoji="🌻"
                  title="No channels yet"
                  body="Channels will appear here once they're created by your school."
                  tint="butter"
                />
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={m.channelsRefreshing} onRefresh={() => void refresh()} tintColor={Garden.sage} />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Rows ────────────────────────────────────────────────────────────────────
function ConversationCard({ item, index, m }: { item: ConversationRow; index: number; m: Inbox }) {
  const unread = item.unreadCount > 0;
  const preview = item.lastMessagePreview === "" ? ATTACHMENT_PREVIEW : (item.lastMessagePreview ?? "No messages yet");
  return (
    <Animated.View entering={index < 8 ? FadeInDown.delay(index * 35).springify().damping(18) : undefined}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => m.openConversation(item)}
        accessibilityLabel={`${item.otherUserName}${unread ? `, ${item.unreadCount} unread` : ""}. ${preview}`}
        accessibilityHint="Opens the conversation"
        style={[st.row, unread && st.rowUnread]}
      >
        <GardenAvatar
          name={item.otherUserName}
          uri={item.isGroup ? null : item.otherUserProfileImageUrl}
          seed={item.otherUserId || item.id}
          icon={item.isGroup ? "people" : undefined}
          size={50}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={st.rowTop}>
            <Text style={[st.name, unread && { fontFamily: GardenFonts.bodyHeavy }]} numberOfLines={1}>
              {item.otherUserName}
            </Text>
            <Text style={[st.time, unread && { color: Garden.coralDeep, fontFamily: GardenFonts.bodyHeavy }]}>
              {shortTimeAgo(item.updatedAt)}
            </Text>
          </View>
          {item.isGroup && item.participantCount > 0 ? (
            <Text style={st.sub}>{item.participantCount} members</Text>
          ) : null}
          <View style={st.rowTop}>
            <Text style={[st.preview, unread && { color: Garden.ink, fontFamily: GardenFonts.bodyBold }]} numberOfLines={1}>
              {preview}
            </Text>
            <CountBadge count={item.unreadCount} />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function ChannelCard({ c, index, m }: { c: ChannelWithMeta; index: number; m: Inbox }) {
  const unread = c.isMember && c.unreadCount > 0;
  const preview = c.lastMessage
    ? c.lastMessage.body || ATTACHMENT_PREVIEW
    : c.description
      ? c.description
      : `${c.memberCount} ${c.memberCount === 1 ? "member" : "members"}`;
  return (
    <Animated.View entering={index < 8 ? FadeInDown.delay(index * 35).springify().damping(18) : undefined}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => m.openChannel(c)}
        accessibilityLabel={`#${c.name}${unread ? `, ${c.unreadCount} unread` : ""}${!c.isMember ? ", not joined" : ""}. ${preview}`}
        accessibilityHint="Opens the channel"
        style={[st.row, unread && st.rowUnread]}
      >
        <View style={[st.hash, c.is_default && { backgroundColor: Garden.butter }]}>
          <Text style={[st.hashText, c.is_default && { color: "#7a5a00" }]}>#</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={st.rowTop}>
            <Text style={[st.name, unread && { fontFamily: GardenFonts.bodyHeavy }]} numberOfLines={1}>
              {c.name}
            </Text>
            {c.lastMessage ? <Text style={st.time}>{shortTimeAgo(c.lastMessage.created_at)}</Text> : null}
          </View>
          <View style={st.rowTop}>
            <Text style={[st.preview, unread && { color: Garden.ink, fontFamily: GardenFonts.bodyBold }]} numberOfLines={1}>
              {preview}
            </Text>
            {!c.isMember ? (
              <View style={st.joinPill}>
                <Text style={st.joinText}>Join</Text>
              </View>
            ) : (
              <CountBadge count={c.unreadCount} />
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ─── Empty / loading ─────────────────────────────────────────────────────────
function RowSkeletons() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 8 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[st.row, { backgroundColor: Garden.white }]}>
          <GardenSkeleton width={50} height={50} radius={25} />
          <View style={{ flex: 1, gap: 7 }}>
            <GardenSkeleton width="55%" height={14} radius={6} />
            <GardenSkeleton width="80%" height={12} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

function DmEmpty({
  m,
  retrying,
  onRetry,
  onStart,
}: {
  m: Inbox;
  retrying: boolean;
  onRetry: () => void;
  onStart: (t: TeacherSuggestion) => void;
}) {
  if (m.loading) return <RowSkeletons />;
  if (m.error) {
    return (
      <View style={{ paddingHorizontal: GUTTER }}>
        <GardenErrorCard title="We couldn't load your messages" onRetry={onRetry} retrying={retrying} />
      </View>
    );
  }
  if (m.rows.length > 0 && m.searchQuery.trim()) {
    return (
      <Animated.View entering={FadeIn.duration(180)} style={{ paddingHorizontal: GUTTER }}>
        <GardenEmpty
          emoji="🔍"
          title="No results found"
          tint="sky"
          actionLabel="Clear"
          onAction={() => m.setSearchQuery("")}
        />
      </Animated.View>
    );
  }
  if (m.teachers.length > 0) {
    return (
      <Animated.View entering={FadeIn.duration(220)} style={{ paddingHorizontal: GUTTER, gap: 14 }}>
        <View style={st.intro}>
          <Text style={{ fontSize: 30 }}>👋</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.introTitle}>Who would you like to reach?</Text>
            <Text style={st.introBody}>Message your child&apos;s teachers directly from here.</Text>
          </View>
        </View>
        <Text style={st.label}>START A CONVERSATION</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8, paddingRight: 8 }}>
          {m.teachers.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 70).springify()} style={st.teacher}>
              <GardenAvatar name={t.full_name} uri={t.profile_image_url} seed={t.id} size={72} />
              <Text style={st.teacherName} numberOfLines={2}>
                {t.full_name}
              </Text>
              <Text style={st.teacherRole}>Teacher</Text>
              <GardenButton
                label="Message"
                tone="ink"
                size="sm"
                icon="chatbubble-ellipses-outline"
                loading={m.startingId === t.id}
                loadingLabel="Opening…"
                disabled={!!m.startingId && m.startingId !== t.id}
                onPress={() => onStart(t)}
                fullWidth
              />
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  }
  return (
    <View style={{ paddingHorizontal: GUTTER }}>
      <GardenEmpty
        emoji="💬"
        title="No messages yet"
        body="Tap the compose button to start a conversation."
        tint="mint"
        actionLabel={!m.isReadOnlyPreview ? "New Message" : undefined}
        onAction={!m.isReadOnlyPreview ? () => m.router.push("/(tabs)/messages/compose") : undefined}
      />
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 14 },
  row: {
    ...gardenCard,
    borderRadius: 22,
    marginHorizontal: GUTTER,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 74,
  },
  rowUnread: { borderColor: "#f3c9c2", backgroundColor: "#fffaf6" },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 16, color: Garden.ink },
  time: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  preview: { flex: 1, fontFamily: GardenFonts.body, fontSize: 14, color: Garden.soft },
  hash: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  hashText: { fontFamily: GardenFonts.display, fontSize: 24, color: "#2f6b44" },
  joinPill: { backgroundColor: Garden.coralDeep, borderRadius: GardenRadii.pill, paddingHorizontal: 12, paddingVertical: 4 },
  joinText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: GardenRadii.md,
    backgroundColor: "#fff3c4",
  },
  introTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  introBody: { fontFamily: GardenFonts.body, fontSize: 13.5, color: Garden.soft, lineHeight: 19 },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5, letterSpacing: 0.8, color: Garden.muted },
  teacher: {
    ...gardenCard,
    width: 156,
    borderRadius: 24,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  teacherName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink, textAlign: "center", marginTop: 6 },
  teacherRole: { fontFamily: GardenFonts.hand, fontSize: 16, color: Garden.sageDeep, marginBottom: 6 },
});
