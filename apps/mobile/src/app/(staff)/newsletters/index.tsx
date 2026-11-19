// Staff Newsletters — Garden. Data in features/staff-newsletters/useStaffNewsletters.ts;
// UI in features/staff-newsletters/garden/.
import {
  Garden,
  GardenActionSheet,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenScreenHero,
  GardenSegmented,
  PressableScale,
  haptic,
  useRefreshFeedback,
  type GardenActionSheetHandle,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import {
  GUTTER,
  NewNewsletterSheet,
  NewsletterRow,
  NewslettersSkeletonRows,
  type NewNewsletterHandle,
} from "@/features/staff-newsletters/garden/NewslettersStaffParts";
import { useStaffNewsletters, type Filter } from "@/features/staff-newsletters/useStaffNewsletters";
import type { NewsletterListItem } from "@/lib/newsletters-actions";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewslettersScreen() {
  const n = useStaffNewsletters();
  const fb = useRefreshFeedback(n.reload);
  const { toast } = fb;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<NewNewsletterHandle>(null);
  const menuRef = useRef<GardenActionSheetHandle>(null);
  const deleteRef = useRef<((x: NewsletterListItem) => Promise<void>) | null>(null);
  const createRef = useRef<((t: string, w: string) => Promise<boolean>) | null>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const create = useCallback(
    async (title: string, weekRange: string) => {
      const r = await n.create(title, weekRange);
      if (r.ok && r.id) {
        haptic.success();
        toast.show({ tone: "success", title: "Newsletter created", message: "Add your sections, then publish when it's ready." });
        n.open(r.id);
        return true;
      }
      toast.show({
        tone: "error",
        title: "Couldn't create the newsletter",
        message: r.error,
        action: { label: "Retry", onPress: () => void createRef.current?.(title, weekRange) },
      });
      return false;
    },
    [n, toast],
  );

  const runDelete = useCallback(
    async (x: NewsletterListItem) => {
      const r = await n.remove(x);
      if (r.ok) toast.show({ tone: "success", title: "Newsletter deleted", message: `“${x.title}” was removed.` });
      else
        toast.show({
          tone: "error",
          title: "Couldn't delete",
          message: r.error ?? "Failed to delete",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(x) },
        });
    },
    [n, toast],
  );

  useEffect(() => {
    deleteRef.current = runDelete;
    createRef.current = create;
  }, [runDelete, create]);

  const confirmDelete = (x: NewsletterListItem) => {
    haptic.warning();
    const published = x.status === "published";
    Alert.alert(
      "Delete Newsletter",
      published ? `Delete "${x.title}"? It's published — parents will no longer be able to see it.` : `Delete "${x.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void runDelete(x) },
      ],
    );
  };

  const openMenu = (x: NewsletterListItem) =>
    menuRef.current?.present({
      title: x.title,
      subtitle: x.week_range,
      actions: [
        { label: "Open", icon: "open-outline", onPress: () => n.open(x.id) },
        {
          label: "Delete",
          icon: "trash-outline",
          destructive: true,
          hint: x.status === "published" ? "Removes it for parents" : undefined,
          onPress: () => confirmDelete(x),
        },
      ],
    });

  const empty = n.loading ? (
    <NewslettersSkeletonRows />
  ) : n.error ? (
    <View style={{ paddingHorizontal: GUTTER }}>
      <GardenErrorCard title="We couldn't load newsletters" onRetry={() => void fb.retry()} retrying={fb.retrying} />
    </View>
  ) : (
    <View style={{ paddingHorizontal: GUTTER }}>
      <GardenEmpty
        emoji="📰"
        tint="butter"
        title={n.filter === "draft" ? "No drafts yet" : "No published newsletters"}
        actionLabel={n.filter === "draft" ? "Create your first newsletter" : undefined}
        onAction={n.filter === "draft" ? () => sheetRef.current?.present() : undefined}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top", "left", "right"]}>
      <GardenScreenHero title="Newsletters" fallbackHref="/(staff)/home" />
      <View style={{ paddingHorizontal: GUTTER, paddingBottom: 12 }}>
        <GardenSegmented<Filter>
          accessibilityLabel="Filter newsletters"
          value={n.filter}
          onChange={n.setFilter}
          options={[
            { value: "draft", label: n.loading ? "Drafts" : `Drafts ${n.counts.draft}` },
            { value: "published", label: n.loading ? "Published" : `Published ${n.counts.published}` },
          ]}
        />
      </View>
      <FlatList
        data={n.loading || n.error ? [] : n.filtered}
        keyExtractor={(x) => x.id}
        renderItem={({ item, index }) => (
          <NewsletterRow
            item={item}
            index={index}
            deleting={!!n.deleting[item.id]}
            onPress={() => n.open(item.id)}
            onMenu={() => openMenu(item)}
          />
        )}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />}
      />
      <View style={[st.fabWrap, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <PressableScale haptics="press" onPress={() => sheetRef.current?.present()} accessibilityLabel="New Newsletter" style={st.fab}>
          <Ionicons name="add" size={22} color={Garden.white} />
          <Text style={st.fabText} maxFontSizeMultiplier={1.2}>
            New newsletter
          </Text>
        </PressableScale>
      </View>
      <NewNewsletterSheet ref={sheetRef} creating={n.creating} onCreate={create} />
      <GardenActionSheet ref={menuRef} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  fabWrap: { position: "absolute", right: GUTTER },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
