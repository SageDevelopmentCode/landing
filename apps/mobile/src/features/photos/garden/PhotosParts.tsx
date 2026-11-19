// Garden UI for the parent Photos gallery: hero with the date filter, active
// filter chips, day headers, rounded photo tiles and loading / empty states.
import {
  CountBadge,
  Display,
  Garden,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenScreenHero,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  PressableScale,
  haptic,
  type RefreshFeedback,
} from "@/components/garden";
import type { TeacherPhoto } from "@/lib/photos-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import type { PhotoSection, PhotosGallery } from "../usePhotosGallery";

const GUTTER = GardenSpace.gutter;
export const TILE_GAP = 6;

export function useTileSize() {
  const { width } = useWindowDimensions();
  return Math.floor((width - GUTTER * 2 - TILE_GAP * 2) / 3);
}

// ─── Hero + active filters ───────────────────────────────────────────────────
export function PhotosHero({
  g,
  onOpenFilter,
  extraRight,
  fallbackHref,
}: {
  g: PhotosGallery;
  onOpenFilter: () => void;
  /** Extra buttons after the filter (staff: Upload). */
  extraRight?: React.ReactNode;
  fallbackHref?: string;
}) {
  const n = g.selectedDates.size;
  return (
    <GardenScreenHero
      title="Photos"
      fallbackHref={fallbackHref}
      right={
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View>
          <GardenIconButton
            icon={n > 0 ? "calendar" : "calendar-outline"}
            tone={n > 0 ? "sage" : "white"}
            label={n > 0 ? `Filter by Date, ${n} selected` : "Filter by Date"}
            onPress={onOpenFilter}
            disabled={g.loading || g.availableDates.length === 0}
          />
          {n > 0 ? (
            <View style={st.badgePos} pointerEvents="none">
              <CountBadge count={n} />
            </View>
          ) : null}
          </View>
          {extraRight ?? null}
        </View>
      }
    />
  );
}

export function ActiveFilters({ g }: { g: PhotosGallery }) {
  const reduce = useReducedMotion();
  if (g.selectedDates.size === 0) return null;
  const chosen = g.availableDates.filter((d) => g.selectedDates.has(d.key));
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(180)}
      exiting={reduce ? undefined : FadeOut.duration(120)}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.filterRow}
      >
        {chosen.map((d) => (
          <PressableScale
            key={d.key}
            haptics="select"
            onPress={() => g.toggleDate(d.key)}
            accessibilityLabel={`Remove filter ${d.title}`}
            style={st.filterChip}
          >
            <Text style={st.filterChipText} maxFontSizeMultiplier={1.3}>
              {d.title}
            </Text>
            <Ionicons name="close" size={14} color={Garden.sageDeep} />
          </PressableScale>
        ))}
        <Pressable
          onPress={() => {
            haptic.select();
            g.clearDates();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear date filter"
          style={st.clearLink}
        >
          <Text style={st.clearText}>Clear</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────
export function SectionHeader({ section }: { section: PhotoSection }) {
  return (
    <View style={st.sectionHeader}>
      <Display size={20} style={{ flex: 1 }}>
        {section.title}
      </Display>
      <Text style={st.sectionCount} maxFontSizeMultiplier={1.3}>
        {`${section.count} ${section.count === 1 ? "photo" : "photos"}`}
      </Text>
    </View>
  );
}

function PhotoTile({
  photo,
  url,
  size,
  label,
  onPress,
  onLongPress,
}: {
  photo: TeacherPhoto;
  url?: string;
  size: number;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      pressedScale={0.94}
      accessibilityLabel={label}
      accessibilityHint={onLongPress ? "Opens the photo. Long press for options" : "Opens the photo"}
      accessibilityActions={onLongPress ? [{ name: "longpress", label: "Photo options" }] : undefined}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "longpress") onLongPress?.();
      }}
      style={[st.tile, { width: size, height: size }]}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={photo.id}
          transition={200}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <GardenSkeleton width={size} height={size} radius={GardenRadii.sm} />
      )}
    </PressableScale>
  );
}

export function TileRow({
  row,
  sectionTitle,
  g,
  size,
  onLongPress,
}: {
  row: TeacherPhoto[];
  sectionTitle: string;
  g: PhotosGallery;
  size: number;
  onLongPress?: (photo: TeacherPhoto) => void;
}) {
  return (
    <View style={st.tileRow}>
      {row.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          url={g.signedUrls[photo.storage_path]}
          size={size}
          label={photo.caption ? `Photo: ${photo.caption}` : `Photo from ${sectionTitle}`}
          onPress={() => g.openPhoto(photo)}
          onLongPress={onLongPress ? () => onLongPress(photo) : undefined}
        />
      ))}
      {row.length < 3
        ? Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={{ width: size, height: size }} />
          ))
        : null}
    </View>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────
export function PhotosSkeleton() {
  const size = useTileSize();
  return (
    <View accessible accessibilityLabel="Loading photos">
      {[0, 1].map((s) => (
        <View key={s}>
          <View style={st.sectionHeader}>
            <GardenSkeleton width="50%" height={20} />
          </View>
          {[0, 1].map((r) => (
            <View key={r} style={st.tileRow}>
              {[0, 1, 2].map((t) => (
                <GardenSkeleton key={t} width={size} height={size} radius={GardenRadii.sm} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PhotosError({ fb }: { fb: RefreshFeedback }) {
  return (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 6 }}>
      <GardenErrorCard
        title="We couldn't load photos"
        onRetry={() => void fb.retry()}
        retrying={fb.retrying}
      />
    </View>
  );
}

export function PhotosEmpty({
  g,
  emptyBody = "Check back soon for school photos.",
  emptyActionLabel,
  onEmptyAction,
}: {
  g: PhotosGallery;
  emptyBody?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}) {
  const filtered = g.selectedDates.size > 0;
  return (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 12 }}>
      <GardenEmpty
        emoji={filtered ? "🗓️" : "📸"}
        tint={filtered ? "sky" : "peach"}
        title={filtered ? "No photos for selected dates" : "No photos yet"}
        body={filtered ? "Try selecting different dates." : emptyBody}
        actionLabel={filtered ? "Clear" : emptyActionLabel}
        onAction={filtered ? g.clearDates : onEmptyAction}
      />
    </View>
  );
}

const st = StyleSheet.create({
  badgePos: { position: "absolute", top: -3, right: -4 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: GUTTER,
    paddingBottom: 6,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    backgroundColor: GardenTints.sage.bg,
    borderWidth: 1.5,
    borderColor: Garden.sage,
  },
  filterChipText: { fontFamily: GardenFonts.bodyBold, fontSize: 13, color: Garden.sageDeep },
  clearLink: { paddingHorizontal: 6, minHeight: 36, justifyContent: "center" },
  clearText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: GUTTER,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionCount: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.muted },
  tileRow: {
    flexDirection: "row",
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
    paddingHorizontal: GUTTER,
  },
  tile: {
    borderRadius: GardenRadii.sm,
    overflow: "hidden",
    backgroundColor: "#f1e7d8",
  },
});
