import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BottomTabInset, Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import {
  NewsletterListItem,
  createNewsletter,
  getNewsletters,
  softDeleteNewsletter,
} from "@/lib/newsletters-actions";

type Filter = "draft" | "published";

// ---------------------------------------------------------------------------
// Week range generator
// ---------------------------------------------------------------------------

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function generateWeekOptions(count = 16): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun, 1=Mon … 6=Sat
  // Walk back (or stay) to the Monday of the current week; skip to next Mon on weekends
  const diff = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diff);

  return Array.from({ length: count }, (_, i) => {
    const m = new Date(mon); m.setDate(mon.getDate() + i * 7);
    const f = new Date(m);   f.setDate(m.getDate() + 4);
    return `${MONTHS[m.getMonth()]} ${m.getDate()} – ${MONTHS[f.getMonth()]} ${f.getDate()}`;
  });
}

const WEEK_OPTIONS = generateWeekOptions();

const STATUS_COLORS = {
  draft:     { bg: "#fef9c3", text: "#854d0e" },
  published: { bg: "#dcfce7", text: "#166534" },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NewsletterCard({
  item,
  onPress,
  onDelete,
}: {
  item: NewsletterListItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.draft;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name="newspaper-outline" size={22} color={Brand.sage700} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardWeek} numberOfLines={1}>{item.week_range}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.chip, { backgroundColor: sc.bg }]}>
            <Text style={[styles.chipText, { color: sc.text }]}>
              {item.status === "published" ? "Published" : "Draft"}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatRelativeTime(item.updated_at)}</Text>
        </View>
      </View>
      <Pressable
        hitSlop={8}
        style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.5 }]}
        onPress={() =>
          Alert.alert(item.title, item.week_range, [
            { text: "Open", onPress },
            {
              text: "Delete",
              style: "destructive",
              onPress: () =>
                Alert.alert("Delete Newsletter", `Delete "${item.title}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: onDelete },
                ]),
            },
            { text: "Cancel", style: "cancel" },
          ])
        }
      >
        <Ionicons name="ellipsis-vertical" size={18} color="#6b7280" />
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// New Newsletter bottom sheet
// ---------------------------------------------------------------------------

const NewNewsletterSheet = forwardRef<BottomSheetModal, { onCreate: (title: string, weekRange: string) => void }>(
  ({ onCreate }, ref) => {
    const [title, setTitle] = useState("");
    const [weekRange, setWeekRange] = useState(WEEK_OPTIONS[0]);
    const [creating, setCreating] = useState(false);

    const reset = () => { setTitle(""); setWeekRange(WEEK_OPTIONS[0]); };

    const handleCreate = async () => {
      if (!title.trim()) {
        Alert.alert("Required", "Please enter a title.");
        return;
      }
      setCreating(true);
      try {
        onCreate(title.trim(), weekRange.trim());
        (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
        reset();
      } finally {
        setCreating(false);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["72%"]}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView style={sheetStyles.container}>
          <Text style={sheetStyles.title}>New Newsletter</Text>

          <Text style={sheetStyles.label}>Title</Text>
          <TextInput
            style={sheetStyles.input}
            placeholder="Week of May 26"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={sheetStyles.label}>Week Range</Text>
          <ScrollView
            style={sheetStyles.weekList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {WEEK_OPTIONS.map((week) => {
              const selected = week === weekRange;
              return (
                <Pressable
                  key={week}
                  style={[sheetStyles.weekRow, selected && sheetStyles.weekRowSelected]}
                  onPress={() => setWeekRange(week)}
                >
                  <Text style={[sheetStyles.weekRowText, selected && sheetStyles.weekRowTextSelected]}>
                    {week}
                  </Text>
                  <View style={[sheetStyles.weekCheck, selected && sheetStyles.weekCheckFilled]}>
                    {selected && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={sheetStyles.btnRow}>
            <Pressable
              style={({ pressed }) => [sheetStyles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
                reset();
              }}
            >
              <Text style={sheetStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [sheetStyles.createBtn, pressed && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={sheetStyles.createText}>{creating ? "Creating…" : "Create"}</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function NewslettersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const sheetRef = useRef<BottomSheetModal>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  const [newsletters, setNewsletters] = useState<NewsletterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("draft");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNewsletters();
      setNewsletters(data);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to load newsletters");
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

  const handleCreate = useCallback(
    async (title: string, weekRange: string) => {
      setCreating(true);
      try {
        const nl = await createNewsletter(title, weekRange);
        setNewsletters((prev) => [
          { id: nl.id, title: nl.title, week_range: nl.week_range, status: nl.status, updated_at: nl.updated_at, created_at: nl.created_at },
          ...prev,
        ]);
        router.push({ pathname: "/(staff)/newsletters/[newsletterId]" as any, params: { newsletterId: nl.id } });
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to create newsletter");
      } finally {
        setCreating(false);
      }
    },
    [router]
  );

  const handleDelete = useCallback((item: NewsletterListItem) => {
    softDeleteNewsletter(item.id)
      .then(() => setNewsletters((prev) => prev.filter((n) => n.id !== item.id)))
      .catch((e) => Alert.alert("Error", e.message ?? "Failed to delete"));
  }, []);

  const filtered = newsletters.filter((n) => n.status === filter);

  const counts = {
    draft: newsletters.filter((n) => n.status === "draft").length,
    published: newsletters.filter((n) => n.status === "published").length,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle}>Newsletters</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {(["draft", "published"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
              {f === "draft" ? "Drafts" : "Published"}
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
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="newspaper-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {filter === "draft" ? "No drafts yet" : "No published newsletters"}
          </Text>
          {filter === "draft" && (
            <Pressable style={styles.emptyBtn} onPress={() => sheetRef.current?.present()}>
              <Text style={styles.emptyBtnText}>Create your first newsletter</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + 80 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.sage700} />
          }
          renderItem={({ item }) => (
            <NewsletterCard
              item={item}
              onPress={() =>
                router.push({ pathname: "/(staff)/newsletters/[newsletterId]" as any, params: { newsletterId: item.id } })
              }
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: BottomTabInset + 16 }]}
        onPress={() => sheetRef.current?.present()}
        disabled={creating}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <NewNewsletterSheet ref={sheetRef} onCreate={handleCreate} />
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
  headerTitle: { fontFamily: FontFamilies.heading, fontSize: 18, color: "#1f2937" },
  filterScroll: { backgroundColor: "#fff", maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6" },
  filterPillActive: { backgroundColor: Brand.sage700 },
  filterPillText: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  filterPillTextActive: { color: "#fff" },
  filterCount: { color: "rgba(255,255,255,0.75)" },
  filterCountInactive: { color: "#9ca3af" },
  listContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
    alignItems: "center",
  },
  cardLeft: {},
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F7F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: FontFamilies.bodySemiBold, fontSize: 15, color: "#111827" },
  cardWeek: { fontFamily: FontFamilies.body, fontSize: 12, color: "#6b7280" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  chipText: { fontFamily: FontFamilies.body, fontSize: 11 },
  timeText: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9ca3af" },
  moreBtn: { padding: 4 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  emptyTitle: { fontFamily: FontFamilies.body, fontSize: 15, color: "#9ca3af", textAlign: "center" },
  emptyBtn: { marginTop: 4, backgroundColor: Brand.sage700, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#fff" },
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

const sheetStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontFamily: FontFamilies.heading, fontSize: 18, color: "#1f2937", marginBottom: 20, marginTop: 4 },
  label: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#374151", marginBottom: 6 },
  input: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  cancelText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#6b7280" },
  createBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Brand.sage700,
    alignItems: "center",
  },
  createText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 14, color: "#fff" },
  weekList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  weekRowSelected: { backgroundColor: "#F2F7F3" },
  weekRowText: { flex: 1, fontFamily: FontFamilies.body, fontSize: 14, color: "#111827" },
  weekRowTextSelected: { fontFamily: FontFamilies.bodySemiBold, color: Brand.sage700 },
  weekCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  weekCheckFilled: { backgroundColor: Brand.sage700, borderColor: Brand.sage700 },
});
