// Chunky "toy" button: a coloured face sitting on a deeper base that it
// presses down into. Loading + success states give instant feedback.
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from "react-native-reanimated";
import {
  DISPLAY_MAX_SCALE,
  Garden,
  GardenFonts,
  GardenSprings,
  MIN_TAP,
} from "./gardenTheme";
import { haptic } from "./haptics";

type Tone = "coral" | "sage" | "ink" | "outline" | "butter";

const TONES: Record<Tone, { face: string; base: string; text: string; border?: string }> = {
  // Mobile uses coral-deep as the face so white bold text clears 3:1 at small sizes.
  coral: { face: Garden.coralDeep, base: "#c0594d", text: Garden.white },
  sage: { face: Garden.sage, base: Garden.sageDeep, text: Garden.white },
  ink: { face: Garden.ink, base: "#000000", text: Garden.white },
  butter: { face: Garden.butter, base: Garden.butterDeep, text: Garden.ink },
  outline: { face: Garden.white, base: Garden.ink, text: Garden.ink, border: Garden.ink },
};

export type GardenButtonProps = {
  label: string;
  onPress?: () => void;
  tone?: Tone;
  size?: "md" | "sm";
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  iconRight?: React.ComponentProps<typeof Ionicons>["name"];
  loading?: boolean;
  loadingLabel?: string;
  /** When flipped to true the button briefly shows a ✓ and the success label. */
  success?: boolean;
  successLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function GardenButton({
  label,
  onPress,
  tone = "coral",
  size = "md",
  icon,
  iconRight,
  loading,
  loadingLabel,
  success,
  successLabel = "Done",
  disabled,
  fullWidth,
  style,
  accessibilityHint,
}: GardenButtonProps) {
  const t = TONES[tone];
  const depth = size === "sm" ? 3 : 5;
  const press = useSharedValue(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    setShowSuccess(true);
    const id = setTimeout(() => setShowSuccess(false), 1600);
    return () => clearTimeout(id);
  }, [success]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * depth }],
  }));

  const inactive = disabled || loading;
  const height = size === "sm" ? 38 : 50;
  const text = showSuccess ? successLabel : loading ? (loadingLabel ?? label) : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      hitSlop={size === "sm" ? 6 : 0}
      onPressIn={() => {
        press.value = withSpring(1, GardenSprings.press);
        haptic.press();
      }}
      onPressOut={() => {
        press.value = withSpring(0, GardenSprings.pop);
      }}
      onPress={onPress}
      style={[
        { minHeight: Math.max(height + depth, MIN_TAP) },
        fullWidth ? { alignSelf: "stretch" } : { alignSelf: "flex-start" },
        inactive && !loading && { opacity: 0.5 },
        style,
      ]}
    >
      <View
        style={[
          styles.base,
          { backgroundColor: t.base, top: depth, height, borderRadius: height / 2 },
        ]}
      />
      <Animated.View
        style={[
          styles.face,
          {
            backgroundColor: t.face,
            height,
            borderRadius: height / 2,
            paddingHorizontal: size === "sm" ? 14 : 20,
            borderWidth: t.border ? 2 : 0,
            borderColor: t.border,
          },
          faceStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={t.text} />
        ) : showSuccess ? (
          <Animated.View entering={ZoomIn.springify()}>
            <Ionicons name="checkmark-circle" size={size === "sm" ? 16 : 19} color={t.text} />
          </Animated.View>
        ) : icon ? (
          <Ionicons name={icon} size={size === "sm" ? 15 : 18} color={t.text} />
        ) : null}
        <Text
          maxFontSizeMultiplier={DISPLAY_MAX_SCALE}
          numberOfLines={1}
          style={[
            styles.label,
            { color: t.text, fontSize: size === "sm" ? 13 : 15 },
          ]}
        >
          {text}
        </Text>
        {iconRight && !loading && !showSuccess ? (
          <Ionicons name={iconRight} size={size === "sm" ? 14 : 16} color={t.text} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    letterSpacing: 0.1,
  },
});
