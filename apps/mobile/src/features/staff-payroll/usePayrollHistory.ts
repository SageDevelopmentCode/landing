// Staff Pay History data. Same query as before; adds a sequence guard, quiet
// focus reloads, and an error state (it used to fail silently to "No paystubs").
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import type { Paystub } from "./payrollUtils";
import type { LoadResult } from "./usePayroll";

export function usePayrollHistory() {
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const reqId = useRef(0);

  const load = useCallback(async (quiet: boolean): Promise<LoadResult> => {
    const id = ++reqId.current;
    if (!quiet || !loadedRef.current) setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (id !== reqId.current) return { ok: true };
      if (!user) {
        if (!loadedRef.current) setLoadError(true);
        return { ok: false };
      }
      const { data, error } = await supabase
        .schema("teachers")
        .from("paystubs")
        .select("*")
        .eq("teacher_id", user.id)
        .order("period_start", { ascending: false });
      if (error) notifyError("staff-payroll-history-fetch", error);
      if (id !== reqId.current) return { ok: true };
      if (error) {
        if (!loadedRef.current) setLoadError(true);
        return { ok: false };
      }
      setPaystubs((data ?? []) as Paystub[]);
      setLoadError(false);
      loadedRef.current = true;
      return { ok: true };
    } catch (err) {
      notifyError("staff-payroll-history-fetch", err);
      if (id === reqId.current && !loadedRef.current) setLoadError(true);
      return { ok: false };
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const reload = useCallback(() => load(true), [load]);
  const retry = useCallback(() => load(false), [load]);
  const toggle = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), []);

  return { paystubs, loading, loadError, expandedId, toggle, reload, retry };
}

export type PayrollHistory = ReturnType<typeof usePayrollHistory>;
