import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import { PaymentMethodStep, type LineItem } from "@/components/billing/PaymentMethodStep";

type StudentInfo = { id: string; name: string; profileImageUrl: string | null };
type ApplicationRow = { id: string; student_id: string; child_grade: string | null };

type SiblingState = {
  included: boolean;
  weeks: number[];
  dirty: boolean;
  editorOpen: boolean;
};

const SUMMER_WEEKS = [
  { week: 1,  range: "May 26 – 28",     theme: "Discovery" },
  { week: 2,  range: "Jun 1 – Jun 4",   theme: "Adventure" },
  { week: 3,  range: "Jun 8 – Jun 11",  theme: "Innovation" },
  { week: 4,  range: "Jun 15 – Jun 18", theme: "Nature" },
  { week: 5,  range: "Jun 22 – Jun 25", theme: "Arts" },
  { week: 6,  range: "Jun 29 – Jul 2",  theme: "Science" },
  { week: 7,  range: "Jul 6 – Jul 9",   theme: "Technology" },
  { week: 8,  range: "Jul 13 – Jul 16", theme: "Sports" },
  { week: 9,  range: "Jul 20 – Jul 23", theme: "Culture" },
  { week: 10, range: "Jul 27 – Jul 30", theme: "Leadership" },
  { week: 11, range: "Aug 3 – Aug 6",   theme: "Community" },
  { week: 12, range: "Aug 10 – Aug 13", theme: "Celebration" },
];

const PRICING = {
  primary: { weekly: 37500, full: 405000, fullOriginal: 450000 },
  upper:   { weekly: 35000, full: 378000, fullOriginal: 420000 },
};

function getGradeTier(grade: string | null): "primary" | "upper" {
  const g = (grade ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/grade$/, "");
  return ["prek", "prekindergarten", "k", "kindergarten", "1", "1st"].includes(g)
    ? "primary"
    : "upper";
}

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );
}

