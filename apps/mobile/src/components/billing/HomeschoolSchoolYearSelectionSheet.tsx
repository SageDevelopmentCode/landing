import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import { BillingPreviewBanner } from "@/components/billing/BillingPreviewBanner";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import type {
  ApplicationRow,
  PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import {
  getGradeTier,
  HOMESCHOOL_SCHOOL_YEAR_PRICING,
  HOMESCHOOL_TIERS,
  SCHOOL_YEAR_MONTHS,
  tierToDays,
  type HomeschoolTier,
} from "@/lib/school-year";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type StudentInfo = { id: string; name: string; profileImageUrl: string | null };

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function HomeschoolSchoolYearSelectionSheet({
  sheetRef,
  student,
  application,
  paidMonthIndices,
  siblingApplications = [],
  paidHomeschoolByStudent = {},
  siblingStudentMap = {},
  onSuccess,
  readOnly = false,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  student: StudentInfo | null;
  application: ApplicationRow | null;
  paidMonthIndices: number[];
  siblingApplications?: ApplicationRow[];
  paidHomeschoolByStudent?: PaidHomeschoolByStudent;
  siblingStudentMap?: Record<string, StudentInfo>;
  onSuccess?: () => void;
  readOnly?: boolean;
}) {
  const { pay, loading, error } = useStripePayment();
  const [step, setStep] = useState<"plan" | "sibling" | "payment">("plan");
  const [selectedTier, setSelectedTier] = useState<HomeschoolTier | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(
    new Set(),
  );
  const [includedSiblings, setIncludedSiblings] = useState<
    Record<string, boolean>
  >({});
  const [siblingMonthOverrides, setSiblingMonthOverrides] = useState<
    Record<string, Set<number>>
  >({});
  const [siblingEditorOpen, setSiblingEditorOpen] = useState<
    Record<string, boolean>
  >({});
  const [siblingEditorDirty, setSiblingEditorDirty] = useState<
    Record<string, boolean>
  >({});

  const paidSet = useMemo(() => new Set(paidMonthIndices), [paidMonthIndices]);
  const gradeTier = getGradeTier(application?.child_grade ?? null);
  const pricePerMonth = selectedTier
    ? HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][gradeTier]
    : 0;
  const primaryCents = pricePerMonth * selectedMonths.size;
  const requiredDays =
    selectedTier === "dropin" ? 1 : selectedTier === "2day" ? 2 : 3;
  const canContinue =
    selectedTier !== null &&
    selectedMonths.size > 0 &&
    selectedWeekdays.size === requiredDays;

  const getSiblingPaidMonths = (studentId: string) =>
    new Set(
      (paidHomeschoolByStudent[studentId]?.schoolYear ?? []).flatMap(
        (entry) => entry.weeks,
      ),
    );

  const eligibleSiblings = useMemo(() => {
    if (!selectedTier) return [];
    return siblingApplications.filter((sib) => {
      const paidMonths = getSiblingPaidMonths(sib.student_id);
      return Array.from(selectedMonths).some((m) => !paidMonths.has(m));
    });
  }, [siblingApplications, selectedMonths, selectedTier, paidHomeschoolByStudent]);

  useEffect(() => {
    setIncludedSiblings((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [s.student_id, prev[s.student_id] ?? true]),
      ),
    );
    setSiblingEditorDirty((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => [s.student_id, prev[s.student_id] ?? false]),
      ),
    );
    setSiblingMonthOverrides((prev) =>
      Object.fromEntries(
        eligibleSiblings.map((s) => {
          if (siblingEditorDirty[s.student_id])
            return [s.student_id, prev[s.student_id] ?? new Set()];
          const paidMonths = getSiblingPaidMonths(s.student_id);
          const defaultMonths = Array.from(selectedMonths).filter(
            (m) => !paidMonths.has(m),
          );
          return [s.student_id, new Set(defaultMonths)];
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eligibleSiblings.map((s) => s.student_id).join(","),
    Array.from(selectedMonths).sort().join(","),
  ]);

  function toggleSiblingMonth(studentId: string, monthIndex: number) {
    const paidMonths = getSiblingPaidMonths(studentId);
    if (paidMonths.has(monthIndex)) return;
    setSiblingEditorDirty((prev) => ({ ...prev, [studentId]: true }));
    setSiblingMonthOverrides((prev) => {
      const next = new Set(prev[studentId] ?? []);
      if (next.has(monthIndex)) next.delete(monthIndex);
      else next.add(monthIndex);
      return { ...prev, [studentId]: next };
    });
  }

  const siblingPayloads =
    selectedTier === null
      ? []
      : eligibleSiblings
          .filter((sib) => includedSiblings[sib.student_id])
          .map((sib) => {
            const sibGradeTier = getGradeTier(sib.child_grade);
            const paidMonths = getSiblingPaidMonths(sib.student_id);
            const override = siblingMonthOverrides[sib.student_id];
            const sibMonths = override
              ? Array.from(override)
                  .filter((m) => !paidMonths.has(m))
                  .sort((a, b) => a - b)
              : Array.from(selectedMonths)
                  .filter((m) => !paidMonths.has(m))
                  .sort((a, b) => a - b);
            const sibDays = Array.from(selectedWeekdays);
            return {
              studentId: sib.student_id,
              applicationId: sib.id,
              tier: selectedTier,
              gradeTier: sibGradeTier,
              selectedDays: sibDays,
              selectedWeeks: sibMonths,
              weekSelectionsJson: JSON.stringify(
                sibMonths.map((w) => ({ week: w, days: sibDays })),
              ),
              intendedAmountCents:
                HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][sibGradeTier] *
                sibMonths.length,
              studentName: siblingStudentMap[sib.student_id]?.name,
            };
          });

  const combinedCents =
    primaryCents +
    siblingPayloads.reduce((sum, s) => sum + s.intendedAmountCents, 0);

  useEffect(() => {
    if (readOnly && step !== "plan") {
      setStep("plan");
    }
  }, [readOnly, step]);

  function reset() {
    setStep("plan");
    setSelectedTier(null);
    setSelectedMonths(new Set());
    setSelectedWeekdays(new Set());
    setIncludedSiblings({});
    setSiblingMonthOverrides({});
    setSiblingEditorOpen({});
    setSiblingEditorDirty({});
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!application || !selectedTier) return;
    const selectedWeeks = Array.from(selectedMonths).sort((a, b) => a - b);
    const selectedDays = Array.from(selectedWeekdays);
    const success = await pay("/api/stripe/create-homeschool-checkout", {
      studentId: application.student_id,
      applicationId: application.id,
      program: "school_year_26_27",
      tier: selectedTier,
      gradeTier,
      selectedDays,
      selectedWeeks,
      weekSelectionsJson: JSON.stringify(
        selectedWeeks.map((w) => ({ week: w, days: selectedDays })),
      ),
      intendedAmountCents: primaryCents,
      coverFees,
      paymentMethod,
      siblings: siblingPayloads,
    });
    if (success) {
      sheetRef.current?.dismiss();
      onSuccess?.();
    }
  }

  const lineItems = [
    {
      studentName: student?.name.split(" ")[0] ?? "Student",
      programLabel: "Homeschool Drop-In",
      detail: `${selectedMonths.size} month${selectedMonths.size !== 1 ? "s" : ""}`,
      amountCents: primaryCents,
    },
    ...siblingPayloads.map((sib) => ({
      studentName: sib.studentName?.split(" ")[0] ?? "Sibling",
      programLabel: "Homeschool Drop-In",
      detail: `${sib.selectedWeeks.length} month${sib.selectedWeeks.length !== 1 ? "s" : ""}`,
      amountCents: sib.intendedAmountCents,
    })),
  ];

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
      {step === "payment" && !readOnly ? (
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <PaymentMethodStep
            intendedAmountCents={combinedCents}
            lineItems={lineItems}
            onBack={() =>
              setStep(eligibleSiblings.length > 0 ? "sibling" : "plan")
            }
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : step === "sibling" && !readOnly ? (
        <View style={s.flex}>
          <View style={s.header}>
            <Pressable onPress={() => setStep("plan")} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#374151" />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Bundle a Sibling?</Text>
              <Text style={s.headerSub}>Pay for multiple children at once</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
          <BottomSheetScrollView
            contentContainerStyle={{ padding: Spacing.three, gap: 12, paddingBottom: 24 }}
          >
            {eligibleSiblings.map((sib) => {
              const paidMonths = getSiblingPaidMonths(sib.student_id);
              const override = siblingMonthOverrides[sib.student_id];
              const sibMonths = override
                ? Array.from(override)
                    .filter((m) => !paidMonths.has(m))
                    .sort((a, b) => a - b)
                : Array.from(selectedMonths)
                    .filter((m) => !paidMonths.has(m))
                    .sort((a, b) => a - b);
              const sibGradeTier = getGradeTier(sib.child_grade);
              const sibAmount = selectedTier
                ? HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][sibGradeTier] *
                  sibMonths.length
                : 0;
              const name = siblingStudentMap[sib.student_id]?.name ?? "Sibling";
              const isIncluded = includedSiblings[sib.student_id] ?? true;
              const isEditorOpen = siblingEditorOpen[sib.student_id] ?? false;

              return (
                <Pressable
                  key={sib.student_id}
                  style={[s.sibCard, isIncluded && s.sibCardActive]}
                  onPress={() => {
                    setIncludedSiblings((prev) => ({
                      ...prev,
                      [sib.student_id]: !prev[sib.student_id],
                    }));
                    setSiblingEditorOpen((prev) => ({
                      ...prev,
                      [sib.student_id]: false,
                    }));
                  }}
                >
                  <View style={s.sibRow}>
                    <View style={[s.sibCheck, isIncluded && s.sibCheckOn]}>
                      {isIncluded && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sibName}>{name}</Text>
                      <Text style={s.sibDetail}>
                        {sibMonths.length} month{sibMonths.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <Text style={s.sibAmt}>{formatCents(sibAmount)}</Text>
                  </View>
                  {isIncluded && (
                    <>
                      <Pressable
                        style={s.editRow}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSiblingEditorOpen((prev) => ({
                            ...prev,
                            [sib.student_id]: !isEditorOpen,
                          }));
                        }}
                      >
                        <Text style={s.editText}>
                          {isEditorOpen ? "Hide months" : "Edit months"}
                        </Text>
                      </Pressable>
                      {isEditorOpen && (
                        <View style={s.monthGrid}>
                          {SCHOOL_YEAR_MONTHS.map((m) => {
                            const isPaid = paidMonths.has(m.index);
                            const isSelected =
                              isPaid ||
                              (override
                                ? override.has(m.index)
                                : sibMonths.includes(m.index));
                            return (
                              <Pressable
                                key={m.index}
                                disabled={isPaid}
                                style={[
                                  s.monthChip,
                                  isPaid && s.monthChipPaid,
                                  isSelected && !isPaid && s.monthChipOn,
                                ]}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  toggleSiblingMonth(sib.student_id, m.index);
                                }}
                              >
                                <Text
                                  style={[
                                    s.monthChipText,
                                    isPaid && s.monthChipTextPaid,
                                    isSelected && !isPaid && s.monthChipTextOn,
                                  ]}
                                >
                                  {m.short}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}
                </Pressable>
              );
            })}
          </BottomSheetScrollView>
          <View style={s.footer}>
            <Pressable style={s.primaryBtn} onPress={() => setStep("payment")}>
              <Text style={s.primaryBtnText}>
                Continue · {formatCents(combinedCents)}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={s.content}>
          {readOnly ? <BillingPreviewBanner /> : null}
          <Text style={s.title}>Homeschool Drop-In</Text>
          {student ? (
            <Text style={s.subtitle}>
              {student.name.split(" ")[0]} · School Year 26–27
            </Text>
          ) : null}

          <Text style={s.sectionLabel}>Plan</Text>
          {HOMESCHOOL_TIERS.map((tier) => (
            <Pressable
              key={tier.key}
              style={[s.row, selectedTier === tier.key && s.rowSelected]}
              onPress={() => {
                setSelectedTier(tier.key);
                setSelectedWeekdays(new Set(tierToDays(tier.key)));
              }}
            >
              <View>
                <Text style={s.rowTitle}>{tier.label}</Text>
                <Text style={s.rowSub}>{tier.sub}</Text>
              </View>
              <Ionicons
                name={
                  selectedTier === tier.key
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={selectedTier === tier.key ? Brand.sage700 : "#9CA3AF"}
              />
            </Pressable>
          ))}

          <Text style={s.sectionLabel}>Months</Text>
          <View style={s.monthGrid}>
            {SCHOOL_YEAR_MONTHS.map((m) => {
              const isPaid = paidSet.has(m.index);
              const isSelected = selectedMonths.has(m.index);
              return (
                <Pressable
                  key={m.index}
                  disabled={isPaid}
                  style={[
                    s.monthChip,
                    isPaid && s.monthChipPaid,
                    isSelected && s.monthChipOn,
                  ]}
                  onPress={() =>
                    setSelectedMonths((prev) => {
                      const next = new Set(prev);
                      if (next.has(m.index)) next.delete(m.index);
                      else next.add(m.index);
                      return next;
                    })
                  }
                >
                  <Text
                    style={[
                      s.monthChipText,
                      isPaid && s.monthChipTextPaid,
                      isSelected && s.monthChipTextOn,
                    ]}
                  >
                    {m.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.sectionLabel}>Weekdays</Text>
          <View style={s.monthGrid}>
            {["mon", "tue", "wed", "thu"].map((d) => (
              <Pressable
                key={d}
                style={[
                  s.monthChip,
                  selectedWeekdays.has(d) && s.monthChipOn,
                ]}
                onPress={() =>
                  setSelectedWeekdays((prev) => {
                    const next = new Set(prev);
                    if (next.has(d)) next.delete(d);
                    else next.add(d);
                    return next;
                  })
                }
              >
                <Text
                  style={[
                    s.monthChipText,
                    selectedWeekdays.has(d) && s.monthChipTextOn,
                  ]}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedTier && (
            <Text style={s.priceNote}>
              {formatCents(pricePerMonth)}/mo × {selectedMonths.size} ={" "}
              {formatCents(primaryCents)}
            </Text>
          )}

          {!readOnly ? (
            <Pressable
              style={[s.primaryBtn, !canContinue && s.primaryBtnDisabled]}
              disabled={!canContinue}
              onPress={() => {
                if (eligibleSiblings.length > 0) setStep("sibling");
                else setStep("payment");
              }}
            >
              <Text style={s.primaryBtnText}>
                Continue · {formatCents(primaryCents)}
              </Text>
            </Pressable>
          ) : null}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#111827",
  },
  headerSub: { fontFamily: FontFamilies.body, fontSize: 12, color: "#9CA3AF" },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowSelected: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(74,124,89,0.06)",
  },
  rowTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
  },
  rowSub: { fontFamily: FontFamilies.body, fontSize: 12, color: "#9CA3AF" },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthChipOn: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
  monthChipPaid: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  monthChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  monthChipTextOn: { color: "#ffffff" },
  monthChipTextPaid: { color: "#15803d" },
  priceNote: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  sibCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
  },
  sibCardActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(74,124,89,0.06)",
  },
  sibRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sibCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  sibCheckOn: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
  sibName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
  },
  sibDetail: { fontFamily: FontFamilies.body, fontSize: 12, color: "#6B7280" },
  sibAmt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  editRow: { marginTop: 10 },
  editText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
});
