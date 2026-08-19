import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import type { Activity } from "@/lib/activities-actions";
import {
  ALLERGEN_DISCLAIMER,
  LEVEL_OPTIONS,
  LEVEL_SHORT_LABEL,
  buildInitialPrefsForActivity,
  fetchPreferencesForActivity,
  saveActivityPreferencesBatch,
  type ActivityPref,
  type ParticipationLevel,
} from "@/lib/activity-preferences";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  child_legal_name: string;
  profile_image_url?: string | null;
};

type Props = {
  activity: Activity | null;
  students: Student[];
  parentId: string | null;
  userId: string | null;
  readOnly?: boolean;
  onSaved?: () => void;
};

const AVATAR_PALETTE = [
  "#6b7c9b", "#7b8ca3", "#8b9c7e", "#9c7e8b",
  "#7e8b9c", "#a07060", "#707ea0", "#608070",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function LevelSegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: ParticipationLevel | null;
  onChange: (level: ParticipationLevel | null) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segmentedRow}>
      {LEVEL_OPTIONS.map((opt) => {
        const active = value === opt.level;
        return (
          <TouchableOpacity
            key={opt.level}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={() => onChange(active ? null : opt.level)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.segmentEmoji}>{opt.emoji}</Text>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {LEVEL_SHORT_LABEL[opt.level]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const ParentActivityPreferenceSheet = forwardRef<BottomSheetModal, Props>(
  function ParentActivityPreferenceSheet(
    { activity, students, parentId, userId, readOnly = false, onSaved },
    ref,
  ) {
    const router = useRouter();
    const sheetRef = useRef<BottomSheetModal>(null);
    const confirmSheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(ref, () => sheetRef.current!);

    const [loading, setLoading] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [prefsByStudent, setPrefsByStudent] = useState<Record<string, ActivityPref>>({});
    const [savedStudentIds, setSavedStudentIds] = useState<Set<string>>(new Set());
    const [snapshotByStudent, setSnapshotByStudent] = useState<Record<string, ActivityPref>>({});
    const [expandedFoods, setExpandedFoods] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [userProfile, setUserProfile] = useState<{ full_name: string; email: string } | null>(null);

    const studentIds = useMemo(() => students.map((s) => s.id), [students]);

    const loadPrefs = useCallback(async () => {
      if (!activity || !parentId || studentIds.length === 0) return;
      setLoading(true);
      try {
        const { savedByStudent, defaultsByStudent, savedStudentIds: savedIds } =
          await fetchPreferencesForActivity(parentId, activity.id, studentIds);

        const { prefs, savedIds: initialSavedIds, snapshots } = buildInitialPrefsForActivity(
          studentIds,
          savedByStudent,
          defaultsByStudent,
          savedIds,
        );

        setPrefsByStudent(prefs);
        setSavedStudentIds(initialSavedIds);
        setSnapshotByStudent(snapshots);
        setSelectedChildId((prev) =>
          prev && studentIds.includes(prev) ? prev : studentIds[0] ?? null,
        );
      } catch (err) {
        notifyError("activity-pref-sheet-load", err);
      } finally {
        setLoading(false);
      }
    }, [activity, parentId, studentIds]);

    useEffect(() => {
      if (!userId) return;
      supabase
        .schema("admin")
        .from("users")
        .select("full_name, email")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          if (data) setUserProfile(data as { full_name: string; email: string });
        });
    }, [userId]);

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === 0) {
          void loadPrefs();
        } else if (index === -1) {
          setSaveStatus("idle");
          setExpandedFoods(false);
        }
      },
      [loadPrefs],
    );

    const currentPref = selectedChildId
      ? (prefsByStudent[selectedChildId] ?? { level: null, notes: "" })
      : { level: null, notes: "" };

    const isPreFilled =
      !!selectedChildId &&
      !savedStudentIds.has(selectedChildId) &&
      currentPref.level !== null;

    const hasUnsavedChanges = studentIds.some((id) => {
      const current = prefsByStudent[id] ?? { level: null, notes: "" };
      const saved = snapshotByStudent[id] ?? { level: null, notes: "" };
      return (
        (current.level ?? null) !== (saved.level ?? null) ||
        (current.notes ?? "") !== (saved.notes ?? "")
      );
    });

    const hasAnySelection = studentIds.some(
      (id) => (prefsByStudent[id]?.level ?? null) !== null,
    );

    const canSave =
      !readOnly && hasUnsavedChanges && hasAnySelection && saveStatus !== "saving";

    const showFoods =
      !!activity?.includes_food && (activity.foods?.length ?? 0) > 0;

    const setPref = (studentId: string, update: Partial<ActivityPref>) => {
      setSavedStudentIds((prev) => new Set(prev).add(studentId));
      setPrefsByStudent((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] ?? { level: null, notes: "" }),
          ...update,
        },
      }));
      if (saveStatus === "saved" || saveStatus === "error") {
        setSaveStatus("idle");
      }
    };

    const handleSave = async () => {
      if (readOnly || !parentId || !activity || saveStatus === "saving") return;
      if (!hasUnsavedChanges || !hasAnySelection) return;

      setSaveStatus("saving");
      try {
        const entries = studentIds
          .filter((studentId) => {
            const pref = prefsByStudent[studentId] ?? { level: null, notes: "" };
            const snap = snapshotByStudent[studentId] ?? { level: null, notes: "" };
            return (
              (pref.level ?? null) !== (snap.level ?? null) ||
              (pref.notes ?? "") !== (snap.notes ?? "")
            );
          })
          .map((studentId) => {
            const pref = prefsByStudent[studentId] ?? { level: null, notes: "" };
            const child = students.find((s) => s.id === studentId);
            return {
              studentId,
              childName: child?.child_legal_name ?? "Unknown",
              level: pref.level,
              notes: pref.notes,
            };
          });

        await saveActivityPreferencesBatch(
          parentId,
          activity.id,
          activity.title,
          entries,
          userProfile,
        );

        const nextSnapshots: Record<string, ActivityPref> = {};
        for (const studentId of studentIds) {
          const pref = prefsByStudent[studentId] ?? { level: null, notes: "" };
          nextSnapshots[studentId] = { level: pref.level, notes: pref.notes };
          if (pref.level !== null) {
            setSavedStudentIds((prev) => new Set(prev).add(studentId));
          }
        }
        setSnapshotByStudent(nextSnapshots);

        confirmSheetRef.current?.dismiss();
        setSaveStatus("saved");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSaved?.();

        setTimeout(() => {
          sheetRef.current?.dismiss();
          setSaveStatus("idle");
        }, 600);
      } catch (err) {
        notifyError("activity-pref-sheet-save", err);
        setSaveStatus("error");
      }
    };

    const handleSavePress = () => {
      if (!canSave) return;
      if (showFoods) {
        confirmSheetRef.current?.present();
      } else {
        void handleSave();
      }
    };

    const renderConfirmBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      ),
      [],
    );

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      ),
      [],
    );

    const selectedOption = LEVEL_OPTIONS.find((o) => o.level === currentPref.level);
    const coverUrl = activity?.images?.[0]?.signed_url ?? null;

    return (
      <>
        <BottomSheetModal
          ref={sheetRef}
          snapPoints={["75%", "92%"]}
          enablePanDownToClose
          onChange={handleSheetChange}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {!activity ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No activity selected.</Text>
              </View>
            ) : (
              <>
                {coverUrl ? (
                  <Image
                    source={{ uri: coverUrl }}
                    style={styles.cover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Ionicons name="ribbon-outline" size={28} color="#d1d5db" />
                  </View>
                )}

                <Text style={styles.title}>{activity.title}</Text>
                {activity.activity_date ? (
                  <Text style={styles.date}>
                    {new Date(activity.activity_date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "long", month: "long", day: "numeric" },
                    )}
                  </Text>
                ) : null}

                {activity.description ? (
                  <Text style={styles.description}>{activity.description}</Text>
                ) : null}

                {students.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillList}
                  >
                    {students.map((child) => {
                      const active = child.id === selectedChildId;
                      const pref = prefsByStudent[child.id] ?? { level: null, notes: "" };
                      const unset = pref.level === null;
                      return (
                        <TouchableOpacity
                          key={child.id}
                          style={[styles.pill, active && styles.pillActive]}
                          onPress={() => setSelectedChildId(child.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.pillAvatar,
                              { backgroundColor: avatarColor(child.id) },
                            ]}
                          >
                            <Text style={styles.pillAvatarText}>
                              {getInitials(child.child_legal_name)}
                            </Text>
                          </View>
                          <Text
                            style={[styles.pillName, active && styles.pillNameActive]}
                            numberOfLines={1}
                          >
                            {child.child_legal_name.split(" ")[0]}
                          </Text>
                          {unset ? <View style={styles.pillDot} /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}

                {loading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="small" color={Brand.sage700} />
                  </View>
                ) : (
                  <>
                    {selectedChildId ? (
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            currentPref.level === null
                              ? styles.statusBadgeUnset
                              : isPreFilled
                                ? styles.statusBadgeDefault
                                : styles.statusBadgeSaved,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              currentPref.level === null
                                ? styles.statusBadgeTextUnset
                                : isPreFilled
                                  ? styles.statusBadgeTextDefault
                                  : styles.statusBadgeTextSaved,
                            ]}
                          >
                            {currentPref.level === null
                              ? "Not set"
                              : isPreFilled
                                ? "Pre-filled"
                                : "Saved"}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {showFoods ? (
                      <View style={styles.foodSection}>
                        <TouchableOpacity
                          style={styles.foodToggle}
                          onPress={() => setExpandedFoods((v) => !v)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="restaurant-outline" size={15} color={Brand.sage700} />
                          <Text style={styles.foodToggleLabel}>
                            {expandedFoods
                              ? "Hide ingredients"
                              : `${activity.foods.length} food item${activity.foods.length === 1 ? "" : "s"}`}
                          </Text>
                          <Ionicons
                            name={expandedFoods ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#6b7280"
                            style={{ marginLeft: "auto" }}
                          />
                        </TouchableOpacity>

                        {expandedFoods
                          ? activity.foods.map((food) => (
                              <View key={food.id} style={styles.foodItem}>
                                <View style={styles.foodItemHeader}>
                                  <Text style={styles.foodName}>{food.name}</Text>
                                  {food.allergens ? (
                                    <View style={styles.allergenBadge}>
                                      <Text style={styles.allergenText}>
                                        {food.allergens}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                                {food.ingredients.length > 0 ? (
                                  <Text style={styles.ingredients}>
                                    {food.ingredients.map((ig) => ig.name).join(", ")}
                                  </Text>
                                ) : null}
                              </View>
                            ))
                          : null}
                      </View>
                    ) : null}

                    <View style={styles.levelSection}>
                      <Text style={styles.levelLabel}>Participation</Text>
                      <LevelSegmentedControl
                        value={currentPref.level}
                        onChange={(level) =>
                          selectedChildId && setPref(selectedChildId, { level })
                        }
                        disabled={readOnly || !selectedChildId}
                      />
                      {selectedOption ? (
                        <Text style={styles.levelSubtitle}>{selectedOption.label}</Text>
                      ) : null}
                    </View>

                    {currentPref.level !== null && selectedChildId ? (
                      <BottomSheetTextInput
                        style={styles.notesInput}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholder="Optional notes (e.g. oat milk instead of dairy)"
                        placeholderTextColor="#9ca3af"
                        value={currentPref.notes}
                        onChangeText={(text) => setPref(selectedChildId, { notes: text })}
                        editable={!readOnly}
                      />
                    ) : null}

                    {saveStatus === "error" ? (
                      <Text style={styles.saveErrorText}>
                        Something went wrong. Please try again.
                      </Text>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                      onPress={handleSavePress}
                      disabled={!canSave}
                      activeOpacity={0.8}
                    >
                      {saveStatus === "saving" ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveBtnText}>
                          {saveStatus === "saved" ? "Saved ✓" : "Save Preference"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <Pressable
                      onPress={() => {
                        sheetRef.current?.dismiss();
                        router.push("/(tabs)/preferences" as any);
                      }}
                      style={({ pressed }) => [
                        styles.viewAllLink,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.viewAllLinkText}>
                        View all activity preferences
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={Brand.sage700} />
                    </Pressable>
                  </>
                )}
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={confirmSheetRef}
          snapPoints={["45%"]}
          enablePanDownToClose
          backdropComponent={renderConfirmBackdrop}
        >
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Review ingredients & allergens</Text>
            <Text style={styles.confirmBody}>{ALLERGEN_DISCLAIMER}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => confirmSheetRef.current?.dismiss()}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmSaveBtn,
                  saveStatus === "saving" && styles.saveBtnDisabled,
                ]}
                onPress={() => void handleSave()}
                disabled={saveStatus === "saving"}
                activeOpacity={0.8}
              >
                {saveStatus === "saving" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm and Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetModal>
      </>
    );
  },
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 40,
    gap: 14,
  },
  cover: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  coverPlaceholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
  },
  date: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
    marginTop: -8,
  },
  description: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
  },
  pillList: {
    gap: 10,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: "#F2F7F3",
  },
  pillActive: {
    backgroundColor: Brand.sage700,
  },
  pillAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pillAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  pillName: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
  },
  pillNameActive: {
    color: "#fff",
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  centered: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeUnset: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusBadgeDefault: {
    backgroundColor: `${Brand.sage700}14`,
    borderWidth: 1,
    borderColor: `${Brand.sage700}40`,
  },
  statusBadgeSaved: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FontFamilies.bodySemiBold,
  },
  statusBadgeTextUnset: { color: "#6b7280" },
  statusBadgeTextDefault: { color: Brand.sage700 },
  statusBadgeTextSaved: { color: "#16a34a" },
  foodSection: { gap: 8 },
  foodToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
  },
  foodToggleLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  foodItem: { paddingLeft: 4, gap: 4, marginTop: 4 },
  foodItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  foodName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  allergenBadge: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allergenText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#92400e",
  },
  ingredients: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  levelSection: { gap: 8 },
  levelLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  levelSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  segmentedRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 4,
  },
  segmentBtnActive: {
    borderColor: Brand.sage700,
    backgroundColor: `${Brand.sage700}14`,
  },
  segmentEmoji: { fontSize: 16 },
  segmentLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#4b5563",
  },
  segmentLabelActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    minHeight: 72,
    color: "#1f2937",
    backgroundColor: "#fafafa",
  },
  saveErrorText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#dc2626",
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
  viewAllLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  viewAllLinkText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  confirmSheet: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  confirmTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 17,
    color: "#111827",
  },
  confirmBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: "auto",
  },
  confirmCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  confirmCancelText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
  confirmSaveBtn: {
    flex: 1,
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
