// Staff newsletter preview — Garden. Reads the live draft from
// NewsletterEditorProvider, so unsaved edits show here too. Traditional or
// Slideshow (same names as the editor); only visible sections appear, the
// way parents will see them.
import {
  Display,
  Garden,
  GardenEmpty,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSegmented,
  HandNote,
  PressableScale,
  haptic,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { GUTTER } from "@/features/staff-newsletters/garden/NewslettersStaffParts";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { useNewsletterEditor, type EditableSection, type ViewMode } from "@/features/staff-newsletters/NewsletterEditorProvider";
import type { NewsletterSectionImage } from "@/lib/newsletters-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type PreviewSection = EditableSection & { updates: string[] };

function ImageGrid({ images, width }: { images: NewsletterSectionImage[]; width: number }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return <Image source={{ uri: images[0].signed_url ?? undefined }} style={[st.gridImg, { width, height: width * 0.6 }]} contentFit="cover" />;
  }
  const cols = images.length === 2 ? 2 : 3;
  const w = (width - (cols - 1) * 6) / cols;
  return (
    <View style={st.grid}>
      {images.map((img) => (
        <Image key={img.id} source={{ uri: img.signed_url ?? undefined }} style={[st.gridImg, { width: w, height: w }]} contentFit="cover" />
      ))}
    </View>
  );
}

function SectionBody({ sec }: { sec: PreviewSection }) {
  if (sec.is_class_updates) {
    return sec.updates.length ? (
      <View style={{ gap: 8 }}>
        {sec.updates.map((u, i) => (
          <View key={i} style={st.update}>
            <Text style={st.body}>{u}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={st.emptyBody}>No class updates written yet.</Text>
    );
  }
  return sec.body.trim() ? <Text style={st.body}>{sec.body}</Text> : null;
}

export default function NewsletterPreviewScreen() {
  const e = useNewsletterEditor();
  const { userId } = useStaffRole();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<ViewMode>(e.draft?.viewMode ?? "traditional");

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(staff)/newsletters" as never));

  const d = e.draft;
  if (!d || !e.server) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.nav}>
          <GardenIconButton icon="chevron-back" label="Back" onPress={back} />
          <Display size={24}>Preview</Display>
        </View>
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="📰" title="Nothing to preview yet" body="Open the newsletter first, then tap Preview." actionLabel="Back" onAction={back} />
        </View>
      </SafeAreaView>
    );
  }

  // Everyone's saved class updates, with mine swapped for what's on screen now.
  const sections: PreviewSection[] = d.sections
    .filter((s) => s.visible)
    .map((s) => {
      if (!s.is_class_updates) return { ...s, updates: [] };
      const saved = e.server!.sections.find((x) => x.id === s.id)?.teacher_updates ?? [];
      const updates = saved
        .filter((t) => t.teacher_id !== userId)
        .map((t) => t.body)
        .concat(d.myUpdate)
        .filter((b) => b.trim());
      return { ...s, updates };
    });

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <View style={st.nav}>
        <GardenIconButton icon="chevron-back" label="Back" onPress={back} />
        <View style={{ flex: 1 }}>
          <Display size={24}>Preview</Display>
          {e.dirty ? (
            <HandNote size={14} color={Garden.coralDeep}>
              includes unsaved edits
            </HandNote>
          ) : null}
        </View>
      </View>
      <View style={{ paddingHorizontal: GUTTER, paddingBottom: 10 }}>
        <GardenSegmented<ViewMode>
          accessibilityLabel="Preview layout"
          value={mode}
          onChange={setMode}
          options={[
            { value: "traditional", label: "Traditional" },
            { value: "slideshow", label: "Slideshow" },
          ]}
        />
      </View>

      {sections.length === 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="🙈" title="Every section is hidden" body="Show at least one section in the editor so parents have something to read." tint="butter" />
        </View>
      ) : mode === "traditional" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 12 }}>
          <View style={st.masthead}>
            <Ionicons name="school-outline" size={24} color={Garden.white} />
            <Text style={st.school}>Sagefield School</Text>
          </View>
          <View style={st.titleCard}>
            <Display size={24}>{d.title || "Untitled newsletter"}</Display>
            <Text style={st.week}>{d.weekRange}</Text>
          </View>
          {sections.map((sec) => (
            <View key={sec.id} style={st.card}>
              <Text style={st.sectionLabel}>{sec.label.toUpperCase()}</Text>
              <SectionBody sec={sec} />
              <ImageGrid images={sec.images} width={width - GUTTER * 2 - 32} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <Slideshow sections={sections} width={width} bottom={insets.bottom} />
      )}
    </SafeAreaView>
  );
}

