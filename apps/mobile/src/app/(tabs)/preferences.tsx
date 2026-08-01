import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Brand, FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { computePaidDates, SUMMER_FIRST_DATE, SUMMER_LAST_DATE, type TxRow } from "@/lib/compute-paid-dates";

// ─── Types ────────────────────────────────────────────────────────────────────

type Child = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
};

type ActivityIngredient = { id: string; name: string; sort_order: number };

type ActivityFood = {
  id: string;
  name: string;
  sort_order: number;
  allergens: string | null;
  activity_ingredients: ActivityIngredient[];
};

type Activity = {
  id: string;
  title: string;
  description: string | null;
  includes_food: boolean;
  activity_date: string | null;
  activity_foods: ActivityFood[];
};

type SavedPref = {
  student_id: string;
  activity_id: string;
  participation_level: "watch" | "cook_no_eat" | "full";
  notes: string;
};

type ParticipationLevel = "watch" | "cook_no_eat" | "full";
type Pref = { level: ParticipationLevel | null; notes: string };
type AllPreferences = Record<string, Record<string, Pref>>; // [studentId][activityId]

type StudentDefault = { student_id: string; participation_level: ParticipationLevel };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const LEVEL_OPTIONS: { level: ParticipationLevel; emoji: string; label: string }[] = [
  { level: "watch",       emoji: "👀",    label: "Do not participate, just watch" },
  { level: "cook_no_eat", emoji: "🧑‍🍳",   label: "Cook and interact with ingredients but do not consume" },
  { level: "full",        emoji: "✅",    label: "Okay for everything (cooking and eating)" },
];

