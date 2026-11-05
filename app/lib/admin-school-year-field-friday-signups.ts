import { createAdminClient } from "@/app/lib/supabase-server";
import {
  isSchoolYearFriday,
  SCHOOL_YEAR_FUN_FRIDAY_KEYS,
  type StripeTxnLike,
} from "@/shared/billing/school-year-attendance";
import { SCHOOL_YEAR_FUN_FRIDAY_MONTHS } from "@/shared/billing/school-year";
import { FRIDAY_PAGE_EVENT_DATE } from "@/shared/marketing/friday-page-event";

export type FieldFridaySignupSource = "parent_portal" | "friday_page" | "both";

export type SchoolYearFieldFridaySignup = {
  studentId: string;
  childName: string;
  parentName: string | null;
  parentEmail: string | null;
  paidFridays: string[];
  lastPaymentAt: string;
  program: string | null;
  signupSource: FieldFridaySignupSource;
  paymentStatus: "paid" | "pending";
  fridayPageRegistrationId: string | null;
  phone: string | null;
  referralSource: string | null;
  childAge: number | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  consentOutdoor: boolean | null;
  consentPhoto: boolean | null;
  signatureName: string | null;
  notes: string | null;
};

function metaString(
  meta: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  const value = meta?.[key];
  return typeof value === "string" ? value : undefined;
}

function mergeKey(email: string, childName: string): string {
  return `${email.trim().toLowerCase()}|${childName.trim().toLowerCase()}`;
}

/** Paid school-year Field Friday ISO dates covered by a fun_friday_tuition transaction. */
export function expandSchoolYearFieldFridayDatesFromTxn(
  txn: StripeTxnLike,
): string[] {
  if (txn.payment_type !== "fun_friday_tuition") return [];

  const meta = txn.metadata ?? {};
  const dates = new Set<string>();

  const paidFridays =
    metaString(meta, "selected_fridays")?.split(",").filter(Boolean) ?? [];
  for (const d of paidFridays) {
    if (isSchoolYearFriday(d)) dates.add(d);
  }

  const paidMonths =
    metaString(meta, "selected_months")?.split(",").filter(Boolean) ?? [];
  for (const key of paidMonths) {
    if (!SCHOOL_YEAR_FUN_FRIDAY_KEYS.has(key)) continue;
    const month = SCHOOL_YEAR_FUN_FRIDAY_MONTHS.find((m) => m.key === key);
    if (month) {
      for (const f of month.fridays) dates.add(f.date);
    }
  }

  return [...dates].sort();
}

async function loadPortalSignups(
  client: ReturnType<typeof createAdminClient>,
): Promise<SchoolYearFieldFridaySignup[]> {
  const { data: txData, error: txError } = await client
    .schema("billing")
    .from("stripe_transactions")
    .select("student_id, metadata, created_at, payment_type")
    .eq("status", "completed")
    .eq("is_deleted", false)
    .eq("payment_type", "fun_friday_tuition")
    .not("student_id", "is", null);

  if (txError) {
    console.error("getSchoolYearFieldFridaySignupsForAdmin tx:", txError);
    return [];
  }

  type Group = {
    paidFridays: Set<string>;
    lastPaymentAt: string;
  };

  const byStudent = new Map<string, Group>();

  for (const row of txData ?? []) {
    const studentId = row.student_id as string;
    if (!studentId) continue;

    const dates = expandSchoolYearFieldFridayDatesFromTxn({
      payment_type: row.payment_type,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    });
    if (dates.length === 0) continue;

    const createdAt = row.created_at as string;
    let group = byStudent.get(studentId);
    if (!group) {
      group = { paidFridays: new Set(), lastPaymentAt: createdAt };
      byStudent.set(studentId, group);
    }
    for (const d of dates) group.paidFridays.add(d);
    if (createdAt > group.lastPaymentAt) group.lastPaymentAt = createdAt;
  }

  const studentIds = [...byStudent.keys()];
  if (studentIds.length === 0) return [];

  const [{ data: students }, { data: apps }] = await Promise.all([
    client
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, parent_id")
      .in("id", studentIds),
    client
      .schema("parent_app")
      .from("applications")
      .select("student_id, program, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false }),
  ]);

  const parentIds = [
    ...new Set((students ?? []).map((s) => s.parent_id).filter(Boolean)),
  ];

  const { data: parents } =
    parentIds.length > 0
      ? await client
          .schema("admin")
          .from("users")
          .select("id, full_name, email")
          .in("id", parentIds)
      : { data: [] };

  const parentMap = new Map(
    (parents ?? []).map((p) => [
      p.id,
      { name: p.full_name ?? null, email: p.email ?? null },
    ]),
  );

  const studentMap = new Map(
    (students ?? []).map((s) => [
      s.id,
      {
        childName: s.child_legal_name,
        parentId: s.parent_id,
      },
    ]),
  );

  const programByStudent = new Map<string, string>();
  for (const app of apps ?? []) {
    const sid = app.student_id as string;
    if (!sid || programByStudent.has(sid)) continue;
    if (app.program) programByStudent.set(sid, app.program as string);
  }

  const results: SchoolYearFieldFridaySignup[] = [];

  for (const [studentId, group] of byStudent) {
    const student = studentMap.get(studentId);
    if (!student) continue;

    const parent = parentMap.get(student.parentId);
    const parentEmail = parent?.email ?? null;
    if (!parentEmail) continue;

    results.push({
      studentId,
      childName: student.childName,
      parentName: parent?.name ?? null,
      parentEmail,
      paidFridays: [...group.paidFridays].sort(),
      lastPaymentAt: group.lastPaymentAt,
      program: programByStudent.get(studentId) ?? null,
      signupSource: "parent_portal",
      paymentStatus: "paid",
      fridayPageRegistrationId: null,
      phone: null,
      referralSource: null,
      childAge: null,
      emergencyName: null,
      emergencyPhone: null,
      consentOutdoor: null,
      consentPhoto: null,
      signatureName: null,
      notes: null,
    });
  }

  return results;
}

type FridayPageChild = { name: string; age: number };

async function loadFridayPageSignups(
  client: ReturnType<typeof createAdminClient>,
): Promise<SchoolYearFieldFridaySignup[]> {
  const { data: rows, error } = await client
    .schema("marketing")
    .from("beach_bash_registrations")
    .select(
      "id, parent_name, email, phone, children, child_count, payment_status, referral_source, emergency_name, emergency_phone, consent_outdoor, consent_photo, signature_name, notes, created_at, updated_at",
    )
    .eq("source", "friday_page")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSchoolYearFieldFridaySignupsForAdmin beach_bash:", error);
    return [];
  }

  const results: SchoolYearFieldFridaySignup[] = [];

  for (const row of rows ?? []) {
    const email = (row.email as string)?.trim();
    if (!email) continue;

    const paymentStatus =
      row.payment_status === "paid" ? ("paid" as const) : ("pending" as const);
    const lastPaymentAt = (row.updated_at ?? row.created_at) as string;
    const kids = (row.children as FridayPageChild[] | null) ?? [];
    if (kids.length === 0) continue;

    kids.forEach((child, index) => {
      if (!child.name?.trim()) return;

      results.push({
        studentId: `friday-page:${row.id}:${index}`,
        childName: child.name.trim(),
        parentName: row.parent_name as string,
        parentEmail: email,
        paidFridays:
          paymentStatus === "paid" ? [FRIDAY_PAGE_EVENT_DATE] : [],
        lastPaymentAt,
        program: "friday_page",
        signupSource: "friday_page",
        paymentStatus,
        fridayPageRegistrationId: row.id as string,
        phone: (row.phone as string | null) ?? null,
        referralSource: (row.referral_source as string | null) ?? null,
        childAge: typeof child.age === "number" ? child.age : null,
        emergencyName: (row.emergency_name as string | null) ?? null,
        emergencyPhone: (row.emergency_phone as string | null) ?? null,
        consentOutdoor: row.consent_outdoor as boolean,
        consentPhoto: row.consent_photo as boolean,
        signatureName: (row.signature_name as string | null) ?? null,
        notes: (row.notes as string | null) ?? null,
      });
    });
  }

  return results;
}

