import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import { useStripePayment } from "@/hooks/useStripePayment";
import { PaymentMethodStep } from "@/components/billing/PaymentMethodStep";

type StudentInfo = { id: string; name: string; profileImageUrl: string | null };
type ApplicationRow = { id: string; student_id: string; child_grade: string | null };

const MONTHS = [
  { key: "may", label: "May", fridays: 1, price: 6000,  note: "1 session · $60" },
  { key: "jun", label: "Jun", fridays: 4, price: 20000, note: "4 Fridays · bundle" },
  { key: "jul", label: "Jul", fridays: 5, price: 20000, note: "5 Fridays · bundle" },
  { key: "aug", label: "Aug", fridays: 1, price: 6000,  note: "1 session · $60" },
];

const SESSION_RATE = 6000;

const FRIDAY_DATES: Record<string, { label: string; iso: string }[]> = {
  may: [
    { label: "May 29", iso: "2026-05-29" },
  ],
  jun: [
    { label: "Jun 5",  iso: "2026-06-05" },
    { label: "Jun 12", iso: "2026-06-12" },
    { label: "Jun 19", iso: "2026-06-19" },
    { label: "Jun 26", iso: "2026-06-26" },
  ],
  jul: [
    { label: "Jul 3",  iso: "2026-07-03" },
    { label: "Jul 10", iso: "2026-07-10" },
    { label: "Jul 17", iso: "2026-07-17" },
    { label: "Jul 24", iso: "2026-07-24" },
    { label: "Jul 31", iso: "2026-07-31" },
  ],
  aug: [
    { label: "Aug 7", iso: "2026-08-07" },
  ],
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );
}

