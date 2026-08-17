import { forwardRef, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Brand, FontFamilies } from "@/constants/theme";
import { TeacherIdCard } from "@/components/TeacherIdCard";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import {
  softDeleteTeacherIdCard,
  updateTeacherIdCard,
  uploadTeacherIdPhoto,
  type TeacherIdCard as TeacherIdCardType,
} from "@/lib/teacher-id-actions";

type Props = {
  card: TeacherIdCardType | null;
  onUpdated: (card: TeacherIdCardType) => void;
  onDeleted: (id: string) => void;
  onCreateNew: () => void;
  onPreview?: () => void;
  onDismiss?: () => void;
};

export const TeacherIdDetailSheet = forwardRef<BottomSheetModal, Props>(
  function TeacherIdDetailSheet(
    { card, onUpdated, onDeleted, onCreateNew, onPreview, onDismiss },
    ref,
  ) {
    const [editMode, setEditMode] = useState(false);
    const [fullName, setFullName] = useState("");
    const [title, setTitle] = useState("");
    const [gradeClassroom, setGradeClassroom] = useState("");
    const [issueYear, setIssueYear] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [previewCard, setPreviewCard] = useState<TeacherIdCardType | null>(null);

    useEffect(() => {
      if (!card) return;
      setPreviewCard(card);
      setFullName(card.full_name);
      setTitle(card.title);
      setGradeClassroom(card.grade_classroom ?? "");
      setIssueYear(String(card.issue_year));
      setEditMode(false);
    }, [card]);

    const resetEditFields = useCallback(() => {
      if (!card) return;
      setFullName(card.full_name);
      setTitle(card.title);
      setGradeClassroom(card.grade_classroom ?? "");
      setIssueYear(String(card.issue_year));
    }, [card]);

    const handleSave = useCallback(async () => {
      if (!card || !fullName.trim() || !title.trim()) return;
      const year = parseInt(issueYear, 10);
      if (Number.isNaN(year)) {
        Alert.alert("Invalid year", "Please enter a valid issue year.");
        return;
      }

      setSaving(true);
      try {
        const updated = await updateTeacherIdCard(card.id, {
          full_name: fullName,
          title,
          grade_classroom: gradeClassroom,
          issue_year: year,
        });
        setPreviewCard(updated);
        onUpdated(updated);
        setEditMode(false);
      } catch (e) {
        notifyError("teacher-id-save", e);
        Alert.alert("Error", "Failed to save changes.");
      } finally {
        setSaving(false);
      }
    }, [card, fullName, title, gradeClassroom, issueYear, onUpdated]);

    const handleDelete = useCallback(() => {
      if (!card) return;
      Alert.alert(
        "Delete ID Card",
        `Remove the ID card for ${card.full_name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await softDeleteTeacherIdCard(card.id);
                onDeleted(card.id);
                (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
              } catch (e) {
                notifyError("teacher-id-delete", e);
                Alert.alert("Error", "Failed to delete ID card.");
              }
            },
          },
        ],
      );
    }, [card, onDeleted, ref]);

    const handlePickPhoto = useCallback(async () => {
      if (!card) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;

      setUploadingPhoto(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const publicUrl = await uploadTeacherIdPhoto(
          card.id,
          result.assets[0].uri,
          session.access_token,
        );
        const updated = { ...card, photo_url: `${publicUrl}?t=${Date.now()}` };
        setPreviewCard(updated);
        onUpdated(updated);
      } catch (e) {
        notifyError("teacher-id-photo", e);
        Alert.alert("Error", "Failed to upload photo.");
      } finally {
        setUploadingPhoto(false);
      }
    }, [card, onUpdated]);

    const handleCreateNew = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
      onCreateNew();
    }, [onCreateNew, ref]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["88%"]}
        enablePanDownToClose
        onDismiss={onDismiss}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        {previewCard && (
          <BottomSheetScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
              <Text style={styles.sheetTitle}>Staff ID</Text>
              <View style={styles.headerActions}>
                {editMode ? (
                  <>
                    <Pressable
                      style={styles.textBtn}
                      onPress={() => {
                        resetEditFields();
                        setEditMode(false);
                      }}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      <Text style={styles.saveBtnText}>
                        {saving ? "Saving…" : "Save"}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {onPreview && (
                      <Pressable style={styles.iconBtn} onPress={onPreview}>
                        <Ionicons name="eye-outline" size={18} color={Brand.sage700} />
                      </Pressable>
                    )}
                    <Pressable style={styles.iconBtn} onPress={() => setEditMode(true)}>
                      <Ionicons name="pencil-outline" size={18} color={Brand.sage700} />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            <View style={styles.cardWrap}>
              <TeacherIdCard card={previewCard} size="large" />
            </View>

            <Pressable
              style={[styles.photoBtn, uploadingPhoto && { opacity: 0.6 }]}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color={Brand.sage700} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={18} color={Brand.sage700} />
                  <Text style={styles.photoBtnText}>Change Photo</Text>
                </>
              )}
            </Pressable>

            {editMode && (
              <View style={styles.fields}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <BottomSheetTextInput
                  style={styles.fieldInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full name"
                />

                <Text style={styles.fieldLabel}>Title</Text>
                <BottomSheetTextInput
                  style={styles.fieldInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Lead Teacher"
                />

                <Text style={styles.fieldLabel}>Grade / Classroom</Text>
                <BottomSheetTextInput
                  style={styles.fieldInput}
                  value={gradeClassroom}
                  onChangeText={setGradeClassroom}
                  placeholder="e.g. 3rd – 4th Grade"
                />

                <Text style={styles.fieldLabel}>Issue Year</Text>
                <BottomSheetTextInput
                  style={styles.fieldInput}
                  value={issueYear}
                  onChangeText={setIssueYear}
                  keyboardType="number-pad"
                  placeholder="2026"
                />
              </View>
            )}

            <Pressable style={styles.createNewBtn} onPress={handleCreateNew}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createNewText}>Create New ID</Text>
            </Pressable>
          </BottomSheetScrollView>
        )}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: Brand.sage800,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  textBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
  saveBtn: {
    backgroundColor: Brand.sage700,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  cardWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.sage700,
    marginBottom: 20,
  },
  photoBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  fields: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  },
  createNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createNewText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
