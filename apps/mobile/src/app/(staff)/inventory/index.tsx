import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import {
  addInventoryPhoto,
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
  submitShoppingRequest,
  updateInventoryItem,
  type HistoryActionType,
  type InventoryCategory,
  type InventoryItem,
  type InventoryStatus,
  type ShoppingRequest,
} from "@/lib/inventory-actions";
import { SkeletonBox } from "@/components/ui/SkeletonBox";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: InventoryCategory[] = [
  "Arts", "Crafts", "Science", "Math", "Writing", "Sensory", "Outdoor", "General",
];

const STATUS_COLORS: Record<string, string> = {
  Full: "#16a34a",
  "Running Out": "#d97706",
  Low: "#dc2626",
};

const HISTORY_COLORS: Record<HistoryActionType, string> = {
  taken: "#d97706",
  restocked: "#16a34a",
  photo_added: "#2563eb",
  note_added: "#6b7280",
  status_changed: "#7c3aed",
  shopping_requested: "#ea580c",
  created: Brand.sage700,
};

const HISTORY_ICONS: Record<HistoryActionType, string> = {
  taken: "remove-circle-outline",
  restocked: "add-circle-outline",
  photo_added: "camera-outline",
  note_added: "document-text-outline",
  status_changed: "swap-horizontal-outline",
  shopping_requested: "cart-outline",
  created: "star-outline",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function shortId(uuid: string): string {
  return uuid.slice(0, 8);
}

// ---------------------------------------------------------------------------
// ItemCard
// ---------------------------------------------------------------------------

function ItemCard({
  item,
  onPress,
}: {
  item: InventoryItem;
  onPress: () => void;
}) {
  const primaryPhoto = item.photos[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardPhotoZone}>
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.url }} style={styles.cardPhoto} />
        ) : (
          <View style={styles.cardPhotoPlaceholder}>
            <Ionicons name="cube-outline" size={32} color="#d1d5db" />
          </View>
        )}
        {item.status && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] ?? "#6b7280" },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {item.status === "Running Out" ? "Low Stock" : item.status}
            </Text>
          </View>
        )}
        {item.count != null && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>×{item.count}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail sheet state
  const [photoIndex, setPhotoIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<InventoryCategory>("General");
  const [editStatus, setEditStatus] = useState<InventoryStatus>(null);
  const [editCount, setEditCount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Add item sheet state
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState<InventoryCategory>("General");
  const [addStatus, setAddStatus] = useState<InventoryStatus>(null);
  const [addCount, setAddCount] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addPhotoUri, setAddPhotoUri] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  // Category/status pickers visibility
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showEditCatPicker, setShowEditCatPicker] = useState(false);
  const [showEditStatusPicker, setShowEditStatusPicker] = useState(false);

  const detailSheetRef = useRef<BottomSheetModal>(null);
  const addItemSheetRef = useRef<BottomSheetModal>(null);

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  const loadItems = useCallback(async () => {
    try {
      const data = await getInventoryItems();
      setItems(data);
    } catch (e) {
      notifyError("staff-inventory-load", e);
      console.error("inventory load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadItems();
    }, [loadItems])
  );

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.notes ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const categoriesWithItems = CATEGORIES.filter((c) =>
    items.some((i) => i.category === c)
  );

  const lowCount = items.filter((i) => i.status === "Low").length;
  const runningOutCount = items.filter((i) => i.status === "Running Out").length;
  const pendingCount = items.reduce(
    (acc, i) => acc + i.shopping_requests.filter((sr) => sr.status === "pending").length,
    0
  );
  const showStrip = lowCount > 0 || runningOutCount > 0 || pendingCount > 0;

  // ---------------------------------------------------------------------------
  // Detail sheet open
  // ---------------------------------------------------------------------------

  function openDetail(item: InventoryItem) {
    setSelectedItem(item);
    setPhotoIndex(0);
    setEditMode(false);
    setRequestOpen(false);
    setRequestNote("");
    detailSheetRef.current?.present();
  }

  function enterEditMode() {
    if (!selectedItem) return;
    setEditTitle(selectedItem.title);
    setEditCategory(selectedItem.category);
    setEditStatus(selectedItem.status);
    setEditCount(selectedItem.count != null ? String(selectedItem.count) : "");
    setEditNotes(selectedItem.notes ?? "");
    setEditMode(true);
  }

  async function saveEdit() {
    if (!selectedItem) return;
    setSavingEdit(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const countVal = editCount !== "" ? parseInt(editCount, 10) : null;
      await updateInventoryItem(
        selectedItem.id,
        {
          title: editTitle,
          category: editCategory,
          status: editStatus,
          count: isNaN(countVal as any) ? null : countVal,
          notes: editNotes || null,
        },
        selectedItem,
        user.id
      );
      setEditMode(false);
      const fresh = await getInventoryItems();
      setItems(fresh);
      const updated = fresh.find((i) => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    } catch (e) {
      notifyError("staff-inventory-save", e);
      Alert.alert("Error", "Failed to save changes.");
      console.error(e);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteItem() {
    if (!selectedItem) return;
    Alert.alert(
      "Remove Item",
      `Remove "${selectedItem.title}" from inventory? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingItem(true);
            try {
              await deleteInventoryItem(selectedItem.id);
              detailSheetRef.current?.dismiss();
              setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
            } catch (e) {
              notifyError("staff-inventory-delete", e);
              Alert.alert("Error", "Failed to remove item.");
              console.error(e);
            } finally {
              setDeletingItem(false);
            }
          },
        },
      ]
    );
  }

  // ---------------------------------------------------------------------------
  // Shopping request
  // ---------------------------------------------------------------------------

  async function handleSubmitRequest() {
    if (!selectedItem || !requestNote.trim()) return;
    setSubmittingRequest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const optimistic: ShoppingRequest = {
        id: `sr-opt-${Date.now()}`,
        item_id: selectedItem.id,
        requested_by: user.id,
        note: requestNote.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      };
      setSelectedItem((prev) =>
        prev ? { ...prev, shopping_requests: [optimistic, ...prev.shopping_requests] } : prev
      );
      setRequestNote("");
      setRequestOpen(false);
      const real = await submitShoppingRequest(selectedItem.id, requestNote.trim(), user.id);
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              shopping_requests: prev.shopping_requests.map((sr) =>
                sr.id === optimistic.id ? real : sr
              ),
            }
          : prev
      );
      const fresh = await getInventoryItems();
      setItems(fresh);
    } catch (e) {
      notifyError("staff-inventory-request", e);
      Alert.alert("Error", "Failed to submit request.");
      console.error(e);
    } finally {
      setSubmittingRequest(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Add item photo picker
  // ---------------------------------------------------------------------------

  async function pickAddPhoto(useCamera: boolean) {
    const fn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await fn({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setAddPhotoUri(result.assets[0].uri);
    }
  }

  function showPhotoPicker() {
    Alert.alert("Add Photo", "", [
      { text: "Take Photo", onPress: () => pickAddPhoto(true) },
      { text: "Choose from Library", onPress: () => pickAddPhoto(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Add item submit
  // ---------------------------------------------------------------------------

  async function handleAddItem() {
    if (!addTitle.trim()) return;
    setAddingItem(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const countVal = addCount !== "" ? parseInt(addCount, 10) : null;
      const newItem = await createInventoryItem({
        title: addTitle.trim(),
        category: addCategory,
        status: addStatus,
        count: isNaN(countVal as any) ? null : countVal,
        notes: addNotes.trim() || null,
        userId: user.id,
        photoUri: addPhotoUri,
      });
      setItems((prev) => [newItem, ...prev]);
      addItemSheetRef.current?.dismiss();
      setAddTitle("");
      setAddCategory("General");
      setAddStatus(null);
      setAddCount("");
      setAddNotes("");
      setAddPhotoUri(null);
      // Refresh to get signed URLs and full data
      const fresh = await getInventoryItems();
      setItems(fresh);
    } catch (e) {
      notifyError("staff-inventory-add", e);
      Alert.alert("Error", "Failed to add item.");
      console.error(e);
    } finally {
      setAddingItem(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addItemSheetRef.current?.present()}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {(["All", ...categoriesWithItems] as const).map((cat) => {
          const active = selectedCategory === cat;
          const count =
            cat === "All" ? items.length : items.filter((i) => i.category === cat).length;
          return (
            <Pressable
              key={cat}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setSelectedCategory(cat as any)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {cat}
              </Text>
              <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Status strip */}
      {showStrip && (
        <View style={styles.statusStrip}>
          {lowCount > 0 && (
            <View style={[styles.stripPill, { backgroundColor: "#fee2e2" }]}>
              <Text style={[styles.stripText, { color: "#dc2626" }]}>{lowCount} Low</Text>
            </View>
          )}
          {runningOutCount > 0 && (
            <View style={[styles.stripPill, { backgroundColor: "#fef3c7" }]}>
              <Text style={[styles.stripText, { color: "#d97706" }]}>
                {runningOutCount} Running Out
              </Text>
            </View>
          )}
          {pendingCount > 0 && (
            <View style={[styles.stripPill, { backgroundColor: "#f3f4f6" }]}>
              <Ionicons name="cart-outline" size={13} color="#6b7280" />
              <Text style={[styles.stripText, { color: "#6b7280" }]}>
                {pendingCount} Pending
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Item grid */}
      {loading ? (
        <View style={styles.skeletonGrid}>
          {[...Array(6)].map((_, i) => (
            <SkeletonBox key={i} width="48%" height={160} borderRadius={12} />
          ))}
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No items match your search" : "No items yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            filteredItems.length % 2 !== 0
              ? ([...filteredItems, null] as (InventoryItem | null)[])
              : (filteredItems as (InventoryItem | null)[])
          }
          numColumns={2}
          keyExtractor={(item, index) => item ? item.id : `__placeholder_${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: BottomTabInset + 16 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          renderItem={({ item }) =>
            item ? (
              <View style={{ flex: 1 }}>
                <ItemCard item={item} onPress={() => openDetail(item)} />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )
          }
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Detail bottom sheet                                                 */}
      {/* ------------------------------------------------------------------ */}
      <BottomSheetModal
        ref={detailSheetRef}
        snapPoints={["92%"]}
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
        {selectedItem && (
          <BottomSheetScrollView contentContainerStyle={styles.detailContainer}>
            {/* Sheet header */}
            <View style={styles.detailHeader}>
              {editMode ? (
                <BottomSheetTextInput
                  style={styles.detailTitleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Item name"
                />
              ) : (
                <Text style={styles.detailTitle} numberOfLines={2}>
                  {selectedItem.title}
                </Text>
              )}
              <View style={styles.detailHeaderActions}>
                {editMode ? (
                  <>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setEditMode(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, savingEdit && { opacity: 0.6 }]}
                      onPress={saveEdit}
                      disabled={savingEdit}
                    >
                      <Text style={styles.saveBtnText}>
                        {savingEdit ? "Saving…" : "Save"}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable style={styles.editBtn} onPress={enterEditMode}>
                      <Ionicons name="pencil-outline" size={18} color={Brand.sage700} />
                    </Pressable>
                    <Pressable
                      style={[styles.editBtn, { marginLeft: 8 }]}
                      onPress={handleDeleteItem}
                      disabled={deletingItem}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* Photo carousel */}
            {selectedItem.photos.length > 0 && (
              <View style={styles.carousel}>
                <Image
                  source={{ uri: selectedItem.photos[photoIndex]?.url }}
                  style={styles.carouselImage}
                />
                {selectedItem.photos.length > 1 && (
                  <>
                    {photoIndex > 0 && (
                      <Pressable
                        style={[styles.carouselArrow, styles.carouselLeft]}
                        onPress={() => setPhotoIndex((p) => p - 1)}
                      >
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                      </Pressable>
                    )}
                    {photoIndex < selectedItem.photos.length - 1 && (
                      <Pressable
                        style={[styles.carouselArrow, styles.carouselRight]}
                        onPress={() => setPhotoIndex((p) => p + 1)}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </Pressable>
                    )}
                    <View style={styles.carouselCounter}>
                      <Text style={styles.carouselCounterText}>
                        {photoIndex + 1} / {selectedItem.photos.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Metadata */}
            {editMode ? (
              <View style={styles.editFields}>
                {/* Category */}
                <Text style={styles.fieldLabel}>Category</Text>
                <Pressable
                  style={styles.pickerRow}
                  onPress={() => setShowEditCatPicker((p) => !p)}
                >
                  <Text style={styles.pickerValue}>{editCategory}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </Pressable>
                {showEditCatPicker && (
                  <View style={styles.pickerDropdown}>
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c}
                        style={styles.pickerOption}
                        onPress={() => {
                          setEditCategory(c);
                          setShowEditCatPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            c === editCategory && styles.pickerOptionActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Status */}
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Status</Text>
                <Pressable
                  style={styles.pickerRow}
                  onPress={() => setShowEditStatusPicker((p) => !p)}
                >
                  <Text style={styles.pickerValue}>{editStatus ?? "None"}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </Pressable>
                {showEditStatusPicker && (
                  <View style={styles.pickerDropdown}>
                    {([null, "Full", "Running Out", "Low"] as InventoryStatus[]).map(
                      (s) => (
                        <Pressable
                          key={String(s)}
                          style={styles.pickerOption}
                          onPress={() => {
                            setEditStatus(s);
                            setShowEditStatusPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              s === editStatus && styles.pickerOptionActive,
                            ]}
                          >
                            {s ?? "None"}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                )}

                {/* Count */}
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Count</Text>
                <BottomSheetTextInput
                  style={styles.fieldInput}
                  value={editCount}
                  onChangeText={setEditCount}
                  keyboardType="number-pad"
                  placeholder="Optional"
                />

                {/* Notes */}
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Notes</Text>
                <BottomSheetTextInput
                  style={[styles.fieldInput, { height: 80, textAlignVertical: "top" }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                  placeholder="Optional notes"
                />
              </View>
            ) : (
              <View style={styles.metaSection}>
                <View style={styles.metaRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{selectedItem.category}</Text>
                  </View>
                  {selectedItem.status && (
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[selectedItem.status] },
                      ]}
                    />
                  )}
                  {selectedItem.status && (
                    <Text
                      style={[
                        styles.statusLabel,
                        { color: STATUS_COLORS[selectedItem.status] },
                      ]}
                    >
                      {selectedItem.status}
                    </Text>
                  )}
                  {selectedItem.count != null && (
                    <View style={styles.countChip}>
                      <Text style={styles.countChipText}>×{selectedItem.count}</Text>
                    </View>
                  )}
                </View>
                {selectedItem.notes ? (
                  <Text style={styles.notesText}>{selectedItem.notes}</Text>
                ) : null}
              </View>
            )}

            {/* History */}
            <Text style={styles.sectionTitle}>History</Text>
            {selectedItem.history_log.length === 0 ? (
              <Text style={styles.emptySection}>No history yet.</Text>
            ) : (
              <View style={styles.timeline}>
                {selectedItem.history_log.map((event, idx) => (
                  <View key={event.id || idx} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor:
                              HISTORY_COLORS[event.action_type] ?? "#6b7280",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            (HISTORY_ICONS[event.action_type] ?? "ellipse-outline") as any
                          }
                          size={12}
                          color="#fff"
                        />
                      </View>
                      {idx < selectedItem.history_log.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineAction}>
                        {event.action_type.replace("_", " ")}
                      </Text>
                      {(event.action_type === "taken" ||
                        event.action_type === "restocked") &&
                        event.count_before != null &&
                        event.count_after != null && (
                          <Text style={styles.timelineCount}>
                            {event.count_before} → {event.count_after}
                          </Text>
                        )}
                      {event.note && (
                        <Text style={styles.timelineNote}>{event.note}</Text>
                      )}
                      <Text style={styles.timelineTime}>
                        {relativeTime(event.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Shopping requests */}
            {selectedItem.shopping_requests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Purchase Requests</Text>
                {selectedItem.shopping_requests.map((sr) => (
                  <View key={sr.id} style={styles.srRow}>
                    <View style={styles.srLeft}>
                      <Ionicons name="cart-outline" size={18} color="#6b7280" />
                    </View>
                    <View style={styles.srBody}>
                      <Text style={styles.srNote}>{sr.note}</Text>
                      <Text style={styles.srMeta}>{relativeTime(sr.created_at)}</Text>
                    </View>
                    <View
                      style={[
                        styles.srStatus,
                        {
                          backgroundColor:
                            sr.status === "pending"
                              ? "#fef3c7"
                              : sr.status === "approved"
                              ? "#dbeafe"
                              : sr.status === "purchased"
                              ? "#dcfce7"
                              : "#fee2e2",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.srStatusText,
                          {
                            color:
                              sr.status === "pending"
                                ? "#d97706"
                                : sr.status === "approved"
                                ? "#2563eb"
                                : sr.status === "purchased"
                                ? "#16a34a"
                                : "#dc2626",
                          },
                        ]}
                      >
                        {sr.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Request Purchase footer */}
            <View style={styles.requestSection}>
              {requestOpen ? (
                <>
                  <BottomSheetTextInput
                    style={styles.requestInput}
                    value={requestNote}
                    onChangeText={setRequestNote}
                    placeholder="Describe what you need and why…"
                    multiline
                    autoFocus
                  />
                  <View style={styles.requestActions}>
                    <Pressable
                      style={styles.requestCancel}
                      onPress={() => {
                        setRequestOpen(false);
                        setRequestNote("");
                      }}
                    >
                      <Text style={styles.requestCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.requestSubmit,
                        (!requestNote.trim() || submittingRequest) && { opacity: 0.5 },
                      ]}
                      onPress={handleSubmitRequest}
                      disabled={!requestNote.trim() || submittingRequest}
                    >
                      <Text style={styles.requestSubmitText}>
                        {submittingRequest ? "Sending…" : "Submit"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  style={styles.requestButton}
                  onPress={() => setRequestOpen(true)}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={styles.requestButtonText}>Request Purchase</Text>
                </Pressable>
              )}
            </View>
          </BottomSheetScrollView>
        )}
      </BottomSheetModal>

      {/* ------------------------------------------------------------------ */}
      {/* Add Item bottom sheet                                               */}
      {/* ------------------------------------------------------------------ */}
      <BottomSheetModal
        ref={addItemSheetRef}
        snapPoints={["92%"]}
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
        <BottomSheetScrollView contentContainerStyle={styles.addContainer}>
          <Text style={styles.addSheetTitle}>Add Item</Text>

          {/* Photo picker */}
          <Pressable style={styles.photoPicker} onPress={showPhotoPicker}>
            {addPhotoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: addPhotoUri }} style={styles.photoPreview} />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => setAddPhotoUri(null)}
                >
                  <Ionicons name="close-circle" size={22} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </Pressable>

          {/* Name */}
          <Text style={styles.fieldLabel}>Name *</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={addTitle}
            onChangeText={setAddTitle}
            placeholder="e.g. Colored Pencils"
          />

          {/* Category */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Category</Text>
          <Pressable
            style={styles.pickerRow}
            onPress={() => setShowCatPicker((p) => !p)}
          >
            <Text style={styles.pickerValue}>{addCategory}</Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </Pressable>
          {showCatPicker && (
            <View style={styles.pickerDropdown}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={styles.pickerOption}
                  onPress={() => {
                    setAddCategory(c);
                    setShowCatPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      c === addCategory && styles.pickerOptionActive,
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Status + Count row */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Status</Text>
              <Pressable
                style={styles.pickerRow}
                onPress={() => setShowStatusPicker((p) => !p)}
              >
                <Text style={styles.pickerValue}>{addStatus ?? "None"}</Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </Pressable>
              {showStatusPicker && (
                <View style={styles.pickerDropdown}>
                  {([null, "Full", "Running Out", "Low"] as InventoryStatus[]).map((s) => (
                    <Pressable
                      key={String(s)}
                      style={styles.pickerOption}
                      onPress={() => {
                        setAddStatus(s);
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          s === addStatus && styles.pickerOptionActive,
                        ]}
                      >
                        {s ?? "None"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Count</Text>
              <BottomSheetTextInput
                style={styles.fieldInput}
                value={addCount}
                onChangeText={setAddCount}
                keyboardType="number-pad"
                placeholder="Optional"
              />
            </View>
          </View>

          {/* Notes */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes</Text>
          <BottomSheetTextInput
            style={[styles.fieldInput, { height: 80, textAlignVertical: "top" }]}
            value={addNotes}
            onChangeText={setAddNotes}
            multiline
            placeholder="Optional"
          />

          {/* Submit */}
          <Pressable
            style={[
              styles.submitButton,
              (!addTitle.trim() || addingItem) && { opacity: 0.5 },
            ]}
            onPress={handleAddItem}
            disabled={!addTitle.trim() || addingItem}
          >
            {addingItem ? (
              <Text style={styles.submitButtonText}>Adding…</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Add Item</Text>
              </>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: "#111827",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.sage700,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#fff",
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
  },

  // Category tabs
  tabsScroll: { maxHeight: 44 },
  tabsContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tabActive: { backgroundColor: Brand.sage700 },
  tabText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#4b5563" },
  tabTextActive: { color: "#fff" },
  tabBadge: {
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontFamily: FontFamilies.body, fontSize: 11, color: "#6b7280" },
  tabBadgeTextActive: { color: "#fff" },

  // Status strip
  statusStrip: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexWrap: "wrap",
  },
  stripPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stripText: { fontFamily: FontFamilies.body, fontSize: 12 },

  // Skeleton grid
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Empty
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: FontFamilies.body, fontSize: 15, color: "#9ca3af" },

  // ItemCard
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPhotoZone: { aspectRatio: 1, position: "relative" },
  cardPhoto: { width: "100%", height: "100%" },
  cardPhotoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: { fontFamily: FontFamilies.body, fontSize: 10, color: "#fff" },
  countPill: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countPillText: { fontFamily: FontFamilies.body, fontSize: 11, color: "#fff" },
  cardInfo: { padding: 10 },
  cardTitle: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#111827" },
  cardCategory: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9ca3af", marginTop: 2 },

  // Detail sheet
  detailContainer: { paddingHorizontal: 20, paddingBottom: 48 },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  detailTitle: {
    flex: 1,
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#111827",
  },
  detailTitleInput: {
    flex: 1,
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: Brand.sage700,
    paddingBottom: 4,
  },
  detailHeaderActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  editBtn: {
    padding: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelBtnText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Brand.sage700,
  },
  saveBtnText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#fff" },

  // Carousel
  carousel: {
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    marginBottom: 16,
    position: "relative",
    backgroundColor: "#f3f4f6",
  },
  carouselImage: { width: "100%", height: "100%" },
  carouselArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselLeft: { left: 8 },
  carouselRight: { right: 8 },
  carouselCounter: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  carouselCounterText: { fontFamily: FontFamilies.body, fontSize: 12, color: "#fff" },

  // Metadata (view mode)
  metaSection: { marginBottom: 20 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  categoryPillText: { fontFamily: FontFamilies.body, fontSize: 12, color: Brand.sage700 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13 },
  countChip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countChipText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#374151" },
  notesText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },

  // Edit fields
  editFields: { marginBottom: 20 },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  pickerValue: { fontFamily: FontFamilies.body, fontSize: 14, color: "#111827" },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 4,
    overflow: "hidden",
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 12 },
  pickerOptionText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#4b5563" },
  pickerOptionActive: { color: Brand.sage700, fontFamily: FontFamilies.bodySemiBold },
  twoCol: { flexDirection: "row" },

  // Section titles
  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },
  emptySection: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 16,
  },

  // History timeline
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineLeft: { alignItems: "center", width: 28 },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: { flex: 1, width: 1, backgroundColor: "#e5e7eb", marginTop: 4 },
  timelineBody: { flex: 1, paddingBottom: 16 },
  timelineAction: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
    textTransform: "capitalize",
  },
  timelineCount: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  timelineNote: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
    fontStyle: "italic",
    marginTop: 2,
  },
  timelineTime: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9ca3af", marginTop: 2 },

  // Shopping requests
  srRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  srLeft: { paddingTop: 2 },
  srBody: { flex: 1 },
  srNote: { fontFamily: FontFamilies.body, fontSize: 13, color: "#374151" },
  srMeta: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9ca3af", marginTop: 2 },
  srStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  srStatusText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 11 },

  // Request purchase
  requestSection: { marginTop: 24 },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
  },
  requestButtonText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#fff" },
  requestInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
  },
  requestActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  requestCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  requestCancelText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#6b7280" },
  requestSubmit: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Brand.sage700,
  },
  requestSubmitText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#fff" },

  // Add item sheet
  addContainer: { paddingHorizontal: 20, paddingBottom: 48 },
  addSheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#111827",
    marginBottom: 20,
    marginTop: 4,
  },

  // Photo picker
  photoPicker: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    aspectRatio: 16 / 9,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  photoPlaceholder: { alignItems: "center", gap: 8 },
  photoPlaceholderText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#9ca3af" },
  photoPreviewWrap: { width: "100%", height: "100%", position: "relative" },
  photoPreview: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },

  // Submit button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
  },
  submitButtonText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#fff" },
});
