import { Brand, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrolledChild {
  id: string;                  // applications.id (application primary key — NOT used for form queries)
  student_id: string | null;   // used for ALL DB queries AND storage paths
  child_legal_name: string | null;
  program: string | null;
}

interface DocRow {
  key: string;
  label: string;
  pathname: string;
  params: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isContractComplete(
  map: Record<string, true>,
  contractId: number,
  totalSections: number,
): boolean {
  for (let i = 1; i <= totalSections; i++) {
    if (!map[`${contractId}-${i}`]) return false;
  }
  return true;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatProgram(program: string): string {
  // summer_26 → Summer '26
  const summer = program.match(/^summer[_\s](\d+)$/i);
  if (summer) return `Summer '${summer[1]}`;

  // school_year_26_27 → School Year '26-'27
  const schoolYear = program.match(/^school[_\s]year[_\s](\d+)[_\s](\d+)$/i);
  if (schoolYear) return `School Year '${schoolYear[1]}-'${schoolYear[2]}`;

  // both → Both
  if (program.toLowerCase() === "both") return "Both";

  // fallback: replace underscores and title-case
  return program
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CompletedBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="checkmark-circle" size={12} color="#047857" />
      <Text style={styles.badgeText}>Completed</Text>
    </View>
  );
}

function DocRowItem({ row }: { row: DocRow }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.docRow}
      activeOpacity={0.7}
      onPress={() =>
        router.push({ pathname: row.pathname as never, params: row.params })
      }
    >
      <Ionicons
        name="document-text-outline"
        size={18}
        color={Brand.sage700}
        style={{ marginRight: 4 }}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.docRowLabel}>{row.label}</Text>
        <CompletedBadge />
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function RowSkeleton() {
  return (
    <View style={styles.docRow}>
      <SkeletonBox width={18} height={18} borderRadius={4} />
      <View style={{ flex: 1, gap: 6, marginLeft: 4 }}>
        <SkeletonBox width="65%" height={14} borderRadius={4} />
        <SkeletonBox width={90} height={20} borderRadius={9999} />
      </View>
      <SkeletonBox width={16} height={16} borderRadius={4} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function FormsHomeScreen() {
  const { effectiveParentId } = useAuth();
  const hasLoaded = useRef(false);
  const rowsCache = useRef<Map<string, DocRow[]>>(new Map());
  const [children, setChildren] = useState<EnrolledChild[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [docRows, setDocRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 1: fetch user + enrolled children on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasLoaded.current && userId === effectiveParentId) return;
      let cancelled = false;

      async function load() {
        if (!effectiveParentId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        setDocRows([]);

        const { data: apps, error: appsErr } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("id, student_id, child_legal_name, program")
          .eq("user_id", effectiveParentId)
          .eq("approved", true);

        if (!cancelled) {
          if (appsErr) {
            notifyError("parent-forms-fetch", appsErr);
            setError(appsErr.message);
          } else {
            setUserId(effectiveParentId);
            setChildren(apps ?? []);
            setActiveIndex(0);
            hasLoaded.current = true;
          }
          setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [effectiveParentId]),
  );

  // Phase 2: build document rows whenever the selected child changes
  useEffect(() => {
    if (!userId || children.length === 0) return;

    const child = children[activeIndex];
    if (!child) return;

    // CRITICAL: use applications.student_id for ALL DB queries and storage paths
    const studentId = child.student_id;
    if (!studentId) return;

    // Return cached result immediately if already fetched
    const cached = rowsCache.current.get(studentId);
    if (cached) {
      setDocRows(cached);
      return;
    }

    let cancelled = false;
    setRowsLoading(true);
    setDocRows([]);

    async function buildRows() {
      const [
        sigsResult,
        hiResult,
        hsResult,
        mpResult,
        prResult,
        apResult,
        immResult,
      ] = await Promise.all([
        // Enrollment signatures
        supabase
          .schema("parent_app")
          .from("enrollment_signatures")
          .select("contract_id, section_id")
          .eq("parent_id", userId)
          .eq("student_id", studentId),

        // Health info
        supabase
          .schema("parent_app")
          .from("student_health_info")
          .select("id")
          .eq("parent_id", userId)
          .eq("student_id", studentId)
          .limit(1),

        // Health statement
        supabase
          .schema("parent_app")
          .from("student_health_statement")
          .select("id")
          .eq("parent_id", userId)
          .eq("student_id", studentId)
          .limit(1),

        // Medication plan
        supabase
          .schema("parent_app")
          .from("student_medication_plan")
          .select("id")
          .eq("parent_id", userId)
          .eq("student_id", studentId)
          .limit(1),

        // Photo release consent
        supabase
          .schema("parent_app")
          .from("student_photo_release_consent")
          .select("id")
          .eq("parent_id", userId)
          .eq("student_id", studentId)
          .limit(1),

        // Authorized pickup plan
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_plan")
          .select("id")
          .eq("parent_id", userId)
          .eq("student_id", studentId)
          .limit(1),

        // Immunization records (storage)
        supabase.storage
          .from("immunization-records")
          .list(`${userId}/${studentId}/`),
      ]);

      if (cancelled) return;

      // Build sig map: key = "contractId-sectionId"
      const sigMap: Record<string, true> = {};
      for (const s of sigsResult.data ?? []) {
        sigMap[`${s.contract_id}-${s.section_id}`] = true;
      }

      const rows: DocRow[] = [];

      // Contract 1 — 13 sections required
      if (isContractComplete(sigMap, 1, 13)) {
        rows.push({
          key: "contract-1",
          label: "Program Description, Parent Responsibilities & Key Policies",
          pathname: "/(tabs)/forms/contract",
          params: { studentId, userId: userId!, contractId: "1" },
        });
      }

      // Contract 2 — 4 sections required
      if (isContractComplete(sigMap, 2, 4)) {
        rows.push({
          key: "contract-2",
          label: "Community Agreement for Families and Staff",
          pathname: "/(tabs)/forms/contract",
          params: { studentId, userId: userId!, contractId: "2" },
        });
      }

      // Health Form — healthInfo row exists OR any sig with contract 3
      const hasSig3 = Object.keys(sigMap).some((k) => k.startsWith("3-"));
      if ((hiResult.data?.length ?? 0) > 0 || hasSig3) {
        rows.push({
          key: "health-form",
          label: "Emergency Contact, Health, and Immunization Form",
          pathname: "/(tabs)/forms/health-form",
          params: { studentId, userId: userId! },
        });
      }

      // Medication Plan
      if ((mpResult.data?.length ?? 0) > 0) {
        rows.push({
          key: "medication-plan",
          label: "Emergency Medication Plan",
          pathname: "/(tabs)/forms/medication-plan",
          params: { studentId, userId: userId! },
        });
      }

      // Photo Release
      if ((prResult.data?.length ?? 0) > 0) {
        rows.push({
          key: "photo-release",
          label: "Photo, Video, and Media Release",
          pathname: "/(tabs)/forms/photo-release",
          params: { studentId, userId: userId! },
        });
      }

      // Assumption of Risk — must have sig "6-1" specifically
      if (sigMap["6-1"]) {
        rows.push({
          key: "assumption-of-risk",
          label: "Assumption of Risk and Liability Release",
          pathname: "/(tabs)/forms/assumption-of-risk",
          params: { studentId, userId: userId! },
        });
      }

      // Authorized Pickup
      if ((apResult.data?.length ?? 0) > 0) {
        rows.push({
          key: "authorized-pickup",
          label: "Additional Authorized Pickup Person",
          pathname: "/(tabs)/forms/authorized-pickup",
          params: { studentId, userId: userId! },
        });
      }

      // Health Statement
      if ((hsResult.data?.length ?? 0) > 0) {
        rows.push({
          key: "health-statement",
          label: "Health Information Form",
          pathname: "/(tabs)/forms/health-statement",
          params: { studentId, userId: userId! },
        });
      }

      // Immunization (filter out empty folder placeholder)
      const realFiles = (immResult.data ?? []).filter(
        (f) => f.name !== ".emptyFolderPlaceholder",
      );
      if (realFiles.length > 0) {
        rows.push({
          key: "immunization",
          label: "Proof of Immunizations",
          pathname: "/(tabs)/forms/immunization",
          params: { studentId, userId: userId!, parentId: userId! },
        });
      }

      rowsCache.current.set(studentId, rows);
      setDocRows(rows);
      setRowsLoading(false);
    }

    buildRows();
    return () => {
      cancelled = true;
    };
  }, [activeIndex, userId, children]);

  // ---------------------------------------------------------------------------
  // Loading (initial)
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <SkeletonBox width={160} height={24} borderRadius={4} />
        </View>
        <View style={styles.pillScrollSkeleton}>
          <SkeletonBox width={110} height={48} borderRadius={9999} />
          <SkeletonBox width={110} height={48} borderRadius={9999} />
        </View>
        <View style={{ paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Forms & Docs</Text>
        </View>
        <View style={styles.centered}>
          <View style={styles.neutralCard}>
            <Text style={styles.neutralCardHeading}>No Children Found</Text>
            <Text style={styles.neutralCardBody}>
              Contact your school administrator to link your children to this
              account.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const child = children[activeIndex];
  const firstName = child.child_legal_name?.split(" ")[0] ?? "Student";

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Forms & Docs</Text>
      </View>

      {/* Child Switcher */}
      <View style={styles.pillScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {children.map((c, i) => {
            const active = i === activeIndex;
            const name = c.child_legal_name ?? "Student";
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setActiveIndex(i)}
                style={[styles.pill, active && styles.pillActive]}
                activeOpacity={0.75}
              >
                <View style={styles.pillInner}>
                  <View
                    style={[styles.pillAvatar, active && styles.pillAvatarActive]}
                  >
                    <Text
                      style={[
                        styles.pillAvatarText,
                        active && styles.pillAvatarTextActive,
                      ]}
                    >
                      {getInitials(name)}
                    </Text>
                  </View>
                  <View style={{ gap: 1 }}>
                    <Text
                      style={[styles.pillText, active && styles.pillTextActive]}
                    >
                      {name.split(" ")[0]}
                    </Text>
                    {c.program && (
                      <Text
                        style={[
                          styles.pillGrade,
                          active && styles.pillGradeActive,
                        ]}
                      >
                        {formatProgram(c.program)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pillFade}
          pointerEvents="none"
        />
      </View>

      {/* Document List */}
      {rowsLoading ? (
        <View style={{ paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </View>
      ) : docRows.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.neutralCard}>
            <Text style={styles.neutralCardHeading}>No Documents Yet</Text>
            <Text style={styles.neutralCardBody}>
              No completed documents for {firstName} yet. Documents will appear
              here once they are submitted.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={docRows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) => <DocRowItem row={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pageTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: Brand.sage700,
  },
  pillScrollWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pillScroll: {
    flexGrow: 0,
  },
  pillFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
  },
  pillScrollSkeleton: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pillRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  pillActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(74,124,89,0.08)",
  },
  pillInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  pillAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  pillAvatarActive: { backgroundColor: "rgba(74,124,89,0.15)" },
  pillAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
  },
  pillAvatarTextActive: { color: Brand.sage700 },
  pillText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#6b7280" },
  pillTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  pillGrade: { fontFamily: FontFamilies.body, fontSize: 11, color: "#9ca3af" },
  pillGradeActive: { color: Brand.sage700 },
  listContent: { paddingBottom: 40 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  docRowLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
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
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
  },
});
