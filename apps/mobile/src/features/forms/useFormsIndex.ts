// Forms & Docs index: enrolled children + the completed documents for the
// selected child. Data only; Garden UI lives in ./garden.
//
// Fixes over the old inline screen:
// - Refocus no longer resets the selected child or flashes skeletons
//   (the old effect closed over a stale userId).
// - Rows are derived from a per-`parentId:studentId` cache in state, so the
//   row skeleton can't get stuck (cache hit, cancelled load, null student_id).
// - The cache is replaced on pull to refresh and on focus-return.
// - Any phase-2 query error is surfaced (error card + Retry) and nothing
//   partial is cached.
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { Ionicons } from "@expo/vector-icons";
import type { GardenTint } from "@/components/garden";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { isRealStorageFile, type Result } from "./formsUtils";

const TAG = "parent-forms-fetch";

export interface EnrolledChild {
  id: string; // applications.id (application primary key — NOT used for form queries)
  student_id: string | null; // used for ALL DB queries AND storage paths
  child_legal_name: string | null;
  program: string | null;
}

export interface DocRow {
  key: string;
  label: string;
  pathname: string;
  params: Record<string, string>;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tint: GardenTint;
}

function isContractComplete(
  map: Record<string, true>,
  contractId: number,
  totalSections: number,
): boolean {
  for (let i = 1; i <= totalSections; i++) {
    if (!map[`${contractId}-${i}`]) return false;
  }
  return true;
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object" && "message" in err) {
    return new Error(String((err as { message: unknown }).message));
  }
  return new Error(String(err));
}

async function fetchChildren(parentId: string): Promise<EnrolledChild[]> {
  const { data, error } = await supabase
    .schema("parent_app")
    .from("applications")
    .select("id, student_id, child_legal_name, program")
    .eq("user_id", parentId)
    .eq("approved", true);
  if (error) throw error;
  return (data ?? []) as EnrolledChild[];
}

