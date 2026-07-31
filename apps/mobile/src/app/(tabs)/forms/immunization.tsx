import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ImmunizationFile {
  name: string;
  signedUrl: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CompletedBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="checkmark-circle" size={12} color="#047857" />
      <Text style={styles.badgeText}>Completed</Text>
    </View>
  );
}

function FileRow({ file }: { file: ImmunizationFile }) {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <TouchableOpacity
      style={styles.fileRow}
      activeOpacity={0.7}
      onPress={() => {
        if (file.signedUrl) {
          Linking.openURL(file.signedUrl);
        }
      }}
      disabled={!file.signedUrl}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons name="document-outline" size={22} color={Brand.sage700} />
        <Text style={styles.fileExt}>{ext}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={styles.fileMeta}>
          {[formatFileSize(file.sizeBytes), formatDate(file.updatedAt)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      {file.signedUrl ? (
        <Ionicons
          name="cloud-download-outline"
          size={20}
          color={Brand.sage700}
        />
      ) : (
        <Ionicons name="alert-circle-outline" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
}

export default function ImmunizationScreen() {
  const { studentId, parentId, storageStudentId } = useLocalSearchParams<{
    studentId: string;
    parentId: string;
    storageStudentId: string;
  }>();
  const router = useRouter();
  const [files, setFiles] = useState<ImmunizationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);

        // storageStudentId is admin.students.id (the storage path key)
        // falls back to studentId (applications.id) if not provided
        const pathStudentId = storageStudentId || studentId;
        const path = `${parentId}/${pathStudentId}/`;
        const { data: fileList, error: listErr } = await supabase.storage
          .from("immunization-records")
          .list(path);

        if (listErr || !fileList) {
          if (!cancelled) {
            setError(listErr?.message ?? "Failed to load files.");
            setLoading(false);
          }
          return;
        }

        // Generate signed URLs in parallel
        const signedResults = await Promise.all(
          fileList.map((f) =>
            supabase.storage
              .from("immunization-records")
              .createSignedUrl(`${path}/${f.name}`, 3600),
          ),
        );

        if (!cancelled) {
          const enriched: ImmunizationFile[] = fileList.map((f, idx) => ({
            name: f.name,
            signedUrl: signedResults[idx].data?.signedUrl ?? null,
            sizeBytes: f.metadata?.size ?? null,
            updatedAt: f.updated_at ?? null,
          }));
          setFiles(enriched);
          setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [studentId, parentId]),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.stickyHeader}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Immunization Records
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.fileRow}>
              <SkeletonBox width={44} height={44} borderRadius={8} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width="65%" height={14} borderRadius={4} />
                <SkeletonBox width="40%" height={11} borderRadius={4} />
              </View>
              <SkeletonBox width={20} height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.neutralCard}>
            <Text style={styles.neutralCardHeading}>No Files Found</Text>
            <Text style={styles.neutralCardBody}>
              No immunization records have been uploaded yet.
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.fileCountRow}>
            <Text style={styles.fileCountText}>
              {files.length} {files.length === 1 ? "file" : "files"}
            </Text>
            <Text style={styles.fileCountSub}>
              Links expire after 1 hour
            </Text>
          </View>
          <FlatList
            data={files}
            keyExtractor={(f) => f.name}
            renderItem={({ item }) => <FileRow file={item} />}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  pressed: { opacity: 0.5 },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: Brand.sage700,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#047857",
  },
  fileCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  fileCountText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  fileCountSub: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#C8DFCB",
    alignItems: "center",
    justifyContent: "center",
  },
  fileExt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: Brand.sage700,
    marginTop: 1,
  },
  fileName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  fileMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  neutralCard: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  neutralCardHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  neutralCardBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  skeletonContainer: { paddingTop: 4 },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
  },
  errorText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#be123c" },
});
