// Staff Class feed — Garden. Same list as the parent Family feed
// (useFeedList("staff")) plus compose and delete. UI in features/feed/garden/.
import { Garden, GardenActionSheet, useGardenGoBack } from "@/components/garden";
import { PhotoViewer } from "@/features/feed/garden/FeedBits";
import {
  ComposeFab,
  FeedEmptyOrError,
  FeedFooter,
  FeedHero,
  PostCard,
  ReactionViewersSheet,
  TeacherFilterSheet,
} from "@/features/feed/garden/FeedParts";
import { useFeedFeedback } from "@/features/feed/garden/useFeedFeedback";
import { useFeedList } from "@/features/feed/useParentFeed";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";

export default function StaffFeedScreen() {
  const f = useFeedList("staff");
  const fb = useFeedFeedback(f);
  const goBack = useGardenGoBack("/(staff)/home");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <FlatList
        data={f.loading ? [] : f.posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} f={f} fb={fb} />}
        ListHeaderComponent={<FeedHero f={f} onBack={goBack} />}
        ListEmptyComponent={<FeedEmptyOrError f={f} fb={fb} />}
        ListFooterComponent={<FeedFooter f={f} />}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 96 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (!f.loadMoreError) void f.loadMore();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={f.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      />
      <ComposeFab f={f} bottom={BottomTabInset + 16} />
      <TeacherFilterSheet f={f} />
      <ReactionViewersSheet f={f} />
      <GardenActionSheet ref={fb.menuRef} />
      <PhotoViewer
        media={f.viewer?.post.media ?? []}
        startIndex={f.viewer?.index ?? 0}
        visible={!!f.viewer}
        onClose={() => f.setViewer(null)}
        onSave={(uri) => void fb.savePhoto(uri)}
        onOpenVideo={(uri) => void fb.openLink(uri)}
      />
    </SafeAreaView>
  );
}
