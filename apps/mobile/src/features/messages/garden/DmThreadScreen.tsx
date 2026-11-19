// Garden direct-message thread.
import {
  Garden,
  GardenAvatar,
  GardenErrorCard,
  GardenFonts,
  GardenSkeleton,
  HandNote,
  PressableScale,
  READ_ONLY_TOAST,
  haptic,
  useToast,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { buildChatItems, formatClock, pickChatFile, pickChatImage, type ChatListItem } from "../chatShared";
import { useMessagingRoutes } from "../messagingRoutes";
import { useDmThread, type DmMessage } from "../useDmThread";
import { Bubble, ChatHeader, Composer, DaySeparator, ImageViewer, MessageMeta } from "./ChatBits";

export function DmThreadScreen() {
  const t = useDmThread();
  const routes = useMessagingRoutes();
  const isStaff = routes.audience === "staff";
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const inputRef = useRef<TextInput>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const retryRef = useRef<((id: string) => Promise<void>) | null>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const back = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(routes.base);
  }, [router, routes.base]);

  const guard = useCallback(() => {
    toast.show(READ_ONLY_TOAST);
  }, [toast]);

  const retryMessage = useCallback(
    async (id: string) => {
      haptic.tap();
      const r = await t.retry(id);
      if (r.ok) haptic.success();
      else toast.show({ tone: "error", title: "Still couldn't send", message: "Check your connection and try again." });
    },
    [t, toast],
  );
  useEffect(() => {
    retryRef.current = retryMessage;
  }, [retryMessage]);

  const send = useCallback(async () => {
    if (t.isReadOnlyPreview) return guard();
    haptic.press();
    const r = await t.send();
    if (r.ok) {
      haptic.success();
    } else {
      // The failed bubble stays in the thread with "Tap to retry".
      toast.show({
        tone: "error",
        title: "Message didn't send",
        message: "We kept it — tap Retry or the message to try again.",
        action: r.tempId
          ? { label: "Retry", onPress: () => void retryRef.current?.(r.tempId!) }
          : undefined,
      });
    }
  }, [guard, t, toast]);

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
    } else if (!r.canceled) {
      toast.show({ tone: "error", title: "Couldn't add that photo", message: "Please try another one." });
    }
  }, [t, toast]);

  const attachFile = useCallback(async () => {
    const r = await pickChatFile();
    if (r.ok) {
      t.setPendingFile(r.value);
      t.setPendingImage(null);
      haptic.success();
    } else if (!r.canceled) {
      toast.show({ tone: "error", title: "Couldn't add that file", message: "Please try again." });
    }
  }, [t, toast]);

  const openFile = useCallback(
    async (url: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        toast.show({ tone: "error", title: "Couldn't open that file" });
      }
    },
    [toast],
  );

  // Newest first for the inverted list.
  const items = useMemo(() => [...buildChatItems(t.messages)].reverse(), [t.messages]);
  const canSend = (!!t.inputText.trim() || !!t.pendingImage || !!t.pendingFile) && !t.isReadOnlyPreview;

  const renderItem = ({ item }: { item: ChatListItem<DmMessage> }) => {
    if (item.type === "date") return <DaySeparator label={item.label} />;
    const msg = item.msg;
    const mine = t.isMine(msg.sender_id);
    const showName = t.isGroup && !mine && item.isGroupStart;
    const failed = msg.status === "failed";
    const isLastMine = msg.id === t.lastMineId;
    return (
      <View style={[s.msgWrap, { marginTop: item.isGroupStart ? 8 : 2 }]}>
        {showName ? <Text style={s.sender}>{t.senderNames[msg.sender_id] ?? ""}</Text> : null}
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
          onFilePress={() => msg.file_url && void openFile(msg.file_url)}
          onPress={failed ? () => void retryMessage(msg.id) : undefined}
          accessibilityLabel={`${mine ? "You" : (t.senderNames[msg.sender_id] ?? t.name)}: ${msg.body || msg.file_name || "Photo"}. ${formatClock(msg.created_at)}`}
        />
        {failed ? (
          <MessageMeta mine failed onRetry={() => void retryMessage(msg.id)} />
        ) : msg.status === "sending" ? (
          <MessageMeta mine text="Sending…" />
        ) : item.isGroupEnd ? (
          <MessageMeta
            mine={mine}
            text={`${formatClock(msg.created_at)}${isLastMine ? (msg.read_at ? " · Seen" : " · Sent") : ""}`}
          />
        ) : null}
      </View>
    );
  };

  // Parents: the other side is always a teacher. Staff: only colleagues have a profile to open.
  const profileHref = t.isGroup ? null : routes.profileFor(t.otherId, t.name, t.otherRole);
  const subtitle = !profileHref
    ? null
    : isStaff
      ? t.otherRole === "super_admin"
        ? "Admin · view profile"
        : "Teacher · view profile"
      : "Teacher · view profile";
  const headerLeft = (
    <PressableScale
      disabled={!profileHref}
      haptics={profileHref ? "tap" : false}
      pressedScale={0.98}
      onPress={() => profileHref && router.push(profileHref)}
      accessibilityRole={profileHref ? "link" : "header"}
      accessibilityLabel={profileHref ? `${t.name}, view profile` : t.name}
      style={s.headerWho}
    >
      <GardenAvatar name={t.name} uri={t.isGroup ? null : t.avatar || null} seed={t.otherId || t.id} icon={t.isGroup ? "people" : undefined} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={s.headerName} numberOfLines={1}>
          {t.name}
        </Text>
        {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
      </View>
    </PressableScale>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ChatHeader onBack={back} left={headerLeft} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {t.loading ? (
          <View style={{ flex: 1, padding: 18, gap: 12, justifyContent: "flex-end" }}>
            <GardenSkeleton width="55%" height={44} radius={20} />
            <GardenSkeleton width="40%" height={44} radius={20} style={{ alignSelf: "flex-end" }} />
            <GardenSkeleton width="65%" height={60} radius={20} />
            <GardenSkeleton width="35%" height={44} radius={20} style={{ alignSelf: "flex-end" }} />
          </View>
        ) : t.error ? (
          <View style={{ flex: 1, padding: 18 }}>
            <GardenErrorCard
              title="We couldn't load this chat"
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
            inverted
            data={items}
            keyExtractor={(i) => i.key}
            renderItem={renderItem}
            contentContainerStyle={[s.list, items.length === 0 && { flexGrow: 1 }]}
            onEndReached={() => void t.loadMore()}
            onEndReachedThreshold={0.3}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={t.loadingMore ? <ActivityIndicator color={Garden.sage} style={{ marginVertical: 12 }} /> : null}
            ListEmptyComponent={
              <Animated.View entering={FadeIn} style={s.empty}>
                <GardenAvatar name={t.name} uri={t.isGroup ? null : t.avatar || null} seed={t.otherId || t.id} icon={t.isGroup ? "people" : undefined} size={72} />
                <Text style={s.emptyTitle}>No messages yet</Text>
                <HandNote size={18}>{isStaff ? "say hi 👋" : "say hi to a teacher 👋"}</HandNote>
              </Animated.View>
            }
          />
        )}
        <Composer
          inputRef={inputRef}
          value={t.inputText}
          onChangeText={t.setInputText}
          placeholder="Message…"
          onSend={() => void send()}
          sending={t.sending}
          canSend={canSend}
          onAttachPhoto={() => void attachPhoto()}
          onAttachFile={() => void attachFile()}
          pendingImage={t.pendingImage}
          pendingFile={t.pendingFile}
          onClearImage={() => t.setPendingImage(null)}
          onClearFile={() => t.setPendingFile(null)}
          disabledReason={t.isReadOnlyPreview ? guard : undefined}
        />
      </KeyboardAvoidingView>
      <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  headerWho: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  headerName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16.5, color: Garden.ink },
  headerSub: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  list: { paddingHorizontal: 14, paddingVertical: 12 },
  msgWrap: {},
  sender: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.sageDeep, marginLeft: 8, marginBottom: 3 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, transform: [{ scaleY: -1 }] },
  emptyTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink, marginTop: 6 },
});
