import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import {
  Activity,
  ActivityUpsertPayload,
  FoodPayload,
  IngredientPayload,
  createActivity,
  getActivities,
  updateActivity,
} from "@/lib/activities-actions";

// ---------------------------------------------------------------------------
// Local draft types
// ---------------------------------------------------------------------------

type ImageItem = { uri: string; storagePath?: string };

type IngredientDraft = {
  localId: string;
  name: string;
  imageUri: string | null;
};

type FoodDraft = {
  localId: string;
  name: string;
  allergens: string;
  imageUris: string[];
  ingredients: IngredientDraft[];
};

function genId() {
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.segmentBtn, value === opt.value && styles.segmentBtnActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text
            style={[
              styles.segmentText,
              value === opt.value && styles.segmentTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ImageStrip({
  images,
  onAdd,
  onRemove,
}: {
  images: ImageItem[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
      {images.map((img, idx) => (
        <View key={idx} style={styles.imageTile}>
          <Image source={{ uri: img.uri }} style={styles.imageTileImg} contentFit="cover" />
          <Pressable style={styles.imageTileRemove} onPress={() => onRemove(idx)} hitSlop={4}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.addPhotoBtn} onPress={onAdd}>
        <Ionicons name="camera-outline" size={24} color={Brand.sage700} />
        <Text style={styles.addPhotoText}>Add Photo</Text>
      </Pressable>
    </ScrollView>
  );
}

function IngredientRow({
  ingredient,
  onChange,
  onRemove,
  onPickImage,
}: {
  ingredient: IngredientDraft;
  onChange: (name: string) => void;
  onRemove: () => void;
  onPickImage: () => void;
}) {
  return (
    <View style={styles.ingredientRow}>
      <Pressable style={styles.ingImageBtn} onPress={onPickImage}>
        {ingredient.imageUri ? (
          <Image
            source={{ uri: ingredient.imageUri }}
            style={styles.ingImageSmall}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="image-outline" size={18} color="#9ca3af" />
        )}
      </Pressable>
      <TextInput
        style={styles.ingInput}
        placeholder="Ingredient name"
        placeholderTextColor="#9ca3af"
        value={ingredient.name}
        onChangeText={onChange}
      />
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ActivityFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );
  const isEdit = !!activityId;

  const [originalActivity, setOriginalActivity] = useState<Activity | null>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(isEdit);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [includesFood, setIncludesFood] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [foods, setFoods] = useState<FoodDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirtyRef = useRef(false);

  // Load original for edit mode
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const all = await getActivities();
        const found = all.find((a) => a.id === activityId) ?? null;
        if (found) {
          setOriginalActivity(found);
          setTitle(found.title);
          setDescription(found.description ?? "");
          setStatus(found.status);
          setVisibility(found.visibility);
          setIncludesFood(found.includes_food);
          setImages(
            found.images.map((img) => ({
              uri: img.signed_url,
              storagePath: img.storage_path,
            }))
          );
          setFoods(
            found.foods.map((food) => ({
              localId: genId(),
              name: food.name,
              allergens: food.allergens ?? "",
              imageUris: food.images.map((fi) => fi.signed_url),
              ingredients: food.ingredients.map((ing) => ({
                localId: genId(),
                name: ing.name,
                imageUri: ing.images[0]?.signed_url ?? null,
              })),
            }))
          );
        }
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to load activity");
      } finally {
        setLoadingOriginal(false);
      }
    })();
  }, [activityId, isEdit]);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  const handleBack = useCallback(() => {
    if (isDirtyRef.current) {
      Alert.alert("Discard changes?", "You have unsaved changes.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [router]);

  const handleStatusChange = useCallback((val: string) => {
    setStatus(val as "draft" | "published");
    if (val === "draft") setVisibility("private");
    markDirty();
  }, [markDirty]);

  // Image picker helper
  const pickImages = useCallback(async (multiple = true): Promise<string[]> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? 10 : 1,
      quality: 0.85,
    });
    if (result.canceled) return [];
    return result.assets.map((a) => a.uri);
  }, []);

  const handleAddActivityImage = useCallback(async () => {
    const uris = await pickImages(true);
    if (uris.length === 0) return;
    setImages((prev) => [...prev, ...uris.map((uri) => ({ uri }))]);
    markDirty();
  }, [pickImages, markDirty]);

  const handleRemoveActivityImage = useCallback((idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  }, [markDirty]);

  // Food helpers
  const addFood = useCallback(() => {
    setFoods((prev) => [
      ...prev,
      { localId: genId(), name: "", allergens: "", imageUris: [], ingredients: [] },
    ]);
    markDirty();
  }, [markDirty]);

  const updateFood = useCallback(
    (localId: string, patch: Partial<Omit<FoodDraft, "localId">>) => {
      setFoods((prev) =>
        prev.map((f) => (f.localId === localId ? { ...f, ...patch } : f))
      );
      markDirty();
    },
    [markDirty]
  );

  const removeFood = useCallback(
    (localId: string) => {
      Alert.alert("Remove food?", "This will remove the food and its ingredients.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setFoods((prev) => prev.filter((f) => f.localId !== localId));
            markDirty();
          },
        },
      ]);
    },
    [markDirty]
  );

  const addFoodImage = useCallback(
    async (localId: string) => {
      const uris = await pickImages(false);
      if (uris.length === 0) return;
      updateFood(localId, {
        imageUris: [...(foods.find((f) => f.localId === localId)?.imageUris ?? []), uris[0]],
      });
    },
    [pickImages, updateFood, foods]
  );

  const removeFoodImage = useCallback(
    (localId: string, imgIdx: number) => {
      const food = foods.find((f) => f.localId === localId);
      if (!food) return;
      updateFood(localId, { imageUris: food.imageUris.filter((_, i) => i !== imgIdx) });
    },
    [foods, updateFood]
  );

  const addIngredient = useCallback(
    (foodLocalId: string) => {
      setFoods((prev) =>
        prev.map((f) =>
          f.localId === foodLocalId
            ? {
                ...f,
                ingredients: [
                  ...f.ingredients,
                  { localId: genId(), name: "", imageUri: null },
                ],
              }
            : f
        )
      );
      markDirty();
    },
    [markDirty]
  );

  const updateIngredient = useCallback(
    (foodLocalId: string, ingLocalId: string, patch: Partial<IngredientDraft>) => {
      setFoods((prev) =>
        prev.map((f) =>
          f.localId === foodLocalId
            ? {
                ...f,
                ingredients: f.ingredients.map((ing) =>
                  ing.localId === ingLocalId ? { ...ing, ...patch } : ing
                ),
              }
            : f
        )
      );
      markDirty();
    },
    [markDirty]
  );

  const removeIngredient = useCallback(
    (foodLocalId: string, ingLocalId: string) => {
      setFoods((prev) =>
        prev.map((f) =>
          f.localId === foodLocalId
            ? { ...f, ingredients: f.ingredients.filter((i) => i.localId !== ingLocalId) }
            : f
        )
      );
      markDirty();
    },
    [markDirty]
  );

  const pickIngredientImage = useCallback(
    async (foodLocalId: string, ingLocalId: string) => {
      const uris = await pickImages(false);
      if (uris.length === 0) return;
      updateIngredient(foodLocalId, ingLocalId, { imageUri: uris[0] });
    },
    [pickImages, updateIngredient]
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newImageUris = images.filter((img) => !img.storagePath).map((img) => img.uri);
      const existingImagePaths = images
        .filter((img) => !!img.storagePath)
        .map((img) => img.storagePath!);

      const foodPayloads: FoodPayload[] = foods.map((food, fi) => ({
        name: food.name,
        sort_order: fi,
        allergens: food.allergens || null,
        imageUris: food.imageUris,
        ingredients: food.ingredients.map((ing, ii) => ({
          name: ing.name,
          sort_order: ii,
          imageUri: ing.imageUri,
        })),
      }));

      const payload: ActivityUpsertPayload = {
        title: title.trim(),
        description: description.trim() || null,
        includes_food: includesFood,
        status,
        visibility,
        newImageUris,
        existingImagePaths,
        foods: includesFood ? foodPayloads : [],
      };

      if (isEdit && originalActivity) {
        await updateActivity(activityId!, payload, originalActivity, user.id);
      } else {
        await createActivity(payload, user.id);
      }

      isDirtyRef.current = false;
      router.back();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    status,
    visibility,
    includesFood,
    images,
    foods,
    isEdit,
    originalActivity,
    activityId,
    router,
  ]);

  if (loadingOriginal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.sage700} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Activity" : "New Activity"}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
      >
        {/* Section 1: Basic Info */}
        <SectionHeader title="Basic Info" />
        <View style={styles.card}>
          <TextInput
            style={styles.titleInput}
            placeholder="Activity title *"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={(v) => { setTitle(v); markDirty(); }}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={(v) => { setDescription(v); markDirty(); }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Section 2: Photos */}
        <SectionHeader title="Photos" />
        <View style={styles.card}>
          <ImageStrip
            images={images}
            onAdd={handleAddActivityImage}
            onRemove={handleRemoveActivityImage}
          />
        </View>

        {/* Section 3: Publishing */}
        <SectionHeader title="Publishing" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Status</Text>
          <SegmentedControl
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
            ]}
            value={status}
            onChange={handleStatusChange}
          />
          {status === "published" && (
            <>
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Visibility</Text>
              <SegmentedControl
                options={[
                  { label: "Private", value: "private" },
                  { label: "Public", value: "public" },
                ]}
                value={visibility}
                onChange={(v) => { setVisibility(v as any); markDirty(); }}
              />
            </>
          )}
        </View>

        {/* Section 4: Food */}
        <SectionHeader title="Food" />
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Includes Food?</Text>
              <Text style={styles.toggleSub}>
                Add foods, ingredients, and allergen info
              </Text>
            </View>
            <Switch
              value={includesFood}
              onValueChange={(v) => { setIncludesFood(v); markDirty(); }}
              trackColor={{ false: "#d1d5db", true: Brand.sage700 }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {includesFood && (
          <View style={styles.foodsContainer}>
            {foods.map((food, foodIdx) => (
              <View key={food.localId} style={styles.foodCard}>
                {/* Food header */}
                <View style={styles.foodCardHeader}>
                  <Text style={styles.foodCardLabel}>Food {foodIdx + 1}</Text>
                  <Pressable onPress={() => removeFood(food.localId)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>

                <TextInput
                  style={styles.fieldInput}
                  placeholder="Food name"
                  placeholderTextColor="#9ca3af"
                  value={food.name}
                  onChangeText={(v) => updateFood(food.localId, { name: v })}
                />

                <Text style={styles.fieldLabel}>Food Photos</Text>
                <ImageStrip
                  images={food.imageUris.map((uri) => ({ uri }))}
                  onAdd={() => addFoodImage(food.localId)}
                  onRemove={(idx) => removeFoodImage(food.localId, idx)}
                />

                <TextInput
                  style={[styles.fieldInput, { marginTop: 8 }]}
                  placeholder="Allergens / safety notes (optional)"
                  placeholderTextColor="#9ca3af"
                  value={food.allergens}
                  onChangeText={(v) => updateFood(food.localId, { allergens: v })}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />

                {/* Ingredients */}
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Ingredients</Text>
                {food.ingredients.map((ing) => (
                  <IngredientRow
                    key={ing.localId}
                    ingredient={ing}
                    onChange={(name) => updateIngredient(food.localId, ing.localId, { name })}
                    onRemove={() => removeIngredient(food.localId, ing.localId)}
                    onPickImage={() => pickIngredientImage(food.localId, ing.localId)}
                  />
                ))}

                <Pressable
                  style={styles.addIngredientBtn}
                  onPress={() => addIngredient(food.localId)}
                >
                  <Ionicons name="add-circle-outline" size={18} color={Brand.sage700} />
                  <Text style={styles.addIngredientText}>Add Ingredient</Text>
                </Pressable>
              </View>
            ))}

            <Pressable style={styles.addFoodBtn} onPress={addFood}>
              <Ionicons name="add-circle-outline" size={20} color={Brand.sage700} />
              <Text style={styles.addFoodText}>Add Food</Text>
            </Pressable>
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.cancelBtn} onPress={handleBack} disabled={saving}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
  },
  scrollContent: { padding: 16, gap: 8 },
  sectionHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#f3f4f6", marginVertical: 10 },
  titleInput: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 4,
  },
  descInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    paddingVertical: 4,
    minHeight: 72,
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  fieldInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  imageStrip: { flexGrow: 0 },
  imageTile: { position: "relative", marginRight: 8 },
  imageTileImg: { width: 72, height: 72, borderRadius: 8 },
  imageTileRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: Brand.sage700,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 },
  segmentText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  segmentTextActive: { fontFamily: FontFamilies.bodySemiBold, color: "#111827" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#1f2937" },
  toggleSub: { fontFamily: FontFamilies.body, fontSize: 12, color: "#9ca3af", marginTop: 2 },
  foodsContainer: { gap: 12 },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 6,
  },
  foodCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  foodCardLabel: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#374151" },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ingImageBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ingImageSmall: { width: 36, height: 36 },
  ingInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  addIngredientBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  addIngredientText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
  },
  addFoodBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.sage700,
    borderStyle: "dashed",
    backgroundColor: "#f0f7f2",
  },
  addFoodText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Brand.sage700,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
