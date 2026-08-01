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
  { key: "may", label: "May", days: 5,  price: 17500 },
  { key: "jun", label: "Jun", days: 21, price: 37500 },
  { key: "jul", label: "Jul", days: 22, price: 37500 },
  { key: "aug", label: "Aug", days: 9,  price: 31500 },
];

const DAY_RATE = 3500;

const DAILY_DATES: Record<string, { label: string; iso: string }[]> = {
  may: [
    { label: "May 18", iso: "2026-05-18" }, { label: "May 19", iso: "2026-05-19" },
    { label: "May 20", iso: "2026-05-20" }, { label: "May 21", iso: "2026-05-21" },
    { label: "May 22", iso: "2026-05-22" },
  ],
  jun: [
    { label: "Jun 1",  iso: "2026-06-01" }, { label: "Jun 2",  iso: "2026-06-02" },
    { label: "Jun 3",  iso: "2026-06-03" }, { label: "Jun 4",  iso: "2026-06-04" },
    { label: "Jun 5",  iso: "2026-06-05" }, { label: "Jun 8",  iso: "2026-06-08" },
    { label: "Jun 9",  iso: "2026-06-09" }, { label: "Jun 10", iso: "2026-06-10" },
    { label: "Jun 11", iso: "2026-06-11" }, { label: "Jun 12", iso: "2026-06-12" },
    { label: "Jun 15", iso: "2026-06-15" }, { label: "Jun 16", iso: "2026-06-16" },
    { label: "Jun 17", iso: "2026-06-17" }, { label: "Jun 18", iso: "2026-06-18" },
    { label: "Jun 22", iso: "2026-06-22" }, { label: "Jun 23", iso: "2026-06-23" },
    { label: "Jun 24", iso: "2026-06-24" }, { label: "Jun 25", iso: "2026-06-25" },
    { label: "Jun 26", iso: "2026-06-26" }, { label: "Jun 29", iso: "2026-06-29" },
    { label: "Jun 30", iso: "2026-06-30" },
  ],
  jul: [
    { label: "Jul 1",  iso: "2026-07-01" }, { label: "Jul 2",  iso: "2026-07-02" },
    { label: "Jul 6",  iso: "2026-07-06" }, { label: "Jul 7",  iso: "2026-07-07" },
    { label: "Jul 8",  iso: "2026-07-08" }, { label: "Jul 9",  iso: "2026-07-09" },
    { label: "Jul 10", iso: "2026-07-10" }, { label: "Jul 13", iso: "2026-07-13" },
    { label: "Jul 14", iso: "2026-07-14" }, { label: "Jul 15", iso: "2026-07-15" },
    { label: "Jul 16", iso: "2026-07-16" }, { label: "Jul 17", iso: "2026-07-17" },
    { label: "Jul 20", iso: "2026-07-20" }, { label: "Jul 21", iso: "2026-07-21" },
    { label: "Jul 22", iso: "2026-07-22" }, { label: "Jul 23", iso: "2026-07-23" },
    { label: "Jul 24", iso: "2026-07-24" }, { label: "Jul 27", iso: "2026-07-27" },
    { label: "Jul 28", iso: "2026-07-28" }, { label: "Jul 29", iso: "2026-07-29" },
    { label: "Jul 30", iso: "2026-07-30" }, { label: "Jul 31", iso: "2026-07-31" },
  ],
  aug: [
    { label: "Aug 3",  iso: "2026-08-03" }, { label: "Aug 4",  iso: "2026-08-04" },
    { label: "Aug 5",  iso: "2026-08-05" }, { label: "Aug 6",  iso: "2026-08-06" },
    { label: "Aug 7",  iso: "2026-08-07" }, { label: "Aug 10", iso: "2026-08-10" },
    { label: "Aug 11", iso: "2026-08-11" }, { label: "Aug 12", iso: "2026-08-12" },
    { label: "Aug 13", iso: "2026-08-13" },
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

export function AftercareSelectionSheet({
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
  const [tab, setTab] = useState<"monthly" | "daily">("monthly");
  const [selMonths, setSelMonths] = useState<Set<string>>(new Set());
  const [selDays, setSelDays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(["may"]));
  const [step, setStep] = useState<"select" | "payment">("select");
  const { pay, loading, error } = useStripePayment();

  const paidMonths = useMemo(() => new Set(paidAftercare?.months ?? []), [paidAftercare]);
  const paidDays   = useMemo(() => new Set(paidAftercare?.days ?? []),   [paidAftercare]);

  const totalCents = useMemo(() => {
    if (tab === "monthly") {
      return MONTHS.filter((m) => selMonths.has(m.key)).reduce((sum, m) => sum + m.price, 0);
    }
    return selDays.size * DAY_RATE;
  }, [tab, selMonths, selDays]);

  const canContinue = tab === "monthly" ? selMonths.size > 0 : selDays.size > 0;

  function switchTab(t: "monthly" | "daily") {
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

  function toggleDay(iso: string) {
    setSelDays((prev) => {
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
    setSelDays(new Set());
    setExpandedMonths(new Set(["may"]));
    setStep("select");
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
        <BottomSheetScrollView
          contentContainerStyle={{ padding: Spacing.three, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <PaymentMethodStep
            intendedAmountCents={totalCents}
            lineItems={[{
              studentName: student?.name.split(" ")[0] ?? "Student",
              programLabel: "Extended Learning",
              detail: tab === "monthly"
                ? `Monthly · ${MONTHS.filter((m) => selMonths.has(m.key)).map((m) => m.label).join(", ")}`
                : `${selDays.size} session${selDays.size !== 1 ? "s" : ""}`,
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
          <Text style={s.sheetTitle}>Extended Learning</Text>
          {student && (
            <Text style={s.sheetSub}>{student.name} · 3:00–5:00 pm</Text>
          )}
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
            style={[s.segTab, tab === "daily" && s.segTabActive]}
            onPress={() => switchTab("daily")}
          >
            <Text style={[s.segTabText, tab === "daily" && s.segTabTextActive]}>
              Daily
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
                    const partialDays =
                      DAILY_DATES[m.key]?.filter((d) => paidDays.has(d.iso)).length ?? 0;
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
                        <Text style={[s.monthDays, sel && s.monthDaysSel]}>
                          {m.days} days
                        </Text>
                        <Text style={[s.monthPrice, sel && s.monthPriceSel]}>
                          {paid ? "Paid ✓" : formatCents(m.price)}
                        </Text>
                        {partialDays > 0 && !paid && (
                          <Text style={s.partialNote}>
                            {partialDays} day{partialDays !== 1 ? "s" : ""} already paid
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
                        {DAILY_DATES[m.key].map((d) => {
                          const paid = paidDays.has(d.iso);
                          const sel  = selDays.has(d.iso);
                          return (
                            <Pressable
                              key={d.iso}
                              style={[
                                s.chip,
                                paid && s.chipPaid,
                                sel  && s.chipSel,
                              ]}
                              onPress={() => !paid && toggleDay(d.iso)}
                              disabled={paid}
                            >
                              <Text
                                style={[
                                  s.chipText,
                                  paid && s.chipTextPaid,
                                  sel  && s.chipTextSel,
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
            </View>
          )}
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              {tab === "monthly"
                ? `${selMonths.size} month${selMonths.size !== 1 ? "s" : ""} selected`
                : `${selDays.size} day${selDays.size !== 1 ? "s" : ""} selected`}
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
                : `Select ${tab === "monthly" ? "months" : "days"} above`}
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

  // Monthly grid
  monthGrid: { gap: 10 },
  monthRow: { flexDirection: "row", gap: 10 },
  monthCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    gap: 4,
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
  monthDays: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
  },
  monthDaysSel: { color: "#6B7280" },
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

  // Daily accordion
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

  // Footer
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
