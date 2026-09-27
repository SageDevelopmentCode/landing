import { FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import type { PostReactionRow } from "./feedTypes";

interface ReactionViewersSheetProps {
  reactions: PostReactionRow[];
  initialEmoji: string;
}

export const ReactionViewersSheet = forwardRef<BottomSheetModal, ReactionViewersSheetProps>(
  ({ reactions, initialEmoji }, ref) => {
    const emojisWithReactions = [...new Set(reactions.map((r) => r.emoji))];
    const [selectedEmoji, setSelectedEmoji] = useState<string>(
      initialEmoji || (emojisWithReactions[0] ?? ""),
    );
    const [userNameById, setUserNameById] = useState<Record<string, string>>({});
    const [userProfileImageById, setUserProfileImageById] = useState<Record<string, string | null>>({});
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
      if (initialEmoji) setSelectedEmoji(initialEmoji);
    }, [initialEmoji]);

    useEffect(() => {
      if (reactions.length === 0) return;
      const userIds = [...new Set(reactions.map((r) => r.user_id))];
      setLoadingUsers(true);
      supabase
        .schema("admin")
        .from("users")
        .select("id, full_name, profile_image_url")
        .in("id", userIds)
        .then(({ data }) => {
          const nameMap: Record<string, string> = {};
          const imageMap: Record<string, string | null> = {};
          for (const u of data ?? []) {
            nameMap[u.id] = u.full_name;
            imageMap[u.id] = u.profile_image_url ?? null;
          }
          setUserNameById(nameMap);
          setUserProfileImageById(imageMap);
          setLoadingUsers(false);
        });
    }, [reactions]);

    useEffect(() => {
      if (emojisWithReactions.length > 0 && !emojisWithReactions.includes(selectedEmoji)) {
        setSelectedEmoji(emojisWithReactions[0]);
      }
    }, [reactions, emojisWithReactions, selectedEmoji]);

    const usersForEmoji = reactions.filter((r) => r.emoji === selectedEmoji);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["50%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reactions</Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={styles.listContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {emojisWithReactions.map((emoji) => {
              const count = reactions.filter((r) => r.emoji === emoji).length;
              const active = emoji === selectedEmoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setSelectedEmoji(emoji)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.tabEmoji}>{emoji}</Text>
                  <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {loadingUsers ? (
            <View style={styles.loadingRow}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            usersForEmoji.map((r) => (
              <View key={r.user_id} style={styles.userRow}>
                <AuthorAvatar
                  name={userNameById[r.user_id] ?? "User"}
                  userId={r.user_id}
                  profileImageUrl={userProfileImageById[r.user_id] ?? null}
                  size={38}
                />
                <Text style={styles.userName}>{userNameById[r.user_id] ?? "User"}</Text>
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

ReactionViewersSheet.displayName = "ReactionViewersSheet";

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  title: { fontFamily: FontFamilies.bodySemiBold, fontSize: 16, color: "#1f2937" },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, paddingVertical: 2 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: { borderColor: "#f29a8f", backgroundColor: "#fde8e6" },
  tabEmoji: { fontSize: 18 },
  tabCount: { fontFamily: FontFamilies.bodySemiBold, fontSize: 13, color: "#6b7280" },
  tabCountActive: { color: "#d47f75" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  userName: { fontFamily: FontFamilies.body, fontSize: 15, color: "#1f2937" },
  loadingRow: { paddingVertical: 20, alignItems: "center" },
  loadingText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#9ca3af" },
});
