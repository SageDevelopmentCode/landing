import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { Brand, FontFamilies } from "@/constants/theme";
import {
  getParentsForTeacher,
  type ParentWithChildren,
  type ParentsForTeacher,
} from "@/lib/teacher-messaging";

// ── helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#4a7c59",
  "#7c6b4a",
  "#5a6b8a",
  "#8a5a6b",
  "#6b7c4a",
  "#4a6b7c",
];
function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function filterDirectory(
  dir: ParentsForTeacher,
  query: string
): ParentsForTeacher {
  if (!query.trim()) return dir;
  const q = query.toLowerCase();
  const match = (p: ParentWithChildren) =>
    p.full_name.toLowerCase().includes(q) ||
    p.children.some((c) => c.child_legal_name.toLowerCase().includes(q));
  return {
    myStudentsParents: dir.myStudentsParents.filter(match),
    allParents: dir.allParents.filter(match),
  };
}

function chunkPairs<T>(arr: T[]): [T, T | null][] {
  const rows: [T, T | null][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    rows.push([arr[i], arr[i + 1] ?? null]);
  }
  return rows;
}

// ── types ────────────────────────────────────────────────────────────────────

type PendingImage = { uri: string; name: string; type: string };

// ── component ────────────────────────────────────────────────────────────────

