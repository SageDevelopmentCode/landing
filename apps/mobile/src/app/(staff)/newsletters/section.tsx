// Staff newsletter section editor — Garden. Writes the text into the shared
// draft (Done), uploads / removes photos right away (they update the editor's
// counts and the preview immediately), asks before throwing away unsaved
// text, and is read-only once the newsletter is published.
import {
  Display,
  Garden,
  GardenButton,
  GardenEmpty,
  GardenFonts,
  GardenHintBox,
  GardenIconButton,
  GardenRadii,
  HandNote,
  PressableScale,
  haptic,
  useDiscardGuard,
  useToast,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { GUTTER } from "@/features/staff-newsletters/garden/NewslettersStaffParts";
import { useNewsletterEditor } from "@/features/staff-newsletters/NewsletterEditorProvider";
import type { NewsletterSectionImage } from "@/lib/newsletters-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SectionEditorScreen() {
  const { sectionId } = useLocalSearchParams<{ newsletterId: string; sectionId: string }>();
  const e = useNewsletterEditor();
  const toast = useToast();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sec = e.draft?.sections.find((s) => s.id === sectionId) ?? null;
  const isClass = !!sec?.is_class_updates;
  const ro = e.isPublished;
  const initial = sec ? (isClass ? e.draft!.myUpdate : sec.body) : "";
  const [body, setBody] = useState(initial);
  const [viewing, setViewing] = useState<NewsletterSectionImage | null>(null);
  const uploadRef = useRef<((uri: string) => Promise<void>) | null>(null);
  const changed = !ro && body !== initial;

  const guard = useDiscardGuard(changed, {
    title: "Discard changes?",
    message: "Tap Done to keep what you wrote in this section.",
    fallbackHref: "/(staff)/newsletters",
  });

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const done = () => {
    if (sec && changed) {
      if (isClass) e.patch({ myUpdate: body });
      else e.patchSection(sec.id, { body });
      haptic.success();
      toast.show({ tone: "info", title: `${sec.label} updated`, message: "Remember to Save the draft.", duration: 2200, silent: true });
    }
    guard.leave();
  };

  const upload = useCallback(
    async (uri: string) => {
      if (!sec) return;
      const r = await e.addImage(sec.id, uri);
      if (r.ok) {
        haptic.success();
        toast.show({ tone: "success", title: `Photo added to ${sec.label}`, duration: 1800 });
      } else {
        toast.show({
          tone: "error",
          title: "Upload Failed",
          message: r.error ?? "Could not upload image",
          action: { label: "Retry", onPress: () => void uploadRef.current?.(uri) },
        });
      }
    },
    [e, sec, toast],
  );
  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);

  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.show({
        tone: "error",
        title: "Permission Required",
        message: "Please allow access to your photo library.",
        action: { label: "Settings", onPress: () => void Linking.openSettings() },
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    await upload(result.assets[0].uri);
  };

  const confirmRemove = (img: NewsletterSectionImage) => {
    if (!sec) return;
    haptic.warning();
    Alert.alert("Remove Image", "Remove this image from the section?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const r = await e.removeImage(sec.id, img);
          setViewing(null);
          if (r.ok) toast.show({ tone: "success", title: "Image removed", duration: 1600 });
          else toast.show({ tone: "error", title: "Error", message: r.error ?? "Failed to remove image" });
        },
      },
    ]);
  };

  if (!sec) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.nav}>
          <GardenIconButton icon="chevron-back" label="Back" onPress={() => guard.leave()} />
        </View>
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="🍂" title="Section not found" body="Go back to the newsletter and try again." />
        </View>
      </SafeAreaView>
    );
  }

  const tile = Math.floor((width - GUTTER * 2 - 16) / 3);
  const uploading = !!e.uploading[sec.id];

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <View style={st.nav}>
        <GardenIconButton icon="chevron-back" label="Back" onPress={guard.back} />
        <View style={{ flex: 1 }}>
          <Display size={24} numberOfLines={1}>
            {sec.label}
          </Display>
          {!sec.visible ? (
            <HandNote size={14} color={Garden.muted}>
              hidden from parents
            </HandNote>
          ) : null}
        </View>
        {!ro ? <GardenButton label="Done" tone="sage" size="sm" icon="checkmark" onPress={done} /> : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {ro ? (
            <GardenHintBox icon="lock-closed-outline" style={{ marginTop: 0 }}>
              This newsletter is published, so its sections are read-only.
            </GardenHintBox>
          ) : null}
          {isClass ? <Text style={st.label}>Your Update</Text> : null}
          <TextInput
            style={[st.body, ro && { opacity: 0.8 }]}
            value={body}
            onChangeText={setBody}
            multiline
            editable={!ro}
            placeholder={isClass ? "Write your class update here…" : `Write content for ${sec.label}…`}
            placeholderTextColor={Garden.muted}
            textAlignVertical="top"
            maxFontSizeMultiplier={1.4}
            accessibilityLabel={isClass ? "Your Update" : `${sec.label} text`}
          />
          {changed ? (
            <HandNote size={15} color={Garden.coralDeep}>
              tap Done to keep these edits ✏️
            </HandNote>
          ) : null}

          {!isClass ? (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={st.label}>Images</Text>
                <HandNote size={15} color={Garden.muted}>{`${sec.images.length}`}</HandNote>
              </View>
              <View style={st.grid}>
                {sec.images.map((img) => (
                  <PressableScale
                    key={img.id}
                    onPress={() => setViewing(img)}
                    onLongPress={ro ? undefined : () => confirmRemove(img)}
                    accessibilityLabel="Section image"
                    accessibilityHint={ro ? "Opens the image" : "Opens the image. Long press to remove"}
                    style={[st.tile, { width: tile, height: tile }]}
                  >
                    {img.signed_url ? (
                      <Image source={{ uri: img.signed_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={22} color={Garden.muted} />
                    )}
                  </PressableScale>
                ))}
                {!ro ? (
                  <PressableScale
                    onPress={() => void pick()}
                    disabled={uploading}
                    accessibilityLabel={uploading ? "Uploading image" : "Add image"}
                    style={[st.tile, st.addTile, { width: tile, height: tile }]}
                  >
                    {uploading ? (
                      <ActivityIndicator color={Garden.sageDeep} />
                    ) : (
                      <>
                        <Ionicons name="add" size={24} color={Garden.sageDeep} />
                        <Text style={st.addText}>Add</Text>
                      </>
                    )}
                  </PressableScale>
                ) : null}
              </View>
              {!ro ? (
                <HandNote size={14} color={Garden.muted}>
                  photos save right away · long-press one to remove it
                </HandNote>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={st.viewer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewing(null)} accessibilityLabel="Close image" />
          {viewing?.signed_url ? (
            <Image source={{ uri: viewing.signed_url }} style={{ width, height: width }} contentFit="contain" />
          ) : null}
          <View style={[st.viewerBar, { paddingBottom: insets.bottom + 16 }]}>
            <GardenButton label="Close" tone="outline" onPress={() => setViewing(null)} style={{ flex: 1 }} />
            {!ro && viewing ? (
              <GardenButton label="Remove" tone="coral" icon="trash-outline" onPress={() => confirmRemove(viewing)} style={{ flex: 1 }} />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  body: {
    minHeight: 220,
    borderRadius: GardenRadii.md,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
    padding: 14,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 16,
    lineHeight: 23,
    color: Garden.ink,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    borderRadius: GardenRadii.sm,
    overflow: "hidden",
    backgroundColor: "#f1e7d8",
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: { borderWidth: 1.5, borderStyle: "dashed", borderColor: Garden.sage, backgroundColor: "#f4f9f5", gap: 2 },
  addText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.sageDeep },
  viewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center" },
  viewerBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: GUTTER },
});
