import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Brand, BottomTabInset } from "@/constants/theme";
import { API_BASE_URL } from "@/constants/config";
import {
  getPublishedNewsletters,
  type ParentNewsletterListItem,
} from "@/lib/newsletters-actions";

const CARD_GAP = 12;

function NewsletterCard({ item }: { item: ParentNewsletterListItem }) {
  function handlePress() {
    Linking.openURL(`${API_BASE_URL}/newsletter/${item.id}`);
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={handlePress}
    >
      <View style={styles.cardImageWrap}>
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.cardImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.cardImageFallback}>
            <Ionicons name="newspaper-outline" size={32} color="#9ca3af" />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardWeek} numberOfLines={1}>
          {item.week_range}
        </Text>

        {item.access_password ? (
          <View style={styles.passwordRow}>
            <Ionicons name="lock-closed-outline" size={11} color="#6b7280" />
            <Text style={styles.passwordLabel}>Password: </Text>
            <Text selectable style={styles.passwordValue}>
              {item.access_password}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="newspaper-outline" size={32} color={Brand.sage700} />
      </View>
      <Text style={styles.emptyTitle}>No newsletters yet</Text>
      <Text style={styles.emptyBody}>
        Newsletters will appear here once published.
      </Text>
    </View>
  );
}

export default function NewslettersScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ParentNewsletterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPublishedNewsletters();
      setItems(data);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to load newsletters");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Newsletters</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Brand.sage700} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + 24 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Brand.sage700}
            />
          }
          renderItem={({ item }) => <NewsletterCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 17,
    color: "#1f2937",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    gap: CARD_GAP,
  },
  columnWrapper: {
    gap: CARD_GAP,
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardImageWrap: {
    aspectRatio: 16 / 9,
    width: "100%",
  },
  cardImage: {
    flex: 1,
  },
  cardImageFallback: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 10,
    gap: 3,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#1f2937",
    lineHeight: 16,
  },
  cardWeek: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#6b7280",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  passwordLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#6b7280",
  },
  passwordValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#6b7280",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: `${Brand.sage700}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1f2937",
  },
  emptyBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
