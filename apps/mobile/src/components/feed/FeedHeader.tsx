import { Brand, FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FeedTheme } from "./feedTheme";

export function FeedHeader({
  title,
  subtitle,
  activeFilterLabel,
  filterActive,
  onFilterPress,
}: {
  title: string;
  subtitle?: string;
  activeFilterLabel?: string;
  filterActive: boolean;
  onFilterPress: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {activeFilterLabel && <Text style={styles.filterLabel}>{activeFilterLabel}</Text>}
      </View>
      <TouchableOpacity onPress={onFilterPress} style={styles.filterBtn} activeOpacity={0.7}>
        <Ionicons name="funnel" size={18} color={filterActive ? Brand.coral : Brand.sage700} />
        {filterActive && <View style={styles.filterDot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: FeedTheme.canvas,
  },
  pageTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 28,
    color: "#3D5C4A",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  filterLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.coral,
    marginTop: 4,
  },
  filterBtn: {
    padding: 8,
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.coral,
  },
});
