import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { supabase } from "@/lib/supabase";
import { deletePhoto, getTeacherPhotos, TeacherPhoto, ConsentLevel } from "@/lib/photos-actions";
import { floatingTabBarStyle, FontFamilies } from "@/constants/theme";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { saveImageToLibrary } from "@/utils/saveMedia";

const CONSENT_COLORS: Record<ConsentLevel, { dot: string }> = {
  FULL:    { dot: "#16a34a" },
  LIMITED: { dot: "#d97706" },
  NO:      { dot: "#dc2626" },
};

const LABEL_DISPLAY: Record<string, string> = {
  newsletter:   "Newsletter",
  social_media: "Social Media",
  website:      "Website",
};

export default function PhotoDetailScreen() {
  const { photoId, signedUrl: passedUrl, storagePath: passedPath } = useLocalSearchParams<{
    photoId: string;
    signedUrl?: string;
    storagePath?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { markGalleryDirty } = useUploadQueue();

  const [photo, setPhoto] = useState<TeacherPhoto | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    passedUrl && passedUrl.length > 0 ? passedUrl : null
  );
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch metadata (tags, caption, etc.)
      const all = await getTeacherPhotos(user.id);
      const found = all.find((p) => p.id === photoId);
      if (found) {
        setPhoto(found);
        // If no signed URL was passed from gallery (e.g. navigated directly), fetch one now
        if (found.storage_path) {
          const { data } = await supabase.storage
            .from("teacher-photos")
            .createSignedUrl(found.storage_path, 86400);
          if (data?.signedUrl) setImageUrl(data.signedUrl);
        }
      }
      setLoading(false);
    }
    load();
  }, [photoId]);

  function handleDelete() {
    if (!photo) return;
    Alert.alert("Delete Photo", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePhoto(photo.id, photo.storage_path);
          markGalleryDirty();
          router.back();
        },
      },
    ]);
  }

  if (loading && !imageUrl) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Pressable
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={56} color="#4b5563" />
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topBarRight}>
          {imageUrl && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => saveImageToLibrary(imageUrl)}
              hitSlop={12}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
            </Pressable>
          )}
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({ pathname: "/(staff)/photos/edit", params: { photoId } })
            }
          >
            <Ionicons name="pencil-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Bottom overlay — only if there's something to show */}
      {photo && (
        photo.caption ||
        photo.taken_on ||
        photo.tags.length > 0 ||
        photo.publication_labels.length > 0
      ) ? (
        <View style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {photo!.caption ? (
              <Text style={styles.caption}>{photo!.caption}</Text>
            ) : null}

            {photo!.taken_on ? (
              <Text style={styles.date}>
                {new Date(photo!.taken_on + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            ) : null}

            {photo!.tags.length > 0 && (
              <View style={styles.chips}>
                {photo!.tags.map((tag) => (
                  <View key={tag.student_id} style={styles.tagChip}>
                    {tag.consent_level && tag.consent_level !== "FULL" && (
                      <View
                        style={[
                          styles.consentDot,
                          { backgroundColor: CONSENT_COLORS[tag.consent_level].dot },
                        ]}
                      />
                    )}
                    <Text style={styles.tagText}>{tag.name ?? "Unknown"}</Text>
                  </View>
                ))}
              </View>
            )}

            {photo!.publication_labels.length > 0 && (
              <View style={[styles.chips, { marginTop: 6 }]}>
                {photo!.publication_labels.map((lbl) => (
                  <View key={lbl} style={styles.labelChip}>
                    <Text style={styles.labelText}>{LABEL_DISPLAY[lbl] ?? lbl}</Text>
                  </View>
                ))}
              </View>
            )}
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
  loadingContainer: {
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
  },
  topBarRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: 16,
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  consentDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tagText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#fff",
  },
  labelChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#fff",
  },
});
