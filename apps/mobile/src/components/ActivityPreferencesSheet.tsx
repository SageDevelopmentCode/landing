import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  HandNote,
  gardenSheetChrome,
} from "@/components/garden";
import { forwardRef, useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { fetchDontIncludeStudentIds } from "@/lib/application-tags";
import {
  LEVEL_LABELS,
  type ParticipationLevel,
} from "@/lib/participation-level-labels";
import { supabase } from "@/lib/supabase";
import { useActivityPrefReminders } from "@/hooks/use-activity-pref-reminders";

type PrefRow = {
  student_id: string;
  participation_level: ParticipationLevel;
  notes: string;
  child_legal_name: string;
  profile_image_url: string | null;
  isDefault?: boolean;
};

type AttendingStudent = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
};

interface Props {
  activityId: string;
  activityDate?: string | null;
  attendingStudents?: AttendingStudent[];
}

function PrefStudentRow({ pref }: { pref: PrefRow }) {
  const lvl = LEVEL_LABELS[pref.participation_level];
  return (
    <View style={styles.row} accessible accessibilityLabel={`${pref.child_legal_name}: ${lvl.label}${pref.notes ? `. ${pref.notes}` : ""}`}>
      <GardenAvatar name={pref.child_legal_name} uri={pref.profile_image_url} seed={pref.student_id} size={44} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {pref.child_legal_name}
        </Text>
        <View style={[styles.chip, { backgroundColor: lvl.bg }]}>
          <Text style={[styles.chipText, { color: lvl.color }]}>
            {lvl.emoji} {lvl.label}
          </Text>
        </View>
        {!!pref.notes && <Text style={styles.notes}>{pref.notes}</Text>}
        {pref.isDefault && <Text style={styles.defaultLabel}>Auto-fill preference</Text>}
      </View>
    </View>
  );
}

