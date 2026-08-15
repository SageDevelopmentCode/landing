import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import type { ApplicationRow } from "@/lib/school-year-billing";
import {
  FUN_FRIDAY_DROPIN_CENTS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
  schoolYearFunFridayMonthCents,
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

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function SchoolYearFunFridaySelectionSheet({
  sheetRef,
  student,
  application,
  paidFunFriday,
  onSuccess,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  student: StudentInfo | null;
  application: ApplicationRow | null;
  paidFunFriday: { months: string[]; fridays: string[] } | undefined;
  onSuccess?: () => void;
}) {
  const { pay, loading, error } = useStripePayment();
  const [tab, setTab] = useState<"monthly" | "dropin">("monthly");
  const [selMonths, setSelMonths] = useState<Set<string>>(new Set());
  const [selFridays, setSelFridays] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key)),
  );
  const [step, setStep] = useState<"select" | "payment">("select");

  const paidMonths = useMemo(
    () => new Set(paidFunFriday?.months ?? []),
    [paidFunFriday],
  );
  const paidFridays = useMemo(
    () => new Set(paidFunFriday?.fridays ?? []),
    [paidFunFriday],
  );

  const totalCents = useMemo(() => {
    if (tab === "monthly") {
      return SCHOOL_YEAR_FUN_FRIDAY_MONTHS.filter((m) =>
        selMonths.has(m.key),
      ).reduce((sum, m) => sum + schoolYearFunFridayMonthCents(m), 0);
    }
    return selFridays.size * FUN_FRIDAY_DROPIN_CENTS;
  }, [tab, selMonths, selFridays]);

  const canContinue =
    tab === "monthly" ? selMonths.size > 0 : selFridays.size > 0;

  function reset() {
    setTab("monthly");
    setSelMonths(new Set());
    setSelFridays(new Set());
    setExpanded(new Set(SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key)));
    setStep("select");
  }

  async function handlePay(coverFees: boolean, paymentMethod: "card" | "ach") {
    if (!application) return;
    const success = await pay("/api/stripe/create-fun-friday-checkout", {
      studentId: application.student_id,
      applicationId: application.id,
      planType: tab,
      selectedMonths: Array.from(selMonths),
      selectedFridays: Array.from(selFridays),
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
                programLabel: "Friday Enrichment",
                detail:
                  tab === "monthly"
                    ? `${selMonths.size} month${selMonths.size !== 1 ? "s" : ""}`
                    : `${selFridays.size} Friday${selFridays.size !== 1 ? "s" : ""}`,
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
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Friday Enrichment Day</Text>
          {student ? (
            <Text style={s.subtitle}>{student.name.split(" ")[0]}</Text>
          ) : null}

          <View style={s.tabRow}>
            {(["monthly", "dropin"] as const).map((t) => (
              <Pressable
                key={t}
                style={[s.tab, tab === t && s.tabOn]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabText, tab === t && s.tabTextOn]}>
                  {t === "monthly" ? "Monthly" : "Drop-in"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "monthly"
            ? SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((month) => {
                const isPaid = paidMonths.has(month.key);
                const isSelected = selMonths.has(month.key);
                const isOpen = expanded.has(month.key);
                return (
                  <View key={month.key} style={s.monthBlock}>
                    <Pressable
                      style={s.monthHeader}
                      onPress={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(month.key)) next.delete(month.key);
                          else next.add(month.key);
                          return next;
                        })
                      }
                    >
                      <Pressable
                        disabled={isPaid}
                        style={[
                          s.monthChip,
                          isPaid && s.monthChipPaid,
                          isSelected && s.monthChipOn,
                        ]}
                        onPress={() =>
                          setSelMonths((prev) => {
                            const next = new Set(prev);
                            if (next.has(month.key)) next.delete(month.key);
                            else next.add(month.key);
                            return next;
                          })
                        }
                      >
                        <Text
                          style={[
                            s.monthChipText,
                            isSelected && s.monthChipTextOn,
                          ]}
                        >
                          {month.label.replace(" 2026", "").replace(" 2027", "")}
                        </Text>
                      </Pressable>
                      <Text style={s.monthPrice}>
                        {formatCents(schoolYearFunFridayMonthCents(month))}
                      </Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#9CA3AF"
                      />
                    </Pressable>
                    {isOpen && (
                      <View style={s.daysWrap}>
                        {month.fridays.map((f) => (
                          <Text key={f.date} style={s.dayLabel}>
                            {f.label}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            : SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((month) => (
                <View key={month.key} style={s.monthBlock}>
                  <Text style={s.monthTitle}>{month.label}</Text>
                  <View style={s.daysGrid}>
                    {month.fridays.map((f) => {
                      const isPaid = paidFridays.has(f.date);
                      const isSelected = selFridays.has(f.date);
                      return (
                        <Pressable
                          key={f.date}
                          disabled={isPaid}
                          style={[
                            s.dayChip,
                            isPaid && s.dayChipPaid,
                            isSelected && s.dayChipOn,
                          ]}
                          onPress={() =>
                            setSelFridays((prev) => {
                              const next = new Set(prev);
                              if (next.has(f.date)) next.delete(f.date);
                              else next.add(f.date);
                              return next;
                            })
                          }
                        >
                          <Text
                            style={[
                              s.dayChipText,
                              isSelected && s.dayChipTextOn,
                            ]}
                          >
                            {f.label.replace("Fri ", "")}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

          <Pressable
            style={[s.primaryBtn, !canContinue && s.primaryBtnDisabled]}
            disabled={!canContinue}
            onPress={() => setStep("payment")}
          >
            <Text style={s.primaryBtnText}>
              Continue · {formatCents(totalCents)}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  content: { padding: Spacing.three, paddingBottom: 40 },
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
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  tabOn: {
    borderColor: "#7c3aed",
    backgroundColor: "rgba(124,58,237,0.08)",
  },
  tabText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6B7280",
  },
  tabTextOn: { color: "#7c3aed" },
  monthBlock: { marginBottom: 12 },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  monthChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthChipOn: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  monthChipPaid: { opacity: 0.5 },
  monthChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
  },
  monthChipTextOn: { color: "#ffffff" },
  monthPrice: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
  },
  monthTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  daysWrap: { paddingLeft: 8, paddingTop: 8, gap: 4 },
  dayLabel: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9CA3AF" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dayChipOn: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  dayChipPaid: { opacity: 0.4 },
  dayChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#374151",
  },
  dayChipTextOn: { color: "#ffffff" },
  primaryBtn: {
    backgroundColor: "#7c3aed",
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
});
