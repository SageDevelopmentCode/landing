import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherIdCard } from "@/components/TeacherIdCard";
import { TeacherIdDetailSheet } from "@/components/TeacherIdDetailSheet";
import { TeacherIdPreviewSheet } from "@/components/TeacherIdPreviewModal";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import {
  createTeacherIdCard,
  fetchTeacherIdCards,
  uploadTeacherIdPhoto,
  type TeacherIdCard as TeacherIdCardType,
} from "@/lib/teacher-id-actions";

export default function TeacherIdsScreen() {
  const router = useRouter();
  const { userRole } = useAuth();

  const [cards, setCards] = useState<TeacherIdCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<TeacherIdCardType | null>(null);
  const [previewCard, setPreviewCard] = useState<TeacherIdCardType | null>(null);

  const [createFullName, setCreateFullName] = useState("");
  const [createTitle, setCreateTitle] = useState("Teacher");
  const [createGrade, setCreateGrade] = useState("");
  const [createYear, setCreateYear] = useState(String(new Date().getFullYear()));
  const [createPhotoUri, setCreatePhotoUri] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const detailSheetRef = useRef<BottomSheetModal>(null);
  const previewSheetRef = useRef<BottomSheetModal>(null);
  const createSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (userRole && userRole !== "super_admin") {
      router.replace("/(staff)/home");
    }
  }, [userRole, router]);

  const loadCards = useCallback(async () => {
    try {
      const data = await fetchTeacherIdCards();
      setCards(data);
    } catch (e) {
      notifyError("teacher-ids-load", e);
      Alert.alert("Error", "Failed to load teacher ID cards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userRole === "super_admin") {
        setLoading(true);
        loadCards();
      }
    }, [loadCards, userRole]),
  );

  function openPreview(card: TeacherIdCardType) {
    setPreviewCard(card);
    previewSheetRef.current?.present();
  }

  function handlePreviewDismiss() {
    setPreviewCard(null);
  }

  function openManageFromPreview() {
    if (!previewCard) return;
    const card = previewCard;
    previewSheetRef.current?.dismiss();
    setTimeout(() => openDetail(card), 200);
  }

  function openDetail(card: TeacherIdCardType) {
    setSelectedCard(card);
    detailSheetRef.current?.present();
  }

  function openPreviewFromDetail() {
    if (!selectedCard) return;
    const card = selectedCard;
    detailSheetRef.current?.dismiss();
    setTimeout(() => openPreview(card), 300);
  }

  function openCreateSheet() {
    setCreateFullName("");
    setCreateTitle("Teacher");
    setCreateGrade("");
    setCreateYear(String(new Date().getFullYear()));
    setCreatePhotoUri(null);
    createSheetRef.current?.present();
  }

  function handleCreateFromDetail() {
    setTimeout(() => openCreateSheet(), 300);
  }

  async function handlePickCreatePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setCreatePhotoUri(result.assets[0].uri);
    }
  }

  async function handleCreate() {
    if (!createFullName.trim() || !createTitle.trim()) return;
    const year = parseInt(createYear, 10);
    if (Number.isNaN(year)) {
      Alert.alert("Invalid year", "Please enter a valid issue year.");
      return;
    }

    setCreating(true);
    try {
      const newCard = await createTeacherIdCard({
        full_name: createFullName,
        title: createTitle,
        grade_classroom: createGrade,
        issue_year: year,
        sort_order: cards.length + 1,
      });

      let finalCard = newCard;
      if (createPhotoUri) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const publicUrl = await uploadTeacherIdPhoto(
            newCard.id,
            createPhotoUri,
            session.access_token,
          );
          finalCard = { ...newCard, photo_url: publicUrl };
        }
      }

      setCards((prev) => [...prev, finalCard]);
      createSheetRef.current?.dismiss();
      setPreviewCard(finalCard);
      setTimeout(() => previewSheetRef.current?.present(), 300);
    } catch (e) {
      notifyError("teacher-ids-create", e);
      Alert.alert("Error", "Failed to create ID card.");
    } finally {
      setCreating(false);
    }
  }

  if (userRole !== "super_admin") {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Brand.sage700} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle}>Teacher IDs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateSheet}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Brand.sage700} style={{ marginTop: 40 }} />
      ) : cards.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="card-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No ID cards yet</Text>
          <Text style={styles.emptySub}>Create your first staff ID card.</Text>
          <Pressable style={styles.emptyBtn} onPress={openCreateSheet}>
            <Text style={styles.emptyBtnText}>Create ID</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: BottomTabInset + 24 },
          ]}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <Pressable style={styles.cardItem} onPress={() => openPreview(item)}>
              <TeacherIdCard card={item} size="small" />
            </Pressable>
          )}
        />
      )}

      <TeacherIdPreviewSheet
        ref={previewSheetRef}
        card={previewCard}
        onDismiss={handlePreviewDismiss}
        onManage={openManageFromPreview}
      />

      <TeacherIdDetailSheet
        ref={detailSheetRef}
        card={selectedCard}
        onPreview={openPreviewFromDetail}
        onUpdated={(updated) => {
          setSelectedCard(updated);
          setPreviewCard((prev) => (prev?.id === updated.id ? updated : prev));
          setCards((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c)),
          );
        }}
        onDeleted={(id) => {
          setCards((prev) => prev.filter((c) => c.id !== id));
          setSelectedCard(null);
        }}
        onCreateNew={handleCreateFromDetail}
      />

      <BottomSheetModal
        ref={createSheetRef}
        snapPoints={["85%"]}
        enablePanDownToClose
        keyboardBehavior="interactive"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.createContainer}>
          <Text style={styles.createTitle}>Create Staff ID</Text>

          <Pressable style={styles.photoPicker} onPress={handlePickCreatePhoto}>
            {createPhotoUri ? (
              <View style={styles.photoPreviewWrap}>
                <TeacherIdCard
                  card={{
                    full_name: createFullName || "Staff Name",
                    title: createTitle || "Teacher",
                    grade_classroom: createGrade || null,
                    issue_year: parseInt(createYear, 10) || new Date().getFullYear(),
                    photo_url: createPhotoUri,
                    user_id: null,
                  }}
                  size="small"
                />
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.fieldLabel}>Full Name *</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={createFullName}
            onChangeText={setCreateFullName}
            placeholder="e.g. Jane Smith"
          />

          <Text style={styles.fieldLabel}>Title *</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={createTitle}
            onChangeText={setCreateTitle}
            placeholder="e.g. Lead Teacher"
          />

          <Text style={styles.fieldLabel}>Grade / Classroom</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={createGrade}
            onChangeText={setCreateGrade}
            placeholder="e.g. Pre-K – Kindergarten"
          />

          <Text style={styles.fieldLabel}>Issue Year *</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={createYear}
            onChangeText={setCreateYear}
            keyboardType="number-pad"
            placeholder="2026"
          />

          <Pressable
            style={[
              styles.submitBtn,
              (!createFullName.trim() || !createTitle.trim() || creating) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleCreate}
            disabled={!createFullName.trim() || !createTitle.trim() || creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Create ID Card</Text>
              </>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: Brand.sage800,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Brand.sage700,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardItem: {
    flex: 1,
    maxWidth: "48%",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: BottomTabInset,
  },
  emptyTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: Brand.sage800,
    marginTop: 16,
  },
  emptySub: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: Brand.sage700,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  createContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  createTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: Brand.sage800,
    marginBottom: 20,
  },
  photoPicker: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoPreviewWrap: {
    alignItems: "center",
  },
  photoPlaceholder: {
    width: 160,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
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
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  submitBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
