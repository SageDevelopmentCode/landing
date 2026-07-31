import { forwardRef, useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Brand, FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type ParticipationLevel = "watch" | "cook_no_eat" | "full";

type PrefRow = {
  student_id: string;
  participation_level: ParticipationLevel;
  notes: string;
  child_legal_name: string;
  profile_image_url: string | null;
  isDefault?: boolean;
};

const LEVEL_LABELS: Record<ParticipationLevel, { emoji: string; label: string; bg: string; color: string }> = {
  watch:       { emoji: "👀", label: "Watch only",            bg: "#f3f4f6", color: "#374151" },
  cook_no_eat: { emoji: "🧑‍🍳", label: "Cook, don't consume",  bg: "#fef9c3", color: "#854d0e" },
  full:        { emoji: "✅", label: "Full participation",    bg: "#dcfce7", color: "#166534" },
};

const AVATAR_PALETTE = [
  "#6b7c9b", "#7b8ca3", "#8b9c7e", "#9c7e8b",
  "#7e8b9c", "#a07060", "#707ea0", "#608070",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AttendingStudent = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
};

interface Props {
  activityId: string;
  attendingStudents?: AttendingStudent[];
}

export const ActivityPreferencesSheet = forwardRef<BottomSheetModal, Props>(
  ({ activityId, attendingStudents }, ref) => {
    const [prefs, setPrefs] = useState<PrefRow[]>([]);
    const [noPreferenceStudents, setNoPreferenceStudents] = useState<AttendingStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrefs = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: prefData, error: prefErr } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .select("student_id, participation_level, notes")
          .eq("activity_id", activityId);

        if (prefErr) throw prefErr;
        if (!prefData || prefData.length === 0) {
          const allStudents = attendingStudents ?? [];
          if (allStudents.length > 0) {
            const allIds = allStudents.map((s) => s.student_id);
            const { data: defaultData, error: defaultErr } = await supabase
              .schema("parent_app")
              .from("student_default_preferences")
              .select("student_id, participation_level")
              .in("student_id", allIds);
            if (defaultErr) throw defaultErr;

            const defaultMap = new Map((defaultData ?? []).map((d: any) => [d.student_id, d.participation_level]));

            const defaultPrefRows: PrefRow[] = allStudents
              .filter((s) => defaultMap.has(s.student_id))
              .map((s) => ({
                student_id: s.student_id,
                participation_level: defaultMap.get(s.student_id) as ParticipationLevel,
                notes: "",
                child_legal_name: s.name ?? "Unknown",
                profile_image_url: s.profile_image_url,
                isDefault: true,
              }));

            setPrefs(defaultPrefRows);
            setNoPreferenceStudents(allStudents.filter((s) => !defaultMap.has(s.student_id)));
          } else {
            setPrefs([]);
            setNoPreferenceStudents([]);
          }
          return;
        }

        const studentIds = [...new Set(prefData.map((r: any) => r.student_id))];
        const { data: studentData, error: studentErr } = await supabase
          .schema("admin")
          .from("students")
          .select("id, child_legal_name, profile_image_url")
          .in("id", studentIds);

        if (studentErr) throw studentErr;

        const studentMap: Record<string, { name: string; photo: string | null }> = {};
        for (const s of studentData ?? []) {
          studentMap[(s as any).id] = {
            name: (s as any).child_legal_name,
            photo: (s as any).profile_image_url ?? null,
          };
        }

        const fetchedPrefs: PrefRow[] = (prefData as any[]).map((r) => ({
          student_id: r.student_id,
          participation_level: r.participation_level as ParticipationLevel,
          notes: r.notes ?? "",
          child_legal_name: studentMap[r.student_id]?.name ?? "Unknown",
          profile_image_url: studentMap[r.student_id]?.photo ?? null,
        }));

        const prefSet = new Set(fetchedPrefs.map((p) => p.student_id));
        const noPrefStudents = (attendingStudents ?? []).filter((s) => !prefSet.has(s.student_id));

        if (noPrefStudents.length > 0) {
          const noPrefIds = noPrefStudents.map((s) => s.student_id);
          const { data: defaultData, error: defaultErr } = await supabase
            .schema("parent_app")
            .from("student_default_preferences")
            .select("student_id, participation_level")
            .in("student_id", noPrefIds);
          if (defaultErr) throw defaultErr;

          const defaultMap = new Map((defaultData ?? []).map((d: any) => [d.student_id, d.participation_level]));

          const defaultPrefRows: PrefRow[] = noPrefStudents
            .filter((s) => defaultMap.has(s.student_id))
            .map((s) => ({
              student_id: s.student_id,
              participation_level: defaultMap.get(s.student_id) as ParticipationLevel,
              notes: "",
              child_legal_name: s.name ?? "Unknown",
              profile_image_url: s.profile_image_url,
              isDefault: true,
            }));

          setPrefs([...fetchedPrefs, ...defaultPrefRows]);
          setNoPreferenceStudents(noPrefStudents.filter((s) => !defaultMap.has(s.student_id)));
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
        else if (index === -1) { setPrefs([]); setNoPreferenceStudents([]); }
      },
      [fetchPrefs]
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%", "85%"]}
        enablePanDownToClose
        onChange={handleChange}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Student Preferences</Text>

          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={Brand.sage700} />
            </View>
          )}

          {!loading && error && (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && prefs.length === 0 && noPreferenceStudents.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No preferences set yet.</Text>
            </View>
          )}

          {!loading && !error && prefs.map((pref) => {
            const lvl = LEVEL_LABELS[pref.participation_level];
            return (
              <View key={pref.student_id} style={styles.row}>
                {pref.profile_image_url ? (
                  <Image
                    source={{ uri: pref.profile_image_url }}
                    style={[styles.avatar, styles.avatarImg]}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarColor(pref.student_id) }]}>
                    <Text style={styles.avatarText}>{getInitials(pref.child_legal_name)}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{pref.child_legal_name}</Text>
                  <View style={[styles.chip, { backgroundColor: lvl.bg }]}>
                    <Text style={[styles.chipText, { color: lvl.color }]}>
                      {lvl.emoji} {lvl.label}
                    </Text>
                  </View>
                  {!!pref.notes && (
                    <Text style={styles.notes}>{pref.notes}</Text>
                  )}
                  {pref.isDefault && (
                    <Text style={styles.defaultLabel}>Auto-fill preference</Text>
                  )}
                </View>
              </View>
            );
          })}

          {!loading && !error && noPreferenceStudents.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>No Preference Set</Text>
              {noPreferenceStudents.map((s) => {
                const displayName = s.name ?? "Unknown";
                return (
                  <View key={s.student_id} style={styles.row}>
                    {s.profile_image_url ? (
                      <Image
                        source={{ uri: s.profile_image_url }}
                        style={[styles.avatar, styles.avatarImg]}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: avatarColor(s.student_id) }]}>
                        <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                      </View>
                    )}
                    <View style={styles.info}>
                      <Text style={styles.name}>{displayName}</Text>
                      <View style={[styles.chip, { backgroundColor: "#f3f4f6" }]}>
                        <Text style={[styles.chipText, { color: "#6b7280" }]}>❓ Not set</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
    marginBottom: 4,
    marginTop: 4,
  },
  centered: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#dc2626",
    textAlign: "center",
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 14,
    color: "#fff",
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
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
    lineHeight: 18,
  },
  sectionHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  defaultLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});
