import { Brand, FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  labelColor: string;
  backgroundColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  onPress: () => void;
};

function QuickAccessRow({
  icon,
  iconColor,
  label,
  labelColor,
  backgroundColor,
  borderColor,
  badgeBg,
  badgeText,
  onPress,
}: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardButton,
        { backgroundColor, borderColor },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={15} color={iconColor} />
        <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </View>
    </Pressable>
  );
}

type Props = {
  allergyCount: number;
  showAllergiesRow: boolean;
  schoolDayFoodCount: number;
  schoolDayFoodLoading: boolean;
  activityPrefCount: number;
  activityPrefsLoading: boolean;
  onOpenAllergies: () => void;
  onOpenSchoolDayFood: () => void;
  onOpenActivityPrefs: () => void;
};

export function StaffHealthFoodSection({
  allergyCount,
  showAllergiesRow,
  schoolDayFoodCount,
  schoolDayFoodLoading,
  activityPrefCount,
  activityPrefsLoading,
  onOpenAllergies,
  onOpenSchoolDayFood,
  onOpenActivityPrefs,
}: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Health & Food</Text>
      <View style={styles.buttonStack}>
        {showAllergiesRow && (
          <QuickAccessRow
            icon="medical"
            iconColor="#dc2626"
            label="Allergies for Today"
            labelColor="#dc2626"
            backgroundColor="#fef2f2"
            borderColor="#fecaca"
            badgeBg="#dc2626"
            badgeText={String(allergyCount)}
            onPress={onOpenAllergies}
          />
        )}

        <QuickAccessRow
          icon="restaurant-outline"
          iconColor="#b45309"
          label="School Day Food Preferences"
          labelColor="#b45309"
          backgroundColor="#fffbeb"
          borderColor="#fde68a"
          badgeBg="#b45309"
          badgeText={schoolDayFoodLoading ? "…" : String(schoolDayFoodCount)}
          onPress={onOpenSchoolDayFood}
        />

        <QuickAccessRow
          icon="clipboard-outline"
          iconColor={Brand.sage700}
          label="Activity Preferences This Week"
          labelColor={Brand.sage700}
          backgroundColor="#f0fdf4"
          borderColor="#bbf7d0"
          badgeBg={Brand.sage700}
          badgeText={activityPrefsLoading ? "…" : String(activityPrefCount)}
          onPress={onOpenActivityPrefs}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 10,
  },
  buttonStack: {
    gap: 8,
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    flexShrink: 1,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
});
