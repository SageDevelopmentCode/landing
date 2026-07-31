import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import {
  deletePhoto,
  editPhoto,
  getEnrolledStudentsWithConsent,
  getTeacherPhotos,
  PublicationLabel,
  StudentWithConsent,
  TeacherPhoto,
} from "@/lib/photos-actions";
import { StudentTagSelector } from "@/components/photos/StudentTagSelector";
import { DatePickerField } from "@/components/photos/DatePickerField";
import { Brand, floatingTabBarStyle, FontFamilies } from "@/constants/theme";

const PUB_LABELS: { key: PublicationLabel; label: string }[] = [
  { key: "newsletter",   label: "Newsletter" },
  { key: "social_media", label: "Social Media" },
  { key: "website",      label: "Website" },
];

export default function PhotoEditScreen() {
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [photo, setPhoto] = useState<TeacherPhoto | null>(null);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [pubLabels, setPubLabels] = useState<PublicationLabel[]>([]);
  const [students, setStudents] = useState<StudentWithConsent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDirty = useRef(false);
  const { markGalleryDirty } = useUploadQueue();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [all, enrolledStudents] = await Promise.all([
        getTeacherPhotos(user.id),
        getEnrolledStudentsWithConsent(),
      ]);

      const found = all.find((p) => p.id === photoId);
      if (found) {
        setPhoto(found);
        setCaption(found.caption ?? "");
        setTakenOn(found.taken_on ?? "");
        setSelectedStudents(found.tags.map((t) => t.student_id));
        setPubLabels(found.publication_labels);
      }

      setStudents(enrolledStudents);
      setStudentsLoading(false);
    }
    load();
  }, [photoId]);

  function toggleLabel(key: PublicationLabel) {
    isDirty.current = true;
    setPubLabels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleStudent(studentId: string) {
    isDirty.current = true;
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }

  function handleBack() {
    if (isDirty.current) {
      Alert.alert("Discard changes?", "Your edits will be lost.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }

  async function handleSave() {
    if (!photo) return;
    setSaving(true);
    try {
      await editPhoto(photo.id, {
        caption: caption.trim() || null,
        taken_on: takenOn.trim() || null,
        taggedStudentIds: selectedStudents,
        publication_labels: pubLabels,
      });
      isDirty.current = false;
      markGalleryDirty();
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!photo) return;
    Alert.alert(
      "Delete Photo",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePhoto(photo.id, photo.storage_path);
              markGalleryDirty();
              router.back();
            } catch (err) {
              console.error("[handleDelete] failed:", err);
              setDeleting(false);
              Alert.alert("Delete failed", err instanceof Error ? err.message : "Could not delete photo.");
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Photo</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving || deleting}
          hitSlop={12}
        >
          <Text style={[styles.saveText, (saving || deleting) && { opacity: 0.4 }]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Caption */}
        <Text style={styles.fieldLabel}>Caption</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Add a caption (optional)"
          placeholderTextColor="#9ca3af"
          value={caption}
          onChangeText={(v) => { setCaption(v); isDirty.current = true; }}
          multiline
          numberOfLines={2}
        />

        {/* Date */}
        <Text style={styles.fieldLabel}>Date taken</Text>
        <DatePickerField
          value={takenOn}
          onChange={(v) => { setTakenOn(v); isDirty.current = true; }}
        />

        {/* Publication labels */}
        <Text style={styles.fieldLabel}>Publication labels</Text>
        <View style={styles.labelsRow}>
          {PUB_LABELS.map(({ key, label }) => {
            const active = pubLabels.includes(key);
            return (
              <Pressable
                key={key}
                style={[styles.labelToggle, active && styles.labelToggleActive]}
                onPress={() => toggleLabel(key)}
              >
                <Text style={[styles.labelToggleText, active && styles.labelToggleTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Student tags */}
        <Text style={styles.fieldLabel}>Tag students</Text>
        {selectedStudents.length > 0 && (
          <Text style={styles.selectedCount}>{selectedStudents.length} selected</Text>
        )}
        <StudentTagSelector
          students={students}
          selected={selectedStudents}
          onToggle={toggleStudent}
          searchQuery={studentSearch}
          onSearchChange={setStudentSearch}
          loading={studentsLoading}
        />

        {/* Delete */}
        <Pressable
          style={[styles.deleteBtn, deleting && { opacity: 0.5 }]}
          onPress={handleDelete}
          disabled={deleting || saving}
        >
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
          <Text style={styles.deleteBtnText}>{deleting ? "Deleting…" : "Delete Photo"}</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#111827",
  },
  saveText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: Brand.sage700,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
    minHeight: 64,
    textAlignVertical: "top",
  },
  textInputSingle: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
  },
  labelsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  labelToggle: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  labelToggleActive: {
    borderColor: Brand.sage700,
    backgroundColor: "#f0f7f2",
  },
  labelToggleText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  labelToggleTextActive: {
    color: Brand.sage700,
    fontFamily: FontFamilies.bodySemiBold,
  },
  selectedCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    marginBottom: 4,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
  },
  deleteBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#dc2626",
  },
});
