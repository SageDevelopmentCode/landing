import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { Brand, FontFamilies } from "@/constants/theme";
import type { Activity } from "@/lib/activities-actions";
import { LEVEL_LABELS } from "@/lib/participation-level-labels";
import type {
  StaffActivityPrefGroup,
  StaffActivityPrefUnsignedStudent,
} from "@/lib/staff-food-and-activity-prefs";
import { useActivityPrefReminders } from "@/hooks/use-activity-pref-reminders";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { forwardRef, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const AVATAR_PALETTE = [
  "#6b7c9b",
  "#7b8ca3",
  "#8b9c7e",
  "#9c7e8b",
  "#7e8b9c",
  "#a07060",
  "#707ea0",
  "#608070",
];

type StudentPref = StaffActivityPrefGroup["students"][number];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatActivityDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function tabLabel(activity: Activity): string {
  if (activity.activity_date) {
    return formatActivityDate(activity.activity_date);
  }
  const title = activity.title.trim();
  return title.length > 24 ? `${title.slice(0, 24)}…` : title;
}

function UnsignedStudentRow({
  student,
  sendingId,
  sentIds,
  onSendReminder,
}: {
  student: StaffActivityPrefUnsignedStudent;
  sendingId: string | null;
  sentIds: Set<string>;
  onSendReminder: (studentId: string) => void;
}) {
  const isSending = sendingId === student.studentId;
  const isSent = sentIds.has(student.studentId);
  const isDisabled = isSending || isSent || !!sendingId;

  return (
    <View style={styles.row}>
      {student.photo ? (
        <Image
          source={{ uri: student.photo }}
          style={[styles.avatar, styles.avatarImg]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.avatar,
            { backgroundColor: avatarColor(student.studentId) },
          ]}
        >
          <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        <View style={[styles.chip, { backgroundColor: "#f3f4f6" }]}>
          <Text style={[styles.chipText, { color: "#6b7280" }]}>Not set</Text>
        </View>
      </View>
      <Pressable
        style={[
          styles.reminderBtn,
          isSent && styles.reminderBtnSent,
          isDisabled && !isSent && styles.reminderBtnDisabled,
        ]}
        disabled={isDisabled}
        onPress={() => onSendReminder(student.studentId)}
      >
        <Text
          style={[
            styles.reminderBtnText,
            isSent && styles.reminderBtnTextSent,
          ]}
        >
          {isSending ? "Sending…" : isSent ? "Sent" : "Send Reminder"}
        </Text>
      </Pressable>
    </View>
  );
}

function ProgressSummaryCard({
  signedUpCount,
  totalCount,
}: {
  signedUpCount: number;
  totalCount: number;
}) {
  const remaining = Math.max(totalCount - signedUpCount, 0);
  const isComplete = totalCount > 0 && remaining === 0;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>
        {signedUpCount} of {totalCount} signed up
      </Text>
      <Text style={styles.summarySubtitle}>
        {totalCount === 0
          ? "No students signed up for this day."
          : isComplete
            ? "All students have preferences set."
            : `${remaining} remaining`}
      </Text>
    </View>
  );
}
function StudentPrefRow({ student }: { student: StudentPref }) {
  const lvl = LEVEL_LABELS[student.level];

  return (
    <View style={styles.row}>
      {student.photo ? (
        <Image
          source={{ uri: student.photo }}
          style={[styles.avatar, styles.avatarImg]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.avatar,
            { backgroundColor: avatarColor(student.studentId) },
          ]}
        >
          <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        <View style={[styles.chip, { backgroundColor: lvl.bg }]}>
          <Text style={[styles.chipText, { color: lvl.color }]}>
            {lvl.emoji} {lvl.label}
          </Text>
        </View>
        {!!student.notes && <Text style={styles.notes}>{student.notes}</Text>}
        {student.isDefault && (
          <Text style={styles.defaultLabel}>Auto-fill preference</Text>
        )}
      </View>
    </View>
  );
}

type Props = {
  activities: Activity[];
  groups: StaffActivityPrefGroup[];
  loading: boolean;
};

export const StaffWeekActivityPrefsSheet = forwardRef<BottomSheetModal, Props>(
  function StaffWeekActivityPrefsSheet({ activities, groups, loading }, ref) {
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
      null,
    );

    const { sendingId, sentIds, sendReminder, resetReminderState } =
      useActivityPrefReminders(selectedActivityId);

    const groupMap = new Map(groups.map((group) => [group.activityId, group]));

    useEffect(() => {
      setSelectedActivityId(activities[0]?.id ?? null);
    }, [activities]);

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === 0) {
          setSelectedActivityId(activities[0]?.id ?? null);
          resetReminderState();
        } else if (index === -1) {
          resetReminderState();
        }
      },
      [activities, resetReminderState],
    );

    const handleSelectActivity = useCallback(
      (activityId: string) => {
        setSelectedActivityId(activityId);
        resetReminderState();
      },
      [resetReminderState],
    );

    const selectedActivity =
      activities.find((activity) => activity.id === selectedActivityId) ??
      activities[0] ??
      null;

    const selectedGroup = selectedActivity
      ? groupMap.get(selectedActivity.id)
      : undefined;
    const selectedStudents = selectedGroup?.students ?? [];
    const unsignedStudents = selectedGroup?.unsignedStudents ?? [];
    const signedUpCount = selectedGroup?.signedUpCount ?? 0;
    const totalCount = selectedGroup?.totalCount ?? 0;

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%", "85%"]}
        enablePanDownToClose
        onChange={handleSheetChange}
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
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Activity Preferences</Text>

          {!loading && activities.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
            >
              {activities.map((activity) => {
                const isSelected = activity.id === selectedActivityId;
                return (
                  <Pressable
                    key={activity.id}
                    style={[
                      styles.tabPill,
                      isSelected && styles.tabPillActive,
                    ]}
                    onPress={() => handleSelectActivity(activity.id)}
                  >
                    <Text
                      style={[
                        styles.tabPillText,
                        isSelected && styles.tabPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tabLabel(activity)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.container}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={Brand.sage700} />
              <SkeletonBox width="100%" height={96} borderRadius={12} />
              <SkeletonBox width="100%" height={96} borderRadius={12} />
            </View>
          ) : activities.length === 0 ? (
            <Text style={styles.emptyText}>
              No upcoming published activities.
            </Text>
          ) : selectedActivity ? (
            <View style={styles.activityBlock}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle} numberOfLines={2}>
                  {selectedActivity.title}
                </Text>
                {selectedActivity.activity_date ? (
                  <Text style={styles.activityDate}>
                    {formatActivityDate(selectedActivity.activity_date)}
                  </Text>
                ) : null}
              </View>

              <ProgressSummaryCard
                signedUpCount={signedUpCount}
                totalCount={totalCount}
              />

              {selectedStudents.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Preferences Set</Text>
                  {selectedStudents.map((student) => (
                    <StudentPrefRow
                      key={student.studentId}
                      student={student}
                    />
                  ))}
                </>
              )}

              {unsignedStudents.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>No Preference Set</Text>
                  {unsignedStudents.map((student) => (
                    <UnsignedStudentRow
                      key={student.studentId}
                      student={student}
                      sendingId={sendingId}
                      sentIds={sentIds}
                      onSendReminder={sendReminder}
                    />
                  ))}
                </>
              )}

              {totalCount === 0 && (
                <Text style={styles.activityEmpty}>
                  No students signed up for this day.
                </Text>
              )}
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    maxWidth: 160,
  },
  tabPillActive: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  tabPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  tabPillTextActive: {
    color: "#ffffff",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loadingWrap: {
    gap: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    paddingVertical: 24,
    textAlign: "center",
  },
  activityBlock: {
    gap: 8,
  },
  activityHeader: {
    gap: 2,
    marginTop: 4,
  },
  activityTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  activityDate: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  activityEmpty: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    paddingLeft: 4,
    paddingBottom: 4,
  },
  summaryCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  summarySubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  sectionHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    backgroundColor: "transparent",
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#fff",
  },
  info: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
  },
  notes: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  defaultLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  reminderBtn: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Brand.sage700,
  },
  reminderBtnSent: {
    backgroundColor: "#e5e7eb",
  },
  reminderBtnDisabled: {
    opacity: 0.6,
  },
  reminderBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#ffffff",
  },
  reminderBtnTextSent: {
    color: "#6b7280",
  },
});
