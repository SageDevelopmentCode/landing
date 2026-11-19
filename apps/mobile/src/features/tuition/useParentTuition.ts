// Parent Tuition — data + sheet state. No UI here: the Garden pieces in
// ./garden/ react to what this hook returns (see useTuitionFeedback).
// The fetch + paid-map logic is moved verbatim from the old tuition.tsx.
import { useAuth, useReadOnlyPreview } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import {
  hasSchoolYearContent,
  type ApplicationRow,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  groupTransactionsByMonth,
  type StripeTransaction,
  type StudentInfo,
} from "./tuitionUtils";

export type Result = { ok: boolean; error?: string };

type PaidAftercare = Record<string, { months: string[]; days: string[] }>;
type PaidFunFriday = Record<string, { months: string[]; fridays: string[] }>;

type TuitionData = {
  transactions: StripeTransaction[];
  applications: ApplicationRow[];
  studentMap: Record<string, StudentInfo>;
  paidSupplyFeeByStudent: Record<string, boolean>;
  paidSchoolYearByStudent: Record<string, number[]>;
  paidAftercareByStudent: PaidAftercare;
  paidFunFridayByStudent: PaidFunFriday;
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
};

const EMPTY: TuitionData = {
  transactions: [],
  applications: [],
  studentMap: {},
  paidSupplyFeeByStudent: {},
  paidSchoolYearByStudent: {},
  paidAftercareByStudent: {},
  paidFunFridayByStudent: {},
  paidHomeschoolByStudent: {},
};

const LOAD_ERROR = "Something went wrong loading billing data.";

