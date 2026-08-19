import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Brand, FontFamilies } from "@/constants/theme";
import { isParentVisibleTeacher } from "@/lib/parent-visible-teachers";

type UserResult = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function searchUsers(query: string): Promise<UserResult[]> {
  if (query.trim().length < 2) return [];
  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .ilike("full_name", `%${query}%`)
    .in("role", ["teacher", "super_admin"])
    .limit(20);
  return (data ?? [])
    .filter((u: { full_name: string }) => isParentVisibleTeacher(u.full_name))
    .map((u: { id: string; full_name: string; profile_image_url: string | null }) => ({
      id: u.id,
      full_name: u.full_name,
      avatar_url: u.profile_image_url,
    }));
}

export default function ComposeScreen() {
  const router = useRouter();
  const [toSearch, setToSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [allTeachers, setAllTeachers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });

    supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, profile_image_url")
      .in("role", ["teacher", "super_admin"])
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        setAllTeachers(
          (data ?? [])
            .filter((u: { full_name: string }) => isParentVisibleTeacher(u.full_name))
            .map((u: { id: string; full_name: string; profile_image_url: string | null }) => ({
              id: u.id,
              full_name: u.full_name,
              avatar_url: u.profile_image_url,
            }))
        );
      });
  }, []);

  // Debounced search
  useEffect(() => {
    if (toSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(toSearch);
      setSearchResults(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [toSearch]);

  async function handleSelectUser(selected: UserResult) {
    if (!currentUserId || selecting) return;
    setSelecting(true);

    try {
      const { data: conversationId, error } = await supabase
        .rpc("find_or_create_conversation", { other_user_id: selected.id });

      if (error) {
        console.warn("Failed to start conversation:", error.message);
        return;
      }

      if (conversationId) {
        router.replace({
          pathname: "/(tabs)/messages/[id]",
          params: {
            id: conversationId,
            otherUserName: selected.full_name,
            otherUserAvatar: selected.avatar_url ?? "",
            otherUserId: selected.id,
          },
        });
      }
    } finally {
      setSelecting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>New Message</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color="#6b7280" />
        </Pressable>
      </View>

      {/* To: input row */}
      <View style={styles.toRow}>
        <Text style={styles.toLabel}>To:</Text>
        <TextInput
          style={styles.toInput}
          value={toSearch}
          onChangeText={setToSearch}
          placeholder="Search teachers & staff"
          placeholderTextColor="#9ca3af"
          autoFocus
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color={Brand.sage700} />}
      </View>

      <View style={styles.divider} />

      {/* Search results / suggestions */}
      {toSearch.trim().length < 2 ? (
        <FlatList
          data={allTeachers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            allTeachers.length > 0
              ? <Text style={styles.sectionHeader}>SUGGESTED</Text>
              : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
              onPress={() => handleSelectUser(item)}
              disabled={selecting}
            >
              <View style={styles.avatar}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
                )}
              </View>
              <Text style={styles.resultName}>{item.full_name}</Text>
              <Text style={styles.resultRole}>Teacher</Text>
            </Pressable>
          )}
        />
      ) : searchResults.length === 0 && !searching ? (
        <View style={styles.centered}>
          <Text style={styles.hintText}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
              onPress={() => handleSelectUser(item)}
              disabled={selecting}
            >
              <View style={styles.avatar}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
                )}
              </View>
              <Text style={styles.resultName}>{item.full_name}</Text>
              {selecting && (
                <ActivityIndicator size="small" color={Brand.sage700} />
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  heading: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
  },
  closeButton: { padding: 4 },
  pressed: { opacity: 0.6 },

  // To: row
  toRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  toLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#4b5563",
    flexShrink: 0,
  },
  toInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },

  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  hintText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  sectionHeader: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingBottom: 8,
    paddingTop: 4,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginLeft: 72,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: Brand.sage700,
  },
  resultName: {
    flex: 1,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  resultRole: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    flexShrink: 0,
  },
});
