import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { useCallback, useRef } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Brand, FontFamilies } from "@/constants/theme";

type SlideItem = {
  id: number;
  image: ReturnType<typeof require>;
  headline: string;
  body: string | null;
  isTeamSlide?: true;
  isCTASlide?: true;
};

const SLIDES: SlideItem[] = [
  {
    id: 1,
    image: require("@/assets/images/stock/Stock1.webp"),
    headline: "Welcome to\nSage Field.",
    body: "A small, outdoor-focused private microschool in Round Rock, TX — where children ages 4–11 grow into curious, confident, and capable learners.",
  },
  {
    id: 2,
    image: require("@/assets/images/stock/Stock3.webp"),
    headline: "Knowledge is where\nwe start. Wisdom is\nwhere we're going.",
    body: "Sage is wisdom — understanding earned through curiosity, reflection, and real experience. Field is the open ground where growth happens.\n\nWe believe education should help children think, feel, and become.",
  },
  {
    id: 3,
    image: require("@/assets/images/stock/Stock2.webp"),
    headline: "Hands-on.\nWhole-child.\nNo worksheets.",
    body: "We blend Montessori, Waldorf, and Reggio Emilia with TEKS-aligned academics — meeting each child exactly where they are.\n\nMornings: reading, writing, math.\nAfternoons: nature, art, music, movement, projects.\n\nEvery child moves at their own pace.",
  },
  {
    id: 4,
    image: require("@/assets/images/stock/Stock5.webp"),
    headline: "Small groups.\nDeep roots.\nReal relationships.",
    body: "We keep classes to about 10 children — intentionally small so every child is truly known.\n\nNo traditional grades or transcripts. We track growth through portfolios and real observation.",
  },
  {
    id: 5,
    image: require("@/assets/images/stock/Stock6.webp"),
    headline: "Led by educators who\ngenuinely love this work.",
    body: null,
    isTeamSlide: true,
  },
  {
    id: 6,
    image: require("@/assets/images/stock/Stock8.webp"),
    headline: "We teach.\nYou stay close.\nTogether, it works.",
    body: "At Sage Field, families are partners. We handle the full curriculum — but the best outcomes happen when school and home are aligned.\n\nWe'll keep you in the loop. We just ask that you stay curious alongside your child.",
  },
  {
    id: 7,
    image: require("@/assets/images/stock/Stock9.webp"),
    headline: "Ready to\nlearn more?",
    body: "Enrollment for Summer 2026 and the 2026–2027 school year is now open.",
    isCTASlide: true,
  },
];

const TEAM = [
  {
    name: "Ms. Sabrina",
    role: "Lead Teacher\n2nd – 4th",
    image: require("@/assets/images/Headshot.webp"),
  },
  {
    name: "Ms. Paige",
    role: "Lead Teacher\nPre-K – 1st",
    image: require("@/assets/images/team/Paige.webp"),
  },
  {
    name: "Ms. Zelinda",
    role: "Teacher Aide",
    image: require("@/assets/images/team/Zelinda.webp"),
  },
];

export default function InterestedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const currentIndexRef = useRef(0);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        currentIndexRef.current = viewableItems[0].index;
      }
    }
  ).current;

  const goNext = useCallback(() => {
    const next = Math.min(currentIndexRef.current + 1, SLIDES.length - 1);
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
  }, []);

  const skipToEnd = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: SLIDES.length - 1, animated: true });
  }, []);

  const getItemLayout = useCallback(
    (_: SlideItem[] | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width]
  );

  const renderSlide = useCallback(
    ({ item, index }: { item: SlideItem; index: number }) => (
      <View style={[styles.slide, { width }]}>
        <Image
          source={item.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* Gradient overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            // @ts-ignore — experimental_backgroundImage is available in RN 0.83+
            {
              experimental_backgroundImage:
                "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.62) 38%, rgba(0,0,0,0.22) 65%, rgba(0,0,0,0.08) 100%)",
            },
          ]}
        />

        <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Pressable
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.55 }]}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.85)" />
            </Pressable>

            {!item.isCTASlide && (
              <Pressable
                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.55 }]}
                onPress={skipToEnd}
                hitSlop={12}
              >
                <Text style={styles.skipText}>Skip</Text>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.headline}>{item.headline}</Text>

            {item.isTeamSlide ? (
              <View style={styles.teamRow}>
                {TEAM.map((member) => (
                  <View key={member.name} style={styles.teamMember}>
                    <Image
                      source={member.image}
                      style={styles.teamAvatar}
                      contentFit="cover"
                    />
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamRole}>{member.role}</Text>
                  </View>
                ))}
              </View>
            ) : item.isCTASlide ? (
              <View style={styles.ctaBlock}>
                <Text style={styles.body}>{item.body}</Text>
                <Pressable
                  style={({ pressed }) => [styles.ctaPrimary, pressed && { opacity: 0.85 }]}
                  onPress={() => openBrowserAsync("https://sagefield.co/apply", {
                    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
                  })}
                >
                  <Text style={styles.ctaPrimaryText}>Apply for a Program</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.75 }]}
                  onPress={() => openBrowserAsync("https://sagefield.co/tour", {
                    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
                  })}
                >
                  <Text style={styles.ctaSecondaryText}>Schedule a Free Tour</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                  onPress={() => openBrowserAsync("https://sagefield.co/contact", {
                    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
                  })}
                >
                  <Text style={styles.ctaTertiary}>Contact Us</Text>
                </Pressable>
                <Text style={styles.ctaSubtext}>
                  Questions? sabrina@sagefield.co · (512) 677-5872
                </Text>
              </View>
            ) : (
              <Text style={styles.body}>{item.body}</Text>
            )}

            {/* Footer: dots + next */}
            <View style={styles.footer}>
              <View style={styles.dotsRow}>
                {SLIDES.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === index && styles.dotActive]}
                  />
                ))}
              </View>

              {!item.isCTASlide && (
                <Pressable
                  style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
                  onPress={goNext}
                >
                  <Text style={styles.nextBtnText}>
                    {index === SLIDES.length - 2 ? "See our offer" : "Next"}
                  </Text>
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    ),
    [width, insets.top, goNext, skipToEnd, router]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  slide: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  headerBtn: { padding: 4 },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  skipText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 16,
  },
  headline: {
    fontFamily: FontFamilies.heading,
    fontSize: 30,
    color: "#ffffff",
    lineHeight: 40,
  },
  body: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 24,
  },
  // Team slide
  teamRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  teamMember: { alignItems: "center", gap: 6, flex: 1 },
  teamAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  teamName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#ffffff",
    textAlign: "center",
  },
  teamRole: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 16,
  },
  // CTA slide
  ctaBlock: { gap: 12 },
  ctaPrimary: {
    backgroundColor: Brand.coral,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaPrimaryText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#ffffff",
  },
  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaSecondaryText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#ffffff",
  },
  ctaTertiary: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    paddingVertical: 4,
  },
  ctaSubtext: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.42)",
    textAlign: "center",
    marginTop: 2,
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: { width: 18, backgroundColor: "#ffffff" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  nextBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
});
