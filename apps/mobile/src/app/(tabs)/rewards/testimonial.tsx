// Share Your Experience — Garden. Data + submit live in useTestimonial();
// this screen adds the read-only guard, loading/error/Retry and the
// celebration when the testimonial goes through.
import {
  Confetti,
  Display,
  Garden,
  GardenButton,
  GardenField,
  GardenFonts,
  GardenScreenHero,
  GardenSkeleton,
  GardenTints,
  MIN_TAP,
  haptic,
  useGardenGoBack,
  useToast,
  useWriteGuard,
  type ConfettiHandle,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { GUTTER, PromptsNote } from "@/features/rewards/garden/RewardsParts";
import { useTestimonial } from "@/features/rewards/useRewards";
import { useEffect, useRef } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_TEXT = 2000;

export default function TestimonialScreen() {
  const t = useTestimonial();
  const toast = useToast();
  const goBack = useGardenGoBack();
  const reduce = useReducedMotion();
  const { blocked } = useWriteGuard();
  const confettiRef = useRef<ConfettiHandle>(null);
  const submitRef = useRef<(() => Promise<void>) | null>(null);

  async function handleSubmit() {
    if (blocked()) return;
    const r = await t.submit();
    if (r.ok) {
      haptic.success();
      confettiRef.current?.fire();
      toast.show({ tone: "success", title: "Thank you so much!", silent: true });
    } else if (r.error && r.error !== "read-only") {
      toast.show({
        tone: "error",
        title: "Your testimonial didn't send",
        message: "Check your connection and try again. Your words are still here.",
        action: { label: "Retry", onPress: () => void submitRef.current?.() },
      });
    }
  }

  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  const canSubmit = !!t.testimonialText.trim() && !t.submitting;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Share Your Experience" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[st.content, { paddingBottom: BottomTabInset + 40 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {t.loading ? (
            <View style={{ gap: 14, alignItems: "center", paddingTop: 12 }}>
              <GardenSkeleton width={76} height={76} radius={38} />
              <GardenSkeleton width="70%" height={24} />
              <GardenSkeleton width="100%" height={150} radius={8} />
            </View>
          ) : t.submitted ? (
            <View style={st.success}>
              <Animated.View entering={reduce ? undefined : ZoomIn.springify()} style={st.successIcon}>
                <Text style={{ fontSize: 34 }}>☕</Text>
              </Animated.View>
              <Display size={28} style={{ textAlign: "center" }}>
                Thank you so much!
              </Display>
              <Text style={st.successBody} maxFontSizeMultiplier={1.4}>
                We&apos;ll be in touch about your gift card soon.
              </Text>
              <GardenButton label="Go back" tone="outline" onPress={goBack} style={{ alignSelf: "center", marginTop: 8 }} />
            </View>
          ) : (
            <Animated.View entering={reduce ? undefined : FadeIn.duration(200)} style={{ gap: 18 }}>
              <View style={st.header}>
                <View style={st.headerIcon}>
                  <Text style={{ fontSize: 32 }}>☕</Text>
                </View>
                <Text style={st.subtitle} maxFontSizeMultiplier={1.4}>
                  $15 Starbucks gift card — coffee on us
                </Text>
              </View>

              <Text style={st.intro} maxFontSizeMultiplier={1.4}>
                A few honest sentences from the heart is more than enough. Here are some prompts:
              </Text>

              <PromptsNote firstChildName={t.firstChildName} />

              <View style={{ gap: 6 }}>
                <GardenField
                  boxed
                  multiline
                  numberOfLines={5}
                  placeholder="Share your experience here…"
                  value={t.testimonialText}
                  onChangeText={t.setTestimonialText}
                  maxLength={MAX_TEXT}
                  editable={!t.submitting}
                  accessibilityLabel="Your testimonial"
                  containerStyle={{ minHeight: 150 }}
                />
                <Text style={st.counter}>{`${t.testimonialText.length}/${MAX_TEXT}`}</Text>
              </View>

              <GardenButton
                label="☕  Submit testimonial"
                tone="coral"
                fullWidth
                loading={t.submitting}
                loadingLabel="Submitting…"
                disabled={!canSubmit}
                onPress={() => void handleSubmit()}
              />

              <Pressable
                onPress={goBack}
                hitSlop={8}
                accessibilityRole="button"
                style={st.later}
              >
                <Text style={st.laterText}>Maybe later</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Confetti ref={confettiRef} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: 8 },
  header: { alignItems: "center", gap: 10 },
  headerIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: GardenTints.peach.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: GardenTints.peach.fg, textAlign: "center" },
  intro: { fontFamily: GardenFonts.body, fontSize: 14.5, lineHeight: 21, color: Garden.soft },
  counter: { alignSelf: "flex-end", fontFamily: GardenFonts.bodySemi, fontSize: 11.5, color: Garden.muted },
  later: { alignSelf: "center", minHeight: MIN_TAP, justifyContent: "center", paddingHorizontal: 12 },
  laterText: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.muted },
  success: { alignItems: "center", gap: 12, paddingVertical: 48 },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GardenTints.peach.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successBody: {
    fontFamily: GardenFonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Garden.soft,
    textAlign: "center",
  },
});