/** Everything the old fetchAll() did, as a pure loader. Throws on failure. */
async function loadTuition(parentId: string): Promise<TuitionData> {
  const [txResult, appResult] = await Promise.all([
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select(
        "id, student_id, status, program, drop_in_program, child_legal_name, child_grade, use_updated_homeschool_pricing",
      )
      .eq("user_id", parentId)
      .eq("approved", true)
      .in("program", [
        "summer_26",
        "both",
        "homeschool_drop_in",
        "school_year_26_27",
      ]),
  ]);
  // Fix: query errors used to be swallowed and rendered as "no payments".
  if (txResult.error) throw txResult.error;
  if (appResult.error) throw appResult.error;

  const txData: StripeTransaction[] = (txResult.data ?? []) as StripeTransaction[];
  const appData: ApplicationRow[] = (appResult.data ?? []).map((a) => ({
    ...a,
    use_updated_homeschool_pricing: a.use_updated_homeschool_pricing ?? false,
  }));

  const supplyFeeMap: Record<string, boolean> = {};
  const schoolYearMap: Record<string, number[]> = {};
  const aftercareMap: PaidAftercare = {};
  const funFridayMap: PaidFunFriday = {};
  const homeschoolMap: PaidHomeschoolByStudent = {};

  for (const tx of txData) {
    if (tx.status !== "completed" || !tx.student_id) continue;
    const meta = tx.metadata as Record<string, string> | null;

    if (tx.payment_type === "supply_fee") {
      supplyFeeMap[tx.student_id] = true;
      if (meta?.bundle_type === "homeschool" && meta.bundle_homeschool_tier) {
        const tier = meta.bundle_homeschool_tier;
        const weeks = (meta.bundle_homeschool_selected_days ?? "")
          .split(",")
          .map(Number)
          .filter(Boolean);
        const weekDays: Record<number, string[]> = {};
        if (meta.bundle_homeschool_week_selections_json) {
          try {
            const parsed: { week: number; days: string[] }[] = JSON.parse(
              meta.bundle_homeschool_week_selections_json,
            );
            parsed.forEach(({ week, days }) => {
              weekDays[week] = days;
            });
          } catch {
            /* ignore */
          }
        }
        if (Object.keys(weekDays).length === 0) {
          weeks.forEach((w) => {
            weekDays[w] = [];
          });
        }
        const days = [...new Set(Object.values(weekDays).flat())];
        const amountCents = meta.bundle_amount_cents
          ? parseInt(meta.bundle_amount_cents, 10)
          : tx.amount_cents;
        if (!homeschoolMap[tx.student_id]) {
          homeschoolMap[tx.student_id] = { summer: [], schoolYear: [] };
        }
        homeschoolMap[tx.student_id].schoolYear.push({
          weeks,
          tier,
          days,
          weekDays,
          amountCents,
          createdAt: tx.created_at,
        });
      }
    } else if (tx.payment_type === "school_year_tuition") {
      const months =
        meta?.selected_months?.split(",").map(Number).filter(Boolean) ?? [];
      schoolYearMap[tx.student_id] = [
        ...(schoolYearMap[tx.student_id] ?? []),
        ...months,
      ];
    } else if (tx.payment_type === "aftercare_tuition") {
      const months =
        meta?.plan_type === "monthly"
          ? (meta?.selected_months ?? "").split(",").filter(Boolean)
          : [];
      const days = (meta?.selected_days ?? "").split(",").filter(Boolean);
      const prev = aftercareMap[tx.student_id] ?? { months: [], days: [] };
      aftercareMap[tx.student_id] = {
        months: [...prev.months, ...months],
        days: [...prev.days, ...days],
      };
    } else if (tx.payment_type === "fun_friday_tuition") {
      const months = (meta?.selected_months ?? "").split(",").filter(Boolean);
      const fridays = (meta?.selected_fridays ?? "").split(",").filter(Boolean);
      const prev = funFridayMap[tx.student_id] ?? { months: [], fridays: [] };
      funFridayMap[tx.student_id] = {
        months: [...prev.months, ...months],
        fridays: [...prev.fridays, ...fridays],
      };
    } else if (tx.payment_type === "homeschool_dropin") {
      const program = meta?.program ?? "summer_26";
      const tier = meta?.tier ?? "dropin";
      const days = meta?.selected_days?.split(",").filter(Boolean) ?? [];
      const weeks =
        meta?.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
      const weekDays: Record<number, string[]> = {};
      if (meta?.week_selections) {
        try {
          const parsed: { week: number; days: string[] }[] = JSON.parse(
            meta.week_selections,
          );
          parsed.forEach(({ week, days: d }) => {
            weekDays[week] = d;
          });
        } catch {
          /* ignore */
        }
      }
      if (Object.keys(weekDays).length === 0) {
        weeks.forEach((w) => {
          weekDays[w] = days;
        });
      }
      if (!homeschoolMap[tx.student_id]) {
        homeschoolMap[tx.student_id] = { summer: [], schoolYear: [] };
      }
      const entry = {
        weeks,
        tier,
        days,
        weekDays,
        amountCents: tx.amount_cents,
        createdAt: tx.created_at,
      };
      if (program === "school_year_26_27") {
        homeschoolMap[tx.student_id].schoolYear.push(entry);
      } else {
        homeschoolMap[tx.student_id].summer.push(entry);
      }
    }
  }

  // Collect all student IDs from both transactions and applications
  const studentIds = [
    ...new Set(
      [
        ...txData.map((t) => t.student_id),
        ...appData.map((a) => a.student_id),
      ].filter(Boolean) as string[],
    ),
  ];

  const map: Record<string, StudentInfo> = {};
  if (studentIds.length > 0) {
    const { data: students, error: studentsError } = await supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .in("id", studentIds);
    if (studentsError) throw studentsError;

    for (const s of students ?? []) {
      if (s.id) {
        map[s.id] = {
          id: s.id,
          name: s.child_legal_name ?? "—",
          profileImageUrl: s.profile_image_url ?? null,
        };
      }
    }
    // Fall back to application name for students missing a profile row
    for (const app of appData) {
      if (!map[app.student_id] && app.child_legal_name) {
        map[app.student_id] = {
          id: app.student_id,
          name: app.child_legal_name,
          profileImageUrl: null,
        };
      }
    }
  }

  return {
    transactions: txData,
    applications: appData,
    studentMap: map,
    paidSupplyFeeByStudent: supplyFeeMap,
    paidSchoolYearByStudent: schoolYearMap,
    paidAftercareByStudent: aftercareMap,
    paidFunFridayByStudent: funFridayMap,
    paidHomeschoolByStudent: homeschoolMap,
  };
}

