// 44pt round white icon button with an optional count badge or coral dot.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { CountBadge } from "./GardenBits";
import { Garden } from "./gardenTheme";
import { PressableScale } from "./PressableScale";

export function GardenIconButton({
  icon,
  label,
  onPress,
  badge,
  dot,
  tone = "white",
  size = 44,
  iconSize = 20,
  disabled,
  style,
  hint,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  badge?: number;
  dot?: boolean;
  tone?: "white" | "sage" | "coral" | "ghost";
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hint?: string;
}) {
  const bg =
    tone === "sage" ? Garden.sage : tone === "coral" ? Garden.coralDeep : tone === "ghost" ? "transparent" : Garden.white;
  const fg = tone === "sage" || tone === "coral" ? Garden.white : Garden.ink;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={size < 44 ? (44 - size) / 2 + 2 : 0}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: tone === "white" ? 1 : 0,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={fg} />
      {badge ? (
        <View style={styles.badgePos}>
          <CountBadge count={badge} />
        </View>
      ) : dot ? (
        <View style={styles.dot} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: Garden.line,
  },
  badgePos: { position: "absolute", top: -3, right: -4 },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Garden.coralDeep,
    borderWidth: 1.5,
    borderColor: Garden.white,
  },
});
