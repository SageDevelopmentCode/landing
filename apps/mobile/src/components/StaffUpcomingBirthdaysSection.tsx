import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { Brand, FontFamilies } from "@/constants/theme";
import {
  formatBirthdayRelativeDay,
  type StaffBirthday,
  UPCOMING_BIRTHDAY_DAYS,
} from "@/lib/staff-upcoming-birthdays";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PREVIEW_LIMIT = 3;

const AVATAR_PALETTE = [
  "#5E7C68",
  "#8b6f47",
  "#6b8e7b",
  "#b08d57",
  "#5E7C68",
  "#c27c47",
];

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

type Props = {
  birthdays: StaffBirthday[];
  loading: boolean;
  totalCount: number;
  onViewAll: () => void;
};

function BirthdayRow({ birthday }: { birthday: StaffBirthday }) {
  const router = useRouter();
  const color = avatarColor(birthday.studentId);
  const relativeDay = formatBirthdayRelativeDay(
    birthday.daysUntil,
    birthday.birthdayYmd,
  );
  const isToday = birthday.daysUntil === 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        isToday && styles.rowToday,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() =>
        router.push({
          pathname: "/(staff)/students/[studentId]" as any,
          params: { studentId: birthday.studentId },
        })
      }
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        {birthday.profileImageUrl ? (
          <Image
            source={{ uri: birthday.profileImageUrl }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarText}>{getInitials(birthday.name)}</Text>
        )}
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {shortName(birthday.name)}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {relativeDay} · Turning {birthday.turningAge}
        </Text>
      </View>

      {isToday ? (
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>Today</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      )}
    </Pressable>
  );
}

export function StaffUpcomingBirthdaysSection({
  birthdays,
  loading,
  totalCount,
  onViewAll,
}: Props) {
  const previewBirthdays = birthdays.slice(0, PREVIEW_LIMIT);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Upcoming Birthdays</Text>
        {!loading && birthdays.length > 0 && (
          <Text style={styles.subtitle}>Next {UPCOMING_BIRTHDAY_DAYS} days</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingStack}>
          {[0, 1].map((i) => (
            <SkeletonBox
              key={i}
              width="100%"
              height={52}
              borderRadius={10}
            />
          ))}
        </View>
      ) : birthdays.length === 0 ? (
        <Text style={styles.emptyText}>
          No birthdays in the next {UPCOMING_BIRTHDAY_DAYS} days
        </Text>
      ) : (
        <View style={styles.rowStack}>
          {previewBirthdays.map((birthday) => (
            <BirthdayRow key={birthday.studentId} birthday={birthday} />
          ))}
        </View>
      )}

      {!loading && totalCount > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.viewAllButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={onViewAll}
        >
          <Text style={styles.viewAllText}>
            View all ({totalCount} students)
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Brand.sage700} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 18,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  loadingStack: {
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  rowStack: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  rowToday: {
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#fff",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  rowMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: "#b45309",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
});
