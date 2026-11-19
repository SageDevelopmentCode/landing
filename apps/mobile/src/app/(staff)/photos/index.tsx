// Staff Photos gallery — Garden. Shared gallery parts (features/photos/garden)
// + staff extras: upload banner/FAB, long-press menu, edit/delete
// (features/staff-photos). See the sagefield-garden-mobile skill (staff.md).
import { Garden, GardenActionSheet, useToast } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { PhotoFilterSheet } from "@/features/photos/garden/PhotoFilterSheet";
import {
  ActiveFilters,
  PhotosEmpty,
  PhotosError,
  PhotosHero,
  PhotosSkeleton,
  SectionHeader,
  TileRow,
  useTileSize,
} from "@/features/photos/garden/PhotosParts";
import { UploadBanner, UploadFab } from "@/features/staff-photos/garden/StaffPhotosParts";
import { useStaffPhotosFeedback } from "@/features/staff-photos/garden/useStaffPhotosFeedback";
import { useStaffPhotos } from "@/features/staff-photos/useStaffPhotos";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { RefreshControl, SectionList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StaffPhotosGalleryScreen() {
  const g = useStaffPhotos();
  const fb = useStaffPhotosFeedback(g);
  const toast = useToast();
  const size = useTileSize();
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });
  const busy = !!g.queue.batch && !g.queue.batch.finished;

  const upload = () => {
    if (busy) {
      toast.show({
        tone: "info",
        title: "One upload at a time",
        message: "Your photos are still uploading. You can add more when they finish.",
      });
      return;
    }
    g.openUpload();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <PhotosHero g={g} onOpenFilter={() => filterSheetRef.current?.present()} fallbackHref="/(staff)/home" />
      <UploadBanner queue={g.queue} />
      <ActiveFilters g={g} />

      {g.loading ? (
        <PhotosSkeleton />
      ) : (
        <SectionList
          sections={g.sections}
          keyExtractor={(row, idx) => (Array.isArray(row) ? row.map((p) => p.id).join("-") + idx : `row-${idx}`)}
          extraData={g.signedUrls}
          ListHeaderComponent={g.error ? <PhotosError fb={fb} /> : null}
          renderSectionHeader={({ section }) => <SectionHeader section={section} />}
          renderItem={({ item: row, section }) => (
            <TileRow row={row} sectionTitle={section.title} g={g} size={size} onLongPress={fb.openMenu} />
          )}
          onViewableItemsChanged={g.onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          refreshControl={
            <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
          }
          ListEmptyComponent={
            g.error ? null : (
              <PhotosEmpty
                g={g}
                emptyBody="Tap Upload to add your first photo."
                emptyActionLabel="Upload photos"
                onEmptyAction={upload}
              />
            )
          }
          contentContainerStyle={{ paddingBottom: BottomTabInset + 96 }}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 8 }} />}
        />
      )}

      <UploadFab onPress={upload} busy={busy} bottom={BottomTabInset + 16} />
      <PhotoFilterSheet sheetRef={filterSheetRef} g={g} />
      <GardenActionSheet ref={fb.menuRef} />
    </SafeAreaView>
  );
}
