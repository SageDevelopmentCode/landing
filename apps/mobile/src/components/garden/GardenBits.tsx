// Small Garden building blocks: pills, handwritten notes, sticky notes,
// polaroids, seed progress, section headers, empty + skeleton states.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  DISPLAY_MAX_SCALE,
  Garden,
  GardenFonts,
  GardenRadii,
  GardenTints,
  gardenShadowSm,
  type GardenTint,
} from "./gardenTheme";
import { GardenButton } from "./GardenButton";

// ─── Pill ────────────────────────────────────────────────────────────────────
export function Pill({
  children,
  tint = "sage",
  style,
  textStyle,
}: {
  children: ReactNode;
  tint?: GardenTint;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const t = GardenTints[tint];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[styles.pillText, { color: t.fg }, textStyle]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

// ─── Count badge ─────────────────────────────────────────────────────────────
export function CountBadge({ count, color = Garden.coralDeep }: { count: number; color?: string }) {
  const scale = useSharedValue(1);
  const mounted = useRef(false);
  useEffect(() => {
    // No pop on first render; a soft nudge only when the count changes.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scale.value = withSequence(withTiming(1.08, { duration: 140 }), withTiming(1, { duration: 220 }));
  }, [count, scale]);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (count <= 0) return null;
  return (
    <Animated.View style={[styles.badge, { backgroundColor: color }, s]}>
      <Text maxFontSizeMultiplier={1.2} style={styles.badgeText}>
        {count > 9 ? "9+" : count}
      </Text>
    </Animated.View>
  );
}

// ─── Handwritten note ────────────────────────────────────────────────────────
export function HandNote({
  children,
  color = Garden.sageDeep,
  size = 18,
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[{ fontFamily: GardenFonts.hand, fontSize: size, color }, style]}
    >
      {children}
    </Text>
  );
}

// ─── Display heading ─────────────────────────────────────────────────────────
export function Display({
  children,
  size = 26,
  color = Garden.ink,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={DISPLAY_MAX_SCALE}
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: GardenFonts.display,
          fontSize: size,
          lineHeight: size * 1.08,
          letterSpacing: -size * 0.03,
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─── Sticky note ─────────────────────────────────────────────────────────────
export function StickyNote({
  children,
  color = Garden.butter,
  tapeColor = "rgba(255,255,255,0.75)",
  tilt = -1.5,
  style,
}: {
  children: ReactNode;
  color?: string;
  tapeColor?: string;
  /** Degrees. Keep within ±2 on mobile. */
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = Math.max(-2, Math.min(2, tilt));
  return (
    <View style={[styles.sticky, { backgroundColor: color, transform: [{ rotate: `${t}deg` }] }, style]}>
      <View
        pointerEvents="none"
        style={[styles.tape, { backgroundColor: tapeColor }]}
      />
      {children}
    </View>
  );
}

// ─── Polaroid ────────────────────────────────────────────────────────────────
export function Polaroid({
  uri,
  initials,
  caption,
  subcaption,
  tilt = 0,
  width = 132,
  tapeColor = Garden.butter,
  bg = Garden.mint,
}: {
  uri?: string | null;
  initials: string;
  caption: string;
  subcaption?: string | null;
  tilt?: number;
  width?: number;
  tapeColor?: string;
  bg?: string;
}) {
  const photo = width - 16;
  return (
    <View style={[styles.polaroid, { width, transform: [{ rotate: `${tilt}deg` }] }]}>
      <View pointerEvents="none" style={[styles.polaroidTape, { backgroundColor: tapeColor }]} />
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: photo, height: photo, borderRadius: 3 }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={{
            width: photo,
            height: photo,
            borderRadius: 3,
            backgroundColor: bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={styles.polaroidInitials}>{initials}</Text>
        </View>
      )}
      <Text style={styles.polaroidCaption} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {caption}
      </Text>
      {subcaption ? (
        <Text style={styles.polaroidSub} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {subcaption}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Seed progress ───────────────────────────────────────────────────────────
function Seed({ done, index }: { done: boolean; index: number }) {
  const scale = useSharedValue(done ? 1 : 0.85);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      scale.value = 1;
      return;
    }
    scale.value = done
      ? withSequence(withTiming(1.1, { duration: 160 }), withTiming(1, { duration: 240 }))
      : withTiming(0.85, { duration: 160 });
  }, [done, reduce, scale]);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      key={index}
      style={[styles.seed, done ? styles.seedDone : styles.seedTodo, s]}
    >
      {done ? <Text style={styles.seedEmoji}>🌱</Text> : null}
    </Animated.View>
  );
}

export function SeedProgress({
  done,
  total,
  doneFlags,
}: {
  done: number;
  total: number;
  /** Optional per-step flags; otherwise the first `done` seeds sprout. */
  doneFlags?: boolean[];
}) {
  const flags = doneFlags ?? Array.from({ length: total }, (_, i) => i < done);
  return (
    <View
      style={styles.seedRow}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} of ${total} steps done`}
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      {flags.map((f, i) => (
        <Seed key={i} done={f} index={i} />
      ))}
    </View>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
export function GardenSectionHeader({
  title,
  note,
  actionLabel = "View all",
  onAction,
  style,
}: {
  title: string;
  note?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <Display size={22}>{title}</Display>
        {note ? <HandNote size={16}>{note}</HandNote> : null}
      </View>
      {onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel={`${actionLabel}: ${title}`}
          style={({ pressed }) => [styles.sectionLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.sectionLinkText} maxFontSizeMultiplier={1.3}>
            {actionLabel}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={Garden.sageDeep} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function GardenEmpty({
  emoji,
  title,
  body,
  actionLabel,
  onAction,
  tint = "mint",
  style,
}: {
  emoji: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  tint?: GardenTint;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.empty, { backgroundColor: GardenTints[tint].bg }, style]}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.4}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.emptyBody} maxFontSizeMultiplier={1.4}>
            {body}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <GardenButton
            label={actionLabel}
            onPress={onAction}
            tone="outline"
            size="sm"
            iconRight="arrow-forward"
            style={{ marginTop: 8 }}
          />
        ) : null}
      </View>
    </View>
  );
}

// ─── Error card ──────────────────────────────────────────────────────────────
export function GardenErrorCard({
  title = "We couldn't load everything",
  body,
  onRetry,
  retrying,
}: {
  title?: string;
  body?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <View style={styles.error} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={22} color={Garden.danger} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.emptyTitle, { color: Garden.danger }]}>{title}</Text>
        <Text style={styles.emptyBody}>
          {body ?? "Check your connection and try again."}
        </Text>
      </View>
      <GardenButton
        label="Retry"
        loadingLabel="Retrying"
        loading={retrying}
        onPress={onRetry}
        tone="outline"
        size="sm"
      />
    </View>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function GardenSkeleton({
  width,
  height,
  radius = 12,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [o, reduce]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: "#f1e7d8" }, s, style]}
    />
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Garden.white,
  },
  badgeText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 10,
    color: Garden.white,
  },
  sticky: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 16,
    ...gardenShadowSm,
  },
  tape: {
    position: "absolute",
    top: -9,
    alignSelf: "center",
    width: 78,
    height: 20,
    borderRadius: 3,
    transform: [{ rotate: "-3deg" }],
  },
  polaroid: {
    backgroundColor: Garden.white,
    padding: 8,
    paddingBottom: 12,
    borderRadius: 4,
    alignItems: "center",
    ...gardenShadowSm,
  },
  polaroidTape: {
    position: "absolute",
    top: -8,
    width: 52,
    height: 16,
    borderRadius: 2,
    opacity: 0.85,
    zIndex: 2,
    transform: [{ rotate: "-4deg" }],
  },
  polaroidInitials: {
    fontFamily: GardenFonts.display,
    fontSize: 30,
    color: Garden.sageDeep,
  },
  polaroidCaption: {
    marginTop: 8,
    fontFamily: GardenFonts.hand,
    fontSize: 19,
    color: Garden.ink,
  },
  polaroidSub: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 11,
    color: Garden.muted,
  },
  seedRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  seed: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  seedTodo: {
    backgroundColor: "rgba(43,42,38,0.08)",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(43,42,38,0.25)",
  },
  seedDone: {
    backgroundColor: Garden.mint,
  },
  seedEmoji: { fontSize: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 12,
  },
  sectionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  sectionLinkText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 14,
    color: Garden.sageDeep,
  },
  empty: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: GardenRadii.md,
    padding: 16,
  },
  emptyEmoji: { fontSize: 26 },
  emptyTitle: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 15,
    color: Garden.ink,
  },
  emptyBody: {
    fontFamily: GardenFonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Garden.soft,
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: GardenRadii.md,
    padding: 14,
    backgroundColor: Garden.dangerTint,
  },
});