/** Throws if ANY query fails, so a partial list is never shown or cached. */
async function fetchDocRows(userId: string, studentId: string): Promise<DocRow[]> {
  const pa = () => supabase.schema("parent_app");
  const [sigsResult, hiResult, hsResult, mpResult, prResult, apResult, immResult] =
    await Promise.all([
      // Enrollment signatures
      pa()
        .from("enrollment_signatures")
        .select("contract_id, section_id")
        .eq("parent_id", userId)
        .eq("student_id", studentId),
      // Health info
      pa().from("student_health_info").select("id").eq("parent_id", userId).eq("student_id", studentId).limit(1),
      // Health statement
      pa().from("student_health_statement").select("id").eq("parent_id", userId).eq("student_id", studentId).limit(1),
      // Medication plan
      pa().from("student_medication_plan").select("id").eq("parent_id", userId).eq("student_id", studentId).limit(1),
      // Photo release consent
      pa()
        .from("student_photo_release_consent")
        .select("id")
        .eq("parent_id", userId)
        .eq("student_id", studentId)
        .limit(1),
      // Authorized pickup plan
      pa()
        .from("student_authorized_pickup_plan")
        .select("id")
        .eq("parent_id", userId)
        .eq("student_id", studentId)
        .limit(1),
      // Immunization records (storage)
      supabase.storage.from("immunization-records").list(`${userId}/${studentId}/`),
    ]);

  for (const r of [sigsResult, hiResult, hsResult, mpResult, prResult, apResult, immResult]) {
    if (r.error) throw r.error;
  }

  // Build sig map: key = "contractId-sectionId"
  const sigMap: Record<string, true> = {};
  for (const s of sigsResult.data ?? []) {
    sigMap[`${s.contract_id}-${s.section_id}`] = true;
  }

  const base = { studentId, userId };
  const rows: DocRow[] = [];

  // Contract 1 — 13 sections required
  if (isContractComplete(sigMap, 1, 13)) {
    rows.push({
      key: "contract-1",
      label: "Program Description, Parent Responsibilities & Key Policies",
      pathname: "/(tabs)/forms/contract",
      params: { ...base, contractId: "1" },
      icon: "document-text-outline",
      tint: "sky",
    });
  }

  // Contract 2 — 4 sections required
  if (isContractComplete(sigMap, 2, 4)) {
    rows.push({
      key: "contract-2",
      label: "Community Agreement for Families and Staff",
      pathname: "/(tabs)/forms/contract",
      params: { ...base, contractId: "2" },
      icon: "people-outline",
      tint: "lav",
    });
  }

  // Health Form — healthInfo row exists OR any sig with contract 3
  const hasSig3 = Object.keys(sigMap).some((k) => k.startsWith("3-"));
  if ((hiResult.data?.length ?? 0) > 0 || hasSig3) {
    rows.push({
      key: "health-form",
      label: "Emergency Contact, Health, and Immunization Form",
      pathname: "/(tabs)/forms/health-form",
      params: base,
      icon: "medkit-outline",
      tint: "coral",
    });
  }

  // Medication Plan
  if ((mpResult.data?.length ?? 0) > 0) {
    rows.push({
      key: "medication-plan",
      label: "Emergency Medication Plan",
      pathname: "/(tabs)/forms/medication-plan",
      params: base,
      icon: "bandage-outline",
      tint: "peach",
    });
  }

  // Photo Release
  if ((prResult.data?.length ?? 0) > 0) {
    rows.push({
      key: "photo-release",
      label: "Photo, Video, and Media Release",
      pathname: "/(tabs)/forms/photo-release",
      params: base,
      icon: "camera-outline",
      tint: "butter",
    });
  }

  // Assumption of Risk — must have sig "6-1" specifically
  if (sigMap["6-1"]) {
    rows.push({
      key: "assumption-of-risk",
      label: "Assumption of Risk and Liability Release",
      pathname: "/(tabs)/forms/assumption-of-risk",
      params: base,
      icon: "shield-checkmark-outline",
      tint: "sage",
    });
  }

  // Authorized Pickup
  if ((apResult.data?.length ?? 0) > 0) {
    rows.push({
      key: "authorized-pickup",
      label: "Additional Authorized Pickup Person",
      pathname: "/(tabs)/forms/authorized-pickup",
      params: base,
      icon: "car-outline",
      tint: "mint",
    });
  }

  // Health Statement
  if ((hsResult.data?.length ?? 0) > 0) {
    rows.push({
      key: "health-statement",
      label: "Health Information Form",
      pathname: "/(tabs)/forms/health-statement",
      params: base,
      icon: "heart-outline",
      tint: "coral",
    });
  }

  // Immunization (filter out the empty-folder placeholder and sub-folders)
  const realFiles = (immResult.data ?? []).filter(isRealStorageFile);
  if (realFiles.length > 0) {
    rows.push({
      key: "immunization",
      label: "Proof of Immunizations",
      pathname: "/(tabs)/forms/immunization",
      params: { ...base, parentId: userId },
      icon: "folder-open-outline",
      tint: "sky",
    });
  }

  return rows;
}

