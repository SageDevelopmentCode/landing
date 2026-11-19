// Garden community channel thread.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  HandNote,
  PressableScale,
  READ_ONLY_TOAST,
  gardenSheetChrome,
  haptic,
  useToast,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import type { ChannelMember } from "@/lib/channel-actions";
import { BottomSheetFlatList, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import EmojiKeyboard, { type EmojiType } from "rn-emoji-keyboard";
import { buildChatItems, formatClock, pickChatFile, pickChatImage, type ChatListItem } from "../chatShared";
import { useMessagingRoutes } from "../messagingRoutes";
import { QUICK_EMOJIS, useChannelThread, type ChannelMessage } from "../useChannelThread";
import { Bubble, ChatHeader, Composer, DaySeparator, ImageViewer, MessageMeta, NewMessagesPill, useKeyboardOpen } from "./ChatBits";

export function ChannelThreadScreen() {
  const t = useChannelThread();
  const routes = useMessagingRoutes();
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardOpen();
  const listRef = useRef<FlatList>(null);
  const editRef = useRef<TextInput>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const membersSheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<ChannelMessage | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerTargetRef = useRef<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const offsetRef = useRef(0);
  const actionsRef = useRef<{ join: () => Promise<void>; retry: (id: string) => Promise<void>; del: (id: string) => Promise<void> } | null>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const back = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: routes.base, params: { tab: "community" } });
  }, [router, routes.base]);

  // Count messages that arrive while the parent is reading older ones.
  useEffect(() => {
    if (t.incomingTick === 0) return;
    if (offsetRef.current > 120) setUnseen((n) => n + 1);
  }, [t.incomingTick]);

  const jumpToLatest = useCallback(() => {
    haptic.tap();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setUnseen(0);
  }, []);

  const preview = useCallback(() => {
    toast.show(READ_ONLY_TOAST);
  }, [toast]);

  // ── Feedback wrappers ──────────────────────────────────────────────────────
  const join = useCallback(async () => {
    if (t.isReadOnlyPreview) return preview();
    haptic.press();
    const r = await t.join();
    if (r.ok) {
      haptic.success();
      toast.show({ tone: "success", title: `You joined #${t.channelName}`, message: "Say hello! 👋" });
    } else {
      toast.show({
        tone: "error",
        title: "Could not join channel",
        message: "Something went wrong. Please try again or contact support.",
        action: routes.helpHref
          ? { label: "Get Help", onPress: () => routes.helpHref && router.push(routes.helpHref) }
          : { label: "Retry", onPress: () => void actionsRef.current?.join() },
      });
    }
  }, [preview, router, routes.helpHref, t, toast]);

  const joinPrompt = useCallback(() => {
    toast.show({
      tone: "info",
      title: "Join to participate",
      message: `Join #${t.channelName} to react and reply.`,
      action: { label: "Join", onPress: () => void actionsRef.current?.join() },
    });
  }, [t.channelName, toast]);

  const retryMsg = useCallback(
    async (id: string) => {
      haptic.tap();
      const r = await t.retry(id);
      if (r.ok) haptic.success();
      else toast.show({ tone: "error", title: "Still couldn't send", message: "Check your connection and try again." });
    },
    [t, toast],
  );

  const send = useCallback(async () => {
    if (t.isReadOnlyPreview) return preview();
    haptic.press();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    const r = await t.send();
    if (r.ok) haptic.success();
    else
      toast.show({
        tone: "error",
        title: "Error",
        message: "Failed to send message.",
        action: r.tempId ? { label: "Retry", onPress: () => void actionsRef.current?.retry(r.tempId!) } : undefined,
      });
  }, [preview, t, toast]);

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      if (t.isReadOnlyPreview) return preview();
      if (!t.isMember) return joinPrompt();
      haptic.select();
      const r = await t.react(messageId, emoji);
      if (!r.ok) toast.show({ tone: "error", title: "Couldn't save your reaction", message: "Please try again." });
    },
    [joinPrompt, preview, t, toast],
  );

  const runDelete = useCallback(
    async (id: string) => {
      const r = await t.deleteMessage(id);
      if (r.ok) toast.show({ tone: "success", title: "Message deleted", duration: 1800 });
      else
        toast.show({
          tone: "error",
          title: "Couldn't delete that message",
          message: "Please try again.",
          action: { label: "Retry", onPress: () => void actionsRef.current?.del(id) },
        });
    },
    [t, toast],
  );

  useEffect(() => {
    actionsRef.current = { join, retry: retryMsg, del: runDelete };
  }, [join, retryMsg, runDelete]);

  const openActions = useCallback(
    (m: ChannelMessage) => {
      if (m.status) return;
      if (!t.isMember) return joinPrompt();
      haptic.press();
      setSelected(m);
      actionSheetRef.current?.present();
    },
    [joinPrompt, t.isMember],
  );

  const confirmDelete = useCallback(() => {
    if (!selected) return;
    const id = selected.id;
    actionSheetRef.current?.dismiss();
    if (t.isReadOnlyPreview) return preview();
    haptic.warning();
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void runDelete(id) },
    ]);
  }, [preview, runDelete, selected, t.isReadOnlyPreview]);

  const beginEdit = useCallback(() => {
    if (!selected) return;
    actionSheetRef.current?.dismiss();
    if (t.isReadOnlyPreview) return preview();
    t.startEdit(selected);
    setTimeout(() => editRef.current?.focus(), 250);
  }, [preview, selected, t]);

  const saveEdit = useCallback(async () => {
    const r = await t.saveEdit();
    if (r.ok) {
      haptic.success();
      toast.show({ tone: "success", title: "Message updated", duration: 1800 });
    } else if (t.editingText.trim()) {
      toast.show({ tone: "error", title: "Couldn't save your edit", message: "Your text is still here — try again." });
    }
  }, [t, toast]);

  const leave = useCallback(() => {
    if (t.isReadOnlyPreview) return preview();
    haptic.warning();
    Alert.alert("Leave Channel", `Leave #${t.channelName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const r = await t.leave();
          if (r.ok) {
            toast.show({ tone: "info", title: `You left #${t.channelName}` });
            back();
          } else {
            toast.show({ tone: "error", title: "Couldn't leave the channel", message: "Please try again." });
          }
        },
      },
    ]);
  }, [back, preview, t, toast]);

  const openMembers = useCallback(() => {
    haptic.tap();
    membersSheetRef.current?.present();
    void t.loadMembers();
  }, [t]);

  const attachPhoto = useCallback(async () => {
    const r = await pickChatImage();
    if (r.ok) {
      t.setPendingImage(r.value);
      t.setPendingFile(null);
      haptic.success();
    } else if (r.permissionDenied) {
      toast.show({
        tone: "info",
        title: "Permission needed",
        message: "Allow photo access to attach images.",
        action: { label: "Settings", onPress: () => void Linking.openSettings() },
      });
    } else if (!r.canceled) toast.show({ tone: "error", title: "Couldn't add that photo" });
  }, [t, toast]);

  const attachFile = useCallback(async () => {
    const r = await pickChatFile();
    if (r.ok) {
      t.setPendingFile(r.value);
      t.setPendingImage(null);
      haptic.success();
    } else if (!r.canceled) toast.show({ tone: "error", title: "Couldn't add that file" });
  }, [t, toast]);

  const items = useMemo(() => [...buildChatItems(t.messages)].reverse(), [t.messages]);
  const canSend = (!!t.inputText.trim() || !!t.pendingImage || !!t.pendingFile) && !t.sending;

  const renderItem = ({ item }: { item: ChatListItem<ChannelMessage> }) => {
    if (item.type === "date") return <DaySeparator label={item.label} />;
    const msg = item.msg;
    const mine = msg.sender_id === t.userId;
    const failed = msg.status === "failed";
    return (
      <View style={[s.msgRow, mine && { justifyContent: "flex-end" }, { marginTop: item.isGroupStart ? 10 : 2 }]}>
        {!mine ? (
          <View style={{ width: 34 }}>
            {item.isGroupEnd ? <GardenAvatar name={msg.sender_name} uri={msg.sender_image_url} seed={msg.sender_id} size={32} /> : null}
          </View>
        ) : null}
        <View style={{ flex: 1, alignItems: mine ? "flex-end" : "flex-start" }}>
          {!mine && item.isGroupStart ? <Text style={s.sender}>{msg.sender_name}</Text> : null}
          <Bubble
            mine={mine}
            body={msg.body}
            imageUrl={msg.image_url}
            fileUrl={msg.file_url}
            fileName={msg.file_name}
            faded={msg.status === "sending"}
            failed={failed}
            groupStart={item.isGroupStart}
            groupEnd={item.isGroupEnd}
            onImagePress={() => msg.image_url && setViewerUrl(msg.image_url)}
            onFilePress={() => msg.file_url && void Linking.openURL(msg.file_url).catch(() => undefined)}
            onLongPress={() => openActions(msg)}
            onPress={failed ? () => void retryMsg(msg.id) : undefined}
            accessibilityLabel={`${mine ? "You" : msg.sender_name}: ${msg.body || msg.file_name || "Photo"}. ${formatClock(msg.created_at)}. Hold for options`}
          />
          {msg.reactions.length > 0 ? (
            <View style={[s.reactions, mine && { justifyContent: "flex-end" }]}>
              {msg.reactions.map((r) => (
                <PressableScale
                  key={r.emoji}
                  haptics={false}
                  pressedScale={0.9}
                  onPress={() => void react(msg.id, r.emoji)}
                  accessibilityLabel={`${r.emoji} ${r.count}${r.reactedByMe ? ", you reacted" : ""}`}
                  accessibilityState={{ selected: r.reactedByMe }}
                  style={[s.reactPill, r.reactedByMe && s.reactPillMine]}
                >
                  <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
                  <Text style={[s.reactCount, r.reactedByMe && { color: Garden.sageDeep }]}>{r.count}</Text>
                </PressableScale>
              ))}
            </View>
          ) : null}
          {failed ? (
            <MessageMeta mine failed onRetry={() => void retryMsg(msg.id)} />
          ) : msg.status === "sending" ? (
            <MessageMeta mine text="Sending…" />
          ) : item.isGroupEnd ? (
            <MessageMeta mine={mine} text={formatClock(msg.created_at)} />
          ) : null}
        </View>
      </View>
    );
  };

  const headerLeft = (
    <PressableScale onPress={openMembers} pressedScale={0.98} accessibilityLabel={`#${t.channelName}, ${t.memberCount} members. View members`} style={s.headerWho}>
      <View style={[s.hash, t.isDefault && { backgroundColor: Garden.butter }]}>
        <Text style={[s.hashText, t.isDefault && { color: "#7a5a00" }]}>#</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.headerName} numberOfLines={1}>
          {t.channelName || " "}
        </Text>
        <Text style={s.headerSub}>
          {t.memberCount} {t.memberCount === 1 ? "member" : "members"} ›
        </Text>
      </View>
    </PressableScale>
  );

  const headerRight = !t.isMember ? (
    <GardenButton label="Join" tone="coral" size="sm" loading={t.joining} loadingLabel="Joining…" onPress={() => void join()} />
  ) : !t.isDefault ? (
    <GardenButton label="Leave" tone="outline" size="sm" onPress={leave} />
  ) : null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ChatHeader onBack={back} left={headerLeft} right={headerRight} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1 }}>
          {t.loading ? (
            <View style={{ flex: 1, padding: 18, gap: 12, justifyContent: "flex-end" }}>
              {[0.6, 0.45, 0.7, 0.4].map((w, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
                  <GardenSkeleton width={32} height={32} radius={16} />
                  <GardenSkeleton width={`${w * 100}%` as `${number}%`} height={46} radius={20} />
                </View>
              ))}
            </View>
          ) : t.error ? (
            <View style={{ padding: 18 }}>
              <GardenErrorCard
                title="We couldn't load this channel"
                retrying={retrying}
                onRetry={async () => {
                  setRetrying(true);
                  await t.retryLoad();
                  setRetrying(false);
                }}
              />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              inverted
              data={items}
              keyExtractor={(i) => i.key}
              renderItem={renderItem}
              contentContainerStyle={[s.list, items.length === 0 && { flexGrow: 1 }]}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 120 }}
              onScroll={(e) => {
                offsetRef.current = e.nativeEvent.contentOffset.y;
                if (offsetRef.current < 60 && unseen) setUnseen(0);
              }}
              scrollEventThrottle={32}
              ListEmptyComponent={
                <Animated.View entering={FadeIn} style={s.empty}>
                  <Text style={{ fontSize: 36 }}>👋</Text>
                  <Text style={s.emptyText}>No messages yet. Say hello! 👋</Text>
                </Animated.View>
              }
            />
          )}
          <NewMessagesPill count={unseen} onPress={jumpToLatest} />
        </View>

        {!t.isMember ? (
          <Animated.View entering={FadeInDown} style={[s.joinBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <HandNote size={16} style={{ textAlign: "center" }}>
              you&apos;re just looking around
            </HandNote>
            <GardenButton
              label="Join to participate"
              tone="coral"
              icon="enter-outline"
              loading={t.joining}
              loadingLabel="Joining…"
              fullWidth
              onPress={() => void join()}
            />
          </Animated.View>
        ) : t.editingId ? (
          <Animated.View entering={FadeInDown.duration(160)} style={[s.editBar, { paddingBottom: kb ? 10 : Math.max(insets.bottom, 12) }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="create-outline" size={15} color={Garden.sageDeep} />
              <Text style={s.editLabel}>Edit Message</Text>
            </View>
            <TextInput
              ref={editRef}
              value={t.editingText}
              onChangeText={t.setEditingText}
              multiline
              style={s.editInput}
              maxFontSizeMultiplier={1.4}
              accessibilityLabel="Edit Message"
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <GardenButton label="Cancel" tone="outline" size="sm" onPress={t.cancelEdit} style={{ flex: 1 }} fullWidth />
              <GardenButton
                label="Save"
                tone="ink"
                size="sm"
                icon="checkmark"
                loading={t.savingEdit}
                loadingLabel="Saving…"
                disabled={!t.editingText.trim()}
                onPress={() => void saveEdit()}
                style={{ flex: 1.4 }}
                fullWidth
              />
            </View>
          </Animated.View>
        ) : (
          <Composer
            value={t.inputText}
            onChangeText={t.setInputText}
            placeholder={`Message #${t.channelName}`}
            onSend={() => void send()}
            sending={t.sending}
            canSend={canSend && !t.isReadOnlyPreview}
            onAttachPhoto={() => void attachPhoto()}
            onAttachFile={() => void attachFile()}
            pendingImage={t.pendingImage}
            pendingFile={t.pendingFile}
            onClearImage={() => t.setPendingImage(null)}
            onClearFile={() => t.setPendingFile(null)}
            disabledReason={t.isReadOnlyPreview ? preview : undefined}
          />
        )}
      </KeyboardAvoidingView>

      {/* Long-press actions */}
      <BottomSheetModal ref={actionSheetRef} {...gardenSheetChrome} enableDynamicSizing onDismiss={() => setSelected(null)}>
        <BottomSheetView style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
          <Display size={22}>React</Display>
          <View style={s.quickRow}>
            {QUICK_EMOJIS.map((e) => (
              <PressableScale
                key={e}
                haptics="select"
                pressedScale={0.85}
                onPress={() => {
                  const id = selected?.id;
                  actionSheetRef.current?.dismiss();
                  if (id) void react(id, e);
                }}
                accessibilityLabel={`React with ${e}`}
                style={s.quick}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </PressableScale>
            ))}
            <PressableScale
              onPress={() => {
                pickerTargetRef.current = selected?.id ?? null;
                actionSheetRef.current?.dismiss();
                setPickerOpen(true);
              }}
              accessibilityLabel="More reactions"
              style={[s.quick, { borderStyle: "dashed" }]}
            >
              <Ionicons name="add" size={22} color={Garden.sageDeep} />
            </PressableScale>
          </View>
          {selected && selected.sender_id === t.userId ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              <PressableScale onPress={beginEdit} accessibilityLabel="Edit Message" style={s.action}>
                <View style={[s.actionIcon, { backgroundColor: Garden.sky }]}>
                  <Ionicons name="create-outline" size={18} color="#2f5f8a" />
                </View>
                <Text style={s.actionText}>Edit Message</Text>
              </PressableScale>
              <PressableScale onPress={confirmDelete} accessibilityLabel="Delete Message" style={s.action}>
                <View style={[s.actionIcon, { backgroundColor: Garden.dangerTint }]}>
                  <Ionicons name="trash-outline" size={18} color={Garden.danger} />
                </View>
                <Text style={[s.actionText, { color: Garden.danger }]}>Delete Message</Text>
              </PressableScale>
            </View>
          ) : null}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Members */}
      <BottomSheetModal ref={membersSheetRef} {...gardenSheetChrome} snapPoints={["60%", "90%"]} enableDynamicSizing={false}>
        <BottomSheetFlatList
          data={t.members}
          keyExtractor={(m: ChannelMember) => m.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40, gap: 6 }}
          ListHeaderComponent={
            <View style={{ paddingBottom: 10 }}>
              <Display size={24}>Members</Display>
              <HandNote size={16}>{`#${t.channelName}`}</HandNote>
            </View>
          }
          ListEmptyComponent={
            t.membersLoading ? (
              <View style={{ gap: 10 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <GardenSkeleton width={42} height={42} radius={21} />
                    <GardenSkeleton width="50%" height={14} radius={6} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={s.membersEmpty}>No members found</Text>
            )
          }
          renderItem={({ item }: { item: ChannelMember }) => (
            <View style={s.member}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <GardenAvatar name={item.full_name} uri={item.profile_image_url} seed={item.id} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={s.memberName}>{item.full_name}</Text>
                  {item.role ? <Text style={s.memberRole}>{item.role === "parent" ? "Parent" : "Teacher"}</Text> : null}
                </View>
              </View>
              {item.children.map((ch) => (
                <View key={ch.id} style={s.child}>
                  <GardenAvatar name={ch.child_legal_name} uri={ch.profile_image_url} seed={ch.id} size={26} />
                  <Text style={s.childName}>{ch.child_legal_name}</Text>
                </View>
              ))}
            </View>
          )}
        />
      </BottomSheetModal>

      <EmojiKeyboard
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(e: EmojiType) => {
          setPickerOpen(false);
          const id = pickerTargetRef.current;
          pickerTargetRef.current = null;
          if (id) void react(id, e.emoji);
        }}
      />
      <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  headerWho: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  hash: { width: 40, height: 40, borderRadius: 13, backgroundColor: Garden.mint, alignItems: "center", justifyContent: "center" },
  hashText: { fontFamily: GardenFonts.display, fontSize: 20, color: "#2f6b44" },
  headerName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16.5, color: Garden.ink },
  headerSub: { fontFamily: GardenFonts.bodyBold, fontSize: 12, color: Garden.sageDeep },
  list: { paddingHorizontal: 12, paddingVertical: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  sender: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.sageDeep, marginLeft: 8, marginBottom: 3 },
  reactions: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 },
  reactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 15,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  reactPillMine: { backgroundColor: "#e1eee3", borderColor: "#b9d3bf" },
  reactCount: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.soft },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, transform: [{ scaleY: -1 }] },
  emptyText: { fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.soft },
  joinBar: { paddingHorizontal: 16, paddingTop: 10, gap: 8, borderTopWidth: 1, borderTopColor: Garden.line, backgroundColor: Garden.cream },
  editBar: { paddingHorizontal: 14, paddingTop: 10, gap: 8, borderTopWidth: 1, borderTopColor: Garden.line, backgroundColor: "#f5f9f5" },
  editLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.sageDeep, letterSpacing: 0.3 },
  editInput: {
    minHeight: 44,
    maxHeight: 130,
    borderRadius: 16,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.sage,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15.5,
    color: Garden.ink,
  },
  sheet: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quick: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  actionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  actionText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  member: { paddingVertical: 8, gap: 6 },
  memberName: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  memberRole: { fontFamily: GardenFonts.hand, fontSize: 15, color: Garden.sageDeep },
  child: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 54 },
  childName: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft },
  membersEmpty: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.muted, textAlign: "center", marginTop: 24 },
});