function mergePortalAndFridayPageSignups(
  portal: SchoolYearFieldFridaySignup[],
  fridayPage: SchoolYearFieldFridaySignup[],
): SchoolYearFieldFridaySignup[] {
  const byKey = new Map<string, SchoolYearFieldFridaySignup>();

  for (const row of portal) {
    if (!row.parentEmail) continue;
    byKey.set(mergeKey(row.parentEmail, row.childName), row);
  }

  for (const fridayRow of fridayPage) {
    if (!fridayRow.parentEmail) continue;
    const key = mergeKey(fridayRow.parentEmail, fridayRow.childName);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, fridayRow);
      continue;
    }

    const paidFridays = new Set([
      ...existing.paidFridays,
      ...fridayRow.paidFridays,
    ]);
    const lastPaymentAt =
      fridayRow.lastPaymentAt > existing.lastPaymentAt
        ? fridayRow.lastPaymentAt
        : existing.lastPaymentAt;

    byKey.set(key, {
      ...existing,
      signupSource: "both",
      paymentStatus:
        existing.paymentStatus === "paid" || fridayRow.paymentStatus === "paid"
          ? "paid"
          : "pending",
      paidFridays: [...paidFridays].sort(),
      lastPaymentAt,
      phone: existing.phone ?? fridayRow.phone,
      fridayPageRegistrationId:
        existing.fridayPageRegistrationId ?? fridayRow.fridayPageRegistrationId,
      referralSource:
        existing.referralSource ?? fridayRow.referralSource,
      program: existing.program ?? fridayRow.program,
      childAge: existing.childAge ?? fridayRow.childAge,
      emergencyName: existing.emergencyName ?? fridayRow.emergencyName,
      emergencyPhone: existing.emergencyPhone ?? fridayRow.emergencyPhone,
      consentOutdoor: existing.consentOutdoor ?? fridayRow.consentOutdoor,
      consentPhoto: existing.consentPhoto ?? fridayRow.consentPhoto,
      signatureName: existing.signatureName ?? fridayRow.signatureName,
      notes: existing.notes ?? fridayRow.notes,
    });
  }

  return [...byKey.values()].sort(
    (a, b) =>
      new Date(b.lastPaymentAt).getTime() -
      new Date(a.lastPaymentAt).getTime(),
  );
}

export async function getSchoolYearFieldFridaySignupsForAdmin(): Promise<
  SchoolYearFieldFridaySignup[]
> {
  const client = createAdminClient();

  const [portal, fridayPage] = await Promise.all([
    loadPortalSignups(client),
    loadFridayPageSignups(client),
  ]);

  return mergePortalAndFridayPageSignups(portal, fridayPage);
}
