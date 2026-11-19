// A Garden action menu (replaces Alert-as-menu for long-press / ⋮).
//   const sheet = useRef<GardenActionSheetHandle>(null);
//   sheet.current?.present({ title: "Ava's photo", actions: [...] });
//   <GardenActionSheet ref={sheet} />   ← mounted once per screen
// The chosen action runs after the sheet has closed, so a confirm Alert or a
// navigation never fights the dismiss animation.
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Display } from "./GardenBits";
import { Garden, GardenFonts, GardenRadii, GardenTints, MIN_TAP } from "./gardenTheme";
import { gardenSheetChrome } from "./GardenSheet";
import { PressableScale } from "./PressableScale";

export type GardenAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  /** One-line explanation under the label. */
  hint?: string;
  destructive?: boolean;
};

export type GardenActionSheetConfig = {
  title: string;
  subtitle?: string;
  actions: GardenAction[];
};

export type GardenActionSheetHandle = {
  present: (config: GardenActionSheetConfig) => void;
  dismiss: () => void;
};

export const GardenActionSheet = forwardRef<GardenActionSheetHandle>(function GardenActionSheet(_p, ref) {
  const insets = useSafeAreaInsets();
  const modal = useRef<BottomSheetModal>(null);
  const [config, setConfig] = useState<GardenActionSheetConfig | null>(null);
  const pending = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    present: (c) => {
      pending.current = null;
      setConfig(c);
      requestAnimationFrame(() => modal.current?.present());
    },
    dismiss: () => modal.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modal}
      {...gardenSheetChrome}
      enableDynamicSizing
      onDismiss={() => {
        const run = pending.current;
        pending.current = null;
        run?.();
      }}
    >
      <BottomSheetView style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {config ? (
          <>
            <Display size={22} numberOfLines={2}>
              {config.title}
            </Display>
            {config.subtitle ? (
              <Text style={styles.subtitle} maxFontSizeMultiplier={1.4}>
                {config.subtitle}
              </Text>
            ) : null}
            <View style={styles.list}>
              {config.actions.map((a) => {
                const tint = a.destructive ? GardenTints.coral : GardenTints.sage;
                return (
                  <PressableScale
                    key={a.label}
                    pressedScale={0.98}
                    haptics={a.destructive ? "press" : "tap"}
                    accessibilityLabel={a.hint ? `${a.label}. ${a.hint}` : a.label}
                    onPress={() => {
                      pending.current = a.onPress;
                      modal.current?.dismiss();
                    }}
                    style={styles.row}
                  >
                    <View style={[styles.icon, { backgroundColor: tint.bg }]}>
                      <Ionicons name={a.icon} size={18} color={tint.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.label, a.destructive && { color: Garden.danger }]}
                        maxFontSizeMultiplier={1.4}
                      >
                        {a.label}
                      </Text>
                      {a.hint ? (
                        <Text style={styles.hint} maxFontSizeMultiplier={1.4}>
                          {a.hint}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
                  </PressableScale>
                );
              })}
            </View>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  body: { paddingHorizontal: 18, paddingTop: 4 },
  subtitle: { marginTop: 4, fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft },
  list: {
    marginTop: 14,
    borderRadius: GardenRadii.md,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TAP + 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Garden.line,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  hint: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.muted, marginTop: 1 },
});
