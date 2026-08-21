import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import {
  ATT_FILTER_TABS,
  fetchParentStudentAttendanceRecords,
  filterAttendanceRecords,
  getAttendanceStatus,
  PROGRAM_CONFIG,
  type AttendanceFilter,
  type UnifiedAttendanceRecord,
  type UserMap,
} from "@/lib/parent-student-attendance";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────

type Student = { id: string; child_legal_name: string };

type UserProfile = { full_name: string; profile_image_url: string | null };

function formatYMD(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Components ───────────────────────────────────────────────────────────────

function UserAvatar({
  userId,
  userMap,
  size = 28,
}: {
  userId: string | null;
  userMap: UserMap;
  size?: number;
}) {
  const user = userId ? userMap[userId] : null;
  const radius = size / 2;
  if (user?.profile_image_url) {
    return (
      <Image
        source={{ uri: user.profile_image_url }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#E0EDE2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: FontFamilies.bodySemiBold, fontSize: size * 0.36, color: Brand.sage700 }}>
        {user ? getInitials(user.full_name) : "?"}
      </Text>
    </View>
  );
}

function PickupPersonAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const palette = ["#c2714f", "#8b6f47", "#7a9e7e", "#c4846b", "#b08d57", "#5E7C68"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const bg = palette[Math.abs(hash) % palette.length];
  const radius = size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: FontFamilies.bodySemiBold, fontSize: size * 0.36, color: "#ffffff" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function AttendanceStatusBadge({ record }: { record: UnifiedAttendanceRecord }) {
  const status = getAttendanceStatus(record);
  const badgeStyle =
    status === "absent"
      ? styles.statusBadgeAbsent
      : status === "picked_up"
        ? styles.statusBadgePickedUp
        : styles.statusBadgeAttended;
  const textStyle =
    status === "absent"
      ? styles.statusBadgeTextAbsent
      : status === "picked_up"
        ? styles.statusBadgeTextPickedUp
        : styles.statusBadgeTextAttended;
  const label =
    status === "absent" ? "Absent" : status === "picked_up" ? "Picked Up" : "Attended";

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusBadgeText, textStyle]}>{label}</Text>
    </View>
  );
}

function AttendanceDetailModal({
  record,
  userMap,
  onClose,
}: {
  record: UnifiedAttendanceRecord | null;
  userMap: UserMap;
  onClose: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (record) {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [record]);

  if (!record) return null;
  const cfg = PROGRAM_CONFIG[record.program];
  const status = getAttendanceStatus(record);
  const recordedByUser = userMap[record.recorded_by];
  const pickupByUser = record.pickup_recorded_by ? userMap[record.pickup_recorded_by] : null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalDate}>{formatYMD(record.date)}</Text>
          <Text style={[styles.modalProgram, { color: cfg.color }]}>{cfg.label}</Text>

          {status === "absent" ? (
            <View style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <View style={[styles.modalDot, { backgroundColor: "#b45309" }]} />
                <Text style={styles.modalLabel}>Marked absent</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Recorded by */}
              <View style={styles.modalRow}>
                <View style={styles.modalRowLeft}>
                  <View style={[styles.modalDot, { backgroundColor: Brand.sage700 }]} />
                  <Text style={styles.modalLabel}>Recorded by</Text>
                </View>
                <View style={styles.modalUserBlock}>
                  <UserAvatar userId={record.recorded_by} userMap={userMap} size={32} />
                  {recordedByUser && (
                    <Text style={styles.modalUserName} numberOfLines={1}>
                      {recordedByUser.full_name.split(" ")[0]}
                    </Text>
                  )}
                </View>
              </View>

              {record.picked_up_by_name && (
                <>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalRow}>
                    <View style={styles.modalRowLeft}>
                      <View style={[styles.modalDot, { backgroundColor: "#065f46" }]} />
                      <View style={{ gap: 2 }}>
                        <Text style={styles.modalLabel}>Picked Up</Text>
                        <Text style={styles.modalPickupName}>
                          {record.picked_up_by_name}
                          {record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}
                        </Text>
                      </View>
                    </View>
                    {record.pickup_recorded_by && (
                      <View style={styles.modalUserBlock}>
                        <UserAvatar userId={record.pickup_recorded_by} userMap={userMap} size={32} />
                        {pickupByUser && (
                          <Text style={styles.modalUserName} numberOfLines={1}>
                            {pickupByUser.full_name.split(" ")[0]}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function SkeletonRows() {
  return (
    <View style={{ gap: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={skeletonRowStyle}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="50%" height={13} borderRadius={4} />
            <SkeletonBox width="35%" height={11} borderRadius={4} />
          </View>
          <SkeletonBox width={72} height={24} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

const skeletonRowStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  backgroundColor: "#f9fafb",
  borderRadius: 12,
  padding: 12,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  gap: 10,
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [records, setRecords] = useState<UnifiedAttendanceRecord[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selectedRecord, setSelectedRecord] = useState<UnifiedAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .schema("admin")
          .from("students")
          .select("id, child_legal_name")
          .eq("parent_id", user.id)
          .eq("is_deleted", false);

        if (data && data.length > 0) {
          setStudents(data);
          setSelectedId(data[0].id);
        }
      } catch (e) {
        notifyError("parent-attendance-load", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const studentId = selectedId;
    setRecordsLoading(true);
    setFilter("all");

    async function fetchRecords() {
      try {
        const { records: merged, userMap: profiles } =
          await fetchParentStudentAttendanceRecords(studentId);
        setRecords(merged);
        setUserMap(profiles);
      } catch (e) {
        notifyError("parent-attendance-records", e);
      } finally {
        setRecordsLoading(false);
      }
    }

    fetchRecords();
  }, [selectedId]);

  const filtered = filterAttendanceRecords(records, filter);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonRows />
        ) : (
          <>
            {/* Student picker */}
            {students.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
                contentContainerStyle={{ flexDirection: "row", gap: 8 }}
              >
                {students.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedId(s.id)}
                    style={[styles.pill, selectedId === s.id && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, selectedId === s.id && styles.pillTextActive]}>
                      {s.child_legal_name.split(" ")[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Filter chips */}
            {!recordsLoading && records.length > 0 && (
              <View style={styles.filterRow}>
                {ATT_FILTER_TABS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, filter === key && styles.filterChipActive]}
                    onPress={() => setFilter(key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Records */}
            {recordsLoading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>No attendance records yet</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filtered.map((record) => {
                  const cfg = PROGRAM_CONFIG[record.program];
                  const status = getAttendanceStatus(record);
                  const isPickedUp = status === "picked_up";
                  return (
                    <TouchableOpacity
                      key={`${record.program}-${record.id}`}
                      style={[styles.row, { backgroundColor: cfg.bg }]}
                      onPress={() => setSelectedRecord(record)}
                      activeOpacity={0.75}
                    >
                      {isPickedUp && record.picked_up_by_name ? (
                        <PickupPersonAvatar name={record.picked_up_by_name} size={40} />
                      ) : (
                        <UserAvatar userId={record.recorded_by} userMap={userMap} size={40} />
                      )}
                      <View style={styles.rowLeft}>
                        <Text style={styles.dateText}>{formatYMD(record.date)}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                          <Text style={[styles.programLabel, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        {isPickedUp && record.picked_up_by_name && (
                          <Text style={styles.pickupSub} numberOfLines={1}>
                            {record.picked_up_by_name}
                            {record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}
                          </Text>
                        )}
                      </View>
                      <AttendanceStatusBadge record={record} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AttendanceDetailModal
        record={selectedRecord}
        userMap={userMap}
        onClose={() => setSelectedRecord(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.sage700,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#ffffff",
  },

  content: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: BottomTabInset + 16,
  },

  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pillActive: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  pillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
  },
  pillTextActive: {
    color: "#ffffff",
  },

  filterRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  filterChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  filterChipTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#ffffff",
  },

  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 10,
  },
  rowLeft: { flex: 1, gap: 3 },
  dateText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
  },
  programLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
  },
  pickupSub: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgePickedUp: { backgroundColor: "#d1fae5" },
  statusBadgeAttended: { backgroundColor: "#E0EDE2" },
  statusBadgeAbsent: { backgroundColor: "#fef3c7" },
  statusBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
  },
  statusBadgeTextPickedUp: { color: "#065f46" },
  statusBadgeTextAttended: { color: Brand.sage700 },
  statusBadgeTextAbsent: { color: "#b45309" },

  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  // Detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalDate: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
    textAlign: "center",
  },
  modalProgram: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    textAlign: "center",
    marginTop: -8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  modalTime: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  modalPickupName: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  modalUserBlock: {
    alignItems: "center",
    gap: 4,
  },
  modalUserName: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
    maxWidth: 60,
    textAlign: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  closeBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
});
