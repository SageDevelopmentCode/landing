import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { Brand, FontFamilies } from "@/constants/theme";
import {
  formatConferenceFormatLabel,
  formatUpcomingRelativeDay,
  getUpcomingBookings,
  type StaffConferenceBooking,
  UPCOMING_CONFERENCE_DAYS,
} from "@/lib/staff-conference-bookings";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  bookings: StaffConferenceBooking[];
  loading: boolean;
  todayYmd: string;
  onViewAll: () => void;
};

function shortName(name: string | null | undefined): string {
  if (!name?.trim()) return "Parent";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function formatDateBlock(date: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const d = new Date(`${date}T12:00:00`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: String(d.getDate()),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

function ConferencePreviewCard({
  booking,
  onPress,
}: {
  booking: StaffConferenceBooking;
  onPress: () => void;
}) {
  const { weekday, day, month } = formatDateBlock(booking.conferenceDate);
  const isInPerson = booking.format === "in_person";

  return (
    <Pressable
      style={({ pressed }) => [styles.previewCard, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.dateWeekday}>{weekday}</Text>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>

      <View style={styles.previewMain}>
        <Text style={styles.previewStudentName} numberOfLines={1}>
          {booking.studentName}
        </Text>
        <Text style={styles.previewParent} numberOfLines={1}>
          Parent: {shortName(booking.parentName)}
        </Text>
        <View style={styles.previewTimeRow}>
          <Ionicons name="time-outline" size={12} color="#6b7280" />
          <Text style={styles.previewTime}>{booking.timeSlot}</Text>
          <View
            style={[
              styles.formatChip,
              isInPerson ? styles.formatChipInPerson : styles.formatChipVirtual,
            ]}
          >
            <Text
              style={[
                styles.formatChipText,
                isInPerson
                  ? styles.formatChipTextInPerson
                  : styles.formatChipTextVirtual,
              ]}
            >
              {formatConferenceFormatLabel(booking.format)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function StaffConferenceSection({
  bookings,
  loading,
  todayYmd,
  onViewAll,
}: Props) {
  const upcoming = getUpcomingBookings(bookings, todayYmd);
  const alertBooking = upcoming[0] ?? null;
  const preview = bookings.slice(0, 3);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parent-Teacher Conferences</Text>
        {!loading && bookings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{bookings.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <SkeletonBox width="100%" height={72} borderRadius={12} />
          <SkeletonBox width="100%" height={72} borderRadius={12} />
        </View>
      ) : bookings.length === 0 ? (
        <Text style={styles.emptyText}>No conferences scheduled yet.</Text>
      ) : (
        <>
          {alertBooking && (
            <View style={styles.alertCard}>
              <View style={styles.alertIconWrap}>
                <Ionicons name="calendar" size={16} color="#b45309" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  Conference with {alertBooking.studentName}{" "}
                  {formatUpcomingRelativeDay(
                    alertBooking.conferenceDate,
                    todayYmd,
                  )}{" "}
                  · {alertBooking.timeSlot} (
                  {formatConferenceFormatLabel(alertBooking.format)})
                </Text>
                {upcoming.length > 1 && (
                  <Text style={styles.alertSubtitle}>
                    {upcoming.length - 1} more conference
                    {upcoming.length - 1 === 1 ? "" : "s"} in the next{" "}
                    {UPCOMING_CONFERENCE_DAYS} days
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.previewList}>
            {preview.map((booking) => (
              <ConferencePreviewCard
                key={booking.id}
                booking={booking}
                onPress={onViewAll}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onViewAll}
          >
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={16} color={Brand.sage700} />
          </Pressable>
        </>
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
  },
  countBadge: {
    backgroundColor: Brand.sage700 + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  countBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  loadingWrap: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  alertIconWrap: {
    marginTop: 1,
  },
  alertContent: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  alertSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#b45309",
  },
  previewList: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    padding: 12,
  },
  dateBlock: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.sage700 + "15",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dateWeekday: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
    textTransform: "uppercase",
  },
  dateDay: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: "#1f2937",
    lineHeight: 22,
  },
  dateMonth: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },
  previewMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewStudentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  previewParent: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  previewTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  previewTime: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#374151",
    flexShrink: 1,
  },
  formatChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    marginLeft: "auto" as const,
  },
  formatChipInPerson: {
    backgroundColor: Brand.sage700 + "20",
  },
  formatChipVirtual: {
    backgroundColor: "#f3f4f6",
  },
  formatChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
  },
  formatChipTextInPerson: {
    color: Brand.sage700,
  },
  formatChipTextVirtual: {
    color: "#6b7280",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  viewAllText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
});
