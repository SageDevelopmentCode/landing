// Garden messages inbox (parents and staff): Direct Messages + Community.
// Staff extras: "+" on Community opens the New Channel sheet.
import {
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
  READ_ONLY_TOAST,
  gardenCard,
  gardenEnter,
  haptic,
  useToast,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TeacherSuggestion } from "../messagingApi";
import { useInbox, type Inbox } from "../useInbox";
import { ChannelCard, ConversationCard, INBOX_GUTTER as GUTTER, RowSkeletons } from "./InboxBits";
import { NewChannelSheet } from "./NewChannelSheet";

export function InboxScreen() {
  const m = useInbox();
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const startRef = useRef<((t: TeacherSuggestion) => Promise<void>) | null>(null);
  const createRef = useRef<((name: string, description: string) => Promise<void>) | null>(null);
  const newChannelRef = useRef<BottomSheetModal>(null);

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

  // Staff: create a channel. The sheet stays open (with what was typed) on failure.
  const createChannel = useCallback(
    async (name: string, description: string) => {
      const label = name.trim();
      if (!label || m.creatingChannel) return;
      haptic.press();
      const id = toast.show({ tone: "loading", title: "Creating channel…" });
      const r = await m.createChannel(label, description);
      if (r.ok && r.channelId) {
        haptic.success();
        toast.update(id, { tone: "success", title: `#${label} created`, duration: 2400 });
        newChannelRef.current?.dismiss();
        m.openCreatedChannel(r.channelId, label);
      } else {
        haptic.error();
        toast.update(id, {
          tone: "error",
          title: "Couldn't create the channel",
          message: "Check your connection and try again.",
          duration: 5000,
          action: { label: "Retry", onPress: () => void createRef.current?.(name, description) },
        });
      }
    },
    [m, toast],
  );

  useEffect(() => {
    refreshRef.current = refresh;
    startRef.current = start;
    createRef.current = createChannel;
  }, [refresh, start, createChannel]);

  const openNewChannel = useCallback(() => {
    haptic.tap();
    newChannelRef.current?.present();
  }, []);

  const isDm = m.activeTab === "dm";

  const header = (
    <View>
      <View style={st.hero}>
        <View style={{ flex: 1 }}>
          <Display size={34}>Messages</Display>
        </View>
        {isDm && !m.isReadOnlyPreview ? (
          <GardenIconButton
            icon="create-outline"
            tone="sage"
            label="New Message"
            onPress={() => m.router.push(m.routes.compose)}
          />
        ) : !isDm && m.isStaff ? (
          <GardenIconButton icon="add" tone="sage" label="New Channel" onPress={openNewChannel} />
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
          renderItem={({ item, index }) => <ConversationCard item={item} index={index} onOpen={m.openConversation} />}
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
          renderItem={({ item, index }) => <ChannelCard c={item} index={index} onOpen={m.openChannel} />}
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
                  body={
                    m.isStaff
                      ? "Tap + to create the first channel."
                      : "Channels will appear here once they're created by your school."
                  }
                  tint="butter"
                  actionLabel={m.isStaff ? "New Channel" : undefined}
                  onAction={m.isStaff ? openNewChannel : undefined}
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
      {m.isStaff ? (
        <NewChannelSheet ref={newChannelRef} creating={m.creatingChannel} onCreate={(n, d) => void createChannel(n, d)} />
      ) : null}
    </SafeAreaView>
  );
}

// ─── Empty states ────────────────────────────────────────────────────────────
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
            <Animated.View key={t.id} entering={gardenEnter(i, { max: 8 })} style={st.teacher}>
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
        onAction={!m.isReadOnlyPreview ? () => m.router.push(m.routes.compose) : undefined}
      />
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 58, paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 14 },
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
