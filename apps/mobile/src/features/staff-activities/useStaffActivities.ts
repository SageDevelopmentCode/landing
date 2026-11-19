// Staff Activities list: all activities a teacher can see (their own in any
// state + everyone's published/public ones), the Published / Drafts filter,
// family preference counts, and delete. Reloads quietly on focus so edits
// made in the form show up right away. Writes return { ok }.
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { deleteActivity, getActivities, type Activity } from "@/lib/activities-actions";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Filter = "all" | "published" | "drafts";
export type PrefCount = { full: number; nonFull: number };
export type Result = { ok: boolean; error?: string };

export function useStaffActivities() {
  const router = useRouter();
  const role = useStaffRole();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [prefCounts, setPrefCounts] = useState<Record<string, PrefCount>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const seq = useRef(0);

  const load = useCallback(async (): Promise<Result> => {
    const my = ++seq.current;
    try {
      const data = await getActivities();
      if (my !== seq.current) return { ok: true };
      setActivities(data);
      setError(false);
      const ids = data.filter((a) => a.status === "published").map((a) => a.id);
      if (ids.length) {
        const { data: rows, error: prefErr } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .select("activity_id, participation_level")
          .in("activity_id", ids);
        if (prefErr) notifyError("staff-activities-pref-counts", prefErr);
        const counts: Record<string, PrefCount> = {};
        for (const r of (rows ?? []) as { activity_id: string; participation_level: string }[]) {
          counts[r.activity_id] ??= { full: 0, nonFull: 0 };
          if (r.participation_level === "full") counts[r.activity_id].full++;
          else counts[r.activity_id].nonFull++;
        }
        if (my === seq.current) setPrefCounts(counts);
      }
      return { ok: true };
    } catch (e) {
      if (my !== seq.current) return { ok: true };
      notifyError("staff-activities-load", e);
      setError(true);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to load activities" };
    }
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) void loadRef.current();
      focused.current = true;
    }, []),
  );

  const canManage = useCallback((a: Activity) => role.isOwner(a.created_by), [role]);

  const remove = useCallback(
    async (a: Activity): Promise<Result> => {
      if (!canManage(a)) return { ok: false, error: "You can only delete activities you created." };
      setDeleting((d) => ({ ...d, [a.id]: true }));
      try {
        await deleteActivity(a.id);
        setActivities((prev) => prev.filter((x) => x.id !== a.id));
        return { ok: true };
      } catch (e) {
        notifyError("staff-activity-delete", e);
        return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
      } finally {
        setDeleting(({ [a.id]: _, ...rest }) => rest);
      }
    },
    [canManage],
  );

  const filtered = useMemo(
    () =>
      activities.filter((a) =>
        filter === "published" ? a.status === "published" : filter === "drafts" ? a.status === "draft" : true,
      ),
    [activities, filter],
  );
  const counts = useMemo(
    () => ({
      all: activities.length,
      published: activities.filter((a) => a.status === "published").length,
      drafts: activities.filter((a) => a.status === "draft").length,
    }),
    [activities],
  );

  return {
    router,
    role,
    activities,
    filtered,
    counts,
    filter,
    setFilter,
    prefCounts,
    loading,
    error,
    reload: load,
    canManage,
    remove,
    deleting,
    openDetail: (a: Activity) =>
      router.push({ pathname: "/(staff)/activities/[activityId]" as never, params: { activityId: a.id } }),
    openEdit: (a: Activity) =>
      router.push({ pathname: "/(staff)/activities/form" as never, params: { activityId: a.id } }),
    openCreate: () => router.push("/(staff)/activities/form" as never),
  };
}

export type StaffActivities = ReturnType<typeof useStaffActivities>;
