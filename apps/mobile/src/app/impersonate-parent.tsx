import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Brand, FontFamilies } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchImpersonateParents,
  filterParents,
  type ImpersonateParent,
} from "@/lib/impersonate-parents";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  enrolled: { label: "Enrolled", bg: "#D1FAE5", color: "#065F46" },
  enrolling: { label: "Enrolling", bg: "#DBEAFE", color: "#1E40AF" },
  in_review: { label: "In Review", bg: "#FEF3C7", color: "#92400E" },
  in_progress: { label: "In Progress", bg: "#F3F4F6", color: "#4B5563" },
  denied: { label: "Denied", bg: "#FEE2E2", color: "#991B1B" },
};

const PROGRAM_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  summer_26: { label: "Summer '26", bg: "#FEF3C7", color: "#92400E" },
  school_year_26_27: { label: "SY 26–27", bg: "#DBEAFE", color: "#1E40AF" },
  both: { label: "Summer & SY", bg: "#EDE9FE", color: "#5B21B6" },
  homeschool_drop_in: { label: "Drop-In", bg: "#D1FAE5", color: "#065F46" },
};

const AVATAR_COLORS = ["#FB7185", "#FBBF24", "#2DD4BF", "#A78BFA", "#38BDF8"];

function colorForId(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ParentRow({
  parent,
  onPress,
}: {
  parent: ImpersonateParent;
  onPress: () => void;
}) {
  const statusCfg = parent.status ? STATUS_CONFIG[parent.status] : null;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowHeader}>
        <View style={styles.nameRow}>
          {parent.hasPaid && (
            <Ionicons name="cash-outline" size={12} color="#34D399" />
          )}
          {parent.isSharedAccess && (
            <Ionicons name="people-outline" size={12} color="#60A5FA" />
          )}
          <Text style={styles.parentName} numberOfLines={1}>
            {parent.full_name ?? "—"}
          </Text>
        </View>
        {parent.email ? (
          <Text style={styles.email} numberOfLines={1}>
            {parent.email}
          </Text>
        ) : null}
      </View>

      {parent.children.length > 0 && (
        <View style={styles.childrenList}>
          {parent.children.map((child) => {
            const prog = child.program ? PROGRAM_BADGE[child.program] : null;
            return (
              <View key={child.id} style={styles.childRow}>
                {child.profileImageUrl ? (
                  <Image
                    source={{ uri: child.profileImageUrl }}
                    style={styles.childAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.childAvatar,
                      { backgroundColor: colorForId(child.id) },
                    ]}
                  >
                    <Text style={styles.childInitials}>
                      {initialsFor(child.name)}
                    </Text>
                  </View>
                )}
                <Text style={styles.childName} numberOfLines={1}>
                  {child.name}
                </Text>
                {prog && (
                  <View style={[styles.badge, { backgroundColor: prog.bg }]}>
                    <Text style={[styles.badgeText, { color: prog.color }]}>
                      {prog.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.metaRow}>
        {statusCfg && (
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.badgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        )}
      </View>

      {parent.isSharedAccess && parent.ownerName && (
        <Text style={styles.sharedNote}>Shared · {parent.ownerName}</Text>
      )}
    </Pressable>
  );
}

export default function ImpersonateScreen() {
  const router = useRouter();
  const { startImpersonation, userRole } = useAuth();
  const [parents, setParents] = useState<ImpersonateParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (userRole && userRole !== "super_admin") {
      router.replace("/(staff)/home");
      return;
    }
    fetchImpersonateParents()
      .then(setParents)
      .finally(() => setLoading(false));
  }, [userRole, router]);

  const sorted = useMemo(
    () => filterParents(parents, search),
    [parents, search],
  );

  const handleSelect = useCallback(
    async (parent: ImpersonateParent) => {
      if (selecting) return;
      setSelecting(true);
      try {
        await startImpersonation(parent.id, parent.full_name ?? "Parent");
        router.replace("/(tabs)/home");
      } finally {
        setSelecting(false);
      }
    },
    [selecting, startImpersonation, router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.title}>Impersonate Parent</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>
        Select a parent to preview their mobile dashboard (read-only).
      </Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or child..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Brand.sage700} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ParentRow parent={item} onPress={() => handleSelect(item)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No parents found</Text>
          }
        />
      )}

      {selecting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
  },
  list: {
    paddingBottom: 32,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowHeader: {
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  parentName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  email: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  childrenList: {
    marginTop: 10,
    gap: 8,
    paddingLeft: 4,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  childInitials: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
  },
  childName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    fontWeight: "600",
  },
  sharedNote: {
    marginTop: 4,
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
  },
  empty: {
    textAlign: "center",
    paddingVertical: 48,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  loader: {
    marginTop: 48,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});