function Slideshow({ sections, width, bottom }: { sections: PreviewSection[]; width: number; bottom: number }) {
  const [i, setI] = useState(0);
  const ref = useRef<FlatList<PreviewSection>>(null);
  const go = (n: number) => {
    if (n < 0 || n >= sections.length) return;
    haptic.select();
    ref.current?.scrollToIndex({ index: n, animated: true });
    setI(n);
  };
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={ref}
        data={sections}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        onMomentumScrollEnd={(ev) => setI(Math.round(ev.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item: sec }) => (
          <ScrollView style={{ width }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 12 }}>
            {sec.images.length ? (
              <ImageGrid images={sec.images} width={width - GUTTER * 2} />
            ) : (
              <View style={st.placeholder}>
                <Ionicons name="image-outline" size={36} color={Garden.muted} />
              </View>
            )}
            <Display size={22}>{sec.label}</Display>
            <SectionBody sec={sec} />
          </ScrollView>
        )}
      />
      <View style={[st.slideNav, { paddingBottom: bottom + 12 }]}>
        <PressableScale onPress={() => go(i - 1)} disabled={i === 0} accessibilityLabel="Previous section" style={[st.navBtn, i === 0 && { opacity: 0.35 }]}>
          <Ionicons name="chevron-back" size={22} color={Garden.sageDeep} />
        </PressableScale>
        <View style={st.dots}>
          {sections.map((s, k) => (
            <View key={s.id} style={[st.dot, k === i && st.dotOn]} />
          ))}
        </View>
        <Text style={st.count}>{`${i + 1} / ${sections.length}`}</Text>
        <PressableScale
          onPress={() => go(i + 1)}
          disabled={i === sections.length - 1}
          accessibilityLabel="Next section"
          style={[st.navBtn, i === sections.length - 1 && { opacity: 0.35 }]}
        >
          <Ionicons name="chevron-forward" size={22} color={Garden.sageDeep} />
        </PressableScale>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  masthead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: GardenRadii.md,
    backgroundColor: Garden.sageDeep,
  },
  school: { fontFamily: GardenFonts.display, fontSize: 18, color: Garden.white },
  titleCard: { padding: 16, borderRadius: GardenRadii.md, backgroundColor: Garden.white, borderWidth: 1, borderColor: Garden.line, gap: 4 },
  week: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft },
  card: { padding: 16, borderRadius: GardenRadii.md, backgroundColor: Garden.white, borderWidth: 1, borderColor: Garden.line, gap: 10 },
  sectionLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, letterSpacing: 0.8, color: Garden.sageDeep },
  body: { fontFamily: GardenFonts.body, fontSize: 15, lineHeight: 23, color: Garden.ink },
  emptyBody: { fontFamily: GardenFonts.hand, fontSize: 15, color: Garden.muted },
  update: { padding: 12, borderRadius: GardenRadii.sm, backgroundColor: "#f7f2ea" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  gridImg: { borderRadius: 12, backgroundColor: "#f1e7d8" },
  placeholder: { height: 160, borderRadius: GardenRadii.md, backgroundColor: "#f1e7d8", alignItems: "center", justifyContent: "center" },
  slideNav: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: GUTTER, paddingTop: 10, borderTopWidth: 1, borderTopColor: Garden.line },
  navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Garden.white, borderWidth: 1, borderColor: Garden.line, alignItems: "center", justifyContent: "center" },
  dots: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 6, flexWrap: "wrap" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#e3d9c8" },
  dotOn: { width: 18, backgroundColor: Garden.sageDeep },
  count: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.soft },
});
