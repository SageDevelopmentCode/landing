// "Filter by Date" sheet: checkbox rows with a photo count per day. Filtering
// applies live (as before); Done just closes the sheet.
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenRadii,
  GardenTints,
  MIN_TAP,
  PressableScale,
  gardenSheetChrome,
  haptic,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import type { RefObject } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PhotosGallery } from "../usePhotosGallery";

export function PhotoFilterSheet({
  sheetRef,
  g,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  g: PhotosGallery;
}) {
  const insets = useSafeAreaInsets();
  const n = g.selectedDates.size;

  const renderFooter = (props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <GardenButton
          label={n > 0 ? `Show ${g.visibleCount} ${g.visibleCount === 1 ? "photo" : "photos"}` : "Done"}
          tone="ink"
          fullWidth
          onPress={() => sheetRef.current?.dismiss()}
        />
      </View>
    </BottomSheetFooter>
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      {...gardenSheetChrome}
      snapPoints={["60%", "88%"]}
      enableDynamicSizing={false}
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView contentContainerStyle={st.content}>
        <View style={st.header}>
          <Display size={26} style={{ flex: 1 }}>
            Filter by Date
          </Display>
          {n > 0 ? (
            <Pressable
              onPress={() => {
                haptic.select();
                g.clearDates();
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Clear date filter"
            >
              <Text style={st.clear}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ gap: 8 }}>
          {g.availableDates.map(({ key, title, count }) => {
            const selected = g.selectedDates.has(key);
            return (
              <PressableScale
                key={key}
                haptics="select"
                pressedScale={0.98}
                onPress={() => g.toggleDate(key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${title}, ${count} ${count === 1 ? "photo" : "photos"}`}
                style={[st.row, selected && st.rowSelected]}
              >
                <View style={[st.box, selected && st.boxSelected]}>
                  {selected ? <Ionicons name="checkmark" size={16} color={Garden.white} /> : null}
                </View>
                <Text style={[st.rowText, selected && { color: Garden.sageDeep }]} maxFontSizeMultiplier={1.4}>
                  {title}
                </Text>
                <Text style={st.rowCount} maxFontSizeMultiplier={1.3}>
                  {count}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  clear: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.sageDeep },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TAP + 8,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.sm,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  rowSelected: { backgroundColor: GardenTints.sage.bg, borderColor: Garden.sage },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(43,42,38,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  boxSelected: { backgroundColor: Garden.sage, borderColor: Garden.sage },
  rowText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 15.5, color: Garden.ink },
  rowCount: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.muted },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