function chunkArr<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function FunFridaySelectionSheet({
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
  const [tab, setTab] = useState<"monthly" | "dropin">("monthly");
  const [selMonths, setSelMonths] = useState<Set<string>>(new Set());
  const [selFridays, setSelFridays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(["may"]));
  const [step, setStep] = useState<"select" | "payment">("select");
  const { pay, loading, error } = useStripePayment();

  const paidMonths  = useMemo(() => new Set(paidFunFriday?.months ?? []),  [paidFunFriday]);
  const paidFridays = useMemo(() => new Set(paidFunFriday?.fridays ?? []), [paidFunFriday]);

  const totalCents = useMemo(() => {
    if (tab === "monthly") {
      return MONTHS.filter((m) => selMonths.has(m.key)).reduce((sum, m) => sum + m.price, 0);
    }
    return selFridays.size * SESSION_RATE;
  }, [tab, selMonths, selFridays]);

  const canContinue = tab === "monthly" ? selMonths.size > 0 : selFridays.size > 0;

  function switchTab(t: "monthly" | "dropin") {
    setTab(t);
  }

  function toggleMonth(key: string) {
    setSelMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleFriday(iso: string) {
    setSelFridays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  function toggleExpand(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function reset() {
    setTab("monthly");
    setSelMonths(new Set());
    setSelFridays(new Set());
    setExpandedMonths(new Set(["may"]));
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
        <BottomSheetScrollView
          contentContainerStyle={{ padding: Spacing.three, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <PaymentMethodStep
            intendedAmountCents={totalCents}
            lineItems={[{
              studentName: student?.name.split(" ")[0] ?? "Student",
              programLabel: "Friday Enrichment",
              detail: tab === "monthly"
                ? `Monthly · ${MONTHS.filter((m) => selMonths.has(m.key)).map((m) => m.label).join(", ")}`
                : `${selFridays.size} Friday${selFridays.size !== 1 ? "s" : ""}`,
              amountCents: totalCents,
            }]}
            onBack={() => setStep("select")}
            onPay={handlePay}
            loading={loading}
            error={error}
          />
        </BottomSheetScrollView>
      ) : (
      <View style={{ flex: 1 }}>
        {/* Sheet header */}
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Friday Enrichment Day</Text>
          {student && <Text style={s.sheetSub}>{student.name} · Optional add-on</Text>}
        </View>

        {/* Segmented control */}
        <View style={s.seg}>
          <Pressable
            style={[s.segTab, tab === "monthly" && s.segTabActive]}
            onPress={() => switchTab("monthly")}
          >
            <Text style={[s.segTabText, tab === "monthly" && s.segTabTextActive]}>
              Monthly
            </Text>
          </Pressable>
          <Pressable
            style={[s.segTab, tab === "dropin" && s.segTabActive]}
            onPress={() => switchTab("dropin")}
          >
            <Text style={[s.segTabText, tab === "dropin" && s.segTabTextActive]}>
              Drop-in
            </Text>
          </Pressable>
        </View>

        {/* Scrollable content */}
        <BottomSheetScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === "monthly" ? (
            <View style={s.monthGrid}>
              {chunkArr(MONTHS, 2).map((row, i) => (
                <View key={i} style={s.monthRow}>
                  {row.map((m) => {
                    const paid = paidMonths.has(m.key);
                    const sel  = selMonths.has(m.key);
                    const partialCount =
                      FRIDAY_DATES[m.key]?.filter((f) => paidFridays.has(f.iso)).length ?? 0;
                    return (
                      <Pressable
                        key={m.key}
                        style={[
                          s.monthCard,
                          paid && s.monthCardPaid,
                          sel  && s.monthCardSel,
                        ]}
                        onPress={() => !paid && toggleMonth(m.key)}
                        disabled={paid}
                      >
                        <Text
                          style={[
                            s.monthLabel,
                            paid && s.monthLabelPaid,
                            sel  && s.monthLabelSel,
                          ]}
                        >
                          {m.label}
                        </Text>
                        <Text style={s.monthNote}>{m.note}</Text>
                        <Text style={[s.monthPrice, sel && s.monthPriceSel]}>
                          {paid ? "Paid ✓" : formatCents(m.price)}
                        </Text>
                        {partialCount > 0 && !paid && (
                          <Text style={s.partialNote}>
                            {partialCount} Friday{partialCount !== 1 ? "s" : ""} already paid
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : (
            <View style={s.accordionWrap}>
              {MONTHS.map((m) => {
                const expanded = expandedMonths.has(m.key);
                return (
                  <View key={m.key} style={s.accordion}>
                    <Pressable
                      style={s.accordionHeader}
                      onPress={() => toggleExpand(m.key)}
                    >
                      <Text style={s.accordionLabel}>{m.label} 2026</Text>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#9CA3AF"
                      />
                    </Pressable>
                    {expanded && (
                      <View style={s.chipWrap}>
                        {FRIDAY_DATES[m.key].map((f) => {
                          const paid = paidFridays.has(f.iso);
                          const sel  = selFridays.has(f.iso);
                          return (
                            <Pressable
                              key={f.iso}
                              style={[
                                s.chip,
                                paid && s.chipPaid,
                                sel  && s.chipSel,
                              ]}
                              onPress={() => !paid && toggleFriday(f.iso)}
                              disabled={paid}
                            >
                              <Text
                                style={[
                                  s.chipText,
                                  paid && s.chipTextPaid,
                                  sel  && s.chipTextSel,
                                ]}
                              >
                                {f.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              {tab === "monthly"
                ? `${selMonths.size} month${selMonths.size !== 1 ? "s" : ""} selected`
                : `${selFridays.size} session${selFridays.size !== 1 ? "s" : ""} selected`}
            </Text>
            {canContinue && <Text style={s.totalAmt}>{formatCents(totalCents)}</Text>}
          </View>
          <Pressable
            style={[s.cta, !canContinue && s.ctaDim]}
            onPress={() => canContinue && setStep("payment")}
            disabled={!canContinue}
          >
            <Text style={s.ctaText}>
              {canContinue
                ? "Continue →"
                : `Select ${tab === "monthly" ? "months" : "sessions"} above`}
            </Text>
          </Pressable>
        </View>
      </View>
      )}
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  sheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
  },
  sheetSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  seg: {
    flexDirection: "row",
    marginHorizontal: Spacing.three,
    marginTop: 12,
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
  segTabText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6B7280",
  },
  segTabTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },

  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 20,
  },

  monthGrid: { gap: 10 },
  monthRow: { flexDirection: "row", gap: 10 },
  monthCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    gap: 3,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  monthCardPaid: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  monthCardSel:  { backgroundColor: "rgba(94,124,104,0.1)", borderColor: Brand.sage700 },
  monthLabel: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#111827",
  },
  monthLabelPaid: { color: "#16A34A" },
  monthLabelSel:  { color: Brand.sage800 },
  monthNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9CA3AF",
  },
  monthPrice: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
    marginTop: 2,
  },
  monthPriceSel: { color: Brand.sage700 },
  partialNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#F59E0B",
    marginTop: 2,
  },

  accordionWrap: { gap: 0 },
  accordion: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  accordionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 14,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipPaid: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  chipSel:  { backgroundColor: "rgba(94,124,104,0.15)", borderColor: Brand.sage700 },
  chipText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#374151",
  },
  chipTextPaid: { color: "#16A34A" },
  chipTextSel:  { color: Brand.sage800 },

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
