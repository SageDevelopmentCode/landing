// Data + handlers for the parent Activity Preferences screen. Queries, upserts,
// deletes, Discord payloads and error tags are ported unchanged from the old
// screen. Changes: "today" is the local date (it was UTC), the missing
// setAutoFillExpanded call that crashed child switching is gone, the saved
// snapshot is derived instead of kept in a ref, and writes return { ok }.
import { useAuth, useReadOnlyPreview } from "@/contexts/AuthContext";
import {
  type ParticipationLevel,
} from "@/lib/activity-preferences";
import {
  computePaidDates,
  SUMMER_FIRST_DATE,
  SUMMER_LAST_DATE,
  type TxRow,
} from "@/lib/compute-paid-dates";
import { persistStudentDefaultPreference } from "@/lib/default-preferences";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type {
  EmergencySnackPreference,
  SchoolDayFoodPreference,
  SharedFoodPreference,
} from "@/components/SchoolDayFoodPreferencesSheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Result = { ok: boolean; error?: string };
export type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Child = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
};

type ActivityIngredient = { id: string; name: string; sort_order: number };

export type ActivityFood = {
  id: string;
  name: string;
  sort_order: number;
  allergens: string | null;
  activity_ingredients: ActivityIngredient[];
};

export type Activity = {
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

export type Pref = { level: ParticipationLevel | null; notes: string };
type AllPreferences = Record<string, Record<string, Pref>>;

type StudentDefault = { student_id: string; participation_level: ParticipationLevel };

const EMPTY_PREF: Pref = { level: null, notes: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Local calendar date as YYYY-MM-DD (toISOString() is UTC and rolls over early in US evenings). */
function localYMD(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
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
    const saved = savedPrefs.find((s) => s.student_id === childId && s.activity_id === actId);
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

function differs(current: Pref | undefined, saved: Pref | undefined) {
  return (
    (current?.level ?? null) !== (saved?.level ?? null) ||
    (current?.notes ?? "") !== (saved?.notes ?? "")
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useActivityPreferences() {
  const { userId, effectiveParentId } = useAuth();
  const isReadOnlyPreview = useReadOnlyPreview();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [paidDatesByStudent, setPaidDatesByStudent] = useState<Record<string, string[]>>({});
  const [preferences, setPreferences] = useState<AllPreferences>({});
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string } | null>(null);

  const [defaults, setDefaults] = useState<StudentDefault[]>([]);
  const [defaultSaveStatus, setDefaultSaveStatus] = useState<SaveStatus>("idle");
  const [savedActivityIds, setSavedActivityIds] = useState<Set<string>>(new Set());
  const [schoolDayFoodPrefs, setSchoolDayFoodPrefs] = useState<SchoolDayFoodPreference[]>([]);
  const [savedPrefs, setSavedPrefs] = useState<SavedPref[]>([]);

  const defaultSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [today] = useState(() => localYMD());

  const visibleFor = useCallback(
    (childId: string | null) =>
      sortActivitiesByDate(filterVisibleActivities(activities, childId, paidDatesByStudent, today)),
    [activities, paidDatesByStudent, today],
  );

  const visibleActivities = useMemo(() => visibleFor(selectedChildId), [visibleFor, selectedChildId]);

  const snapshot = useMemo(
    () =>
      selectedChildId
        ? buildSnapshotForChild(selectedChildId, visibleActivities.map((a) => a.id), savedPrefs)
        : {},
    [selectedChildId, visibleActivities, savedPrefs],
  );

  const currentDefault =
    defaults.find((d) => d.student_id === selectedChildId)?.participation_level ?? null;

  const selectedSchoolDayFoodPref = schoolDayFoodPrefs.find((p) => p.student_id === selectedChildId);

  const childNeedsSchoolDayFoodPrefs = useCallback(
    (childId: string) => !schoolDayFoodPrefs.some((p) => p.student_id === childId),
    [schoolDayFoodPrefs],
  );

  const prefFor = useCallback(
    (activityId: string): Pref => preferences[selectedChildId ?? ""]?.[activityId] ?? EMPTY_PREF,
    [preferences, selectedChildId],
  );

  const snapshotFor = useCallback((activityId: string): Pref => snapshot[activityId] ?? EMPTY_PREF, [snapshot]);

  const hasFoodActivities = visibleActivities.some((a) => a.includes_food && a.activity_foods.length > 0);

  const hasAnySelection = visibleActivities.some(
    (a) => preferences[selectedChildId ?? ""]?.[a.id]?.level != null,
  );

  const unsavedCount = visibleActivities.filter((a) =>
    differs(preferences[selectedChildId ?? ""]?.[a.id], snapshot[a.id]),
  ).length;
  const hasUnsavedChanges = unsavedCount > 0;

  const canSave = hasUnsavedChanges && hasAnySelection && saveStatus !== "saving";

  const setCount = visibleActivities.filter(
    (a) => preferences[selectedChildId ?? ""]?.[a.id]?.level != null,
  ).length;

  /** Children (other than none) with edits that aren't saved yet. */
  const unsavedByChild = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const child of children) {
      const acts = visibleFor(child.id);
      const snap = buildSnapshotForChild(child.id, acts.map((a) => a.id), savedPrefs);
      out[child.id] = acts.some((a) => differs(preferences[child.id]?.[a.id], snap[a.id]));
    }
    return out;
  }, [children, visibleFor, savedPrefs, preferences]);

  const selectChild = useCallback(
    (childId: string) => {
      setSelectedChildId(childId);
      setSaveStatus("idle");
      const childDefault = defaults.find((d) => d.student_id === childId)?.participation_level ?? null;
      setSavedActivityIds(computeSavedActivityIds(childId, savedPrefs, childDefault));
      return { needsFoodPrefs: childNeedsSchoolDayFoodPrefs(childId) };
    },
    [defaults, savedPrefs, childNeedsSchoolDayFoodPrefs],
  );

  const loadData = useCallback(async (): Promise<Result> => {
    if (!effectiveParentId || !userId) return { ok: true };
    try {
      const [studentsRes, txRes, activitiesRes, prefsRes, profileRes, defaultsRes, schoolDayFoodRes] =
        await Promise.all([
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

          supabase.schema("admin").from("users").select("full_name, email").eq("id", userId).single(),

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
          cover_image_url: firstImage ? coverUrlMap[firstImage.storage_path] ?? null : null,
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

      const fetchedSavedPrefs: SavedPref[] = (prefsRes.data ?? []) as SavedPref[];
      const fetchedDefaults: StudentDefault[] = (defaultsRes.data ?? []) as StudentDefault[];
      const paidDates = computePaidDates((txRes.data ?? []) as TxRow[]);

      setSavedPrefs(fetchedSavedPrefs);
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
          const saved = fetchedSavedPrefs.find(
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
        setSavedActivityIds(computeSavedActivityIds(firstId, fetchedSavedPrefs, firstChildDefault));
      }

      // The screen can't work without children or activities: surface that.
      const fatal = studentsRes.error ?? activitiesRes.error;
      if (fatal) {
        setLoadError(fatal.message);
        return { ok: false, error: fatal.message };
      }
      setLoadError(null);
      return { ok: true };
    } catch (err) {
      console.error("[prefs] loadData error:", err);
      notifyError("preferences-load", err);
      const message = err instanceof Error ? err.message : String(err);
      setLoadError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId, userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (defaultSaveTimer.current) clearTimeout(defaultSaveTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const setPref = useCallback(
    (activityId: string, update: Partial<Pref>) => {
      if (!selectedChildId) return;
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
      setSaveStatus((s) => (s === "saved" || s === "error" ? "idle" : s));
    },
    [selectedChildId],
  );

  const setDefault = useCallback(
    async (level: ParticipationLevel | null): Promise<Result> => {
      if (isReadOnlyPreview) return { ok: false, error: "read-only" };
      if (!selectedChildId || !effectiveParentId) return { ok: false };
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

      setSaveStatus((s) => (s === "saved" ? "idle" : s));

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
                  children.find((c) => c.id === selectedChildId)?.child_legal_name ?? "Unknown",
              }
            : undefined,
        });
        if (result.error) throw new Error(result.error);

        setDefaultSaveStatus("saved");
        if (defaultSaveTimer.current) clearTimeout(defaultSaveTimer.current);
        defaultSaveTimer.current = setTimeout(() => setDefaultSaveStatus("idle"), 2500);
        return { ok: true };
      } catch (err) {
        notifyError("default-preference-save", err);
        setDefaultSaveStatus("error");
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    [
      isReadOnlyPreview,
      selectedChildId,
      effectiveParentId,
      visibleActivities,
      savedActivityIds,
      userProfile,
      children,
    ],
  );

  const save = useCallback(async (): Promise<Result> => {
    if (isReadOnlyPreview) return { ok: false, error: "read-only" };
    if (!selectedChildId || !effectiveParentId) return { ok: false };
    if (saveStatus === "saving") return { ok: false };
    if (!hasUnsavedChanges || !hasAnySelection) return { ok: false };

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

      setSavedPrefs((prev) => {
        const next = [...prev];
        for (const u of toUpsert) {
          const idx = next.findIndex(
            (p) => p.student_id === selectedChildId && p.activity_id === u.activity_id,
          );
          const entry: SavedPref = {
            student_id: selectedChildId,
            activity_id: u.activity_id,
            participation_level: u.participation_level,
            notes: u.notes ?? "",
          };
          if (idx >= 0) next[idx] = entry;
          else next.push(entry);
        }
        return next.filter(
          (p) => !(p.student_id === selectedChildId && toDeleteIds.includes(p.activity_id)),
        );
      });

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

      setSaveStatus("saved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
      return { ok: true };
    } catch (err) {
      notifyError("preferences-save", err);
      setSaveStatus("error");
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [
    isReadOnlyPreview,
    selectedChildId,
    effectiveParentId,
    saveStatus,
    hasUnsavedChanges,
    hasAnySelection,
    preferences,
    visibleActivities,
    userProfile,
    children,
    activities,
  ]);

  const toggleFoods = useCallback((activityId: string) => {
    setExpandedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  }, []);

  /** Ported from SchoolDayFoodPreferencesSheet.handleSave (same upsert, Discord, error tag). */
  const saveSchoolDayFood = useCallback(
    async (
      studentId: string,
      studentName: string,
      emergencySnack: EmergencySnackPreference,
      sharedFood: SharedFoodPreference,
    ): Promise<Result> => {
      if (isReadOnlyPreview || !effectiveParentId) return { ok: false, error: "read-only" };
      try {
        const { error: upsertError } = await supabase
          .schema("parent_app")
          .from("student_school_day_food_preferences")
          .upsert(
            {
              parent_id: effectiveParentId,
              student_id: studentId,
              emergency_snack_preference: emergencySnack,
              shared_food_preference: sharedFood,
            },
            { onConflict: "parent_id,student_id" },
          );

        if (upsertError) throw upsertError;

        const saved: SchoolDayFoodPreference = {
          student_id: studentId,
          emergency_snack_preference: emergencySnack,
          shared_food_preference: sharedFood,
        };

        if (userProfile) {
          notifyDiscord({
            type: "school_day_food_preferences_saved",
            data: {
              parentName: userProfile.full_name,
              parentEmail: userProfile.email,
              childName: studentName,
              emergencySnack,
              sharedFood,
            },
          });
        }

        setSchoolDayFoodPrefs((prev) => {
          const without = prev.filter((p) => p.student_id !== saved.student_id);
          return [...without, saved];
        });
        return { ok: true };
      } catch (err) {
        notifyError("school-day-food-prefs-save", err);
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        };
      }
    },
    [isReadOnlyPreview, effectiveParentId, userProfile],
  );

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;
  const selectedChildFirstName = selectedChild?.child_legal_name.split(" ")[0] ?? "your child";

  return {
    loading,
    loadError,
    retryLoad: loadData,
    isReadOnlyPreview,
    children,
    activitiesCount: activities.length,
    selectedChildId,
    selectedChild,
    selectedChildFirstName,
    selectChild,
    visibleActivities,
    prefFor,
    snapshotFor,
    savedActivityIds,
    currentDefault,
    setPref,
    expandedFoods,
    toggleFoods,
    saveStatus,
    defaultSaveStatus,
    hasFoodActivities,
    hasAnySelection,
    hasUnsavedChanges,
    unsavedCount,
    unsavedByChild,
    canSave,
    setCount,
    setDefault,
    save,
    childNeedsSchoolDayFoodPrefs,
    selectedSchoolDayFoodPref,
    saveSchoolDayFood,
  };
}

export type ActivityPreferences = ReturnType<typeof useActivityPreferences>;
