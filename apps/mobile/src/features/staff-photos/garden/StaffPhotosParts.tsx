// Staff gallery extras: the live upload banner (progress + Retry) and the
// Upload FAB. The grid itself is the shared features/photos/garden parts.
import {
  Garden,
  GardenFonts,
  GardenRadii,
  GardenSpace,
  PressableScale,
  haptic,
} from "@/components/garden";
import type { UploadQueueValue } from "@/contexts/UploadQueueContext";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from "react-native-reanimated";

const GUTTER = GardenSpace.gutter;

export function UploadBanner({ queue }: { queue: UploadQueueValue }) {
  const reduce = useReducedMotion();
  const b = queue.batch;
  if (!b && queue.failedCount === 0) return null;

  // Finished with failures (and cleared) → a quiet "retry" strip.
  if (!b) {
    const n = queue.failedCount;
    return (
      <Animated.View
        entering={reduce ? undefined : FadeInUp.duration(200)}
        exiting={reduce ? undefined : FadeOutUp.duration(160)}
        style={[st.banner, st.bannerError]}
        accessibilityRole="alert"
      >
        <Ionicons name="cloud-offline-outline" size={20} color={Garden.danger} />
        <Text style={[st.title, { color: Garden.danger, flex: 1 }]} maxFontSizeMultiplier={1.3}>
          {n} photo{n === 1 ? "" : "s"} didn't upload
        </Text>
        <PressableScale
          haptics="press"
          onPress={() => queue.retryFailed()}
          accessibilityLabel={`Retry ${n} photo${n === 1 ? "" : "s"}`}
          style={st.retry}
        >
          <Text style={st.retryText}>Retry</Text>
        </PressableScale>
        <PressableScale
          haptics="tap"
          onPress={queue.dismissFailed}
          accessibilityLabel="Dismiss"
          hitSlop={8}
          style={{ padding: 4 }}
        >
          <Ionicons name="close" size={18} color={Garden.muted} />
        </PressableScale>
      </Animated.View>
    );
  }

  const finished = b.doneCount + b.errorCount;
  const pct = b.totalCount ? (finished / b.totalCount) * 100 : 0;
  const label = b.finished
    ? b.errorCount
      ? `${b.doneCount} uploaded, ${b.errorCount} failed`
      : `${b.doneCount} ${b.doneCount === 1 ? "photo" : "photos"} uploaded ✓`
    : `Uploading ${Math.min(finished + 1, b.totalCount)} of ${b.totalCount}…`;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInUp.duration(200)}
      exiting={reduce ? undefined : FadeOutUp.duration(160)}
      style={st.banner}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: b.totalCount, now: finished }}
    >
      {b.finished ? (
        <Ionicons
          name={b.errorCount ? "alert-circle" : "checkmark-circle"}
          size={20}
          color={b.errorCount ? Garden.danger : Garden.sageDeep}
        />
      ) : (
        <ActivityIndicator color={Garden.sageDeep} />
      )}
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={st.title} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        <View style={st.track}>
          <View style={[st.fill, { width: `${pct}%` }, b.errorCount > 0 && b.finished && { backgroundColor: Garden.coralDeep }]} />
        </View>
        {!b.finished ? (
          <Text style={st.sub} maxFontSizeMultiplier={1.3}>
            Keep using the app — uploads continue in the background.
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function UploadFab({ onPress, busy, bottom }: { onPress: () => void; busy: boolean; bottom: number }) {
  return (
    <View style={[st.fabWrap, { bottom }]} pointerEvents="box-none">
      <PressableScale
        haptics="press"
        onPress={() => {
          if (busy) haptic.warning();
          onPress();
        }}
        accessibilityLabel="Upload photos"
        accessibilityHint={busy ? "An upload is still running" : "Pick photos to upload"}
        style={[st.fab, busy && { opacity: 0.8 }]}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={Garden.white} />
        <Text style={st.fabText} maxFontSizeMultiplier={1.2}>
          Upload
        </Text>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: GUTTER,
    marginBottom: 6,
    padding: 14,
    borderRadius: GardenRadii.md,
    backgroundColor: "#e1eee3",
    borderWidth: 1,
    borderColor: "#cfe3d4",
  },
  bannerError: { backgroundColor: Garden.dangerTint, borderColor: "#f6cdbd" },
  title: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.sageDeep },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.soft },
  track: { height: 6, borderRadius: 3, backgroundColor: "rgba(74,99,84,0.15)", overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: Garden.sage },
  retry: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.coralDeep,
    justifyContent: "center",
  },
  retryText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.white },
  fabWrap: { position: "absolute", right: GUTTER },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.coralDeep,
    borderBottomWidth: 4,
    borderBottomColor: "#c0594d",
    shadowColor: "#2b2a26",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  fabText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.white },
});
