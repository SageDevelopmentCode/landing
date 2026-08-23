import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth, useReadOnlyPreview } from "@/contexts/AuthContext";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import {
  SchoolDayFoodPreferencesSheet,
  getEmergencySnackLabel,
  getSharedFoodLabel,
  type SchoolDayFoodPreference,
} from "@/components/SchoolDayFoodPreferencesSheet";
import { computePaidDates, SUMMER_FIRST_DATE, SUMMER_LAST_DATE, type TxRow } from "@/lib/compute-paid-dates";
import {
  LEVEL_OPTIONS,
  type ParticipationLevel,
} from "@/lib/activity-preferences";
import { persistStudentDefaultPreference } from "@/lib/default-preferences";
import {
  AutoFillPreferenceCard,
  LevelSegmentedControl,
} from "@/components/AutoFillPreferenceCard";

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
  cover_image_url: string | null;
  activity_foods: ActivityFood[];
};

type SavedPref = {
  student_id: string;
  activity_id: string;
  participation_level: "watch" | "cook_no_eat" | "full";
  notes: string;
};

type Pref = { level: ParticipationLevel | null; notes: string };
type AllPreferences = Record<string, Record<string, Pref>>;

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

function filterVisibleActivities(
  activities: Activity[],
  childId: string | null,
  paidDatesByStudent: Record<string, string[]>,
  today: string,
): Activity[] {
  if (!childId) return [];
  return activities.filter((a) => {
    if (a.activity_date && a.activity_date < today) return false;
    if (!a.activity_date) return true;
    if (a.activity_date < SUMMER_FIRST_DATE || a.activity_date > SUMMER_LAST_DATE) return true;
    return (paidDatesByStudent[childId] ?? []).includes(a.activity_date);
  });
}

function buildSnapshotForChild(
  childId: string,
  activityIds: string[],
  savedPrefs: SavedPref[],
): Record<string, Pref> {
  const snapshot: Record<string, Pref> = {};
  for (const actId of activityIds) {
    const saved = savedPrefs.find(
      (s) => s.student_id === childId && s.activity_id === actId,
    );
    snapshot[actId] = saved
      ? { level: saved.participation_level, notes: saved.notes ?? "" }
      : { level: null, notes: "" };
  }
  return snapshot;
}

function computeSavedActivityIds(
  childId: string,
  savedPrefs: SavedPref[],
  childDefault: ParticipationLevel | null,
): Set<string> {
  return new Set(
    savedPrefs
      .filter((p) => p.student_id === childId)
      .filter((p) => {
        if (!childDefault) return true;
        return !(p.participation_level === childDefault && !p.notes);
      })
      .map((p) => p.activity_id),
  );
}

async function signActivityCoverUrls(
  rows: { activity_images?: { id?: string; storage_path: string }[] }[],
): Promise<Record<string, string>> {
  const paths = [
    ...new Set(
      rows.flatMap((a) =>
        [...(a.activity_images ?? [])]
          .sort((x, y) => (x.id ?? "").localeCompare(y.id ?? ""))
          .map((img) => img.storage_path),
      ),
    ),
  ];
  if (paths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from("activity-images")
    .createSignedUrls(paths, 3600);

  if (error) {
    console.error("[prefs] activity cover signed URLs:", error.message);
    return {};
  }

  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
    else if (item.error) console.error("[prefs] activity cover sign failed:", item.path, item.error);
  });
  return map;
}

