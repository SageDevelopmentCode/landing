import { forwardRef, useCallback, type ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Brand, FontFamilies } from "@/constants/theme";
import {
  formatConferenceDateForDisplay,
  formatConferenceFormatLabel,
  type StaffConferenceBooking,
} from "@/lib/staff-conference-bookings";

type Props = {
  bookings: StaffConferenceBooking[];
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatGuardianLine(
  name: string | null,
  relationship: string | null,
): string | null {
  if (!name?.trim()) return null;
  if (relationship?.trim()) return `${name.trim()} (${relationship.trim()})`;
  return name.trim();
}

function BookingCard({ booking }: { booking: StaffConferenceBooking }) {
  const g1 = formatGuardianLine(booking.g1Name, booking.g1Relationship);
  const g2 = formatGuardianLine(booking.g2Name, booking.g2Relationship);

  return (
    <View style={styles.card}>
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
          <Text style={styles.studentName}>{booking.studentName}</Text>
          {booking.studentGrade ? (
            <Text style={styles.studentGrade}>{booking.studentGrade}</Text>
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
  BottomSheetModal,
  Props
>(({ bookings }, ref) => {
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

  let lastDate = "";

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["75%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sheetTitle}>Parent-Teacher Conferences</Text>
        <Text style={styles.sheetSubtitle}>
          {bookings.length}{" "}
          {bookings.length === 1 ? "conference" : "conferences"} scheduled
        </Text>

        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>No conferences scheduled yet.</Text>
        ) : (
          bookings.map((booking) => {
            const showDateHeader = booking.conferenceDate !== lastDate;
            if (showDateHeader) lastDate = booking.conferenceDate;
            return (
              <View key={booking.id}>
                {showDateHeader && (
                  <Text style={styles.dateHeader}>
                    {formatConferenceDateForDisplay(booking.conferenceDate)}
                  </Text>
                )}
                <BookingCard booking={booking} />
              </View>
            );
          })
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
    marginBottom: 16,
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
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
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
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  studentGrade: {
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
