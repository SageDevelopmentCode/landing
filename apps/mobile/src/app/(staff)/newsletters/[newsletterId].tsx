import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { supabase } from "@/lib/supabase";
import { BottomTabInset, Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import {
  Newsletter,
  getPendingTeacherUpdateEdit,
  getNewsletter,
  pendingSectionEdits,
  publishNewsletter,
  saveDraft,
  softDeleteNewsletter,
} from "@/lib/newsletters-actions";

// ---------------------------------------------------------------------------
// Change log bottom sheet
// ---------------------------------------------------------------------------

const ChangeLogSheet = forwardRef<BottomSheetModal, { newsletter: Newsletter | null }>(
  ({ newsletter }, ref) => {
    function fmtTime(iso: string): string {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days === 1) return "yesterday";
      return `${days}d ago`;
    }

    const entries = newsletter?.change_log ?? [];

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["60%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={clStyles.container}>
          <Text style={clStyles.title}>Change Log</Text>
          {entries.length === 0 ? (
            <Text style={clStyles.empty}>No changes recorded yet.</Text>
          ) : (
            [...entries].reverse().map((entry) => (
              <View key={entry.id} style={clStyles.entry}>
                <View style={clStyles.entryHeader}>
                  {entry.teacher_avatar ? (
                    <Image source={{ uri: entry.teacher_avatar }} style={clStyles.avatar} />
                  ) : (
                    <View style={clStyles.avatarPlaceholder}>
                      <Ionicons name="person" size={14} color="#9ca3af" />
                    </View>
                  )}
                  <Text style={clStyles.teacherName}>{entry.teacher_name ?? "Unknown"}</Text>
                  <Text style={clStyles.time}>{fmtTime(entry.created_at)}</Text>
                </View>
                {entry.summary.map((line, i) => (
                  <Text key={i} style={clStyles.summaryLine}>• {line}</Text>
                ))}
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

// ---------------------------------------------------------------------------
// Local section state
// ---------------------------------------------------------------------------

type EditableSection = {
  id: string;
  label: string;
  body: string;
  visible: boolean;
  sort_order: number;
  is_class_updates: boolean;
  images: { id: string; storage_path: string; signed_url: string | null; sort_order: number }[];
};

// ---------------------------------------------------------------------------
// Main editor screen
// ---------------------------------------------------------------------------

export default function NewsletterEditorScreen() {
  const { newsletterId } = useLocalSearchParams<{ newsletterId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const changeLogRef = useRef<BottomSheetModal>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [weekRange, setWeekRange] = useState("");
  const [viewMode, setViewMode] = useState<"traditional" | "slideshow">("traditional");
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [myTeacherUpdateBody, setMyTeacherUpdateBody] = useState("");

  const pendingChanges = useRef(new Set<string>());
  const originalRef = useRef<{ title: string; week_range: string; view_mode: string } | null>(null);
  const currentUserIdRef = useRef("");

  const applyNewsletter = useCallback((nl: Newsletter, userId: string) => {
    setTitle(nl.title);
    setWeekRange(nl.week_range);
    setViewMode(nl.view_mode);
    setSections(
      nl.sections.map((s) => ({
        id: s.id,
        label: s.label,
        body: s.body,
        visible: s.visible,
        sort_order: s.sort_order,
        is_class_updates: s.is_class_updates,
        images: s.images,
      }))
    );
    const classSection = nl.sections.find((s) => s.is_class_updates);
    const myUpdate = classSection?.teacher_updates.find((tu) => tu.teacher_id === userId);
    setMyTeacherUpdateBody(myUpdate?.body ?? "");
    originalRef.current = { title: nl.title, week_range: nl.week_range, view_mode: nl.view_mode };
  }, []);

  useEffect(() => {
    if (!newsletterId) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserIdRef.current = user?.id ?? "";
        const nl = await getNewsletter(newsletterId);
        setNewsletter(nl);
        applyNewsletter(nl, currentUserIdRef.current);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to load newsletter");
      } finally {
        setLoading(false);
      }
    })();
  }, [newsletterId, applyNewsletter]);

  useFocusEffect(
    useCallback(() => {
      const pendingTeacher = getPendingTeacherUpdateEdit();
      if (pendingSectionEdits.size === 0 && pendingTeacher === null) return;

      setSections((prev) =>
        prev.map((s) => {
          if (!pendingSectionEdits.has(s.id)) return s;
          const newBody = pendingSectionEdits.get(s.id)!;
          if (newBody !== s.body) pendingChanges.current.add(`Updated '${s.label}' body`);
          return { ...s, body: newBody };
        })
      );
      if (pendingTeacher !== null) {
        pendingChanges.current.add("Updated Class Updates");
        setMyTeacherUpdateBody(pendingTeacher);
      }
    }, [])
  );

  const handleToggleVisible = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const newVisible = !s.visible;
        pendingChanges.current.add(`Toggled '${s.label}' visibility ${newVisible ? "on" : "off"}`);
        return { ...s, visible: newVisible };
      })
    );
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!newsletterId) return;
    if (originalRef.current) {
      if (title !== originalRef.current.title) pendingChanges.current.add("Updated title");
      if (weekRange !== originalRef.current.week_range) pendingChanges.current.add("Updated week range");
      if (viewMode !== originalRef.current.view_mode) pendingChanges.current.add(`Changed view mode to ${viewMode}`);
    }
    setSaving(true);
    try {
      const classSection = sections.find((s) => s.is_class_updates);
      await saveDraft(newsletterId, {
        title,
        week_range: weekRange,
        view_mode: viewMode,
        sections: sections.map((s) => ({ id: s.id, label: s.label, body: s.body, visible: s.visible })),
        classUpdatesSectionId: classSection?.id ?? null,
        myTeacherUpdateBody,
        changeSummary: [...pendingChanges.current],
      });
      pendingChanges.current.clear();
      originalRef.current = { title, week_range: weekRange, view_mode: viewMode };
      const fresh = await getNewsletter(newsletterId);
      setNewsletter(fresh);
      Alert.alert("Saved", "Draft saved successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }, [newsletterId, title, weekRange, viewMode, sections, myTeacherUpdateBody]);

  const handlePublish = useCallback(() => {
    if (!newsletterId) return;
    Alert.alert("Publish Newsletter", `Publish "${title}" to all parents?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Publish",
        onPress: async () => {
          try {
            await publishNewsletter(newsletterId);
            Alert.alert("Published", "Newsletter published successfully.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed to publish");
          }
        },
      },
    ]);
  }, [newsletterId, title, router]);

  const handleDelete = useCallback(() => {
    if (!newsletterId) return;
    Alert.alert("Delete Newsletter", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await softDeleteNewsletter(newsletterId);
            router.back();
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed to delete");
          }
        },
      },
    ]);
  }, [newsletterId, title, router]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const isPublished = newsletter?.status === "published";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || "Newsletter"}</Text>
        <View style={styles.headerActions}>
          <Pressable
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={() => changeLogRef.current?.present()}
          >
            <Ionicons name="time-outline" size={22} color={Brand.sage700} />
          </Pressable>
          <Pressable
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={() =>
              router.push({ pathname: "/(staff)/newsletters/preview" as any, params: { newsletterId } })
            }
          >
            <Ionicons name="eye-outline" size={22} color={Brand.sage700} />
          </Pressable>
          {!isPublished && (
            <Pressable
              style={({ pressed }) => [styles.saveBtn, (pressed || saving) && { opacity: 0.7 }]}
              onPress={handleSaveDraft}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 100 }]}>
        {/* Metadata */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={[styles.textInput, isPublished && styles.readOnly]}
            value={title}
            onChangeText={setTitle}
            placeholder="Week of May 26"
            placeholderTextColor="#9ca3af"
            editable={!isPublished}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Week Range</Text>
          <TextInput
            style={[styles.textInput, isPublished && styles.readOnly]}
            value={weekRange}
            onChangeText={setWeekRange}
            placeholder="May 26 – May 30"
            placeholderTextColor="#9ca3af"
            editable={!isPublished}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>View Mode</Text>
          <View style={styles.modeRow}>
            {(["traditional", "slideshow"] as const).map((mode) => (
              <Pressable
                key={mode}
                style={[styles.modePill, viewMode === mode && styles.modePillActive]}
                onPress={() => {
                  if (!isPublished && viewMode !== mode) {
                    pendingChanges.current.add(`Changed view mode to ${mode}`);
                    setViewMode(mode);
                  }
                }}
              >
                <Text style={[styles.modePillText, viewMode === mode && styles.modePillTextActive]}>
                  {mode === "traditional" ? "Traditional" : "Slideshow"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sections */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Sections</Text>
          {sections.map((sec, idx) => (
            <Pressable
              key={sec.id}
              style={({ pressed }) => [
                styles.sectionRow,
                pressed && { backgroundColor: "#f9fafb" },
                idx === sections.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(staff)/newsletters/section" as any,
                  params: {
                    newsletterId,
                    sectionId: sec.id,
                    sectionLabel: sec.label,
                    isClassUpdates: sec.is_class_updates ? "true" : "false",
                    initialBody: sec.is_class_updates ? myTeacherUpdateBody : sec.body,
                    existingImages: JSON.stringify(sec.images),
                  },
                })
              }
            >
              <Pressable
                hitSlop={10}
                style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.5 }]}
                onPress={() => !isPublished && handleToggleVisible(sec.id)}
              >
                <Ionicons
                  name={sec.visible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={sec.visible ? Brand.sage700 : "#9ca3af"}
                />
              </Pressable>
              <Text style={[styles.sectionRowLabel, !sec.visible && styles.sectionRowLabelDim]}>
                {sec.label}
              </Text>
              {sec.images.length > 0 && (
                <Text style={styles.imageCount}>{sec.images.length} img</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </Pressable>
          ))}
        </View>

        {isPublished ? (
          <View style={styles.publishedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#166534" />
            <Text style={styles.publishedText}>Published</Text>
          </View>
        ) : (
          <View style={styles.actionsCard}>
            <Pressable
              style={({ pressed }) => [styles.publishBtn, pressed && { opacity: 0.8 }]}
              onPress={handlePublish}
            >
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.publishBtnText}>Publish Newsletter</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.8 }]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteBtnText}>Delete Newsletter</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <ChangeLogSheet ref={changeLogRef} newsletter={newsletter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  backBtn: { width: 32, alignItems: "flex-start" },
  headerTitle: { flex: 1, fontFamily: FontFamilies.heading, fontSize: 16, color: "#1f2937" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 4 },
  saveBtn: {
    backgroundColor: Brand.sage700,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#fff" },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnly: { opacity: 0.6 },
  modeRow: { flexDirection: "row", gap: 10 },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modePillActive: { backgroundColor: Brand.sage700 },
  modePillText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#6b7280" },
  modePillTextActive: { color: "#fff" },
  cardHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
    marginBottom: 4,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
    gap: 10,
    borderRadius: 4,
  },
  eyeBtn: { padding: 2 },
  sectionRowLabel: { flex: 1, fontFamily: FontFamilies.body, fontSize: 14, color: "#111827" },
  sectionRowLabelDim: { color: "#9ca3af" },
  imageCount: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9ca3af" },
  publishedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dcfce7",
    padding: 14,
    borderRadius: 12,
  },
  publishedText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#166534" },
  actionsCard: { gap: 10 },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    paddingVertical: 14,
    borderRadius: 12,
  },
  publishBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#fff" },
  deleteBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff",
  },
  deleteBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#ef4444" },
});

const clStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 },
  title: { fontFamily: FontFamilies.heading, fontSize: 18, color: "#1f2937", marginBottom: 20, marginTop: 4 },
  empty: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af", textAlign: "center", marginTop: 20 },
  entry: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 14,
    gap: 6,
  },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  teacherName: { flex: 1, fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#111827" },
  time: { fontFamily: FontFamilies.body, fontSize: 12, color: "#9ca3af" },
  summaryLine: { fontFamily: FontFamilies.body, fontSize: 13, color: "#374151", paddingLeft: 4 },
});
