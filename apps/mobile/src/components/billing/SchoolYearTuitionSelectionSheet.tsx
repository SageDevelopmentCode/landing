import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import type { ApplicationRow } from "@/lib/school-year-billing";
import {
  getGradeTier,
  SCHOOL_YEAR_MONTHS,
  schoolYearTuitionCents,
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

type SiblingState = {
  included: boolean;
  months: number[];
  dirty: boolean;
  editorOpen: boolean;
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function SchoolYearTuitionSelectionSheet({
  sheetRef,
  student,
  application,
  paidMonthIndices,
  siblingApplications = [],
  paidSchoolYearByStudent = {},
  paidSupplyFeeByStudent = {},
  siblingStudentMap = {},
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  student: StudentInfo | null;
  application: ApplicationRow | null;
  paidMonthIndices: number[];
  siblingApplications?: ApplicationRow[];
  paidSchoolYearByStudent?: Record<string, number[]>;
  paidSupplyFeeByStudent?: Record<string, boolean>;
  siblingStudentMap?: Record<string, StudentInfo>;
  onSuccess?: () => void;
}) {
  const { pay, loading, error } = useStripePayment();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<"select" | "sibling" | "payment">("select");
  const [siblingStates, setSiblingStates] = useState<
    Record<string, SiblingState>
  >({});

  const paidSet = useMemo(() => new Set(paidMonthIndices), [paidMonthIndices]);
  const monthlyCents = schoolYearTuitionCents(application?.child_grade ?? null);
  const primaryCents = selected.size * monthlyCents;

  const eligibleSiblings = useMemo(() => {
    if (!application) return [];
    return siblingApplications.filter((sib) => {
      if (sib.student_id === application.student_id) return false;
      if (!paidSupplyFeeByStudent[sib.student_id]) return false;
      const paid = paidSchoolYearByStudent[sib.student_id] ?? [];
      if (paid.length >= SCHOOL_YEAR_MONTHS.length) return false;
      return Array.from(selected).some((m) => !paid.includes(m));
    });
  }, [
    application,
    siblingApplications,
    paidSupplyFeeByStudent,
    paidSchoolYearByStudent,
    selected,
  ]);

  useEffect(() => {
    if (eligibleSiblings.length === 0) return;
    setSiblingStates((prev) => {
      const next = { ...prev };
      for (const sib of eligibleSiblings) {
        const paid = paidSchoolYearByStudent[sib.student_id] ?? [];
        const defaultMonths = Array.from(selected).filter((m) => !paid.includes(m));
        if (!next[sib.student_id]) {
          next[sib.student_id] = {
            included: true,
            months: defaultMonths,
            dirty: false,
            editorOpen: false,
          };
        } else if (!next[sib.student_id].dirty) {
          next[sib.student_id] = { ...next[sib.student_id], months: defaultMonths };
        }
      }
      return next;
    });
  }, [
    eligibleSiblings.map((s) => s.student_id).join(","),
    Array.from(selected).sort().join(","),
    paidSchoolYearByStudent,
  ]);

  function getSiblingCents(sib: ApplicationRow): number {
    const paid = paidSchoolYearByStudent[sib.student_id] ?? [];
    const state = siblingStates[sib.student_id];
    const months = state?.months ?? Array.from(selected).filter((m) => !paid.includes(m));
    return months.length * schoolYearTuitionCents(sib.child_grade);
  }

  const includedSiblingCents = eligibleSiblings
    .filter((s) => siblingStates[s.student_id]?.included)
    .reduce((sum, s) => sum + getSiblingCents(s), 0);

  const combinedCents = primaryCents + includedSiblingCents;

  function reset() {
    setSelected(new Set());
    setStep("select");
    setSiblingStates({});
  }

  function toggleSiblingMonth(studentId: string, monthIndex: number) {
    const paid = paidSchoolYearByStudent[studentId] ?? [];
    if (paid.includes(monthIndex)) return;
    setSiblingStates((prev) => {
      const current = prev[studentId];
      const months = new Set(current?.months ?? []);
      if (months.has(monthIndex)) months.delete(monthIndex);
      else months.add(monthIndex);
      return {
        ...prev,
        [studentId]: {
          ...current,
          included: current?.included ?? true,
          months: Array.from(months).sort((a, b) => a - b),
          dirty: true,
          editorOpen: current?.editorOpen ?? false,
        },
      };
    });
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!application) return;
    const siblings = eligibleSiblings
      .filter((sib) => siblingStates[sib.student_id]?.included)
      .map((sib) => {
        const paid = paidSchoolYearByStudent[sib.student_id] ?? [];
        const state = siblingStates[sib.student_id];
        const months =
          state?.months ?? Array.from(selected).filter((m) => !paid.includes(m));
        return {
          studentId: sib.student_id,
          gradeTier: getGradeTier(sib.child_grade),
          selectedMonths: months,
          intendedAmountCents: getSiblingCents(sib),
          studentName: siblingStudentMap[sib.student_id]?.name,
        };
      });

    const success = await pay(
      "/api/stripe/create-school-year-tuition-checkout",
      {
        studentId: application.student_id,
        intendedAmountCents: primaryCents,
        selectedMonths: Array.from(selected).sort((a, b) => a - b),
        coverFees,
        paymentMethod,
        siblings,
      },
    );
    if (success) {
      sheetRef.current?.dismiss();
      onSuccess?.();
    }
  }

  const lineItems = [
    {
      studentName: student?.name.split(" ")[0] ?? "Student",
      programLabel: "School Year Tuition",
      detail: `${selected.size} month${selected.size !== 1 ? "s" : ""}`,
      amountCents: primaryCents,
    },
    ...eligibleSiblings
      .filter((sib) => siblingStates[sib.student_id]?.included)
      .map((sib) => ({
        studentName:
          siblingStudentMap[sib.student_id]?.name.split(" ")[0] ?? "Sibling",
        programLabel: "School Year Tuition",
        detail: `${siblingStates[sib.student_id]?.months.length ?? 0} month${
          (siblingStates[sib.student_id]?.months.length ?? 0) !== 1 ? "s" : ""
        }`,
        amountCents: getSiblingCents(sib),
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
      {step === "payment" ? (
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <PaymentMethodStep
            intendedAmountCents={combinedCents}
            lineItems={lineItems}
            onBack={() =>
              setStep(eligibleSiblings.length > 0 ? "sibling" : "select")
            }
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : step === "sibling" ? (
        <View style={s.flex}>
          <View style={s.header}>
            <Pressable onPress={() => setStep("select")} hitSlop={12}>
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
              const state = siblingStates[sib.student_id];
              const name = siblingStudentMap[sib.student_id]?.name ?? "Sibling";
              const paid = paidSchoolYearByStudent[sib.student_id] ?? [];
              const cents = getSiblingCents(sib);
              return (
                <Pressable
                  key={sib.student_id}
                  style={[s.sibCard, state?.included && s.sibCardActive]}
                  onPress={() =>
                    setSiblingStates((prev) => ({
                      ...prev,
                      [sib.student_id]: {
                        ...prev[sib.student_id],
                        included: !prev[sib.student_id]?.included,
                        editorOpen: false,
                      },
                    }))
                  }
                >
                  <View style={s.sibRow}>
                    <View style={[s.sibCheck, state?.included && s.sibCheckOn]}>
                      {state?.included && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sibName}>{name}</Text>
                      <Text style={s.sibDetail}>
                        {state?.months.length ?? 0} month
                        {(state?.months.length ?? 0) !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <Text style={s.sibAmt}>{formatCents(cents)}</Text>
                  </View>
                  {state?.included && (
                    <>
                      <Pressable
                        style={s.editRow}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSiblingStates((prev) => ({
                            ...prev,
                            [sib.student_id]: {
                              ...prev[sib.student_id],
                              editorOpen: !prev[sib.student_id]?.editorOpen,
                            },
                          }));
                        }}
                      >
                        <Text style={s.editText}>
                          {state.editorOpen ? "Hide months" : "Edit months"}
                        </Text>
                      </Pressable>
                      {state.editorOpen && (
                        <View style={s.monthGrid}>
                          {SCHOOL_YEAR_MONTHS.map((m) => {
                            const isPaid = paid.includes(m.index);
                            const isSelected =
                              isPaid || (state.months?.includes(m.index) ?? false);
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
          <Text style={s.title}>School Year Tuition</Text>
          {student ? (
            <Text style={s.subtitle}>{student.name.split(" ")[0]}</Text>
          ) : null}
          <Text style={s.sectionLabel}>
            Select months · {formatCents(monthlyCents)}/mo
          </Text>
          <View style={s.monthGrid}>
            {SCHOOL_YEAR_MONTHS.map((m) => {
              const isPaid = paidSet.has(m.index);
              const isSelected = selected.has(m.index);
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
                    setSelected((prev) => {
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
                  {isPaid && <Text style={s.paidTag}>Paid</Text>}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[s.primaryBtn, selected.size === 0 && s.primaryBtnDisabled]}
            disabled={selected.size === 0}
            onPress={() => {
              if (eligibleSiblings.length > 0) setStep("sibling");
              else setStep("payment");
            }}
          >
            <Text style={s.primaryBtnText}>
              Continue · {formatCents(primaryCents)}
            </Text>
          </Pressable>
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
    marginBottom: 10,
  },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthChip: {
    width: "18%",
    minWidth: 56,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
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
  paidTag: { fontSize: 9, color: "#15803d", marginTop: 2 },
  primaryBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
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
