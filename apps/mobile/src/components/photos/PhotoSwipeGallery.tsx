import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSignedUrls, TeacherPhoto } from "@/lib/photos-actions";
import { SkeletonBox } from "@/components/ui/SkeletonBox";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const SKELETON_WIDTH = SCREEN_WIDTH * 0.72;
const SKELETON_HEIGHT = SCREEN_HEIGHT * 0.55;

function PhotoViewerSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonBox
        width={SKELETON_WIDTH}
        height={SKELETON_HEIGHT}
        borderRadius={12}
        style={{ backgroundColor: "#374151" }}
      />
    </View>
  );
}

export type PhotoSwipeGalleryProps = {
  photos: TeacherPhoto[];
  initialPhotoId: string;
  passedUrl?: string;
  onIndexChange?: (index: number, photo: TeacherPhoto | null) => void;
  renderTopBarRight?: (photo: TeacherPhoto | null, url: string | null) => ReactNode;
  renderOverlay?: (photo: TeacherPhoto | null) => ReactNode;
};

export function PhotoSwipeGallery({
  photos,
  initialPhotoId,
  passedUrl,
  onIndexChange,
  renderTopBarRight,
  renderOverlay,
}: PhotoSwipeGalleryProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<TeacherPhoto>>(null);

  const initialIndex = useMemo(
    () => Math.max(0, photos.findIndex((p) => p.id === initialPhotoId)),
    [photos, initialPhotoId]
  );

  const initialSignedUrls = useMemo(() => {
    if (!passedUrl || passedUrl.length === 0) return {};
    const photo = photos[initialIndex];
    if (!photo) return {};
    return { [photo.storage_path]: passedUrl };
  }, [passedUrl, photos, initialIndex]);

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>(initialSignedUrls);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (photos.length === 0) return;
    const idx = Math.min(currentIndex, photos.length - 1);
    const paths = [-1, 0, 1]
      .map((d) => photos[idx + d])
      .filter(Boolean)
      .map((p) => p.storage_path);
    if (paths.length === 0) return;
    fetchSignedUrls(paths).then((newUrls) => {
      setSignedUrls((prev) => {
        const merged = { ...prev };
        let changed = false;
        for (const [path, url] of Object.entries(newUrls)) {
          if (!merged[path]) {
            merged[path] = url;
            changed = true;
          }
        }
        return changed ? merged : prev;
      });
    });
  }, [currentIndex, photos]);

  useEffect(() => {
    if (photos.length === 0) {
      onIndexChange?.(0, null);
      return;
    }
    const idx = Math.min(currentIndex, photos.length - 1);
    onIndexChange?.(idx, photos[idx] ?? null);
  }, [currentIndex, photos, onIndexChange]);

  useEffect(() => {
    if (photos.length === 0) return;
    if (currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1);
    }
  }, [photos.length, currentIndex]);

  const safeIndex = photos.length > 0 ? Math.min(currentIndex, photos.length - 1) : 0;
  const currentPhoto = photos[safeIndex] ?? null;
  const currentUrl = currentPhoto ? signedUrls[currentPhoto.storage_path] ?? null : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {photos.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={1}
          removeClippedSubviews
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          keyExtractor={(p) => p.id}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
              });
            }, 100);
          }}
          renderItem={({ item }) => {
            const url = signedUrls[item.storage_path];
            return (
              <View style={styles.page}>
                {url ? (
                  <Image
                    source={{ uri: url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    transition={200}
                  />
                ) : (
                  <PhotoViewerSkeleton />
                )}
              </View>
            );
          }}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(newIndex);
          }}
        />
      ) : (
        <View style={styles.page}>
          <PhotoViewerSkeleton />
        </View>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topBarRight}>
          {renderTopBarRight?.(currentPhoto, currentUrl)}
        </View>
      </View>

      {renderOverlay?.(currentPhoto)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: "#000",
  },
  skeletonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
});
