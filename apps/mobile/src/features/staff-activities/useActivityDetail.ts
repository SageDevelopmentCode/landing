// One activity for the detail + change-history screens, plus the students
// attending on its date (for the preferences sheet). Quiet reload on focus.
import { getActivity, type Activity } from "@/lib/activities-actions";
import { notifyError } from "@/lib/discord";
import { fetchSchoolYearTodayStudents } from "@/lib/school-year-today-students";
import { supabase } from "@/lib/supabase";
import type { PrefCount } from "./useStaffActivities";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";

export type AttendingStudent = { student_id: string; name: string | null; profile_image_url: string | null };

export function useActivityDetail(activityId: string | undefined, { withStudents = true } = {}) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [attending, setAttending] = useState<AttendingStudent[]>([]);
  const [prefs, setPrefs] = useState<PrefCount | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!activityId) return { ok: false };
    const my = ++seq.current;
    try {
      const found = await getActivity(activityId);
      if (my !== seq.current) return { ok: true };
      setActivity(found);
      setNotFound(!found);
      setError(false);
      if (withStudents && found?.status === "published") {
        const { data: rows } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .select("participation_level")
          .eq("activity_id", found.id);
        const c: PrefCount = { full: 0, nonFull: 0 };
        for (const r of (rows ?? []) as { participation_level: string }[]) {
          if (r.participation_level === "full") c.full++;
          else c.nonFull++;
        }
        if (my === seq.current) setPrefs(c);
      }
      if (withStudents) {
        if (found?.activity_date) {
          const rows = await fetchSchoolYearTodayStudents(found.activity_date);
          if (my === seq.current)
            setAttending(
              rows.map((s) => ({ student_id: s.student_id, name: s.name, profile_image_url: s.profile_image_url })),
            );
        } else {
          setAttending([]);
        }
      }
      return { ok: true };
    } catch (e) {
      if (my !== seq.current) return { ok: true };
      notifyError("staff-activity-detail-load", e);
      setError(true);
      return { ok: false };
    }
  }, [activityId, withStudents]);

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

  return { activity, attending, prefs, loading, error, notFound, reload: load };
}
