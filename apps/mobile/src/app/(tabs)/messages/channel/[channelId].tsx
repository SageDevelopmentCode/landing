import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import EmojiPicker from "rn-emoji-keyboard";
import type { EmojiType } from "rn-emoji-keyboard";
import { supabase } from "@/lib/supabase";
import {
  getChannelMessages,
  sendChannelMessage,
  editChannelMessage,
  deleteChannelMessage,
  markChannelRead,
  toggleReaction,
  joinChannel,
  leaveChannel,
  uploadChannelMedia,
  getSenderProfile,
  getChannelMembers,
  getChannelMemberCount,
  type ChannelMessageRow,
  type ReactionSummary,
  type ChannelMember,
} from "@/lib/channel-actions";
import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import { LinkableText } from "@/components/LinkableText";

type PendingImage = { uri: string; fileName: string; mimeType: string };
type PendingFile = { uri: string; name: string; mimeType: string };

type ListItem =
  | { type: "message"; msg: ChannelMessageRow; isGroupStart: boolean; key: string }
  | { type: "date"; label: string; key: string };

const QUICK_EMOJIS = ["❤️", "🎉", "🙌", "👀", "💡", "✅"];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ["#4a7c59", "#7c6b4a", "#5a6b8a", "#8a5a6b", "#6b7c4a", "#4a6b7c"];
function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function buildListItems(messages: ChannelMessageRow[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDateStr: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateStr = new Date(msg.created_at).toDateString();

    if (dateStr !== lastDateStr) {
      items.push({ type: "date", label: formatDateLabel(dateStr), key: `date-${dateStr}-${i}` });
      lastDateStr = dateStr;
    }

    const prev = messages[i - 1];
    let isGroupStart = true;
    if (prev && prev.sender_id === msg.sender_id) {
      const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
      if (diff < 5 * 60 * 1000) isGroupStart = false;
    }

    items.push({ type: "message", msg, isGroupStart, key: msg.id });
  }

  return items;
}