function chunkWeeks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function SummerSelectionSheet({
  sheetRef,
  student,
  application,
  paidWeeks,
  onSuccess,
  siblingApplications,
  siblingPaidWeeks,
  siblingStudentMap,
}: {
  sheetRef: React.RefObject<BottomSheetModal>;
  student: StudentInfo | null;
  application: ApplicationRow | null;
  paidWeeks: number[];
  onSuccess?: () => void;
  siblingApplications?: ApplicationRow[];
  siblingPaidWeeks?: Record<string, number[]>;
  siblingStudentMap?: Record<string, StudentInfo>;
}) {
  const [tab, setTab] = useState<"weekly" | "full">("weekly");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<"select" | "sibling" | "payment">("select");
  const [siblingStates, setSiblingStates] = useState<Record<string, SiblingState>>({});
  const { pay, loading, error } = useStripePayment();

  function reset() {
    setTab("weekly");
    setSelected(new Set());
    setStep("select");
    setSiblingStates({});
  }

  const gradeTier = getGradeTier(application?.child_grade ?? null);
  const pricing = PRICING[gradeTier];
  const paidSet = useMemo(() => new Set(paidWeeks), [paidWeeks]);
  const fullAvailable = paidWeeks.length === 0;
  const totalCents = tab === "full" ? pricing.full : selected.size * pricing.weekly;
  const canContinue = tab === "full" ? fullAvailable : selected.size > 0;

  const eligibleSiblings = useMemo(() => {
    return (siblingApplications ?? []).filter((sib) => {
      const paid = (siblingPaidWeeks ?? {})[sib.student_id] ?? [];
      if (paid.length >= 12) return false;
      if (tab === "full") return paid.length === 0;
      return Array.from(selected).some((w) => !paid.includes(w));
    });
  }, [siblingApplications, siblingPaidWeeks, tab, selected]);

  // Auto-sync sibling weeks when primary selection changes (non-dirty siblings only)
  useEffect(() => {
    if (eligibleSiblings.length === 0) return;
    setSiblingStates((prev) => {
      const next = { ...prev };
      for (const sib of eligibleSiblings) {
        const paid = (siblingPaidWeeks ?? {})[sib.student_id] ?? [];
        const defaultWeeks = Array.from(selected).filter((w) => !paid.includes(w));
        if (!next[sib.student_id]) {
          next[sib.student_id] = { included: true, weeks: defaultWeeks, dirty: false, editorOpen: false };
        } else if (!next[sib.student_id].dirty) {
          next[sib.student_id] = { ...next[sib.student_id], weeks: defaultWeeks };
        }
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleSiblings.map((s) => s.student_id).join(","), Array.from(selected).sort().join(",")]);

  function getSiblingCents(sib: ApplicationRow): number {
    const sibTier = getGradeTier(sib.child_grade ?? null);
    const paid = (siblingPaidWeeks ?? {})[sib.student_id] ?? [];
    const state = siblingStates[sib.student_id];
    const sibPlanType = tab === "full" && paid.length === 0 ? "full" : "weekly";
    const weeks = state?.weeks ?? [];
    return sibPlanType === "full" ? PRICING[sibTier].full : weeks.length * PRICING[sibTier].weekly;
  }

  const includedSiblingCents = eligibleSiblings
    .filter((s) => siblingStates[s.student_id]?.included)
    .reduce((sum, s) => sum + getSiblingCents(s), 0);

  const combinedIntendedCents = totalCents + includedSiblingCents;

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!application) return;
    const primaryGradeTier = getGradeTier(application.child_grade ?? null);

    const siblings = eligibleSiblings
      .filter((sib) => siblingStates[sib.student_id]?.included)
      .map((sib) => {
        const sibTier = getGradeTier(sib.child_grade ?? null);
        const paid = (siblingPaidWeeks ?? {})[sib.student_id] ?? [];
        const state = siblingStates[sib.student_id];
        const sibPlanType = tab === "full" && paid.length === 0 ? "full" : "weekly";
        return {
          studentId: sib.student_id,
          applicationId: sib.id,
          planType: sibPlanType,
          selectedWeeks: state?.weeks ?? [],
          gradeTier: sibTier,
          intendedAmountCents: getSiblingCents(sib),
          studentName: (siblingStudentMap ?? {})[sib.student_id]?.name,
        };
      });

    const success = await pay("/api/stripe/create-summer-checkout", {
      studentId: application.student_id,
      applicationId: application.id,
      planType: tab,
      selectedWeeks: tab === "weekly" ? Array.from(selected) : [],
      gradeTier: primaryGradeTier,
      intendedAmountCents: totalCents,
      coverFees,
      paymentMethod,
      siblings,
    });
    if (success) {
      sheetRef.current?.dismiss();
      onSuccess?.();
    }
  }

  function toggle(week: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
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
          contentContainerStyle={{ padding: Spacing.three, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <PaymentMethodStep
            intendedAmountCents={combinedIntendedCents}
            lineItems={[
              {
                studentName: student?.name.split(" ")[0] ?? "Student",
                programLabel: "Summer Program",
                detail: tab === "full"
                  ? "Full Summer · 12 weeks"
                  : `Weeks ${Array.from(selected).sort((a, b) => a - b).join(", ")}`,
                amountCents: totalCents,
              } as LineItem,
              ...eligibleSiblings
                .filter((sib) => siblingStates[sib.student_id]?.included)
                .map((sib): LineItem => {
                  const sibName = (siblingStudentMap ?? {})[sib.student_id]?.name.split(" ")[0] ?? "Sibling";
                  const paid = (siblingPaidWeeks ?? {})[sib.student_id] ?? [];
                  const state = siblingStates[sib.student_id];
                  const sibPlanType = tab === "full" && paid.length === 0 ? "full" : "weekly";
                  return {
                    studentName: sibName,
                    programLabel: "Summer Program",
                    detail: sibPlanType === "full"
                      ? "Full Summer · 12 weeks"
                      : `Weeks ${(state?.weeks ?? []).slice().sort((a, b) => a - b).join(", ")}`,
                    amountCents: getSiblingCents(sib),
                  };
                }),
            ]}
            onBack={() => eligibleSiblings.length > 0 ? setStep("sibling") : setStep("select")}
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : step === "sibling" ? (
        <View style={s.container}>
          {/* Header */}
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
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: Spacing.three, gap: 12, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {eligibleSiblings.map((sib) => {
              const state = siblingStates[sib.student_id];
              const name = (siblingStudentMap ?? {})[sib.student_id]?.name ?? "Sibling";
              const sibTier = getGradeTier(sib.child_grade ?? null);
              const paid = (siblingPaidWeeks ?? {})[sib.student_id] ?? [];
              const sibPlanType = tab === "full" && paid.length === 0 ? "full" : "weekly";
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
                      },
                    }))
                  }
                >
                  <View style={s.sibCardRow}>
                    <View style={[s.sibCheckbox, state?.included && s.sibCheckboxOn]}>
                      {state?.included && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.sibName}>{name}</Text>
                      <Text style={s.sibDetail}>
                        {sibTier === "primary" ? "Primary (Pre-K–1st)" : "Upper (2nd–4th)"} ·{" "}
                        {sibPlanType === "full"
                          ? "Full Summer"
                          : `${state?.weeks.length ?? 0} week${state?.weeks.length !== 1 ? "s" : ""}`}
                      </Text>
                    </View>
                    <Text style={s.sibAmt}>{formatCents(cents)}</Text>
                  </View>

                  {/* Edit weeks — weekly plan only */}
                  {state?.included && tab === "weekly" && (
                    <>
                      <Pressable
                        style={s.editWeeksRow}
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
                        <Text style={s.editWeeksText}>
                          {state.editorOpen ? "Hide weeks" : "Edit weeks"}
                        </Text>
                        <Ionicons
                          name={state.editorOpen ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={Brand.sage700}
                        />
                      </Pressable>

                      {state.editorOpen && (
                        <View style={s.sibWeekGrid}>
                          {SUMMER_WEEKS.map((w) => {
                            const isPaid = paid.includes(w.week);
                            const isSel = state.weeks.includes(w.week);
                            return (
                              <Pressable
                                key={w.week}
                                style={[
                                  s.sibWeekBtn,
                                  isPaid && s.sibWeekPaid,
                                  isSel && s.sibWeekSel,
                                ]}
                                disabled={isPaid}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setSiblingStates((prev) => {
                                    const cur = new Set(prev[sib.student_id]?.weeks ?? []);
                                    if (cur.has(w.week)) cur.delete(w.week);
                                    else cur.add(w.week);
                                    return {
                                      ...prev,
                                      [sib.student_id]: {
                                        ...prev[sib.student_id],
                                        weeks: Array.from(cur),
                                        dirty: true,
                                      },
                                    };
                                  });
                                }}
                              >
                                <Text
                                  style={[s.sibWeekBtnText, isSel && s.sibWeekBtnTextSel]}
                                >
                                  {w.week}
                                </Text>
                                {isPaid && (
                                  <Ionicons name="checkmark" size={9} color="#16A34A" />
                                )}
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

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Combined total</Text>
              <Text style={s.totalAmt}>{formatCents(combinedIntendedCents)}</Text>
            </View>
            <Pressable style={s.cta} onPress={() => setStep("payment")}>
              <Text style={s.ctaText}>Continue →</Text>
            </Pressable>
          </View>
        </View>
      ) : (
      <BottomSheetView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Summer Program</Text>
            {student && <Text style={s.headerSub}>{student.name}</Text>}
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Grade tier line */}
        <View style={s.tierRow}>
          <Text style={s.tierText}>
            {gradeTier === "primary" ? "Primary (Pre-K–1st)" : "Upper (2nd–4th)"} ·{" "}
            {formatCents(pricing.weekly)}/week
          </Text>
        </View>

        {/* Segmented control */}
        <View style={s.seg}>
          <Pressable
            style={[s.segTab, tab === "weekly" && s.segTabActive]}
            onPress={() => setTab("weekly")}
          >
            <Text style={[s.segTabText, tab === "weekly" && s.segTabTextActive]}>
              Weekly
            </Text>
          </Pressable>
          <Pressable
            style={[
              s.segTab,
              tab === "full" && s.segTabActive,
              !fullAvailable && s.segTabDimmed,
            ]}
            onPress={() => fullAvailable && setTab("full")}
          >
            <Text
              style={[
                s.segTabText,
                tab === "full" && s.segTabTextActive,
                !fullAvailable && s.segTabTextDimmed,
              ]}
            >
              Full Summer
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <BottomSheetScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === "weekly" ? (
            <>
              {chunkWeeks(SUMMER_WEEKS, 3).map((row, i) => (
                <View key={i} style={s.weekRow}>
                  {row.map((w) => {
                    const paid = paidSet.has(w.week);
                    const sel = selected.has(w.week);
                    return (
                      <Pressable
                        key={w.week}
                        style={[
                          s.weekTile,
                          paid && s.weekTilePaid,
                          sel && s.weekTileSel,
                        ]}
                        onPress={() => !paid && toggle(w.week)}
                        disabled={paid}
                      >
                        <Text
                          style={[
                            s.weekNum,
                            paid && s.weekNumPaid,
                            sel && s.weekNumSel,
                          ]}
                        >
                          Wk {w.week}
                        </Text>
                        <Text
                          style={[
                            s.weekRange,
                            paid && s.weekRangePaid,
                            sel && s.weekRangeSel,
                          ]}
                          numberOfLines={2}
                        >
                          {w.range}
                        </Text>
                        <Text
                          style={[
                            s.weekTheme,
                            paid && s.weekThemePaid,
                            sel && s.weekThemeSel,
                          ]}
                          numberOfLines={1}
                        >
                          {paid ? "✓ Paid" : w.theme}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {row.length < 3 && <View style={{ flex: 3 - row.length }} />}
                </View>
              ))}
            </>
          ) : (
            <View style={s.fullCard}>
              <View style={s.fullPriceRow}>
                <Text style={s.fullPrice}>{formatCents(pricing.full)}</Text>
                <Text style={s.fullOriginal}>{formatCents(pricing.fullOriginal)}</Text>
                <View style={s.saveBadge}>
                  <Text style={s.saveBadgeText}>Save 10%</Text>
                </View>
              </View>
              <View style={s.divider} />
              {SUMMER_WEEKS.map((w) => (
                <View key={w.week} style={s.fullRow}>
                  <Ionicons name="checkmark-circle" size={15} color={Brand.sage700} />
                  <Text style={s.fullRowText}>
                    Week {w.week} · {w.range} · {w.theme}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              {tab === "full"
                ? "Full summer (12 weeks)"
                : `${selected.size} week${selected.size !== 1 ? "s" : ""} selected`}
            </Text>
            {canContinue && <Text style={s.totalAmt}>{formatCents(totalCents)}</Text>}
          </View>
          <Pressable
            style={[s.cta, !canContinue && s.ctaDim]}
            onPress={() => {
              if (!canContinue) return;
              if (eligibleSiblings.length > 0) setStep("sibling");
              else setStep("payment");
            }}
            disabled={!canContinue}
          >
            <Text style={s.ctaText}>
              {canContinue ? "Continue →" : "Select at least one week"}
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
  },
  headerSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },

  tierRow: {
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 0,
  },
  tierText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
  },

  seg: {
    flexDirection: "row",
    marginHorizontal: Spacing.three,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  segTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segTabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segTabDimmed: { opacity: 0.45 },
  segTabText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6B7280",
  },
  segTabTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },
  segTabTextDimmed: {},

  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },

  weekRow: { flexDirection: "row", gap: 8 },
  weekTile: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 8,
    gap: 3,
    borderWidth: 1.5,
    borderColor: "transparent",
    minHeight: 72,
  },
  weekTilePaid: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  weekTileSel:  { backgroundColor: "rgba(94,124,104,0.1)", borderColor: Brand.sage700 },
  weekNum: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6B7280",
  },
  weekNumPaid: { color: "#16A34A" },
  weekNumSel:  { color: Brand.sage700 },
  weekRange: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9CA3AF",
    lineHeight: 14,
  },
  weekRangePaid: { color: "#4ADE80" },
  weekRangeSel:  { color: "#4A6354" },
  weekTheme: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#D1D5DB",
  },
  weekThemePaid: { color: "#86EFAC" },
  weekThemeSel:  { color: Brand.sage700 },

  fullCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    padding: Spacing.three,
    gap: 6,
  },
  fullPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  fullPrice: {
    fontFamily: FontFamilies.heading,
    fontSize: 28,
    color: "#111827",
  },
  fullOriginal: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  saveBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#15803D",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },
  fullRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fullRowText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },

  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    gap: 10,
    backgroundColor: "#fff",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6B7280",
  },
  totalAmt: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: "#111827",
  },
  cta: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaDim: { backgroundColor: "#D1D5DB" },
  ctaText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#fff",
  },
  ctaNote: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },

  // Sibling step styles
  sibCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  sibCardActive: {
    backgroundColor: "rgba(94,124,104,0.06)",
    borderColor: Brand.sage700,
  },
  sibCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sibCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  sibCheckboxOn: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
  sibName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
  },
  sibDetail: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
  },
  sibAmt: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#111827",
  },
  editWeeksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
    paddingLeft: 34,
  },
  editWeeksText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  sibWeekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingLeft: 34,
  },
  sibWeekBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 1,
  },
  sibWeekPaid: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  sibWeekSel:  { backgroundColor: "rgba(94,124,104,0.12)", borderColor: Brand.sage700 },
  sibWeekBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6B7280",
  },
  sibWeekBtnTextSel: { color: Brand.sage700 },
});
