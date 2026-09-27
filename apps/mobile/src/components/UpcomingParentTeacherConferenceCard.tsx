import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { homeCardSurface, HomeTheme } from "@/components/home/homeTheme";
import { FontFamilies } from "@/constants/theme";
import {
  formatConferenceDateForDisplay,
  getUpcomingConferenceEntries,
  type ConferenceBookingRecord,
  type ConferenceStudentContext,
  type ConferenceTeacherDisplay,
} from "@/lib/parent-teacher-conference";

type Props = {
  conferenceStudents: ConferenceStudentContext[];
  conferenceBookingsByStudent: Record<string, ConferenceBookingRecord>;
  conferenceTeachers: ConferenceTeacherDisplay[];
  onPress: () => void;
};

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

export function UpcomingParentTeacherConferenceCard({
  conferenceStudents,
  conferenceBookingsByStudent,
  conferenceTeachers,
  onPress,
}: Props) {
  const todayYmd = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const upcomingEntries = useMemo(
    () =>
      getUpcomingConferenceEntries(
        conferenceStudents,
        conferenceBookingsByStudent,
        conferenceTeachers,
        todayYmd,
      ),
    [
      conferenceStudents,
      conferenceBookingsByStudent,
      conferenceTeachers,
      todayYmd,
    ],
  );

  if (upcomingEntries.length === 0) {
    return null;
  }

  return (
    <View style={styles.stack}>
      {upcomingEntries.map((entry) => {
        const { weekday, day, month } = formatDateBlock(
          entry.booking.conferenceDate,
        );
        const isVirtual = entry.booking.format === "virtual";

        return (
          <Pressable
            key={entry.studentId}
            onPress={onPress}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.dateBlock}>
              <Text style={styles.dateWeekday}>{weekday}</Text>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateMonth}>{month}</Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.studentName}>{entry.studentName}</Text>
              <Text style={styles.teacherLine}>with {entry.teacherName}</Text>
              <Text style={styles.dateTimeLine}>
                {formatConferenceDateForDisplay(entry.booking.conferenceDate)} ·{" "}
                {entry.booking.timeSlot}
              </Text>
              <View style={styles.formatRow}>
                <Ionicons
                  name={isVirtual ? "videocam-outline" : "location-outline"}
                  size={12}
                  color="#047857"
                />
                <Text style={styles.formatText}>
                  {isVirtual ? "Virtual" : "In person at Sage Field"}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginHorizontal: HomeTheme.horizontalInset,
    marginBottom: 16,
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...homeCardSurface,
  },
  dateBlock: {
    width: 48,
    borderRadius: 12,
    backgroundColor: "#5E7C68",
    alignItems: "center",
    paddingVertical: 6,
  },
  dateWeekday: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
    textTransform: "uppercase",
    lineHeight: 12,
  },
  dateDay: {
    fontFamily: FontFamilies.headingRegular,
    fontSize: 18,
    color: "#fff",
    lineHeight: 22,
  },
  dateMonth: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
    textTransform: "uppercase",
    lineHeight: 12,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: HomeTheme.authorName,
  },
  teacherLine: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#4b5563",
  },
  dateTimeLine: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  formatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  formatText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#047857",
  },
});
