import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import BillingPage from "./BillingPage";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";

export type PendingPaymentRequest = {
  id: string;
  student_id: string | null;
  program: string;
  payment_type: string;
  week: string | null;
  month: string | null;
  label: string;
  amount_cents: number | null;
  created_at: string;
};

export type PaidWeeksByStudent = Record<string, number[]>; // studentId → array of paid week numbers

export type SummerEnrollment = {
  id: string;
  student_id: string;
  child_grade: string | null;
  program: string | null;
};

export type NonEnrolledApp = {
  id: string;
  student_id: string;
  name: string | null;
  program: string | null;
};

export type HomeschoolDropInApp = {
  id: string;
  student_id: string;
  drop_in_program: string | null; // "summer_26" | "school_year_26_27" | "both"
  child_grade: string | null;
  name: string | null;
};

export type SchoolYearOnlyApp = {
  id: string;
  student_id: string;
  child_grade: string | null;
  name: string | null;
};

export type PaidHomeschoolEntry = {
  weeks: number[];
  tier: string;
  days: string[];
  weekDays: Record<number, string[]>; // week number → days paid in that transaction
  amountCents: number;
  createdAt: string;
};

export type PaidHomeschoolByStudent = Record<string, {
  summer: PaidHomeschoolEntry[];
  schoolYear: PaidHomeschoolEntry[];
}>;

export type PaidAftercareByStudent = Record<string, {
  months: string[]; // month keys, e.g. ["jun", "jul"]
  days: string[];   // ISO dates, e.g. ["2026-05-26"]
}>;

export type PaidFunFridayByStudent = Record<string, {
  months: string[];   // month keys, e.g. ["jun", "jul"]
  fridays: string[];  // ISO dates, e.g. ["2026-06-05"]
}>;

export type SummerNotesByStudent = Record<string, string>; // studentId → note text
export type HomeschoolNotesByStudent = Record<string, string>; // studentId → note text

export type PaidSchoolYearByStudent = Record<string, number[]>; // studentId → paid monthIndices (1–10)

export type StudentInfo = {
  name: string;
  profileImageUrl: string | null;
};

export type StripeTransaction = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_type: string;
  status: string;
  amount_cents: number;
  intended_amount_cents: number | null;
  currency: string;
  cover_fees: boolean | null;
  payer_name: string | null;
  payer_email: string | null;
  description: string | null;
  student_id: string | null;
  application_id: string | null;
  parent_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
};

