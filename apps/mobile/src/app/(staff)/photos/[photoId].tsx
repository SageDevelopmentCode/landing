// Staff photo viewer — Garden chrome on the shared swipe gallery: a position
// pill, save (spinner + Retry), Edit for the uploader, Delete for the uploader
// or a super admin, and a details panel (caption, date, tagged students with
// their consent, publication labels) that tucks away with one tap.
import { Garden, GardenFonts, GardenRadii, Pill, haptic, useToast } from "@/components/garden";
import { ConsentPill } from "@/components/photos/StudentTagSelector";
import { PhotoSwipeGallery } from "@/components/photos/PhotoSwipeGallery";
import { floatingTabBarStyle } from "@/constants/theme";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { PUB_LABELS } from "@/features/staff-photos/garden/PhotoDetailsForm";
import { photoName } from "@/features/staff-photos/garden/useStaffPhotosFeedback";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { notifyError } from "@/lib/discord";
import { getPhotoGallerySession, updatePhotoGallerySession } from "@/lib/photo-gallery-session";
import { deletePhoto, getAllSchoolPhotos, type TeacherPhoto } from "@/lib/photos-actions";
import { saveImageToLibrary } from "@/utils/saveMedia";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function initialPhotos(photoId: string, storagePath?: string, signedUrl?: string): TeacherPhoto[] {
  const session = getPhotoGallerySession();
  if (session.length > 0) return session;
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

export default function StaffPhotoDetailScreen() {
  const { photoId, signedUrl: passedUrl, storagePath: passedPath } = useLocalSearchParams<{
    photoId: string;
    signedUrl?: string;
    storagePath?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();
  const role = useStaffRole();
  const { markGalleryDirty } = useUploadQueue();

  const [photos, setPhotos] = useState<TeacherPhoto[]>(() => initialPhotos(photoId, passedPath, passedUrl));
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const saveRef = useRef<((uri: string) => Promise<void>) | null>(null);
  const deleteRef = useRef<((p: TeacherPhoto) => Promise<void>) | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(staff)/photos" as never);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      // Coming back from Edit: pick up the saved caption / tags / labels.
      const session = getPhotoGallerySession();
      if (session.length > 0) setPhotos(session);
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  // Deep link with no gallery session: fetch this one photo's details.
  useEffect(() => {
    if (getPhotoGallerySession().length > 0) return;
    let cancelled = false;
    getAllSchoolPhotos()
      .then((all) => {
        if (cancelled) return;
        const found = all.find((p) => p.id === photoId);
        if (found) {
          setPhotos([found]);
          updatePhotoGallerySession([found]);
        }
      })
      .catch((e) => notifyError("staff-photo-detail-load", e));
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  const save = useCallback(
    async (uri: string) => {
      setSaving(true);
      try {
        await saveImageToLibrary(uri, { throwOnError: true });
        toast.show({ tone: "success", title: "Saved to Photos", duration: 1800 });
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

  const runDelete = useCallback(
    async (photo: TeacherPhoto) => {
      setDeleting(true);
      try {
        await deletePhoto(photo.id, photo.storage_path);
        markGalleryDirty();
        const next = photos.filter((p) => p.id !== photo.id);
        updatePhotoGallerySession(getPhotoGallerySession().filter((p) => p.id !== photo.id));
        toast.show({ tone: "success", title: "Photo deleted", message: `${photoName(photo)} was removed.` });
        if (next.length === 0) {
          goBack();
          return;
        }
        setPhotos(next);
        setIndex((i) => Math.min(i, next.length - 1));
      } catch (e) {
        notifyError("staff-photo-delete", e);
        toast.show({
          tone: "error",
          title: "Delete failed",
          message: e instanceof Error ? e.message : "Could not delete photo.",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(photo) },
        });
      } finally {
        setDeleting(false);
      }
    },
    [photos, markGalleryDirty, toast, goBack],
  );

  useEffect(() => {
    saveRef.current = save;
    deleteRef.current = runDelete;
  }, [save, runDelete]);

  const confirmDelete = (photo: TeacherPhoto) => {
    haptic.warning();
    Alert.alert("Delete Photo", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void runDelete(photo) },
    ]);
  };

  return (
    <PhotoSwipeGallery
      photos={photos}
      initialPhotoId={photoId}
      passedUrl={passedUrl}
      onIndexChange={(i) => setIndex(i)}
      renderTopBarRight={(photo, url) => {
        const isOwner = !!photo && role.isOwner(photo.teacher_id);
        const canDelete = !!photo && (isOwner || role.isSuperAdmin);
        return (
          <>
            {photos.length > 1 ? (
              <View style={st.counter} accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}>
                <Text style={st.counterText} maxFontSizeMultiplier={1.2}>
                  {`${index + 1} of ${photos.length}`}
                </Text>
              </View>
            ) : null}
            {url ? (
              <IconBtn
                icon="download-outline"
                label={saving ? "Saving photo" : "Save photo"}
                busy={saving}
                onPress={() => void save(url)}
              />
            ) : null}
            {isOwner && photo ? (
              <IconBtn
                icon="pencil-outline"
                label="Edit photo details"
                onPress={() =>
                  router.push({ pathname: "/(staff)/photos/edit" as never, params: { photoId: photo.id } })
                }
              />
            ) : null}
            {canDelete && photo ? (
              <IconBtn icon="trash-outline" label="Delete photo" busy={deleting} onPress={() => confirmDelete(photo)} />
            ) : null}
          </>
        );
      }}
      renderOverlay={(photo) => {
        if (!photo) return null;
        const hasDetails =
          !!photo.caption || !!photo.taken_on || photo.tags.length > 0 || photo.publication_labels.length > 0;
        if (!hasDetails) return null;
        return (
          <LinearGradient
            pointerEvents="box-none"
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]}
            style={[st.overlay, { paddingBottom: insets.bottom + 16 }]}
          >
            <Pressable
              onPress={() => {
                haptic.select();
                setDetailsOpen((o) => !o);
              }}
              accessibilityRole="button"
              accessibilityLabel={detailsOpen ? "Hide photo details" : "Show photo details"}
              hitSlop={8}
              style={st.toggle}
            >
              <Ionicons name={detailsOpen ? "chevron-down" : "information-circle-outline"} size={16} color={Garden.white} />
              <Text style={st.toggleText}>{detailsOpen ? "Hide details" : "Details"}</Text>
            </Pressable>
            {detailsOpen ? (
              <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
                {photo.caption ? (
                  <Text style={st.caption} maxFontSizeMultiplier={1.4}>
                    {photo.caption}
                  </Text>
                ) : null}
                {photo.taken_on ? (
                  <View style={st.datePill}>
                    <Ionicons name="calendar-outline" size={12} color={Garden.ink} />
                    <Text style={st.date} maxFontSizeMultiplier={1.3}>
                      {new Date(photo.taken_on + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                ) : null}
                {photo.tags.length > 0 ? (
                  <View style={st.chips}>
                    {photo.tags.map((tag) => (
                      <View key={tag.student_id} style={st.tagChip}>
                        <Text style={st.tagText} maxFontSizeMultiplier={1.3}>
                          {tag.name ?? "Unknown"}
                        </Text>
                        <ConsentPill level={tag.consent_level} />
                      </View>
                    ))}
                  </View>
                ) : null}
                {photo.publication_labels.length > 0 ? (
                  <View style={[st.chips, { marginTop: 8 }]}>
                    {photo.publication_labels.map((lbl) => (
                      <Pill key={lbl} tint="sky">
                        {PUB_LABELS.find((l) => l.key === lbl)?.label ?? lbl}
                      </Pill>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </LinearGradient>
        );
      }}
    />
  );
}

function IconBtn({
  icon,
  label,
  onPress,
  busy,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [st.iconBtn, pressed && { opacity: 0.7 }]}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      disabled={busy}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: !!busy, disabled: !!busy }}
    >
      {busy ? <ActivityIndicator size="small" color={Garden.white} /> : <Ionicons name={icon} size={21} color={Garden.white} />}
    </Pressable>
  );
}

const st = StyleSheet.create({
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
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingTop: 40, paddingHorizontal: 18 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: GardenRadii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 10,
  },
  toggleText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.white },
  caption: { fontFamily: GardenFonts.bodySemi, fontSize: 16, lineHeight: 22, color: Garden.white, marginBottom: 10 },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: Garden.butter,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  date: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 4,
    minHeight: 30,
    borderRadius: GardenRadii.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  tagText: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.ink, paddingVertical: 4 },
});
