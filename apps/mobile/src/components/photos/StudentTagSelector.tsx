import { FlatList, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies } from "@/constants/theme";
import type { StudentWithConsent, ConsentLevel } from "@/lib/photos-actions";

interface Props {
  students: StudentWithConsent[];
  selected: string[];
  onToggle: (studentId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading?: boolean;
}

const CONSENT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  FULL:    { bg: "#dcfce7", text: "#166534", label: "Full" },
  LIMITED: { bg: "#fef9c3", text: "#854d0e", label: "Limited" },
  NO:      { bg: "#fee2e2", text: "#991b1b", label: "No Consent" },
};

function ConsentBadge({ level }: { level: ConsentLevel | null }) {
  if (!level || level === "FULL") return null;
  const cfg = CONSENT_BADGE[level];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function Initials({ name }: { name: string | null }) {
  const letters = (name ?? "?")
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View style={styles.initials}>
      <Text style={styles.initialsText}>{letters}</Text>
    </View>
  );
}

export function StudentTagSelector({
  students,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  loading,
}: Props) {
  const filtered = students.filter((s) =>
    (s.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students…"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={Brand.sage700} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.student_id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.student_id);
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => onToggle(item.student_id)}
              >
                {item.profile_image_url ? (
                  <Image
                    source={{ uri: item.profile_image_url }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <Initials name={item.name} />
                )}
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Unknown"}
                </Text>
                <ConsentBadge level={item.consent_level} />
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery ? "No students match your search" : "No enrolled students found"}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
  },
  loader: {
    padding: 24,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  rowPressed: {
    backgroundColor: "#f9fafb",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
  },
  initials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  name: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
});
