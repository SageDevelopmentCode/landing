// Staff photo upload — Garden. Two clear steps: ① Pick photos → ② Add details
// (caption, date, labels, tagged students with a consent check) → Upload.
// The upload itself runs in the background queue (UploadQueueContext), so the
// teacher lands back on the gallery and watches the progress banner there.
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenHintBox,
  GardenIconButton,
  GardenRadii,
  GardenStepCard,
  HandNote,
  PressableScale,
  SeedProgress,
  haptic,
  localDateKey,
  useDiscardGuard,
  useToast,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { confirmConsent, consentIssues, PhotoDetailsForm } from "@/features/staff-photos/garden/PhotoDetailsForm";
import { useConsentStudents } from "@/features/staff-photos/useConsentStudents";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import type { PublicationLabel } from "@/lib/photos-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const GUTTER = 18;
const MAX_PER_PICK = 20;

export default function PhotoUploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const { userId } = useStaffRole();
  const { enqueueUpload, batch } = useUploadQueue();

  const [step, setStep] = useState<1 | 2>(1);
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState(() => localDateKey());
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [labels, setLabels] = useState<PublicationLabel[]>([]);
  const [starting, setStarting] = useState(false);
  const s = useConsentStudents(step === 2);

  const busy = !!batch && !batch.finished;
  const dirty = images.length > 0 || caption.trim().length > 0 || selected.length > 0 || labels.length > 0;
  const guard = useDiscardGuard(dirty, {
    title: "Discard changes?",
    message: "Your selections will be lost.",
    fallbackHref: "/(staff)/photos",
  });

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.show({
        tone: "error",
        title: "Permission required",
        message: "Please allow access to your photo library.",
        action: { label: "Settings", onPress: () => void Linking.openSettings() },
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PER_PICK,
    });
    if (result.canceled) return;
    let added = 0;
    setImages((prev) => {
      const seen = new Set(prev);
      const next = [...prev];
      for (const a of result.assets) {
        if (seen.has(a.uri)) continue;
        seen.add(a.uri);
        next.push(a.uri);
        added++;
      }
      return next;
    });
    if (added) haptic.success();
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function handleUpload() {
    if (images.length === 0 || starting) return;
    if (busy) {
      toast.show({
        tone: "info",
        title: "One upload at a time",
        message: "Your last batch is still uploading. Try again when it finishes.",
      });
      return;
    }
    if (!userId) {
      toast.show({ tone: "error", title: "You're signed out", message: "Sign in again, then try uploading." });
      return;
    }
    setStarting(true);
    const ok = await confirmConsent(consentIssues(s.students, selected, labels), "Upload anyway");
    if (!ok) {
      setStarting(false);
      return;
    }
    const started = enqueueUpload(
      images,
      {
        caption: caption.trim() || null,
        taken_on: takenOn.trim() || null,
        taggedStudentIds: selected,
        publication_labels: labels,
      },
      userId,
    );
    setStarting(false);
    if (!started) {
      toast.show({ tone: "info", title: "One upload at a time", message: "Try again when the current upload finishes." });
      return;
    }
    haptic.success();
    toast.show({
      tone: "loading",
      title: `Uploading ${images.length} ${images.length === 1 ? "photo" : "photos"}…`,
      message: "Watch the progress at the top of the gallery.",
      duration: 2600,
      silent: true,
    });
    guard.leave(() => (router.canGoBack() ? router.back() : router.replace("/(staff)/photos" as never)));
  }

  const thumb = Math.floor((width - GUTTER * 2 - 32 - 16) / 3);
  const n = images.length;

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <View style={st.nav}>
        <GardenIconButton
          icon={step === 2 ? "arrow-back" : "close"}
          label={step === 2 ? "Back to picking photos" : "Cancel upload"}
          onPress={() => (step === 2 ? setStep(1) : guard.back())}
        />
        <View style={{ flex: 1 }}>
          <Display size={24}>{step === 1 ? "Upload Photos" : "Add Details"}</Display>
          <HandNote size={15} color={Garden.muted}>{`step ${step} of 2`}</HandNote>
        </View>
        <SeedProgress done={step === 2 ? 1 : 0} total={2} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            <GardenStepCard
              n={1}
              title="Pick photos"
              note={n ? `${n} ${n === 1 ? "photo" : "photos"} ready` : "choose from your library"}
              state="active"
            >
              {n > 0 ? (
                <View style={st.grid}>
                  {images.map((uri, i) => (
                    <Animated.View
                      key={uri}
                      entering={reduce ? undefined : FadeIn.duration(160)}
                      exiting={reduce ? undefined : FadeOut.duration(120)}
                      layout={reduce ? undefined : LinearTransition}
                      style={[st.thumb, { width: thumb, height: thumb }]}
                    >
                      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <PressableScale
                        haptics="tap"
                        onPress={() => setImages((prev) => prev.filter((u) => u !== uri))}
                        accessibilityLabel={`Remove photo ${i + 1}`}
                        hitSlop={8}
                        style={st.remove}
                      >
                        <Ionicons name="close" size={14} color={Garden.white} />
                      </PressableScale>
                    </Animated.View>
                  ))}
                </View>
              ) : null}
              <PressableScale onPress={() => void pickImages()} accessibilityLabel={n ? "Add More" : "Select Photos"} style={st.pick}>
                <Ionicons name="images-outline" size={24} color={Garden.sageDeep} />
                <Text style={st.pickText} maxFontSizeMultiplier={1.3}>
                  {n === 0 ? "Select Photos" : "Add More"}
                </Text>
              </PressableScale>
              {busy ? (
                <GardenHintBox icon="time-outline">
                  Another batch is still uploading. You can get these ready now and upload when it's done.
                </GardenHintBox>
              ) : null}
            </GardenStepCard>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {images.map((uri) => (
                  <Image key={uri} source={{ uri }} style={st.strip} contentFit="cover" />
                ))}
              </ScrollView>
              <GardenStepCard n={2} title="Add details" note="these apply to every photo in this batch">
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
              </GardenStepCard>
            </>
          )}
        </ScrollView>

        <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {step === 1 ? (
            <GardenButton
              label={n ? `Continue (${n} ${n === 1 ? "photo" : "photos"})` : "Continue"}
              tone="ink"
              iconRight="arrow-forward"
              fullWidth
              disabled={n === 0}
              onPress={() => {
                haptic.press();
                setStep(2);
              }}
              accessibilityHint={n ? undefined : "Select photos first"}
            />
          ) : (
            <GardenButton
              label={`Upload ${n} ${n === 1 ? "Photo" : "Photos"}`}
              loading={starting}
              loadingLabel="Starting…"
              tone="coral"
              icon="cloud-upload-outline"
              fullWidth
              onPress={() => void handleUpload()}
            />
          )}
          {step === 1 && n === 0 ? (
            <HandNote size={15} color={Garden.muted} style={{ textAlign: "center", marginTop: 6 }}>
              pick at least one photo to continue
            </HandNote>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: { borderRadius: GardenRadii.sm, overflow: "hidden", backgroundColor: "#f1e7d8" },
  remove: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(43,42,38,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  pick: {
    minHeight: 76,
    borderRadius: GardenRadii.sm + 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.sage,
    backgroundColor: "#f4f9f5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pickText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.sageDeep },
  strip: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#f1e7d8" },
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
