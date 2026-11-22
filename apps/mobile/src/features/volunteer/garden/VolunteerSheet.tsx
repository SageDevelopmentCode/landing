// "Express Interest" sheet: numbered sections with live seed progress, chunky
// checkbox chips, inline validation that scrolls to the first problem, and a
// coral submit with loading → thank-you → auto close.
import {
  Display,
  Garden,
  GardenButton,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenTints,
  HandNote,
  MIN_TAP,
  PressableScale,
  SeedProgress,
  gardenPopIn,
  gardenSheetChrome,
  haptic,
  useToast,
  useWriteGuard,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AVAILABILITY_OPTIONS,
  HELP_AREAS,
  MAX_TEXT,
  type VolunteerInterest,
} from "../useVolunteerInterest";

function CheckChip({
  label,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <PressableScale
      haptics="select"
      pressedScale={0.97}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      style={[st.chip, checked && st.chipChecked]}
    >
      <View style={[st.box, checked && st.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={15} color={Garden.white} /> : null}
      </View>
      <Text style={[st.chipText, checked && st.chipTextChecked]} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </PressableScale>
  );
}

function Section({
  n,
  title,
  optional,
  done,
  error,
  children,
  onLayoutY,
}: {
  n: number;
  title: string;
  optional?: boolean;
  done?: boolean;
  error?: string;
  children: ReactNode;
  onLayoutY?: (y: number) => void;
}) {
  return (
    <View style={st.section} onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}>
      <View style={st.sectionHead}>
        <View style={[st.bubble, done && st.bubbleDone, !!error && st.bubbleError]}>
          {done ? (
            <Ionicons name="checkmark" size={15} color={Garden.white} />
          ) : (
            <Text style={[st.bubbleText, !!error && { color: Garden.white }]}>{n}</Text>
          )}
        </View>
        <Text style={st.sectionTitle} accessibilityRole="header" maxFontSizeMultiplier={1.4}>
          {title}
          {optional ? <Text style={st.optional}> (optional)</Text> : <Text style={st.required}> *</Text>}
        </Text>
      </View>
      {children}
      {error ? (
        <Animated.View entering={FadeIn.duration(160)} style={st.fieldErrorRow} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={14} color={Garden.danger} />
          <Text style={st.fieldError}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function VolunteerSheet({
  sheetRef,
  v,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  v: VolunteerInterest;
}) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const reduce = useReducedMotion();
  const { blocked } = useWriteGuard();
  const [success, setSuccess] = useState(false);
  const scrollRef = useRef<any>(null);
  const sectionY = useRef<Record<string, number>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const doneCount = v.doneFlags.filter(Boolean).length;

  const handleSubmit = useCallback(async () => {
    if (blocked()) return;
    const r = await v.submit();
    if (r.ok) {
      haptic.success();
      setSuccess(true);
      toast.show({ tone: "success", title: "Thank you!", silent: true });
      closeTimer.current = setTimeout(() => {
        sheetRef.current?.dismiss();
      }, 2000);
      return;
    }
    if (r.invalid) {
      haptic.error();
      const first = (["skills", "helpAreas", "availability"] as const).find((k) => r.invalid?.[k]);
      const y = first ? sectionY.current[first] : undefined;
      if (y != null) scrollRef.current?.scrollTo?.({ y: Math.max(0, y - 12), animated: !reduce });
      return;
    }
    toast.show({
      tone: "error",
      title: "Couldn't send your interest",
      message: r.error ?? "Something went wrong. Please try again.",
      action: { label: "Retry", onPress: () => void submitRef.current?.() },
    });
  }, [blocked, v, toast, sheetRef, reduce]);

  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  // After a successful send the draft resets; a swipe-away keeps the draft.
  const onDismiss = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (success) {
      v.reset();
      setSuccess(false);
    }
  }, [success, v]);

  const renderFooter = (props: BottomSheetFooterProps) =>
    success ? null : (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <GardenButton
            label="Submit"
            loading={v.isSubmitting}
            loadingLabel="Submitting…"
            icon="heart"
            tone="coral"
            fullWidth
            onPress={() => void handleSubmit()}
          />
        </View>
      </BottomSheetFooter>
    );

  return (
    <BottomSheetModal
      ref={sheetRef}
      {...gardenSheetChrome}
      snapPoints={["92%"]}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={onDismiss}
      footerComponent={renderFooter}
    >
      {success ? (
        <BottomSheetView style={st.success}>
          <Animated.View entering={reduce ? undefined : gardenPopIn()} style={st.successIcon}>
            <Ionicons name="checkmark" size={44} color={Garden.white} />
          </Animated.View>
          <Display size={28} style={{ textAlign: "center" }}>
            Thank you!
          </Display>
          <Text style={st.successBody} maxFontSizeMultiplier={1.4}>
            We&apos;ll be in touch soon about volunteer opportunities.
          </Text>
        </BottomSheetView>
      ) : (
        <BottomSheetScrollView
          ref={scrollRef}
          contentContainerStyle={st.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={st.header}>
            <Display size={28} style={{ flex: 1 }}>
              Express Interest
            </Display>
          </View>
          <View style={st.progress}>
            <HandNote size={17}>{`${doneCount} of 3 done`}</HandNote>
            <SeedProgress done={doneCount} total={3} doneFlags={v.doneFlags} />
          </View>

          {v.submitError ? (
            <View style={st.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={16} color={Garden.danger} />
              <Text style={st.errorBannerText}>{v.submitError}</Text>
            </View>
          ) : null}

          <Section
            n={1}
            title="Skills & Experience"
            done={v.doneFlags[0]}
            error={v.errors.skills}
            onLayoutY={(y) => (sectionY.current.skills = y)}
          >
            <GardenField
              InputComponent={BottomSheetTextInput as never}
              boxed
              multiline
              value={v.skills}
              onChangeText={v.setSkills}
              placeholder="Describe any relevant skills or experience you have"
              editable={!v.isSubmitting}
              maxLength={MAX_TEXT}
              accessibilityLabel="Skills & Experience"
              containerStyle={[{ minHeight: 110 }, !!v.errors.skills && { borderColor: Garden.danger }]}
            />
            <Text style={st.counter}>{`${v.skills.length}/${MAX_TEXT}`}</Text>
          </Section>

          <Section
            n={2}
            title="How You'd Like to Help"
            done={v.doneFlags[1]}
            error={v.errors.helpAreas}
            onLayoutY={(y) => (sectionY.current.helpAreas = y)}
          >
            <View style={st.chips}>
              {HELP_AREAS.map((area) => (
                <CheckChip
                  key={area}
                  label={area}
                  checked={v.helpAreas.includes(area)}
                  onToggle={() => v.toggleHelpArea(area)}
                  disabled={v.isSubmitting}
                />
              ))}
            </View>
          </Section>

          <Section
            n={3}
            title="Time Availability"
            done={v.doneFlags[2]}
            error={v.errors.availability}
            onLayoutY={(y) => (sectionY.current.availability = y)}
          >
            <View style={st.chips}>
              {AVAILABILITY_OPTIONS.map((option) => (
                <CheckChip
                  key={option}
                  label={option}
                  checked={v.availability.includes(option)}
                  onToggle={() => v.toggleAvailability(option)}
                  disabled={v.isSubmitting}
                />
              ))}
            </View>
          </Section>

          <Section n={4} title="Additional Notes" optional done={v.notes.trim().length > 0}>
            <GardenField
              InputComponent={BottomSheetTextInput as never}
              boxed
              multiline
              value={v.notes}
              onChangeText={v.setNotes}
              placeholder="Anything else you'd like us to know?"
              editable={!v.isSubmitting}
              maxLength={MAX_TEXT}
              accessibilityLabel="Additional Notes (optional)"
              containerStyle={{ minHeight: 90 }}
            />
          </Section>
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 130, gap: 22 },
  header: { flexDirection: "row", alignItems: "center" },
  progress: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -10 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Garden.dangerTint,
    borderRadius: GardenRadii.sm,
    padding: 12,
  },
  errorBannerText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.danger },
  section: { gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleDone: { backgroundColor: Garden.sage, borderColor: Garden.sage },
  bubbleError: { backgroundColor: Garden.danger, borderColor: Garden.danger },
  bubbleText: { fontFamily: GardenFonts.display, fontSize: 14, color: Garden.ink },
  sectionTitle: { flex: 1, fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  required: { color: Garden.coralDeep },
  optional: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.muted },
  counter: { alignSelf: "flex-end", fontFamily: GardenFonts.bodySemi, fontSize: 11.5, color: Garden.muted, marginTop: -4 },
  chips: { gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TAP + 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: GardenRadii.sm,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  chipChecked: { backgroundColor: GardenTints.sage.bg, borderColor: Garden.sage },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(43,42,38,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: Garden.sage, borderColor: Garden.sage },
  chipText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.soft },
  chipTextChecked: { fontFamily: GardenFonts.bodyBold, color: Garden.ink },
  fieldErrorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldError: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.danger },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
  success: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Garden.sage,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  successBody: {
    fontFamily: GardenFonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: Garden.soft,
    textAlign: "center",
  },
});
