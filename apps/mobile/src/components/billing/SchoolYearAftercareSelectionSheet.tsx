import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import {
  SchoolYearMonthlyMonthGrid,
  type SchoolYearMonthGridItem,
} from "@/components/billing/SchoolYearMonthlyMonthGrid";
import { FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import type { ApplicationRow } from "@/lib/school-year-billing";
import {
  AFTERCARE_DAILY_CENTS,
  AFTERCARE_MONTHLY_CENTS,
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  schoolYearAftercareMonthCents,
} from "@/lib/school-year";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type StudentInfo = { id: string; name: string; profileImageUrl: string | null };

const ACCENT = "#E07A3A";
const ACCENT_TINT = "#FFF7F3";

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function SchoolYearAftercareSelectionSheet({
  sheetRef,
  student,
  application,
  paidAftercare,
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  student: StudentInfo | null;
  application: ApplicationRow | null;
  paidAftercare: { months: string[]; days: string[] } | undefined;
  onSuccess?: () => void;
}) {
  const { pay, loading, error } = useStripePayment();
  const [tab, setTab] = useState<"monthly" | "daily">("monthly");
  const [selMonths, setSelMonths] = useState<Set<string>>(new Set());
  const [selDays, setSelDays] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => m.key)),
  );
  const [step, setStep] = useState<"select" | "payment">("select");

  const paidMonths = useMemo(
    () => new Set(paidAftercare?.months ?? []),
    [paidAftercare],
  );
  const paidDays = useMemo(
    () => new Set(paidAftercare?.days ?? []),
    [paidAftercare],
  );

  const monthlyTotal = useMemo(
    () =>
      SCHOOL_YEAR_AFTERCARE_MONTHS.filter((m) => selMonths.has(m.key)).reduce(
        (sum, m) => sum + schoolYearAftercareMonthCents(m),
        0,
      ),
    [selMonths],
  );

  const dailyTotal = selDays.size * AFTERCARE_DAILY_CENTS;
  const totalCents = tab === "monthly" ? monthlyTotal : dailyTotal;

  const canContinue =
    tab === "monthly" ? selMonths.size > 0 : selDays.size > 0;

  const monthGridItems: SchoolYearMonthGridItem[] = useMemo(
    () =>
      SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => {
        const isPaid = paidMonths.has(m.key);
        const partialCount = isPaid
          ? 0
          : m.days.filter((d) => paidDays.has(d.date)).length;
        const monthCents = schoolYearAftercareMonthCents(m);
        const priceLabel =
          monthCents === AFTERCARE_MONTHLY_CENTS
            ? `${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
            : formatCents(monthCents);
        return {
          key: m.key,
          label: m.label,
          subtitle: `${m.days.length} days · ${priceLabel}`,
          partialPaidLabel:
            partialCount > 0
              ? `· ${partialCount} day${partialCount !== 1 ? "s" : ""} paid`
              : undefined,
        };
      }),
    [paidMonths, paidDays],
  );

  const monthlySummaryLabel = useMemo(() => {
    if (selMonths.size === 0) return "No months selected";
    const sel = SCHOOL_YEAR_AFTERCARE_MONTHS.filter((m) =>
      selMonths.has(m.key),
    );
    const allNormal = sel.every(
      (m) => schoolYearAftercareMonthCents(m) === AFTERCARE_MONTHLY_CENTS,
    );
    return allNormal
      ? `${sel.length} month${sel.length !== 1 ? "s" : ""} × ${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
      : `${sel.length} month${sel.length !== 1 ? "s" : ""} selected`;
  }, [selMonths]);

  const continueLabel =
    tab === "monthly"
      ? selMonths.size > 0
        ? `Continue · ${formatCents(monthlyTotal)}`
        : "Select months to continue"
      : selDays.size > 0
        ? `Continue · ${formatCents(dailyTotal)}`
        : "Select days to continue";

  function reset() {
    setTab("monthly");
    setSelMonths(new Set());
    setSelDays(new Set());
    setExpanded(new Set(SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => m.key)));
    setStep("select");
  }

  function toggleMonth(key: string) {
    if (paidMonths.has(key)) return;
    setSelMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!application) return;
    const success = await pay("/api/stripe/create-aftercare-checkout", {
      studentId: application.student_id,
      applicationId: application.id,
      planType: tab,
      selectedMonths: Array.from(selMonths),
      selectedDays: Array.from(selDays),
      intendedAmountCents: totalCents,
      coverFees,
      paymentMethod,
    });
    if (success) {
      sheetRef.current?.dismiss();
      onSuccess?.();
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["90%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={reset}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      {step === "payment" ? (
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <PaymentMethodStep
            intendedAmountCents={totalCents}
            lineItems={[
              {
                studentName: student?.name.split(" ")[0] ?? "Student",
                programLabel: "Extended Learning",
                detail:
                  tab === "monthly"
                    ? `${selMonths.size} month${selMonths.size !== 1 ? "s" : ""}`
                    : `${selDays.size} session${selDays.size !== 1 ? "s" : ""}`,
                amountCents: totalCents,
              },
            ]}
            onBack={() => setStep("select")}
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : (
        <View style={s.flex}>
          <View style={s.sheetHeader}>
            <Text style={s.title}>Extended Learning — School Year 26–27</Text>
            {student ? (
              <View style={s.studentRow}>
                <Text style={s.subtitle}>{student.name.split(" ")[0]}</Text>
                {application?.child_grade ? (
                  <View style={s.gradeBadge}>
                    <Text style={s.gradeBadgeText}>
                      {application.child_grade}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={s.tabRow}>
            <Pressable
              style={[s.tab, tab === "monthly" && s.tabOn]}
              onPress={() => setTab("monthly")}
            >
              <Text style={[s.tabText, tab === "monthly" && s.tabTextOn]}>
                Monthly
              </Text>
            </Pressable>
            <Pressable
              style={[s.tab, tab === "daily" && s.tabOn]}
              onPress={() => setTab("daily")}
            >
              <Text style={[s.tabText, tab === "daily" && s.tabTextOn]}>
                Daily
              </Text>
            </Pressable>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {tab === "monthly" ? (
              <>
                <Text style={s.instruction}>
                  Select the months you'd like Extended Learning coverage for.
                </Text>
                <SchoolYearMonthlyMonthGrid
                  months={monthGridItems}
                  selectedKeys={selMonths}
                  paidKeys={paidMonths}
                  accentColor={ACCENT}
                  accentTintBg={ACCENT_TINT}
                  onToggle={toggleMonth}
                />
                <View
                  style={[
                    s.summaryBar,
                    selMonths.size > 0 && { backgroundColor: ACCENT_TINT },
                  ]}
                >
                  <Text style={s.summaryLabel}>{monthlySummaryLabel}</Text>
                  <Text style={[s.summaryTotal, { color: ACCENT }]}>
                    {selMonths.size > 0 ? formatCents(monthlyTotal) : "—"}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={s.instruction}>
                  Select individual days you'd like Extended Learning. $35/day.
                </Text>
                {SCHOOL_YEAR_AFTERCARE_MONTHS.map((month) => {
                  const isOpen = expanded.has(month.key);
                  const selectedInMonth = month.days.filter((d) =>
                    selDays.has(d.date),
                  ).length;
                  const paidInMonth = month.days.filter((d) =>
                    paidDays.has(d.date),
                  ).length;
                  return (
                    <View key={month.key} style={s.accordion}>
                      <Pressable
                        style={s.accordionHeader}
                        onPress={() =>
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(month.key)) next.delete(month.key);
                            else next.add(month.key);
                            return next;
                          })
                        }
                      >
                        <View style={s.accordionHeaderLeft}>
                          <Text style={s.monthTitle}>{month.label}</Text>
                          {paidInMonth > 0 && (
                            <View style={s.countBadgePaid}>
                              <Text style={s.countBadgePaidText}>
                                {paidInMonth} paid
                              </Text>
                            </View>
                          )}
                          {selectedInMonth > 0 && (
                            <View
                              style={[
                                s.countBadgeSel,
                                { backgroundColor: ACCENT },
                              ]}
                            >
                              <Text style={s.countBadgeSelText}>
                                {selectedInMonth} selected
                              </Text>
                            </View>
                          )}
                        </View>
                        <Ionicons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={16}
                          color="#9CA3AF"
                        />
                      </Pressable>
                      {isOpen && (
                        <View style={s.daysGrid}>
                          {month.days.map((d) => {
                            const isPaid = paidDays.has(d.date);
                            const isSelected = selDays.has(d.date);
                            return (
                              <Pressable
                                key={d.date}
                                disabled={isPaid}
                                style={[
                                  s.dayChip,
                                  isPaid && s.dayChipPaid,
                                  isSelected && s.dayChipOn,
                                ]}
                                onPress={() =>
                                  setSelDays((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(d.date)) next.delete(d.date);
                                    else next.add(d.date);
                                    return next;
                                  })
                                }
                              >
                                <Text
                                  style={[
                                    s.dayChipText,
                                    isPaid && s.dayChipTextPaid,
                                    isSelected && s.dayChipTextOn,
                                  ]}
                                >
                                  {d.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
                <View
                  style={[
                    s.summaryBar,
                    selDays.size > 0 && { backgroundColor: ACCENT_TINT },
                  ]}
                >
                  <Text style={s.summaryLabel}>
                    {selDays.size === 0
                      ? "No days selected"
                      : `${selDays.size} day${selDays.size !== 1 ? "s" : ""} × ${formatCents(AFTERCARE_DAILY_CENTS)}/day`}
                  </Text>
                  <Text style={[s.summaryTotal, { color: ACCENT }]}>
                    {selDays.size > 0 ? formatCents(dailyTotal) : "—"}
                  </Text>
                </View>
              </>
            )}
          </BottomSheetScrollView>

          <View style={s.footer}>
            <Pressable
              style={[s.primaryBtn, !canContinue && s.primaryBtnDisabled]}
              disabled={!canContinue}
              onPress={() => setStep("payment")}
            >
              <Text style={s.primaryBtnText}>{continueLabel}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 40 },
  sheetHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
  },
  gradeBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  gradeBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#4B5563",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#F3F4F6",
  },
  tabOn: {
    backgroundColor: ACCENT,
  },
  tabText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6B7280",
  },
  tabTextOn: { color: "#ffffff" },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 20,
  },
  instruction: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  summaryLabel: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    marginRight: 8,
  },
  summaryTotal: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: ACCENT,
  },
  accordion: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3F4F6",
    marginBottom: 10,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  monthTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  countBadgePaid: {
    backgroundColor: "#DCFCE7",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgePaidText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#15803D",
  },
  countBadgeSel: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeSelText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#ffffff",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  dayChipOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  dayChipPaid: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  dayChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#374151",
  },
  dayChipTextPaid: { color: "#15803D" },
  dayChipTextOn: { color: "#ffffff" },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
});
