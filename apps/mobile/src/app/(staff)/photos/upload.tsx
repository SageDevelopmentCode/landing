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
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import {
  getEnrolledStudentsWithConsent,
  PublicationLabel,
  StudentWithConsent,
} from "@/lib/photos-actions";
import { StudentTagSelector } from "@/components/photos/StudentTagSelector";
import { DatePickerField } from "@/components/photos/DatePickerField";
import { Brand, floatingTabBarStyle, FontFamilies } from "@/constants/theme";

const PUB_LABELS: { key: PublicationLabel; label: string }[] = [
  { key: "newsletter",   label: "Newsletter" },
  { key: "social_media", label: "Social Media" },
  { key: "website",      label: "Website" },
];

type PickedImage = {
  uri: string;
};

export default function PhotoUploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<"picker" | "metadata">("picker");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [pubLabels, setPubLabels] = useState<PublicationLabel[]>([]);
  const [students, setStudents] = useState<StudentWithConsent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const { enqueueUpload, batch } = useUploadQueue();
  const isDirty = useRef(false);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useEffect(() => {
    if (phase === "metadata") {
      setStudentsLoading(true);
      getEnrolledStudentsWithConsent()
        .then(setStudents)
        .finally(() => setStudentsLoading(false));
    }
  }, [phase]);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 20,
    });
    if (!result.canceled) {
      const picked: PickedImage[] = result.assets.map((a) => ({ uri: a.uri, status: "pending" }));
      setImages((prev) => [...prev, ...picked]);
      isDirty.current = true;
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((i) => i.uri !== uri));
  }

  function toggleLabel(key: PublicationLabel) {
    setPubLabels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleStudent(studentId: string) {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }

  function handleBack() {
    if (isDirty.current) {
      Alert.alert("Discard changes?", "Your selections will be lost.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }

  async function handleUpload() {
    if (images.length === 0 || batch !== null) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    enqueueUpload(
      images.map((img) => img.uri),
      {
        caption: caption.trim() || null,
        taken_on: takenOn.trim() || null,
        taggedStudentIds: selectedStudents,
        publication_labels: pubLabels,
      },
      user.id
    );

    isDirty.current = false;
    router.back();
  }

  // Phase 1: image picker
  if (phase === "picker") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
          <Text style={styles.headerTitle}>Upload Photos</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.pickerContent}>
          {images.length > 0 && (
            <View style={styles.thumbnailGrid}>
              {images.map((img) => (
                <View key={img.uri} style={styles.thumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.thumb} contentFit="cover" />
                  <Pressable
                    style={styles.thumbRemove}
                    onPress={() => removeImage(img.uri)}
                    hitSlop={4}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable style={styles.pickBtn} onPress={pickImages}>
            <Ionicons name="images-outline" size={24} color={Brand.sage700} />
            <Text style={styles.pickBtnText}>
              {images.length === 0 ? "Select Photos" : "Add More"}
            </Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.continueBtn, images.length === 0 && styles.continueBtnDisabled]}
            onPress={() => setPhase("metadata")}
            disabled={images.length === 0}
          >
            <Text style={styles.continueBtnText}>
              Continue ({images.length} {images.length === 1 ? "photo" : "photos"})
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Phase 2: metadata
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => setPhase("picker")} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.metaContent} keyboardShouldPersistTaps="handled">
        {/* Thumbnail strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
          {images.map((img) => (
            <View key={img.uri} style={styles.stripThumbWrap}>
              <Image source={{ uri: img.uri }} style={styles.stripThumb} contentFit="cover" />
            </View>
          ))}
        </ScrollView>

        {/* Caption */}
        <Text style={styles.fieldLabel}>Caption</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Add a caption (optional)"
          placeholderTextColor="#9ca3af"
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={2}
        />

        {/* Date */}
        <Text style={styles.fieldLabel}>Date taken</Text>
        <DatePickerField value={takenOn} onChange={setTakenOn} />

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
          <Text style={styles.selectedCount}>
            {selectedStudents.length} selected
          </Text>
        )}
        <StudentTagSelector
          students={students}
          selected={selectedStudents}
          onToggle={toggleStudent}
          searchQuery={studentSearch}
          onSearchChange={setStudentSearch}
          loading={studentsLoading}
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.continueBtn, batch !== null && styles.continueBtnDisabled]}
          onPress={handleUpload}
          disabled={batch !== null}
        >
          <Text style={styles.continueBtnText}>
            {`Upload ${images.length} ${images.length === 1 ? "Photo" : "Photos"}`}
          </Text>
        </Pressable>
      </View>
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
  pickerContent: {
    padding: 16,
    gap: 16,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thumbWrap: {
    position: "relative",
  },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  thumbRemove: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: Brand.sage700,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
  },
  pickBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: Brand.sage700,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  continueBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
  thumbStrip: {
    marginBottom: 4,
  },
  stripThumbWrap: {
    marginRight: 8,
    position: "relative",
  },
  stripThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDone: {
    backgroundColor: "rgba(22,163,74,0.7)",
  },
  statusError: {
    backgroundColor: "rgba(220,38,38,0.7)",
  },
  statusText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: FontFamilies.bodySemiBold,
  },
  metaContent: {
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
});
