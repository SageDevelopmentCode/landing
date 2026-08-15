import { HomeschoolSchoolYearSelectionSheet } from "@/components/billing/HomeschoolSchoolYearSelectionSheet";
import { SchoolYearAftercareSelectionSheet } from "@/components/billing/SchoolYearAftercareSelectionSheet";
import { SchoolYearBillingSection } from "@/components/billing/SchoolYearBillingSection";
import { SchoolYearFunFridaySelectionSheet } from "@/components/billing/SchoolYearFunFridaySelectionSheet";
import { SchoolYearTuitionSelectionSheet } from "@/components/billing/SchoolYearTuitionSelectionSheet";
import { SupplyFeeSelectionSheet } from "@/components/billing/SupplyFeeSelectionSheet";
import { TuitionCodeSheet } from "@/components/billing/TuitionCodeSheet";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import {
  BottomTabInset,
  Brand,
  FontFamilies,
  Spacing,
} from "@/constants/theme";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasSchoolYearContent,
  type ApplicationRow,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type StripeTransaction = {
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

type StudentInfo = {
  id: string;
  name: string;
  profileImageUrl: string | null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPaymentType(type: string): string {
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function groupTransactionsByMonth(
  transactions: StripeTransaction[],
): { title: string; data: StripeTransaction[] }[] {
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

// ─── AvatarCircle ─────────────────────────────────────────────────────────────

function AvatarCircle({
  student,
  size = 36,
}: {
  student: StudentInfo | null;
  size?: number;
}) {
  const fontSize = size * 0.36;
  if (student?.profileImageUrl) {
    return (
      <Image
        source={{ uri: student.profileImageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize }]}>
        {student ? getInitials(student.name) : "—"}
      </Text>
    </View>
  );
}

// ─── AvatarStack ──────────────────────────────────────────────────────────────

function AvatarStack({
  students,
  size = 40,
}: {
  students: StudentInfo[];
  size?: number;
}) {
  if (students.length <= 1) {
    return <AvatarCircle student={students[0] ?? null} size={size} />;
  }
  const visible = students.slice(0, 3);
  const offsetStep = size * 0.6;
  const totalWidth = size + (visible.length - 1) * offsetStep;
  return (
    <View style={{ width: totalWidth, height: size }}>
      {visible.map((s, i) => (
        <View
          key={s.id}
          style={{
            position: "absolute",
            left: i * offsetStep,
            top: 0,
            borderRadius: size / 2,
            borderWidth: i > 0 ? 2 : 0,
            borderColor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <AvatarCircle student={s} size={size} />
        </View>
      ))}
    </View>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === "completed";
  return (
    <View
      style={[styles.badge, isCompleted ? styles.badgeGreen : styles.badgeGray]}
    >
      <Text
        style={[
          styles.badgeText,
          isCompleted ? styles.badgeTextGreen : styles.badgeTextGray,
        ]}
      >
        {isCompleted ? "Paid" : status}
      </Text>
    </View>
  );
}

// ─── TransactionRow ───────────────────────────────────────────────────────────

function TransactionRow({
  tx,
  student,
  studentMap,
  onPress,
}: {
  tx: StripeTransaction;
  student: StudentInfo | null;
  studentMap: Record<string, StudentInfo>;
  onPress: () => void;
}) {
  const meta = tx.metadata as Record<string, string> | null;
  const sibIds = meta?.sibling_student_ids?.split(",").filter(Boolean) ?? [];
  const allStudents: StudentInfo[] = [
    ...(student ? [student] : []),
    ...sibIds.map((id) => studentMap[id]).filter((s): s is StudentInfo => !!s),
  ];
  const displayNames =
    allStudents.length > 0
      ? allStudents.map((s) => s.name.split(" ")[0]).join(" & ")
      : "—";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <AvatarStack students={allStudents} size={40} />
      <View style={styles.rowCenter}>
        <Text style={styles.rowDescription} numberOfLines={1}>
          {tx.description ?? formatPaymentType(tx.payment_type)}
        </Text>
        <Text style={styles.rowMeta}>
          {displayNames} · {formatDate(tx.created_at)}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatCents(tx.amount_cents)}</Text>
        <StatusBadge status={tx.status} />
      </View>
    </Pressable>
  );
}

// ─── TransactionDetailSheet ───────────────────────────────────────────────────

function ReceiptRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text
        style={[
          styles.receiptRowLabel,
          highlight && styles.receiptRowLabelHighlight,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.receiptRowValue,
          highlight && styles.receiptRowValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ReceiptDivider() {
  return (
    <View style={styles.receiptDividerWrap}>
      <View style={styles.receiptDivider} />
    </View>
  );
}

function TransactionDetailSheet({
  sheetRef,
  tx,
  student,
  studentMap,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  tx: StripeTransaction | null;
  student: StudentInfo | null;
  studentMap: Record<string, StudentInfo>;
}) {
  const meta = tx?.metadata as Record<string, string> | null;
  const sibIds = meta?.sibling_student_ids?.split(",").filter(Boolean) ?? [];
  const sibStudents = sibIds
    .map((id) => studentMap[id])
    .filter((s): s is StudentInfo => !!s);
  const allStudents: StudentInfo[] = [
    ...(student ? [student] : []),
    ...sibStudents,
  ];

  let childRows: { student: StudentInfo | null; amountCents: number | null }[] =
    [];
  if (tx && sibIds.length > 0 && tx.intended_amount_cents != null) {
    const sibCentsArr = (meta?.sibling_intended_cents ?? "")
      .split(",")
      .map(Number)
      .filter(Boolean);
    const sibTotal = sibCentsArr.reduce((a, b) => a + b, 0);
    const primaryIntended = tx.intended_amount_cents - sibTotal;
    childRows = [
      { student, amountCents: primaryIntended },
      ...sibStudents.map((s, i) => ({
        student: s,
        amountCents: sibCentsArr[i] ?? null,
      })),
    ];
  }

  const headerNames =
    allStudents.length > 0
      ? allStudents.map((s) => s.name.split(" ")[0]).join(" & ")
      : "—";

  const hasFee =
    tx != null &&
    tx.cover_fees === true &&
    tx.intended_amount_cents != null &&
    tx.amount_cents !== tx.intended_amount_cents;
  const feeCents =
    hasFee && tx ? tx.amount_cents - tx.intended_amount_cents! : 0;

  const caption = tx
    ? `${formatPaymentType(tx.payment_type)} · ${new Date(
        tx.created_at,
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`
    : "";

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["55%", "90%"]}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={styles.receiptContent}>
        {tx && (
          <>
            {/* Hero */}
            <View style={styles.receiptHero}>
              <AvatarStack students={allStudents} size={52} />
              <Text style={styles.receiptHeroNames}>{headerNames}</Text>
              <Text style={styles.receiptAmount}>
                {formatCents(tx.amount_cents)}
              </Text>
              <StatusBadge status={tx.status} />
              <Text style={styles.receiptCaption}>{caption}</Text>
            </View>

            <ReceiptDivider />

            {/* Children breakdown */}
            {childRows.length > 0 && (
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionLabel}>Children</Text>
                {childRows.map((row, i) => (
                  <View key={i} style={styles.receiptChildRow}>
                    <AvatarCircle student={row.student} size={28} />
                    <Text style={styles.receiptChildName} numberOfLines={1}>
                      {row.student?.name ?? "—"}
                    </Text>
                    {row.amountCents != null && (
                      <Text style={styles.receiptChildAmount}>
                        {formatCents(row.amountCents)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Summary */}
            <View style={styles.receiptSection}>
              <Text style={styles.receiptSectionLabel}>Summary</Text>
              {tx.intended_amount_cents != null && (
                <ReceiptRow
                  label="Tuition"
                  value={formatCents(tx.intended_amount_cents)}
                />
              )}
              {hasFee && (
                <ReceiptRow
                  label="Processing Fee"
                  value={formatCents(feeCents)}
                />
              )}
              <ReceiptRow
                label="Total Paid"
                value={formatCents(tx.amount_cents)}
                highlight
              />
            </View>

            {/* Payer */}
            {(tx.payer_name || tx.payer_email) && (
              <>
                <ReceiptDivider />
                <View style={styles.receiptSection}>
                  <Text style={styles.receiptSectionLabel}>Payer</Text>
                  {tx.payer_name && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Name</Text>
                      <Text style={styles.receiptPayerValue} numberOfLines={1}>
                        {tx.payer_name}
                      </Text>
                    </View>
                  )}
                  {tx.payer_email && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Email</Text>
                      <Text style={styles.receiptPayerValue} numberOfLines={1}>
                        {tx.payer_email}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={styles.skeletonCenter}>
            <SkeletonBox width="70%" height={14} borderRadius={4} />
            <SkeletonBox
              width="45%"
              height={11}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <SkeletonBox width={56} height={14} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// ─── ChildTabRow ──────────────────────────────────────────────────────────────

function ChildTabRow({
  students,
  activeId,
  onSelect,
}: {
  students: StudentInfo[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.childTabRow}
      style={styles.childTabScroll}
    >
      {students.map((s) => {
        const active = s.id === activeId;
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(s.id)}
            style={({ pressed }) => [
              styles.childTab,
              active && styles.childTabActive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <AvatarCircle student={s} size={22} />
            <Text
              style={[styles.childTabName, active && styles.childTabNameActive]}
              numberOfLines={1}
            >
              {s.name.split(" ")[0]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function CheckMockup() {
  return (
    <View style={styles.checkMockupWrap}>
      <View style={styles.checkMockup}>
        {/* Top row: routing lines + date */}
        <View style={styles.checkMockupTopRow}>
          <View style={styles.checkMockupRouting}>
            <View style={styles.checkMockupRoutingLine} />
            <View style={[styles.checkMockupRoutingLine, { width: 24 }]} />
            <View style={[styles.checkMockupRoutingLine, { width: 16 }]} />
          </View>
          <View style={styles.checkMockupDateWrap}>
            <Text style={styles.checkMockupLabel}>Date</Text>
            <View style={styles.checkMockupUnderline} />
          </View>
        </View>

        {/* Pay to row */}
        <View style={styles.checkMockupPaySection}>
          <Text style={styles.checkMockupLabel}>Pay to the Order of</Text>
          <View style={styles.checkMockupPayRow}>
            <View style={styles.checkHighlight}>
              <Text style={styles.checkHighlightText}>Sage Field LLC</Text>
            </View>
            <View style={styles.checkMockupAmountBox}>
              <Text style={styles.checkMockupLabel}>$</Text>
              <View style={[styles.checkMockupUnderline, { flex: 1 }]} />
            </View>
          </View>
        </View>

        {/* Memo row */}
        <View style={styles.checkMockupMemoSection}>
          <View style={styles.checkMockupMemoRow}>
            <Text style={styles.checkMockupLabel}>Memo </Text>
            <View style={styles.checkHighlight}>
              <Text style={styles.checkHighlightText} numberOfLines={1}>
                Sage Field 2026 – Wks 1, 2, 3
              </Text>
            </View>
          </View>
          <View style={styles.checkMockupDivider} />
        </View>

        {/* MICR stub */}
        <View style={styles.checkMockupMicr}>
          <Text style={styles.checkMockupMicrText}>⑆ 0000 ⑆ 0000 0000 ⑆</Text>
        </View>
      </View>
      <Text style={styles.checkMockupCaption}>
        Example — your check should look like this
      </Text>
    </View>
  );
}

// ─── CheckInstructionsSheet ───────────────────────────────────────────────────

function CheckInstructionsSheet({
  sheetRef,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
}) {
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["70%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={styles.checkSheetContent}>
        <Text style={styles.checkSheetTitle}>Pay by Check</Text>
        <Text style={styles.checkSheetNote}>No processing fee</Text>

        <CheckMockup />

        <View style={styles.checkStepList}>
          {/* Step 1 */}
          <View style={styles.checkStep}>
            <View style={styles.checkStepBadge}>
              <Text style={styles.checkStepBadgeText}>1</Text>
            </View>
            <View style={styles.checkStepContent}>
              <Text style={styles.checkStepTitle}>Make the check out to</Text>
              <Text style={styles.checkStepBody}>Sage Field LLC</Text>
            </View>
          </View>

          <View style={styles.checkStepDivider} />

          {/* Step 2 */}
          <View style={styles.checkStep}>
            <View style={styles.checkStepBadge}>
              <Text style={styles.checkStepBadgeText}>2</Text>
            </View>
            <View style={styles.checkStepContent}>
              <Text style={styles.checkStepTitle}>On the memo line, write</Text>
              <Text style={styles.checkStepBody}>
                Include your child's name, weeks, and the program name — e.g.{" "}
                <Text style={{ fontFamily: FontFamilies.bodySemiBold }}>
                  "Sage Field 2026 – Weeks 1, 2, 3"
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.checkStepDivider} />

          {/* Step 3 */}
          <View style={styles.checkStep}>
            <View style={styles.checkStepBadge}>
              <Text style={styles.checkStepBadgeText}>3</Text>
            </View>
            <View style={styles.checkStepContent}>
              <Text style={styles.checkStepTitle}>Drop it off</Text>
              <Text style={styles.checkStepBody}>
                Bring it on the first day you come in.
              </Text>
            </View>
          </View>

          <View style={styles.checkStepDivider} />

          {/* Step 4 */}
          <View style={styles.checkStep}>
            <View style={styles.checkStepBadge}>
              <Text style={styles.checkStepBadgeText}>4</Text>
            </View>
            <View style={styles.checkStepContent}>
              <Text style={styles.checkStepTitle}>Questions?</Text>
              <Text
                style={[styles.checkStepBody, styles.checkSheetEmail]}
                onPress={() => Linking.openURL("mailto:sabrina@sagefield.co")}
              >
                sabrina@sagefield.co
              </Text>
            </View>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TuitionScreen() {
  const router = useRouter();
  const { effectiveParentId } = useAuth();
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, StudentInfo>>({});
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [paidSupplyFeeByStudent, setPaidSupplyFeeByStudent] = useState<
    Record<string, boolean>
  >({});
  const [paidSchoolYearByStudent, setPaidSchoolYearByStudent] = useState<
    Record<string, number[]>
  >({});
  const [paidAftercareByStudent, setPaidAftercareByStudent] = useState<
    Record<string, { months: string[]; days: string[] }>
  >({});
  const [paidFunFridayByStudent, setPaidFunFridayByStudent] = useState<
    Record<string, { months: string[]; fridays: string[] }>
  >({});
  const [paidHomeschoolByStudent, setPaidHomeschoolByStudent] =
    useState<PaidHomeschoolByStudent>({});
  const [selectionStudentId, setSelectionStudentId] = useState<string | null>(
    null,
  );
  const [selectionHomeschoolApp, setSelectionHomeschoolApp] =
    useState<ApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<StripeTransaction | null>(null);
  const hasLoaded = useRef(false);
  const detailSheetRef = useRef<BottomSheetModal>(null);
  const supplyFeeSheetRef = useRef<BottomSheetModal>(null);
  const schoolYearTuitionSheetRef = useRef<BottomSheetModal>(null);
  const homeschoolSheetRef = useRef<BottomSheetModal>(null);
  const aftercareSheetRef = useRef<BottomSheetModal>(null);
  const funFridaySheetRef = useRef<BottomSheetModal>(null);
  const tuitionCodeSheetRef = useRef<BottomSheetModal>(null);
  const checkSheetRef = useRef<BottomSheetModal>(null);

  async function fetchAll() {
    if (!effectiveParentId) return;
    setError(null);
    try {
      const [txResult, appResult] = await Promise.all([
        supabase
          .schema("billing")
          .from("stripe_transactions")
          .select("*")
          .eq("parent_id", effectiveParentId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabase
          .schema("parent_app")
          .from("applications")
          .select(
            "id, student_id, status, program, drop_in_program, child_legal_name, child_grade",
          )
          .eq("user_id", effectiveParentId)
          .eq("approved", true)
          .in("program", [
            "summer_26",
            "both",
            "homeschool_drop_in",
            "school_year_26_27",
          ]),
      ]);

      const txData: StripeTransaction[] = txResult.data ?? [];
      const appData: ApplicationRow[] = appResult.data ?? [];

      setTransactions(txData);
      setApplications(appData);

      const supplyFeeMap: Record<string, boolean> = {};
      const schoolYearMap: Record<string, number[]> = {};
      const aftercareMap: Record<string, { months: string[]; days: string[] }> =
        {};
      const funFridayMap: Record<
        string,
        { months: string[]; fridays: string[] }
      > = {};
      const homeschoolMap: PaidHomeschoolByStudent = {};

      for (const tx of txData) {
        if (tx.status !== "completed" || !tx.student_id) continue;
        const meta = tx.metadata as Record<string, string> | null;

        if (tx.payment_type === "supply_fee") {
          supplyFeeMap[tx.student_id] = true;
          if (
            meta?.bundle_type === "homeschool" &&
            meta.bundle_homeschool_tier
          ) {
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
          const months = (meta?.selected_months ?? "")
            .split(",")
            .filter(Boolean);
          const fridays = (meta?.selected_fridays ?? "")
            .split(",")
            .filter(Boolean);
          const prev = funFridayMap[tx.student_id] ?? {
            months: [],
            fridays: [],
          };
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

      setPaidSupplyFeeByStudent(supplyFeeMap);
      setPaidSchoolYearByStudent(schoolYearMap);
      setPaidAftercareByStudent(aftercareMap);
      setPaidFunFridayByStudent(funFridayMap);
      setPaidHomeschoolByStudent(homeschoolMap);

      // Collect all student IDs from both transactions and applications
      const studentIds = [
        ...new Set(
          [
            ...txData.map((t) => t.student_id),
            ...appData.map((a) => a.student_id),
          ].filter(Boolean) as string[],
        ),
      ];

      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .schema("admin")
          .from("students")
          .select("id, child_legal_name, profile_image_url")
          .in("id", studentIds);

        const map: Record<string, StudentInfo> = {};
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
        setStudentMap(map);

        // Default to the first enrolled student
        const firstEnrolled = appData.find((a) => a.status === "enrolled");
        if (firstEnrolled) {
          setActiveChildId((prev) => prev ?? firstEnrolled.student_id);
        }
      } else {
        setStudentMap({});
      }
    } catch (err) {
      notifyError("parent-tuition-fetch", err);
      setError("Something went wrong loading billing data.");
    }
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [effectiveParentId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded.current) {
        hasLoaded.current = true;
        return;
      }
      fetchAll();
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }

  function openDetail(tx: StripeTransaction) {
    setSelectedTx(tx);
    detailSheetRef.current?.present();
  }

  const visibleTransactions = transactions.filter((tx) => {
    const meta = tx.metadata as Record<string, string> | null;
    if (meta?.is_sibling_split === "true") return false;
    if (meta?.bundled_with_supply_fee === "true") return false;
    return true;
  });
  const sections = groupTransactionsByMonth(visibleTransactions);

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
      activeChildId != null &&
      hasSchoolYearContent(applications, activeChildId),
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tuition & Billing</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/help")}
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(tx) => tx.id}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Brand.sage700}
            />
          }
          ListHeaderComponent={
            <>
              {/* Child tabs + billing cards */}
              {enrolledStudents.length > 0 && (
                <>
                  {enrolledStudents.length > 1 && (
                    <ChildTabRow
                      students={enrolledStudents}
                      activeId={activeChildId}
                      onSelect={setActiveChildId}
                    />
                  )}
                  {showSchoolYearSection && activeChildId && (
                    <SchoolYearBillingSection
                      activeStudentId={activeChildId}
                      applications={activeApplications}
                      allApplications={applications}
                      studentMap={studentMap}
                      paidSupplyFeeByStudent={paidSupplyFeeByStudent}
                      paidSchoolYearByStudent={paidSchoolYearByStudent}
                      paidHomeschoolByStudent={paidHomeschoolByStudent}
                      paidFunFridayByStudent={paidFunFridayByStudent}
                      showMultiChildSchoolYearBanner={
                        showMultiChildSchoolYearBanner
                      }
                      onSelectSupplyFee={() => {
                        setSelectionStudentId(activeChildId);
                        supplyFeeSheetRef.current?.present();
                      }}
                      onSelectSchoolYearTuition={() => {
                        setSelectionStudentId(activeChildId);
                        schoolYearTuitionSheetRef.current?.present();
                      }}
                      onSelectHomeschool={(app) => {
                        setSelectionStudentId(activeChildId);
                        setSelectionHomeschoolApp(app);
                        homeschoolSheetRef.current?.present();
                      }}
                      onSelectAftercare={() => {
                        setSelectionStudentId(activeChildId);
                        aftercareSheetRef.current?.present();
                      }}
                      onSelectFunFriday={() => {
                        setSelectionStudentId(activeChildId);
                        funFridaySheetRef.current?.present();
                      }}
                      onTuitionCodePress={() =>
                        tuitionCodeSheetRef.current?.present()
                      }
                      onCheckPress={() => checkSheetRef.current?.present()}
                    />
                  )}
                </>
              )}

              {/* Payment history label */}
              {transactions.length > 0 && (
                <Text style={styles.historyLabel}>Payment History</Text>
              )}
            </>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeader}>{title}</Text>
            </View>
          )}
          renderItem={({ item: tx }) => (
            <TransactionRow
              tx={tx}
              student={studentMap[tx.student_id ?? ""] ?? null}
              studentMap={studentMap}
              onPress={() => openDetail(tx)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No payment history yet.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <TransactionDetailSheet
        sheetRef={detailSheetRef}
        tx={selectedTx}
        student={
          selectedTx ? (studentMap[selectedTx.student_id ?? ""] ?? null) : null
        }
        studentMap={studentMap}
      />

      <SupplyFeeSelectionSheet
        sheetRef={supplyFeeSheetRef}
        student={
          selectionStudentId ? (studentMap[selectionStudentId] ?? null) : null
        }
        applications={
          selectionStudentId
            ? applications.filter(
                (a) =>
                  a.student_id === selectionStudentId && a.status === "enrolled",
              )
            : []
        }
        allApplications={applications.filter((a) => a.status === "enrolled")}
        paidSchoolYearByStudent={paidSchoolYearByStudent}
        paidHomeschoolByStudent={paidHomeschoolByStudent}
        paidSupplyFeeByStudent={paidSupplyFeeByStudent}
        studentMap={studentMap}
        onSuccess={fetchAll}
      />

      <SchoolYearTuitionSelectionSheet
        sheetRef={schoolYearTuitionSheetRef}
        student={
          selectionStudentId ? (studentMap[selectionStudentId] ?? null) : null
        }
        application={
          applications.find(
            (a) =>
              a.student_id === selectionStudentId &&
              a.status === "enrolled" &&
              (a.program === "school_year_26_27" || a.program === "both"),
          ) ?? null
        }
        paidMonthIndices={paidSchoolYearByStudent[selectionStudentId ?? ""] ?? []}
        siblingApplications={applications.filter(
          (a) =>
            a.student_id !== selectionStudentId &&
            a.status === "enrolled" &&
            (a.program === "school_year_26_27" || a.program === "both") &&
            paidSupplyFeeByStudent[a.student_id],
        )}
        paidSchoolYearByStudent={paidSchoolYearByStudent}
        paidSupplyFeeByStudent={paidSupplyFeeByStudent}
        siblingStudentMap={studentMap}
        onSuccess={fetchAll}
      />

      <HomeschoolSchoolYearSelectionSheet
        sheetRef={homeschoolSheetRef}
        student={
          selectionStudentId ? (studentMap[selectionStudentId] ?? null) : null
        }
        application={selectionHomeschoolApp}
        paidMonthIndices={homeschoolPaidMonths}
        siblingApplications={applications.filter(
          (a) =>
            a.id !== selectionHomeschoolApp?.id &&
            a.status === "enrolled" &&
            a.program === "homeschool_drop_in" &&
            (a.drop_in_program === "school_year_26_27" ||
              a.drop_in_program === "both") &&
            paidSupplyFeeByStudent[a.student_id],
        )}
        paidHomeschoolByStudent={paidHomeschoolByStudent}
        siblingStudentMap={studentMap}
        onSuccess={fetchAll}
      />

      <SchoolYearAftercareSelectionSheet
        sheetRef={aftercareSheetRef}
        student={
          selectionStudentId ? (studentMap[selectionStudentId] ?? null) : null
        }
        application={addonApplication}
        paidAftercare={paidAftercareByStudent[selectionStudentId ?? ""]}
        onSuccess={fetchAll}
      />

      <SchoolYearFunFridaySelectionSheet
        sheetRef={funFridaySheetRef}
        student={
          selectionStudentId ? (studentMap[selectionStudentId] ?? null) : null
        }
        application={addonApplication}
        paidFunFriday={paidFunFridayByStudent[selectionStudentId ?? ""]}
        onSuccess={fetchAll}
      />

      {effectiveParentId ? (
        <TuitionCodeSheet
          sheetRef={tuitionCodeSheetRef}
          parentId={effectiveParentId}
          onSuccess={fetchAll}
        />
      ) : null}

      <CheckInstructionsSheet sheetRef={checkSheetRef} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: "#111827",
  },

  // Avatar
  avatarFallback: {
    backgroundColor: "#E8F0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage800,
  },

  // Child tabs
  childTabScroll: {
    flexGrow: 0,
  },
  childTabRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  childTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  childTabActive: {
    backgroundColor: "rgba(74,124,89,0.1)",
    borderColor: Brand.sage700,
  },
  childTabName: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    maxWidth: 90,
  },
  childTabNameActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },

  // Billing section
  billingSection: {
    marginBottom: 4,
  },
  billingSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  billingSectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  checkTextBtn: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    textDecorationLine: "underline",
  },
  cardGrid: {
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  cardGridRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardGridItem: {
    flex: 1,
  },

  // Program card
  programCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  programCardDisabled: {
    opacity: 0.72,
  },
  cardBannerWrap: {
    height: 110,
  },
  cardBannerImage: {
    width: "100%",
    height: "100%",
  },
  cardProgramLabel: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  cardOptionalBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardOptionalBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#374151",
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
    lineHeight: 18,
  },
  cardTitleDisabled: {
    color: "#6B7280",
  },
  cardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardStatusLine: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
  },
  cardStatusDisabled: {
    color: "#9CA3AF",
  },

  // History label
  historyLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },

  // Section header
  sectionHeaderWrap: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },

  // Transaction row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#ffffff",
  },
  rowPressed: {
    backgroundColor: "#F9FAFB",
  },
  rowCenter: {
    flex: 1,
    gap: 3,
  },
  rowDescription: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
  },
  rowMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9CA3AF",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  rowAmount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
  },

  // Badge
  badge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeGreen: { backgroundColor: "#dcfce7" },
  badgeGray: { backgroundColor: "#f3f4f6" },
  badgeText: { fontSize: 11, fontFamily: FontFamilies.bodySemiBold },
  badgeTextGreen: { color: "#15803d" },
  badgeTextGray: { color: "#6b7280" },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9CA3AF",
  },

  // Error
  errorWrap: {
    margin: Spacing.three,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: Spacing.three,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#B91C1C",
  },

  // Skeleton
  skeletonWrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: 4,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  skeletonCenter: {
    flex: 1,
    gap: 6,
  },

  listContent: {
    paddingBottom: BottomTabInset + 16,
  },

  sibBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: Spacing.three,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: "rgba(94,124,104,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(94,124,104,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sibBannerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage800,
  },
  sibBannerSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    lineHeight: 17,
  },

  // Receipt detail sheet
  receiptContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 48,
    paddingTop: 8,
  },
  receiptHero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    gap: 6,
  },
  receiptHeroNames: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  receiptAmount: {
    fontFamily: FontFamilies.heading,
    fontSize: 38,
    color: "#111827",
    letterSpacing: -0.5,
  },
  receiptCaption: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  receiptDividerWrap: {
    overflow: "hidden",
    marginVertical: 4,
  },
  receiptDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
  },
  receiptSection: {
    marginTop: 8,
  },
  receiptSectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#9CA3AF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  receiptRowLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
  },
  receiptRowLabelHighlight: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },
  receiptRowValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  receiptRowValueHighlight: {
    fontSize: 15,
    color: Brand.sage700,
  },
  receiptChildRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  receiptChildName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
  },
  receiptChildAmount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  receiptPayerValue: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
    textAlign: "right",
  },

  // Check instructions sheet
  checkSheetContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 48,
    paddingTop: 16,
  },
  checkSheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#111827",
    marginBottom: 6,
  },
  checkSheetNote: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  checkSheetEmail: {
    color: Brand.sage700,
    textDecorationLine: "underline",
  },
  checkStepList: {
    marginTop: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  checkStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  checkStepDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginLeft: 14 + 24 + 12,
  },
  checkStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(74,124,89,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkStepBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage800,
  },
  checkStepContent: {
    flex: 1,
    gap: 3,
  },
  checkStepTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  checkStepBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },

  // Check mockup
  checkMockupWrap: {
    marginTop: 20,
    marginBottom: 4,
    gap: 8,
  },
  checkMockup: {
    backgroundColor: "#FAFAF5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74,124,89,0.2)",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  checkMockupTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkMockupRouting: {
    gap: 3,
  },
  checkMockupRoutingLine: {
    height: 2,
    width: 32,
    backgroundColor: "rgba(74,124,89,0.15)",
    borderRadius: 1,
  },
  checkMockupDateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkMockupUnderline: {
    height: 1,
    width: 60,
    backgroundColor: "#D1D5DB",
  },
  checkMockupPaySection: {
    gap: 4,
  },
  checkMockupPayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  checkMockupAmountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
    minWidth: 72,
  },
  checkMockupMemoSection: {
    gap: 6,
  },
  checkMockupMemoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  checkMockupDivider: {
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  checkMockupMicr: {
    alignItems: "center",
    paddingTop: 2,
  },
  checkMockupMicrText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#D1D5DB",
    letterSpacing: 1,
  },
  checkMockupLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9CA3AF",
  },
  checkHighlight: {
    backgroundColor: "rgba(74,124,89,0.1)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 1,
  },
  checkHighlightText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage800,
  },
  checkMockupCaption: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
});
