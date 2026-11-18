import { GardenFonts, GardenTints } from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function BillingPreviewBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="eye-outline" size={16} color={GardenTints.sky.fg} />
      <Text style={styles.text}>Admin Preview — Read Only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GardenTints.sky.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GardenTints.sky.bg,
  },
  text: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 12,
    color: GardenTints.sky.fg,
  },
});
