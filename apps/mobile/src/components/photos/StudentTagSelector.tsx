// Garden student tagger for staff photos: search, a 44pt avatar row per
// student, a consent pill (Limited / No Consent — always with text, never
// colour alone) and a checkbox. Same props as before.
import {
  Garden,
  GardenAvatar,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  Pill,
  haptic,
} from "@/components/garden";
import type { ConsentLevel, StudentWithConsent } from "@/lib/photos-actions";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  students: StudentWithConsent[];
  selected: string[];
  onToggle: (studentId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading?: boolean;
}

export const CONSENT_META: Record<ConsentLevel, { label: string; tint: "sage" | "butter" | "coral"; icon: string }> = {
  FULL: { label: "Full", tint: "sage", icon: "✓" },
  LIMITED: { label: "Limited", tint: "butter", icon: "⚠️" },
  NO: { label: "No Consent", tint: "coral", icon: "⛔" },
};

export function ConsentPill({ level }: { level: ConsentLevel | null }) {
  if (!level || level === "FULL") return null;
  const m = CONSENT_META[level];
  return (
    <Pill tint={m.tint}>
      {m.icon} {m.label}
    </Pill>
  );
}

export function StudentTagSelector({ students, selected, onToggle, searchQuery, onSearchChange, loading }: Props) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = students.filter((s) => (s.name ?? "").toLowerCase().includes(q));
  // Selected students float to the top so a teacher can see who's tagged.
  const ordered = [
    ...filtered.filter((s) => selected.includes(s.student_id)),
    ...filtered.filter((s) => !selected.includes(s.student_id)),
  ];

  return (
    <View style={styles.wrap}>
      <GardenField
        icon="search-outline"
        placeholder="Search students…"
        value={searchQuery}
        onChangeText={onSearchChange}
        autoCorrect={false}
        clearable
        containerStyle={{ margin: 10 }}
        accessibilityLabel="Search students"
      />

      {loading ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 10 }} accessibilityLabel="Loading students">
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <GardenSkeleton width={40} height={40} radius={20} />
              <GardenSkeleton width="55%" height={14} radius={6} />
            </View>
          ))}
        </View>
      ) : ordered.length === 0 ? (
        <Text style={styles.empty} maxFontSizeMultiplier={1.4}>
          {searchQuery ? "No students match your search" : "No enrolled students found"}
        </Text>
      ) : (
        ordered.map((item) => {
          const on = selected.includes(item.student_id);
          const name = item.name ?? "Unknown";
          const consent = item.consent_level ? CONSENT_META[item.consent_level].label : "unknown consent";
          return (
            <Pressable
              key={item.student_id}
              onPress={() => {
                haptic.select();
                onToggle(item.student_id);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${name}, ${consent} photo consent`}
              style={({ pressed }) => [styles.row, on && styles.rowOn, pressed && { opacity: 0.85 }]}
            >
              <GardenAvatar name={name} uri={item.profile_image_url} seed={item.student_id} size={40} />
              <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {name}
              </Text>
              <ConsentPill level={item.consent_level} />
              <View style={[styles.check, on && styles.checkOn]}>
                {on ? <Ionicons name="checkmark" size={15} color={Garden.white} /> : null}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.md,
    borderWidth: 1,
    borderColor: Garden.line,
    overflow: "hidden",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Garden.line,
  },
  rowOn: { backgroundColor: GardenTints.sage.bg },
  name: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d9cdb9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Garden.white,
  },
  checkOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  empty: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 14,
    color: Garden.muted,
    textAlign: "center",
    paddingVertical: 18,
  },
});
