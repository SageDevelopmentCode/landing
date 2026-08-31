import { FontFamilies, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function BillingPreviewBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="eye-outline" size={16} color="#1C3A22" />
      <Text style={styles.text}>Admin Preview — Read Only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#A3D9A5",
  },
  text: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1C3A22",
  },
});
