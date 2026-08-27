import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  ViewToken,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSignedUrls, getAllSchoolPhotos, TeacherPhoto } from "@/lib/photos-actions";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { setPhotoGallerySession } from "@/lib/photo-gallery-session";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TILE_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - TILE_GAP * 2) / 3;

function formatSectionTitle(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function chunk<T>(arr: T[], n: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += n) rows.push(arr.slice(i, i + n));
  return rows;
}

type PhotoSection = {
  title: string;
  dateKey: string;
  data: TeacherPhoto[][];
};

function groupByDate(photos: TeacherPhoto[]): PhotoSection[] {
  const groups = new Map<string, TeacherPhoto[]>();
  for (const p of photos) {
    const key = p.taken_on ?? "__undated__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const entries = [...groups.entries()].sort(([a], [b]) => {
    if (a === "__undated__") return 1;
    if (b === "__undated__") return -1;
    return b.localeCompare(a);
  });
  return entries.map(([key, ps]) => ({
    title: key === "__undated__" ? "Undated" : formatSectionTitle(key),
    dateKey: key,
    data: chunk(ps, 3),
  }));
}

function TileRow({
  row,
  signedUrls,
  onPress,
}: {
  row: TeacherPhoto[];
  signedUrls: Record<string, string>;
  onPress: (p: TeacherPhoto) => void;
}) {
  return (
    <View style={styles.tileRow}>
      {row.map((photo) => {
        const url = signedUrls[photo.storage_path];
        return (
          <Pressable key={photo.id} onPress={() => onPress(photo)}>
            {url ? (
              <Image
                source={{ uri: url }}
                style={styles.tile}
                contentFit="cover"
                recyclingKey={photo.id}
              />
            ) : (
              <View style={[styles.tile, styles.tilePlaceholder]}>
                <Ionicons name="image-outline" size={28} color="#d1d5db" />
              </View>
            )}
          </Pressable>
        );
      })}
      {row.length < 3 &&
        Array.from({ length: 3 - row.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.tileEmpty} />
        ))}
    </View>
  );
}

export default function ParentPhotosGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [photos, setPhotos] = useState<TeacherPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const signedUrlsRef = useRef<Record<string, string>>({});
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  const loadPhotos = useCallback(async () => {
    try {
      const result = await getAllSchoolPhotos();
      setPhotos(result);
      setError(null);
      signedUrlsRef.current = {};
      setSignedUrls({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    loadPhotos().finally(() => setLoading(false));
  }, [loadPhotos]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  }

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(async () => {
        const paths: string[] = [];
        for (const token of viewableItems) {
          const row = token.item as TeacherPhoto[];
          if (!Array.isArray(row)) continue;
          for (const p of row) {
            if (p.storage_path && !signedUrlsRef.current[p.storage_path]) {
              paths.push(p.storage_path);
            }
          }
        }
        if (paths.length === 0) return;
        const newUrls = await fetchSignedUrls(paths);
        signedUrlsRef.current = { ...signedUrlsRef.current, ...newUrls };
        setSignedUrls((prev) => ({ ...prev, ...newUrls }));
      }, 150);
    },
    []
  );

  function handlePress(photo: TeacherPhoto) {
    setPhotoGallerySession(photos);
    router.push({
      pathname: "/(tabs)/photos/[photoId]",
      params: {
        photoId: photo.id,
        storagePath: photo.storage_path,
        signedUrl: signedUrls[photo.storage_path] ?? "",
      },
    });
  }

  const allSections = useMemo(() => groupByDate(photos), [photos]);

  const sections = useMemo(
    () =>
      selectedDates.size === 0
        ? allSections
        : allSections.filter((s) => selectedDates.has(s.dateKey)),
    [allSections, selectedDates]
  );

  const availableDates = useMemo(
    () => allSections.map((s) => ({ key: s.dateKey, title: s.title })),
    [allSections]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photos</Text>
        <Pressable
          style={styles.filterBtn}
          onPress={() => filterSheetRef.current?.present()}
        >
          <Ionicons
            name={selectedDates.size > 0 ? "calendar" : "calendar-outline"}
            size={22}
            color={selectedDates.size > 0 ? Brand.sage700 : "#6b7280"}
          />
          {selectedDates.size > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedDates.size}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.sage700} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(row, idx) =>
            Array.isArray(row) ? row.map((p) => p.id).join("-") + idx : `row-${idx}`
          }
          extraData={signedUrls}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <TileRow row={row} signedUrls={signedUrls} onPress={handlePress} />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Brand.sage700}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>
                {selectedDates.size > 0 ? "No photos for selected dates" : "No photos yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {selectedDates.size > 0
                  ? "Try selecting different dates."
                  : "Check back soon for school photos."}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      <BottomSheetModal
        ref={filterSheetRef}
        snapPoints={["50%", "80%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.filterSheet}>
          <View style={styles.filterSheetHeader}>
            <Text style={styles.filterSheetTitle}>Filter by Date</Text>
            {selectedDates.size > 0 && (
              <Pressable onPress={() => setSelectedDates(new Set())}>
                <Text style={styles.filterClear}>Clear</Text>
              </Pressable>
            )}
          </View>
          {availableDates.map(({ key, title }) => {
            const selected = selectedDates.has(key);
            return (
              <Pressable
                key={key}
                style={styles.filterRow}
                onPress={() => {
                  setSelectedDates((prev) => {
                    const next = new Set(prev);
                    selected ? next.delete(key) : next.add(key);
                    return next;
                  });
                }}
              >
                <Text style={styles.filterRowText}>{title}</Text>
                {selected && (
                  <Ionicons name="checkmark" size={18} color={Brand.sage700} />
                )}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: "#111827",
  },
  filterBtn: {
    padding: 4,
  },
  filterBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontFamily: FontFamilies.body,
    fontSize: 8,
    color: "#fff",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tileRow: {
    flexDirection: "row",
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "#f3f4f6",
  },
  tilePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  tileEmpty: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: "#374151",
  },
  emptyBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#dc2626",
  },
  filterSheet: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  filterSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  filterSheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#111827",
  },
  filterClear: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: Brand.sage700,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterRowText: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#374151",
  },
});
