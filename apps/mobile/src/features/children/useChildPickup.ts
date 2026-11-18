// Authorized pickup plan + people for one child. Data only.
//
// Save is now insert-new → delete-old (instead of delete-all → insert), so a
// failed insert can no longer wipe the family's pickup list.
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, useState } from "react";
import { isValidYMD } from "../calendar/calendarUtils";
import type { LocalPerson, PickupPerson, PickupPlan, Result } from "./types";

export type PickupDateField = "dateOfRequest" | "effectiveUntil";

export function useChildPickup(studentId: string | null, userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [dateOfRequest, setDateOfRequest] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [persons, setPersons] = useState<LocalPerson[]>([]);
  const [editingPerson, setEditingPerson] = useState<LocalPerson | null>(null);
  const [personSession, setPersonSession] = useState(0);
  const [dateField, setDateField] = useState<PickupDateField>("dateOfRequest");
  const [dateSession, setDateSession] = useState(0);
  const personSheetRef = useRef<BottomSheetModal>(null);
  const dateSheetRef = useRef<BottomSheetModal>(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (quiet: boolean): Promise<Result> => {
      if (!studentId || !userId) return { ok: true };
      const id = ++reqId.current;
      if (!quiet) setLoading(true);
      const [planResult, personsResult] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_plan")
          .select("*")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .maybeSingle(),
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_persons")
          .select("*")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("sort_order", { ascending: true }),
      ]);
      if (id !== reqId.current) return { ok: true };
      setLoading(false);
      const err = planResult.error ?? personsResult.error;
      if (err) {
        notifyError("parent-children-pickup-fetch", err);
        setError(true);
        setLoadedId(studentId);
        return { ok: false, error: err.message };
      }
      const plan = planResult.data as PickupPlan | null;
      const rows = (personsResult.data ?? []) as PickupPerson[];
      setDateOfRequest(plan?.date_of_request ?? "");
      setEffectiveUntil(plan?.effective_until ?? "");
      setPersons(
        rows.map((p) => ({
          tempId: p.id,
          full_name: p.full_name,
          relationship: p.relationship ?? "",
          phone: p.phone ?? "",
          email: p.email ?? "",
          dl_state_id_number: p.dl_state_id_number ?? "",
          vehicle_info: p.vehicle_info ?? "",
          license_plate_state: p.license_plate_state ?? "",
        })),
      );
      setIsDirty(false);
      setError(false);
      setLoadedId(studentId);
      return { ok: true };
    },
    [studentId, userId],
  );

  useEffect(() => {
    setIsDirty(false);
    setPersons([]);
    void load(false);
  }, [load]);

  /** Quiet refresh — skipped while there are unsaved edits so they aren't lost. */
  const reload = useCallback(async (): Promise<Result> => {
    if (isDirty) return { ok: true };
    return load(true);
  }, [isDirty, load]);

  const retry = useCallback(() => load(false), [load]);
  const discard = useCallback(() => load(true), [load]);

  const openAddPerson = useCallback(() => {
    setEditingPerson(null);
    setPersonSession((n) => n + 1);
    personSheetRef.current?.present();
  }, []);

  const openEditPerson = useCallback((p: LocalPerson) => {
    setEditingPerson(p);
    setPersonSession((n) => n + 1);
    personSheetRef.current?.present();
  }, []);

  const savePerson = useCallback(
    (person: LocalPerson): { wasEdit: boolean } => {
      const wasEdit = !!editingPerson;
      if (editingPerson) {
        setPersons((prev) => prev.map((p) => (p.tempId === editingPerson.tempId ? person : p)));
      } else {
        setPersons((prev) => [...prev, { ...person, tempId: String(Date.now()) }]);
      }
      setIsDirty(true);
      personSheetRef.current?.dismiss();
      setEditingPerson(null);
      return { wasEdit };
    },
    [editingPerson],
  );

  const removePerson = useCallback((tempId: string) => {
    setPersons((prev) => prev.filter((p) => p.tempId !== tempId));
    setIsDirty(true);
  }, []);

  const openDate = useCallback((field: PickupDateField) => {
    setDateField(field);
    setDateSession((n) => n + 1);
    dateSheetRef.current?.present();
  }, []);

  const setDate = useCallback((field: PickupDateField, value: string) => {
    if (field === "dateOfRequest") setDateOfRequest(value);
    else setEffectiveUntil(value);
    setIsDirty(true);
  }, []);

  /** Returns a message when the plan dates don't make sense, else null. */
  const dateProblem = (() => {
    const a = dateOfRequest.trim();
    const b = effectiveUntil.trim();
    if (isValidYMD(a) && isValidYMD(b) && b < a) return "“Effective Until” can't be before the “Date of Request”.";
    return null;
  })();

  const save = useCallback(async (): Promise<Result> => {
    if (saving || !studentId || !userId) return { ok: false };
    if (dateProblem) return { ok: false, error: dateProblem };
    setSaving(true);
    try {
      // Step 1 — upsert plan
      const { error: planError } = await supabase
        .schema("parent_app")
        .from("student_authorized_pickup_plan")
        .upsert(
          {
            parent_id: userId,
            student_id: studentId,
            date_of_request: dateOfRequest.trim() || null,
            effective_until: effectiveUntil.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "parent_id,student_id" },
        );
      if (planError) throw planError;

      // Step 2 — insert the fresh list first (nothing is removed if this fails)
      let newIds: string[] = [];
      if (persons.length > 0) {
        const rows = persons.map((p, i) => ({
          parent_id: userId,
          student_id: studentId,
          full_name: p.full_name,
          relationship: p.relationship || null,
          phone: p.phone || null,
          email: p.email || null,
          dl_state_id_number: p.dl_state_id_number || null,
          vehicle_info: p.vehicle_info || null,
          license_plate_state: p.license_plate_state || null,
          sort_order: i,
        }));
        const { data: inserted, error: insertError } = await supabase
          .schema("parent_app")
          .from("student_authorized_pickup_persons")
          .insert(rows)
          .select("id");
        if (insertError) throw insertError;
        newIds = (inserted ?? []).map((r: { id: string }) => r.id);
      }

      // Step 3 — remove the previous rows (everything of ours that isn't new)
      let del = supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .delete()
        .eq("parent_id", userId)
        .eq("student_id", studentId);
      if (newIds.length > 0) del = del.not("id", "in", `(${newIds.join(",")})`);
      const { error: deleteError } = await del;
      if (deleteError) {
        // Roll back the new rows so the list isn't doubled.
        if (newIds.length > 0) {
          await supabase
            .schema("parent_app")
            .from("student_authorized_pickup_persons")
            .delete()
            .in("id", newIds);
        }
        throw deleteError;
      }

      setPersons((prev) => prev.map((p, i) => ({ ...p, tempId: newIds[i] ?? p.tempId })));
      setIsDirty(false);
      return { ok: true };
    } catch (e: unknown) {
      notifyError("parent-children-pickup-save", e);
      const msg = (e as { message?: string })?.message;
      return { ok: false, error: msg ?? "Failed to save." };
    } finally {
      setSaving(false);
    }
  }, [saving, studentId, userId, dateProblem, dateOfRequest, effectiveUntil, persons]);

  return {
    loading: loading || (!!studentId && loadedId !== studentId),
    error,
    saving,
    isDirty,
    dateOfRequest,
    effectiveUntil,
    dateProblem,
    persons,
    editingPerson,
    personSession,
    personSheetRef,
    openAddPerson,
    openEditPerson,
    savePerson,
    removePerson,
    dateField,
    dateSession,
    dateSheetRef,
    openDate,
    setDate,
    save,
    reload,
    retry,
    discard,
  };
}

export type ChildPickup = ReturnType<typeof useChildPickup>;
