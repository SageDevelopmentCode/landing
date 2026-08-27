import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import {
  deletePhoto,
  getAllSchoolPhotos,
  TeacherPhoto,
  ConsentLevel,
} from "@/lib/photos-actions";
import { PhotoSwipeGallery } from "@/components/photos/PhotoSwipeGallery";
import {
  getPhotoGallerySession,
  updatePhotoGallerySession,
} from "@/lib/photo-gallery-session";
import { floatingTabBarStyle, FontFamilies } from "@/constants/theme";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { useAuth } from "@/contexts/AuthContext";
import { saveImageToLibrary } from "@/utils/saveMedia";

const CONSENT_COLORS: Record<ConsentLevel, { dot: string }> = {
  FULL: { dot: "#16a34a" },
  LIMITED: { dot: "#d97706" },
  NO: { dot: "#dc2626" },
};

const LABEL_DISPLAY: Record<string, string> = {
  newsletter: "Newsletter",
  social_media: "Social Media",
  website: "Website",
};

function buildStubPhoto(
  photoId: string,
  storagePath: string | undefined,
  signedUrl: string | undefined
): TeacherPhoto {
  return {
    id: photoId,
    teacher_id: "",
    storage_path: storagePath ?? "",
    signed_url: signedUrl && signedUrl.length > 0 ? signedUrl : null,
    caption: null,
    taken_on: null,
    created_at: new Date().toISOString(),
    tags: [],
    publication_labels: [],
  };
}

function initialPhotosFromSessionOrStub(
  photoId: string,
  storagePath: string | undefined,
  signedUrl: string | undefined
): TeacherPhoto[] {
  const session = getPhotoGallerySession();
  if (session.length > 0) return session;
  if (!storagePath) return [];
  return [buildStubPhoto(photoId, storagePath, signedUrl)];
}

export default function PhotoDetailScreen() {
  const {
    photoId,
    signedUrl: passedUrl,
    storagePath: passedPath,
  } = useLocalSearchParams<{
    photoId: string;
    signedUrl?: string;
    storagePath?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { markGalleryDirty } = useUploadQueue();
  const { userRole } = useAuth();

  const [photos, setPhotos] = useState<TeacherPhoto[]>(() =>
    initialPhotosFromSessionOrStub(photoId, passedPath, passedUrl)
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (getPhotoGallerySession().length > 0) return;

    let cancelled = false;

    async function loadFallback() {
      const all = await getAllSchoolPhotos();
      if (cancelled) return;

      const found = all.find((p) => p.id === photoId);
      if (found) {
        setPhotos([found]);
        updatePhotoGallerySession([found]);
      }
    }

    loadFallback();
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  function handleDelete(photo: TeacherPhoto) {
    Alert.alert("Delete Photo", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePhoto(photo.id, photo.storage_path);
          markGalleryDirty();
          const next = photos.filter((p) => p.id !== photo.id);
          if (next.length === 0) {
            router.back();
            return;
          }
          setPhotos(next);
          updatePhotoGallerySession(next);
        },
      },
    ]);
  }

  return (
    <PhotoSwipeGallery
      photos={photos}
      initialPhotoId={photoId}
      passedUrl={passedUrl}
      renderTopBarRight={(photo, url) => {
        const slideIsOwner =
          photo !== null &&
          currentUserId !== null &&
          photo.teacher_id === currentUserId;
        const slideCanDelete = slideIsOwner || userRole === "super_admin";

        return (
          <>
            {url ? (
              <Pressable
                style={styles.iconBtn}
                onPress={() => saveImageToLibrary(url)}
                hitSlop={12}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
              </Pressable>
            ) : null}
            {slideIsOwner && photo && (
              <Pressable
                style={styles.iconBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(staff)/photos/edit",
                    params: { photoId: photo.id },
                  })
                }
              >
                <Ionicons name="pencil-outline" size={20} color="#fff" />
              </Pressable>
            )}
            {slideCanDelete && photo && (
              <Pressable style={styles.iconBtn} onPress={() => handleDelete(photo)}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </Pressable>
            )}
          </>
        );
      }}
      renderOverlay={(photo) =>
        photo &&
        (photo.caption ||
          photo.taken_on ||
          photo.tags.length > 0 ||
          photo.publication_labels.length > 0) ? (
          <View style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {photo.caption ? (
                <Text style={styles.caption}>{photo.caption}</Text>
              ) : null}

              {photo.taken_on ? (
                <Text style={styles.date}>
                  {new Date(photo.taken_on + "T00:00:00").toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              ) : null}

              {photo.tags.length > 0 && (
                <View style={styles.chips}>
                  {photo.tags.map((tag) => (
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

              {photo.publication_labels.length > 0 && (
                <View style={[styles.chips, { marginTop: 6 }]}>
                  {photo.publication_labels.map((lbl) => (
                    <View key={lbl} style={styles.labelChip}>
                      <Text style={styles.labelText}>{LABEL_DISPLAY[lbl] ?? lbl}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
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
