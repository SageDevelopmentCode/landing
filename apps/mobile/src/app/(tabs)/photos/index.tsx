// Parent Photos gallery — Garden. Data lives in usePhotosGallery(); the Garden
// pieces live in src/features/photos/garden/.
import { Garden, useRefreshFeedback } from "@/components/garden";
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
import { usePhotosGallery } from "@/features/photos/usePhotosGallery";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { RefreshControl, SectionList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParentPhotosGalleryScreen() {
  const g = usePhotosGallery();
  const fb = useRefreshFeedback(g.reload);
  const size = useTileSize();
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <PhotosHero g={g} onOpenFilter={() => filterSheetRef.current?.present()} />
      <ActiveFilters g={g} />

      {g.loading ? (
        <PhotosSkeleton />
      ) : (
        <SectionList
          sections={g.sections}
          keyExtractor={(row, idx) =>
            Array.isArray(row) ? row.map((p) => p.id).join("-") + idx : `row-${idx}`
          }
          extraData={g.signedUrls}
          ListHeaderComponent={g.error ? <PhotosError fb={fb} /> : null}
          renderSectionHeader={({ section }) => <SectionHeader section={section} />}
          renderItem={({ item: row, section }) => (
            <TileRow row={row} sectionTitle={section.title} g={g} size={size} />
          )}
          onViewableItemsChanged={g.onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          refreshControl={
            <RefreshControl
              refreshing={fb.refreshing}
              onRefresh={() => void fb.refresh()}
              tintColor={Garden.sage}
            />
          }
          ListEmptyComponent={g.error ? null : <PhotosEmpty g={g} />}
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 8 }} />}
        />
      )}

      <PhotoFilterSheet sheetRef={filterSheetRef} g={g} />
    </SafeAreaView>
  );
}
