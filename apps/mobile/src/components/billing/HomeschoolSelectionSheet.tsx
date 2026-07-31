import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";

type StudentInfo = { id: string; name: string; profileImageUrl: string | null };
type ApplicationRow = { id: string; student_id: string; child_grade: string | null };

const WEEKS = [
  { week: 1,  range: "May 26–28",    days: ["tue","wed","thu"] },
  { week: 2,  range: "Jun 1–4",      days: ["mon","tue","wed","thu"] },
  { week: 3,  range: "Jun 8–11",     days: ["mon","tue","wed","thu"] },
  { week: 4,  range: "Jun 15–18",    days: ["mon","tue","wed","thu"] },
  { week: 5,  range: "Jun 22–25",    days: ["mon","tue","wed","thu"] },
  { week: 6,  range: "Jun 29–Jul 2", days: ["mon","tue","wed","thu"] },
  { week: 7,  range: "Jul 6–9",      days: ["mon","tue","wed","thu"] },
  { week: 8,  range: "Jul 13–16",    days: ["mon","tue","wed","thu"] },
  { week: 9,  range: "Jul 20–23",    days: ["mon","tue","wed","thu"] },
  { week: 10, range: "Jul 27–30",    days: ["mon","tue","wed","thu"] },
  { week: 11, range: "Aug 3–6",      days: ["mon","tue","wed","thu"] },
  { week: 12, range: "Aug 10–13",    days: ["mon","tue","wed","thu"] },
];

const ALL_DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
];

const PRICING = {
  primary: { dropin: 10000, "2day": 18000, "3day": 25500 },
  upper:   { dropin: 9500,  "2day": 17000, "3day": 24000 },
};

