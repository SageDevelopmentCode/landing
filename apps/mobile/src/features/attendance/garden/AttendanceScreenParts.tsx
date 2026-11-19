// Garden pieces for the stand-alone Attendance screen (hero + child chips).
import {
  Display,
  Garden,
  GardenAvatar,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  PressableScale,
  haptic,
  useToast,
} from "@/components/garden";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ParentAttendance } from "../useParentAttendance";

export const GUTTER = 18;

export function goBackOrHome(router: ParentAttendance["router"]) {
  if (router.canGoBack()) router.back();
  else router.replace("/(tabs)/home" as never);
}

export function useAttendanceFeedback(a: ParentAttendance) {
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const r = await a.reload();
    setRefreshing(false);
    if (r.ok) {
      toast.show({ tone: "success", title: "You're up to date", duration: 1600, silent: true });
      haptic.tap();
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't refresh",
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void refreshRef.current?.() },
      });
    }
  }, [a, toast]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const retryLoad = useCallback(async () => {
    setRetrying(true);
    const r = await a.retryLoad();
    setRetrying(false);
    if (r.ok) haptic.success();
  }, [a]);

  return { refreshing, refresh, retrying, retryLoad };
}

export type AttendanceFeedback = ReturnType<typeof useAttendanceFeedback>;

export function AttendanceHero({ a }: { a: ParentAttendance }) {
  const first = a.selected?.child_legal_name.trim().split(/\s+/)[0];
  const days = a.att.records.length;
  return (
    <View style={s.hero}>
      <GardenIconButton icon="chevron-back" label="Back" onPress={() => goBackOrHome(a.router)} />
      <View style={{ flex: 1 }}>
        <Display size={32} numberOfLines={1}>
          Attendance
        </Display>
        {first && !a.att.loading ? (
          <Text style={s.sub} maxFontSizeMultiplier={1.35} numberOfLines={1}>
            {`${first} · ${days} ${days === 1 ? "day" : "days"} on record`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ChildChips({ a }: { a: ParentAttendance }) {
  if (a.students.length < 2) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={s.chips}
    >
      {a.students.map((st) => {
        const on = st.id === a.selectedId;
        const first = st.child_legal_name.trim().split(/\s+/)[0] ?? st.child_legal_name;
        return (
          <PressableScale
            key={st.id}
            haptics="select"
            onPress={() => a.setSelectedId(st.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${first}'s attendance`}
            style={[s.chip, on && s.chipOn]}
          >
            <GardenAvatar name={st.child_legal_name} uri={st.profile_image_url} size={30} />
            <Text style={[s.chipText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
              {first}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

export function AttendanceScreenBody({ a, fb, children }: { a: ParentAttendance; fb: AttendanceFeedback; children: React.ReactNode }) {
  if (a.loading) {
    return (
      <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <GardenSkeleton width={110} height={44} radius={22} />
          <GardenSkeleton width={110} height={44} radius={22} />
        </View>
      </View>
    );
  }
  if (a.error && a.students.length === 0) {
    return (
      <View style={{ paddingHorizontal: GUTTER }}>
        <GardenErrorCard title="Couldn't load your children" retrying={fb.retrying} onRetry={() => void fb.retryLoad()} />
      </View>
    );
  }
  return <>{children}</>;
}

const s = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 14,
  },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft, marginTop: 2 },
  chips: { gap: 8, paddingHorizontal: GUTTER, paddingBottom: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  chipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
});