export const ActivityPreferencesSheet = forwardRef<BottomSheetModal, Props>(
  ({ activityId, activityDate, attendingStudents }, ref) => {
    const [prefs, setPrefs] = useState<PrefRow[]>([]);
    const [noPreferenceStudents, setNoPreferenceStudents] = useState<AttendingStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { sendingId, sentIds, sendReminder, resetReminderState } =
      useActivityPrefReminders(activityId);

    const fetchPrefs = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const excludedIds = await fetchDontIncludeStudentIds();
        const hasAttendingScope = attendingStudents !== undefined;
        const eligibleStudents = (attendingStudents ?? []).filter(
          (s) => !excludedIds.has(s.student_id),
        );
        const eligibleIdSet = new Set(eligibleStudents.map((s) => s.student_id));
        const attendingMap = new Map(
          eligibleStudents.map((s) => [s.student_id, s]),
        );

        if (hasAttendingScope && eligibleStudents.length === 0) {
          setPrefs([]);
          setNoPreferenceStudents([]);
          return;
        }

        const { data: prefData, error: prefErr } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .select("student_id, participation_level, notes")
          .eq("activity_id", activityId);

        if (prefErr) throw prefErr;

        let filteredPrefData = (prefData ?? []).filter(
          (r) => !excludedIds.has(r.student_id),
        );

        if (hasAttendingScope) {
          filteredPrefData = filteredPrefData.filter((r) =>
            eligibleIdSet.has(r.student_id),
          );
        }

        const buildPrefRow = (
          studentId: string,
          participationLevel: ParticipationLevel,
          notes: string,
          isDefault = false,
        ): PrefRow => {
          const attending = attendingMap.get(studentId);
          return {
            student_id: studentId,
            participation_level: participationLevel,
            notes,
            child_legal_name: attending?.name ?? "Unknown",
            profile_image_url: attending?.profile_image_url ?? null,
            isDefault,
          };
        };

        if (filteredPrefData.length === 0) {
          if (eligibleStudents.length > 0) {
            const allIds = eligibleStudents.map((s) => s.student_id);
            const { data: defaultData, error: defaultErr } = await supabase
              .schema("parent_app")
              .from("student_default_preferences")
              .select("student_id, participation_level")
              .in("student_id", allIds);
            if (defaultErr) throw defaultErr;

            const defaultMap = new Map(
              (defaultData ?? []).map((d: { student_id: string; participation_level: string }) => [
                d.student_id,
                d.participation_level,
              ]),
            );

            const defaultPrefRows: PrefRow[] = eligibleStudents
              .filter((s) => defaultMap.has(s.student_id))
              .map((s) =>
                buildPrefRow(
                  s.student_id,
                  defaultMap.get(s.student_id) as ParticipationLevel,
                  "",
                  true,
                ),
              );

            setPrefs(defaultPrefRows);
            setNoPreferenceStudents(
              eligibleStudents.filter((s) => !defaultMap.has(s.student_id)),
            );
          } else if (!hasAttendingScope) {
            setPrefs([]);
            setNoPreferenceStudents([]);
          } else {
            setPrefs([]);
            setNoPreferenceStudents(eligibleStudents);
          }
          return;
        }

        let studentMap: Record<string, { name: string; photo: string | null }> = {};
        if (!hasAttendingScope) {
          const studentIds = [...new Set(filteredPrefData.map((r) => r.student_id))];
          const { data: studentData, error: studentErr } = await supabase
            .schema("admin")
            .from("students")
            .select("id, child_legal_name, profile_image_url")
            .in("id", studentIds);

          if (studentErr) throw studentErr;

          for (const s of studentData ?? []) {
            studentMap[(s as { id: string }).id] = {
              name: (s as { child_legal_name: string }).child_legal_name,
              photo: (s as { profile_image_url: string | null }).profile_image_url ?? null,
            };
          }
        }

        const fetchedPrefs: PrefRow[] = filteredPrefData.map((r) => {
          const attending = attendingMap.get(r.student_id);
          return {
            student_id: r.student_id,
            participation_level: r.participation_level as ParticipationLevel,
            notes: r.notes ?? "",
            child_legal_name:
              attending?.name ?? studentMap[r.student_id]?.name ?? "Unknown",
            profile_image_url:
              attending?.profile_image_url ??
              studentMap[r.student_id]?.photo ??
              null,
          };
        });

        const prefSet = new Set(fetchedPrefs.map((p) => p.student_id));
        const noPrefStudents = eligibleStudents.filter(
          (s) => !prefSet.has(s.student_id),
        );

        if (noPrefStudents.length > 0) {
          const noPrefIds = noPrefStudents.map((s) => s.student_id);
          const { data: defaultData, error: defaultErr } = await supabase
            .schema("parent_app")
            .from("student_default_preferences")
            .select("student_id, participation_level")
            .in("student_id", noPrefIds);
          if (defaultErr) throw defaultErr;

          const defaultMap = new Map(
            (defaultData ?? []).map((d: { student_id: string; participation_level: string }) => [
              d.student_id,
              d.participation_level,
            ]),
          );

          const defaultPrefRows: PrefRow[] = noPrefStudents
            .filter((s) => defaultMap.has(s.student_id))
            .map((s) =>
              buildPrefRow(
                s.student_id,
                defaultMap.get(s.student_id) as ParticipationLevel,
                "",
                true,
              ),
            );

          setPrefs([...fetchedPrefs, ...defaultPrefRows]);
          setNoPreferenceStudents(
            noPrefStudents.filter((s) => !defaultMap.has(s.student_id)),
          );
        } else {
          setPrefs(fetchedPrefs);
          setNoPreferenceStudents([]);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    }, [activityId, attendingStudents]);

    const handleChange = useCallback(
      (index: number) => {
        if (index === 0) fetchPrefs();
        else if (index === -1) {
          setPrefs([]);
          setNoPreferenceStudents([]);
          resetReminderState();
        }
      },
      [fetchPrefs, resetReminderState],
    );

    const hasAttendingScope = attendingStudents !== undefined;
    const emptyMessage =
      hasAttendingScope && !activityDate
        ? "No activity date set."
        : hasAttendingScope && attendingStudents.length === 0
          ? "No students signed up for this day."
          : "No preferences set yet.";
    const fullCount = prefs.filter((p) => p.participation_level === "full").length;

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["55%", "88%"]}
        onChange={handleChange}
        {...gardenSheetChrome}
      >
        <BottomSheetScrollView contentContainerStyle={styles.container}>
          <Display size={26}>Student Preferences</Display>
          {!loading && !error && prefs.length + noPreferenceStudents.length > 0 ? (
            <HandNote size={16} style={{ marginTop: 2 }}>
              {`${prefs.length} set${fullCount ? ` · ${fullCount} full` : ""}${
                noPreferenceStudents.length ? ` · ${noPreferenceStudents.length} still to hear from` : " · everyone's answered ✓"
              }`}
            </HandNote>
          ) : null}

          {loading ? (
            <View style={{ gap: 10, marginTop: 16 }} accessibilityLabel="Loading preferences">
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.row}>
                  <GardenSkeleton width={44} height={44} radius={22} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <GardenSkeleton width="55%" height={14} radius={6} />
                    <GardenSkeleton width="35%" height={20} radius={10} />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {!loading && error ? (
            <View style={{ marginTop: 16 }}>
              <GardenErrorCard title="Couldn't load preferences" body={error} onRetry={() => void fetchPrefs()} />
            </View>
          ) : null}

          {!loading && !error && prefs.length === 0 && noPreferenceStudents.length === 0 ? (
            <GardenEmpty emoji="🗓️" title={emptyMessage} tint="sky" style={{ marginTop: 16 }} />
          ) : null}

          {!loading && !error && noPreferenceStudents.length > 0 ? (
            <View style={styles.group}>
              <View style={styles.groupHead}>
                <View style={[styles.dot, { backgroundColor: Garden.coralDeep }]} />
                <Text style={styles.sectionHeader}>No Preference Set</Text>
                <Text style={styles.groupCount}>{noPreferenceStudents.length}</Text>
              </View>
              {noPreferenceStudents.map((s) => {
                const displayName = s.name ?? "Unknown";
                const isSending = sendingId === s.student_id;
                const isSent = sentIds.has(s.student_id);
                return (
                  <View key={s.student_id} style={styles.row}>
                    <GardenAvatar name={displayName} uri={s.profile_image_url} seed={s.student_id} size={44} />
                    <View style={styles.info}>
                      <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                        {displayName}
                      </Text>
                      <View style={[styles.chip, { backgroundColor: "#f3eadc" }]}>
                        <Text style={[styles.chipText, { color: Garden.soft }]}>❓ Not set</Text>
                      </View>
                    </View>
                    <GardenButton
                      label={isSent ? "Sent" : "Send Reminder"}
                      size="sm"
                      tone={isSent ? "sage" : "coral"}
                      icon={isSent ? "checkmark" : "notifications-outline"}
                      loading={isSending}
                      loadingLabel="Sending…"
                      disabled={isSent || (!!sendingId && !isSending)}
                      onPress={() => void sendReminder(s.student_id, s.name)}
                      accessibilityHint={`Reminds ${displayName}'s family to set a preference`}
                    />
                  </View>
                );
              })}
            </View>
          ) : null}

          {!loading && !error && prefs.length > 0 ? (
            <View style={styles.group}>
              <View style={styles.groupHead}>
                <View style={[styles.dot, { backgroundColor: Garden.sage }]} />
                <Text style={styles.sectionHeader}>Preferences Set</Text>
                <Text style={styles.groupCount}>{prefs.length}</Text>
              </View>
              {prefs.map((pref) => (
                <PrefStudentRow key={pref.student_id} pref={pref} />
              ))}
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

ActivityPreferencesSheet.displayName = "ActivityPreferencesSheet";

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 48 },
  group: {
    marginTop: 16,
    backgroundColor: Garden.white,
    borderRadius: GardenRadii.md,
    borderWidth: 1,
    borderColor: Garden.line,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  groupCount: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.muted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 66,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Garden.line,
  },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  chip: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  notes: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft },
  sectionHeader: {
    flex: 1,
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  defaultLabel: { fontFamily: GardenFonts.hand, fontSize: 14, color: Garden.muted },
});
