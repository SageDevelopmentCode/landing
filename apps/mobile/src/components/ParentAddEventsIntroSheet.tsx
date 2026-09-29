import { forwardRef, useCallback, type ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Brand, FontFamilies } from "@/constants/theme";
import { HomeTheme } from "@/components/home/homeTheme";

const EXAMPLES = [
  {
    emoji: "⚽",
    title: "Soccer game",
    hint: "Let families know about the big match",
    bg: "rgba(34,197,94,0.12)",
  },
  {
    emoji: "💃",
    title: "Dance recital",
    hint: "Share performance times with other parents",
    bg: "rgba(219,39,119,0.12)",
  },
  {
    emoji: "🎉",
    title: "Birthday party",
    hint: "Invite classmates and families to join",
    bg: "rgba(234,179,8,0.14)",
  },
] as const;

const SHEET_TOP_RADIUS = 20;

type Props = {
  onAcknowledge: () => void;
};

export const ParentAddEventsIntroSheet = forwardRef<BottomSheetModal, Props>(
  function ParentAddEventsIntroSheet({ onAcknowledge }, ref) {
    const router = useRouter();

    const renderBackdrop = useCallback(
      (props: ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      ),
      [],
    );

    const dismiss = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
    }, [ref]);

    const handleGotIt = useCallback(() => {
      onAcknowledge();
      dismiss();
    }, [dismiss, onAcknowledge]);

    const handleAddEvent = useCallback(() => {
      onAcknowledge();
      dismiss();
      router.push("/(tabs)/calendar?addEvent=1" as any);
    }, [dismiss, onAcknowledge, router]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["62%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleStyle={styles.handleContainer}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#E8F0EA", "#F5EFE6", HomeTheme.canvas]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.headline}>Share with our school community</Text>
            <Text style={styles.body}>
              Add events other parents and families can see on the Sage Field
              calendar — games, performances, gatherings, and more.
            </Text>
          </LinearGradient>

          <Text style={styles.examplesLabel}>Great things to share</Text>
          <View style={styles.examples}>
            {EXAMPLES.map((ex) => (
              <View key={ex.title} style={styles.exampleRow}>
                <View style={[styles.exampleIcon, { backgroundColor: ex.bg }]}>
                  <Text style={styles.exampleEmoji}>{ex.emoji}</Text>
                </View>
                <View style={styles.exampleText}>
                  <Text style={styles.exampleTitle}>{ex.title}</Text>
                  <Text style={styles.exampleHint}>{ex.hint}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAddEvent}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Share an event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleGotIt}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Got it</Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#E8F0EA",
    borderTopLeftRadius: SHEET_TOP_RADIUS,
    borderTopRightRadius: SHEET_TOP_RADIUS,
    overflow: "hidden",
  },
  handleContainer: {
    backgroundColor: "#E8F0EA",
    borderTopLeftRadius: SHEET_TOP_RADIUS,
    borderTopRightRadius: SHEET_TOP_RADIUS,
    overflow: "hidden",
  },
  handle: {
    backgroundColor: "#C5D4C8",
    width: 36,
  },
  container: {
    paddingHorizontal: HomeTheme.horizontalInset,
    paddingTop: 0,
    paddingBottom: 28,
    gap: 16,
  },
  hero: {
    marginHorizontal: -HomeTheme.horizontalInset,
    paddingHorizontal: HomeTheme.horizontalInset,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE8E2",
    gap: 10,
  },
  headline: {
    fontFamily: FontFamilies.heading,
    fontSize: 26,
    color: Brand.sage700,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
  },
  examplesLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  examples: {
    gap: 10,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: HomeTheme.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDE8E2",
    padding: 12,
    ...HomeTheme.shadow,
  },
  exampleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exampleEmoji: {
    fontSize: 22,
  },
  exampleText: {
    flex: 1,
    gap: 2,
  },
  exampleTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  exampleHint: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    ...HomeTheme.shadow,
  },
  primaryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#ffffff",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: Brand.sage700,
  },
});
