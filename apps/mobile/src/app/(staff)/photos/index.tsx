import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  ViewToken,
  View,
} from "react-native";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import {
  deletePhoto,
  fetchSignedUrls,
  getAllSchoolPhotos,
  TeacherPhoto,
} from "@/lib/photos-actions";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { setPhotoGallerySession } from "@/lib/photo-gallery-session";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TILE_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - TILE_GAP * 2) / 3;

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tile row
// ---------------------------------------------------------------------------

function TileRow({
  row,
  signedUrls,
  onPress,
  onLongPress,
}: {
  row: TeacherPhoto[];
  signedUrls: Record<string, string>;
  onPress: (p: TeacherPhoto) => void;
  onLongPress: (p: TeacherPhoto) => void;
}) {
  return (
    <View style={styles.tileRow}>
      {row.map((photo) => {
        const url = signedUrls[photo.storage_path];
        return (
          <Pressable
            key={photo.id}
            onPress={() => onPress(photo)}
            onLongPress={() => onLongPress(photo)}
          >
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

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PhotosGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole } = useAuth();

  const [photos, setPhotos] = useState<TeacherPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ref used inside debounce closure to avoid stale state reads
  const signedUrlsRef = useRef<Record<string, string>>({});
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { batch, onBatchComplete, markGalleryClean, isGalleryDirty } = useUploadQueue();
  const hasLoadedOnce = useRef(false);

  const loadPhotos = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    const result = await getAllSchoolPhotos();
    setPhotos(result);
    // Reset signed URL cache on fresh load
    signedUrlsRef.current = {};
    setSignedUrls({});
    markGalleryClean();
  }, [markGalleryClean]);

  useEffect(() => {
    return onBatchComplete(() => loadPhotos());
  }, []); // stable refs — intentionally empty deps

  useFocusEffect(
    useCallback(() => {
      if (!isGalleryDirty() && hasLoadedOnce.current) return; // data unchanged, skip refetch
      if (!hasLoadedOnce.current) setLoading(true); // spinner only on first load
      loadPhotos().finally(() => {
        hasLoadedOnce.current = true;
        setLoading(false);
      });
    }, [loadPhotos, isGalleryDirty])
  );

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
        // Prune photos whose storage files are gone (soft-deleted but returned by RPC)
        const missing = paths.filter((p) => !newUrls[p]);
        if (missing.length > 0) {
          const missingSet = new Set(missing);
          setPhotos((prev) => prev.filter((p) => !missingSet.has(p.storage_path)));
        }
      }, 150);
    },
    []
  );

  function handlePress(photo: TeacherPhoto) {
    setPhotoGallerySession(photos);
    router.push({
      pathname: "/(staff)/photos/[photoId]",
      params: {
        photoId: photo.id,
        storagePath: photo.storage_path,
        signedUrl: signedUrls[photo.storage_path] ?? "",
      },
    });
  }

  function handleLongPress(photo: TeacherPhoto) {
    const isOwner = currentUserId !== null && photo.teacher_id === currentUserId;
    const canDelete = isOwner || userRole === "super_admin";
    const actions: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [
      { text: "View", onPress: () => handlePress(photo) },
    ];

    if (isOwner) {
      actions.push({
        text: "Edit",
        onPress: () =>
          router.push({
            pathname: "/(staff)/photos/edit",
            params: { photoId: photo.id },
          }),
      });
    }

    if (canDelete) {
      actions.push({
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete Photo", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  await deletePhoto(photo.id, photo.storage_path);
                  setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
                } catch (err) {
                  console.error("[handleDelete] failed:", err);
                  Alert.alert("Delete failed", err instanceof Error ? err.message : "Could not delete photo.");
                }
              },
            },
          ]),
      });
    }

    actions.push({ text: "Cancel", style: "cancel" });
    Alert.alert(photo.caption ?? "Photo", undefined, actions);
  }

  const sections = useMemo(() => groupByDate(photos), [photos]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photos</Text>
      </View>

      {batch !== null && (
        <View style={styles.uploadBanner}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.uploadBannerText}>
            {batch.doneCount + batch.errorCount < batch.totalCount
              ? `Uploading ${batch.totalCount - batch.doneCount - batch.errorCount} of ${batch.totalCount} photo${batch.totalCount !== 1 ? "s" : ""}…`
              : batch.errorCount > 0
              ? `${batch.doneCount} uploaded, ${batch.errorCount} failed`
              : `${batch.doneCount} photo${batch.doneCount !== 1 ? "s" : ""} uploaded`}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading…</Text>
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
            <TileRow
              row={row}
              signedUrls={signedUrls}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
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
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyBody}>
                Tap the + button to upload your first photo.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: BottomTabInset + 16 }]}
        onPress={() => router.push("/(staff)/photos/upload")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
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
  uploadBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.sage700,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  uploadBannerText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
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
  loadingText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
});
