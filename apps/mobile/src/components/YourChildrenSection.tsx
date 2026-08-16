import { Brand, FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type ChildPreview = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
  teacher_name: string | null;
};

type Props = {
  students: ChildPreview[];
  onViewAll: () => void;
  onSelectStudent: (studentId: string) => void;
};

const AVATAR_COLORS = [
  { bg: "#d4e6d0", text: "#4a7c59" },
  { bg: "#dce8f5", text: "#4a7394" },
  { bg: "#f5e8d4", text: "#946e3a" },
  { bg: "#f5d4e4", text: "#944a6e" },
  { bg: "#e4d4f5", text: "#6e4a94" },
  { bg: "#d4f5e4", text: "#3a9468" },
] as const;

function avatarColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ChildCard({
  student,
  onPress,
}: {
  student: ChildPreview;
  onPress: () => void;
}) {
  const firstName = student.child_legal_name.trim().split(/\s+/)[0];
  const accent = avatarColor(student.child_legal_name);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${firstName}'s profile`}
      hitSlop={4}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View
        style={[styles.accentWash, { backgroundColor: accent.bg }]}
        pointerEvents="none"
      />
      <View style={styles.avatarZone}>
        <View style={[styles.avatarRing, { borderColor: accent.text }]}>
          {student.profile_image_url ? (
            <Image
              source={{ uri: student.profile_image_url }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[styles.avatarInitials, { backgroundColor: accent.bg }]}
            >
              <Text style={[styles.avatarInitialsText, { color: accent.text }]}>
                {getInitials(student.child_legal_name)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {firstName}
        </Text>
        {student.teacher_name ? (
          <View
            style={[styles.teacherPill, { backgroundColor: accent.bg + "cc" }]}
          >
            <Text
              style={[styles.teacherPillText, { color: accent.text }]}
              numberOfLines={1}
            >
              {student.teacher_name}
            </Text>
          </View>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>View profile</Text>
          <Ionicons name="chevron-forward" size={14} color={Brand.sage700} />
        </View>
      </View>
    </Pressable>
  );
}

export function YourChildrenSection({
  students,
  onViewAll,
  onSelectStudent,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Your children</Text>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          onPress={onViewAll}
          hitSlop={8}
        >
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardRow}
      >
        {students.map((s) => (
          <ChildCard
            key={s.id}
            student={s}
            onPress={() => onSelectStudent(s.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  heading: {
    fontFamily: FontFamilies.headingRegular,
    fontSize: 16,
    color: "#4b5563",
  },
  viewAll: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  cardRow: {
    paddingHorizontal: 24,
    paddingBottom: 6,
    gap: 12,
  },
  card: {
    width: 172,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  accentWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    opacity: 0.35,
  },
  avatarZone: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 4,
  },
  avatarRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarInitials: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 20,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 6,
  },
  cardName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1a3320",
  },
  teacherPill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  teacherPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
});
