// Parent photo viewer — swipe gallery (shared with staff) with Garden chrome:
// a position pill, a 44pt save button with loading + error/Retry feedback,
// and the caption/date on a soft gradient.
import { Garden, GardenFonts, GardenRadii, useToast } from "@/components/garden";
import { PhotoSwipeGallery } from "@/components/photos/PhotoSwipeGallery";
import { floatingTabBarStyle } from "@/constants/theme";
import { getPhotoGallerySession } from "@/lib/photo-gallery-session";
import type { TeacherPhoto } from "@/lib/photos-actions";
import { saveImageToLibrary } from "@/utils/saveMedia";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function buildStubPhoto(
  photoId: string,
  storagePath: string | undefined,
  signedUrl: string | undefined,
): TeacherPhoto[] {
  if (!storagePath) return [];
  return [
    {
      id: photoId,
      teacher_id: "",
      storage_path: storagePath,
      signed_url: signedUrl && signedUrl.length > 0 ? signedUrl : null,
      caption: null,
      taken_on: null,
      created_at: new Date().toISOString(),
      tags: [],
      publication_labels: [],
    },
  ];
}

function initialPhotosFromSessionOrStub(
  photoId: string,
  storagePath: string | undefined,
  signedUrl: string | undefined,
): TeacherPhoto[] {
  const session = getPhotoGallerySession();
  if (session.length > 0) return session;
  return buildStubPhoto(photoId, storagePath, signedUrl);
}

export default function ParentPhotoDetailScreen() {
  const {
    photoId,
    signedUrl: passedUrl,
    storagePath: passedPath,
  } = useLocalSearchParams<{
    photoId: string;
    signedUrl?: string;
    storagePath?: string;
  }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();

  const [photos] = useState(() => initialPhotosFromSessionOrStub(photoId, passedPath, passedUrl));
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveRef = useRef<((uri: string) => Promise<void>) | null>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation]),
  );

  const onIndexChange = useCallback((i: number) => setIndex(i), []);

  const save = useCallback(
    async (uri: string) => {
      setSaving(true);
      try {
        await saveImageToLibrary(uri, { throwOnError: true });
      } catch {
        toast.show({
          tone: "error",
          title: "Error",
          message: "Could not save the photo. Please try again.",
          action: { label: "Retry", onPress: () => void saveRef.current?.(uri) },
        });
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  return (
    <PhotoSwipeGallery
      photos={photos}
      initialPhotoId={photoId}
      passedUrl={passedUrl}
      onIndexChange={onIndexChange}
      renderTopBarRight={(photo, url) => (
        <>
          {photos.length > 1 ? (
            <View style={styles.counter} accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}>
              <Text style={styles.counterText} maxFontSizeMultiplier={1.2}>
                {`${index + 1} of ${photos.length}`}
              </Text>
            </View>
          ) : null}
          {photo && url ? (
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              onPress={() => void save(url)}
              disabled={saving}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={saving ? "Saving photo" : "Save photo"}
              accessibilityState={{ busy: saving, disabled: saving }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Garden.white} />
              ) : (
                <Ionicons name="download-outline" size={22} color={Garden.white} />
              )}
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </>
      )}
      renderOverlay={(photo) =>
        photo && (photo.caption || photo.taken_on) ? (
          <LinearGradient
            pointerEvents="box-none"
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]}
            style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}
          >
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {photo.caption ? (
                <Text style={styles.caption} maxFontSizeMultiplier={1.4}>
                  {photo.caption}
                </Text>
              ) : null}
              {photo.taken_on ? (
                <View style={styles.datePill}>
                  <Ionicons name="calendar-outline" size={12} color={Garden.ink} />
                  <Text style={styles.date} maxFontSizeMultiplier={1.3}>
                    {new Date(photo.taken_on + "T00:00:00").toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </LinearGradient>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: GardenRadii.pill,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.white },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingHorizontal: 18,
    maxHeight: "45%",
  },
  caption: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    color: Garden.white,
    marginBottom: 10,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: Garden.butter,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  date: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.ink },
});
