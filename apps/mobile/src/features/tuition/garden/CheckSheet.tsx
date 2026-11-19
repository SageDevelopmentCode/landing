// "Pay by Check" instructions. Same 4 steps, copy and mailto link as before,
// with Garden numbered steps and the check mockup in Garden colours.
import {
  Display,
  Garden,
  GardenFonts,
  GardenRadii,
  gardenSheetChrome,
  gardenShadowSm,
  GardenTints,
  Pill,
} from "@/components/garden";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Fragment, type ReactNode } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParentTuition } from "../useParentTuition";
import type { TuitionFeedback } from "./useTuitionFeedback";

const EMAIL = "sabrina@sagefield.co";

function CheckMockup() {
  return (
    <View style={m.wrap} accessible accessibilityLabel="Example check made out to Sage Field LLC with the memo Sage Field 2026 – Wks 1, 2, 3">
      <View style={m.check}>
        <View style={m.topRow}>
          <View style={{ gap: 3 }}>
            <View style={m.routing} />
            <View style={[m.routing, { width: 24 }]} />
            <View style={[m.routing, { width: 16 }]} />
          </View>
          <View style={m.dateWrap}>
            <Text style={m.label}>Date</Text>
            <View style={m.underline} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={m.label}>Pay to the Order of</Text>
          <View style={m.payRow}>
            <View style={m.hl}>
              <Text style={m.hlText}>Sage Field LLC</Text>
            </View>
            <View style={m.amountBox}>
              <Text style={m.label}>$</Text>
              <View style={[m.underline, { flex: 1 }]} />
            </View>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <View style={m.memoRow}>
            <Text style={m.label}>Memo </Text>
            <View style={m.hl}>
              <Text style={m.hlText} numberOfLines={1}>
                Sage Field 2026 – Wks 1, 2, 3
              </Text>
            </View>
          </View>
          <View style={m.divider} />
        </View>

        <View style={{ alignItems: "center", paddingTop: 2 }}>
          <Text style={m.micr}>⑆ 0000 ⑆ 0000 0000 ⑆</Text>
        </View>
      </View>
      <Text style={m.caption}>Example — your check should look like this</Text>
    </View>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <View style={s.step}>
      <View style={s.bubble}>
        <Text style={s.bubbleText} maxFontSizeMultiplier={1.2}>
          {n}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.stepTitle} maxFontSizeMultiplier={1.35}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

export function CheckSheet({ c, fb }: { c: ParentTuition; fb: TuitionFeedback }) {
  const insets = useSafeAreaInsets();

  const openMail = async () => {
    try {
      await Linking.openURL(`mailto:${EMAIL}`);
    } catch {
      fb.toast.show({ tone: "error", title: "Couldn't open Mail", message: EMAIL });
    }
  };

  const steps: { title: string; body: ReactNode }[] = [
    { title: "Make the check out to", body: <Text style={s.stepBody}>Sage Field LLC</Text> },
    {
      title: "On the memo line, write",
      body: (
        <Text style={s.stepBody} maxFontSizeMultiplier={1.35}>
          Include your child's name, weeks, and the program name — e.g.{" "}
          <Text style={{ fontFamily: GardenFonts.bodyHeavy, color: Garden.ink }}>
            "Sage Field 2026 – Weeks 1, 2, 3"
          </Text>
        </Text>
      ),
    },
    {
      title: "Drop it off",
      body: (
        <Text style={s.stepBody} maxFontSizeMultiplier={1.35}>
          Bring it on the first day you come in.
        </Text>
      ),
    },
    {
      title: "Questions?",
      body: (
        <Text
          style={[s.stepBody, s.email]}
          onPress={() => void openMail()}
          suppressHighlighting={false}
          accessibilityRole="link"
          accessibilityLabel={`Email ${EMAIL}`}
          maxFontSizeMultiplier={1.35}
        >
          {EMAIL}
        </Text>
      ),
    },
  ];

  return (
    <BottomSheetModal ref={c.checkSheetRef} {...gardenSheetChrome} snapPoints={["75%", "92%"]} enableDynamicSizing={false}>
      <BottomSheetScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        <Display size={28}>Pay by Check</Display>
        <Pill tint="mint" style={{ marginTop: 8 }}>
          No processing fee
        </Pill>

        <CheckMockup />

        <View style={s.list}>
          {steps.map((st, i) => (
            <Fragment key={st.title}>
              {i > 0 ? <View style={s.divider} /> : null}
              <Step n={i + 1} title={st.title}>
                {st.body}
              </Step>
            </Fragment>
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 6 },
  list: {
    marginTop: 20,
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.md,
    borderWidth: 1,
    borderColor: Garden.line,
    overflow: "hidden",
  },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Garden.line, marginLeft: 14 + 30 + 12 },
  bubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleText: { fontFamily: GardenFonts.hand, fontSize: 18, color: Garden.sageDeep, marginTop: -1 },
  stepTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink },
  stepBody: { fontFamily: GardenFonts.body, fontSize: 14, lineHeight: 20, color: Garden.soft },
  email: { fontFamily: GardenFonts.bodyBold, color: Garden.sageDeep, textDecorationLine: "underline", paddingVertical: 6 },
});

const m = StyleSheet.create({
  wrap: { marginTop: 20, marginBottom: 4, gap: 8 },
  check: {
    backgroundColor: "#fffdf7",
    borderRadius: GardenRadii.sm,
    borderWidth: 1,
    borderColor: Garden.line,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 9,
    ...gardenShadowSm,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routing: { height: 2, width: 32, backgroundColor: GardenTints.sage.bg, borderRadius: 1 },
  dateWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  underline: { height: 1, width: 60, backgroundColor: Garden.line },
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Garden.line,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
    minWidth: 72,
  },
  memoRow: { flexDirection: "row", alignItems: "center", flexWrap: "nowrap" },
  divider: { height: 1, backgroundColor: Garden.line },
  micr: { fontFamily: GardenFonts.body, fontSize: 10, color: Garden.muted, letterSpacing: 1, opacity: 0.6 },
  label: { fontFamily: GardenFonts.bodySemi, fontSize: 10.5, color: Garden.muted },
  hl: {
    backgroundColor: Garden.butter,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 1,
    transform: [{ rotate: "-0.6deg" }],
  },
  hlText: { fontFamily: GardenFonts.hand, fontSize: 15, color: "#5c4500" },
  caption: { fontFamily: GardenFonts.hand, fontSize: 15, color: Garden.muted, textAlign: "center" },
});
