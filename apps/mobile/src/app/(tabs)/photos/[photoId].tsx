import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoSwipeGallery } from "@/components/photos/PhotoSwipeGallery";
import { TeacherPhoto } from "@/lib/photos-actions";
import { getPhotoGallerySession } from "@/lib/photo-gallery-session";
import { floatingTabBarStyle, FontFamilies } from "@/constants/theme";
import { saveImageToLibrary } from "@/utils/saveMedia";

function buildStubPhoto(
  photoId: string,
  storagePath: string | undefined,
  signedUrl: string | undefined
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
  signedUrl: string | undefined
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

  const photos = initialPhotosFromSessionOrStub(photoId, passedPath, passedUrl);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  return (
    <PhotoSwipeGallery
      photos={photos}
      initialPhotoId={photoId}
      passedUrl={passedUrl}
      renderTopBarRight={(photo, url) =>
        photo && url ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => saveImageToLibrary(url)}
            hitSlop={12}
          >
            <Ionicons name="download-outline" size={22} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )
      }
      renderOverlay={(photo) =>
        photo && (photo.caption || photo.taken_on) ? (
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
});