function sortActivitiesByDate(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    if (!a.activity_date && !b.activity_date) return 0;
    if (!a.activity_date) return 1;
    if (!b.activity_date) return -1;
    return a.activity_date.localeCompare(b.activity_date);
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PreferencesScreen() {
  const router = useRouter();
  const { userId, effectiveParentId } = useAuth();
  const isReadOnlyPreview = useReadOnlyPreview();

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [paidDatesByStudent, setPaidDatesByStudent] = useState<Record<string, string[]>>({});
  const [preferences, setPreferences] = useState<AllPreferences>({});
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string } | null>(null);

  const [defaults, setDefaults] = useState<StudentDefault[]>([]);
  const [defaultSaveStatus, setDefaultSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedActivityIds, setSavedActivityIds] = useState<Set<string>>(new Set());
  const [schoolDayFoodPrefs, setSchoolDayFoodPrefs] = useState<SchoolDayFoodPreference[]>([]);

  const savedPrefsRaw = useRef<SavedPref[]>([]);
  const savedSnapshot = useRef<Record<string, Pref>>({});
  const defaultSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foodSheetRef = useRef<BottomSheetModal>(null);
  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const initialFoodSheetOpened = useRef(false);

  const ALLERGEN_DISCLAIMER =
    "I have reviewed the ingredients and allergens listed above. I understand and acknowledge that Sage Field is not responsible for any allergic reactions, dietary sensitivities, or adverse responses related to food items consumed during activities.";

  const today = new Date().toISOString().slice(0, 10);

  const visibleActivities = useMemo(
    () =>
      sortActivitiesByDate(
        filterVisibleActivities(activities, selectedChildId, paidDatesByStudent, today),
      ),
    [activities, selectedChildId, paidDatesByStudent, today],
  );

  const currentDefault =
    defaults.find((d) => d.student_id === selectedChildId)?.participation_level ?? null;

  const selectedSchoolDayFoodPref = schoolDayFoodPrefs.find(
    (p) => p.student_id === selectedChildId,
  );

  function childNeedsSchoolDayFoodPrefs(childId: string) {
    return !schoolDayFoodPrefs.some((p) => p.student_id === childId);
  }

  function openFoodSheet() {
    foodSheetRef.current?.present();
  }

  function handleSchoolDayFoodSaved(pref: SchoolDayFoodPreference) {
    setSchoolDayFoodPrefs((prev) => {
      const without = prev.filter((p) => p.student_id !== pref.student_id);
      return [...without, pref];
    });
    foodSheetRef.current?.dismiss();
  }

  function selectChild(childId: string) {
    setSelectedChildId(childId);
    setAutoFillExpanded(false);
    setSaveStatus("idle");
    const childDefault =
      defaults.find((d) => d.student_id === childId)?.participation_level ?? null;
    setSavedActivityIds(
      computeSavedActivityIds(childId, savedPrefsRaw.current, childDefault),
    );
    savedSnapshot.current = buildSnapshotForChild(
      childId,
      filterVisibleActivities(activities, childId, paidDatesByStudent, today).map(
        (a) => a.id,
      ),
      savedPrefsRaw.current,
    );
    if (childNeedsSchoolDayFoodPrefs(childId)) {
      setTimeout(() => foodSheetRef.current?.present(), 100);
    }
  }

  const hasFoodActivities = visibleActivities.some(
    (a) => a.includes_food && a.activity_foods.length > 0,
  );

  const hasAnySelection = visibleActivities.some(
    (a) => preferences[selectedChildId ?? ""]?.[a.id]?.level != null,
  );

  const hasUnsavedChanges = visibleActivities.some((a) => {
    const current = preferences[selectedChildId ?? ""]?.[a.id];
    const saved = savedSnapshot.current[a.id];
    return (
      (current?.level ?? null) !== (saved?.level ?? null) ||
      (current?.notes ?? "") !== (saved?.notes ?? "")
    );
  });

  const canSave =
    hasUnsavedChanges && hasAnySelection && saveStatus !== "saving";

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

  const syncSnapshotForChild = useCallback(
    (childId: string) => {
      const acts = filterVisibleActivities(activities, childId, paidDatesByStudent, today);
      savedSnapshot.current = buildSnapshotForChild(
        childId,
        acts.map((a) => a.id),
        savedPrefsRaw.current,
      );
    },
    [activities, paidDatesByStudent, today],
  );

  useEffect(() => {
    if (selectedChildId) syncSnapshotForChild(selectedChildId);
  }, [selectedChildId, syncSnapshotForChild]);

  const loadData = useCallback(async () => {
    if (!effectiveParentId || !userId) return;
    try {
      const [studentsRes, txRes, activitiesRes, prefsRes, profileRes, defaultsRes, schoolDayFoodRes] = await Promise.all([
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
            activity_images ( id, storage_path ),
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

        supabase
          .schema("parent_app")
          .from("student_school_day_food_preferences")
          .select("student_id, emergency_snack_preference, shared_food_preference")
          .eq("parent_id", effectiveParentId),
      ]);

      if (studentsRes.error) console.error("[prefs] students:", studentsRes.error.message);
      if (txRes.error) console.error("[prefs] transactions:", txRes.error.message);
      if (activitiesRes.error) console.error("[prefs] activities:", activitiesRes.error.message);
      if (prefsRes.error) console.error("[prefs] preferences:", prefsRes.error.message);
      if (profileRes.error) console.error("[prefs] profile:", profileRes.error.message);
      if (defaultsRes.error) console.error("[prefs] defaults:", defaultsRes.error.message);
      if (schoolDayFoodRes.error) console.error("[prefs] school day food:", schoolDayFoodRes.error.message);

      const kidsData: Child[] = (studentsRes.data ?? []).filter((c: any) => c.id);

      const rawActivities = activitiesRes.data ?? [];
      const coverUrlMap = await signActivityCoverUrls(rawActivities);

      const activitiesData: Activity[] = rawActivities.map((a: any) => {
        const firstImage = [...(a.activity_images ?? [])].sort((x: any, y: any) =>
          String(x.id ?? "").localeCompare(String(y.id ?? "")),
        )[0];
        return {
          id: a.id,
          title: a.title,
          description: a.description ?? null,
          includes_food: a.includes_food,
          activity_date: a.activity_date ?? null,
          cover_image_url: firstImage
            ? coverUrlMap[firstImage.storage_path] ?? null
            : null,
          activity_foods: (a.activity_foods ?? [])
            .sort((x: any, y: any) => x.sort_order - y.sort_order)
            .map((f: any) => ({
              id: f.id,
              name: f.name,
              sort_order: f.sort_order,
              allergens: f.allergens ?? null,
              activity_ingredients: (f.activity_ingredients ?? []).sort(
                (x: any, y: any) => x.sort_order - y.sort_order,
              ),
            })),
        };
      });

      const savedPrefs: SavedPref[] = (prefsRes.data ?? []) as SavedPref[];
      savedPrefsRaw.current = savedPrefs;

      const fetchedDefaults: StudentDefault[] = (defaultsRes.data ?? []) as StudentDefault[];
      const paidDates = computePaidDates((txRes.data ?? []) as TxRow[]);

      setChildren(kidsData);
      setActivities(activitiesData);
      setPaidDatesByStudent(paidDates);
      setDefaults(fetchedDefaults);
      setSchoolDayFoodPrefs((schoolDayFoodRes.data ?? []) as SchoolDayFoodPreference[]);
      if (profileRes.data) setUserProfile(profileRes.data as any);

      const initPrefs: AllPreferences = {};
      for (const child of kidsData) {
        initPrefs[child.id] = {};
        const childDefault =
          fetchedDefaults.find((d) => d.student_id === child.id)?.participation_level ?? null;
        for (const act of activitiesData) {
          const saved = savedPrefs.find(
            (s) => s.student_id === child.id && s.activity_id === act.id,
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
        const firstChildDefault =
          fetchedDefaults.find((d) => d.student_id === firstId)?.participation_level ?? null;
        setSelectedChildId(firstId);
        setSavedActivityIds(
          computeSavedActivityIds(firstId, savedPrefs, firstChildDefault),
        );
      }
    } catch (err) {
      console.error("[prefs] loadData error:", err);
      notifyError("preferences-load", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (loading || !selectedChildId || initialFoodSheetOpened.current) return;
    initialFoodSheetOpened.current = true;
    if (childNeedsSchoolDayFoodPrefs(selectedChildId)) {
      setTimeout(() => foodSheetRef.current?.present(), 350);
    }
  }, [loading, selectedChildId, schoolDayFoodPrefs]);

  useEffect(() => {
    return () => {
      if (defaultSaveTimer.current) clearTimeout(defaultSaveTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const setPref = (activityId: string, update: Partial<Pref>) => {
    if (!selectedChildId) return;
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
    if (saveStatus === "saved" || saveStatus === "error") {
      setSaveStatus("idle");
    }
  };

  const handleSetDefault = async (level: ParticipationLevel | null) => {
    if (isReadOnlyPreview) return;
    if (!selectedChildId || !effectiveParentId) return;
    setDefaultSaveStatus("saving");

    setDefaults((prev) => {
      const without = prev.filter((d) => d.student_id !== selectedChildId);
      return level !== null
        ? [...without, { student_id: selectedChildId, participation_level: level }]
        : without;
    });

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

    if (saveStatus === "saved") setSaveStatus("idle");

    try {
      const result = await persistStudentDefaultPreference({
        parentId: effectiveParentId,
        studentId: selectedChildId,
        level,
        notify: userProfile
          ? {
              parentName: userProfile.full_name,
              parentEmail: userProfile.email,
              childName:
                children.find((c) => c.id === selectedChildId)?.child_legal_name ??
                "Unknown",
            }
          : undefined,
      });
      if (result.error) throw new Error(result.error);

      setDefaultSaveStatus("saved");
      if (defaultSaveTimer.current) clearTimeout(defaultSaveTimer.current);
      defaultSaveTimer.current = setTimeout(() => setDefaultSaveStatus("idle"), 2500);
    } catch (err) {
      notifyError("default-preference-save", err);
      setDefaultSaveStatus("error");
    }
  };

  const handleSave = async () => {
    if (isReadOnlyPreview) return;
    if (!selectedChildId || !effectiveParentId) return;
    if (saveStatus === "saving") return;
    if (!hasUnsavedChanges || !hasAnySelection) return;

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
          participation_level: e.level!,
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

      for (const u of toUpsert) {
        const idx = savedPrefsRaw.current.findIndex(
          (p) => p.student_id === selectedChildId && p.activity_id === u.activity_id,
        );
        const entry: SavedPref = {
          student_id: selectedChildId,
          activity_id: u.activity_id,
          participation_level: u.participation_level,
          notes: u.notes ?? "",
        };
        if (idx >= 0) savedPrefsRaw.current[idx] = entry;
        else savedPrefsRaw.current.push(entry);
      }
      savedPrefsRaw.current = savedPrefsRaw.current.filter(
        (p) =>
          !(
            p.student_id === selectedChildId &&
            toDeleteIds.includes(p.activity_id)
          ),
      );

      for (const act of visibleActivities) {
        const pref = childPrefs[act.id];
        savedSnapshot.current[act.id] = {
          level: pref?.level ?? null,
          notes: pref?.notes ?? "",
        };
      }

      setSavedActivityIds((prev) => {
        const next = new Set(prev);
        toUpsert.forEach((u) => next.add(u.activity_id));
        toDeleteIds.forEach((id) => next.delete(id));
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

      confirmSheetRef.current?.dismiss();
      setSaveStatus("saved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      notifyError("preferences-save", err);
      setSaveStatus("error");
    }
  };

  const handleSavePress = () => {
    if (isReadOnlyPreview) return;
    if (!canSave) return;
    if (hasFoodActivities) {
      confirmSheetRef.current?.present();
    } else {
      handleSave();
    }
  };

  const handleConfirmSave = () => {
    confirmSheetRef.current?.dismiss();
    handleSave();
  };

  const toggleFoods = (activityId: string) => {
    setExpandedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const selectedChildName =
    children.find((c) => c.id === selectedChildId)?.child_legal_name.split(" ")[0] ?? "your child";

  const autoFillBanner = visibleActivities.length > 0 ? (
    <AutoFillPreferenceCard
      childName={selectedChildName}
      currentDefault={currentDefault}
      saveStatus={defaultSaveStatus}
      onSetDefault={(level) => void handleSetDefault(level)}
      disabled={isReadOnlyPreview}
    />
  ) : null;

  const ListHeader = (
    <View style={styles.listHeader}>
      {selectedChildId && childNeedsSchoolDayFoodPrefs(selectedChildId) ? (
        <View style={styles.actionNeededCard}>
          <View style={styles.actionNeededBadge}>
            <Text style={styles.actionNeededBadgeText}>Action Needed</Text>
          </View>
          <TouchableOpacity
            style={styles.actionNeededRow}
            onPress={openFoodSheet}
            activeOpacity={0.8}
          >
            <Text style={styles.actionNeededEmoji}>🍎</Text>
            <View style={styles.actionNeededCopy}>
              <Text style={styles.actionNeededTitle}>School Day Food Preferences</Text>
              <Text style={styles.actionNeededBody}>
                Please tell us how to handle backup snacks and food shared by families
                during the school day. This is a new form, separate from activity cooking
                preferences below.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d97706" />
          </TouchableOpacity>
        </View>
      ) : null}

      {selectedSchoolDayFoodPref ? (
        <View style={styles.schoolFoodSummary}>
          <View style={styles.schoolFoodSummaryHeader}>
            <View style={styles.schoolFoodSummaryTitleRow}>
              <View style={styles.schoolFoodIconWrap}>
                <Ionicons name="restaurant-outline" size={16} color="#b45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolFoodSummaryTitle}>School Day Food Preferences</Text>
                <Text style={styles.schoolFoodSummarySubtitle}>
                  Saved to your child&apos;s profile for daily food offerings
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={openFoodSheet} style={styles.updateBtn} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={14} color={Brand.sage700} />
              <Text style={styles.updateBtnText}>Update</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.schoolFoodSummaryBlock}>
            <Text style={styles.schoolFoodSummaryLabel}>Emergency / backup snacks</Text>
            <Text style={styles.schoolFoodSummaryValue}>
              {getEmergencySnackLabel(selectedSchoolDayFoodPref.emergency_snack_preference)}
            </Text>
          </View>
          <View style={styles.schoolFoodSummaryBlock}>
            <Text style={styles.schoolFoodSummaryLabel}>Shared / gifted foods</Text>
            <Text style={styles.schoolFoodSummaryValue}>
              {getSharedFoodLabel(selectedSchoolDayFoodPref.shared_food_preference)}
            </Text>
          </View>
        </View>
      ) : null}

      {autoFillBanner}
    </View>
  );

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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
              onPress={() => selectChild(item.id)}
            >
              <View style={[styles.pillAvatar, { backgroundColor: avatarColor(item.id) }]}>
                <Text style={styles.pillAvatarText}>{getInitials(item.child_legal_name)}</Text>
              </View>
              <Text style={[styles.pillName, active && styles.pillNameActive]} numberOfLines={1}>
                {item.child_legal_name.split(" ")[0]}
              </Text>
              {childNeedsSchoolDayFoodPrefs(item.id) ? (
                <View style={styles.pillDot} />
              ) : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View />}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={visibleActivities}
          keyExtractor={(a) => a.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: visibleActivities.length > 0 ? 140 : Spacing.four },
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
            const selectedOption = LEVEL_OPTIONS.find((o) => o.level === pref.level);

            return (
              <View style={styles.card}>
                {act.cover_image_url ? (
                  <Image
                    source={{ uri: act.cover_image_url }}
                    style={styles.cardCover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.cardCover, styles.cardCoverPlaceholder]}>
                    <Ionicons name="ribbon-outline" size={28} color="#d1d5db" />
                  </View>
                )}

                <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.activityTitle}>{act.title}</Text>
                    {act.activity_date ? (
                      <Text style={styles.activityDate}>
                        {new Date(act.activity_date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.cardBadge,
                      pref.level === null
                        ? styles.cardBadgeUnset
                        : isPreFilled
                          ? styles.cardBadgeDefault
                          : styles.cardBadgeSaved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardBadgeText,
                        pref.level === null
                          ? styles.cardBadgeTextUnset
                          : isPreFilled
                            ? styles.cardBadgeTextDefault
                            : styles.cardBadgeTextSaved,
                      ]}
                    >
                      {pref.level === null ? "Not set" : isPreFilled ? "Pre-filled" : "Saved"}
                    </Text>
                  </View>
                </View>

                {act.description ? (
                  <Text style={styles.activityDesc}>{act.description}</Text>
                ) : null}

                {showFoods && (
                  <View style={styles.foodSection}>
                    <TouchableOpacity
                      style={styles.foodToggle}
                      onPress={() => toggleFoods(act.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="restaurant-outline" size={15} color={Brand.sage700} />
                      <Text style={styles.foodToggleLabel}>
                        {foodsExpanded
                          ? "Hide ingredients"
                          : `${act.activity_foods.length} food item${act.activity_foods.length === 1 ? "" : "s"}`}
                      </Text>
                      <Ionicons
                        name={foodsExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#6b7280"
                        style={{ marginLeft: "auto" }}
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

                <View style={styles.levelSection}>
                  <Text style={styles.levelLabel}>Participation</Text>
                  <LevelSegmentedControl
                    value={pref.level}
                    onChange={(level) => setPref(act.id, { level })}
                  />
                  {selectedOption ? (
                    <Text style={styles.levelSubtitle}>{selectedOption.label}</Text>
                  ) : null}
                </View>

                {pref.level !== null && (
                  <TextInput
                    style={styles.notesInput}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholder="Optional notes (e.g. oat milk instead of dairy)"
                    placeholderTextColor="#9ca3af"
                    value={pref.notes}
                    onChangeText={(text) => setPref(act.id, { notes: text })}
                  />
                )}
                </View>
              </View>
            );
          }}
        />

        {visibleActivities.length > 0 && (
          <View style={styles.footer}>
            {saveStatus === "error" ? (
              <Text style={styles.saveErrorText}>Something went wrong. Please try again.</Text>
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
                  {saveStatus === "saved" ? "Saved ✓" : "Save Preferences"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <SchoolDayFoodPreferencesSheet
        ref={foodSheetRef}
        studentId={selectedChildId}
        studentName={
          children.find((c) => c.id === selectedChildId)?.child_legal_name ?? ""
        }
        initialPrefs={selectedSchoolDayFoodPref ?? null}
        effectiveParentId={effectiveParentId}
        userProfile={userProfile}
        readOnly={isReadOnlyPreview}
        onSaved={handleSchoolDayFoodSaved}
      />

      <BottomSheetModal
        ref={confirmSheetRef}
        snapPoints={["45%"]}
        enablePanDownToClose
        backdropComponent={renderConfirmBackdrop}
      >
        <BottomSheetView style={styles.confirmSheet}>
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
              onPress={handleConfirmSave}
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
        </BottomSheetView>
      </BottomSheetModal>
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
    paddingHorizontal: Spacing.three,
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

  skeletonWrap: { padding: Spacing.three, gap: Spacing.three },
  skeletonCard: {
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: Spacing.three,
  },

  pillList: { paddingHorizontal: Spacing.three, paddingVertical: 12, gap: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: 14,
    paddingVertical: Spacing.two,
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
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },

  listHeader: { gap: 16, marginBottom: 4 },
  actionNeededCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    padding: 14,
    gap: 10,
  },
  actionNeededBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f59e0b",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  actionNeededBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  actionNeededRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "rgba(254, 243, 199, 0.6)",
    padding: 12,
  },
  actionNeededEmoji: { fontSize: 20 },
  actionNeededCopy: { flex: 1, gap: 4 },
  actionNeededTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#78350f",
  },
  actionNeededBody: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 17,
  },
  schoolFoodSummary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 12,
  },
  schoolFoodSummaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  schoolFoodSummaryTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  schoolFoodIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fffbeb",
    alignItems: "center",
    justifyContent: "center",
  },
  schoolFoodSummaryTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  schoolFoodSummarySubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  updateBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  schoolFoodSummaryBlock: { gap: 4 },
  schoolFoodSummaryLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  schoolFoodSummaryValue: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 17,
  },

  listContent: { padding: Spacing.three, gap: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardCover: {
    width: "100%",
    height: 120,
  },
  cardCoverPlaceholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: Spacing.three,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  cardHeaderText: { flex: 1, gap: 4 },
  activityTitle: { fontFamily: FontFamilies.heading, fontSize: 16, color: "#1f2937" },
  activityDesc: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280", lineHeight: 19 },
  activityDate: { fontFamily: FontFamilies.body, fontSize: 12, color: Brand.sage700 },

  foodSection: { gap: Spacing.two },
  foodToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
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
    gap: Spacing.two,
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
  ingredients: { fontFamily: FontFamilies.body, fontSize: 12, color: "#6b7280", lineHeight: 18 },

  levelSection: { gap: Spacing.two },
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
    gap: Spacing.two,
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

  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 10,
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
    gap: Spacing.two,
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
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },

  empty: { alignItems: "center", paddingTop: 60, gap: Spacing.two, paddingHorizontal: Spacing.four },
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

  cardBadge: {
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    flexShrink: 0,
  },
  cardBadgeUnset: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardBadgeDefault: {
    backgroundColor: `${Brand.sage700}14`,
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
  cardBadgeTextUnset: { color: "#6b7280" },
  cardBadgeTextDefault: { color: Brand.sage700 },
  cardBadgeTextSaved: { color: "#16a34a" },

  autoFillCard: {
    backgroundColor: "#f0f4f1",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1dbd4",
    padding: Spacing.three,
    gap: 12,
    marginBottom: 4,
  },
  autoFillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  autoFillHeaderText: {
    flex: 1,
    gap: 4,
  },
  autoFillQuestion: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  autoFillCollapsedSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  autoFillTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  autoFillDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  autoFillClearBtn: { alignSelf: "flex-start" },
  autoFillClearText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  autoFillStatus: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#16a34a",
  },
  autoFillStatusError: { color: "#dc2626" },
});
