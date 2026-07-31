import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { Activity, ActivityChangeLogEntry, getActivities } from "@/lib/activities-actions";

const AVATAR_COLORS = [
  "#5E7C68", "#7C5E68", "#687C5E", "#5E687C", "#7C6E5E",
  "#5E7C7C", "#7C5E7C", "#6E7C5E", "#5E5E7C", "#7C7C5E",
];

function avatarColor(teacherId: string): string {
  let hash = 0;
  for (let i = 0; i < teacherId.length; i++) {
    hash = (hash * 31 + teacherId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string | null, fallbackId: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return fallbackId.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function LogEntry({ entry }: { entry: ActivityChangeLogEntry }) {
  const color = avatarColor(entry.teacher_id);
  const abbrev = initials(entry.teacher_name, entry.teacher_id);

  return (
    <View style={styles.entry}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        {entry.teacher_profile_image_url ? (
          <Image
            source={{ uri: entry.teacher_profile_image_url }}
            style={styles.avatarImg}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarText}>{abbrev}</Text>
        )}
      </View>
      <View style={styles.entryBody}>
        <View style={styles.entryMeta}>
          <Text style={styles.teacherName}>{entry.teacher_name ?? "Teacher"}</Text>
          <Text style={styles.timestamp}>{relativeTime(entry.created_at)}</Text>
        </View>
        {entry.summary.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ChangelogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const all = await getActivities();
      setActivity(all.find((a) => a.id === activityId) ?? null);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to load");
    }
  }, [activityId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const entries = activity?.change_log ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle}>Change History</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="time-outline" size={44} color="#d1d5db" />
          <Text style={styles.emptyText}>No history yet</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + 24 },
          ]}
          renderItem={({ item }) => <LogEntry entry={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  emptyText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  listContent: { padding: 16, gap: 12 },
  entry: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  entryBody: { flex: 1, gap: 4 },
  entryMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teacherName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#111827",
  },
  timestamp: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  bulletRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  bullet: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },
  bulletText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
});
