import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { Brand, FontFamilies } from "@/constants/theme";
import {
  formatBirthdayDate,
  formatFullDob,
  getUpcomingBirthdays,
  groupBirthdaysByMonth,
  type StaffBirthday,
  UPCOMING_BIRTHDAY_DAYS,
} from "@/lib/staff-upcoming-birthdays";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

type Props = {
  birthdays: StaffBirthday[];
  loading: boolean;
};

function BirthdayCard({ birthday }: { birthday: StaffBirthday }) {
  const router = useRouter();
  const isToday = birthday.daysUntil === 0;
  const isSoon = birthday.daysUntil > 0 && birthday.daysUntil <= UPCOMING_BIRTHDAY_DAYS;
  const dateLabel = formatBirthdayDate(birthday);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        (isToday || isSoon) && styles.cardHighlight,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() =>
        router.push({
          pathname: "/(staff)/students/[studentId]" as any,
          params: { studentId: birthday.studentId },
        })
      }
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor(birthday.studentId) }]}>
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

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{birthday.name}</Text>
        <Text style={styles.cardDob}>{formatFullDob(birthday)}</Text>
        <Text style={styles.cardMeta}>
          Age {birthday.currentAge} · Turns {birthday.turningAge} on {dateLabel}
        </Text>
      </View>

      {isToday ? (
        <View style={styles.badgeToday}>
          <Text style={styles.badgeTodayText}>Today</Text>
        </View>
      ) : isSoon ? (
        <View style={styles.badgeSoon}>
          <Text style={styles.badgeSoonText}>Soon</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      )}
    </Pressable>
  );
}

export const StaffAllBirthdaysSheet = forwardRef<BottomSheetModal, Props>(
  function StaffAllBirthdaysSheet({ birthdays, loading }, ref) {
    const monthGroups = groupBirthdaysByMonth(birthdays);
    const upcomingCount = getUpcomingBirthdays(birthdays).length;

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%", "90%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>All Student Birthdays</Text>
          <Text style={styles.subtitle}>School year enrollments</Text>

          {loading ? (
            <View style={styles.loadingStack}>
              <SkeletonBox width="100%" height={36} borderRadius={10} />
              {[0, 1, 2].map((i) => (
                <SkeletonBox key={i} width="100%" height={72} borderRadius={12} />
              ))}
            </View>
          ) : birthdays.length === 0 ? (
            <Text style={styles.emptyText}>No student birthdays found.</Text>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryChip}>
                  <Ionicons name="people-outline" size={14} color={Brand.sage700} />
                  <Text style={styles.summaryChipText}>
                    {birthdays.length} students
                  </Text>
                </View>
                {upcomingCount > 0 && (
                  <View style={[styles.summaryChip, styles.summaryChipAmber]}>
                    <Ionicons name="gift-outline" size={14} color="#b45309" />
                    <Text style={styles.summaryChipTextAmber}>
                      {upcomingCount} this week
                    </Text>
                  </View>
                )}
              </View>

              {monthGroups.map((group) => (
                <View key={group.month} style={styles.monthSection}>
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthTitle}>{group.monthLabel}</Text>
                    <View style={styles.monthCountBadge}>
                      <Text style={styles.monthCountText}>
                        {group.birthdays.length}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.monthCards}>
                    {group.birthdays.map((birthday) => (
                      <BirthdayCard key={birthday.studentId} birthday={birthday} />
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 16,
  },
  loadingStack: {
    gap: 10,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryChipAmber: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  summaryChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  summaryChipTextAmber: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#b45309",
  },
  monthSection: {
    marginBottom: 18,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  monthTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: Brand.sage700,
  },
  monthCountBadge: {
    backgroundColor: Brand.sage700,
    borderRadius: 10,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: "center",
  },
  monthCountText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  monthCards: {
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  cardHighlight: {
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  cardDob: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  cardMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  badgeToday: {
    backgroundColor: "#b45309",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTodayText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  badgeSoon: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSoonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#b45309",
  },
});
