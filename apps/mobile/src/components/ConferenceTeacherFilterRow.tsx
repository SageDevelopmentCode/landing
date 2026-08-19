import { Brand, FontFamilies } from "@/constants/theme";
import { CONFERENCE_TEACHERS } from "@/lib/parent-teacher-conference";
import type { ConferenceTeacherFilter } from "@/lib/staff-conference-bookings";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  filter: ConferenceTeacherFilter;
  onFilterChange: (filter: ConferenceTeacherFilter) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

function teacherFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

const filterChips: { key: ConferenceTeacherFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  ...CONFERENCE_TEACHERS.map((t) => ({
    key: t.id,
    label: teacherFirstName(t.name),
  })),
];

export function ConferenceTeacherFilterRow({
  filter,
  onFilterChange,
  style,
  contentContainerStyle,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.filterRow, contentContainerStyle]}
      style={style}
    >
      {filterChips.map(({ key, label }) => (
        <Pressable
          key={key}
          style={[
            styles.filterChip,
            filter === key && styles.filterChipActive,
          ]}
          onPress={() => onFilterChange(key)}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === key && styles.filterChipTextActive,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: Brand.sage700 + "18",
    borderColor: Brand.sage700 + "50",
  },
  filterChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: Brand.sage700,
  },
});