export default function ChannelScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    channelId,
    channelName,
    isMember: isMemberParam,
    isDefault: isDefaultParam,
    memberCount: memberCountParam,
  } = useLocalSearchParams<{
    channelId: string;
    channelName: string;
    isMember: string;
    isDefault: string;
    memberCount: string;
  }>();

  const { bottom: safeBottom } = useSafeAreaInsets();
  const isDefault = isDefaultParam === "true";

  const [messages, setMessages] = useState<ChannelMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(parseInt(memberCountParam ?? "0", 10));
  const [isMemberState, setIsMemberState] = useState(isMemberParam === "true");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<ChannelMessageRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const senderCacheRef = useRef<Map<string, { sender_name: string; sender_image_url: string | null }>>(new Map());
  const messageSheetRef = useRef<BottomSheetModal>(null);
  const membersSheetRef = useRef<BottomSheetModal>(null);
  const membersLoadedForRef = useRef<string | null>(null);
  const hasScrolledRef = useRef(false);

  // Hide tab bar while in channel screen
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  // Load messages on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserIdRef.current = user.id;

      const realCount = await getChannelMemberCount(channelId);
      setMemberCount(realCount);

      // Seed sender cache with own profile
      const { data: ownProfile } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, profile_image_url")
        .eq("id", user.id)
        .single();
      if (ownProfile) {
        senderCacheRef.current.set(user.id, {
          sender_name: (ownProfile as any).full_name ?? "You",
          sender_image_url: (ownProfile as any).profile_image_url ?? null,
        });
      }

      if (isMemberState) {
        const msgs = await getChannelMessages(channelId, user.id);
        // Populate sender cache from initial load
        msgs.forEach((m) => {
          if (!senderCacheRef.current.has(m.sender_id)) {
            senderCacheRef.current.set(m.sender_id, {
              sender_name: m.sender_name,
              sender_image_url: m.sender_image_url,
            });
          }
        });
        setMessages(msgs);
        await markChannelRead(channelId, user.id);
      }

      setLoading(false);
    }
    load();
  }, [channelId, isMemberState]);

  // Scroll to bottom after initial messages load
  useEffect(() => {
    if (!loading && messages.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading, messages.length]);

  // Real-time subscription (only while member)
  useEffect(() => {
    if (!isMemberState) return;

    const insertHandler = async (payload: any) => {
      const raw = payload.new as {
        id: string; channel_id: string; sender_id: string;
        body: string; image_url: string | null; file_url: string | null;
        file_name: string | null; created_at: string;
      };

      let sender = senderCacheRef.current.get(raw.sender_id);
      if (!sender) {
        const profile = await getSenderProfile(raw.sender_id);
        sender = {
          sender_name: profile?.full_name ?? "Unknown",
          sender_image_url: profile?.profile_image_url ?? null,
        };
        senderCacheRef.current.set(raw.sender_id, sender);
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === raw.id)) return prev;
        const withoutTemp = prev.filter(
          (m) => !(m.id.startsWith("temp-") && m.sender_id === raw.sender_id && m.body === raw.body)
        );
        return [
          ...withoutTemp,
          {
            id: raw.id,
            channel_id: raw.channel_id,
            sender_id: raw.sender_id,
            sender_name: sender!.sender_name,
            sender_image_url: sender!.sender_image_url,
            body: raw.body,
            image_url: raw.image_url,
            file_url: raw.file_url,
            file_name: raw.file_name,
            created_at: raw.created_at,
            reactions: [],
          },
        ];
      });

      if (raw.sender_id !== currentUserIdRef.current && currentUserIdRef.current) {
        markChannelRead(channelId, currentUserIdRef.current);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const updateHandler = (payload: any) => {
      const raw = payload.new as { id: string; body: string };
      setMessages((prev) =>
        prev.map((m) => (m.id === raw.id ? { ...m, body: raw.body } : m))
      );
    };

    const deleteHandler = (payload: any) => {
      const raw = payload.old as { id: string };
      setMessages((prev) => prev.filter((m) => m.id !== raw.id));
    };

    const reactionHandler = async (payload: any) => {
      const messageId = payload.new?.message_id ?? payload.old?.message_id;
      if (!messageId || !currentUserIdRef.current) return;

      const { data: reactions } = await supabase
        .schema("messaging")
        .from("message_reactions")
        .select("user_id, emoji")
        .eq("message_id", messageId);

      if (!reactions) return;

      const map = new Map<string, ReactionSummary>();
      for (const r of reactions as { user_id: string; emoji: string }[]) {
        const entry = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false };
        entry.count++;
        if (r.user_id === currentUserIdRef.current) entry.reactedByMe = true;
        map.set(r.emoji, entry);
      }
      const updatedReactions = Array.from(map.values());

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
      );
    };

    const sub = supabase
      .channel(`channel-messages:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channelId}` },
        insertHandler
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channelId}` },
        updateHandler
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "messaging", table: "channel_messages", filter: `channel_id=eq.${channelId}` },
        deleteHandler
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "messaging", table: "message_reactions" },
        reactionHandler
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [channelId, isMemberState]);

  async function handleSend() {
    const trimmed = inputText.trim();
    if ((!trimmed && !pendingImage && !pendingFile) || !currentUserIdRef.current || sending) return;

    setSending(true);
    setInputText("");
    const capturedImage = pendingImage;
    const capturedFile = pendingFile;
    setPendingImage(null);
    setPendingFile(null);

    const tempId = `temp-${Date.now()}`;
    const senderInfo = senderCacheRef.current.get(currentUserIdRef.current);

    const tempMsg: ChannelMessageRow = {
      id: tempId,
      channel_id: channelId,
      sender_id: currentUserIdRef.current,
      sender_name: senderInfo?.sender_name ?? "You",
      sender_image_url: senderInfo?.sender_image_url ?? null,
      body: trimmed,
      image_url: null,
      file_url: null,
      file_name: null,
      created_at: new Date().toISOString(),
      reactions: [],
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      let imageUrl: string | null = null;
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (capturedImage) {
        imageUrl = await uploadChannelMedia(
          "message-images",
          capturedImage.uri,
          capturedImage.mimeType,
          channelId,
          currentUserIdRef.current,
          capturedImage.fileName
        );
      } else if (capturedFile) {
        fileUrl = await uploadChannelMedia(
          "message-files",
          capturedFile.uri,
          capturedFile.mimeType,
          channelId,
          currentUserIdRef.current,
          capturedFile.name
        );
        fileName = capturedFile.name;
      }

      const real = await sendChannelMessage(
        channelId,
        trimmed,
        currentUserIdRef.current,
        imageUrl,
        fileUrl,
        fileName
      );

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (!real) return withoutTemp;
        if (withoutTemp.some((m) => m.id === real.id)) return withoutTemp;
        return [...withoutTemp, real];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function handleLongPress(msg: ChannelMessageRow) {
    setSelectedMsg(msg);
    messageSheetRef.current?.present();
  }

  async function handleSheetReaction(emoji: string) {
    if (!selectedMsg || !currentUserIdRef.current) return;
    messageSheetRef.current?.dismiss();
    const updated = await toggleReaction(selectedMsg.id, emoji, currentUserIdRef.current);
    if (updated) {
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMsg.id ? { ...m, reactions: updated } : m))
      );
    }
  }

  async function handlePillReaction(messageId: string, emoji: string) {
    if (!currentUserIdRef.current) return;
    const updated = await toggleReaction(messageId, emoji, currentUserIdRef.current);
    if (updated) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updated } : m))
      );
    }
  }

  function handleStartEdit() {
    if (!selectedMsg) return;
    messageSheetRef.current?.dismiss();
    setEditingId(selectedMsg.id);
    setEditingText(selectedMsg.body);
  }

  async function handleEditSave() {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const ok = await editChannelMessage(editingId, trimmed);
    if (ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, body: trimmed } : m))
      );
    }
    setEditingId(null);
  }

  async function handleDeleteMessage() {
    if (!selectedMsg) return;
    messageSheetRef.current?.dismiss();
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteChannelMessage(selectedMsg.id);
          if (ok) {
            setMessages((prev) => prev.filter((m) => m.id !== selectedMsg.id));
          }
        },
      },
    ]);
  }

  async function handleJoin() {
    if (!currentUserIdRef.current || joining) return;
    setJoining(true);
    const ok = await joinChannel(channelId, currentUserIdRef.current);
    if (ok) {
      setIsMemberState(true);
      setMemberCount((c) => c + 1);
      hasScrolledRef.current = false;
    } else {
      Alert.alert(
        "Could not join channel",
        "Something went wrong. Please try again or contact support.",
        [
          { text: "Dismiss", style: "cancel" },
          { text: "Get Help", onPress: () => router.push("/(tabs)/help") },
        ]
      );
    }
    setJoining(false);
  }

  async function openMembersSheet() {
    membersSheetRef.current?.present();
    if (membersLoadedForRef.current === channelId) return;
    setLoadingMembers(true);
    const fetched = await getChannelMembers(channelId);
    setMembers(fetched);
    membersLoadedForRef.current = channelId;
    setLoadingMembers(false);
  }

  async function handleLeave() {
    if (!currentUserIdRef.current) return;
    Alert.alert("Leave Channel", `Leave #${channelName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const ok = await leaveChannel(channelId, currentUserIdRef.current!);
          if (ok) {
            router.back();
          }
        },
      },
    ]);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const compressed = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    setPendingImage({ uri: compressed.uri, fileName: `photo_${Date.now()}.jpg`, mimeType: "image/jpeg" });
    setPendingFile(null);
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPendingFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? "application/octet-stream" });
    setPendingImage(null);
  }

  const listItems = useMemo(() => buildListItems(messages), [messages]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  function renderItem({ item }: { item: ListItem }) {
    if (item.type === "date") {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const { msg, isGroupStart } = item;
    const isOwn = msg.sender_id === currentUserIdRef.current;
    const isTemp = msg.id.startsWith("temp-");
    const isEditing = editingId === msg.id;

    return (
      <Pressable
        onLongPress={() => !isTemp && handleLongPress(msg)}
        style={[styles.messageRow, isTemp && styles.tempMessage]}
        delayLongPress={350}
      >
        {isGroupStart ? (
          <View style={styles.avatarContainer}>
            {msg.sender_image_url ? (
              <Image source={{ uri: msg.sender_image_url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{getInitials(msg.sender_name)}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.avatarSpacer} />
        )}

        <View style={styles.messageContent}>
          {isGroupStart && (
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>{msg.sender_name}</Text>
              <Text style={styles.messageTime}>{formatTime(msg.created_at)}</Text>
            </View>
          )}

          {isEditing ? (
            <View style={styles.editWrapper}>
              <TextInput
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                autoFocus
                multiline
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditingId(null)} style={styles.editBtn} hitSlop={8}>
                  <Ionicons name="close" size={18} color="#6b7280" />
                </Pressable>
                <Pressable onPress={handleEditSave} style={styles.editBtn} hitSlop={8}>
                  <Ionicons name="checkmark" size={18} color={Brand.sage700} />
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {msg.image_url ? (
                <Pressable onPress={() => setSelectedImageUrl(msg.image_url!)}>
                  <Image source={{ uri: msg.image_url }} style={styles.messageImage} resizeMode="cover" />
                </Pressable>
              ) : null}
              {msg.file_url && msg.file_name ? (
                <Pressable style={styles.fileRow} onPress={() => Linking.openURL(msg.file_url!)}>
                  <Ionicons name="document-outline" size={16} color="#6b7280" />
                  <Text style={styles.fileName} numberOfLines={1}>{msg.file_name}</Text>
                  <Ionicons name="download-outline" size={14} color="#9ca3af" />
                </Pressable>
              ) : null}
              {msg.body ? (
                <LinkableText style={styles.messageBody} linkStyle={styles.messageLink}>
                  {msg.body}
                </LinkableText>
              ) : null}

              {!isTemp && msg.reactions.length > 0 && (
                <View style={styles.reactionsRow}>
                  {msg.reactions.map((r) => (
                    <Pressable
                      key={r.emoji}
                      style={[styles.reactionPill, r.reactedByMe && styles.reactionPillOwn]}
                      onPress={() => handlePillReaction(msg.id, r.emoji)}
                    >
                      <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                      <Text style={[styles.reactionCount, r.reactedByMe && styles.reactionCountOwn]}>
                        {r.count}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {isOwn && !isTemp && !isEditing && (
          <View style={styles.ownIndicator} />
        )}
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={Brand.sage700} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerHashCircle}>
            <Text style={styles.headerHash}>#</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerName} numberOfLines={1}>{channelName}</Text>
            <Pressable onPress={openMembersSheet} hitSlop={8}>
              <Text style={[styles.headerCount, styles.headerCountLink]}>{memberCount} {memberCount === 1 ? "member" : "members"}</Text>
            </Pressable>
          </View>
        </View>

        {!isDefault && isMemberState && (
          <Pressable
            style={({ pressed }) => [styles.leaveBtn, pressed && styles.pressed]}
            onPress={handleLeave}
          >
            <Text style={styles.leaveBtnText}>Leave</Text>
          </Pressable>
        )}
        {!isMemberState && (
          <Pressable
            style={({ pressed }) => [styles.joinHeaderBtn, pressed && styles.pressed]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinHeaderBtnText}>Join</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Chat area */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.sage700} />
          </View>
        ) : !isMemberState ? (
          <View style={styles.notMemberContainer}>
            <Ionicons name="lock-closed-outline" size={40} color="#d1d5db" />
            <Text style={styles.notMemberTitle}>Join to see messages</Text>
            <Text style={styles.notMemberBody}>Become a member to read and participate in #{channelName}.</Text>
            <Pressable
              style={({ pressed }) => [styles.joinLargeBtn, pressed && styles.pressed]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.joinLargeBtnText}>Join Channel</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listItems}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.messageList}
            removeClippedSubviews
            maxToRenderPerBatch={15}
            windowSize={10}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet. Say hello! 👋</Text>
              </View>
            }
          />
        )}

        {/* Attachment preview bar */}
        {(pendingImage || pendingFile) && (
          <View style={styles.previewBar}>
            {pendingImage && (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: pendingImage.uri }} style={styles.imagePreview} resizeMode="cover" />
                <Pressable style={styles.previewRemove} onPress={() => setPendingImage(null)}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </Pressable>
              </View>
            )}
            {pendingFile && (
              <View style={styles.filePill}>
                <Ionicons name="document-outline" size={16} color="#4b5563" />
                <Text style={styles.filePillName} numberOfLines={1}>{pendingFile.name}</Text>
                <Pressable onPress={() => setPendingFile(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Input bar */}
        {isMemberState && (
          <View style={[styles.inputRow, (pendingImage || pendingFile) && styles.inputRowNoTopBorder, { paddingBottom: safeBottom || 12 }]}>
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.pressed]}
              onPress={pickImage}
              hitSlop={6}
            >
              <Ionicons name="image-outline" size={22} color={Brand.sage700} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.pressed]}
              onPress={pickFile}
              hitSlop={6}
            >
              <Ionicons name="attach-outline" size={22} color={Brand.sage700} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message #${channelName}`}
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                (!inputText.trim() && !pendingImage && !pendingFile) && styles.sendBtnDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !pendingImage && !pendingFile) || sending || !currentUserIdRef.current}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Message action bottom sheet */}
      <BottomSheetModal
        ref={messageSheetRef}
        snapPoints={["38%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>React</Text>
          <View style={styles.quickEmojiRow}>
            {QUICK_EMOJIS.map((e) => (
              <Pressable
                key={e}
                style={({ pressed }) => [styles.quickEmoji, pressed && styles.pressed]}
                onPress={() => handleSheetReaction(e)}
              >
                <Text style={styles.quickEmojiText}>{e}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.quickEmojiMore, pressed && styles.pressed]}
              onPress={() => {
                messageSheetRef.current?.dismiss();
                setShowEmojiPicker(true);
              }}
            >
              <Ionicons name="add" size={20} color="#6b7280" />
            </Pressable>
          </View>

          {selectedMsg?.sender_id === currentUserIdRef.current && (
            <>
              <View style={styles.sheetDivider} />
              <Pressable
                style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}
                onPress={handleStartEdit}
              >
                <Ionicons name="pencil-outline" size={20} color="#374151" />
                <Text style={styles.sheetActionText}>Edit Message</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}
                onPress={handleDeleteMessage}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={[styles.sheetActionText, styles.sheetActionDestructive]}>Delete Message</Text>
              </Pressable>
            </>
          )}
          <View style={styles.sheetBottomPad} />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Members bottom sheet */}
      <BottomSheetModal
        ref={membersSheetRef}
        snapPoints={["60%", "90%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetFlatList<ChannelMember>
          data={members}
          keyExtractor={(m: ChannelMember) => m.id}
          ListHeaderComponent={
            <View style={styles.membersSheetHeader}>
              <Text style={styles.membersSheetTitle}>Members</Text>
              <Text style={styles.membersSheetSub}>#{channelName}</Text>
            </View>
          }
          ListEmptyComponent={
            loadingMembers ? (
              <ActivityIndicator color={Brand.sage700} style={{ marginTop: 32 }} />
            ) : (
              <Text style={styles.membersEmpty}>No members found</Text>
            )
          }
          renderItem={({ item: member }: { item: ChannelMember }) => (
            <View style={styles.memberRow}>
              <View style={styles.memberMain}>
                {member.profile_image_url ? (
                  <Image source={{ uri: member.profile_image_url }} style={styles.memberAvatarLg} />
                ) : (
                  <View style={[styles.memberAvatarLg, { backgroundColor: colorForId(member.id) }]}>
                    <Text style={styles.memberAvatarText}>{getInitials(member.full_name)}</Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.full_name}</Text>
                  {member.role && (
                    <Text style={styles.memberRole}>
                      {member.role === "parent" ? "Parent" : "Teacher"}
                    </Text>
                  )}
                </View>
              </View>
              {member.children.map((child: ChannelMember["children"][number]) => (
                <View key={child.id} style={styles.childRow}>
                  {child.profile_image_url ? (
                    <Image source={{ uri: child.profile_image_url }} style={styles.memberAvatarSm} />
                  ) : (
                    <View style={[styles.memberAvatarSm, { backgroundColor: colorForId(child.id) }]}>
                      <Text style={styles.memberAvatarSmText}>{getInitials(child.child_legal_name)}</Text>
                    </View>
                  )}
                  <Text style={styles.childName}>{child.child_legal_name}</Text>
                </View>
              ))}
            </View>
          )}
        />
      </BottomSheetModal>

      {/* Full emoji picker */}
      <EmojiPicker
        open={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelected={(emoji: EmojiType) => {
          if (selectedMsg && currentUserIdRef.current) {
            setShowEmojiPicker(false);
            toggleReaction(selectedMsg.id, emoji.emoji, currentUserIdRef.current).then((updated) => {
              if (updated) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === selectedMsg.id ? { ...m, reactions: updated } : m))
                );
              }
            });
          }
        }}
      />

      {/* Image viewer */}
      <Modal
        visible={selectedImageUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <Pressable style={styles.imageViewerBackdrop} onPress={() => setSelectedImageUrl(null)}>
          <Image source={{ uri: selectedImageUrl! }} style={styles.imageViewerImg} resizeMode="contain" />
        </Pressable>
        <Pressable
          style={styles.imageViewerClose}
          onPress={() => setSelectedImageUrl(null)}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  backBtn: { padding: 2 },
  pressed: { opacity: 0.6 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  headerHashCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerHash: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: Brand.sage700,
  },
  headerMeta: { flex: 1, minWidth: 0 },
  headerName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  headerCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  leaveBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  leaveBtnText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  joinHeaderBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: "center",
  },
  joinHeaderBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#fff",
  },

  // Message list
  messageList: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notMemberContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  notMemberTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#374151",
    marginTop: 8,
  },
  notMemberBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  joinLargeBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 8,
    minWidth: 160,
    alignItems: "center",
  },
  joinLargeBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
  emptyChat: {
    paddingTop: 48,
    alignItems: "center",
  },
  emptyChatText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  // Date separator
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 10,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
  },
  dateLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },

  // Message row
  messageRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 10,
  },
  tempMessage: { opacity: 0.55 },
  avatarContainer: {
    width: AVATAR_SIZE,
    flexShrink: 0,
    paddingTop: 2,
  },
  avatarSpacer: {
    width: AVATAR_SIZE,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  messageContent: { flex: 1, minWidth: 0, paddingBottom: 2 },
  messageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 2,
  },
  senderName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  messageTime: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  messageBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  messageLink: {
    color: Brand.sage700,
    textDecorationLine: "underline",
  },
  messageImage: {
    width: 200,
    height: 180,
    borderRadius: 10,
    marginTop: 4,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    maxWidth: 260,
    marginTop: 4,
  },
  fileName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#1f2937",
  },
  ownIndicator: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: "#E0EDE2",
    borderRadius: 2,
    marginTop: 2,
  },

  // Reactions
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reactionPillOwn: {
    backgroundColor: "#eef4f0",
    borderColor: "#b5cebe",
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  reactionCountOwn: { color: Brand.sage700 },

  // Edit inline
  editWrapper: { gap: 6 },
  editInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Attachment preview
  previewBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  imagePreviewWrapper: {
    position: "relative",
    width: 72,
    height: 72,
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  filePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  filePillName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#1f2937",
  },

  // Input bar
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  inputRowNoTopBorder: {
    borderTopWidth: 0,
    paddingTop: 4,
  },
  attachBtn: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.coral,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.4 },

  // Bottom sheet
  sheetBg: { backgroundColor: "#fff" },
  sheetHandle: { backgroundColor: "#d1d5db", width: 40 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 8 },
  sheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickEmojiRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  quickEmoji: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  quickEmojiText: { fontSize: 22 },
  quickEmojiMore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  sheetAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  sheetActionText: {
    fontFamily: FontFamilies.body,
    fontSize: 16,
    color: "#1f2937",
  },
  sheetActionDestructive: { color: "#ef4444" },
  sheetBottomPad: { height: 24 },

  // Members sheet
  headerCountLink: { color: Brand.sage700 },
  membersSheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  membersSheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  membersSheetSub: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  membersEmpty: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
    fontFamily: FontFamilies.body,
  },
  memberRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  memberMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberInfo: { flex: 1 },
  memberName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  memberRole: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginLeft: 48,
  },
  childName: { fontFamily: FontFamilies.body, fontSize: 11, color: "#6b7280" },
  memberAvatarLg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  memberAvatarSmText: { color: "#fff", fontSize: 9, fontWeight: "600" },

  // Image viewer
  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerImg: { width: "100%", height: "100%" },
  imageViewerClose: {
    position: "absolute",
    top: 56,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
});