const LEVEL_SHORT_LABEL: Record<ParticipationLevel, string> = {
  watch: "Watch",
  cook_no_eat: "Cook",
  full: "Full",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PreferencesScreen() {
  const router = useRouter();
  const { userId, effectiveParentId, isGrantee } = useAuth();

  const [loading, setLoading]                         = useState(true);
  const [children, setChildren]                       = useState<Child[]>([]);
  const [activities, setActivities]                   = useState<Activity[]>([]);
  const [paidDatesByStudent, setPaidDatesByStudent]   = useState<Record<string, string[]>>({});
  const [preferences, setPreferences]                 = useState<AllPreferences>({});
  const [expandedFoods, setExpandedFoods]             = useState<Set<string>>(new Set());
  const [selectedChildId, setSelectedChildId]         = useState<string | null>(null);
  const [saveStatus, setSaveStatus]                   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasAcknowledged, setHasAcknowledged]         = useState(false);
  const [userProfile, setUserProfile]                 = useState<{ full_name: string; email: string } | null>(null);

  // Default preference state
  const [defaults, setDefaults]                       = useState<StudentDefault[]>([]);
  const [defaultSaveStatus, setDefaultSaveStatus]     = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedActivityIds, setSavedActivityIds]       = useState<Set<string>>(new Set());
  // Raw saved prefs kept in a ref so child-tab switching can recompute savedActivityIds
  const savedPrefsRaw = useRef<SavedPref[]>([]);
  const defaultSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    if (!effectiveParentId || !userId) return;
    try {
      const [studentsRes, txRes, activitiesRes, prefsRes, profileRes, defaultsRes] = await Promise.all([
        supabase
          .schema("admin")
          .from("students")
          .select("id, child_legal_name, profile_image_url")
          .eq("parent_id", effectiveParentId)
          .eq("is_deleted", false),

        supabase
          .schema("billing")
          .from("stripe_transactions")
          .select("student_id, payment_type, status, metadata")
          .eq("parent_id", effectiveParentId)
          .eq("is_deleted", false),

        supabase
          .schema("teachers")
          .from("activities")
          .select(`
            id, title, description, includes_food, activity_date,
            activity_foods (
              id, name, sort_order, allergens,
              activity_ingredients ( id, name, sort_order )
            )
          `)
          .eq("status", "published")
          .eq("visibility", "public")
          .eq("is_deleted", false),

        supabase
          .schema("parent_app")
          .from("activity_preferences")
          .select("student_id, activity_id, participation_level, notes")
          .eq("parent_id", effectiveParentId),

        supabase
          .schema("admin")
          .from("users")
          .select("full_name, email")
          .eq("id", userId)
          .single(),

        supabase
          .schema("parent_app")
          .from("student_default_preferences")
          .select("student_id, participation_level"),
      ]);

      if (studentsRes.error)   console.error("[prefs] students:", studentsRes.error.message);
      if (txRes.error)         console.error("[prefs] transactions:", txRes.error.message);
      if (activitiesRes.error) console.error("[prefs] activities:", activitiesRes.error.message);
      if (prefsRes.error)      console.error("[prefs] preferences:", prefsRes.error.message);
      if (profileRes.error)    console.error("[prefs] profile:", profileRes.error.message);
      if (defaultsRes.error)   console.error("[prefs] defaults:", defaultsRes.error.message);

      const kidsData: Child[] = (studentsRes.data ?? []).filter((c: any) => c.id);

      const activitiesData: Activity[] = (activitiesRes.data ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description ?? null,
        includes_food: a.includes_food,
        activity_date: a.activity_date ?? null,
        activity_foods: (a.activity_foods ?? [])
          .sort((x: any, y: any) => x.sort_order - y.sort_order)
          .map((f: any) => ({
            id: f.id,
            name: f.name,
            sort_order: f.sort_order,
            allergens: f.allergens ?? null,
            activity_ingredients: (f.activity_ingredients ?? []).sort(
              (x: any, y: any) => x.sort_order - y.sort_order
            ),
          })),
      }));

      const savedPrefs: SavedPref[] = (prefsRes.data ?? []) as SavedPref[];
      savedPrefsRaw.current = savedPrefs;

      const fetchedDefaults: StudentDefault[] = (defaultsRes.data ?? []) as StudentDefault[];

      const paidDates = computePaidDates((txRes.data ?? []) as TxRow[]);
      console.log(
        "[prefs] txns:", txRes.data?.length ?? 0,
        "| paidStudents:", Object.keys(paidDates).length,
        "| activities:", activitiesData.length,
      );
      if (kidsData.length > 0) {
        console.log("[prefs] paidDates for first child:", paidDates[kidsData[0].id] ?? []);
        console.log("[prefs] activity dates:", activitiesData.map((a) => a.activity_date));
      }

      setChildren(kidsData);
      setActivities(activitiesData);
      setPaidDatesByStudent(paidDates);
      setDefaults(fetchedDefaults);
      if (profileRes.data) setUserProfile(profileRes.data as any);

      const initPrefs: AllPreferences = {};
      for (const child of kidsData) {
        initPrefs[child.id] = {};
        const childDefault = fetchedDefaults.find((d) => d.student_id === child.id)?.participation_level ?? null;
        for (const act of activitiesData) {
          const saved = savedPrefs.find(
            (s) => s.student_id === child.id && s.activity_id === act.id
          );
          initPrefs[child.id][act.id] = saved
            ? { level: saved.participation_level, notes: saved.notes ?? "" }
            : childDefault
            ? { level: childDefault, notes: "" }
            : { level: null, notes: "" };
        }
      }
      setPreferences(initPrefs);

      if (kidsData.length > 0) {
        const firstId = kidsData[0].id;
        const firstChildDefault = fetchedDefaults.find((d) => d.student_id === firstId)?.participation_level ?? null;
        setSelectedChildId(firstId);
        setSavedActivityIds(
          new Set(
            savedPrefs
              .filter((p) => p.student_id === firstId)
              .filter((p) => {
                if (!firstChildDefault) return true;
                return !(p.participation_level === firstChildDefault && !p.notes);
              })
              .map((p) => p.activity_id)
          )
        );
      }
    } catch (err) {
      console.error("[prefs] loadData error:", err);
      notifyError("preferences-load", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId, userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toISOString().slice(0, 10);
  const visibleActivities = selectedChildId
    ? activities.filter((a) => {
        if (a.activity_date && a.activity_date < today) return false;
        if (!a.activity_date) return true;
        if (a.activity_date < SUMMER_FIRST_DATE || a.activity_date > SUMMER_LAST_DATE) return true;
        return (paidDatesByStudent[selectedChildId] ?? []).includes(a.activity_date);
      })
    : [];

  const currentDefault =
    defaults.find((d) => d.student_id === selectedChildId)?.participation_level ?? null;

  const setPref = (activityId: string, update: Partial<Pref>) => {
    if (!selectedChildId) return;
    // Mark as explicitly set so the ⚡ indicator clears
    setSavedActivityIds((prev) => new Set(prev).add(activityId));
    setPreferences((prev) => ({
      ...prev,
      [selectedChildId]: {
        ...prev[selectedChildId],
        [activityId]: {
          ...(prev[selectedChildId]?.[activityId] ?? { level: null, notes: "" }),
          ...update,
        },
      },
    }));
    setSaveStatus("idle");
  };

  const handleSetDefault = async (level: ParticipationLevel | null) => {
    if (!selectedChildId || !effectiveParentId) return;
    setDefaultSaveStatus("saving");

    // Optimistic update to defaults list
    setDefaults((prev) => {
      const without = prev.filter((d) => d.student_id !== selectedChildId);
      return level !== null
        ? [...without, { student_id: selectedChildId, participation_level: level }]
        : without;
    });

    // Push the new default into any activity prefs that haven't been explicitly set
    if (level !== null) {
      setPreferences((prev) => {
        const childPrefs = { ...(prev[selectedChildId] ?? {}) };
        for (const act of visibleActivities) {
          if (!savedActivityIds.has(act.id)) {
            childPrefs[act.id] = { level, notes: childPrefs[act.id]?.notes ?? "" };
          }
        }
        return { ...prev, [selectedChildId]: childPrefs };
      });
    } else {
      // Clearing default — reset unsaved activity prefs back to null
      setPreferences((prev) => {
        const childPrefs = { ...(prev[selectedChildId] ?? {}) };
        for (const act of visibleActivities) {
          if (!savedActivityIds.has(act.id)) {
            childPrefs[act.id] = { level: null, notes: "" };
          }
        }
        return { ...prev, [selectedChildId]: childPrefs };
      });
    }

    try {
      if (level !== null) {
        const { error } = await supabase
          .schema("parent_app")
          .from("student_default_preferences")
          .upsert(
            { parent_id: effectiveParentId, student_id: selectedChildId, participation_level: level },
            { onConflict: "parent_id,student_id" }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema("parent_app")
          .from("student_default_preferences")
          .delete()
          .eq("parent_id", effectiveParentId)
          .eq("student_id", selectedChildId);
        if (error) throw error;
      }

      if (userProfile) {
        const child = children.find((c) => c.id === selectedChildId);
        notifyDiscord({
          type: "default_preference_set",
          data: {
            parentName: userProfile.full_name,
            parentEmail: userProfile.email,
            childName: child?.child_legal_name ?? "Unknown",
            level,
          },
        });
      }

      setDefaultSaveStatus("saved");
      if (defaultSaveTimer.current) clearTimeout(defaultSaveTimer.current);
      defaultSaveTimer.current = setTimeout(() => setDefaultSaveStatus("idle"), 2500);
    } catch (err) {
      notifyError("default-preference-save", err);
      setDefaultSaveStatus("error");
    }
  };

  const handleSave = async () => {
    if (!selectedChildId || !effectiveParentId) return;
    setSaveStatus("saving");
    try {
      const childPrefs = preferences[selectedChildId] ?? {};
      const entries = visibleActivities.map((a) => ({
        activityId: a.id,
        ...(childPrefs[a.id] ?? { level: null, notes: "" }),
      }));

      const toUpsert = entries
        .filter((e) => e.level !== null)
        .map((e) => ({
          parent_id: effectiveParentId,
          student_id: selectedChildId,
          activity_id: e.activityId,
          participation_level: e.level,
          notes: e.notes,
        }));

      const toDeleteIds = entries.filter((e) => e.level === null).map((e) => e.activityId);

      if (toUpsert.length > 0) {
        const { error } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .upsert(toUpsert, { onConflict: "student_id,activity_id" });
        if (error) throw error;
      }

      if (toDeleteIds.length > 0) {
        const { error } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .delete()
          .eq("parent_id", effectiveParentId)
          .eq("student_id", selectedChildId)
          .in("activity_id", toDeleteIds);
        if (error) throw error;
      }

      // After a successful save all visible activities become explicitly set
      setSavedActivityIds((prev) => {
        const next = new Set(prev);
        toUpsert.forEach((u) => next.add(u.activity_id));
        return next;
      });

      if (toUpsert.length > 0 && userProfile) {
        const child = children.find((c) => c.id === selectedChildId);
        notifyDiscord({
          type: "activity_preferences_saved",
          data: {
            parentName: userProfile.full_name,
            parentEmail: userProfile.email,
            childName: child?.child_legal_name ?? "Unknown",
            preferences: toUpsert.map((u) => ({
              title: activities.find((a) => a.id === u.activity_id)?.title ?? u.activity_id,
              level: u.participation_level,
              notes: u.notes ?? "",
            })),
          },
        });
      }

      setSaveStatus("saved");
    } catch (err) {
      notifyError("preferences-save", err);
      setSaveStatus("error");
    }
  };

  const toggleFoods = (activityId: string) => {
    setExpandedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  // ─── AutoFill Banner ───────────────────────────────────────────────────────

  const selectedChildName = children.find((c) => c.id === selectedChildId)?.child_legal_name.split(" ")[0] ?? "your child";

  const AutoFillBanner = visibleActivities.length > 0 ? (
    <View style={styles.autoFillCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={styles.autoFillTitle}>⚡ Auto-fill preference</Text>
      </View>
      <Text style={styles.autoFillDesc}>
        Pick a default and new activities for {selectedChildName} will be pre-set automatically. You can still change any individual activity.
      </Text>

      <View style={styles.autoFillButtons}>
        {LEVEL_OPTIONS.map((opt) => {
          const active = currentDefault === opt.level;
          return (
            <TouchableOpacity
              key={opt.level}
              style={[styles.autoFillBtn, active && styles.autoFillBtnActive]}
              onPress={() => handleSetDefault(active ? null : opt.level)}
              disabled={defaultSaveStatus === "saving"}
              activeOpacity={0.7}
            >
              <Text style={styles.autoFillBtnEmoji}>{opt.emoji}</Text>
              <Text style={[styles.autoFillBtnText, active && styles.autoFillBtnTextActive]}>
                {LEVEL_SHORT_LABEL[opt.level]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {currentDefault !== null && defaultSaveStatus === "idle" && (
        <TouchableOpacity
          style={styles.autoFillClearBtn}
          onPress={() => handleSetDefault(null)}
          activeOpacity={0.7}
        >
          <Text style={styles.autoFillClearText}>Clear default</Text>
        </TouchableOpacity>
      )}

      {defaultSaveStatus !== "idle" && (
        <Text
          style={[
            styles.autoFillStatus,
            defaultSaveStatus === "error" && styles.autoFillStatusError,
          ]}
        >
          {defaultSaveStatus === "saving"
            ? "Saving..."
            : defaultSaveStatus === "saved" && currentDefault !== null
            ? `✓ Auto-fill active · "${LEVEL_SHORT_LABEL[currentDefault]}"`
            : defaultSaveStatus === "saved"
            ? "Default cleared"
            : "Something went wrong. Please try again."}
        </Text>
      )}
      {defaultSaveStatus === "idle" && currentDefault !== null && (
        <Text style={styles.autoFillStatus}>
          ✓ Auto-fill active · "{LEVEL_SHORT_LABEL[currentDefault]}"
        </Text>
      )}
    </View>
  ) : null;

  // ─── Skeleton loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Activity Preferences</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width="55%" height={18} borderRadius={6} />
              <SkeletonBox width="38%" height={13} borderRadius={6} />
              <SkeletonBox width="100%" height={76} borderRadius={10} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Activity Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Child pill selector */}
      <FlatList
        horizontal
        style={{ flexGrow: 0 }}
        data={children}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillList}
        renderItem={({ item }) => {
          const active = item.id === selectedChildId;
          return (
            <TouchableOpacity
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => {
                setSelectedChildId(item.id);
                setSaveStatus("idle");
                setHasAcknowledged(false);
                const childDefault = defaults.find((d) => d.student_id === item.id)?.participation_level ?? null;
                setSavedActivityIds(
                  new Set(
                    savedPrefsRaw.current
                      .filter((p) => p.student_id === item.id)
                      .filter((p) => {
                        if (!childDefault) return true;
                        return !(p.participation_level === childDefault && !p.notes);
                      })
                      .map((p) => p.activity_id)
                  )
                );
              }}
            >
              <View style={[styles.pillAvatar, { backgroundColor: avatarColor(item.id) }]}>
                <Text style={styles.pillAvatarText}>{getInitials(item.child_legal_name)}</Text>
              </View>
              <Text style={[styles.pillName, active && styles.pillNameActive]} numberOfLines={1}>
                {item.child_legal_name.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View />}
      />

      {/* Activity list + footer */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={visibleActivities}
          keyExtractor={(a) => a.id}
          ListHeaderComponent={AutoFillBanner}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: visibleActivities.length > 0 ? 120 : 40 },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              {children.length === 0 ? (
                <>
                  <Ionicons name="people-outline" size={40} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No children found</Text>
                </>
              ) : activities.length === 0 ? (
                <>
                  <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No activities yet</Text>
                  <Text style={styles.emptyBody}>Check back when activities are published.</Text>
                </>
              ) : (
                <>
                  <Ionicons name="options-outline" size={40} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No activities for your scheduled days</Text>
                  <Text style={styles.emptyBody}>
                    Activities are shown based on your paid enrollment dates.
                  </Text>
                </>
              )}
            </View>
          }
          renderItem={({ item: act }) => {
            const pref = preferences[selectedChildId ?? ""]?.[act.id] ?? { level: null, notes: "" };
            const foodsExpanded = expandedFoods.has(act.id);
            const showFoods = act.includes_food && act.activity_foods.length > 0;
            const isPreFilled = !savedActivityIds.has(act.id) && pref.level !== null;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.activityTitle, { flex: 1 }]}>{act.title}</Text>
                  {pref.level !== null && (
                    <View style={[styles.cardBadge, isPreFilled ? styles.cardBadgeDefault : styles.cardBadgeSaved]}>
                      <Text style={[styles.cardBadgeText, isPreFilled ? styles.cardBadgeTextDefault : styles.cardBadgeTextSaved]}>
                        {isPreFilled ? "⚡ Auto" : "✓ Saved"}
                      </Text>
                    </View>
                  )}
                </View>
                {act.description ? (
                  <Text style={styles.activityDesc}>{act.description}</Text>
                ) : null}
                {act.activity_date ? (
                  <Text style={styles.activityDate}>
                    {new Date(act.activity_date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                  </Text>
                ) : null}

                {/* Food section */}
                {showFoods && (
                  <View style={styles.foodSection}>
                    <TouchableOpacity
                      style={styles.foodToggle}
                      onPress={() => toggleFoods(act.id)}
                    >
                      <Text style={styles.foodToggleLabel}>
                        {foodsExpanded
                          ? "Hide food details"
                          : `${act.activity_foods.length} food item${act.activity_foods.length === 1 ? "" : "s"}`}
                      </Text>
                      <Ionicons
                        name={foodsExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#6b7280"
                      />
                    </TouchableOpacity>

                    {foodsExpanded &&
                      act.activity_foods.map((food) => (
                        <View key={food.id} style={styles.foodItem}>
                          <View style={styles.foodItemHeader}>
                            <Text style={styles.foodName}>{food.name}</Text>
                            {food.allergens ? (
                              <View style={styles.allergenBadge}>
                                <Text style={styles.allergenText}>{food.allergens}</Text>
                              </View>
                            ) : null}
                          </View>
                          {food.activity_ingredients.length > 0 && (
                            <Text style={styles.ingredients}>
                              {food.activity_ingredients.map((ig) => ig.name).join(", ")}
                            </Text>
                          )}
                        </View>
                      ))}
                  </View>
                )}

                {/* Participation level */}
                <View style={styles.levelSection}>
                  <Text style={styles.levelLabel}>Participation Preference</Text>
                  {LEVEL_OPTIONS.map((opt) => {
                    const selected = pref.level === opt.level;
                    return (
                      <TouchableOpacity
                        key={opt.level}
                        style={[styles.levelRow, selected && styles.levelRowActive]}
                        onPress={() =>
                          setPref(act.id, { level: selected ? null : opt.level })
                        }
                      >
                        <View style={[styles.radio, selected && styles.radioActive]}>
                          {selected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.levelEmoji}>{opt.emoji}</Text>
                        <Text
                          style={[styles.levelText, selected && styles.levelTextActive]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Notes */}
                {pref.level !== null && (
                  <TextInput
                    style={styles.notesInput}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholder="e.g. only eat one serving, bringing alternative ingredients: oat milk instead of dairy..."
                    placeholderTextColor="#9ca3af"
                    value={pref.notes}
                    onChangeText={(text) => setPref(act.id, { notes: text })}
                  />
                )}
              </View>
            );
          }}
        />

        {/* Save footer */}
        {visibleActivities.length > 0 && (
          <View style={styles.footer}>
            {saveStatus !== "idle" && (
              <Text
                style={[
                  styles.saveStatusText,
                  saveStatus === "saved" && styles.saveStatusSuccess,
                  saveStatus === "error" && styles.saveStatusError,
                ]}
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Preferences saved!"
                  : "Something went wrong. Please try again."}
              </Text>
            )}
            <TouchableOpacity
              style={styles.ackRow}
              onPress={() => setHasAcknowledged((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hasAcknowledged ? "checkbox" : "square-outline"}
                size={22}
                color={hasAcknowledged ? Brand.sage700 : "#9ca3af"}
              />
              <Text style={styles.ackText}>
                I have reviewed the ingredients and allergens listed above. I understand and acknowledge that Sage Field is not responsible for any allergic reactions, dietary sensitivities, or adverse responses related to food items consumed during activities.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (saveStatus === "saving" || !hasAcknowledged) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saveStatus === "saving" || !hasAcknowledged}
            >
              {saveStatus === "saving" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { width: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
  },

  skeletonWrap: { padding: 16, gap: 16 },
  skeletonCard: {
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
  },

  pillList: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: "#F2F7F3",
  },
  pillActive: { backgroundColor: Brand.sage700 },
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
  pillName: { fontFamily: FontFamilies.body, fontSize: 13, color: "#4b5563" },
  pillNameActive: { color: "#fff" },

  listContent: { padding: 16, gap: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 12,
  },
  activityTitle: { fontFamily: FontFamilies.heading, fontSize: 16, color: "#1f2937" },
  activityDesc: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  activityDate: { fontFamily: FontFamilies.body, fontSize: 12, color: Brand.sage700 },

  foodSection: { gap: 8 },
  foodToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  foodToggleLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  foodItem: { paddingLeft: 4, gap: 4 },
  foodItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  foodName: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#374151" },
  allergenBadge: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allergenText: { fontFamily: FontFamilies.body, fontSize: 11, color: "#92400e" },
  ingredients: { fontFamily: FontFamilies.body, fontSize: 12, color: "#6b7280" },

  levelSection: { gap: 8 },
  levelLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  levelRowActive: {
    borderColor: Brand.sage700,
    backgroundColor: `${Brand.sage700}18`,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: Brand.sage700 },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.sage700,
  },
  levelEmoji: { fontSize: 18 },
  levelText: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
  },
  levelTextActive: {
    color: "#1f2937",
    fontFamily: FontFamilies.bodySemiBold,
  },

  notesInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    minHeight: 80,
    color: "#1f2937",
  },

  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  saveStatusText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  saveStatusSuccess: { color: "#16a34a" },
  saveStatusError: { color: "#dc2626" },
  saveBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  saveBtnDisabled: { opacity: 0.6 },

  ackRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  ackText: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 18,
  },
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },

  empty: { alignItems: "center", paddingTop: 60, gap: 8, paddingHorizontal: 24 },
  emptyTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },

  // ─── Card header badge ────────────────────────────────────────────────────
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    marginTop: 2,
  },
  cardBadgeDefault: {
    backgroundColor: `${Brand.sage700}18`,
    borderWidth: 1,
    borderColor: `${Brand.sage700}40`,
  },
  cardBadgeSaved: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  cardBadgeText: {
    fontSize: 11,
    fontFamily: FontFamilies.bodySemiBold,
  },
  cardBadgeTextDefault: { color: Brand.sage700 },
  cardBadgeTextSaved: { color: "#16a34a" },

  // ─── AutoFill Banner ───────────────────────────────────────────────────────
  autoFillCard: {
    backgroundColor: "#f0f4f1",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1dbd4",
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  autoFillTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  autoFillDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  autoFillButtons: {
    flexDirection: "row",
    gap: 8,
  },
  autoFillBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 3,
  },
  autoFillBtnActive: {
    borderColor: Brand.sage700,
    backgroundColor: `${Brand.sage700}18`,
  },
  autoFillBtnEmoji: { fontSize: 16 },
  autoFillBtnText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#374151",
  },
  autoFillBtnTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  autoFillClearBtn: { alignSelf: "flex-start" },
  autoFillClearText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  autoFillStatus: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#16a34a",
  },
  autoFillStatusError: { color: "#dc2626" },

  defaultFillLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: Brand.sage700,
  },
});
