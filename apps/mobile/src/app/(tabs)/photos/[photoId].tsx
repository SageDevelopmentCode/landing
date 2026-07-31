import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSignedUrls, TeacherPhoto } from "@/lib/photos-actions";
import { floatingTabBarStyle, FontFamilies } from "@/constants/theme";
import { saveImageToLibrary } from "@/utils/saveMedia";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ParentPhotoDetailScreen() {
  const { photoId, signedUrl: passedUrl, allPhotosJson } = useLocalSearchParams<{
    photoId: string;
    signedUrl?: string;
    allPhotosJson?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  const [photos, setPhotos] = useState<TeacherPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useEffect(() => {
    const parsed: TeacherPhoto[] = JSON.parse(allPhotosJson ?? "[]");
    const idx = Math.max(0, parsed.findIndex((p) => p.id === photoId));
    setPhotos(parsed);
    setCurrentIndex(idx);
    if (passedUrl && parsed[idx]) {
      setSignedUrls({ [parsed[idx].storage_path]: passedUrl });
    }
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    const paths = [-1, 0, 1]
      .map((d) => photos[currentIndex + d])
      .filter(Boolean)
      .map((p) => p.storage_path)
      .filter((sp) => !signedUrls[sp]);
    if (paths.length === 0) return;
    fetchSignedUrls(paths).then((newUrls) =>
      setSignedUrls((prev) => ({ ...prev, ...newUrls }))
    );
  }, [currentIndex, photos.length]);

  const currentPhoto = photos[currentIndex] ?? null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        ref={flatListRef}
        data={photos}
        horizontal
        pagingEnabled
        initialScrollIndex={currentIndex}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => {
          const url = signedUrls[item.storage_path];
          return (
            <View style={styles.page}>
              {url ? (
                <Image
                  source={{ uri: url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]}>
                  <Ionicons name="image-outline" size={56} color="#4b5563" />
                </View>
              )}
            </View>
          );
        }}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(newIndex);
        }}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        {currentPhoto && signedUrls[currentPhoto.storage_path] ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => saveImageToLibrary(signedUrls[currentPhoto.storage_path]!)}
            hitSlop={12}
          >
            <Ionicons name="download-outline" size={22} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {currentPhoto && (currentPhoto.caption || currentPhoto.taken_on) ? (
        <View style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {currentPhoto.caption ? (
              <Text style={styles.caption}>{currentPhoto.caption}</Text>
            ) : null}
            {currentPhoto.taken_on ? (
              <Text style={styles.date}>
                {new Date(currentPhoto.taken_on + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
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
  imagePlaceholder: {
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: "45%",
  },
  caption: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#fff",
    marginBottom: 4,
  },
  date: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#d1d5db",
    marginBottom: 8,
  },
});
