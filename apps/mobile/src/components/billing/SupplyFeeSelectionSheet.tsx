import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import {
  resolveSupplyFeeProgramType,
  type ApplicationRow,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import {
  BUNDLE_MONTH_INDEX,
  getGradeTier,
  HOMESCHOOL_SCHOOL_YEAR_PRICING,
  HOMESCHOOL_TIERS,
  SCHOOL_YEAR_MONTHS,
  SUPPLY_FEE_CENTS,
  schoolYearTuitionCents,
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

export function SupplyFeeSelectionSheet({
  sheetRef,
  student,
  applications,
  allApplications,
  paidSchoolYearByStudent,
  paidHomeschoolByStudent,
  paidSupplyFeeByStudent,
  studentMap,
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  student: StudentInfo | null;
  applications: ApplicationRow[];
  allApplications: ApplicationRow[];
  paidSchoolYearByStudent: Record<string, number[]>;
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
  studentMap: Record<string, StudentInfo>;
  onSuccess?: () => void;
}) {
  const { pay, loading, error } = useStripePayment();
  const [step, setStep] = useState<"sibling" | "plan" | "dropin" | "payment">(
    "plan",
  );
  const [selectedSiblingIds, setSelectedSiblingIds] = useState<Set<string>>(
    new Set(),
  );
  const [addBundle, setAddBundle] = useState(false);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedHomeschoolBundleIds, setSelectedHomeschoolBundleIds] =
    useState<Set<string>>(new Set());
  const [selectedTier, setSelectedTier] = useState<HomeschoolTier | null>(
    null,
  );
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<Set<number>>(
    new Set(),
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(
    new Set(),
  );

  const studentId = student?.id ?? "";
  const programType = resolveSupplyFeeProgramType(applications, studentId);
  const childGrade =
    applications.find((a) => a.student_id === studentId)?.child_grade ?? null;
  const paidSchoolYearMonths = paidSchoolYearByStudent[studentId] ?? [];

  const siblingCandidates = useMemo(() => {
    return allApplications
      .filter(
        (a) =>
          a.student_id !== studentId &&
          a.status === "enrolled" &&
          !paidSupplyFeeByStudent[a.student_id] &&
          (a.program === "school_year_26_27" ||
            a.program === "both" ||
            (a.program === "homeschool_drop_in" &&
              (a.drop_in_program === "school_year_26_27" ||
                a.drop_in_program === "both"))),
      )
      .map((a) => ({
        studentId: a.student_id,
        name: studentMap[a.student_id]?.name ?? a.child_legal_name ?? "Student",
        grade: a.child_grade,
        programType: resolveSupplyFeeProgramType([a], a.student_id),
        applicationId: a.id,
      }));
  }, [allApplications, studentId, studentMap, paidSupplyFeeByStudent]);

  useEffect(() => {
    setStep(siblingCandidates.length > 0 ? "sibling" : "plan");
    setSelectedSiblingIds(new Set(siblingCandidates.map((s) => s.studentId)));
  }, [studentId, siblingCandidates]);

  const showAugustBundle =
    programType === "school_year"
      ? !paidSchoolYearMonths.includes(BUNDLE_MONTH_INDEX)
      : programType === "homeschool";

  const primaryBundleCents =
    programType === "school_year" && addBundle
      ? schoolYearTuitionCents(childGrade)
      : programType === "homeschool" && addBundle && selectedTier
        ? HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][getGradeTier(childGrade)] *
          selectedMonthIndices.size
        : 0;

  const siblingSupplyIds = Array.from(selectedSiblingIds);
  const siblingBundleAmounts = siblingSupplyIds.map((id) => {
    if (!selectedBundleIds.has(id)) return 0;
    const grade =
      allApplications.find((a) => a.student_id === id)?.child_grade ?? null;
    return schoolYearTuitionCents(grade);
  });
  const siblingHomeschoolBundleAmounts = siblingSupplyIds.map((id) => {
    if (!selectedHomeschoolBundleIds.has(id) || !selectedTier) return 0;
    const grade =
      allApplications.find((a) => a.student_id === id)?.child_grade ?? null;
    return (
      HOMESCHOOL_SCHOOL_YEAR_PRICING[selectedTier][getGradeTier(grade)] *
      selectedMonthIndices.size
    );
  });

  const baseCents =
    SUPPLY_FEE_CENTS * (1 + siblingSupplyIds.length) +
    primaryBundleCents +
    siblingBundleAmounts.reduce((a, b) => a + b, 0) +
    siblingHomeschoolBundleAmounts.reduce((a, b) => a + b, 0);

  const requiredDays =
    selectedTier === "dropin" ? 1 : selectedTier === "2day" ? 2 : 3;

  function reset() {
    setStep(siblingCandidates.length > 0 ? "sibling" : "plan");
    setSelectedSiblingIds(new Set(siblingCandidates.map((s) => s.studentId)));
    setAddBundle(false);
    setSelectedBundleIds(new Set());
    setSelectedHomeschoolBundleIds(new Set());
    setSelectedTier(null);
    setSelectedMonthIndices(new Set());
    setSelectedWeekdays(new Set());
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!student) return;
    const body: Record<string, unknown> = {
      studentId: student.id,
      coverFees,
      paymentMethod,
      siblingStudentIds: siblingSupplyIds,
      siblingGrades: siblingSupplyIds.map(
        (id) =>
          allApplications.find((a) => a.student_id === id)?.child_grade ?? "",
      ),
      siblingBundleStudentIds: siblingSupplyIds.filter((id) =>
        selectedBundleIds.has(id),
      ),
      siblingBundleAmounts: siblingBundleAmounts.filter((_, i) =>
        selectedBundleIds.has(siblingSupplyIds[i]),
      ),
      siblingHomeschoolBundleStudentIds: siblingSupplyIds.filter((id) =>
        selectedHomeschoolBundleIds.has(id),
      ),
      siblingHomeschoolBundleAmounts: siblingHomeschoolBundleAmounts.filter(
        (_, i) => selectedHomeschoolBundleIds.has(siblingSupplyIds[i]),
      ),
      siblingHomeschoolApplicationIds: siblingSupplyIds
        .filter((id) => selectedHomeschoolBundleIds.has(id))
        .map(
          (id) =>
            allApplications.find((a) => a.student_id === id)?.id ?? "",
        ),
      siblingHomeschoolGradeTiers: siblingSupplyIds
        .filter((id) => selectedHomeschoolBundleIds.has(id))
        .map((id) =>
          getGradeTier(
            allApplications.find((a) => a.student_id === id)?.child_grade ??
              null,
          ),
        ),
    };

    if (addBundle && programType === "school_year") {
      body.bundleType = "school_year_tuition";
      body.bundleAmountCents = primaryBundleCents;
      body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
    } else if (addBundle && programType === "homeschool" && selectedTier) {
      body.bundleType = "homeschool";
      body.bundleAmountCents = primaryBundleCents;
      body.bundleHomeschoolTier = selectedTier;
      body.bundleHomeschoolGradeTier = getGradeTier(childGrade);
      body.bundleHomeschoolApplicationId =
        applications.find((a) => a.student_id === studentId)?.id ?? "";
      body.bundleHomeschoolSelectedDays = Array.from(selectedMonthIndices);
      body.bundleHomeschoolWeekSelectionsJson = JSON.stringify(
        Array.from(selectedMonthIndices).map((w) => ({
          week: w,
          days: Array.from(selectedWeekdays),
        })),
      );
    }

    const success = await pay("/api/stripe/create-supply-fee-checkout", body);
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
        <BottomSheetScrollView
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <PaymentMethodStep
            intendedAmountCents={baseCents}
            lineItems={[
              {
                studentName: student?.name.split(" ")[0] ?? "Student",
                programLabel: "Supply Fee",
                detail:
                  siblingSupplyIds.length > 0
                    ? `${1 + siblingSupplyIds.length} children`
                    : "Annual supply fee",
                amountCents: baseCents,
              },
            ]}
            onBack={() => setStep(programType === "homeschool" && addBundle ? "dropin" : "plan")}
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : (
        <BottomSheetScrollView
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>Annual Supply Fee</Text>
          {student ? (
            <Text style={s.subtitle}>{student.name.split(" ")[0]}</Text>
          ) : null}

          {step === "sibling" && (
            <>
              <Text style={s.sectionLabel}>Include siblings?</Text>
              {siblingCandidates.map((sib) => {
                const selected = selectedSiblingIds.has(sib.studentId);
                return (
                  <Pressable
                    key={sib.studentId}
                    style={[s.row, selected && s.rowSelected]}
                    onPress={() =>
                      setSelectedSiblingIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(sib.studentId)) next.delete(sib.studentId);
                        else next.add(sib.studentId);
                        return next;
                      })
                    }
                  >
                    <Text style={s.rowText}>{sib.name.split(" ")[0]}</Text>
                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={20}
                      color={selected ? Brand.sage700 : "#9CA3AF"}
                    />
                  </Pressable>
                );
              })}
              <Pressable style={s.primaryBtn} onPress={() => setStep("plan")}>
                <Text style={s.primaryBtnText}>Continue</Text>
              </Pressable>
            </>
          )}

          {step === "plan" && (
            <>
              <View style={s.feeCard}>
                <Text style={s.feeLabel}>Supply fee</Text>
                <Text style={s.feeAmount}>{formatCents(SUPPLY_FEE_CENTS)}</Text>
                {siblingSupplyIds.length > 0 && (
                  <Text style={s.feeNote}>
                    + {siblingSupplyIds.length} sibling
                    {siblingSupplyIds.length !== 1 ? "s" : ""} ×{" "}
                    {formatCents(SUPPLY_FEE_CENTS)}
                  </Text>
                )}
              </View>

              {showAugustBundle && (
                <>
                  <Pressable
                    style={[s.bundleToggle, addBundle && s.bundleToggleOn]}
                    onPress={() => setAddBundle((v) => !v)}
                  >
                    <Text style={s.bundleTitle}>
                      Add August {programType === "homeschool" ? "homeschool" : "tuition"}?
                    </Text>
                    <Ionicons
                      name={addBundle ? "checkbox" : "square-outline"}
                      size={20}
                      color={addBundle ? Brand.sage700 : "#9CA3AF"}
                    />
                  </Pressable>
                  {addBundle && programType === "school_year" && (
                    <Text style={s.bundleNote}>
                      {formatCents(schoolYearTuitionCents(childGrade))} for August 2026
                    </Text>
                  )}
                  {addBundle && programType === "homeschool" && (
                    <Pressable
                      style={s.secondaryBtn}
                      onPress={() => setStep("dropin")}
                    >
                      <Text style={s.secondaryBtnText}>
                        {selectedTier
                          ? "Edit homeschool plan"
                          : "Configure homeschool plan"}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}

              {siblingSupplyIds.length > 0 && addBundle && (
                <>
                  <Text style={s.sectionLabel}>Sibling August bundles</Text>
                  {siblingSupplyIds.map((id, i) => {
                    const sib = siblingCandidates.find(
                      (c) => c.studentId === id,
                    );
                    if (!sib) return null;
                    const isHs = sib.programType === "homeschool";
                    const selected = isHs
                      ? selectedHomeschoolBundleIds.has(id)
                      : selectedBundleIds.has(id);
                    return (
                      <Pressable
                        key={id}
                        style={[s.row, selected && s.rowSelected]}
                        onPress={() => {
                          if (isHs) {
                            setSelectedHomeschoolBundleIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          } else {
                            setSelectedBundleIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          }
                        }}
                      >
                        <Text style={s.rowText}>
                          {sib.name.split(" ")[0]} — August bundle
                        </Text>
                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={20}
                          color={selected ? Brand.sage700 : "#9CA3AF"}
                        />
                      </Pressable>
                    );
                  })}
                </>
              )}

              <Pressable
                style={[
                  s.primaryBtn,
                  addBundle &&
                    programType === "homeschool" &&
                    (!selectedTier || selectedMonthIndices.size < 1) &&
                    s.primaryBtnDisabled,
                ]}
                disabled={
                  addBundle &&
                  programType === "homeschool" &&
                  (!selectedTier || selectedMonthIndices.size < 1)
                }
                onPress={() => setStep("payment")}
              >
                <Text style={s.primaryBtnText}>
                  Continue · {formatCents(baseCents)}
                </Text>
              </Pressable>
            </>
          )}

          {step === "dropin" && (
            <>
              <Text style={s.sectionLabel}>Select plan</Text>
              {HOMESCHOOL_TIERS.map((tier) => (
                <Pressable
                  key={tier.key}
                  style={[
                    s.row,
                    selectedTier === tier.key && s.rowSelected,
                  ]}
                  onPress={() => {
                    setSelectedTier(tier.key);
                    setSelectedWeekdays(new Set(tierToDays(tier.key)));
                  }}
                >
                  <Text style={s.rowText}>{tier.label}</Text>
                </Pressable>
              ))}
              <Text style={s.sectionLabel}>Months</Text>
              <View style={s.monthGrid}>
                {SCHOOL_YEAR_MONTHS.map((m) => (
                  <Pressable
                    key={m.index}
                    style={[
                      s.monthChip,
                      selectedMonthIndices.has(m.index) && s.monthChipOn,
                    ]}
                    onPress={() =>
                      setSelectedMonthIndices((prev) => {
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
                        selectedMonthIndices.has(m.index) && s.monthChipTextOn,
                      ]}
                    >
                      {m.short}
                    </Text>
                  </Pressable>
                ))}
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
              <Pressable
                style={[
                  s.primaryBtn,
                  (!selectedTier ||
                    selectedMonthIndices.size < 1 ||
                    selectedWeekdays.size !== requiredDays) &&
                    s.primaryBtnDisabled,
                ]}
                disabled={
                  !selectedTier ||
                  selectedMonthIndices.size < 1 ||
                  selectedWeekdays.size !== requiredDays
                }
                onPress={() => setStep("plan")}
              >
                <Text style={s.primaryBtnText}>Save plan</Text>
              </Pressable>
            </>
          )}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetContent: { padding: Spacing.three, paddingBottom: 40 },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
    marginBottom: 4,
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
  feeCard: {
    backgroundColor: "#f6faf7",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  feeLabel: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6B7280" },
  feeAmount: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: Brand.sage800,
  },
  feeNote: { fontFamily: FontFamilies.body, fontSize: 12, color: "#6B7280" },
  bundleToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  bundleToggleOn: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(74,124,89,0.06)",
  },
  bundleTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    flex: 1,
    paddingRight: 8,
  },
  bundleNote: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
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
  rowText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
  },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthChipOn: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
  monthChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  monthChipTextOn: { color: "#ffffff" },
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
  secondaryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
    textDecorationLine: "underline",
  },
});
