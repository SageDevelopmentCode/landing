// Parent Volunteer — Garden. Form state + submit live in useVolunteerInterest();
// the stepped sheet lives in src/features/volunteer/garden/.
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenScreenHero,
  GardenSpace,
  GardenTints,
  gardenCard,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { VolunteerSheet } from "@/features/volunteer/garden/VolunteerSheet";
import { useVolunteerInterest } from "@/features/volunteer/useVolunteerInterest";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VolunteerScreen() {
  const v = useVolunteerInterest();
  const sheetRef = useRef<BottomSheetModal>(null);
  const reduce = useReducedMotion();
  const hasDraft = v.doneFlags.some(Boolean) || v.notes.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Volunteer" />
      <ScrollView
        contentContainerStyle={[st.scroll, { paddingBottom: BottomTabInset + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reduce ? undefined : FadeInDown.springify().damping(18)} style={st.card}>
          <View style={st.iconBadge}>
            <Text style={{ fontSize: 30 }}>💚</Text>
          </View>
          <Display size={24} style={{ textAlign: "center" }}>
            No openings right now
          </Display>
          <Text style={st.body} maxFontSizeMultiplier={1.4}>
            We&apos;ll notify you as soon as a volunteer opportunity becomes available. Thank you for
            your willingness to get involved!
          </Text>
          <GardenButton
            label="Express Interest in Volunteering"
            icon="heart-outline"
            tone="coral"
            fullWidth
            onPress={() => sheetRef.current?.present()}
            accessibilityHint={hasDraft ? "Continues your saved draft" : undefined}
            style={{ marginTop: 6 }}
          />
        </Animated.View>
      </ScrollView>

      <VolunteerSheet sheetRef={sheetRef} v={v} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: GardenSpace.gutter },
  card: { ...gardenCard, padding: 26, alignItems: "center", gap: 12 },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GardenTints.mint.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  body: {
    fontFamily: GardenFonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Garden.soft,
    textAlign: "center",
    marginBottom: 6,
  },
});