export default function StaffComposeScreen() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // directory
  const directoryCache = useRef<ParentsForTeacher | null>(null);
  const [parentDirectory, setParentDirectory] =
    useState<ParentsForTeacher | null>(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // selection
  const [selectedRecipients, setSelectedRecipients] = useState<
    ParentWithChildren[]
  >([]);
  const [recipientSearch, setRecipientSearch] = useState("");

  // compose
  const [modalDraft, setModalDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [creatingConvo, setCreatingConvo] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        loadDirectory(user.id);
      }
    });
  }, []);

  async function loadDirectory(teacherId: string) {
    if (directoryCache.current) {
      setParentDirectory(directoryCache.current);
      return;
    }
    setLoadingDirectory(true);
    try {
      const dir = await getParentsForTeacher(teacherId);
      directoryCache.current = dir;
      setParentDirectory(dir);
    } finally {
      setLoadingDirectory(false);
    }
  }

  // ── selection helpers ─────────────────────────────────────────────────────

  const isSelected = (id: string) =>
    selectedRecipients.some((r) => r.id === id);

  function toggleRecipient(parent: ParentWithChildren) {
    setSelectedRecipients((prev) =>
      prev.some((r) => r.id === parent.id)
        ? prev.filter((r) => r.id !== parent.id)
        : [...prev, parent]
    );
  }

  function removeRecipient(id: string) {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  // ── image picker ──────────────────────────────────────────────────────────

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
    const type = asset.mimeType ?? "image/jpeg";
    setPendingImage({ uri: asset.uri, name, type });
    setImagePreview(asset.uri);
  }

  // ── send ──────────────────────────────────────────────────────────────────

  async function handleSend() {
    if (
      !currentUserId ||
      selectedRecipients.length === 0 ||
      (!modalDraft.trim() && !pendingImage) ||
      sending ||
      creatingConvo
    )
      return;

    setSendError(null);
    setCreatingConvo(true);

    // 1. create/find conversations in parallel
    const convoResults = await Promise.all(
      selectedRecipients.map(async (r) => {
        const { data, error } = await supabase.rpc(
          "find_or_create_conversation",
          { other_user_id: r.id }
        );
        return { recipient: r, conversationId: data as string | null, error };
      })
    );

    const successPairs = convoResults.filter((c) => c.conversationId);
    const failures = convoResults.filter((c) => !c.conversationId);

    if (successPairs.length === 0) {
      setSendError("Failed to create conversations. Please try again.");
      setCreatingConvo(false);
      return;
    }

    setSending(true);
    setCreatingConvo(false);

    // 2. upload image once (to first convo's path)
    let imageUrl: string | null = null;
    if (pendingImage) {
      try {
        const firstConvoId = successPairs[0].conversationId!;
        const path = `${currentUserId}/${firstConvoId}/${Date.now()}-${pendingImage.name}`;
        const response = await fetch(pendingImage.uri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from("message-images")
          .upload(path, blob, { contentType: pendingImage.type });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("message-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      } catch {
        // proceed without image if upload fails
      }
    }

    // 3. send message to each conversation sequentially
    let lastSentConvoId: string | null = null;
    let lastSentRecipient: ParentWithChildren | null = null;
    const sendFailures: string[] = [];

    for (const pair of successPairs) {
      const { error: msgError } = await supabase
        .schema("messaging")
        .from("messages")
        .insert({
          conversation_id: pair.conversationId,
          sender_id: currentUserId,
          body: modalDraft.trim(),
          image_url: imageUrl,
        });

      if (msgError) {
        sendFailures.push(pair.recipient.full_name);
        continue;
      }

      await supabase
        .schema("messaging")
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", pair.conversationId);

      lastSentConvoId = pair.conversationId;
      lastSentRecipient = pair.recipient;
    }

    setSending(false);

    if (failures.length > 0 || sendFailures.length > 0) {
      const names = [
        ...failures.map((f) => f.recipient.full_name),
        ...sendFailures,
      ].join(", ");
      setSendError(`Failed to send to: ${names}`);
    }

    if (lastSentConvoId && lastSentRecipient) {
      router.replace({
        pathname: "/(staff)/messages/[id]",
        params: {
          id: lastSentConvoId,
          otherUserName: lastSentRecipient.full_name,
          otherUserAvatar: lastSentRecipient.profile_image_url ?? "",
          otherUserId: lastSentRecipient.id,
        },
      });
    }
  }

  // ── reset & close ─────────────────────────────────────────────────────────

  function handleClose() {
    router.back();
  }

  function goBack() {
    setStep(1);
    setSendError(null);
  }

  // ── filtered directory ────────────────────────────────────────────────────

  const filtered = parentDirectory
    ? filterDirectory(parentDirectory, recipientSearch)
    : null;

  // ── render ────────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>
            {selectedRecipients.length > 0
              ? `Select Recipients (${selectedRecipients.length})`
              : "Select Recipients"}
          </Text>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </Pressable>
        </View>

        {/* Selected pills */}
        {selectedRecipients.length > 0 && (
          <View style={styles.pillsRow}>
            {selectedRecipients.map((r) => (
              <View key={r.id} style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>
                  {r.full_name}
                </Text>
                <Pressable
                  onPress={() => removeRecipient(r.id)}
                  hitSlop={6}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Ionicons name="close" size={14} color={Brand.sage700} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            value={recipientSearch}
            onChangeText={setRecipientSearch}
            placeholder="Search by name or child..."
            placeholderTextColor="#9ca3af"
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.divider} />

        {/* Directory */}
        {loadingDirectory ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Brand.sage700} />
            <Text style={styles.hintText}>Loading parents…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.directoryContent}
            keyboardShouldPersistTaps="handled"
          >
            {filtered && filtered.myStudentsParents.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>MY STUDENTS' PARENTS</Text>
                {chunkPairs(filtered.myStudentsParents).map((row, i) => (
                  <View key={`my-${i}`} style={styles.cardRow}>
                    <ParentCard
                      parent={row[0]}
                      selected={isSelected(row[0].id)}
                      onPress={() => toggleRecipient(row[0])}
                    />
                    {row[1] ? (
                      <ParentCard
                        parent={row[1]}
                        selected={isSelected(row[1].id)}
                        onPress={() => toggleRecipient(row[1]!)}
                      />
                    ) : (
                      <View style={styles.cardPlaceholder} />
                    )}
                  </View>
                ))}
              </>
            )}

            {filtered && filtered.allParents.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>ALL PARENTS</Text>
                {chunkPairs(filtered.allParents).map((row, i) => (
                  <View key={`all-${i}`} style={styles.cardRow}>
                    <ParentCard
                      parent={row[0]}
                      selected={isSelected(row[0].id)}
                      onPress={() => toggleRecipient(row[0])}
                    />
                    {row[1] ? (
                      <ParentCard
                        parent={row[1]}
                        selected={isSelected(row[1].id)}
                        onPress={() => toggleRecipient(row[1]!)}
                      />
                    ) : (
                      <View style={styles.cardPlaceholder} />
                    )}
                  </View>
                ))}
              </>
            )}

            {filtered &&
              filtered.myStudentsParents.length === 0 &&
              filtered.allParents.length === 0 && (
                <View style={styles.centered}>
                  <Text style={styles.hintText}>No parents found</Text>
                </View>
              )}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.footerBtn,
              styles.cancelBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleClose}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.footerBtn,
              styles.nextBtn,
              selectedRecipients.length === 0 && styles.disabledBtn,
              pressed && selectedRecipients.length > 0 && styles.pressed,
            ]}
            onPress={() => selectedRecipients.length > 0 && setStep(2)}
            disabled={selectedRecipients.length === 0}
          >
            <Text style={styles.nextBtnText}>Next →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 2: Compose ───────────────────────────────────────────────────────

  const canSend =
    (modalDraft.trim().length > 0 || pendingImage !== null) &&
    !sending &&
    !creatingConvo;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </Pressable>
          <Text style={styles.heading}>New Message</Text>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </Pressable>
        </View>

        {/* To: row */}
        <View style={styles.toRow}>
          <Text style={styles.toLabel}>To:</Text>
          <View style={styles.toPillsWrap}>
            {selectedRecipients.map((r) => (
              <View key={r.id} style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>
                  {r.full_name}
                </Text>
                <Pressable
                  onPress={() => removeRecipient(r.id)}
                  hitSlop={6}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Ionicons name="close" size={14} color={Brand.sage700} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Message area */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.composeContent}
          keyboardShouldPersistTaps="handled"
        >
          {imagePreview && (
            <View style={styles.imagePreviewWrap}>
              <Image
                source={{ uri: imagePreview }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <Pressable
                style={styles.imageRemoveBtn}
                onPress={() => {
                  setPendingImage(null);
                  setImagePreview(null);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={22} color="#fff" />
              </Pressable>
            </View>
          )}

          <TextInput
            style={styles.composeInput}
            value={modalDraft}
            onChangeText={setModalDraft}
            placeholder="Type a message…"
            placeholderTextColor="#9ca3af"
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </ScrollView>

        {sendError && (
          <Text style={styles.errorText}>{sendError}</Text>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [
              styles.toolbarIcon,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="image-outline" size={24} color="#6b7280" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && styles.disabledBtn,
              pressed && canSend && styles.pressed,
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {sending || creatingConvo ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>
                {selectedRecipients.length > 1
                  ? `Send to ${selectedRecipients.length}`
                  : "Send"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── ParentCard ────────────────────────────────────────────────────────────────

function ParentCard({
  parent,
  selected,
  onPress,
}: {
  parent: ParentWithChildren;
  selected: boolean;
  onPress: () => void;
}) {
  const firstChild = parent.children[0] ?? null;
  const extraCount = parent.children.length - 1;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {/* Selected checkmark */}
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      )}

      {/* Parent avatar */}
      <View
        style={[
          styles.cardAvatar,
          { backgroundColor: colorForId(parent.id) },
        ]}
      >
        {parent.profile_image_url ? (
          <Image
            source={{ uri: parent.profile_image_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.cardAvatarText}>{getInitials(parent.full_name)}</Text>
        )}
      </View>

      {/* Parent name */}
      <Text style={styles.cardName} numberOfLines={1}>
        {parent.full_name}
      </Text>

      {/* Child info */}
      {firstChild && (
        <View style={styles.childRow}>
          <View style={styles.childAvatarWrap}>
            {firstChild.profile_image_url ? (
              <Image
                source={{ uri: firstChild.profile_image_url }}
                style={styles.childAvatar}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.childAvatar,
                  { backgroundColor: colorForId(firstChild.id) },
                ]}
              >
                <Text style={styles.childAvatarText}>
                  {getInitials(firstChild.child_legal_name)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.childMeta}>
            <Text style={styles.childName} numberOfLines={1}>
              {firstChild.child_legal_name}
              {firstChild.child_grade ? ` · ${firstChild.child_grade}` : ""}
            </Text>
            {firstChild.program && (
              <Text style={styles.childProgram} numberOfLines={1}>
                {firstChild.program}
              </Text>
            )}
          </View>
          {extraCount > 0 && (
            <View style={styles.extraBadge}>
              <Text style={styles.extraBadgeText}>+{extraCount}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const CARD_GAP = 10;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#ffffff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  heading: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
  },
  iconButton: { padding: 4, width: 36 },
  pressed: { opacity: 0.6 },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f2eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
    maxWidth: 160,
  },
  pillText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
    flexShrink: 1,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },

  divider: { height: 1, backgroundColor: "#f3f4f6" },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  hintText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  directoryContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 20 },
  sectionHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 2,
  },
  cardRow: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    position: "relative",
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: "#4a7c59",
    backgroundColor: "#f0f7f2",
  },
  cardPlaceholder: { flex: 1 },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4a7c59",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  cardAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#fff",
  },
  cardName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
    marginBottom: 6,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  childAvatarWrap: { flexShrink: 0 },
  childAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  childAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: "#fff",
  },
  childMeta: { flex: 1 },
  childName: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#4b5563",
  },
  childProgram: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
  },
  extraBadge: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  extraBadgeText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  footerBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  cancelBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#4b5563",
  },
  nextBtn: {
    backgroundColor: Brand.sage700,
  },
  nextBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
  disabledBtn: { opacity: 0.4 },

  // Step 2
  toRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  toLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#4b5563",
    marginTop: 4,
    flexShrink: 0,
  },
  toPillsWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  composeContent: { padding: 16, flexGrow: 1 },
  imagePreviewWrap: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  imageRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  composeInput: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
    minHeight: 130,
    textAlignVertical: "top",
  },

  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#dc2626",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 10,
  },
  toolbarIcon: { padding: 4 },
  sendBtn: {
    marginLeft: "auto",
    backgroundColor: Brand.sage700,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: "center",
  },
  sendBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
