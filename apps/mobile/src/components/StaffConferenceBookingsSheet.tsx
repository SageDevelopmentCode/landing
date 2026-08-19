import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { ConferenceTeacherFilterRow } from "@/components/ConferenceTeacherFilterRow";
import { Brand, FontFamilies } from "@/constants/theme";
import { CONFERENCE_TEACHERS } from "@/lib/parent-teacher-conference";
import {
  filterBookingsByTeacher,
  formatConferenceDateForDisplay,
  formatConferenceFormatLabel,
  type ConferenceTeacherFilter,
  type StaffConferenceBooking,
} from "@/lib/staff-conference-bookings";

type Props = {
  bookings: StaffConferenceBooking[];
  currentTeacherId: string;
  onDismiss?: () => void;
};

export type StaffConferenceBookingsSheetRef = BottomSheetModal & {
  presentList: () => void;
  presentDetail: (bookingId: string) => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teacherFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function formatGuardianLine(
  name: string | null,
  relationship: string | null,
): string | null {
  if (!name?.trim()) return null;
  if (relationship?.trim()) return `${name.trim()} (${relationship.trim()})`;
  return name.trim();
}

function filterLabel(filter: ConferenceTeacherFilter): string {
  if (filter === "all") return "all teachers";
  if (filter === "mine") return "yours";
  const teacher = CONFERENCE_TEACHERS.find((t) => t.id === filter);
  return teacher ? teacherFirstName(teacher.name) : "selected";
}

function BookingCard({
  booking,
  isOwn,
}: {
  booking: StaffConferenceBooking;
  isOwn: boolean;
}) {
  const g1 = formatGuardianLine(booking.g1Name, booking.g1Relationship);
  const g2 = formatGuardianLine(booking.g2Name, booking.g2Relationship);

  return (
    <View
      style={[
        styles.card,
        isOwn ? styles.cardOwn : styles.cardOther,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {booking.studentProfileImageUrl ? (
            <Image
              source={{ uri: booking.studentProfileImageUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarText}>
              {getInitials(booking.studentName)}
            </Text>
          )}
        </View>
        <View style={styles.cardHeaderText}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.studentName}>{booking.studentName}</Text>
            {isOwn ? (
              <View style={styles.ownBadge}>
                <Text style={styles.ownBadgeText}>Your conference</Text>
              </View>
            ) : null}
          </View>
          {booking.studentGrade ? (
            <Text style={styles.studentGrade}>{booking.studentGrade}</Text>
          ) : null}
          {!isOwn ? (
            <Text style={styles.teacherLine}>
              with {booking.teacherName}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>When</Text>
        <Text style={styles.detailValue}>
          {formatConferenceDateForDisplay(booking.conferenceDate)} ·{" "}
          {booking.timeSlot}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Format</Text>
        <Text style={styles.detailValue}>
          {formatConferenceFormatLabel(booking.format)}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Parent account</Text>
        <Text style={styles.detailValue}>{booking.parentName}</Text>
        {booking.parentEmail ? (
          <Text style={styles.detailSubvalue}>{booking.parentEmail}</Text>
        ) : null}
        {booking.parentPhone ? (
          <Text style={styles.detailSubvalue}>{booking.parentPhone}</Text>
        ) : null}
      </View>

      {(g1 || g2) && (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Guardians</Text>
          {g1 ? <Text style={styles.detailValue}>{g1}</Text> : null}
          {g2 ? <Text style={styles.detailValue}>{g2}</Text> : null}
        </View>
      )}

      {booking.accommodationNote ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Accommodation note</Text>
          <Text style={styles.detailValue}>{booking.accommodationNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const StaffConferenceBookingsSheet = forwardRef<
  StaffConferenceBookingsSheetRef,
  Props
>(({ bookings, currentTeacherId, onDismiss }, ref) => {
  const modalRef = useRef<BottomSheetModal>(null);
  const detailBookingIdRef = useRef<string | null>(null);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [teacherFilter, setTeacherFilter] =
    useState<ConferenceTeacherFilter>("all");

  const activeDetailId = detailBookingIdRef.current ?? detailBookingId;
  const isDetailMode = !!activeDetailId;

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === activeDetailId) ?? null,
    [bookings, activeDetailId],
  );

  const filteredBookings = useMemo(
    () => filterBookingsByTeacher(bookings, teacherFilter, currentTeacherId),
    [bookings, teacherFilter, currentTeacherId],
  );

  const snapPoints = useMemo(
    () => (isDetailMode ? ["55%"] : ["75%"]),
    [isDetailMode],
  );

  const clearDetailMode = useCallback(() => {
    detailBookingIdRef.current = null;
    setDetailBookingId(null);
  }, []);

  const openDetail = useCallback((bookingId: string) => {
    detailBookingIdRef.current = bookingId;
    setDetailBookingId(bookingId);
    setTimeout(() => {
      modalRef.current?.present();
    }, 0);
  }, []);

  useImperativeHandle(
    ref,
    () =>
      ({
        present: () => modalRef.current?.present(),
        dismiss: (animationConfigs) =>
          modalRef.current?.dismiss(animationConfigs),
        close: (animationConfigs) => modalRef.current?.close(animationConfigs),
        collapse: (animationConfigs) =>
          modalRef.current?.collapse(animationConfigs),
        expand: (animationConfigs) =>
          modalRef.current?.expand(animationConfigs),
        snapToIndex: (index, animationConfigs) =>
          modalRef.current?.snapToIndex(index, animationConfigs),
        snapToPosition: (position, animationConfigs) =>
          modalRef.current?.snapToPosition(position, animationConfigs),
        forceClose: (animationConfigs) =>
          modalRef.current?.forceClose(animationConfigs),
        presentList: () => {
          clearDetailMode();
          setTimeout(() => modalRef.current?.present(), 0);
        },
        presentDetail: (bookingId: string) => {
          openDetail(bookingId);
        },
      }) as StaffConferenceBookingsSheetRef,
    [clearDetailMode, openDetail],
  );

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    clearDetailMode();
    onDismiss?.();
  }, [clearDetailMode, onDismiss]);

  let lastDate = "";

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDetailMode && selectedBooking ? (
          <>
            <Text style={styles.sheetTitle}>{selectedBooking.studentName}</Text>
            <Text style={styles.sheetSubtitle}>
              {formatConferenceDateForDisplay(selectedBooking.conferenceDate)} ·{" "}
              {selectedBooking.timeSlot}
            </Text>
            <BookingCard
              booking={selectedBooking}
              isOwn={selectedBooking.teacherId === currentTeacherId}
            />
          </>
        ) : (
          <>
            <Text style={styles.sheetTitle}>Parent-Teacher Conferences</Text>
            <Text style={styles.sheetSubtitle}>
              {bookings.length}{" "}
              {bookings.length === 1 ? "conference" : "conferences"} scheduled
              {teacherFilter !== "all"
                ? ` · showing ${filterLabel(teacherFilter)}`
                : ""}
            </Text>

            {bookings.length > 0 && (
              <ConferenceTeacherFilterRow
                filter={teacherFilter}
                onFilterChange={setTeacherFilter}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterRowContent}
              />
            )}

            {filteredBookings.length === 0 ? (
              <Text style={styles.emptyText}>
                {bookings.length === 0
                  ? "No conferences scheduled yet."
                  : "No conferences match this filter."}
              </Text>
            ) : (
              filteredBookings.map((booking) => {
                const showDateHeader = booking.conferenceDate !== lastDate;
                if (showDateHeader) lastDate = booking.conferenceDate;
                return (
                  <View key={booking.id}>
                    {showDateHeader && (
                      <Text style={styles.dateHeader}>
                        {formatConferenceDateForDisplay(booking.conferenceDate)}
                      </Text>
                    )}
                    <Pressable
                      onPress={() => openDetail(booking.id)}
                      style={({ pressed }) => pressed && { opacity: 0.85 }}
                    >
                      <BookingCard
                        booking={booking}
                        isOwn={booking.teacherId === currentTeacherId}
                      />
                    </Pressable>
                  </View>
                );
              })
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

StaffConferenceBookingsSheet.displayName = "StaffConferenceBookingsSheet";

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  filterScroll: {
    marginHorizontal: -20,
    marginBottom: 12,
  },
  filterRowContent: {
    paddingHorizontal: 20,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    paddingVertical: 24,
  },
  dateHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardOwn: {
    backgroundColor: Brand.sage700 + "12",
    borderColor: Brand.sage700 + "40",
  },
  cardOther: {
    backgroundColor: "#f9fafb",
    borderColor: "#f3f4f6",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  ownBadge: {
    backgroundColor: Brand.sage700 + "25",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  ownBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
  },
  studentGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  teacherLine: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  detailBlock: {
    marginBottom: 10,
  },
  detailLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  detailSubvalue: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
});