export function useFormsIndex() {
  const { effectiveParentId } = useAuth();
  const parentId = effectiveParentId ?? null;

  const [children, setChildren] = useState<EnrolledChild[]>([]);
  /** applications.id of the selected child (survives refocus/refresh). */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Parent whose children list has finished its first load. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  /** Rows per `${parentId}:${studentId}`. A key present = loaded. */
  const [rowsCache, setRowsCache] = useState<Record<string, DocRow[]>>({});
  /** Keys whose row load failed. */
  const [rowsErrors, setRowsErrors] = useState<Record<string, true>>({});

  /** Sequence for children loads: only the newest response lands. */
  const childSeqRef = useRef(0);
  const inflightRef = useRef(new Set<string>());
  const loadedForRef = useRef<string | null>(null);

  const child = children.find((c) => c.id === selectedId) ?? children[0] ?? null;
  const studentId = child?.student_id ?? null;
  const rowsKey = parentId && studentId ? `${parentId}:${studentId}` : null;

  // ── Phase 1: children ──────────────────────────────────────────────────────
  const loadChildren = useCallback(
    async (pid: string, mode: "initial" | "quiet"): Promise<Result> => {
      const seq = ++childSeqRef.current;
      try {
        const list = await fetchChildren(pid);
        if (seq !== childSeqRef.current) return { ok: true };
        setChildren(list);
        setSelectedId((prev) => (prev && list.some((c) => c.id === prev) ? prev : (list[0]?.id ?? null)));
        setError(false);
        loadedForRef.current = pid;
        setLoadedFor(pid);
        return { ok: true, list } as Result & { list: EnrolledChild[] };
      } catch (err) {
        void notifyError(TAG, toError(err));
        if (seq !== childSeqRef.current) return { ok: false };
        if (mode === "initial") {
          setError(true);
          loadedForRef.current = pid;
          setLoadedFor(pid);
        }
        return { ok: false, error: toError(err).message };
      }
    },
    [],
  );

  // ── Phase 2: rows for one child ────────────────────────────────────────────
  // Results are keyed by parent + student, so a late response can never land
  // on the wrong child and is never discarded (no stuck skeleton).
  const loadRows = useCallback(async (pid: string, sid: string): Promise<Result> => {
    const key = `${pid}:${sid}`;
    inflightRef.current.add(key);
    try {
      const rows = await fetchDocRows(pid, sid);
      setRowsCache((c) => ({ ...c, [key]: rows }));
      setRowsErrors((e) => {
        if (!e[key]) return e;
        const next = { ...e };
        delete next[key];
        return next;
      });
      return { ok: true };
    } catch (err) {
      void notifyError(TAG, toError(err));
      setRowsErrors((e) => ({ ...e, [key]: true }));
      return { ok: false, error: toError(err).message };
    } finally {
      inflightRef.current.delete(key);
    }
  }, []);

  // Fetch rows whenever the selected child has none cached (and hasn't failed).
  useEffect(() => {
    if (!parentId || !studentId || !rowsKey) return;
    if (rowsCache[rowsKey] || rowsErrors[rowsKey]) return;
    if (inflightRef.current.has(rowsKey)) return;
    void loadRows(parentId, studentId);
  }, [parentId, studentId, rowsKey, rowsCache, rowsErrors, loadRows]);

  /**
   * Quiet reload: children + the selected child's rows, swapped in only when
   * everything succeeds. Other children's cached rows are dropped so they
   * re-fetch fresh when selected.
   */
  const reload = useCallback(async (): Promise<Result> => {
    if (!parentId) return { ok: true };
    const r = (await loadChildren(parentId, "quiet")) as Result & { list?: EnrolledChild[] };
    if (!r.ok) return r;
    const list = r.list ?? [];
    const sel = list.find((c) => c.id === selectedId) ?? list[0] ?? null;
    const sid = sel?.student_id ?? null;
    if (!sid) {
      setRowsCache({});
      setRowsErrors({});
      return { ok: true };
    }
    const key = `${parentId}:${sid}`;
    try {
      const rows = await fetchDocRows(parentId, sid);
      setRowsCache({ [key]: rows });
      setRowsErrors({});
      return { ok: true };
    } catch (err) {
      void notifyError(TAG, toError(err));
      return { ok: false, error: toError(err).message };
    }
  }, [parentId, selectedId, loadChildren]);

  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  // First focus (or a new parent, e.g. admin preview switch) → full load with
  // skeletons. Returning to the screen → quiet reload, selection kept.
  useFocusEffect(
    useCallback(() => {
      if (!parentId) return;
      if (loadedForRef.current !== parentId) {
        setChildren([]);
        setSelectedId(null);
        setRowsCache({});
        setRowsErrors({});
        setError(false);
        void loadChildren(parentId, "initial");
      } else {
        void reloadRef.current();
      }
    }, [parentId, loadChildren]),
  );

  /** Retry after a phase-1 or phase-2 failure. */
  const retry = useCallback(async (): Promise<Result> => {
    if (!parentId) return { ok: true };
    if (error) {
      const r = await loadChildren(parentId, "initial");
      return r;
    }
    if (studentId) return loadRows(parentId, studentId);
    return { ok: true };
  }, [parentId, error, studentId, loadChildren, loadRows]);

  const loading = !!parentId && loadedFor !== parentId;
  const rows: DocRow[] | null = !studentId ? [] : rowsKey ? (rowsCache[rowsKey] ?? null) : [];
  const rowsError = !!rowsKey && !!rowsErrors[rowsKey];

  return {
    parentId,
    children,
    child,
    selectChild: setSelectedId,
    loading,
    error,
    rows,
    rowsLoading: rows === null && !rowsError,
    rowsError,
    reload,
    retry,
  };
}

export type FormsIndex = ReturnType<typeof useFormsIndex>;
