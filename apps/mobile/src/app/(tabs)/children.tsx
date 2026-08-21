import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { notifyDiscord, notifyError } from "@/lib/discord";
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
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import {
  Animated,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEACHER_PHOTOS: Record<string, ImageSourcePropType> = {
  "Sabrina Obnamia": require("@/assets/images/Headshot.webp"),
  "Zelinda Melo": require("@/assets/images/team/Zelinda.webp"),
  "Paige Wood": require("@/assets/images/team/Paige.webp"),
};

interface Student {
  id: string;
  child_legal_name: string;
  dob_day: string | null;
  dob_month: string | null;
  dob_year: string | null;
  child_grade: string | null;
  has_allergies: string | null;
  allergies_description: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_emergency_medications: string | null;
  emergency_medications_description: string | null;
  learning_style: string | null;
  special_interests: string | null;
  strengths_interests: string | null;
  current_challenges: string | null;
  regulation_strategies: string | null;
  dysregulation_response: string | null;
  profile_image_url: string | null;
}

interface TeacherAssignment {
  id: string;
  teacher_id: string;
  student_id: string;
  program: string | null;
  classroom: string | null;
  teacher_name: string | null;
}

type Tab = "teacher" | "attendance" | "learning" | "pickup" | "profile";

type UserProfile = { full_name: string; profile_image_url: string | null };

interface PickupPlan {
  id: string;
  student_id: string;
  parent_id: string;
  date_of_request: string | null;
  effective_until: string | null;
}

interface PickupPerson {
  id: string;
  student_id: string;
  parent_id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  dl_state_id_number: string | null;
  vehicle_info: string | null;
  license_plate_state: string | null;
  sort_order: number | null;
}

type LocalPerson = {
  tempId: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  dl_state_id_number: string;
  vehicle_info: string;
  license_plate_state: string;
};

type LearningNoteCategory = "academic" | "social" | "behavioral" | "health" | "other";

interface LearningNote {
  id: string;
  parent_id: string;
  student_id: string;
  category: LearningNoteCategory;
  note_text: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

function formatYMD(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CATEGORY_LABELS: Record<LearningNoteCategory, string> = {
  academic: "Academic",
  social: "Social",
  behavioral: "Behavioral",
  health: "Health",
  other: "Other",
};

const CATEGORY_COLORS: Record<LearningNoteCategory, { bg: string; text: string }> = {
  academic:   { bg: "#dbeafe", text: "#1d4ed8" },
  social:     { bg: "#ede9fe", text: "#6d28d9" },
  behavioral: { bg: "#ffedd5", text: "#c2410c" },
  health:     { bg: "#fee2e2", text: "#dc2626" },
  other:      { bg: "#f3f4f6", text: "#4b5563" },
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TeacherTab({
  studentId,
  teachersByStudent,
}: {
  studentId: string;
  teachersByStudent: Record<string, TeacherAssignment[]>;
}) {
  const router = useRouter();
  const [startingConvId, setStartingConvId] = useState<string | null>(null);
  const teachers = teachersByStudent[studentId] ?? [];

  if (teachers.length === 0) {
    return (
      <View style={styles.neutralCard}>
        <Text style={styles.neutralCardHeading}>Teacher Information</Text>
        <Text style={styles.neutralCardBody}>
          No teacher has been assigned yet. Contact the school office for more
          information.
        </Text>
      </View>
    );
  }

  async function handleMessageTeacher(teacherId: string, teacherName: string | null) {
    if (startingConvId) return;
    setStartingConvId(teacherId);
    try {
      const { data: conversationId, error } = await supabase
        .rpc("find_or_create_conversation", { other_user_id: teacherId });

      if (error) { notifyError("parent-children-message-teacher", error); return; }

      if (conversationId) {
        router.push({
          pathname: "/(tabs)/messages/[id]",
          params: {
            id: conversationId,
            otherUserName: teacherName ?? "",
            otherUserAvatar: "",
            otherUserId: teacherId,
          },
        });
      }
    } catch (e) {
      notifyError("parent-children-message-teacher", e);
    } finally {
      setStartingConvId(null);
    }
  }

  // Group teachers by program
  const byProgram: Record<string, TeacherAssignment[]> = {};
  for (const t of teachers) {
    const key = t.program ?? "Unassigned";
    if (!byProgram[key]) byProgram[key] = [];
    byProgram[key].push(t);
  }

  return (
    <View style={{ gap: 20 }}>
      {Object.entries(byProgram).map(([program, group]) => (
        <View key={program} style={{ gap: 10 }}>
          <Text style={styles.teacherSectionLabel}>{program.replace(/_/g, " ")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teacherScrollRow}
          >
            {group.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.teacherProfileCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/teacher/[teacherId]" as any,
                    params: {
                      teacherId: t.teacher_id,
                      teacherName: t.teacher_name ?? "",
                      classroom: t.classroom ?? "",
                      program: t.program ?? "",
                    },
                  })
                }
              >
                {/* Avatar */}
                <View style={styles.teacherProfileAvatar}>
                  {t.teacher_name && TEACHER_PHOTOS[t.teacher_name] ? (
                    <Image
                      source={TEACHER_PHOTOS[t.teacher_name]}
                      style={styles.teacherProfileImage}
                    />
                  ) : (
                    <Text style={styles.teacherProfileInitials}>
                      {t.teacher_name
                        ? t.teacher_name
                            .trim()
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0].toUpperCase())
                            .join("")
                        : "T"}
                    </Text>
                  )}
                </View>

                {/* Name + classroom */}
                <Text style={styles.teacherProfileName} numberOfLines={2}>
                  {t.teacher_name ?? "Unknown Teacher"}
                </Text>
                {t.classroom && (
                  <Text style={styles.teacherProfileSub} numberOfLines={1}>
                    {t.classroom.includes("_")
                      ? t.classroom.split("_").join(" - ") + " Grade"
                      : t.classroom}
                  </Text>
                )}

                {/* Action buttons */}
                <View style={styles.teacherCardActions}>
                  <TouchableOpacity
                    style={styles.teacherMessageBtn}
                    activeOpacity={0.75}
                    onPress={() => handleMessageTeacher(t.teacher_id, t.teacher_name)}
                    disabled={startingConvId === t.teacher_id}
                  >
                    <Ionicons name="chatbubble-outline" size={15} color={Brand.sage700} />
                    <Text style={styles.teacherMessageBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

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
        style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}
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
      ? styles.attStatusBadgeAbsent
      : status === "picked_up"
        ? styles.attStatusBadgePickedUp
        : styles.attStatusBadgeAttended;
  const textStyle =
    status === "absent"
      ? styles.attStatusBadgeTextAbsent
      : status === "picked_up"
        ? styles.attStatusBadgeTextPickedUp
        : styles.attStatusBadgeTextAttended;
  const label =
    status === "absent" ? "Absent" : status === "picked_up" ? "Picked Up" : "Attended";

  return (
    <View style={[styles.attStatusBadge, badgeStyle]}>
      <Text style={[styles.attStatusBadgeText, textStyle]}>{label}</Text>
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
      <Animated.View style={[styles.attDetailOverlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.attDetailSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.attDetailHandle} />
          <Text style={styles.attDetailDate}>{formatYMD(record.date)}</Text>
          <Text style={[styles.attDetailProgram, { color: cfg.color }]}>{cfg.label}</Text>

          {status === "absent" ? (
            <View style={styles.attDetailRow}>
              <View style={styles.attDetailRowLeft}>
                <View style={[styles.attDetailDot, { backgroundColor: "#b45309" }]} />
                <Text style={styles.attDetailLabel}>Marked absent</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Recorded by */}
              <View style={styles.attDetailRow}>
                <View style={styles.attDetailRowLeft}>
                  <View style={[styles.attDetailDot, { backgroundColor: Brand.sage700 }]} />
                  <Text style={styles.attDetailLabel}>Recorded by</Text>
                </View>
                <View style={styles.attDetailUserBlock}>
                  <UserAvatar userId={record.recorded_by} userMap={userMap} size={32} />
                  {recordedByUser && (
                    <Text style={styles.attDetailUserName} numberOfLines={1}>
                      {recordedByUser.full_name.split(" ")[0]}
                    </Text>
                  )}
                </View>
              </View>

              {record.picked_up_by_name && (
                <>
                  <View style={styles.attDetailDivider} />
                  <View style={styles.attDetailRow}>
                    <View style={styles.attDetailRowLeft}>
                      <View style={[styles.attDetailDot, { backgroundColor: "#065f46" }]} />
                      <View style={{ gap: 2 }}>
                        <Text style={styles.attDetailLabel}>Picked Up</Text>
                        <Text style={styles.attDetailPickupName}>
                          {record.picked_up_by_name}
                          {record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}
                        </Text>
                      </View>
                    </View>
                    {record.pickup_recorded_by && (
                      <View style={styles.attDetailUserBlock}>
                        <UserAvatar userId={record.pickup_recorded_by} userMap={userMap} size={32} />
                        {pickupByUser && (
                          <Text style={styles.attDetailUserName} numberOfLines={1}>
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

          <TouchableOpacity style={styles.attDetailCloseBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.attDetailCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function AttendanceTab({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [attLoading, setAttLoading] = useState(true);
  const [history, setHistory] = useState<UnifiedAttendanceRecord[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selectedRecord, setSelectedRecord] = useState<UnifiedAttendanceRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFilter("all");

    async function fetchAttendance() {
      setAttLoading(true);

      try {
        const { records: merged, userMap: profiles } =
          await fetchParentStudentAttendanceRecords(studentId);
        if (cancelled) return;
        setHistory(merged);
        setUserMap(profiles);
      } catch (e) {
        notifyError("parent-children-attendance", e);
        if (!cancelled) {
          setHistory([]);
          setUserMap({});
        }
      } finally {
        if (!cancelled) setAttLoading(false);
      }
    }

    fetchAttendance();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const filtered = filterAttendanceRecords(history, filter);

  if (attLoading) {
    return (
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.attHistoryRow}>
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

  return (
    <View style={{ gap: 10 }}>
      {/* Filter chips */}
      {history.length > 0 && (
        <View style={styles.attFilterRow}>
          {ATT_FILTER_TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.attFilterChip, filter === key && styles.attFilterChipActive]}
              onPress={() => setFilter(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.attFilterChipText, filter === key && styles.attFilterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={styles.attEmptyState}>
          <Ionicons name="calendar-outline" size={32} color="#d1d5db" />
          <Text style={styles.attEmptyText}>No attendance records yet</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {filtered.map((record) => {
            const cfg = PROGRAM_CONFIG[record.program];
            const status = getAttendanceStatus(record);
            const isPickedUp = status === "picked_up";
            return (
              <TouchableOpacity
                key={`${record.program}-${record.id}`}
                style={[styles.attHistoryRow, { backgroundColor: cfg.bg, borderColor: "#e5e7eb" }]}
                onPress={() => setSelectedRecord(record)}
                activeOpacity={0.75}
              >
                {isPickedUp && record.picked_up_by_name ? (
                  <PickupPersonAvatar name={record.picked_up_by_name} size={40} />
                ) : (
                  <UserAvatar userId={record.recorded_by} userMap={userMap} size={40} />
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.attHistoryDate}>{formatYMD(record.date)}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[styles.attHistoryTime, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  {isPickedUp && record.picked_up_by_name && (
                    <Text style={styles.attHistoryTime} numberOfLines={1}>
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

      <AttendanceDetailModal
        record={selectedRecord}
        userMap={userMap}
        onClose={() => setSelectedRecord(null)}
      />
    </View>
  );
}

function NoteModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: LearningNote | null;
  onSave: (category: LearningNoteCategory, noteText: string) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [category, setCategory] = useState<LearningNoteCategory>("academic");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (visible) {
      setCategory(initial?.category ?? "academic");
      setNoteText(initial?.note_text ?? "");
      slideAnim.setValue(600);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const canSave = noteText.trim().length > 0;
  const categories: LearningNoteCategory[] = ["academic", "social", "behavioral", "health", "other"];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View
            style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>
              {initial ? "Edit Request" : "Add Special Request"}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 14 }}
            >
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.noteCategoryRow}
                >
                  {categories.map((cat) => {
                    const active = cat === category;
                    const colors = CATEGORY_COLORS[cat];
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.noteCategoryPill,
                          active && { backgroundColor: colors.bg, borderColor: colors.text },
                        ]}
                        onPress={() => setCategory(cat)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.noteCategoryPillText,
                            active && { color: colors.text },
                          ]}
                        >
                          {CATEGORY_LABELS[cat]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Note</Text>
                <TextInput
                  style={styles.noteModalTextInput}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Let teachers know what your child needs…"
                  placeholderTextColor="#9ca3af"
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.attActionButton, !canSave && { opacity: 0.4 }]}
                onPress={() => canSave && onSave(category, noteText)}
                disabled={!canSave}
                activeOpacity={0.75}
              >
                <Text style={styles.attActionButtonText}>
                  {initial ? "Save Changes" : "Save Request"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attDetailCloseBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type LearningOverviewForm = {
  learning_style: string;
  special_interests: string;
  strengths_interests: string;
  current_challenges: string;
};

function LearningOverviewModal({
  visible,
  student,
  onSave,
  onClose,
}: {
  visible: boolean;
  student: Student;
  onSave: (form: LearningOverviewForm) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [form, setForm] = useState<LearningOverviewForm>({
    learning_style: "",
    special_interests: "",
    strengths_interests: "",
    current_challenges: "",
  });

  useEffect(() => {
    if (visible) {
      setForm({
        learning_style: student.learning_style ?? "",
        special_interests: student.special_interests ?? "",
        strengths_interests: student.strengths_interests ?? "",
        current_challenges: student.current_challenges ?? "",
      });
      slideAnim.setValue(600);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const set = (key: keyof LearningOverviewForm) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View
            style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>Edit Learning Overview</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 14 }}
            >
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Learning Style</Text>
                <TextInput
                  style={styles.noteModalTextInput}
                  value={form.learning_style}
                  onChangeText={set("learning_style")}
                  placeholder="e.g. Visual, Hands-on, Auditory"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Special Interests</Text>
                <TextInput
                  style={styles.noteModalTextInput}
                  value={form.special_interests}
                  onChangeText={set("special_interests")}
                  placeholder="e.g. Dinosaurs, Music, Sports"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Strengths & Interests</Text>
                <TextInput
                  style={styles.noteModalTextInput}
                  value={form.strengths_interests}
                  onChangeText={set("strengths_interests")}
                  placeholder="What your child does well or enjoys"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Current Challenges</Text>
                <TextInput
                  style={styles.noteModalTextInput}
                  value={form.current_challenges}
                  onChangeText={set("current_challenges")}
                  placeholder="Areas where your child needs extra support"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={styles.attActionButton}
                onPress={() => onSave(form)}
                activeOpacity={0.75}
              >
                <Text style={styles.attActionButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attDetailCloseBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LearningTab({
  student,
  userId,
  studentName,
  onStudentUpdate,
}: {
  student: Student;
  userId: string;
  studentName: string;
  onStudentUpdate: (fields: Partial<Student>) => void;
}) {
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<LearningNote | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingOverview, setSavingOverview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotes() {
      setNotesLoading(true);
      const { data } = await supabase
        .schema("parent_app")
        .from("student_learning_notes")
        .select("*")
        .eq("student_id", student.id)
        .eq("parent_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setNotes((data as LearningNote[]) ?? []);
        setNotesLoading(false);
      }
    }

    fetchNotes();
    return () => { cancelled = true; };
  }, [student.id, userId]);

  async function handleNoteSave(category: LearningNoteCategory, noteText: string) {
    if (savingNote) return;
    setSavingNote(true);

    if (editingNote) {
      const { data } = await supabase
        .schema("parent_app")
        .from("student_learning_notes")
        .update({ category, note_text: noteText.trim(), updated_at: new Date().toISOString() })
        .eq("id", editingNote.id)
        .eq("parent_id", userId)
        .select()
        .single();
      if (data) {
        setNotes((prev) => prev.map((n) => (n.id === data.id ? data as LearningNote : n)));
      }
    } else {
      const { data } = await supabase
        .schema("parent_app")
        .from("student_learning_notes")
        .insert({ parent_id: userId, student_id: student.id, category, note_text: noteText.trim() })
        .select()
        .single();
      if (data) {
        setNotes((prev) => [data as LearningNote, ...prev]);
        notifyDiscord({ type: "special_request_created", data: { studentName, category, noteText: noteText.trim() } });
      }
    }

    setSavingNote(false);
    setShowNoteModal(false);
    setEditingNote(null);
  }

  async function handleNoteDelete(noteId: string) {
    await supabase
      .schema("parent_app")
      .from("student_learning_notes")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("parent_id", userId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleOverviewSave(form: LearningOverviewForm) {
    if (savingOverview) return;
    setSavingOverview(true);
    const { data, error } = await supabase.rpc("update_student_profile_fields", {
      p_student_id: student.id,
      p_learning_style: form.learning_style.trim() || null,
      p_special_interests: form.special_interests.trim() || null,
      p_strengths_interests: form.strengths_interests.trim() || null,
      p_current_challenges: form.current_challenges.trim() || null,
    });
    setSavingOverview(false);
    if (error || (data as any)?.error) {
      notifyError("parent-children-learning-overview-save", error ?? (data as any));
      return;
    }
    onStudentUpdate({
      learning_style: form.learning_style.trim() || null,
      special_interests: form.special_interests.trim() || null,
      strengths_interests: form.strengths_interests.trim() || null,
      current_challenges: form.current_challenges.trim() || null,
    });
    setShowEditModal(false);
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionCard}>
        <View style={[styles.pickupSectionRow, { marginBottom: 4 }]}>
          <Text style={styles.sectionCardTitle}>Learning Overview</Text>
          <TouchableOpacity
            style={styles.pickupAddBtn}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="pencil-outline" size={13} color={Brand.sage700} />
            <Text style={styles.pickupAddBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="Learning Style" value={student.learning_style} />
        <InfoRow label="Special Interests" value={student.special_interests} />
        <InfoRow
          label="Strengths & Interests"
          value={student.strengths_interests}
        />
        <InfoRow label="Current Challenges" value={student.current_challenges} />
      </View>

      {/* Special Requests header */}
      <View style={styles.pickupSectionRow}>
        <Text style={styles.attSectionLabel}>
          Special Requests{notes.length > 0 ? ` (${notes.length})` : ""}
        </Text>
        <TouchableOpacity
          style={styles.pickupAddBtn}
          onPress={() => { setEditingNote(null); setShowNoteModal(true); }}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={15} color={Brand.sage700} />
          <Text style={styles.pickupAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {notesLoading ? (
        <View style={{ gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} width="100%" height={72} borderRadius={12} />
          ))}
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.attEmptyState}>
          <Ionicons name="clipboard-outline" size={32} color="#d1d5db" />
          <Text style={styles.attEmptyText}>No special requests yet</Text>
          <Text style={[styles.attEmptyText, { textAlign: "center", maxWidth: 220 }]}>
            Let teachers know if your child needs any extra support
          </Text>
          <TouchableOpacity
            style={[styles.attActionButton, { paddingHorizontal: 24, marginTop: 4 }]}
            onPress={() => { setEditingNote(null); setShowNoteModal(true); }}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.attActionButtonText}>Add Your First Request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {notes.map((note) => {
            const colors = CATEGORY_COLORS[note.category];
            const d = new Date(note.created_at);
            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <View key={note.id} style={styles.noteRow}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.noteDate}>{dateStr}</Text>
                    <View style={[styles.noteBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.noteBadgeText, { color: colors.text }]}>
                        {CATEGORY_LABELS[note.category]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.noteText}>{note.note_text}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={styles.pickupPersonActionBtn}
                    onPress={() => { setEditingNote(note); setShowNoteModal(true); }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="pencil-outline" size={14} color={Brand.sage700} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickupPersonActionBtn, styles.pickupPersonDeleteBtn]}
                    onPress={() => handleNoteDelete(note.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="close" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <NoteModal
        visible={showNoteModal}
        initial={editingNote}
        onSave={handleNoteSave}
        onClose={() => { setShowNoteModal(false); setEditingNote(null); }}
      />

      <LearningOverviewModal
        visible={showEditModal}
        student={student}
        onSave={handleOverviewSave}
        onClose={() => setShowEditModal(false)}
      />
    </View>
  );
}

type YesNo = "yes" | "no" | "";

function YesNoPills({
  value,
  onChange,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {(["yes", "no"] as YesNo[]).map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.noteCategoryPill,
              active && { backgroundColor: "#E0EDE2", borderColor: Brand.sage700 },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.noteCategoryPillText,
                active && { color: Brand.sage700 },
              ]}
            >
              {opt === "yes" ? "Yes" : "No"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MedicalInfoModal({
  visible,
  student,
  onSave,
  onClose,
}: {
  visible: boolean;
  student: Student;
  onSave: (fields: Partial<Student>) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [saving, setSaving] = useState(false);
  const [hasAllergies, setHasAllergies] = useState<YesNo>("");
  const [allergiesDesc, setAllergiesDesc] = useState("");
  const [hasMedical, setHasMedical] = useState<YesNo>("");
  const [medicalDesc, setMedicalDesc] = useState("");
  const [hasEmergencyMeds, setHasEmergencyMeds] = useState<YesNo>("");
  const [emergencyMedsDesc, setEmergencyMedsDesc] = useState("");

  useEffect(() => {
    if (visible) {
      setHasAllergies((student.has_allergies as YesNo) ?? "");
      setAllergiesDesc(student.allergies_description ?? "");
      setHasMedical((student.has_medical_conditions as YesNo) ?? "");
      setMedicalDesc(student.medical_conditions_description ?? "");
      setHasEmergencyMeds((student.has_emergency_medications as YesNo) ?? "");
      setEmergencyMedsDesc(student.emergency_medications_description ?? "");
      slideAnim.setValue(600);
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("update_student_profile_fields", {
      p_student_id: student.id,
      p_has_allergies: hasAllergies || null,
      p_allergies_description: hasAllergies === "yes" ? (allergiesDesc.trim() || null) : null,
      p_has_medical_conditions: hasMedical || null,
      p_medical_conditions_description: hasMedical === "yes" ? (medicalDesc.trim() || null) : null,
      p_has_emergency_medications: hasEmergencyMeds || null,
      p_emergency_medications_description: hasEmergencyMeds === "yes" ? (emergencyMedsDesc.trim() || null) : null,
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      notifyError("parent-children-medical-info-save", error ?? (data as any));
      return;
    }
    onSave({
      has_allergies: hasAllergies || null,
      allergies_description: hasAllergies === "yes" ? (allergiesDesc.trim() || null) : null,
      has_medical_conditions: hasMedical || null,
      medical_conditions_description: hasMedical === "yes" ? (medicalDesc.trim() || null) : null,
      has_emergency_medications: hasEmergencyMeds || null,
      emergency_medications_description: hasEmergencyMeds === "yes" ? (emergencyMedsDesc.trim() || null) : null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>Edit Medical Info</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Has Allergies?</Text>
                <YesNoPills value={hasAllergies} onChange={setHasAllergies} />
              </View>
              {hasAllergies === "yes" && (
                <View style={styles.personField}>
                  <Text style={styles.personFieldLabel}>Allergies Description</Text>
                  <TextInput style={styles.noteModalTextInput} value={allergiesDesc} onChangeText={setAllergiesDesc} placeholder="Describe allergies…" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
                </View>
              )}
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Has Medical Conditions?</Text>
                <YesNoPills value={hasMedical} onChange={setHasMedical} />
              </View>
              {hasMedical === "yes" && (
                <View style={styles.personField}>
                  <Text style={styles.personFieldLabel}>Medical Conditions Description</Text>
                  <TextInput style={styles.noteModalTextInput} value={medicalDesc} onChangeText={setMedicalDesc} placeholder="Describe medical conditions…" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
                </View>
              )}
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Has Emergency Medications?</Text>
                <YesNoPills value={hasEmergencyMeds} onChange={setHasEmergencyMeds} />
              </View>
              {hasEmergencyMeds === "yes" && (
                <View style={styles.personField}>
                  <Text style={styles.personFieldLabel}>Emergency Medications Description</Text>
                  <TextInput style={styles.noteModalTextInput} value={emergencyMedsDesc} onChangeText={setEmergencyMedsDesc} placeholder="Describe emergency medications…" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
                </View>
              )}
            </ScrollView>
            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={[styles.attActionButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.75}>
                <Text style={styles.attActionButtonText}>{saving ? "Saving…" : "Save Changes"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attDetailCloseBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LearningProfileModal({
  visible,
  student,
  onSave,
  onClose,
}: {
  visible: boolean;
  student: Student;
  onSave: (fields: Partial<Student>) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [saving, setSaving] = useState(false);
  const [learningStyle, setLearningStyle] = useState("");
  const [specialInterests, setSpecialInterests] = useState("");
  const [strengthsInterests, setStrengthsInterests] = useState("");

  useEffect(() => {
    if (visible) {
      setLearningStyle(student.learning_style ?? "");
      setSpecialInterests(student.special_interests ?? "");
      setStrengthsInterests(student.strengths_interests ?? "");
      slideAnim.setValue(600);
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("update_student_profile_fields", {
      p_student_id: student.id,
      p_learning_style: learningStyle.trim() || null,
      p_special_interests: specialInterests.trim() || null,
      p_strengths_interests: strengthsInterests.trim() || null,
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      notifyError("parent-children-learning-profile-save", error ?? (data as any));
      return;
    }
    onSave({
      learning_style: learningStyle.trim() || null,
      special_interests: specialInterests.trim() || null,
      strengths_interests: strengthsInterests.trim() || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>Edit Learning Profile</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Learning Style</Text>
                <TextInput style={styles.noteModalTextInput} value={learningStyle} onChangeText={setLearningStyle} placeholder="e.g. Visual, Hands-on, Auditory" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
              </View>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Special Interests</Text>
                <TextInput style={styles.noteModalTextInput} value={specialInterests} onChangeText={setSpecialInterests} placeholder="e.g. Dinosaurs, Music, Sports" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
              </View>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Strengths & Interests</Text>
                <TextInput style={styles.noteModalTextInput} value={strengthsInterests} onChangeText={setStrengthsInterests} placeholder="What your child does well or enjoys" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
              </View>
            </ScrollView>
            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={[styles.attActionButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.75}>
                <Text style={styles.attActionButtonText}>{saving ? "Saving…" : "Save Changes"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attDetailCloseBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RegulationModal({
  visible,
  student,
  onSave,
  onClose,
}: {
  visible: boolean;
  student: Student;
  onSave: (fields: Partial<Student>) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [saving, setSaving] = useState(false);
  const [regulationStrategies, setRegulationStrategies] = useState("");
  const [dysregulationResponse, setDysregulationResponse] = useState("");

  useEffect(() => {
    if (visible) {
      setRegulationStrategies(student.regulation_strategies ?? "");
      setDysregulationResponse(student.dysregulation_response ?? "");
      slideAnim.setValue(600);
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("update_student_profile_fields", {
      p_student_id: student.id,
      p_regulation_strategies: regulationStrategies.trim() || null,
      p_dysregulation_response: dysregulationResponse.trim() || null,
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      notifyError("parent-children-regulation-save", error ?? (data as any));
      return;
    }
    onSave({
      regulation_strategies: regulationStrategies.trim() || null,
      dysregulation_response: dysregulationResponse.trim() || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>Edit Regulation</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Regulation Strategies</Text>
                <TextInput style={styles.noteModalTextInput} value={regulationStrategies} onChangeText={setRegulationStrategies} placeholder="What helps your child self-regulate?" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
              </View>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Dysregulation Response</Text>
                <TextInput style={styles.noteModalTextInput} value={dysregulationResponse} onChangeText={setDysregulationResponse} placeholder="How does your child respond when dysregulated?" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
              </View>
            </ScrollView>
            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={[styles.attActionButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.75}>
                <Text style={styles.attActionButtonText}>{saving ? "Saving…" : "Save Changes"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attDetailCloseBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SupportModal({
  visible,
  student,
  onSave,
  onClose,
}: {
  visible: boolean;
  student: Student;
  onSave: (fields: Partial<Student>) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [saving, setSaving] = useState(false);
  const [currentChallenges, setCurrentChallenges] = useState("");

  useEffect(() => {
    if (visible) {
      setCurrentChallenges(student.current_challenges ?? "");
      slideAnim.setValue(600);
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("update_student_profile_fields", {
      p_student_id: student.id,
      p_current_challenges: currentChallenges.trim() || null,
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      notifyError("parent-children-support-save", error ?? (data as any));
      return;
    }
    onSave({ current_challenges: currentChallenges.trim() || null });
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>Edit Support</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Current Challenges</Text>
                <TextInput style={styles.noteModalTextInput} value={currentChallenges} onChangeText={setCurrentChallenges} placeholder="Areas where your child needs extra support" placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
              </View>
            </ScrollView>
            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={[styles.attActionButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.75}>
                <Text style={styles.attActionButtonText}>{saving ? "Saving…" : "Save Changes"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attDetailCloseBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProfileTab({
  student,
  userId,
  onImageUpdate,
  onStudentUpdate,
}: {
  student: Student;
  userId: string | null;
  onImageUpdate: (url: string) => void;
  onStudentUpdate: (fields: Partial<Student>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [showRegulationModal, setShowRegulationModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const asset = result.assets[0];
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const storagePath = `students/${student.id}/profile.jpg`;
      const fileRes = await fetch(compressed.uri);
      const blob = await fileRes.blob();
      const uploadRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/profile-images/${storagePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
          },
          body: blob,
        },
      );
      if (!uploadRes.ok) return;

      const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${storagePath}`;

      // Write URL back via RPC (bypasses admin schema RLS)
      await supabase.rpc("update_student_profile_image", {
        p_student_id: student.id,
        p_image_url: publicUrl,
      });

      onImageUpdate(publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Avatar */}
      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.75}
          disabled={uploading}
          style={{ alignItems: "center", gap: 6 }}
        >
          <View style={{ position: "relative", width: 86, height: 86 }}>
            <View style={styles.profileAvatarWrap}>
              {student.profile_image_url ? (
                <Image
                  source={{ uri: student.profile_image_url }}
                  style={styles.profileAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.profileAvatarInitials}>
                  {getInitials(student.child_legal_name)}
                </Text>
              )}
            </View>
            <View style={styles.profileAvatarBadge}>
              <Ionicons
                name={uploading ? "hourglass-outline" : "camera"}
                size={13}
                color="#fff"
              />
            </View>
          </View>
          <Text style={styles.profileAvatarHint}>
            {uploading ? "Uploading…" : "Tap to change photo"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <View style={[styles.pickupSectionRow, { marginBottom: 4 }]}>
          <Text style={styles.sectionCardTitle}>Medical Info</Text>
          <TouchableOpacity style={styles.pickupAddBtn} onPress={() => setShowMedicalModal(true)} activeOpacity={0.75}>
            <Ionicons name="pencil-outline" size={13} color={Brand.sage700} />
            <Text style={styles.pickupAddBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow
          label="Allergies"
          value={
            student.has_allergies === "yes"
              ? student.allergies_description
              : student.has_allergies === "no"
                ? "None"
                : null
          }
        />
        <InfoRow
          label="Medical Conditions"
          value={
            student.has_medical_conditions === "yes"
              ? student.medical_conditions_description
              : student.has_medical_conditions === "no"
                ? "None"
                : null
          }
        />
        <InfoRow
          label="Emergency Medications"
          value={
            student.has_emergency_medications === "yes"
              ? student.emergency_medications_description
              : student.has_emergency_medications === "no"
                ? "None"
                : null
          }
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={[styles.pickupSectionRow, { marginBottom: 4 }]}>
          <Text style={styles.sectionCardTitle}>Learning Profile</Text>
          <TouchableOpacity style={styles.pickupAddBtn} onPress={() => setShowLearningModal(true)} activeOpacity={0.75}>
            <Ionicons name="pencil-outline" size={13} color={Brand.sage700} />
            <Text style={styles.pickupAddBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="Learning Style" value={student.learning_style} />
        <InfoRow label="Special Interests" value={student.special_interests} />
        <InfoRow label="Strengths & Interests" value={student.strengths_interests} />
      </View>

      <View style={styles.sectionCard}>
        <View style={[styles.pickupSectionRow, { marginBottom: 4 }]}>
          <Text style={styles.sectionCardTitle}>Regulation</Text>
          <TouchableOpacity style={styles.pickupAddBtn} onPress={() => setShowRegulationModal(true)} activeOpacity={0.75}>
            <Ionicons name="pencil-outline" size={13} color={Brand.sage700} />
            <Text style={styles.pickupAddBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="Regulation Strategies" value={student.regulation_strategies} />
        <InfoRow label="Dysregulation Response" value={student.dysregulation_response} />
      </View>

      <View style={styles.sectionCard}>
        <View style={[styles.pickupSectionRow, { marginBottom: 4 }]}>
          <Text style={styles.sectionCardTitle}>Support</Text>
          <TouchableOpacity style={styles.pickupAddBtn} onPress={() => setShowSupportModal(true)} activeOpacity={0.75}>
            <Ionicons name="pencil-outline" size={13} color={Brand.sage700} />
            <Text style={styles.pickupAddBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="Current Challenges" value={student.current_challenges} />
      </View>

      <MedicalInfoModal
        visible={showMedicalModal}
        student={student}
        onSave={(fields) => { onStudentUpdate(fields); setShowMedicalModal(false); }}
        onClose={() => setShowMedicalModal(false)}
      />
      <LearningProfileModal
        visible={showLearningModal}
        student={student}
        onSave={(fields) => { onStudentUpdate(fields); setShowLearningModal(false); }}
        onClose={() => setShowLearningModal(false)}
      />
      <RegulationModal
        visible={showRegulationModal}
        student={student}
        onSave={(fields) => { onStudentUpdate(fields); setShowRegulationModal(false); }}
        onClose={() => setShowRegulationModal(false)}
      />
      <SupportModal
        visible={showSupportModal}
        student={student}
        onSave={(fields) => { onStudentUpdate(fields); setShowSupportModal(false); }}
        onClose={() => setShowSupportModal(false)}
      />
    </View>
  );
}

function PersonModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: LocalPerson | null;
  onSave: (person: LocalPerson) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [form, setForm] = useState<LocalPerson>({
    tempId: "",
    full_name: "",
    relationship: "",
    phone: "",
    email: "",
    dl_state_id_number: "",
    vehicle_info: "",
    license_plate_state: "",
  });

  useEffect(() => {
    if (visible) {
      setForm(
        initial ?? {
          tempId: String(Date.now()),
          full_name: "",
          relationship: "",
          phone: "",
          email: "",
          dl_state_id_number: "",
          vehicle_info: "",
          license_plate_state: "",
        },
      );
      slideAnim.setValue(600);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const set = (key: keyof LocalPerson) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const canSave =
    form.full_name.trim().length > 0 &&
    form.relationship.trim().length > 0 &&
    form.phone.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.personModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View
            style={[styles.personModalSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.attDetailHandle} />
            <Text style={styles.personModalTitle}>
              {initial ? "Edit Person" : "Add Person"}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 14 }}
            >
              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>
                  Full Name <Text style={styles.personRequiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.personInput}
                  value={form.full_name}
                  onChangeText={set("full_name")}
                  placeholder="Jane Smith"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>
                  Relationship <Text style={styles.personRequiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.personInput}
                  value={form.relationship}
                  onChangeText={set("relationship")}
                  placeholder="e.g. Grandmother, Uncle"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>
                  Phone <Text style={styles.personRequiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.personInput}
                  value={form.phone}
                  onChangeText={set("phone")}
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Email</Text>
                <TextInput
                  style={styles.personInput}
                  value={form.email}
                  onChangeText={set("email")}
                  placeholder="jane@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>DL / State ID Number</Text>
                <TextInput
                  style={styles.personInput}
                  value={form.dl_state_id_number}
                  onChangeText={set("dl_state_id_number")}
                  placeholder="D1234567"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>Vehicle Info</Text>
                <TextInput
                  style={styles.personInput}
                  value={form.vehicle_info}
                  onChangeText={set("vehicle_info")}
                  placeholder="2019 Honda Civic, Silver"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.personField}>
                <Text style={styles.personFieldLabel}>License Plate State</Text>
                <TextInput
                  style={styles.personInput}
                  value={form.license_plate_state}
                  onChangeText={set("license_plate_state")}
                  placeholder="CA"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                  maxLength={3}
                />
              </View>
            </ScrollView>

            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.attActionButton, !canSave && { opacity: 0.4 }]}
                onPress={() => canSave && onSave(form)}
                disabled={!canSave}
                activeOpacity={0.75}
              >
                <Text style={styles.attActionButtonText}>
                  {initial ? "Save Changes" : "Add Person"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attDetailCloseBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.attDetailCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PickupTab({
  studentId,
  userId,
}: {
  studentId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [dateOfRequest, setDateOfRequest] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [localPersons, setLocalPersons] = useState<LocalPerson[]>([]);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<LocalPerson | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPickup() {
      setLoading(true);
      const [planResult, personsResult] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_plan")
          .select("*")
          .eq("student_id", studentId)
          .maybeSingle(),
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_persons")
          .select("*")
          .eq("student_id", studentId)
          .order("sort_order", { ascending: true }),
      ]);

      if (cancelled) return;

      const plan = planResult.data as PickupPlan | null;
      const persons = (personsResult.data ?? []) as PickupPerson[];

      setDateOfRequest(plan?.date_of_request ?? "");
      setEffectiveUntil(plan?.effective_until ?? "");
      setLocalPersons(
        persons.map((p) => ({
          tempId: p.id,
          full_name: p.full_name,
          relationship: p.relationship ?? "",
          phone: p.phone ?? "",
          email: p.email ?? "",
          dl_state_id_number: p.dl_state_id_number ?? "",
          vehicle_info: p.vehicle_info ?? "",
          license_plate_state: p.license_plate_state ?? "",
        })),
      );
      setIsDirty(false);
      setLoading(false);
    }

    fetchPickup();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      // Step 1 — upsert plan
      const { error: planError } = await supabase
        .schema("parent_app")
        .from("student_authorized_pickup_plan")
        .upsert(
          {
            parent_id: userId,
            student_id: studentId,
            date_of_request: dateOfRequest.trim() || null,
            effective_until: effectiveUntil.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "parent_id,student_id" },
        );
      if (planError) throw planError;

      // Step 2 — delete existing persons
      const { error: deleteError } = await supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .delete()
        .eq("parent_id", userId)
        .eq("student_id", studentId);
      if (deleteError) throw deleteError;

      // Step 3 — insert fresh list
      if (localPersons.length > 0) {
        const rows = localPersons.map((p, i) => ({
          parent_id: userId,
          student_id: studentId,
          full_name: p.full_name,
          relationship: p.relationship || null,
          phone: p.phone || null,
          email: p.email || null,
          dl_state_id_number: p.dl_state_id_number || null,
          vehicle_info: p.vehicle_info || null,
          license_plate_state: p.license_plate_state || null,
          sort_order: i,
        }));
        const { error: insertError } = await supabase
          .schema("parent_app")
          .from("student_authorized_pickup_persons")
          .insert(rows);
        if (insertError) throw insertError;
      }

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handlePersonSave(person: LocalPerson) {
    if (editingPerson) {
      setLocalPersons((prev) =>
        prev.map((p) => (p.tempId === editingPerson.tempId ? person : p)),
      );
    } else {
      setLocalPersons((prev) => [...prev, { ...person, tempId: String(Date.now()) }]);
    }
    setIsDirty(true);
    setShowPersonModal(false);
    setEditingPerson(null);
  }

  function handleDeletePerson(tempId: string) {
    setLocalPersons((prev) => prev.filter((p) => p.tempId !== tempId));
    setIsDirty(true);
  }

  if (loading) {
    return (
      <View style={{ gap: 12 }}>
        <SkeletonBox width="100%" height={90} borderRadius={12} />
        <SkeletonBox width="100%" height={48} borderRadius={10} />
        {[0, 1].map((i) => (
          <SkeletonBox key={i} width="100%" height={72} borderRadius={12} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {/* Persons section header */}
      <View style={styles.pickupSectionRow}>
        <Text style={styles.attSectionLabel}>
          Authorized Persons{localPersons.length > 0 ? ` (${localPersons.length})` : ""}
        </Text>
        <TouchableOpacity
          style={styles.pickupAddBtn}
          onPress={() => {
            setEditingPerson(null);
            setShowPersonModal(true);
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={15} color={Brand.sage700} />
          <Text style={styles.pickupAddBtnText}>Add Person</Text>
        </TouchableOpacity>
      </View>

      {/* Person list */}
      {localPersons.length === 0 ? (
        <View style={styles.attEmptyState}>
          <Ionicons name="people-outline" size={32} color="#d1d5db" />
          <Text style={styles.attEmptyText}>No authorized persons yet</Text>
          <TouchableOpacity
            style={[styles.attActionButton, { paddingHorizontal: 24, marginTop: 4 }]}
            onPress={() => {
              setEditingPerson(null);
              setShowPersonModal(true);
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.attActionButtonText}>Add Person</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {localPersons.map((p) => (
            <View key={p.tempId} style={styles.pickupPersonRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.pickupPersonName}>{p.full_name}</Text>
                {(p.relationship || p.phone) && (
                  <Text style={styles.pickupPersonSub}>
                    {[p.relationship, p.phone].filter(Boolean).join(" · ")}
                  </Text>
                )}
                {(p.vehicle_info || p.license_plate_state) && (
                  <Text style={styles.pickupPersonSub}>
                    {[p.vehicle_info, p.license_plate_state].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingPerson(p);
                    setShowPersonModal(true);
                  }}
                  activeOpacity={0.75}
                  style={styles.pickupPersonActionBtn}
                >
                  <Ionicons name="pencil-outline" size={14} color={Brand.sage700} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePerson(p.tempId)}
                  activeOpacity={0.75}
                  style={[styles.pickupPersonActionBtn, styles.pickupPersonDeleteBtn]}
                >
                  <Ionicons name="close" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Plan dates card */}
      <View style={styles.pickupPlanCard}>
        <Text style={styles.sectionCardTitle}>Authorization Plan</Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          <View style={styles.personField}>
            <Text style={styles.pickupPlanLabel}>Date of Request</Text>
            <TextInput
              style={styles.pickupDateInput}
              value={dateOfRequest}
              onChangeText={(v) => { setDateOfRequest(v); setIsDirty(true); }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.personField}>
            <Text style={styles.pickupPlanLabel}>Effective Until</Text>
            <TextInput
              style={styles.pickupDateInput}
              value={effectiveUntil}
              onChangeText={(v) => { setEffectiveUntil(v); setIsDirty(true); }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
      </View>

      {/* Save */}
      {saveSuccess && (
        <Text style={styles.pickupSuccessText}>Saved successfully!</Text>
      )}
      {isDirty && (
        <>
          {saveError && (
            <Text style={{ fontFamily: FontFamilies.body, fontSize: 13, color: "#ef4444" }}>
              {saveError}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.attActionButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.attActionButtonText}>
              {saving ? "Saving…" : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <PersonModal
        visible={showPersonModal}
        initial={editingPerson}
        onSave={handlePersonSave}
        onClose={() => {
          setShowPersonModal(false);
          setEditingPerson(null);
        }}
      />
    </View>
  );
}

export default function ChildrenScreen() {
  const { tab: tabParam, studentId: studentIdParam } = useLocalSearchParams<{ tab?: string; studentId?: string }>();
  const { effectiveParentId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachersByStudent, setTeachersByStudent] = useState<
    Record<string, TeacherAssignment[]>
  >({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("teacher");

  useEffect(() => {
    const valid: Tab[] = ["teacher", "attendance", "learning", "pickup", "profile"];
    if (tabParam && valid.includes(tabParam as Tab)) {
      setActiveTab(tabParam as Tab);
    }
  }, [tabParam]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function fetchStudents() {
        if (!effectiveParentId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);

        setUserId(effectiveParentId);

        // Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .schema("admin")
          .from("students")
          .select(
            "id, child_legal_name, dob_day, dob_month, dob_year, child_grade, has_allergies, allergies_description, has_medical_conditions, medical_conditions_description, has_emergency_medications, emergency_medications_description, learning_style, special_interests, strengths_interests, current_challenges, regulation_strategies, dysregulation_response, profile_image_url",
          )
          .eq("parent_id", effectiveParentId)
          .eq("is_deleted", false);

        if (studentsError || !studentsData) {
          if (!cancelled) {
            if (studentsError) notifyError("parent-children-fetch", studentsError);
            setError(studentsError?.message ?? "Failed to load children.");
            setLoading(false);
          }
          return;
        }

        // Fetch teacher assignments for all students
        const studentIds = studentsData.map((s) => s.id);
        const { data: assignmentRows } = await supabase
          .schema("teachers")
          .from("teacher_students")
          .select("id, teacher_id, student_id, program, classroom")
          .in("student_id", studentIds)
          .eq("is_deleted", false);

        // Resolve teacher names from admin.users
        let teacherMap: Record<string, TeacherAssignment[]> = {};
        if (assignmentRows && assignmentRows.length > 0) {
          const teacherIds = [
            ...new Set(assignmentRows.map((r) => r.teacher_id)),
          ];
          const { data: teacherUsers } = await supabase
            .schema("admin")
            .from("users")
            .select("id, full_name")
            .in("id", teacherIds);

          const nameById: Record<string, string> = {};
          for (const u of teacherUsers ?? []) {
            nameById[u.id] = u.full_name;
          }

          for (const row of assignmentRows) {
            const assignment: TeacherAssignment = {
              ...row,
              teacher_name: nameById[row.teacher_id] ?? null,
            };
            if (!teacherMap[row.student_id]) teacherMap[row.student_id] = [];
            teacherMap[row.student_id].push(assignment);
          }
        }

        if (!cancelled) {
          setStudents(studentsData);
          setTeachersByStudent(teacherMap);
          const targetIndex = studentIdParam
            ? studentsData.findIndex((s) => s.id === studentIdParam)
            : -1;
          setActiveIndex(targetIndex >= 0 ? targetIndex : 0);
          setLoading(false);
        }
      }

      fetchStudents();
      return () => {
        cancelled = true;
      };
    }, [effectiveParentId]),
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "teacher", label: "Teacher" },
    { key: "attendance", label: "Attendance" },
    { key: "learning", label: "Learning" },
    { key: "pickup", label: "Pickup" },
    { key: "profile", label: "Profile" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Pill row skeleton */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#f3f4f6",
          }}
        >
          <SkeletonBox width={110} height={48} borderRadius={9999} />
          <SkeletonBox width={110} height={48} borderRadius={9999} />
        </View>

        {/* Tab bar skeleton */}
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 8,
            paddingHorizontal: 4,
            gap: 4,
            borderBottomWidth: 1,
            borderBottomColor: "#f3f4f6",
          }}
        >
          {[72, 88, 72, 60].map((w, i) => (
            <SkeletonBox key={i} width={w} height={32} borderRadius={6} />
          ))}
        </View>

        {/* Teacher card skeleton */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <SkeletonBox width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBox width="55%" height={14} borderRadius={4} />
              <SkeletonBox width="40%" height={12} borderRadius={4} />
            </View>
            <SkeletonBox width={36} height={36} borderRadius={8} />
          </View>
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

  if (students.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Children</Text>
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

  const student = students[activeIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Page Header */}
      {/* <View style={styles.header}>
        <Text style={styles.pageTitle}>Children</Text>
      </View> */}
      {/* Child Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
        style={styles.pillScroll}
      >
        {students.map((s, i) => {
          const active = i === activeIndex;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setActiveIndex(i)}
              style={[styles.pill, active && styles.pillActive]}
              activeOpacity={0.75}
            >
              <View style={styles.pillInner}>
                <View
                  style={[styles.pillAvatar, active && styles.pillAvatarActive]}
                >
                  {s.profile_image_url ? (
                    <Image
                      source={{ uri: s.profile_image_url }}
                      style={{ width: 38, height: 38, borderRadius: 19 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.pillAvatarText,
                        active && styles.pillAvatarTextActive,
                      ]}
                    >
                      {getInitials(s.child_legal_name)}
                    </Text>
                  )}
                </View>
                <View style={{ gap: 1 }}>
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {s.child_legal_name.split(" ")[0]}
                  </Text>
                  {s.child_grade && (
                    <Text
                      style={[
                        styles.pillGrade,
                        active && styles.pillGradeActive,
                      ]}
                    >
                      {s.child_grade}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        style={styles.tabScroll}
      >
        {tabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === "teacher" && (
            <TeacherTab
              studentId={student.id}
              teachersByStudent={teachersByStudent}
            />
          )}
          {activeTab === "attendance" && (
            <AttendanceTab
              studentId={student.id}
              studentName={student.child_legal_name}
            />
          )}
          {activeTab === "learning" && (
            <LearningTab
              student={student}
              userId={userId ?? ""}
              studentName={student.child_legal_name}
              onStudentUpdate={(fields) =>
                setStudents((prev) =>
                  prev.map((s) => (s.id === student.id ? { ...s, ...fields } : s))
                )
              }
            />
          )}
          {activeTab === "pickup" && (
            <PickupTab studentId={student.id} userId={userId ?? ""} />
          )}
          {activeTab === "profile" && (
            <ProfileTab
              student={student}
              userId={userId}
              onImageUpdate={(url) =>
                setStudents((prev) =>
                  prev.map((s) =>
                    s.id === student.id ? { ...s, profile_image_url: url } : s,
                  ),
                )
              }
              onStudentUpdate={(fields) =>
                setStudents((prev) =>
                  prev.map((s) => (s.id === student.id ? { ...s, ...fields } : s))
                )
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
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

  // Pills
  pillScroll: {
    flexGrow: 0,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  pillActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(74,124,89,0.08)",
  },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  pillAvatarActive: {
    backgroundColor: "rgba(74,124,89,0.15)",
  },
  pillAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
  },
  pillAvatarTextActive: {
    color: Brand.sage700,
  },
  pillText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
  pillTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  pillGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  pillGradeActive: {
    color: Brand.sage700,
  },

  // Scroll content
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: BottomTabInset + 16,
  },

  // Tab Bar
  tabScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tabRow: {
    flexDirection: "row",
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "rgba(74,124,89,0.08)",
    borderBottomWidth: 2,
    borderBottomColor: Brand.sage700,
  },
  tabText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
  },
  tabTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#4a7c59",
  },

  // Tab Content
  tabContent: {
    gap: 12,
  },

  // Info rows
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 2,
  },
  infoLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#4b5563",
  },
  infoValue: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    gap: 0,
  },
  sectionCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 4,
  },

  // Teacher card
  teacherSectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
    textTransform: "capitalize",
    paddingHorizontal: 2,
  },
  teacherScrollRow: {
    paddingHorizontal: 2,
    paddingBottom: 4,
    gap: 12,
  },
  teacherProfileCard: {
    width: 200,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 12,
    gap: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  teacherProfileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 2,
  },
  teacherProfileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  teacherProfileInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: Brand.sage700,
  },
  teacherProfileName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 18,
  },
  teacherProfileSub: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  teacherCardActions: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
    marginTop: 4,
  },
  teacherMessageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    backgroundColor: "#F2F7F3",
  },
  teacherMessageBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },

  // Neutral card
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

  // Error card
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

  // Attendance filter chips
  attFilterRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  attFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attFilterChipActive: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  attFilterChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  attFilterChipTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#ffffff",
  },

  // Attendance status badges
  attStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attStatusBadgePickedUp: { backgroundColor: "#d1fae5" },
  attStatusBadgeAttended: { backgroundColor: "#E0EDE2" },
  attStatusBadgeAbsent: { backgroundColor: "#fef3c7" },
  attStatusBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
  },
  attStatusBadgeTextPickedUp: { color: "#065f46" },
  attStatusBadgeTextAttended: { color: Brand.sage700 },
  attStatusBadgeTextAbsent: { color: "#b45309" },

  // Attendance detail modal extras
  attDetailProgram: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    textAlign: "center" as const,
    marginTop: -8,
  },
  attDetailPickupName: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },

  // Attendance tab
  attStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  attStatusCardActive: {
    backgroundColor: "#F2F7F3",
    borderColor: "#C8DFCB",
  },
  attStatusHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#6b7280",
  },
  attStatusHeadingActive: {
    color: Brand.sage700,
  },
  attStatusSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    marginTop: 2,
  },
  attActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    paddingVertical: 13,
    borderRadius: 10,
  },
  attActionButtonOut: {
    backgroundColor: "#d97706",
  },
  attActionButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
  attSectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#4b5563",
    marginTop: 4,
  },
  attHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  attHistoryRowOpen: {
    borderColor: "#fca5a5",
    backgroundColor: "#fff5f5",
  },
  attHistoryRowOpenToday: {
    borderColor: "#c6dcc8",
    backgroundColor: "#EEF5EF",
  },
  attHistoryDate: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  attHistoryTime: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  attStaleWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attStaleWarningText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#92400e",
    flex: 1,
  },
  attEmptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  attEmptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  missedBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  missedText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#b45309",
  },

  // Duration / missing badges (shared with attendance history)
  durationBadge: {
    backgroundColor: "#E0EDE2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  openBadge: {
    backgroundColor: "#E0EDE2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  // Check-in detail modal
  attDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  attDetailSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 16,
  },
  attDetailHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 4,
  },
  attDetailDate: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
    textAlign: "center",
  },
  attDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attDetailRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attDetailDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  attDetailLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  attDetailTime: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  attDetailUserBlock: {
    alignItems: "center",
    gap: 4,
  },
  attDetailUserName: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
    maxWidth: 60,
    textAlign: "center",
  },
  attDetailDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  attDetailDuration: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  attDetailCloseBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  attDetailCloseBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },

  // Profile tab avatar
  profileAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileAvatarInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 26,
    color: Brand.sage700,
  },
  profileAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileAvatarHint: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },

  // Pickup tab
  pickupPlanCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  pickupPlanLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pickupDateInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pickupSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickupAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    backgroundColor: "#F2F7F3",
  },
  pickupAddBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  pickupPersonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  pickupPersonName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  pickupPersonSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  pickupPersonActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#C8DFCB",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupPersonDeleteBtn: {
    backgroundColor: "#fff5f5",
    borderColor: "#fca5a5",
  },
  pickupSuccessText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
    textAlign: "center",
  },

  // Person modal
  personModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  personModalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 16,
    maxHeight: "90%",
  },
  personModalTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
    textAlign: "center",
  },
  personField: {
    gap: 6,
  },
  personFieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#4b5563",
  },
  personInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  personRequiredStar: {
    color: "#ef4444",
  },

  // Learning notes
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  noteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  noteBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
  noteDate: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  noteText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },

  // Note modal
  noteModalTextInput: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  noteCategoryRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  noteCategoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  noteCategoryPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
  },
});
