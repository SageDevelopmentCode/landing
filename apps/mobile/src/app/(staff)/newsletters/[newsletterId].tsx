// Staff newsletter editor — Garden, in four clear steps:
//   ① Details (title, week, view mode) → ② Sections (write + photos, show/hide)
//   → ③ Preview → ④ Publish (saves unsaved edits first, then confirms).
// State is shared with the section editor and preview through
// NewsletterEditorProvider. A failed load shows Retry (never an empty form
// you could save over); unsaved edits ask before you leave.
import {
  Confetti,
  Display,
  Garden,
  GardenButton,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenHintBox,
  GardenIconButton,
  GardenRadii,
  GardenSegmented,
  GardenSkeleton,
  GardenStepCard,
  GardenTints,
  HandNote,
  Pill,
  PressableScale,
  SeedProgress,
  haptic,
  useDiscardGuard,
  useToast,
  type ConfettiHandle,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { useNewsletterActions } from "@/features/newsletters/garden/useNewsletterActions";
import { ChangeLogSheet, GUTTER, SectionRowIcon } from "@/features/staff-newsletters/garden/NewslettersStaffParts";
import { useNewsletterEditor, type ViewMode } from "@/features/staff-newsletters/NewsletterEditorProvider";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewsletterEditorScreen() {
  const { newsletterId } = useLocalSearchParams<{ newsletterId: string }>();
  const e = useNewsletterEditor();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { open: openAsParent } = useNewsletterActions();
  const changeLogRef = useRef<BottomSheetModal>(null);
  const confettiRef = useRef<ConfettiHandle>(null);
  const saveRef = useRef<(() => Promise<void>) | null>(null);
  const publishRef = useRef<(() => Promise<void>) | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (newsletterId) e.open(newsletterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per id
  }, [newsletterId]);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const guard = useDiscardGuard(e.dirty, {
    message: "Your newsletter edits haven't been saved.",
    fallbackHref: "/(staff)/newsletters",
  });

  const ready = e.loadState === "ready" && e.id === newsletterId && !!e.draft;
  const d = e.draft;
  const ro = e.isPublished;

  const save = useCallback(async () => {
    haptic.press();
    const r = await e.save();
    if (r.ok) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1400);
      toast.show({ tone: "success", title: "Draft saved", duration: 1800, silent: true });
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't save the draft",
        message: r.error ?? "Failed to save draft",
        action: { label: "Retry", onPress: () => void saveRef.current?.() },
      });
    }
  }, [e, toast]);

  const runPublish = useCallback(async () => {
    const r = await e.publish();
    if (r.ok) {
      confettiRef.current?.fire();
      toast.show({
        tone: "success",
        title: "Newsletter published 🎉",
        message: r.savedFirst ? "Your latest edits were saved and it's live for parents." : "It's live for parents.",
      });
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't publish",
        message: r.error ?? "Failed to publish",
        action: { label: "Retry", onPress: () => void publishRef.current?.() },
      });
    }
  }, [e, toast]);

  useEffect(() => {
    saveRef.current = save;
    publishRef.current = runPublish;
  }, [save, runPublish]);

  const confirmPublish = () => {
    if (!d) return;
    if (!d.title.trim()) {
      haptic.error();
      toast.show({ tone: "error", title: "Add a title first", message: "Parents see the title at the top of the newsletter." });
      return;
    }
    haptic.warning();
    Alert.alert(
      "Publish Newsletter",
      `Publish "${d.title}" to all parents?${e.dirty ? "\n\nYour unsaved changes will be saved first." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Publish", onPress: () => void runPublish() },
      ],
    );
  };

  const confirmDelete = () => {
    if (!d) return;
    haptic.warning();
    Alert.alert("Delete Newsletter", `Delete "${d.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const r = await e.remove();
          if (r.ok) {
            toast.show({ tone: "success", title: "Newsletter deleted" });
            guard.leave();
          } else {
            toast.show({ tone: "error", title: "Couldn't delete", message: r.error ?? "Failed to delete" });
          }
        },
      },
    ]);
  };

  const openSection = (sectionId: string) =>
    router.push({ pathname: "/(staff)/newsletters/section" as never, params: { newsletterId, sectionId } });

  const visibleCount = d?.sections.filter((s) => s.visible).length ?? 0;
  const filledCount =
    d?.sections.filter((s) => s.visible && (s.is_class_updates ? !!d.myUpdate.trim() : !!s.body.trim() || s.images.length > 0))
      .length ?? 0;
  const step1 = !!d?.title.trim() && !!d?.weekRange.trim();
  const step2 = visibleCount > 0 && filledCount === visibleCount;

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <View style={st.nav}>
        <GardenIconButton icon="chevron-back" label="Back" onPress={guard.back} disabled={e.saving || e.publishing} />
        <View style={{ flex: 1 }}>
          <Display size={22} numberOfLines={1}>
            {d?.title || "Newsletter"}
          </Display>
          {ready ? (
            <HandNote size={14} color={ro ? Garden.sageDeep : e.dirty ? Garden.coralDeep : Garden.muted}>
              {ro ? "published ✓" : e.dirty ? "unsaved changes" : "all changes saved"}
            </HandNote>
          ) : null}
        </View>
        {ready ? (
          <>
            <GardenIconButton icon="time-outline" label="Change Log" onPress={() => changeLogRef.current?.present()} />
            <GardenIconButton
              icon="eye-outline"
              label="Preview"
              onPress={() => router.push({ pathname: "/(staff)/newsletters/preview" as never, params: { newsletterId } })}
            />
          </>
        ) : null}
      </View>

      {!ready ? (
        e.loadState === "error" ? (
          <View style={{ paddingHorizontal: GUTTER }}>
            <GardenErrorCard title="We couldn't load this newsletter" onRetry={() => void e.reload()} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: GUTTER, gap: 14 }} accessibilityLabel="Loading newsletter">
            <GardenSkeleton width="100%" height={190} radius={24} />
            <GardenSkeleton width="100%" height={260} radius={24} />
          </View>
        )
      ) : d ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 14 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {ro ? (
              <View style={st.published}>
                <Ionicons name="checkmark-circle" size={22} color={Garden.sageDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={st.publishedTitle}>Published</Text>
                  <Text style={st.publishedSub}>Parents can read this now. Published newsletters are read-only here.</Text>
                </View>
              </View>
            ) : (
              <View style={st.progressRow}>
                <SeedProgress done={0} total={2} doneFlags={[step1, step2]} />
                <HandNote size={15} color={Garden.muted}>
                  {`${filledCount} of ${visibleCount} sections written`}
                </HandNote>
              </View>
            )}

            {/* ① Details */}
            <GardenStepCard n={1} title="Details" state={step1 ? "done" : "active"}>
              <Label>Title</Label>
              <GardenField
                value={d.title}
                onChangeText={(t) => e.patch({ title: t })}
                placeholder="Week of May 26"
                editable={!ro}
                accessibilityLabel="Title"
              />
              <Label>Week Range</Label>
              <GardenField
                value={d.weekRange}
                onChangeText={(t) => e.patch({ weekRange: t })}
                placeholder="May 26 – May 30"
                editable={!ro}
                accessibilityLabel="Week Range"
              />
              <Label>View Mode</Label>
              {ro ? (
                <Pill tint="sky">{d.viewMode === "traditional" ? "Traditional" : "Slideshow"}</Pill>
              ) : (
                <GardenSegmented<ViewMode>
                  accessibilityLabel="View Mode"
                  value={d.viewMode}
                  onChange={(m) => e.patch({ viewMode: m })}
                  options={[
                    { value: "traditional", label: "Traditional" },
                    { value: "slideshow", label: "Slideshow" },
                  ]}
                />
              )}
            </GardenStepCard>

            {/* ② Sections */}
            <GardenStepCard
              n={2}
              title="Sections"
              note={ro ? "tap to read" : "tap to write · eye shows or hides it"}
              state={step2 ? "done" : "active"}
            >
              <View style={st.sectionList}>
                {d.sections.map((sec, i) => {
                  const written = sec.is_class_updates ? !!d.myUpdate.trim() : !!sec.body.trim() || sec.images.length > 0;
                  const edited = e.editedSections.has(sec.id);
                  return (
                    <View key={sec.id} style={[st.sectionRow, i === d.sections.length - 1 && { borderBottomWidth: 0 }]}>
                      <Pressable
                        disabled={ro}
                        onPress={() => {
                          haptic.select();
                          e.toggleVisible(sec.id);
                        }}
                        hitSlop={6}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: sec.visible, disabled: ro }}
                        accessibilityLabel={`Show ${sec.label} to parents`}
                        style={st.eye}
                      >
                        <SectionRowIcon visible={sec.visible} />
                      </Pressable>
                      <PressableScale
                        pressedScale={0.98}
                        onPress={() => openSection(sec.id)}
                        accessibilityLabel={`${sec.label}${sec.visible ? "" : ", hidden"}${written ? ", written" : ", empty"}${edited ? ", unsaved changes" : ""}`}
                        accessibilityHint={ro ? "Opens the section" : "Opens the section editor"}
                        style={st.sectionMain}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[st.sectionLabel, !sec.visible && { color: Garden.muted }]} numberOfLines={1}>
                            {sec.label}
                          </Text>
                          <Text style={st.sectionMeta} numberOfLines={1}>
                            {!sec.visible
                              ? "Hidden from parents"
                              : sec.is_class_updates
                                ? d.myUpdate.trim()
                                  ? "Your update is written ✓"
                                  : "Add your class update"
                                : written
                                  ? `${sec.body.trim() ? "Written" : "Photos only"}${sec.images.length ? ` · ${sec.images.length} photo${sec.images.length === 1 ? "" : "s"}` : ""}`
                                  : "Empty"}
                          </Text>
                        </View>
                        {edited ? <View style={st.editedDot} accessibilityElementsHidden /> : null}
                        <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            </GardenStepCard>

            {/* ③ Preview */}
            <GardenStepCard n={3} title="Preview" note="see it the way parents will">
              <GardenButton
                label="Preview"
                tone="outline"
                icon="eye-outline"
                fullWidth
                onPress={() => router.push({ pathname: "/(staff)/newsletters/preview" as never, params: { newsletterId } })}
              />
              {ro ? (
                <GardenButton
                  label="View as parent"
                  tone="sage"
                  icon="open-outline"
                  fullWidth
                  onPress={() =>
                    void openAsParent({
                      id: e.server!.id,
                      title: d.title,
                      week_range: d.weekRange,
                      cover_image_path: null,
                      cover_image_url: null,
                      access_password: null,
                      published_at: e.server!.published_at,
                    })
                  }
                />
              ) : null}
            </GardenStepCard>

            {/* ④ Publish */}
            {!ro ? (
              <GardenStepCard
                n={4}
                title="Publish"
                state={step1 ? "active" : "locked"}
                lockedHint="Add a title and week range in step 1 first."
              >
                {!step2 ? (
                  <GardenHintBox icon="information-circle-outline">
                    {`${visibleCount - filledCount} visible section${visibleCount - filledCount === 1 ? " is" : "s are"} still empty. Write ${visibleCount - filledCount === 1 ? "it" : "them"}, hide ${visibleCount - filledCount === 1 ? "it" : "them"} with the eye, or publish as is.`}
                  </GardenHintBox>
                ) : null}
                <GardenButton
                  label="Publish Newsletter"
                  loading={e.publishing}
                  loadingLabel={e.saving ? "Saving…" : "Publishing…"}
                  tone="coral"
                  icon="send-outline"
                  fullWidth
                  onPress={confirmPublish}
                />
                <GardenButton label="Delete Newsletter" tone="outline" icon="trash-outline" fullWidth onPress={confirmDelete} />
              </GardenStepCard>
            ) : null}
          </ScrollView>

          {!ro ? (
            <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <GardenButton
                label={e.dirty ? "Save draft" : "All changes saved"}
                icon={e.dirty ? "save-outline" : "checkmark"}
                loading={e.saving && !e.publishing}
                loadingLabel="Saving…"
                success={justSaved}
                successLabel="Saved"
                tone="sage"
                fullWidth
                disabled={!e.dirty || e.publishing}
                onPress={() => void save()}
              />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      ) : null}

      <ChangeLogSheet ref={changeLogRef} entries={e.server?.change_log ?? []} />
      <Confetti ref={confettiRef} />
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text style={st.label} maxFontSizeMultiplier={1.3}>
      {children}
    </Text>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: GUTTER, paddingVertical: 10 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
    marginBottom: -6,
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  published: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: GardenRadii.md,
    backgroundColor: GardenTints.sage.bg,
  },
  publishedTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.sageDeep },
  publishedSub: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft },
  sectionList: { borderRadius: GardenRadii.sm, borderWidth: 1, borderColor: Garden.line, overflow: "hidden" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Garden.line,
    backgroundColor: Garden.white,
  },
  eye: { width: 48, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  sectionMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingRight: 12 },
  sectionLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  sectionMeta: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.muted, marginTop: 1 },
  editedDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Garden.coralDeep },
  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
