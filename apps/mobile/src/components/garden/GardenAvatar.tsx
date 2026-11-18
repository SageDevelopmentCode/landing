// Round avatar: photo, or pastel initials that never crash on empty names.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Garden, GardenFonts } from "./gardenTheme";

const PASTELS = [
  { bg: Garden.mint, fg: "#2f6b44" },
  { bg: Garden.sky, fg: "#2f5f8a" },
  { bg: Garden.lav, fg: "#6b4785" },
  { bg: Garden.peach, fg: "#a2522a" },
  { bg: "#fff3c4", fg: "#7a5a00" },
  { bg: "#fde3df", fg: "#b9554a" },
];

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function pastelFor(seed: string | null | undefined) {
  const s = seed ?? "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PASTELS[Math.abs(h) % PASTELS.length];
}

export function GardenAvatar({
  name,
  uri,
  size = 44,
  seed,
  icon,
  style,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
  /** Colour seed (defaults to name). */
  seed?: string | null;
  /** Show an icon instead of initials (e.g. "people" for group threads). */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  style?: StyleProp<ViewStyle>;
}) {
  const p = pastelFor(seed ?? name);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: p.bg },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : icon ? (
        <Ionicons name={icon} size={size * 0.46} color={p.fg} />
      ) : (
        <Text
          maxFontSizeMultiplier={1.1}
          style={{ fontFamily: GardenFonts.display, fontSize: size * 0.36, color: p.fg }}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Garden.white,
  },
});
