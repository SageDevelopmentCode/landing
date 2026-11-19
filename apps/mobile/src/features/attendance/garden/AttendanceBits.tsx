// Small shared attendance bits (tints, status pill, date format).
import { GardenFonts, GardenRadii, GardenTints, type GardenTint } from "@/components/garden";
import type { AttendanceProgram, AttendanceStatus } from "@/lib/parent-student-attendance";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export const PROGRAM_TINT: Record<AttendanceProgram, GardenTint> = {
  summer: "butter",
  aftercare: "lav",
  field_friday: "sky",
  school_year: "sage",
  school_year_field_friday: "sky",
};

export const STATUS_META: Record<
  AttendanceStatus,
  { label: string; tint: GardenTint; icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  attended: { label: "Attended", tint: "sage", icon: "checkmark-circle" },
  picked_up: { label: "Picked Up", tint: "mint", icon: "car" },
  absent: { label: "Absent", tint: "butter", icon: "moon" },
};

export function formatYMD(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StatusPill({ status }: { status: AttendanceStatus }) {
  const meta = STATUS_META[status];
  const t = GardenTints[meta.tint];
  return (
    <View style={[s.pill, { backgroundColor: t.bg }]}>
      <Ionicons name={meta.icon} size={12} color={t.fg} />
      <Text style={[s.pillText, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
        {meta.label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },
});
