import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import { Newsletter, NewsletterTeacherUpdate, getNewsletter } from "@/lib/newsletters-actions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Traditional preview
// ---------------------------------------------------------------------------

function ImageGrid({ images }: { images: { id: string; signed_url: string | null }[] }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0].signed_url ?? undefined }}
        style={[styles.gridImg, { width: "100%", height: 200 }]}
        contentFit="cover"
      />
    );
  }
  if (images.length === 2) {
    return (
      <View style={styles.gridRow}>
        {images.map((img) => (
          <Image
            key={img.id}
            source={{ uri: img.signed_url ?? undefined }}
            style={[styles.gridImg, { flex: 1, height: 140 }]}
            contentFit="cover"
          />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.gridThree}>
      {images.map((img) => (
        <Image
          key={img.id}
          source={{ uri: img.signed_url ?? undefined }}
          style={[styles.gridImg, { width: (SCREEN_WIDTH - 64) / 3, height: 100 }]}
          contentFit="cover"
        />
      ))}
    </View>
  );
}

function TraditionalPreview({ newsletter }: { newsletter: Newsletter }) {
  const visible = newsletter.sections.filter((s) => s.visible);
  return (
    <ScrollView contentContainerStyle={tStyles.container}>
      {/* School header */}
      <View style={tStyles.schoolHeader}>
        <Ionicons name="school-outline" size={28} color="#fff" />
        <Text style={tStyles.schoolName}>Sagefield School</Text>
      </View>

      {/* Title block */}
      <View style={tStyles.titleBlock}>
        <Text style={tStyles.nlTitle}>{newsletter.title}</Text>
        <Text style={tStyles.nlWeek}>{newsletter.week_range}</Text>
      </View>

      {/* Sections */}
      {visible.map((sec) => (
        <View key={sec.id} style={tStyles.sectionCard}>
          <Text style={tStyles.sectionLabel}>{sec.label.toUpperCase()}</Text>
          {sec.is_class_updates ? (
            sec.teacher_updates
              .filter((tu) => tu.body.trim())
              .map((tu) => (
                <View key={tu.id} style={tStyles.teacherUpdate}>
                  <Text style={tStyles.teacherUpdateText}>{tu.body}</Text>
                </View>
              ))
          ) : (
            <>
              {!!sec.body && <Text style={tStyles.sectionBody}>{sec.body}</Text>}
              <ImageGrid images={sec.images} />
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Slideshow preview
// ---------------------------------------------------------------------------

function Slideshow({ newsletter }: { newsletter: Newsletter }) {
  const visible = newsletter.sections.filter((s) => s.visible);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= visible.length) return;
    flatRef.current?.scrollToIndex({ index: idx, animated: true });
    setActiveIndex(idx);
  };

  return (
    <View style={ssStyles.container}>
      <FlatList
        ref={flatRef}
        data={visible}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(idx);
        }}
        renderItem={({ item: sec }) => (
          <View style={[ssStyles.slide, { width: SCREEN_WIDTH }]}>
            {/* Image carousel */}
            {sec.images.length > 0 && (
              <FlatList
                data={sec.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(img) => img.id}
                style={ssStyles.imageCarousel}
                renderItem={({ item: img }) => (
                  <Image
                    source={{ uri: img.signed_url ?? undefined }}
                    style={{ width: SCREEN_WIDTH, height: 220 }}
                    contentFit="cover"
                  />
                )}
              />
            )}
            {sec.images.length === 0 && (
              <View style={ssStyles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#d1d5db" />
              </View>
            )}

            <ScrollView style={ssStyles.textArea} contentContainerStyle={ssStyles.textContent}>
              <Text style={ssStyles.sectionLabel}>{sec.label}</Text>
              {sec.is_class_updates ? (
                sec.teacher_updates
                  .filter((tu: NewsletterTeacherUpdate) => tu.body.trim())
                  .map((tu: NewsletterTeacherUpdate) => (
                    <Text key={tu.id} style={ssStyles.body}>{tu.body}</Text>
                  ))
              ) : (
                !!sec.body && <Text style={ssStyles.body}>{sec.body}</Text>
              )}
            </ScrollView>
          </View>
        )}
      />

      {/* Dot navigation */}
      <View style={ssStyles.dots}>
        {visible.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)}>
            <View style={[ssStyles.dot, i === activeIndex && ssStyles.dotActive]} />
          </Pressable>
        ))}
      </View>

      {/* Prev/Next buttons */}
      <View style={ssStyles.navBtns}>
        <Pressable
          style={({ pressed }) => [ssStyles.navBtn, pressed && { opacity: 0.6 }, activeIndex === 0 && { opacity: 0.3 }]}
          onPress={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
        >
          <Ionicons name="chevron-back" size={22} color={Brand.sage700} />
        </Pressable>
        <Text style={ssStyles.navCount}>{activeIndex + 1} / {visible.length}</Text>
        <Pressable
          style={({ pressed }) => [ssStyles.navBtn, pressed && { opacity: 0.6 }, activeIndex === visible.length - 1 && { opacity: 0.3 }]}
          onPress={() => goTo(activeIndex + 1)}
          disabled={activeIndex === visible.length - 1}
        >
          <Ionicons name="chevron-forward" size={22} color={Brand.sage700} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PreviewScreen() {
  const { newsletterId } = useLocalSearchParams<{ newsletterId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"traditional" | "slideshow">("traditional");

  useEffect(() => {
    if (!newsletterId) return;
    getNewsletter(newsletterId)
      .then((nl) => {
        setNewsletter(nl);
        setViewMode(nl.view_mode);
      })
      .catch((e) => Alert.alert("Error", e.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [newsletterId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading preview…</Text>
      </View>
    );
  }

  if (!newsletter) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={styles.modeRow}>
          {(["traditional", "slideshow"] as const).map((mode) => (
            <Pressable
              key={mode}
              style={[styles.modePill, viewMode === mode && styles.modePillActive]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[styles.modePillText, viewMode === mode && styles.modePillTextActive]}>
                {mode === "traditional" ? "Classic" : "Slides"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {viewMode === "traditional" ? (
        <TraditionalPreview newsletter={newsletter} />
      ) : (
        <Slideshow newsletter={newsletter} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  backBtn: { width: 32, alignItems: "flex-start" },
  headerTitle: { flex: 1, fontFamily: FontFamilies.heading, fontSize: 16, color: "#1f2937" },
  modeRow: { flexDirection: "row", gap: 6 },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  modePillActive: { backgroundColor: Brand.sage700 },
  modePillText: { fontFamily: FontFamilies.bodySemiBold, fontSize: 12, color: "#6b7280" },
  modePillTextActive: { color: "#fff" },
  gridRow: { flexDirection: "row", gap: 4, marginTop: 10 },
  gridThree: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 10 },
  gridImg: { borderRadius: 6 },
});

const tStyles = StyleSheet.create({
  container: { paddingBottom: 40 },
  schoolHeader: {
    backgroundColor: Brand.sage700,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  schoolName: { fontFamily: FontFamilies.heading, fontSize: 18, color: "#fff" },
  titleBlock: { padding: 20, backgroundColor: "#fff", gap: 4 },
  nlTitle: { fontFamily: FontFamilies.heading, fontSize: 20, color: "#111827" },
  nlWeek: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
    letterSpacing: 0.8,
  },
  sectionBody: { fontFamily: FontFamilies.body, fontSize: 14, color: "#374151", lineHeight: 22 },
  teacherUpdate: { gap: 2 },
  teacherUpdateText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#374151", lineHeight: 22 },
});

const ssStyles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1 },
  imageCarousel: { height: 220 },
  imagePlaceholder: {
    height: 220,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: { flex: 1 },
  textContent: { padding: 20, gap: 8 },
  sectionLabel: { fontFamily: FontFamilies.heading, fontSize: 20, color: "#111827" },
  body: { fontFamily: FontFamilies.body, fontSize: 15, color: "#374151", lineHeight: 24 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
  },
  dotActive: { backgroundColor: Brand.sage700, width: 18 },
  navBtns: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  navBtn: { padding: 8 },
  navCount: { fontFamily: FontFamilies.body, fontSize: 13, color: "#6b7280" },
});
