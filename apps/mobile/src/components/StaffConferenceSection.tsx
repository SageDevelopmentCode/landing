import { ConferenceTeacherFilterRow } from "@/components/ConferenceTeacherFilterRow";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { Brand, FontFamilies } from "@/constants/theme";
import {
  CONFERENCE_COUNTDOWN_STYLES,
  filterBookingsByTeacher,
  formatConferenceFormatLabel,
  formatUpcomingRelativeDay,
  getAlertBooking,
  getConferenceCountdown,
  getConferenceMinutesUntil,
  getUpcomingBookings,
  type ConferenceTeacherFilter,
  type StaffConferenceBooking,
  UPCOMING_CONFERENCE_DAYS,
} from "@/lib/staff-conference-bookings";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  bookings: StaffConferenceBooking[];
  loading: boolean;
  todayYmd: string;
  currentTeacherId: string;
  onOpenSheet?: () => void;
  onBookingPress: (bookingId: string) => void;
};

function shortName(name: string | null | undefined): string {
  if (!name?.trim()) return "Parent";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function teacherFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
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
  isOwn,
  now,
  onPress,
}: {
  booking: StaffConferenceBooking;
  isOwn: boolean;
  now: Date;
  onPress: () => void;
}) {
  const { weekday, day, month } = formatDateBlock(booking.conferenceDate);
  const isInPerson = booking.format === "in_person";
  const countdown = getConferenceCountdown(
    booking.conferenceDate,
    booking.timeSlot,
    now,
  );
  const countdownStyle = CONFERENCE_COUNTDOWN_STYLES[countdown.urgency];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.previewCard,
        isOwn ? styles.previewCardOwn : styles.previewCardOther,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.dateBlock, isOwn && styles.dateBlockOwn]}>
        <Text style={[styles.dateWeekday, isOwn && styles.dateWeekdayOwn]}>
          {weekday}
        </Text>
        <Text style={[styles.dateDay, isOwn && styles.dateDayOwn]}>{day}</Text>
        <Text style={[styles.dateMonth, isOwn && styles.dateMonthOwn]}>
          {month}
        </Text>
      </View>

      <View style={styles.previewMain}>
        <View style={styles.previewTitleRow}>
          <Text
            style={[styles.previewStudentName, isOwn && styles.previewStudentNameOwn]}
            numberOfLines={1}
          >
            {booking.studentName}
          </Text>
          <View
            style={[
              styles.countdownBadge,
              { backgroundColor: countdownStyle.backgroundColor },
            ]}
          >
            <Text
              style={[styles.countdownBadgeText, { color: countdownStyle.color }]}
            >
              {countdown.label}
            </Text>
          </View>
          {isOwn ? (
            <View style={styles.ownBadgeInverted}>
              <Text style={styles.ownBadgeInvertedText}>Your conference</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[styles.previewParent, isOwn && styles.previewParentOwn]}
          numberOfLines={1}
        >
          Parent: {shortName(booking.parentName)}
          {!isOwn ? ` · with ${teacherFirstName(booking.teacherName)}` : ""}
        </Text>
        <View style={styles.previewTimeRow}>
          <Ionicons
            name="time-outline"
            size={12}
            color={isOwn ? "#ffffff" : "#6b7280"}
          />
          <Text style={[styles.previewTime, isOwn && styles.previewTimeOwn]}>
            {booking.timeSlot}
          </Text>
          <View
            style={[
              styles.formatChip,
              isOwn
                ? styles.formatChipOwn
                : isInPerson
                  ? styles.formatChipInPerson
                  : styles.formatChipVirtual,
            ]}
          >
            <Text
              style={[
                styles.formatChipText,
                isOwn
                  ? styles.formatChipTextOwn
                  : isInPerson
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
  currentTeacherId,
  onOpenSheet,
  onBookingPress,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [teacherFilter, setTeacherFilter] =
    useState<ConferenceTeacherFilter>("all");
  const [now, setNow] = useState(() => new Date());

  const filteredBookings = useMemo(
    () => filterBookingsByTeacher(bookings, teacherFilter, currentTeacherId),
    [bookings, teacherFilter, currentTeacherId],
  );

  const needsFrequentRefresh = useMemo(
    () =>
      filteredBookings.some(
        (b) =>
          getConferenceMinutesUntil(b.conferenceDate, b.timeSlot, now) <
          24 * 60,
      ),
    [filteredBookings, now],
  );

  useEffect(() => {
    if (!needsFrequentRefresh) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [needsFrequentRefresh]);

  useEffect(() => {
    setExpanded(false);
  }, [teacherFilter]);

  const alertBooking = getAlertBooking(bookings, todayYmd, currentTeacherId);
  const upcoming = getUpcomingBookings(bookings, todayYmd);
  const remainingCount = Math.max(0, filteredBookings.length - 3);
  const visibleBookings = expanded
    ? filteredBookings
    : filteredBookings.slice(0, 3);
  const alertIsOwn =
    alertBooking != null && alertBooking.teacherId === currentTeacherId;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parent-Teacher Conferences</Text>
        {!loading && bookings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{bookings.length}</Text>
          </View>
        )}
        {!loading && bookings.length > 0 && onOpenSheet && (
          <Pressable
            style={({ pressed }) => [
              styles.detailsButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onOpenSheet}
            hitSlop={8}
          >
            <Ionicons name="list-outline" size={16} color={Brand.sage700} />
            <Text style={styles.detailsButtonText}>Details</Text>
          </Pressable>
        )}
      </View>

      {!loading && bookings.length > 0 && (
        <ConferenceTeacherFilterRow
          filter={teacherFilter}
          onFilterChange={setTeacherFilter}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRowContent}
        />
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <SkeletonBox width="100%" height={72} borderRadius={12} />
          <SkeletonBox width="100%" height={72} borderRadius={12} />
        </View>
      ) : bookings.length === 0 ? (
        <Text style={styles.emptyText}>No conferences scheduled yet.</Text>
      ) : filteredBookings.length === 0 ? (
        <Text style={styles.emptyText}>No conferences match this filter.</Text>
      ) : (
        <>
          {alertBooking && teacherFilter === "all" && (
            <View
              style={[
                styles.alertCard,
                alertIsOwn ? styles.alertCardOwn : styles.alertCardOther,
              ]}
            >
              <View style={styles.alertIconWrap}>
                <Ionicons
                  name="calendar"
                  size={16}
                  color={alertIsOwn ? Brand.sage700 : "#b45309"}
                />
              </View>
              <View style={styles.alertContent}>
                <Text
                  style={[
                    styles.alertTitle,
                    alertIsOwn ? styles.alertTitleOwn : styles.alertTitleOther,
                  ]}
                >
                  Conference with {alertBooking.studentName}{" "}
                  {formatUpcomingRelativeDay(
                    alertBooking.conferenceDate,
                    todayYmd,
                  )}{" "}
                  · {alertBooking.timeSlot} (
                  {formatConferenceFormatLabel(alertBooking.format)})
                  {!alertIsOwn
                    ? ` · ${teacherFirstName(alertBooking.teacherName)}`
                    : ""}
                </Text>
                {upcoming.length > 1 && (
                  <Text
                    style={[
                      styles.alertSubtitle,
                      alertIsOwn
                        ? styles.alertSubtitleOwn
                        : styles.alertSubtitleOther,
                    ]}
                  >
                    {upcoming.length - 1} more conference
                    {upcoming.length - 1 === 1 ? "" : "s"} in the next{" "}
                    {UPCOMING_CONFERENCE_DAYS} days
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.previewList}>
            {visibleBookings.map((booking) => (
              <ConferencePreviewCard
                key={booking.id}
                booking={booking}
                isOwn={booking.teacherId === currentTeacherId}
                now={now}
                onPress={() => onBookingPress(booking.id)}
              />
            ))}
          </View>

          {remainingCount > 0 && !expanded && (
            <Pressable
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setExpanded(true)}
            >
              <Text style={styles.viewAllText}>
                View all ({remainingCount} more)
              </Text>
              <Ionicons name="chevron-down" size={16} color={Brand.sage700} />
            </Pressable>
          )}

          {expanded && (
            <Pressable
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setExpanded(false)}
            >
              <Text style={styles.viewAllText}>Show less</Text>
              <Ionicons name="chevron-up" size={16} color={Brand.sage700} />
            </Pressable>
          )}
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
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
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
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  detailsButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterRowContent: {
    paddingHorizontal: 16,
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
    borderWidth: 1,
  },
  alertCardOwn: {
    backgroundColor: Brand.sage700 + "12",
    borderColor: Brand.sage700 + "40",
  },
  alertCardOther: {
    backgroundColor: "#fffbeb",
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
    lineHeight: 18,
  },
  alertTitleOwn: {
    color: Brand.sage700,
  },
  alertTitleOther: {
    color: "#92400e",
  },
  alertSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
  },
  alertSubtitleOwn: {
    color: Brand.sage700,
    opacity: 0.85,
  },
  alertSubtitleOther: {
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  previewCardOwn: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
    borderWidth: 1,
  },
  previewCardOther: {
    backgroundColor: "#f9fafb",
    borderColor: "#f3f4f6",
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
  dateBlockOwn: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dateWeekday: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
    textTransform: "uppercase",
  },
  dateWeekdayOwn: {
    color: "#ffffff",
  },
  dateDay: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: "#1f2937",
    lineHeight: 22,
  },
  dateDayOwn: {
    color: "#ffffff",
  },
  dateMonth: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },
  dateMonthOwn: {
    color: "rgba(255,255,255,0.85)",
  },
  previewMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  previewStudentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    flexShrink: 1,
  },
  previewStudentNameOwn: {
    color: "#ffffff",
  },
  countdownBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  countdownBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
  },
  ownBadgeInverted: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  ownBadgeInvertedText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
  },
  previewParent: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  previewParentOwn: {
    color: "rgba(255,255,255,0.85)",
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
  previewTimeOwn: {
    color: "rgba(255,255,255,0.85)",
  },
  formatChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    marginLeft: "auto" as const,
  },
  formatChipOwn: {
    backgroundColor: "#ffffff",
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
  formatChipTextOwn: {
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
