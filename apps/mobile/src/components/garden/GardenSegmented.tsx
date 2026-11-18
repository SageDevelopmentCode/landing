// Segmented control: a sliding sage thumb, select haptic, optional badges.
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { CountBadge } from "./GardenBits";
import { Garden, GardenFonts, GardenRadii, GardenSprings, MIN_TAP } from "./gardenTheme";
import { haptic } from "./haptics";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  badge?: number;
  /** Small coral dot instead of a count. */
  dot?: boolean;
};

export function GardenSegmented<T extends string>({
  options,
  value,
  onChange,
  style,
  accessibilityLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segW = width > 0 ? (width - 8) / options.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    const target = index * segW;
    x.value = reduce ? target : withSpring(target, GardenSprings.gentle);
  }, [index, segW, reduce, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, style]}
    >
      {segW > 0 ? <Animated.View pointerEvents="none" style={[styles.thumb, { width: segW }, thumb]} /> : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.badge ? `${o.label}, ${o.badge} unread` : o.label}
            onPress={() => {
              if (selected) return;
              haptic.select();
              onChange(o.value);
            }}
            style={styles.seg}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={[styles.label, { color: selected ? Garden.white : Garden.soft }]}
            >
              {o.label}
            </Text>
            {o.badge ? (
              <CountBadge count={o.badge} />
            ) : o.dot ? (
              <View style={styles.dot} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderRadius: GardenRadii.pill,
    backgroundColor: "#f3eadc",
    borderWidth: 1,
    borderColor: Garden.line,
  },
  thumb: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.sageDeep,
  },
  seg: {
    flex: 1,
    minHeight: MIN_TAP - 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Garden.coralDeep },
});
