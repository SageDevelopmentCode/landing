// A numbered stage of a multi-step staff task (staff.md "clear steps"):
//   ① Write → ② Add photos → ③ Post
// state "done" shows a sage ✓, "locked" shows a dashed hint saying what
// unlocks it (never hidden), "active" is the normal white card.
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Display } from "./GardenBits";
import { Garden, GardenFonts, GardenRadii, gardenShadowSm } from "./gardenTheme";

export type StepState = "active" | "done" | "locked";

export function GardenStepCard({
  n,
  title,
  note,
  state = "active",
  lockedHint,
  right,
  children,
  style,
}: {
  n: number;
  title: string;
  /** Short helper line under the title (feedback, not facts). */
  note?: string;
  state?: StepState;
  /** Shown in a dashed box when locked: what unlocks this step. */
  lockedHint?: string;
  /** Optional slot on the title row (counter, toggle). */
  right?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const done = state === "done";
  const locked = state === "locked";
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(220)}
      style={[styles.card, locked && styles.cardLocked, style]}
      accessibilityLabel={`Step ${n}: ${title}${done ? ", done" : locked ? ", not available yet" : ""}`}
    >
      <View style={styles.head}>
        <View style={[styles.num, done && styles.numDone, locked && styles.numLocked]}>
          {done ? (
            <Ionicons name="checkmark" size={16} color={Garden.white} />
          ) : (
            <Text style={[styles.numText, locked && { color: Garden.muted }]} maxFontSizeMultiplier={1.2}>
              {n}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Display size={19} color={locked ? Garden.muted : Garden.ink}>
            {title}
          </Display>
          {note ? (
            <Text style={styles.note} maxFontSizeMultiplier={1.4}>
              {note}
            </Text>
          ) : null}
        </View>
        {right ?? null}
      </View>
      {locked ? (
        lockedHint ? (
          <View style={styles.hint}>
            <Ionicons name="lock-closed-outline" size={14} color={Garden.muted} />
            <Text style={styles.hintText} maxFontSizeMultiplier={1.4}>
              {lockedHint}
            </Text>
          </View>
        ) : null
      ) : children ? (
        <View style={styles.body}>{children}</View>
      ) : null}
    </Animated.View>
  );
}

/** A dashed "what unlocks this" box for use outside a step card. */
export function GardenHintBox({
  icon = "information-circle-outline",
  children,
  tone = "muted",
  style,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  children: ReactNode;
  tone?: "muted" | "coral" | "sage";
  style?: StyleProp<ViewStyle>;
}) {
  const color = tone === "coral" ? "#b9554a" : tone === "sage" ? Garden.sageDeep : Garden.soft;
  const border = tone === "coral" ? Garden.coral : tone === "sage" ? Garden.sage : "#d9cdb9";
  return (
    <View style={[styles.hint, { borderColor: border }, style]} accessibilityRole="text">
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.hintText, { color }]} maxFontSizeMultiplier={1.4}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.md + 4,
    borderWidth: 1,
    borderColor: Garden.line,
    padding: 16,
    ...gardenShadowSm,
  },
  cardLocked: { backgroundColor: "#fbf4ea", shadowOpacity: 0, elevation: 0 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  num: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Garden.butter,
    alignItems: "center",
    justifyContent: "center",
  },
  numDone: { backgroundColor: Garden.sage },
  numLocked: { backgroundColor: "#efe6d8" },
  numText: { fontFamily: GardenFonts.hand, fontSize: 19, color: "#5c4500", marginTop: -1 },
  note: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.muted, marginTop: 1 },
  body: { marginTop: 14, gap: 12 },
  hint: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#d9cdb9",
    borderRadius: GardenRadii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft, lineHeight: 18 },
});
