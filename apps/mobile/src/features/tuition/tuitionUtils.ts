// Shared tuition types + formatters (moved from app/(tabs)/tuition.tsx).

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

export type StudentInfo = {
  id: string;
  name: string;
  profileImageUrl: string | null;
};

export type TxSection = { title: string; data: StripeTransaction[] };

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPaymentType(type: string): string {
  const map: Record<string, string> = {
    summer_tuition: "Summer Tuition",
    homeschool_dropin: "Homeschool Drop-In",
    aftercare_tuition: "Aftercare",
    fun_friday_tuition: "Fun Friday",
    supply_fee: "Supply Fee",
    school_year_tuition: "School Year Tuition",
    custom_tuition: "Tuition Payment",
  };
  return map[type] ?? type;
}

export function groupTransactionsByMonth(
  transactions: StripeTransaction[],
): TxSection[] {
  const groups: Record<string, StripeTransaction[]> = {};
  for (const tx of transactions) {
    const key = new Date(tx.created_at).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

/** Primary student + any siblings bundled into the same payment. */
export function studentsForTx(
  tx: StripeTransaction,
  student: StudentInfo | null,
  studentMap: Record<string, StudentInfo>,
): { all: StudentInfo[]; siblings: StudentInfo[]; sibIds: string[] } {
  const meta = tx.metadata as Record<string, string> | null;
  const sibIds = meta?.sibling_student_ids?.split(",").filter(Boolean) ?? [];
  const siblings = sibIds
    .map((id) => studentMap[id])
    .filter((s): s is StudentInfo => !!s);
  return { all: [...(student ? [student] : []), ...siblings], siblings, sibIds };
}

export function firstNames(students: StudentInfo[]): string {
  return students.length > 0
    ? students.map((s) => s.name.split(" ")[0]).join(" & ")
    : "—";
}
