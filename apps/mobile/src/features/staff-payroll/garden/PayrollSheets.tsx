// Staff Payroll sheets, mounted once by PayrollChrome: period picker,
// submitted-paystub detail, and the confirm-before-submit summary.
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenRadii,
  Pill,
  PressableScale,
  gardenSheetChrome,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STATUS_META, fmtHours, fmtMoney, isPeriodInProgress, type PayPeriod } from "../payrollUtils";
import type { Payroll } from "../usePayroll";
import { AdminNote, StatTiles, StatusTimeline } from "./PayrollParts";
import type { PayrollFeedback } from "./usePayrollFeedback";

function useBottomPad() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 16) + 10;
}

export function PayrollChrome({ p, fb }: { p: Payroll; fb: PayrollFeedback }) {
  return (
    <>
      <PeriodPickerSheet p={p} fb={fb} />
      <PaystubDetailSheet p={p} />
      <ConfirmSubmitSheet p={p} fb={fb} />
    </>
  );
}

// ─── Period picker ───────────────────────────────────────────────────────────
function PeriodPickerSheet({ p, fb }: { p: Payroll; fb: PayrollFeedback }) {
  const pad = useBottomPad();
  return (
    <BottomSheetModal ref={p.pickerRef} {...gardenSheetChrome} snapPoints={["60%", "88%"]}>
      <View style={s.pickerHead}>
        <Display size={26}>Select Pay Period</Display>
      </View>
      <BottomSheetFlatList
        data={p.periods}
        keyExtractor={(item: PayPeriod) => item.start}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: pad, gap: 8 }}
        renderItem={({ item }: { item: PayPeriod }) => {
          const selected = item.start === p.selectedPeriod.start;
          const stub = p.submittedStarts[`${item.start}|${item.end}`];
          const open = isPeriodInProgress(item, new Date(`${p.today}T12:00:00`));
          const status = stub ? STATUS_META[stub.status].label : open ? "In progress" : null;
          return (
            <PressableScale
              pressedScale={0.98}
              haptics={false}
              onPress={() => fb.selectPeriod(item.start)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={`${item.label}${status ? `, ${status}` : ""}`}
              style={[s.option, selected && s.optionSelected]}
            >
              <Text
                style={[s.optionText, selected && { color: Garden.sageDeep, fontFamily: GardenFonts.bodyHeavy }]}
                maxFontSizeMultiplier={1.35}
              >
                {item.label}
              </Text>
              {status ? <Pill tint={stub ? STATUS_META[stub.status].tint : "sage"}>{status}</Pill> : null}
              <View style={{ width: 20, alignItems: "flex-end" }}>
                {selected ? <Ionicons name="checkmark" size={18} color={Garden.sageDeep} /> : null}
              </View>
            </PressableScale>
          );
        }}
      />
    </BottomSheetModal>
  );
}

// ─── Submitted paystub detail ────────────────────────────────────────────────
function PaystubDetailSheet({ p }: { p: Payroll }) {
  const pad = useBottomPad();
  const stub = p.submittedPaystub;
  return (
    <BottomSheetModal ref={p.detailRef} {...gardenSheetChrome} enableDynamicSizing>
      <BottomSheetView style={[s.body, { paddingBottom: pad }]}>
        {stub ? (
          <>
            <View style={s.headRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Display size={26}>Paystub</Display>
                <Text style={s.sub} maxFontSizeMultiplier={1.4}>
                  {p.selectedPeriod.label}
                </Text>
              </View>
              <Pill tint={STATUS_META[stub.status].tint}>{STATUS_META[stub.status].label}</Pill>
            </View>
            <StatTiles hours={stub.total_hours} rate={stub.hourly_rate_snapshot} gross={stub.gross_pay} />
            <View style={s.panel}>
              <StatusTimeline stub={stub} />
            </View>
            {stub.admin_note ? <AdminNote note={stub.admin_note} /> : null}
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── Confirm before submit ───────────────────────────────────────────────────
function ConfirmSubmitSheet({ p, fb }: { p: Payroll; fb: PayrollFeedback }) {
  const pad = useBottomPad();
  const t = p.confirmTarget;
  return (
    <BottomSheetModal ref={p.confirmRef} {...gardenSheetChrome} enableDynamicSizing>
      <BottomSheetView style={[s.body, { paddingBottom: pad }]}>
        {t ? (
          <>
            <Display size={26}>Submit paystub?</Display>
            <View style={s.summary} accessible accessibilityLabel={`Submit ${fmtHours(t.totalHours)} hours at ${fmtMoney(t.hourlyRate)} an hour, ${fmtMoney(t.grossPay)}, for ${t.period.label}?`}>
              <Text style={s.summaryText} maxFontSizeMultiplier={1.4}>
                Submit <Text style={s.strong}>{fmtHours(t.totalHours)} hrs</Text> ×{" "}
                <Text style={s.strong}>{fmtMoney(t.hourlyRate)}</Text> ={" "}
                <Text style={[s.strong, { color: Garden.sageDeep }]}>{fmtMoney(t.grossPay)}</Text> for{" "}
                <Text style={s.strong}>{t.period.label}</Text>?
              </Text>
            </View>
            <Text style={s.fine} maxFontSizeMultiplier={1.4}>
              You can submit each pay period once.
            </Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              <GardenButton
                label="Submit Paystub"
                icon="paper-plane-outline"
                tone="coral"
                fullWidth
                loading={p.submitting}
                loadingLabel="Submitting…"
                success={fb.justSubmitted}
                successLabel="Submitted"
                onPress={() => {
                  if (fb.justSubmitted) return;
                  void fb.confirmSubmit(t);
                }}
              />
              {!p.submitting && !fb.justSubmitted ? (
                <GardenButton label="Cancel" tone="outline" fullWidth onPress={p.closeConfirm} />
              ) : null}
            </View>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  pickerHead: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  body: { paddingHorizontal: 20, paddingTop: 6, gap: 16 },
  headRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft },
  panel: {
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.md,
    borderWidth: 1,
    borderColor: Garden.line,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: GardenRadii.sm + 2,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  optionSelected: { backgroundColor: "#e1eee3", borderColor: Garden.sage },
  optionText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.ink },
  summary: {
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.md,
    borderWidth: 1,
    borderColor: Garden.line,
    padding: 16,
  },
  summaryText: { fontFamily: GardenFonts.bodySemi, fontSize: 16, color: Garden.soft, lineHeight: 24 },
  strong: { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink },
  fine: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.muted, marginTop: -6 },
});
