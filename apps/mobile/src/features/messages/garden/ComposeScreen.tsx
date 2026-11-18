// Garden "New Message" modal: pick a teacher to start (or reopen) a chat.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenEmpty,
  GardenField,
  GardenFonts,
  GardenIconButton,
  GardenSkeleton,
  PressableScale,
  READ_ONLY_TOAST,
  gardenCard,
  useToast,
} from "@/components/garden";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TeacherSuggestion } from "../messagingApi";
import { useComposeMessage } from "../useComposeMessage";

export function ComposeScreen() {
  const c = useComposeMessage();
  const toast = useToast();
  const { isReadOnlyPreview } = useAuth();
  const selectRef = useRef<((u: TeacherSuggestion) => Promise<void>) | null>(null);

  const select = useCallback(
    async (u: TeacherSuggestion) => {
      if (isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      const r = await c.select(u);
      if (!r.ok)
        toast.show({
          tone: "error",
          title: "Couldn't open the chat",
          message: "Please try again in a moment.",
          action: { label: "Retry", onPress: () => void selectRef.current?.(u) },
        });
    },
    [c, isReadOnlyPreview, toast],
  );
  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Display size={28}>New Message</Display>
        </View>
        <GardenIconButton icon="close" label="Close" onPress={() => c.router.back()} />
      </View>

      <View style={{ paddingHorizontal: 18, gap: 6 }}>
        <GardenField
          icon="search-outline"
          value={c.query}
          onChangeText={c.setQuery}
          placeholder="Search teachers & staff"
          autoFocus
          clearable
          autoCorrect={false}
          accessibilityLabel="To:"
        />
      </View>

      <View style={s.labelRow}>
        <Text style={s.label}>{c.showingSearch ? "To:" : "SUGGESTED"}</Text>
        {c.searching ? <ActivityIndicator size="small" color={Garden.sage} /> : null}
      </View>

      {c.suggestedLoading && !c.showingSearch ? (
        <View style={{ paddingHorizontal: 18, gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.row, { backgroundColor: Garden.white }]}>
              <GardenSkeleton width={46} height={46} radius={23} />
              <GardenSkeleton width="50%" height={14} radius={6} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={c.list}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40, gap: 8 }}
          ListEmptyComponent={
            c.searching ? null : (
              <Animated.View entering={FadeIn.duration(180)}>
                <GardenEmpty emoji="🔍" title="No results found" tint="sky" />
              </Animated.View>
            )
          }
          renderItem={({ item, index }) => {
            const busy = c.selectingId === item.id;
            return (
              <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
                <PressableScale
                  pressedScale={0.98}
                  disabled={!!c.selectingId && !busy}
                  onPress={() => void select(item)}
                  accessibilityLabel={`${item.full_name}, Teacher. Start a conversation`}
                  accessibilityState={{ busy }}
                  style={s.row}
                >
                  <GardenAvatar name={item.full_name} uri={item.profile_image_url} seed={item.id} size={46} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.full_name}</Text>
                    <Text style={s.role}>Teacher</Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={Garden.sageDeep} />
                  ) : (
                    <View style={s.go}>
                      <Ionicons name="chatbubble-ellipses" size={17} color={Garden.white} />
                    </View>
                  )}
                </PressableScale>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  head: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10 },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5, letterSpacing: 0.8, color: Garden.muted },
  row: { ...gardenCard, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 70 },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  role: { fontFamily: GardenFonts.hand, fontSize: 16, color: Garden.sageDeep },
  go: { width: 38, height: 38, borderRadius: 19, backgroundColor: Garden.sageDeep, alignItems: "center", justifyContent: "center" },
});
