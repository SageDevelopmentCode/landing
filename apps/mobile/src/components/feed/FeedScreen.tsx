import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FeedHeader } from "./FeedHeader";
import { FeedPostCard } from "./FeedPostCard";
import { FeedSkeleton } from "./FeedSkeleton";
import { FeedTheme } from "./feedTheme";
import type { PostReactionRow, PostWithMeta } from "./feedTypes";
import { ReactionViewersSheet } from "./ReactionViewersSheet";
import { TeacherFilterSheet } from "./TeacherFilterSheet";
import { isManualFeedPost } from "./feedUtils";
import { useFeedPosts } from "./useFeedPosts";

export type FeedScreenConfig = {
  title: string;
  subtitle?: string;
  staffFeed?: boolean;
  emptyHeading: string;
  emptyBody: string;
  teacherProfilePath: "/(tabs)/teacher/[teacherId]" | "/(staff)/teacher/[teacherId]";
  postDetailPath: "/(tabs)/feed/[postId]" | "/(staff)/feed/[postId]";
  showComposeFab?: boolean;
  composePath?: "/(staff)/feed/compose";
  allowDelete?: boolean;
};

export function FeedScreen({ config }: { config: FeedScreenConfig }) {
  const router = useRouter();
  const [filterTeacherId, setFilterTeacherId] = useState<string | null>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const reactionViewersSheetRef = useRef<BottomSheetModal>(null);
  const [reactionViewersTarget, setReactionViewersTarget] = useState<{
    reactions: PostReactionRow[];
    initialEmoji: string;
  } | null>(null);

  const {
    posts,
    teachers,
    loading,
    refreshing,
    loadingMore,
    error,
    currentUserId,
    handleRefresh,
    loadMore,
    toggleReactionForPost,
    removePost,
  } = useFeedPosts(filterTeacherId);

  const activeTeacher = teachers.find((t) => t.id === filterTeacherId);

  function handleLongPressReaction(post: PostWithMeta, emoji: string) {
    if (post.reactions.filter((r) => r.emoji === emoji).length === 0) return;
    setReactionViewersTarget({ reactions: post.reactions, initialEmoji: emoji });
    reactionViewersSheetRef.current?.present();
  }

  function handleDeletePost(post: PostWithMeta) {
    if (!isManualFeedPost(post.source_type)) return;
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error: err } = await supabase.schema("feed").rpc("delete_own_post", {
            p_post_id: post.id,
          });
          if (err) {
            Alert.alert("Error", `${err.code}: ${err.message}`);
          } else {
            removePost(post.id);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <FeedHeader
          title={config.title}
          subtitle={config.subtitle}
          filterActive={!!filterTeacherId}
          onFilterPress={() => filterSheetRef.current?.present()}
        />
        <FeedSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <FeedHeader
          title={config.title}
          subtitle={config.subtitle}
          filterActive={!!filterTeacherId}
          onFilterPress={() => filterSheetRef.current?.present()}
        />
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FeedHeader
        title={config.title}
        subtitle={config.subtitle}
        activeFilterLabel={activeTeacher?.full_name}
        filterActive={!!filterTeacherId}
        onFilterPress={() => filterSheetRef.current?.present()}
      />

      {posts.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyHeading}>{config.emptyHeading}</Text>
            <Text style={styles.emptyBody}>{config.emptyBody}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Brand.sage700} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={Brand.sage700} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <FeedPostCard
              post={item}
              currentUserId={currentUserId}
              teacherProfilePath={config.teacherProfilePath}
              onPress={() =>
                router.push({
                  pathname: config.postDetailPath as any,
                  params: { postId: item.id },
                })
              }
              onReact={(emoji) => toggleReactionForPost(item.id, emoji)}
              onLongPressReaction={(emoji) => handleLongPressReaction(item, emoji)}
              staffFeed={config.staffFeed}
              onDeletePress={
                config.allowDelete && isManualFeedPost(item.source_type)
                  ? () => handleDeletePost(item)
                  : undefined
              }
            />
          )}
        />
      )}

      {config.showComposeFab && config.composePath && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => router.push(config.composePath as any)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <TeacherFilterSheet
        ref={filterSheetRef}
        teachers={teachers}
        filterTeacherId={filterTeacherId}
        onSelect={(id) => {
          setFilterTeacherId(id);
          filterSheetRef.current?.dismiss();
        }}
      />

      {reactionViewersTarget && (
        <ReactionViewersSheet
          ref={reactionViewersSheetRef}
          reactions={reactionViewersTarget.reactions}
          initialEmoji={reactionViewersTarget.initialEmoji}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FeedTheme.canvas },
  listContent: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#e0ede2",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    ...FeedTheme.shadow,
  },
  emptyHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 17,
    color: "#3D5C4A",
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: BottomTabInset + 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
