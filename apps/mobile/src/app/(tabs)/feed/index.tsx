// Parent Feed — Garden. Data + handlers live in useParentFeed() (which wraps
// the shared useFeedPosts); the Garden pieces live in src/features/feed/garden/.
// (Staff keeps components/feed/FeedScreen.)
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { PhotoViewer } from "@/features/feed/garden/FeedBits";
import {
  FeedEmptyOrError,
  FeedFooter,
  FeedHero,
  PostCard,
  ReactionViewersSheet,
  TeacherFilterSheet,
} from "@/features/feed/garden/FeedParts";
import { useFeedFeedback } from "@/features/feed/garden/useFeedFeedback";
import { useParentFeed } from "@/features/feed/useParentFeed";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParentFeedScreen() {
  const f = useParentFeed();
  const fb = useFeedFeedback(f);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <FlatList
        data={f.loading ? [] : f.posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} f={f} fb={fb} />}
        ListHeaderComponent={<FeedHero f={f} />}
        ListEmptyComponent={<FeedEmptyOrError f={f} fb={fb} />}
        ListFooterComponent={<FeedFooter f={f} />}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (!f.loadMoreError) void f.loadMore();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={f.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      />
      <TeacherFilterSheet f={f} />
      <ReactionViewersSheet f={f} />
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