export function useParentTuition() {
  const { effectiveParentId } = useAuth();
  const isReadOnlyPreview = useReadOnlyPreview();

  const [data, setData] = useState<TuitionData>(EMPTY);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [selectionStudentId, setSelectionStudentId] = useState<string | null>(null);
  const [selectionHomeschoolApp, setSelectionHomeschoolApp] =
    useState<ApplicationRow | null>(null);
  const [selectedTx, setSelectedTx] = useState<StripeTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detailSheetRef = useRef<BottomSheetModal>(null);
  const supplyFeeSheetRef = useRef<BottomSheetModal>(null);
  const schoolYearTuitionSheetRef = useRef<BottomSheetModal>(null);
  const homeschoolSheetRef = useRef<BottomSheetModal>(null);
  const aftercareSheetRef = useRef<BottomSheetModal>(null);
  const funFridaySheetRef = useRef<BottomSheetModal>(null);
  const tuitionCodeSheetRef = useRef<BottomSheetModal>(null);
  const checkSheetRef = useRef<BottomSheetModal>(null);

  // Latest-request-wins, so a slow focus refetch can't overwrite a newer one.
  const seqRef = useRef(0);
  const loadedOnceRef = useRef(false);

  const fetchAll = useCallback(async (): Promise<Result> => {
    if (!effectiveParentId) return { ok: true };
    const my = ++seqRef.current;
    try {
      const next = await loadTuition(effectiveParentId);
      if (my !== seqRef.current) return { ok: true };
      setData(next);
      setError(null);
      loadedOnceRef.current = true;
      // Default to the first enrolled student
      const firstEnrolled = next.applications.find((a) => a.status === "enrolled");
      if (firstEnrolled) {
        setActiveChildId((prev) => prev ?? firstEnrolled.student_id);
      }
      return { ok: true };
    } catch (err) {
      notifyError("parent-tuition-fetch", err);
      // Only replace the screen with the error card when nothing is shown yet;
      // otherwise keep the data and let the caller toast.
      if (my === seqRef.current && !loadedOnceRef.current) setError(LOAD_ERROR);
      return { ok: false, error: LOAD_ERROR };
    }
  }, [effectiveParentId]);

  // First load (and a fresh start whenever the viewed parent changes).
  useEffect(() => {
    loadedOnceRef.current = false;
    setLoading(true);
    setError(null);
    setData(EMPTY);
    setActiveChildId(null);
    void fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  /** Re-runs the loaders without flipping back to skeletons. */
  const reload = useCallback(() => fetchAll(), [fetchAll]);

  /** From the error card: retry the first load. */
  const retryLoad = useCallback(async (): Promise<Result> => {
    const r = await fetchAll();
    setLoading(false);
    return r;
  }, [fetchAll]);

  // Fix: the old focus refetch had [] deps and closed over the first
  // effectiveParentId. Keep a ref to the latest reload instead.
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void reloadRef.current();
      focusedOnce.current = true;
    }, []),
  );

  const {
    transactions,
    applications,
    studentMap,
    paidSupplyFeeByStudent,
    paidSchoolYearByStudent,
    paidAftercareByStudent,
    paidFunFridayByStudent,
    paidHomeschoolByStudent,
  } = data;

  const sections = useMemo(() => {
    const visibleTransactions = transactions.filter((tx) => {
      const meta = tx.metadata as Record<string, string> | null;
      if (meta?.is_sibling_split === "true") return false;
      if (meta?.bundled_with_supply_fee === "true") return false;
      return true;
    });
    return groupTransactionsByMonth(visibleTransactions);
  }, [transactions]);

  const enrolledStudents = useMemo(() => {
    const seen = new Set<string>();
    const result: StudentInfo[] = [];
    for (const app of applications) {
      if (app.status === "enrolled" && !seen.has(app.student_id)) {
        seen.add(app.student_id);
        result.push(
          studentMap[app.student_id] ?? {
            id: app.student_id,
            name: app.child_legal_name ?? "Student",
            profileImageUrl: null,
          },
        );
      }
    }
    return result;
  }, [applications, studentMap]);

  const activeApplications = useMemo(
    () =>
      applications.filter(
        (a) => a.student_id === activeChildId && a.status === "enrolled",
      ),
    [applications, activeChildId],
  );

  const showSchoolYearSection = useMemo(
    () =>
      activeChildId != null && hasSchoolYearContent(applications, activeChildId),
    [applications, activeChildId],
  );

  const showMultiChildSchoolYearBanner = useMemo(() => {
    if (!activeChildId || !showSchoolYearSection) return false;
    const syStudents = enrolledStudents.filter((s) =>
      hasSchoolYearContent(applications, s.id),
    );
    return syStudents.length > 1;
  }, [activeChildId, showSchoolYearSection, enrolledStudents, applications]);

  const addonApplication = useMemo(() => {
    const studentId = selectionStudentId ?? activeChildId;
    if (!studentId) return null;
    const apps = applications.filter(
      (a) => a.student_id === studentId && a.status === "enrolled",
    );
    return (
      apps.find((a) => a.program === "school_year_26_27") ??
      apps.find((a) => a.program === "both") ??
      apps.find(
        (a) =>
          a.program === "homeschool_drop_in" &&
          (a.drop_in_program === "school_year_26_27" ||
            a.drop_in_program === "both"),
      ) ??
      null
    );
  }, [applications, activeChildId, selectionStudentId]);

  const homeschoolPaidMonths = useMemo(() => {
    if (!selectionHomeschoolApp) return [];
    return (
      paidHomeschoolByStudent[selectionHomeschoolApp.student_id]?.schoolYear.flatMap(
        (e) => e.weeks,
      ) ?? []
    );
  }, [selectionHomeschoolApp, paidHomeschoolByStudent]);

  const selectionStudent = selectionStudentId
    ? (studentMap[selectionStudentId] ?? null)
    : null;

  // ── Sheet openers (pure state + present; feedback wraps them) ────────────
  const openDetail = useCallback((tx: StripeTransaction) => {
    setSelectedTx(tx);
    detailSheetRef.current?.present();
  }, []);

  const openSupplyFee = useCallback(() => {
    setSelectionStudentId(activeChildId);
    supplyFeeSheetRef.current?.present();
  }, [activeChildId]);

  const openSchoolYearTuition = useCallback(() => {
    setSelectionStudentId(activeChildId);
    schoolYearTuitionSheetRef.current?.present();
  }, [activeChildId]);

  const openHomeschool = useCallback(
    (app: ApplicationRow) => {
      setSelectionStudentId(activeChildId);
      setSelectionHomeschoolApp(app);
      homeschoolSheetRef.current?.present();
    },
    [activeChildId],
  );

  const openAftercare = useCallback(() => {
    setSelectionStudentId(activeChildId);
    aftercareSheetRef.current?.present();
  }, [activeChildId]);

  const openFunFriday = useCallback(() => {
    setSelectionStudentId(activeChildId);
    funFridaySheetRef.current?.present();
  }, [activeChildId]);

  const openTuitionCode = useCallback(() => {
    tuitionCodeSheetRef.current?.present();
  }, []);

  const openCheck = useCallback(() => {
    checkSheetRef.current?.present();
  }, []);

  return {
    effectiveParentId,
    isReadOnlyPreview,
    loading,
    error,
    reload,
    retryLoad,

    transactions,
    applications,
    studentMap,
    paidSupplyFeeByStudent,
    paidSchoolYearByStudent,
    paidAftercareByStudent,
    paidFunFridayByStudent,
    paidHomeschoolByStudent,

    sections,
    enrolledStudents,
    activeChildId,
    setActiveChildId,
    activeApplications,
    showSchoolYearSection,
    showMultiChildSchoolYearBanner,
    addonApplication,
    homeschoolPaidMonths,

    selectionStudentId,
    selectionStudent,
    selectionHomeschoolApp,
    selectedTx,

    detailSheetRef,
    supplyFeeSheetRef,
    schoolYearTuitionSheetRef,
    homeschoolSheetRef,
    aftercareSheetRef,
    funFridaySheetRef,
    tuitionCodeSheetRef,
    checkSheetRef,

    openDetail,
    openSupplyFee,
    openSchoolYearTuition,
    openHomeschool,
    openAftercare,
    openFunFriday,
    openTuitionCode,
    openCheck,
  };
}

export type ParentTuition = ReturnType<typeof useParentTuition>;
