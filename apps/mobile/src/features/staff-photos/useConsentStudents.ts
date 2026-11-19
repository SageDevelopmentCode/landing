// Enrolled students + their photo-release consent, for tagging. Loads when
// `enabled` turns on; reports errors so the form can offer Retry instead of
// showing an empty list (an empty list would hide consent warnings).
import { notifyError } from "@/lib/discord";
import { getEnrolledStudentsWithConsent, type StudentWithConsent } from "@/lib/photos-actions";
import { useCallback, useEffect, useRef, useState } from "react";

export function useConsentStudents(enabled: boolean) {
  const [students, setStudents] = useState<StudentWithConsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loaded = useRef(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    setError(false);
    try {
      const rows = await getEnrolledStudentsWithConsent();
      if (my !== seq.current) return { ok: true };
      setStudents(rows);
      loaded.current = true;
      return { ok: true };
    } catch (e) {
      if (my !== seq.current) return { ok: true };
      notifyError("staff-photo-students", e);
      setError(true);
      return { ok: false };
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !loaded.current) void load();
  }, [enabled, load]);

  return { students, loading, error, retry: load };
}
