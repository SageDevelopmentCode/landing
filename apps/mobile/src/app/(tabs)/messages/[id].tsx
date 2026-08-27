import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { LinkableText } from "@/components/LinkableText";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { SafeAreaView } from "react-native-safe-area-context";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

type PendingImage = { uri: string; fileName: string; mimeType: string };
type PendingFile = { uri: string; name: string; mimeType: string };

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  read_at: string | null;
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

const PAGE_SIZE = 30;

async function markMessagesRead(conversationId: string, userId: string) {
  await supabase
    .schema("messaging")
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export default function ChatScreen() {
  const router = useRouter();
  const { id, otherUserName, otherUserAvatar: otherUserAvatarParam, otherUserId } =
    useLocalSearchParams<{
      id: string;
      otherUserName: string;
      otherUserAvatar: string;
      otherUserId: string;
    }>();
  const [resolvedAvatar, setResolvedAvatar] = useState(otherUserAvatarParam ?? "");
  const [resolvedName, setResolvedName] = useState(otherUserName ?? '');
  const [resolvedOtherUserId, setResolvedOtherUserId] = useState(otherUserId ?? '');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const attachMenuAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(attachMenuAnim, {
      toValue: attachMenuOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 320,
      friction: 22,
    }).start();
  }, [attachMenuOpen]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const compressed = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    setPendingImage({
      uri: compressed.uri,
      fileName: `photo_${Date.now()}.jpg`,
      mimeType: "image/jpeg",
    });
    setPendingFile(null);
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPendingFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "application/octet-stream",
    });
    setPendingImage(null);
  }

  async function uploadToStorage(
    bucket: string,
    storagePath: string,
    uri: string,
    contentType: string,
  ): Promise<string> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": contentType,
      },
      body: blob,
    });
    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${bodyText}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  }

  async function uploadImage(
    userId: string,
    conversationId: string,
    img: PendingImage,
  ) {
    const safeName = img.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${conversationId}/${Date.now()}-${safeName}`;
    return uploadToStorage("message-images", path, img.uri, img.mimeType);
  }

  async function uploadFile(
    userId: string,
    conversationId: string,
    file: PendingFile,
  ) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${conversationId}/${Date.now()}-${safeName}`;
    const url = await uploadToStorage(
      "message-files",
      path,
      file.uri,
      file.mimeType,
    );
    return { url, name: file.name };
  }

  // Load current user + initial page of messages (newest PAGE_SIZE)
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      if (!otherUserId || !otherUserName) {
        const { data: convs } = await supabase.rpc('get_conversation_list', { p_user_id: user.id });
        const match = (convs as any[])?.find((c: any) => c.id === id);
        if (match) {
          if (!otherUserName) setResolvedName(match.other_user_name ?? '');
          if (!otherUserId) {
            setResolvedOtherUserId(match.other_user_id ?? '');
            if (match.other_user_profile_image) setResolvedAvatar(match.other_user_profile_image);
          }
          setIsGroup(Boolean(match.is_group));
        }
      }

      const { data: convoMeta } = await supabase
        .schema("messaging")
        .from("conversations")
        .select("kind")
        .eq("id", id)
        .maybeSingle();
      if (convoMeta?.kind === "household_teacher") setIsGroup(true);

      if (otherUserId) {
        const { data: profile } = await supabase
          .schema("admin")
          .from("users")
          .select("profile_image_url")
          .eq("id", otherUserId)
          .single();
        if (profile?.profile_image_url) setResolvedAvatar(profile.profile_image_url);
      }

      const { data } = await supabase
        .schema("messaging")
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (data) {
        setMessages([...data].reverse());
        setHasMore(data.length === PAGE_SIZE);

        if (convoMeta?.kind === "household_teacher") {
          const senderIds = [...new Set(data.map((m) => m.sender_id))];
          const { data: users } = await supabase
            .schema("admin")
            .from("users")
            .select("id, full_name")
            .in("id", senderIds);
          setSenderNames(
            Object.fromEntries(
              (users ?? []).map((u) => [u.id, u.full_name ?? "Unknown"]),
            ),
          );
        }
      }
    }
    load();
  }, [id]);

  // Load older messages when user scrolls to the top
  async function loadMore() {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldest = messages[0];
    const { data } = await supabase
      .schema("messaging")
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      setMessages((prev) => [...[...data].reverse(), ...prev]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "messaging",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          console.log("[Realtime] received message:", payload.new);
          setMessages((prev) => {
            const incoming = payload.new as Message;
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        },
      )
      .subscribe((status, err) => {
        console.log("[Realtime] status:", status, err ?? "");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation
          .getParent()
          ?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation]),
  );

  // Mark as read every time this screen gains focus, fetching userId fresh
  useFocusEffect(
    useCallback(() => {
      async function markRead() {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await markMessagesRead(id, user.id);
      }
      markRead();
    }, [id]),
  );

  async function handleSend() {
    const trimmed = inputText.trim();
    if ((!trimmed && !pendingImage && !pendingFile) || !currentUserId) return;

    setSending(true);
    setInputText("");
    const capturedImage = pendingImage;
    const capturedFile = pendingFile;
    setPendingImage(null);
    setPendingFile(null);

    try {
      let imageUrl: string | null = null;
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (capturedImage) {
        imageUrl = await uploadImage(currentUserId, id, capturedImage);
      } else if (capturedFile) {
        const result = await uploadFile(currentUserId, id, capturedFile);
        fileUrl = result.url;
        fileName = result.name;
      }

      await supabase
        .schema("messaging")
        .from("messages")
        .insert({
          conversation_id: id,
          sender_id: currentUserId,
          body: trimmed || "",
          image_url: imageUrl,
          file_url: fileUrl,
          file_name: fileName,
        });
    } catch (e) {
      notifyError("parent-send-message", e);
      Alert.alert(
        "Error",
        `Failed to send message: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/(tabs)/messages")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.headerUserPressable,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            if (resolvedOtherUserId) {
              router.push({
                pathname: "/(tabs)/teacher/[teacherId]",
                params: { teacherId: resolvedOtherUserId, teacherName: resolvedName },
              });
            }
          }}
          hitSlop={4}
        >
          {resolvedAvatar ? (
            <Image
              source={{ uri: resolvedAvatar }}
              style={styles.headerAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {getInitials(resolvedName || "?")}
              </Text>
            </View>
          )}
          <Text style={styles.headerName} numberOfLines={1}>
            {resolvedName}
          </Text>
        </Pressable>
      </View>

      {/* Chat area */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          inverted
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Brand.sage700}
                style={styles.loadingMore}
              />
            ) : null
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={20}
          renderItem={({ item }) => {
            const isMine = item.sender_id === currentUserId;
            const senderLabel = isGroup && !isMine ? senderNames[item.sender_id] : null;
            return (
              <View
                style={[
                  styles.bubbleWrapper,
                  isMine ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
                ]}
              >
                {senderLabel ? (
                  <Text style={styles.senderName}>{senderLabel}</Text>
                ) : null}
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : styles.bubbleTheirs,
                    item.image_url && !item.body
                      ? styles.bubbleImageOnly
                      : null,
                    item.file_url && !item.body && !item.image_url
                      ? styles.bubbleFileOnly
                      : null,
                  ]}
                >
                  {item.image_url ? (
                    <Pressable
                      onPress={() => setSelectedImageUrl(item.image_url!)}
                    >
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.bubbleImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ) : null}
                  {item.file_url && item.file_name ? (
                    <Pressable
                      style={[
                        styles.fileRow,
                        isMine ? styles.fileRowMine : styles.fileRowTheirs,
                      ]}
                      onPress={() => Linking.openURL(item.file_url!)}
                    >
                      <Ionicons
                        name="document-outline"
                        size={18}
                        color={isMine ? "rgba(255,255,255,0.85)" : "#6b7280"}
                      />
                      <Text
                        style={[
                          styles.fileName,
                          isMine ? styles.fileNameMine : styles.fileNameTheirs,
                        ]}
                        numberOfLines={1}
                      >
                        {item.file_name}
                      </Text>
                      <Ionicons
                        name="download-outline"
                        size={16}
                        color={isMine ? "rgba(255,255,255,0.7)" : "#9ca3af"}
                      />
                    </Pressable>
                  ) : null}
                  {item.body ? (
                    <LinkableText
                      style={[
                        styles.bubbleText,
                        isMine
                          ? styles.bubbleTextMine
                          : styles.bubbleTextTheirs,
                      ]}
                      linkStyle={styles.bubbleLink}
                    >
                      {item.body}
                    </LinkableText>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.bubbleTime,
                    isMine ? styles.bubbleTimeRight : styles.bubbleTimeLeft,
                  ]}
                >
                  {formatMessageTime(item.created_at)}
                </Text>
              </View>
            );
          }}
        />

        {attachMenuOpen && (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setAttachMenuOpen(false)}
          />
        )}

        {/* Attachment previews */}
        {(pendingImage || pendingFile) && (
          <View style={styles.previewBar}>
            {pendingImage && (
              <View style={styles.imagePreviewWrapper}>
                <Image
                  source={{ uri: pendingImage.uri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.previewRemove}
                  onPress={() => setPendingImage(null)}
                >
                  <Ionicons name="close-circle" size={20} color="#ffffff" />
                </Pressable>
              </View>
            )}
            {pendingFile && (
              <View style={styles.filePill}>
                <Ionicons name="document-outline" size={16} color="#4b5563" />
                <Text style={styles.filePillName} numberOfLines={1}>
                  {pendingFile.name}
                </Text>
                <Pressable onPress={() => setPendingFile(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputWrapper}>
          <Animated.View
            pointerEvents={attachMenuOpen ? "auto" : "none"}
            style={[
              styles.attachMenu,
              {
                opacity: attachMenuAnim,
                transform: [
                  {
                    scale: attachMenuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.88, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              style={styles.attachMenuItem}
              onPress={() => {
                setAttachMenuOpen(false);
                pickImage();
              }}
            >
              <Ionicons name="image-outline" size={22} color={Brand.sage700} />
              <Text style={styles.attachMenuLabel}>Upload Photo</Text>
            </Pressable>
            <View style={styles.attachMenuDivider} />
            <Pressable
              style={styles.attachMenuItem}
              onPress={() => {
                setAttachMenuOpen(false);
                pickFile();
              }}
            >
              <Ionicons name="attach-outline" size={22} color={Brand.sage700} />
              <Text style={styles.attachMenuLabel}>Upload File</Text>
            </Pressable>
          </Animated.View>
          <View
            style={[
              styles.inputRow,
              (pendingImage || pendingFile) && styles.inputRowNoTopBorder,
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.attachButton,
                pressed && styles.pressed,
              ]}
              onPress={() => setAttachMenuOpen((v) => !v)}
              hitSlop={6}
            >
              <Ionicons name="add" size={24} color={Brand.sage700} />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message…"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={2000}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                !inputText.trim() &&
                  !pendingImage &&
                  !pendingFile &&
                  styles.sendButtonDisabled,
                sending && styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleSend}
              disabled={
                (!inputText.trim() && !pendingImage && !pendingFile) ||
                sending ||
                !currentUserId
              }
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={16} color="#ffffff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={selectedImageUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <Pressable
          style={styles.imageViewerBackdrop}
          onPress={() => setSelectedImageUrl(null)}
        >
          <Image
            source={{ uri: selectedImageUrl! }}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
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
    backgroundColor: "#ffffff",
  },
  backButton: { padding: 2 },
  headerUserPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  pressed: { opacity: 0.6 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  headerName: {
    flex: 1,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },

  // Message list
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  loadingMore: {
    paddingVertical: 12,
  },
  bubbleWrapper: {
    marginVertical: 2,
  },
  senderName: {
    fontSize: 11,
    fontFamily: FontFamilies.semibold,
    color: Brand.sage700,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubbleWrapperRight: { alignItems: "flex-end" },
  bubbleWrapperLeft: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: Brand.sage700,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 4,
  },
  bubbleImageOnly: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },
  bubbleFileOnly: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  bubbleImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerClose: {
    position: "absolute",
    top: 56,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
  bubbleText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: { color: "#ffffff" },
  bubbleTextTheirs: { color: "#1f2937" },
  bubbleLink: { textDecorationLine: "underline", opacity: 0.85 },

  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 160,
    maxWidth: 240,
  },
  fileRowMine: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  fileRowTheirs: {
    backgroundColor: "#e5e7eb",
  },
  fileName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
  },
  fileNameMine: { color: "#ffffff" },
  fileNameTheirs: { color: "#1f2937" },

  // Attachment preview bar
  previewBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    backgroundColor: "#ffffff",
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  inputRowNoTopBorder: {
    borderTopWidth: 0,
    paddingTop: 4,
  },
  attachButton: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    position: "relative",
  },
  attachMenu: {
    position: "absolute",
    bottom: 68,
    left: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    overflow: "hidden",
    minWidth: 190,
    zIndex: 100,
  },
  attachMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  attachMenuLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },
  attachMenuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
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
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f29a8f",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  bubbleTime: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 3,
  },
  bubbleTimeRight: { textAlign: "right" },
  bubbleTimeLeft: { textAlign: "left" },
});
