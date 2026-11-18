// Inline Garden error for the billing sheets (validation / Stripe messages).
import { Garden, GardenFonts, GardenRadii } from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export function GardenInlineError({ message, style }: { message: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.wrap, style]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={18} color={Garden.danger} />
      <Text style={s.text} maxFontSizeMultiplier={1.4}>
        {message}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Garden.dangerTint,
    borderRadius: GardenRadii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, lineHeight: 19, color: Garden.danger },
});