export default async function BillingRoute() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;

  const [{ data: txData }, { data: adminUser }, { data: pendingData }, { data: summerData }, { data: enrolledCheck }, { data: notesData }, { data: homeschoolNotesData }, { data: tuitionFeedbackCheck }] = await Promise.all([
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("*")
      .in("parent_id", [...new Set([effectiveParentId, user.id])])
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("billing")
      .from("pending_payment_requests")
      .select("id, student_id, program, payment_type, week, month, label, amount_cents, created_at")
      .in("parent_id", [...new Set([effectiveParentId, user.id])])
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id, student_id, child_grade, status, child_legal_name, program, drop_in_program")
      .eq("user_id", effectiveParentId)
      .eq("approved", true)
      .in("program", ["summer_26", "both", "homeschool_drop_in", "school_year_26_27"]),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", effectiveParentId)
      .eq("status", "enrolled")
      .limit(1),
    adminClient
      .schema("billing")
      .from("summer_week_commitments")
      .select("student_id, note")
      .eq("parent_id", effectiveParentId),
    adminClient
      .schema("billing")
      .from("homeschool_day_commitments")
      .select("student_id, note")
      .eq("parent_id", effectiveParentId),
    adminClient
      .schema("admin")
      .from("tuition_feedback")
      .select("id")
      .eq("parent_id", effectiveParentId)
      .limit(1),
  ]);

  const transactions = (txData ?? []) as StripeTransaction[];
  const pendingRequests = (pendingData ?? []) as PendingPaymentRequest[];
  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const hasSubmittedTuitionFeedback = (tuitionFeedbackCheck ?? []).length > 0;
  const isSharedAccess = !!grant;

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient.schema("admin").from("users").select("full_name").eq("id", effectiveParentId).single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  const allSummerApps = ((summerData ?? []) as {
    id: string;
    student_id: string | null;
    child_grade: string | null;
    status: string | null;
    child_legal_name: string | null;
    program: string | null;
    drop_in_program: string | null;
  }[]).filter((e) => !!e.student_id && !!e.id);

  const summerEnrollments: SummerEnrollment[] = allSummerApps
    .filter((e) => e.status === "enrolled")
    .map((e) => ({ id: e.id, student_id: e.student_id!, child_grade: e.child_grade, program: e.program ?? null }));

  const nonEnrolledApps: NonEnrolledApp[] = allSummerApps
    .filter((e) => e.status !== "enrolled" && e.program !== "homeschool_drop_in")
    .map((e) => ({ id: e.id, student_id: e.student_id!, name: e.child_legal_name, program: e.program ?? null }));

  const homeschoolDropInApps: HomeschoolDropInApp[] = allSummerApps
    .filter(
      (e) =>
        e.status === "enrolled" &&
        (e.program === "homeschool_drop_in" || e.program === "both"),
    )
    .map((e) => ({
      id: e.id,
      student_id: e.student_id!,
      drop_in_program:
        e.program === "homeschool_drop_in" ? e.drop_in_program : e.program,
      child_grade: e.child_grade,
      name: e.child_legal_name,
    }));

  const schoolYearOnlyApps: SchoolYearOnlyApp[] = allSummerApps
    .filter((e) => e.program === "school_year_26_27" && e.status === "enrolled")
    .map((e) => ({ id: e.id, student_id: e.student_id!, child_grade: e.child_grade, name: e.child_legal_name }));

  // Build paid-weeks map per student from all completed summer_tuition transactions
  const paidWeeksByStudent: PaidWeeksByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "summer_tuition" && tx.status === "completed" && tx.student_id) {
      const planType = (tx.metadata as Record<string, string>)?.plan_type;
      const weeksStr = (tx.metadata as Record<string, string>)?.weeks ?? "";
      if (planType === "full") {
        paidWeeksByStudent[tx.student_id] = Array.from({ length: 12 }, (_, i) => i + 1);
      } else {
        const weeks = weeksStr.split(",").map(Number).filter(Boolean);
        paidWeeksByStudent[tx.student_id] = [
          ...(paidWeeksByStudent[tx.student_id] ?? []),
          ...weeks,
        ];
      }
    }
  }

  // Build paid homeschool drop-in map per student
  const paidHomeschoolByStudent: PaidHomeschoolByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "homeschool_dropin" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const program = meta.program ?? "summer_26";
      const tier = meta.tier ?? "dropin";
      const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
      const weeks = meta.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];

      // Build per-week day map: prefer new week_selections JSON, fall back to same days for every week
      let weekDays: Record<number, string[]> = {};
      if (meta.week_selections) {
        try {
          const parsed: { week: number; days: string[] }[] = JSON.parse(meta.week_selections);
          parsed.forEach(({ week, days: d }) => { weekDays[week] = d; });
        } catch { /* fall through to fallback */ }
      }
      if (Object.keys(weekDays).length === 0) {
        weeks.forEach((w) => { weekDays[w] = days; });
      }

      if (!paidHomeschoolByStudent[tx.student_id]) {
        paidHomeschoolByStudent[tx.student_id] = { summer: [], schoolYear: [] };
      }
      const entry = { weeks, tier, days, weekDays, amountCents: tx.amount_cents, createdAt: tx.created_at };
      if (program === "summer_26") {
        paidHomeschoolByStudent[tx.student_id].summer.push(entry);
      } else {
        paidHomeschoolByStudent[tx.student_id].schoolYear.push(entry);
      }
    }
  }

  // Build paid aftercare map per student
  const paidAftercareByStudent: PaidAftercareByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "aftercare_tuition" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months =
        meta.plan_type === "monthly"
          ? (meta.selected_months?.split(",").filter(Boolean) ?? [])
          : [];
      const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
      if (!paidAftercareByStudent[tx.student_id]) {
        paidAftercareByStudent[tx.student_id] = { months: [], days: [] };
      }
      paidAftercareByStudent[tx.student_id].months.push(...months);
      paidAftercareByStudent[tx.student_id].days.push(...days);
    }
  }

  // Build paid fun friday map per student
  const paidFunFridayByStudent: PaidFunFridayByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "fun_friday_tuition" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months = meta.selected_months?.split(",").filter(Boolean) ?? [];
      const fridays = meta.selected_fridays?.split(",").filter(Boolean) ?? [];
      if (!paidFunFridayByStudent[tx.student_id]) {
        paidFunFridayByStudent[tx.student_id] = { months: [], fridays: [] };
      }
      paidFunFridayByStudent[tx.student_id].months.push(...months);
      paidFunFridayByStudent[tx.student_id].fridays.push(...fridays);
    }
  }

  // Build paid school-year tuition months per student
  const paidSchoolYearByStudent: PaidSchoolYearByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "school_year_tuition" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months = meta.selected_months?.split(",").map(Number).filter(Boolean) ?? [];
      if (!paidSchoolYearByStudent[tx.student_id]) {
        paidSchoolYearByStudent[tx.student_id] = [];
      }
      paidSchoolYearByStudent[tx.student_id].push(...months);
    }
  }

  // Build paid supply fee set per student
  const paidSupplyFeeByStudent: Record<string, boolean> = {};
  for (const tx of transactions) {
    if (tx.payment_type === "supply_fee" && tx.status === "completed" && tx.student_id) {
      paidSupplyFeeByStudent[tx.student_id] = true;
    }
  }

  // Build summer commitment notes map per student
  const summerNotesByStudent: SummerNotesByStudent = {};
  for (const row of notesData ?? []) {
    if (row.student_id && row.note) {
      summerNotesByStudent[row.student_id] = row.note;
    }
  }

  // Build homeschool day commitment notes map per student
  const homeschoolNotesByStudent: HomeschoolNotesByStudent = {};
  for (const row of homeschoolNotesData ?? []) {
    if (row.student_id && row.note) {
      homeschoolNotesByStudent[row.student_id] = row.note;
    }
  }

  // Show enrollment if parent has paid fewer than 12 weeks (weekly plan with room to add more)
  // Exclude homeschool_drop_in — they don't have summer tuition
  const unpaidSummerEnrollments = summerEnrollments.filter(
    (e) => e.program !== "homeschool_drop_in" && (paidWeeksByStudent[e.student_id]?.length ?? 0) < 12
  );

  const studentIds = [
    ...new Set([
      ...transactions.map((t) => t.student_id),
      ...pendingRequests.map((p) => p.student_id),
      ...summerEnrollments.map((e) => e.student_id),
      ...homeschoolDropInApps.map((e) => e.student_id),
      ...schoolYearOnlyApps.map((e) => e.student_id),
    ].filter(Boolean)),
  ] as string[];

  let studentMap: Record<string, StudentInfo> = {};
  if (studentIds.length > 0) {
    const { data: students } = await adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .in("id", studentIds);
    for (const s of students ?? []) {
      if (s.id && s.child_legal_name) {
        studentMap[s.id] = {
          name: s.child_legal_name,
          profileImageUrl: s.profile_image_url ?? null,
        };
      }
    }
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        <DashboardHeader>
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/assets/Logo.png"
                alt="Sage Field"
                width={50}
                height={24}
                className="object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <DashboardNav hasEnrolledStudent={(enrolledCheck ?? []).length > 0} />
          </div>
          <ParentHeaderRight userId={user.id} email={user.email ?? ""} fullName={fullName} profileImageUrl={profileImageUrl} />
        </DashboardHeader>

        <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

        <main className="flex-1 flex overflow-hidden">
          <BillingPage transactions={transactions} studentMap={studentMap} pendingRequests={pendingRequests} summerEnrollments={summerEnrollments} unpaidSummerEnrollments={unpaidSummerEnrollments} paidWeeksByStudent={paidWeeksByStudent} parentId={effectiveParentId} parentEmail={user.email ?? ""} nonEnrolledApps={nonEnrolledApps} homeschoolDropInApps={homeschoolDropInApps} paidHomeschoolByStudent={paidHomeschoolByStudent} paidAftercareByStudent={paidAftercareByStudent} paidFunFridayByStudent={paidFunFridayByStudent} summerNotesByStudent={summerNotesByStudent} homeschoolNotesByStudent={homeschoolNotesByStudent} schoolYearOnlyApps={schoolYearOnlyApps} hasSubmittedTuitionFeedback={hasSubmittedTuitionFeedback} paidSchoolYearByStudent={paidSchoolYearByStudent} paidSupplyFeeByStudent={paidSupplyFeeByStudent} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
