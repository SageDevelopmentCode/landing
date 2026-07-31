import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { Activity, ActivityFood, getActivities } from "@/lib/activities-actions";
import { ActivityPreferencesSheet } from "@/components/ActivityPreferencesSheet";

const SCREEN_WIDTH = Dimensions.get("window").width;

function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function FoodCard({ food }: { food: ActivityFood }) {
  const [expanded, setExpanded] = useState(false);
  const thumb = food.images[0]?.signed_url ?? null;

  return (
    <View style={styles.foodCard}>
      <Pressable style={styles.foodHeader} onPress={() => setExpanded((v) => !v)}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.foodThumb} contentFit="cover" />
        ) : (
          <View style={[styles.foodThumb, styles.foodThumbPlaceholder]}>
            <Ionicons name="restaurant-outline" size={18} color="#9ca3af" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.allergens ? (
            <Text style={styles.allergenText}>⚠️ {food.allergens}</Text>
          ) : null}
          {food.ingredients.length > 0 && (
            <Text style={styles.ingredientCount}>
              {food.ingredients.length} ingredient{food.ingredients.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9ca3af"
        />
      </Pressable>

      {expanded && food.ingredients.length > 0 && (
        <View style={styles.ingredientList}>
          {food.ingredients.map((ing) => {
            const ingThumb = ing.images[0]?.signed_url ?? null;
            return (
              <View key={ing.id} style={styles.ingredientRow}>
                {ingThumb ? (
                  <Image source={{ uri: ingThumb }} style={styles.ingThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.ingThumb, styles.ingThumbPlaceholder]}>
                    <Ionicons name="leaf-outline" size={12} color="#9ca3af" />
                  </View>
                )}
                <Text style={styles.ingName}>{ing.name}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();

  const prefsSheetRef = useRef<BottomSheetModal>(null);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      const all = await getActivities();
      const found = all.find((a) => a.id === activityId) ?? null;
      setActivity(found);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to load activity");
    }
  }, [activityId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
          </Pressable>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
          </Pressable>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Activity not found</Text>
        </View>
      </View>
    );
  }

  const statusBg = activity.status === "published" ? "#dcfce7" : "#fef9c3";
  const statusColor = activity.status === "published" ? "#166534" : "#854d0e";
  const visBg = activity.visibility === "public" ? "#dbeafe" : "#f3e8ff";
  const visColor = activity.visibility === "public" ? "#1e40af" : "#6b21a8";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activity.title}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            hitSlop={8}
            onPress={() => prefsSheetRef.current?.present()}
          >
            <Ionicons name="people-outline" size={22} color={Brand.sage700} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() =>
              router.push({
                pathname: "/(staff)/activities/changelog" as any,
                params: { activityId: activity.id },
              })
            }
          >
            <Ionicons name="time-outline" size={22} color={Brand.sage700} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + 80 }]}
      >
        {/* Image gallery */}
        {activity.images.length > 0 ? (
          <View style={styles.galleryContainer}>
            <FlatList
              data={activity.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(img) => img.id}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setImageIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.signed_url }}
                  style={styles.galleryImage}
                  contentFit="cover"
                />
              )}
            />
            {activity.images.length > 1 && (
              <View style={styles.pageDots}>
                {activity.images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === imageIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="ribbon-outline" size={56} color="#d1d5db" />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{activity.title}</Text>

          <View style={styles.badgeRow}>
            <Chip label={activity.status === "published" ? "Published" : "Draft"} bg={statusBg} color={statusColor} />
            <Chip label={activity.visibility === "public" ? "Public" : "Private"} bg={visBg} color={visColor} />
            {activity.includes_food && <Chip label="Food" bg="#fef3c7" color="#92400e" />}
          </View>

          {!!activity.description && (
            <Text style={styles.description}>{activity.description}</Text>
          )}

          {/* Foods section */}
          {activity.includes_food && activity.foods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Foods</Text>
              {activity.foods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit FAB */}
      <Pressable
        style={[styles.fab, { bottom: BottomTabInset + 16 }]}
        onPress={() =>
          router.push({
            pathname: "/(staff)/activities/form" as any,
            params: { activityId: activity.id },
          })
        }
      >
        <Ionicons name="pencil" size={22} color="#fff" />
      </Pressable>

      <ActivityPreferencesSheet ref={prefsSheetRef} activityId={activity.id} />
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  scrollContent: { gap: 0 },
  galleryContainer: { position: "relative" },
  galleryImage: { width: SCREEN_WIDTH, height: 260 },
  pageDots: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff" },
  imagePlaceholder: {
    height: 180,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 12 },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: "#111827",
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  chipText: { fontFamily: FontFamilies.body, fontSize: 12 },
  description: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  section: { gap: 10, marginTop: 4 },
  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  foodHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  foodThumb: { width: 52, height: 52, borderRadius: 8 },
  foodThumbPlaceholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  foodName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  allergenText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#b45309",
    marginTop: 2,
  },
  ingredientCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  ingredientList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ingThumb: { width: 36, height: 36, borderRadius: 6 },
  ingThumbPlaceholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  ingName: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
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
