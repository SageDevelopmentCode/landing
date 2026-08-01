import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { Activity, deleteActivity, getActivities } from "@/lib/activities-actions";

type Filter = "all" | "published" | "drafts";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: "#dcfce7", text: "#166534" },
  draft: { bg: "#fef9c3", text: "#854d0e" },
};

const VISIBILITY_COLORS: Record<string, { bg: string; text: string }> = {
  public: { bg: "#dbeafe", text: "#1e40af" },
  private: { bg: "#f3e8ff", text: "#6b21a8" },
};

function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onPress,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const thumb = activity.images[0]?.signed_url ?? null;
  const statusStyle = STATUS_COLORS[activity.status] ?? STATUS_COLORS.draft;
  const visStyle = VISIBILITY_COLORS[activity.visibility] ?? VISIBILITY_COLORS.private;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={styles.cardThumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumbImg} contentFit="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="ribbon-outline" size={28} color="#9ca3af" />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {activity.title}
        </Text>
        {!!activity.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {activity.description}
          </Text>
        )}
        <View style={styles.badgeRow}>
          <Chip label={activity.status === "published" ? "Published" : "Draft"} bg={statusStyle.bg} color={statusStyle.text} />
          <Chip label={activity.visibility === "public" ? "Public" : "Private"} bg={visStyle.bg} color={visStyle.text} />
          {activity.includes_food && (
            <Chip label="Food" bg="#fef3c7" color="#92400e" />
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          hitSlop={8}
          onPress={() =>
            Alert.alert("Activity", activity.title, [
              { text: "Edit", onPress: onEdit },
              { text: "Delete", style: "destructive", onPress: onDelete },
              { text: "Cancel", style: "cancel" },
            ])
          }
          style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#6b7280" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to load activities");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDelete = useCallback(
    (activity: Activity) => {
      Alert.alert(
        "Delete Activity",
        `Are you sure you want to delete "${activity.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setDeletingId(activity.id);
              try {
                await deleteActivity(activity.id);
                setActivities((prev) => prev.filter((a) => a.id !== activity.id));
              } catch (e: any) {
                Alert.alert("Error", e.message ?? "Failed to delete");
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const filtered = activities.filter((a) => {
    if (filter === "published") return a.status === "published";
    if (filter === "drafts") return a.status === "draft";
    return true;
  });

  const counts = {
    all: activities.length,
    published: activities.filter((a) => a.status === "published").length,
    drafts: activities.filter((a) => a.status === "draft").length,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle}>Activities</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {(["all", "published", "drafts"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
              {f === "all" ? "All" : f === "published" ? "Published" : "Drafts"}
              {"  "}
              <Text style={filter === f ? styles.filterCount : styles.filterCountInactive}>
                {counts[f]}
              </Text>
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="ribbon-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {activities.length === 0 ? "No activities yet" : `No ${filter} activities`}
          </Text>
          {activities.length === 0 && (
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push("/(staff)/activities/form" as any)}
            >
              <Text style={styles.emptyBtnText}>Create your first activity</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + 80 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.sage700} />
          }
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              onPress={() =>
                router.push({
                  pathname: "/(staff)/activities/[activityId]" as any,
                  params: { activityId: item.id },
                })
              }
              onEdit={() =>
                router.push({
                  pathname: "/(staff)/activities/form" as any,
                  params: { activityId: item.id },
                })
              }
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: BottomTabInset + 16 }]}
        onPress={() => router.push("/(staff)/activities/form" as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
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
  backBtn: { width: 32, alignItems: "flex-start" },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
  },
  filterScroll: { backgroundColor: "#fff", maxHeight: 52 },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  filterPillActive: { backgroundColor: Brand.sage700 },
  filterPillText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  filterPillTextActive: { color: "#fff" },
  filterCount: { color: "rgba(255,255,255,0.75)" },
  filterCountInactive: { color: "#9ca3af" },
  listContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardThumb: { width: 80, height: 80, borderRadius: 10, overflow: "hidden" },
  thumbImg: { width: 80, height: 80 },
  thumbPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, justifyContent: "center", gap: 4 },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#111827",
  },
  cardDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
  },
  cardActions: { justifyContent: "center" },
  menuBtn: { padding: 4 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  emptyTitle: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 4,
    backgroundColor: Brand.sage700,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
