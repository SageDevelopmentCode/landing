import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenSpace,
  HandNote,
  MIN_TAP,
  gardenEnter,
} from "@/components/garden";
import { WelcomePhotoStack } from "@/features/welcome/garden/WelcomePhotoStack";

function openLegal(url: string) {
  void openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
}

function enter(i: number) {
  return gardenEnter(i, { base: 260 });
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {/* Scrolls only when Dynamic Type or a short screen needs it. */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photos}>
          <WelcomePhotoStack />
        </View>

        <View style={styles.content}>
          <Animated.View entering={enter(0)} style={styles.center}>
            <Image
              source={require("@/assets/images/Logo.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Sage Field logo"
            />
          </Animated.View>

          <Animated.View entering={enter(1)} style={styles.center}>
            <Display size={38} style={styles.heading}>
              {"Welcome to\nSage Field"}
            </Display>
            <HandNote size={22} style={styles.tagline}>
              A place where curiosity grows.
            </HandNote>
          </Animated.View>

          <Animated.View entering={enter(2)} style={styles.actions}>
            <GardenButton
              label="Log in to continue"
              tone="coral"
              iconRight="arrow-forward"
              fullWidth
              onPress={() => router.replace("/login")}
            />
            <GardenButton
              label="Interested in Sage Field?"
              tone="outline"
              iconRight="chevron-forward"
              fullWidth
              onPress={() => router.push("/interested")}
            />
          </Animated.View>

          <Animated.View entering={enter(3)} style={styles.legalRow}>
            <Pressable
              onPress={() => openLegal("https://sagefield.co/privacy")}
              hitSlop={12}
              accessibilityRole="link"
              style={styles.legalHit}
            >
              <Text maxFontSizeMultiplier={1.3} style={styles.legalLink}>
                Privacy Policy
              </Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable
              onPress={() => openLegal("https://sagefield.co/terms")}
              hitSlop={12}
              accessibilityRole="link"
              style={styles.legalHit}
            >
              <Text maxFontSizeMultiplier={1.3} style={styles.legalLink}>
                Terms of Use
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Garden.cream,
  },
  photos: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: GardenSpace.gutter,
    paddingTop: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  center: {
    alignItems: "center",
  },
  logo: {
    width: 56,
    height: 48,
    marginBottom: 12,
  },
  heading: {
    textAlign: "center",
  },
  tagline: {
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  legalHit: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  legalLink: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 12.5,
    color: Garden.muted,
  },
  legalDot: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 12.5,
    color: Garden.muted,
  },
});