const TIER_LABELS: Record<string, string> = {
  dropin: "Drop-in",
  "2day": "2-Day",
  "3day": "3-Day",
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

function getTier(count: number): "dropin" | "2day" | "3day" {
  if (count === 1) return "dropin";
  if (count === 2) return "2day";
  return "3day";
}

export function HomeschoolSelectionSheet({
  sheetRef,
  student,
  application,
  paidHomeschool,
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal>;
  student: StudentInfo | null;
  application: ApplicationRow | null;
  paidHomeschool: Array<{ week: number; days: string[] }> | undefined;
  onSuccess?: () => void;
}) {
  const [weekSelections, setWeekSelections] = useState<Record<number, Set<string>>>({});
  const [step, setStep] = useState<"select" | "payment">("select");
  const { pay, loading, error } = useStripePayment();

  function reset() {
    setWeekSelections({});
    setStep("select");
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!application) return;
    const gradeTier = getGradeTier(application.child_grade ?? null);
    const weekEntries = Object.entries(weekSelections)
      .filter(([, days]) => days.size > 0)
      .map(([week, days]) => ({ week: Number(week), days: Array.from(days) }));
    const maxDays = Math.max(...weekEntries.map((w) => w.days.length));
    const success = await pay("/api/stripe/create-homeschool-checkout", {
      studentId: application.student_id,
      applicationId: application.id,
      program: "summer_26",
      tier: getTier(maxDays),
      gradeTier,
      weekSelectionsJson: JSON.stringify(weekEntries),
      intendedAmountCents: totalCents,
      coverFees,
      paymentMethod,
    });
    if (success) {
      sheetRef.current?.dismiss();
      onSuccess?.();
    }
  }

  const gradeTier = getGradeTier(application?.child_grade ?? null);
  const pricing = PRICING[gradeTier];

  const paidByWeek = useMemo(() => {
    const map: Record<number, Set<string>> = {};
    for (const ws of paidHomeschool ?? []) {
      map[ws.week] = new Set(ws.days);
    }
    return map;
  }, [paidHomeschool]);

  const totalCents = useMemo(() => {
    let total = 0;
    for (const days of Object.values(weekSelections)) {
      if (days.size === 0) continue;
      total += pricing[getTier(days.size)];
    }
    return total;
  }, [weekSelections, pricing]);

  const selectedWeekCount = Object.values(weekSelections).filter((d) => d.size > 0).length;
  const canContinue = selectedWeekCount > 0;

  function toggleDay(week: number, dayKey: string) {
    setWeekSelections((prev) => {
      const current = new Set(prev[week] ?? []);
      if (current.has(dayKey)) {
        current.delete(dayKey);
      } else {
        if (current.size >= 3) return prev;
        current.add(dayKey);
      }
      return { ...prev, [week]: current };
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
            intendedAmountCents={totalCents}
            lineItems={[{
              studentName: student?.name.split(" ")[0] ?? "Student",
              programLabel: "Homeschool Drop-In",
              detail: `${selectedWeekCount} week${selectedWeekCount !== 1 ? "s" : ""} selected`,
              amountCents: totalCents,
            }]}
            onBack={() => setStep("select")}
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : (
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Homeschool Drop-In</Text>
            {student && <Text style={s.headerSub}>{student.name}</Text>}
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Grade tier line */}
        <View style={s.tierRow}>
          <Text style={s.tierText}>
            {gradeTier === "primary" ? "Primary (Pre-K–1st)" : "Upper (2nd–4th)"} ·{" "}
            {formatCents(pricing.dropin)}/day · {formatCents(pricing["2day"])}/2-day ·{" "}
            {formatCents(pricing["3day"])}/3-day
          </Text>
        </View>

        {/* Week list */}
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {WEEKS.map((w) => {
            const paidDays = paidByWeek[w.week] ?? new Set<string>();
            const selDays  = weekSelections[w.week] ?? new Set<string>();
            const selCount = selDays.size;
            const tier     = selCount > 0 ? getTier(selCount) : null;
            const weekPrice = tier ? pricing[tier] : 0;
            const fullyPaid = w.days.every((d) => paidDays.has(d));

            return (
              <View
                key={w.week}
                style={[s.weekBlock, fullyPaid && s.weekBlockPaid]}
              >
                <View style={s.weekLabelRow}>
                  <View style={s.weekLabelLeft}>
                    <Text style={[s.weekNum, fullyPaid && s.weekNumPaid]}>
                      Week {w.week}
                    </Text>
                    <Text style={s.weekRange}>{w.range}</Text>
                  </View>
                  {fullyPaid ? (
                    <Text style={s.weekPaidBadge}>Paid ✓</Text>
                  ) : tier ? (
                    <View style={s.tierPill}>
                      <Text style={s.tierPillText}>
                        {TIER_LABELS[tier]} · {formatCents(weekPrice)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={s.dayRow}>
                  {ALL_DAYS.filter((d) => w.days.includes(d.key)).map((d) => {
                    const paid = paidDays.has(d.key);
                    const sel  = selDays.has(d.key);
                    return (
                      <Pressable
                        key={d.key}
                        style={[
                          s.dayBtn,
                          paid && s.dayBtnPaid,
                          sel  && s.dayBtnSel,
                          fullyPaid && s.dayBtnDimmed,
                        ]}
                        onPress={() => !paid && !fullyPaid && toggleDay(w.week, d.key)}
                        disabled={paid || fullyPaid}
                      >
                        <Text
                          style={[
                            s.dayBtnText,
                            paid && s.dayBtnTextPaid,
                            sel  && s.dayBtnTextSel,
                          ]}
                        >
                          {d.label}
                        </Text>
                        {paid && (
                          <Ionicons
                            name="checkmark"
                            size={10}
                            color="#16A34A"
                            style={{ marginTop: 1 }}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              {selectedWeekCount > 0
                ? `${selectedWeekCount} week${selectedWeekCount !== 1 ? "s" : ""} selected`
                : "No weeks selected"}
            </Text>
            {canContinue && <Text style={s.totalAmt}>{formatCents(totalCents)}</Text>}
          </View>
          <Pressable
            style={[s.cta, !canContinue && s.ctaDim]}
            onPress={() => canContinue && setStep("payment")}
            disabled={!canContinue}
          >
            <Text style={s.ctaText}>
              {canContinue ? "Continue →" : "Select days above"}
            </Text>
          </Pressable>
        </View>
      </View>
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
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
  },

  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
  },

  weekBlock: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 10,
  },
  weekBlockPaid: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },

  weekLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  weekLabelLeft: { gap: 2 },
  weekNum: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  weekNumPaid: { color: "#16A34A" },
  weekRange: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
  },
  weekPaidBadge: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#16A34A",
  },
  tierPill: {
    backgroundColor: "rgba(94,124,104,0.12)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
  },

  dayRow: { flexDirection: "row", gap: 8 },
  dayBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 2,
  },
  dayBtnPaid:   { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  dayBtnSel:    { backgroundColor: "rgba(94,124,104,0.12)", borderColor: Brand.sage700 },
  dayBtnDimmed: { opacity: 0.5 },
  dayBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6B7280",
  },
  dayBtnTextPaid: { color: "#16A34A" },
  dayBtnTextSel:  { color: Brand.sage700 },

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
});
