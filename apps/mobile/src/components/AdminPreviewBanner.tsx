import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

type AdminPreviewBannerProps = {
  onExit: () => void;
};

export function AdminPreviewBanner({ onExit }: AdminPreviewBannerProps) {
  const insets = useSafeAreaInsets();
  const { impersonatedParentName } = useAuth();

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <View style={styles.left}>
        <Ionicons name="eye-outline" size={14} color="#A3D9A5" />
        <Text style={styles.text} numberOfLines={1}>
          Admin Preview — Read Only{" "}
          <Text style={styles.name}>{impersonatedParentName ?? "Parent"}</Text>
        </Text>
      </View>
      <Pressable onPress={onExit} hitSlop={8}>
        <Text style={styles.exit}>Exit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1C3A22",
    borderBottomWidth: 1,
    borderBottomColor: "#2C5F2E",
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#A3D9A5",
  },
  name: {
    fontWeight: "700",
    color: "#ffffff",
  },
  exit: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A3D9A5",
    textDecorationLine: "underline",
  },
});
