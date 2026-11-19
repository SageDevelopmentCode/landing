// Add / Edit note sheet with numbered steps: 1 Note, 2 Category, 3 Share with
// Parent, 4 Attachments (add mode only, as before). Save stays in the thumb zone.
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
  gardenSheetChrome,
  haptic,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { StyleSheet, Switch, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NOTE_CATEGORIES, type StudentDetailHook } from "../useStudentDetail";
import { CATEGORY_TINT } from "./StudentDetailParts";
import type { StudentDetailFeedback } from "./useStudentDetailFeedback";

function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <View style={s.step}>
      <View style={[s.stepNum, done && { backgroundColor: Garden.sage }]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color={Garden.white} />
        ) : (
          <Text style={s.stepNumText}>{n}</Text>
        )}
      </View>
      <Text style={s.stepLabel} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}

export function StudentNoteSheet({ d, fb }: { d: StudentDetailHook; fb: StudentDetailFeedback }) {
  const insets = useSafeAreaInsets();
  const editing = !!d.editingNote;
  const hasText = d.noteText.trim().length > 0;
  const firstName = d.name.split(" ")[0] || d.name;

  return (
    <BottomSheetModal
      ref={d.noteSheetRef}
      {...gardenSheetChrome}
      snapPoints={["90%"]}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.body, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
      >
        <View style={{ gap: 2 }}>
          <Display size={26}>{editing ? "Edit Note" : "Add Note"}</Display>
          <HandNote size={17} color={Garden.sageDeep}>
            about {firstName}
          </HandNote>
        </View>

        <View style={s.block}>
          <Step n={1} label="Note" done={hasText} />
          <GardenField
            boxed
            multiline
            InputComponent={BottomSheetTextInput as any}
            value={d.noteText}
            onChangeText={d.setNoteText}
            placeholder="Write your note here..."
            accessibilityLabel="Note text"
            style={{ minHeight: 120 }}
          />
        </View>

        <View style={s.block}>
          <Step n={2} label="Category" done />
          <View style={s.cats} accessibilityRole="radiogroup">
            {NOTE_CATEGORIES.map((c) => {
              const on = d.noteCategory === c;
              const t = GardenTints[CATEGORY_TINT[c]];
              return (
                <PressableScale
                  key={c}
                  haptics="select"
                  onPress={() => d.setNoteCategory(c)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={c}
                  style={[
                    s.cat,
                    { backgroundColor: on ? t.fg : t.bg, borderColor: on ? t.fg : "transparent" },
                  ]}
                >
                  {on ? (
                    <Animated.View entering={ZoomIn}>
                      <Ionicons name="checkmark" size={14} color={Garden.white} />
                    </Animated.View>
                  ) : null}
                  <Text style={[s.catText, { color: on ? Garden.white : t.fg }]} maxFontSizeMultiplier={1.3}>
                    {c}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View style={s.block}>
          <Step n={3} label="Share with Parent" done />
          <View style={s.shareRow}>
            <View style={[s.shareIcon, { backgroundColor: d.noteShared ? GardenTints.sky.bg : "#f3eadc" }]}>
              <Ionicons
                name={d.noteShared ? "people" : "lock-closed"}
                size={17}
                color={d.noteShared ? GardenTints.sky.fg : Garden.soft}
              />
            </View>
            <Text style={s.shareText} maxFontSizeMultiplier={1.3}>
              {d.noteShared ? "Shared" : "Private"}
            </Text>
            <Switch
              value={d.noteShared}
              onValueChange={(v) => {
                haptic.select();
                d.setNoteShared(v);
              }}
              trackColor={{ true: Garden.sage, false: "#e6dccb" }}
              thumbColor={Garden.white}
              accessibilityLabel="Share with Parent"
            />
          </View>
        </View>

        {!editing ? (
          <View style={s.block}>
            <Step n={4} label="Attachments" done={d.pendingAttachments.length > 0} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <GardenButton label="Image" tone="outline" size="sm" icon="image-outline" onPress={() => void fb.pickImages()} />
              <GardenButton label="File" tone="outline" size="sm" icon="document-attach-outline" onPress={() => void fb.pickFiles()} />
            </View>
            {d.pendingAttachments.length > 0 ? (
              <View style={s.pending}>
                {d.pendingAttachments.map((a, i) => (
                  <Animated.View key={`${a.uri}-${i}`} entering={ZoomIn.springify()} style={{ position: "relative" }}>
                    {a.isImage ? (
                      <Image source={{ uri: a.uri }} style={s.thumb} contentFit="cover" />
                    ) : (
                      <View style={s.file}>
                        <Ionicons name="document-outline" size={18} color={Garden.sageDeep} />
                        <Text style={s.fileName} numberOfLines={2}>
                          {a.name}
                        </Text>
                      </View>
                    )}
                    <PressableScale
                      onPress={() => {
                        haptic.tap();
                        d.removePending(i);
                      }}
                      hitSlop={10}
                      accessibilityLabel={`Remove ${a.isImage ? "photo" : a.name}`}
                      style={s.remove}
                    >
                      <Ionicons name="close" size={13} color={Garden.white} />
                    </PressableScale>
                  </Animated.View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {!hasText ? (
          <View style={s.hint}>
            <Ionicons name="information-circle-outline" size={16} color={Garden.soft} />
            <Text style={s.hintText} maxFontSizeMultiplier={1.3}>
              Write the note in step 1 to save it.
            </Text>
          </View>
        ) : null}

        <GardenButton
          label={editing ? "Save Changes" : "Add Note"}
          tone="coral"
          icon={editing ? "checkmark" : "add"}
          fullWidth
          loading={d.savingNote}
          loadingLabel="Saving…"
          disabled={!hasText}
          onPress={() => void fb.saveNote()}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 6, gap: 18 },
  block: { gap: 10 },
  step: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Garden.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.white },
  stepLabel: { fontFamily: GardenFonts.display, fontSize: 16, color: Garden.ink },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    borderWidth: 1.5,
  },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5 },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: MIN_TAP + 8,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  shareIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  shareText: { flex: 1, fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  pending: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 4 },
  thumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: "#f3eadc" },
  file: {
    width: 110,
    height: 72,
    borderRadius: 14,
    padding: 10,
    gap: 4,
    backgroundColor: GardenTints.sage.bg,
    justifyContent: "center",
  },
  fileName: { fontFamily: GardenFonts.bodyBold, fontSize: 11.5, color: Garden.ink },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Garden.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.line,
  },
  hintText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft },
});
