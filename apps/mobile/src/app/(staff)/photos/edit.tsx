// Staff "Edit Photo" — Garden. Same details form as Upload; Save stays
// disabled until the photo has loaded, a failed load shows Retry (never an
// empty form you could save over), unsaved edits ask before closing, and the
// viewer/gallery pick up the change when you go back.
import {
  Display,
  Garden,
  GardenButton,
  GardenErrorCard,
  GardenIconButton,
  GardenSkeleton,
  haptic,
  useDiscardGuard,
  useToast,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { confirmConsent, consentIssues, PhotoDetailsForm } from "@/features/staff-photos/garden/PhotoDetailsForm";
import { useConsentStudents } from "@/features/staff-photos/useConsentStudents";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { notifyError } from "@/lib/discord";
import { getPhotoGallerySession, updatePhotoGallerySession } from "@/lib/photo-gallery-session";
import {
  deletePhoto,
  editPhoto,
  getAllSchoolPhotos,
  type PublicationLabel,
  type TeacherPhoto,
} from "@/lib/photos-actions";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const GUTTER = 18;

type Draft = { caption: string; takenOn: string; selected: string[]; labels: PublicationLabel[] };

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export default function EditPhotoScreen() {
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { userId } = useStaffRole();
  const { markGalleryDirty } = useUploadQueue();

  const [photo, setPhoto] = useState<TeacherPhoto | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "forbidden">("loading");
  const [retrying, setRetrying] = useState(false);
  const [original, setOriginal] = useState<Draft | null>(null);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [labels, setLabels] = useState<PublicationLabel[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);
  const s = useConsentStudents(loadState === "ready");

  const dirty = useMemo(
    () =>
      !!original &&
      (caption !== original.caption ||
        takenOn !== original.takenOn ||
        !sameSet(selected, original.selected) ||
        !sameSet(labels, original.labels)),
    [original, caption, takenOn, selected, labels],
  );
  const guard = useDiscardGuard(dirty, {
    title: "Discard changes?",
    message: "Your edits will be lost.",
    fallbackHref: "/(staff)/photos",
  });
  const leave = () => guard.leave(() => (router.canGoBack() ? router.back() : router.replace("/(staff)/photos" as never)));

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const load = useCallback(async () => {
    try {
      const fromSession = getPhotoGallerySession().find((p) => p.id === photoId);
      const found = fromSession ?? (await getAllSchoolPhotos()).find((p) => p.id === photoId);
      if (!found) {
        setLoadState("error");
        return;
      }
      if (!userId || found.teacher_id !== userId) {
        setLoadState("forbidden");
        return;
      }
      const d: Draft = {
        caption: found.caption ?? "",
        takenOn: found.taken_on ?? "",
        selected: found.tags.map((t) => t.student_id),
        labels: found.publication_labels,
      };
      setPhoto(found);
      setOriginal(d);
      setCaption(d.caption);
      setTakenOn(d.takenOn);
      setSelected(d.selected);
      setLabels(d.labels);
      setLoadState("ready");
    } catch (e) {
      notifyError("staff-photo-edit-load", e);
      setLoadState("error");
    }
  }, [photoId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loadState !== "forbidden") return;
    Alert.alert("Cannot edit photo", "You can only edit photos you uploaded.", [{ text: "OK", onPress: leave }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show once per state change
  }, [loadState]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const handleSave = useCallback(async () => {
    if (!photo || saving || !dirty) return;
    const ok = await confirmConsent(consentIssues(s.students, selected, labels), "Save anyway");
    if (!ok) return;
    setSaving(true);
    haptic.press();
    try {
      const payload = {
        caption: caption.trim() || null,
        taken_on: takenOn.trim() || null,
        taggedStudentIds: selected,
        publication_labels: labels,
      };
      await editPhoto(photo.id, payload);
      markGalleryDirty();
      // Keep the open viewer in sync without a refetch.
      const tags = s.students
        .filter((st) => selected.includes(st.student_id))
        .map((st) => ({
          student_id: st.student_id,
          name: st.name,
          profile_image_url: st.profile_image_url,
          consent_level: st.consent_level,
        }));
      updatePhotoGallerySession(
        getPhotoGallerySession().map((p) =>
          p.id === photo.id
            ? { ...p, caption: payload.caption, taken_on: payload.taken_on, publication_labels: labels, tags }
            : p,
        ),
      );
      setSaved(true);
      toast.show({ tone: "success", title: "Changes saved", duration: 1800 });
      setTimeout(leave, 450);
    } catch (err) {
      notifyError("staff-photo-edit-save", err);
      toast.show({
        tone: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to save changes.",
        action: { label: "Retry", onPress: () => void saveRef.current?.() },
      });
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leave is stable enough for a one-shot
  }, [photo, saving, dirty, s.students, selected, labels, caption, takenOn, markGalleryDirty, toast]);

  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  function handleDelete() {
    if (!photo) return;
    haptic.warning();
    Alert.alert("Delete Photo", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deletePhoto(photo.id, photo.storage_path);
            markGalleryDirty();
            updatePhotoGallerySession(getPhotoGallerySession().filter((p) => p.id !== photo.id));
            toast.show({ tone: "success", title: "Photo deleted" });
            // Close Edit and the viewer behind it (the photo is gone).
            guard.leave(() => router.dismissTo("/(staff)/photos" as never));
          } catch (err) {
            notifyError("staff-photo-delete", err);
            setDeleting(false);
            toast.show({
              tone: "error",
              title: "Delete failed",
              message: err instanceof Error ? err.message : "Could not delete photo.",
            });
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <View style={st.nav}>
        <GardenIconButton icon="close" label="Close Edit Photo" onPress={guard.back} disabled={saving || deleting} />
        <Display size={24} style={{ flex: 1 }}>
          Edit Photo
        </Display>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {loadState === "loading" || loadState === "forbidden" ? (
            <View style={{ gap: 14 }} accessibilityLabel="Loading photo">
              <GardenSkeleton width="40%" height={12} />
              <GardenSkeleton width="100%" height={72} radius={14} />
              <GardenSkeleton width="40%" height={12} />
              <GardenSkeleton width="100%" height={48} radius={24} />
              <GardenSkeleton width="100%" height={200} radius={20} />
            </View>
          ) : loadState === "error" ? (
            <GardenErrorCard
              title="We couldn't load this photo"
              retrying={retrying}
              onRetry={async () => {
                setRetrying(true);
                setLoadState("loading");
                await load();
                setRetrying(false);
              }}
            />
          ) : (
            <PhotoDetailsForm
              caption={caption}
              onCaption={setCaption}
              takenOn={takenOn}
              onTakenOn={setTakenOn}
              labels={labels}
              onToggleLabel={(k) => setLabels((l) => toggle(l, k))}
              students={s.students}
              studentsLoading={s.loading}
              studentsError={s.error}
              onRetryStudents={() => void s.retry()}
              selected={selected}
              onToggleStudent={(id) => setSelected((l) => toggle(l, id))}
              search={search}
              onSearch={setSearch}
            />
          )}
        </ScrollView>

        {loadState === "ready" ? (
          <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <GardenButton
              label={dirty ? "Save" : "No changes yet"}
              loading={saving}
              loadingLabel="Saving…"
              success={saved}
              successLabel="Saved"
              tone="sage"
              icon="checkmark"
              fullWidth
              disabled={!dirty || deleting}
              onPress={() => void handleSave()}
            />
            <GardenButton
              label="Delete Photo"
              loading={deleting}
              loadingLabel="Deleting…"
              tone="outline"
              icon="trash-outline"
              fullWidth
              disabled={saving}
              onPress={handleDelete}
              style={{ marginTop: 10 }}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
