import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
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
import { supabase } from "@/lib/supabase";
import { getStudentDisplayName } from "@/lib/student-display-name";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudentDetail {
  id: string;
  child_legal_name: string;
  child_grade: string | null;
  profile_image_url: string | null;
  dob_day: string | null;
  dob_month: string | null;
  dob_year: string | null;
  learning_style: string | null;
  special_interests: string | null;
  strengths_interests: string | null;
  current_challenges: string | null;
  dysregulation_response: string | null;
  regulation_strategies: string | null;
  activities_to_avoid: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_allergies: string | null;
  allergies_description: string | null;
  emergency_medications: string | null;
  needs_aide: string | null;
  parent_id: string | null;
}

interface ContactsData {
  g1_full_name: string | null;
  g1_relationship: string | null;
  g1_cell_phone: string | null;
  g1_work_phone: string | null;
  g1_email: string | null;
  g2_full_name: string | null;
  g2_relationship: string | null;
  g2_cell_phone: string | null;
  g2_work_phone: string | null;
  g2_email: string | null;
  in_state_contact_name: string | null;
  in_state_contact_relation: string | null;
  in_state_contact_phone: string | null;
  out_of_state_contact_name: string | null;
  out_of_state_contact_relation: string | null;
  out_of_state_contact_phone: string | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: "image" | "file";
  signed_url?: string;
  created_at: string;
}

interface NoteRecord {
  id: string;
  note_text: string;
  category: "general" | "behavioral" | "academic" | "social" | "health";
  is_shared: boolean;
  created_at: string;
  teacher_note_attachments: Attachment[];
}

interface PendingAttachment {
  uri: string;
  name: string;
  mimeType: string;
  isImage: boolean;
}

type Tab =
  | "info"
  | "contacts"
  | "notes"
  | "attendance"
  | "portfolio"
  | "progress"
  | "messages"
  | "pickup";

const TABS: { key: Tab; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "contacts", label: "Contacts" },
  { key: "notes", label: "Notes" },
  { key: "attendance", label: "Attendance" },
  { key: "portfolio", label: "Portfolio" },
  { key: "progress", label: "Progress" },
  { key: "messages", label: "Messages" },
  { key: "pickup", label: "Pickup" },
];

const NOTE_CATEGORIES: NoteRecord["category"][] = [
  "general",
  "behavioral",
  "academic",
  "social",
  "health",
];

const CATEGORY_COLORS: Record<NoteRecord["category"], string> = {
  general: "#6b7280",
  behavioral: "#7c3aed",
  academic: "#2563eb",
  social: "#059669",
  health: "#dc2626",
};

// ─── Small reusable components ───────────────────────────────────────────────

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

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function CategoryBadge({ category }: { category: NoteRecord["category"] }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: CATEGORY_COLORS[category] + "18" },
      ]}
    >
      <Text
        style={[styles.badgeText, { color: CATEGORY_COLORS[category] }]}
      >
        {category}
      </Text>
    </View>
  );
}

function AttendanceStatusBadge({ record }: { record: UnifiedAttendanceRecord }) {
  const status = getAttendanceStatus(record);
  const badgeStyle =
    status === "absent"
      ? { backgroundColor: "#fef3c7" }
      : status === "picked_up"
        ? { backgroundColor: "#d1fae5" }
        : { backgroundColor: "#E0EDE2" };
  const textStyle =
    status === "absent"
      ? { color: "#b45309" }
      : status === "picked_up"
        ? { color: "#065f46" }
        : { color: Brand.sage700 };
  const label =
    status === "absent" ? "Absent" : status === "picked_up" ? "Picked Up" : "Attended";

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatYMD(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPickupTimeStr(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${mStr} ${ampm}`;
}

// ─── Tab: Info ───────────────────────────────────────────────────────────────

function InfoTab({ student }: { student: StudentDetail }) {
  const dob =
    student.dob_month && student.dob_day && student.dob_year
      ? `${student.dob_month}/${student.dob_day}/${student.dob_year}`
      : null;

  return (
    <View style={{ gap: 12 }}>
      <SectionCard title="Demographics">
        <InfoRow label="Legal Name" value={student.child_legal_name} />
        <InfoRow label="Grade" value={student.child_grade} />
        <InfoRow label="Date of Birth" value={dob} />
      </SectionCard>

      <SectionCard title="Learning Profile">
        <InfoRow label="Learning Style" value={student.learning_style} />
        <InfoRow label="Special Interests" value={student.special_interests} />
        <InfoRow
          label="Strengths & Interests"
          value={student.strengths_interests}
        />
        <InfoRow
          label="Current Challenges"
          value={student.current_challenges}
        />
      </SectionCard>

      <SectionCard title="Regulation">
        <InfoRow
          label="Dysregulation Response"
          value={student.dysregulation_response}
        />
        <InfoRow
          label="Regulation Strategies"
          value={student.regulation_strategies}
        />
        <InfoRow
          label="Activities to Avoid"
          value={student.activities_to_avoid}
        />
      </SectionCard>

      <SectionCard title="Health Flags">
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
          value={student.emergency_medications}
        />
        <InfoRow label="Needs Aide" value={student.needs_aide} />
      </SectionCard>
    </View>
  );
}

// ─── Tab: Contacts ───────────────────────────────────────────────────────────

function CopyableRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <TouchableOpacity
          onPress={href ? () => Linking.openURL(href) : undefined}
          activeOpacity={href ? 0.7 : 1}
        >
          <Text style={[styles.infoValue, href && styles.linkText]}>
            {value}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handleCopy}
        style={styles.copyButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name={copied ? "checkmark" : "copy-outline"}
          size={15}
          color={copied ? Brand.sage700 : "#9ca3af"}
        />
      </TouchableOpacity>
    </View>
  );
}

function ContactCard({
  title,
  name,
  relationship,
  cellPhone,
  workPhone,
  email,
}: {
  title: string;
  name: string | null;
  relationship: string | null;
  cellPhone?: string | null;
  workPhone?: string | null;
  email?: string | null;
}) {
  if (!name) {
    return (
      <View style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>{title}</Text>
        <Text style={styles.emptyBody}>No information on file.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactCardTitle}>{title}</Text>
        {relationship && (
          <View style={styles.relationBadge}>
            <Text style={styles.relationBadgeText}>{relationship}</Text>
          </View>
        )}
      </View>
      <Text style={styles.contactName}>{name}</Text>
      {cellPhone && (
        <CopyableRow
          label="Cell"
          value={cellPhone}
          href={`tel:${cellPhone}`}
        />
      )}
      {workPhone && (
        <CopyableRow
          label="Work"
          value={workPhone}
          href={`tel:${workPhone}`}
        />
      )}
      {email && (
        <CopyableRow
          label="Email"
          value={email}
          href={`mailto:${email}`}
        />
      )}
    </View>
  );
}

function ContactsTab({
  contacts,
  loading,
}: {
  contacts: ContactsData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={{ gap: 12 }}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.contactCard}>
            <SkeletonBox width="40%" height={13} borderRadius={4} />
            <SkeletonBox width="60%" height={16} borderRadius={4} />
            <SkeletonBox width="50%" height={13} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  if (!contacts) {
    return (
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>No contact data available.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <ContactCard
        title="Guardian 1"
        name={contacts.g1_full_name}
        relationship={contacts.g1_relationship}
        cellPhone={contacts.g1_cell_phone}
        workPhone={contacts.g1_work_phone}
        email={contacts.g1_email}
      />
      <ContactCard
        title="Guardian 2"
        name={contacts.g2_full_name}
        relationship={contacts.g2_relationship}
        cellPhone={contacts.g2_cell_phone}
        workPhone={contacts.g2_work_phone}
        email={contacts.g2_email}
      />
      <ContactCard
        title="In-State Emergency Contact"
        name={contacts.in_state_contact_name}
        relationship={contacts.in_state_contact_relation}
        cellPhone={contacts.in_state_contact_phone}
      />
      <ContactCard
        title="Out-of-State Emergency Contact"
        name={contacts.out_of_state_contact_name}
        relationship={contacts.out_of_state_contact_relation}
        cellPhone={contacts.out_of_state_contact_phone}
      />
    </View>
  );
}

// ─── Tab: Notes ──────────────────────────────────────────────────────────────

function NotesTab({
  notes,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: {
  notes: NoteRecord[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (note: NoteRecord) => void;
  onDelete: (noteId: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={{ gap: 10 }}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.noteCard}>
            <SkeletonBox width="80%" height={14} borderRadius={4} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <TouchableOpacity
        style={styles.addNoteButton}
        onPress={onAdd}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={18} color={Brand.sage700} />
        <Text style={styles.addNoteButtonText}>Add Note</Text>
      </TouchableOpacity>

      {notes.length === 0 ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            No notes yet. Tap "Add Note" to create one.
          </Text>
        </View>
      ) : (
        notes.map((note) => {
          const expanded = expandedId === note.id;
          return (
            <View key={note.id} style={styles.noteCard}>
              <TouchableOpacity
                onPress={() => setExpandedId(expanded ? null : note.id)}
                activeOpacity={0.75}
              >
                <View style={styles.noteCardHeader}>
                  <CategoryBadge category={note.category} />
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: note.is_shared
                          ? "#dbeafe"
                          : "#f3f4f6",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: note.is_shared ? "#1d4ed8" : "#6b7280" },
                      ]}
                    >
                      {note.is_shared ? "Shared" : "Private"}
                    </Text>
                  </View>
                  <Text style={styles.noteDate}>
                    {formatDate(note.created_at)}
                  </Text>
                </View>
                <Text
                  style={styles.noteText}
                  numberOfLines={expanded ? undefined : 3}
                >
                  {note.note_text}
                </Text>
              </TouchableOpacity>

              {expanded && (
                <>
                  {note.teacher_note_attachments.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.attachmentsLabel}>Attachments</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 6 }}
                      >
                        {note.teacher_note_attachments.map((att) =>
                          att.file_type === "image" && att.signed_url ? (
                            <Image
                              key={att.id}
                              source={{ uri: att.signed_url }}
                              style={styles.attachmentThumb}
                            />
                          ) : (
                            <View key={att.id} style={styles.fileChip}>
                              <Ionicons
                                name="document-outline"
                                size={14}
                                color="#6b7280"
                              />
                              <Text
                                style={styles.fileChipText}
                                numberOfLines={1}
                              >
                                {att.file_name}
                              </Text>
                            </View>
                          ),
                        )}
                      </ScrollView>
                    </View>
                  )}
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      style={styles.noteActionButton}
                      onPress={() => onEdit(note)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={15}
                        color={Brand.sage700}
                      />
                      <Text style={styles.noteActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.noteActionButton,
                        { borderColor: "#fca5a5" },
                      ]}
                      onPress={() => onDelete(note.id)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color="#dc2626"
                      />
                      <Text style={[styles.noteActionText, { color: "#dc2626" }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

// ─── Tab: Attendance ─────────────────────────────────────────────────────────

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
      <Text
        style={{
          fontFamily: FontFamilies.bodySemiBold,
          fontSize: size * 0.36,
          color: Brand.sage700,
        }}
      >
        {user ? getInitials(user.full_name) : "?"}
      </Text>
    </View>
  );
}

function PickupPersonAvatar({ name, size = 36 }: { name: string; size?: number }) {
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
              {/* Recorded by row */}
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

              {record.pickup_time && (
                <>
                  <View style={styles.attDetailDivider} />
                  <View style={styles.attDetailRow}>
                    <View style={styles.attDetailRowLeft}>
                      <View style={[styles.attDetailDot, { backgroundColor: "#065f46" }]} />
                      <View style={{ gap: 2 }}>
                        <Text style={styles.attDetailLabel}>Picked Up</Text>
                        <Text style={styles.attDetailTime}>{formatPickupTimeStr(record.pickup_time)}</Text>
                        {record.picked_up_by_name && (
                          <Text style={styles.attDetailPickupName}>
                            {record.picked_up_by_name}
                            {record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}
                          </Text>
                        )}
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
  records,
  loading,
  userMap,
}: {
  records: UnifiedAttendanceRecord[];
  loading: boolean;
  userMap: UserMap;
}) {
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selectedRecord, setSelectedRecord] = useState<UnifiedAttendanceRecord | null>(null);

  const filtered = filterAttendanceRecords(records, filter);

  return (
    <View style={{ gap: 10 }}>
      {/* Sub-tabs */}
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

      {loading ? (
        <>
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width="100%" height={72} borderRadius={12} />
          ))}
        </>
      ) : filtered.length === 0 ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>No attendance records yet.</Text>
        </View>
      ) : (
        filtered.map((record) => {
          const cfg = PROGRAM_CONFIG[record.program];
          const status = getAttendanceStatus(record);
          const isPickedUp = status === "picked_up";
          return (
            <TouchableOpacity
              key={`${record.program}-${record.id}`}
              style={[styles.attendanceRow, { backgroundColor: cfg.bg }]}
              onPress={() => setSelectedRecord(record)}
              activeOpacity={0.75}
            >
              {isPickedUp && record.picked_up_by_name ? (
                <PickupPersonAvatar name={record.picked_up_by_name} size={40} />
              ) : (
                <UserAvatar userId={record.recorded_by} userMap={userMap} size={40} />
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.attendanceDate}>{formatYMD(record.date)}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                  <Text style={[styles.attProgramLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {isPickedUp && record.picked_up_by_name && (
                  <Text style={styles.attPickupSub} numberOfLines={1}>
                    {record.picked_up_by_name}
                    {record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}
                    {record.pickup_time ? ` · ${formatPickupTimeStr(record.pickup_time)}` : ""}
                  </Text>
                )}
              </View>
              <AttendanceStatusBadge record={record} />
            </TouchableOpacity>
          );
        })
      )}

      <AttendanceDetailModal
        record={selectedRecord}
        userMap={userMap}
        onClose={() => setSelectedRecord(null)}
      />
    </View>
  );
}

// ─── Tab: Messages ───────────────────────────────────────────────────────────

function MessagesTab({
  contacts,
  loadingContacts,
  studentId,
}: {
  contacts: ContactsData | null;
  loadingContacts: boolean;
  studentId: string;
}) {
  const router = useRouter();
  const [parentAccounts, setParentAccounts] = useState<
    Record<string, { id: string; full_name: string }>
  >({});
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (fetched || !contacts) return;
    const emails = [contacts.g1_email, contacts.g2_email].filter(
      Boolean,
    ) as string[];
    if (emails.length === 0) return;

    setLoadingAccounts(true);
    const { data } = await supabase
      .schema("admin")
      .from("users")
      .select("id, full_name, email")
      .in("email", emails);

    const map: Record<string, { id: string; full_name: string }> = {};
    for (const u of data ?? []) {
      map[u.email] = { id: u.id, full_name: u.full_name };
    }
    setParentAccounts(map);
    setLoadingAccounts(false);
    setFetched(true);
  }, [contacts, fetched]);

  // Trigger account fetch when contacts become available
  if (!fetched && contacts && !loadingAccounts) {
    fetchAccounts();
  }

  if (loadingContacts || loadingAccounts) {
    return (
      <View style={{ gap: 10 }}>
        <SkeletonBox width="100%" height={72} borderRadius={12} />
        <SkeletonBox width="100%" height={72} borderRadius={12} />
      </View>
    );
  }

  const guardians = [
    {
      name: contacts?.g1_full_name,
      email: contacts?.g1_email,
      relationship: contacts?.g1_relationship,
    },
    {
      name: contacts?.g2_full_name,
      email: contacts?.g2_email,
      relationship: contacts?.g2_relationship,
    },
  ].filter((g) => g.name);

  if (guardians.length === 0) {
    return (
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>
          No guardian information available.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {guardians.map((g, i) => {
        const account = g.email ? parentAccounts[g.email] : null;
        return (
          <View key={i} style={styles.guardianRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={styles.guardianName}>{g.name}</Text>
                <Ionicons
                  name={account ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={account ? "#10b981" : "#9ca3af"}
                />
              </View>
              <Text style={styles.guardianRel}>
                {g.relationship
                  ? g.relationship.charAt(0).toUpperCase() + g.relationship.slice(1)
                  : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.messageButton,
                !account && styles.messageButtonDisabled,
              ]}
              disabled={!account}
              activeOpacity={0.75}
              onPress={() =>
                account &&
                router.push({
                  pathname: "/(staff)/messages" as any,
                  params: { recipientId: account.id },
                })
              }
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={account ? Brand.sage700 : "#9ca3af"}
              />
              <Text
                style={[
                  styles.messageButtonText,
                  !account && { color: "#9ca3af" },
                ]}
              >
                Message
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ─── Placeholder tab ─────────────────────────────────────────────────────────

function PlaceholderTab({ label }: { label: string }) {
  return (
    <View style={styles.placeholderCard}>
      <Ionicons name="construct-outline" size={24} color="#9ca3af" />
      <Text style={styles.placeholderHeading}>{label}</Text>
      <Text style={styles.placeholderText}>Coming soon.</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function StudentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    studentId: string;
    studentName: string;
    program: string;
    classroom: string;
    allStudentsView?: string;
  }>();

  const { studentId, studentName, program, classroom, allStudentsView } = params;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [contacts, setContacts] = useState<ContactsData | null>(null);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<UnifiedAttendanceRecord[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [visitedTabs] = useState<Set<Tab>>(new Set(["info"]));

  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, { full_name: string; profile_image_url: string | null }>>({});

  const [userId, setUserId] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState<string | null>(null);

  // Note bottom sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] =
    useState<NoteRecord["category"]>("general");
  const [noteShared, setNoteShared] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [savingNote, setSavingNote] = useState(false);

  // ── Fetch student detail ──────────────────────────────────────────────────

  const fetchDetail = useCallback(async () => {
    setLoadingDetail(true);
    setDetailError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setDetailError("Not authenticated.");
      setLoadingDetail(false);
      return;
    }
    setUserId(user.id);

    // Verify access (skip when viewing from the All Students tab)
    if (!allStudentsView) {
      const { data: accessRows, error: accessErr } = await supabase
        .schema("teachers")
        .from("teacher_students")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("student_id", studentId)
        .eq("is_deleted", false)
        .limit(1);

      if (accessErr) {
        setDetailError(`Access check failed: ${accessErr.message}`);
        setLoadingDetail(false);
        return;
      }

      if (!accessRows || accessRows.length === 0) {
        setDetailError("No assignment found for this student.");
        setLoadingDetail(false);
        return;
      }
    }

    const [{ data: s, error: studentErr }, { data: app }] = await Promise.all([
      supabase
        .schema("admin")
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single(),
      supabase
        .schema("parent_app")
        .from("applications")
        .select("preferred_name, child_legal_name")
        .eq("student_id", studentId)
        .eq("status", "enrolled")
        .maybeSingle(),
    ]);

    if (studentErr) {
      setDetailError(`Student fetch failed: ${studentErr.message}`);
      setLoadingDetail(false);
      return;
    }

    setStudent(s ?? null);
    setPreferredName(
      (app as { preferred_name: string | null } | null)?.preferred_name ?? null,
    );
    setLoadingDetail(false);
  }, [studentId]);

  const fetchContacts = useCallback(async () => {
    if (!student?.parent_id) return;
    setLoadingContacts(true);

    const [healthRes, appRes, parentRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("student_health_info")
        .select("*")
        .eq("student_id", studentId)
        .single(),
      supabase
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .schema("admin")
        .from("users")
        .select(
          "id, full_name, email, g1_cell_phone, g1_work_phone, g2_full_name, g2_email, g2_cell_phone, g2_work_phone, g2_relationship",
        )
        .eq("id", student.parent_id)
        .single(),
    ]);

    const healthInfo = healthRes.data;
    const parentUser = parentRes.data;

    const merged: ContactsData = {
      // Guardian 1 is the parent user themselves
      g1_full_name: parentUser?.full_name ?? null,
      g1_relationship: null,
      g1_cell_phone: parentUser?.g1_cell_phone ?? null,
      g1_work_phone: parentUser?.g1_work_phone ?? null,
      g1_email: parentUser?.email ?? null,
      g2_full_name: parentUser?.g2_full_name ?? null,
      g2_relationship: parentUser?.g2_relationship ?? null,
      g2_cell_phone: parentUser?.g2_cell_phone ?? null,
      g2_work_phone: parentUser?.g2_work_phone ?? null,
      g2_email: parentUser?.g2_email ?? null,
      in_state_contact_name: healthInfo?.in_state_contact_name ?? null,
      in_state_contact_relation: healthInfo?.in_state_contact_relation ?? null,
      in_state_contact_phone: healthInfo?.in_state_contact_phone ?? null,
      out_of_state_contact_name: healthInfo?.out_of_state_contact_name ?? null,
      out_of_state_contact_relation:
        healthInfo?.out_of_state_contact_relation ?? null,
      out_of_state_contact_phone:
        healthInfo?.out_of_state_contact_phone ?? null,
    };

    setContacts(merged);
    setLoadingContacts(false);
  }, [student, studentId]);

  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    setLoadingNotes(true);

    const { data: rawNotes } = await supabase
      .schema("teachers")
      .from("teacher_notes")
      .select("*, teacher_note_attachments(*)")
      .eq("student_id", studentId)
      .eq("teacher_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // Generate signed URLs for attachments
    const notesWithUrls: NoteRecord[] = await Promise.all(
      (rawNotes ?? []).map(async (note: any) => {
        const attachments: Attachment[] = await Promise.all(
          (note.teacher_note_attachments ?? []).map(async (att: any) => {
            const { data: urlData } = await supabase.storage
              .from("teacher-note-attachments")
              .createSignedUrl(att.file_path, 3600);
            return { ...att, signed_url: urlData?.signedUrl };
          }),
        );
        return { ...note, teacher_note_attachments: attachments };
      }),
    );

    setNotes(notesWithUrls);
    setLoadingNotes(false);
  }, [studentId, userId]);

  const fetchAttendance = useCallback(async () => {
    setLoadingAttendance(true);

    try {
      const { records, userMap: profiles } =
        await fetchParentStudentAttendanceRecords(studentId);
      setAttendanceRecords(records);
      setUserMap(profiles);
    } finally {
      setLoadingAttendance(false);
    }
  }, [studentId]);

  // ── Focus effect ──────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail]),
  );

  // Lazy load tabs
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (visitedTabs.has(tab)) return;
    visitedTabs.add(tab);

    if (tab === "contacts" || tab === "messages") {
      fetchContacts();
    } else if (tab === "notes") {
      fetchNotes();
    } else if (tab === "attendance") {
      fetchAttendance();
    }
  };


  // ── Note CRUD ─────────────────────────────────────────────────────────────

  const openAddNote = () => {
    setEditingNote(null);
    setNoteText("");
    setNoteCategory("general");
    setNoteShared(false);
    setPendingAttachments([]);
    bottomSheetRef.current?.expand();
  };

  const openEditNote = (note: NoteRecord) => {
    setEditingNote(note);
    setNoteText(note.note_text);
    setNoteCategory(note.category);
    setNoteShared(note.is_shared);
    setPendingAttachments([]);
    bottomSheetRef.current?.expand();
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase
            .schema("teachers")
            .from("teacher_notes")
            .update({ is_deleted: true })
            .eq("id", noteId);
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
        },
      },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newItems: PendingAttachment[] = await Promise.all(
        result.assets.map(async (a) => {
          const compressed = await ImageManipulator.manipulateAsync(
            a.uri,
            [{ resize: { width: 1280 } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
          );
          return {
            uri: compressed.uri,
            name: `image_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
            isImage: true,
          };
        })
      );
      setPendingAttachments((prev) => [...prev, ...newItems]);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const newItems: PendingAttachment[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? "application/octet-stream",
        isImage: false,
      }));
      setPendingAttachments((prev) => [...prev, ...newItems]);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !userId) return;
    setSavingNote(true);

    if (editingNote) {
      // Update existing note
      const { data: updated } = await supabase
        .schema("teachers")
        .from("teacher_notes")
        .update({
          note_text: noteText.trim(),
          category: noteCategory,
          is_shared: noteShared,
        })
        .eq("id", editingNote.id)
        .select()
        .single();

      if (updated) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id
              ? {
                  ...n,
                  note_text: noteText.trim(),
                  category: noteCategory,
                  is_shared: noteShared,
                }
              : n,
          ),
        );
      }
    } else {
      // Insert new note
      const { data: newNote } = await supabase
        .schema("teachers")
        .from("teacher_notes")
        .insert({
          teacher_id: userId,
          student_id: studentId,
          note_text: noteText.trim(),
          category: noteCategory,
          is_shared: noteShared,
        })
        .select()
        .single();

      if (newNote) {
        // Upload attachments
        const uploadedAttachments: Attachment[] = [];
        for (const att of pendingAttachments) {
          const fileName = att.name;
          const filePath = `${userId}/${newNote.id}/${fileName}`;

          const response = await fetch(att.uri);
          const blob = await response.blob();

          const { error: uploadErr } = await supabase.storage
            .from("teacher-note-attachments")
            .upload(filePath, blob, { contentType: att.mimeType });

          if (!uploadErr) {
            const { data: attRecord } = await supabase
              .schema("teachers")
              .from("teacher_note_attachments")
              .insert({
                note_id: newNote.id,
                file_name: fileName,
                file_path: filePath,
                file_type: att.isImage ? "image" : "file",
              })
              .select()
              .single();

            if (attRecord) {
              const { data: urlData } = await supabase.storage
                .from("teacher-note-attachments")
                .createSignedUrl(filePath, 3600);
              uploadedAttachments.push({
                ...attRecord,
                signed_url: urlData?.signedUrl,
              });
            }
          }
        }

        setNotes((prev) => [
          {
            ...newNote,
            teacher_note_attachments: uploadedAttachments,
          },
          ...prev,
        ]);
      }
    }

    setSavingNote(false);
    bottomSheetRef.current?.close();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const name =
    getStudentDisplayName(preferredName, student?.child_legal_name) ||
    studentName ||
    "Student";
  const grade = student?.child_grade ?? null;
  const programLabel = (() => {
    const raw = (program ?? "").replace(/_/g, " ");
    const match = raw.match(/^school year (\d{2}) (\d{2})$/i);
    if (match) return `School Year '${match[1]}-'${match[2]}`;
    return raw.replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  return (
    <>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Profile card header */}
        <View style={styles.profileCard}>
          {/* Back row */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={20} color="#ffffff" />
            <Text style={[styles.backText, { color: "#ffffff" }]}>Students</Text>
          </TouchableOpacity>

          {/* Student header */}
          <View style={styles.studentHeader}>
            <View style={styles.headerAvatar}>
              {student?.profile_image_url ? (
                <Image
                  source={{ uri: student.profile_image_url }}
                  style={{ width: 46, height: 46, borderRadius: 23 }}
                />
              ) : (
                <Text style={styles.headerAvatarText}>{getInitials(name)}</Text>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {name}
              </Text>
              <View style={styles.headerBadges}>
                {grade && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{grade}</Text>
                  </View>
                )}
                {programLabel ? (
                  <View style={[styles.headerBadge, styles.headerBadgeSage]}>
                    <Text
                      style={[styles.headerBadgeText, styles.headerBadgeTextSage]}
                      numberOfLines={1}
                    >
                      {programLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Content area */}
        <View style={styles.contentArea}>
        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBarRow}
        >
          {TABS.map((t) => {
            const active = t.key === activeTab;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => handleTabChange(t.key)}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab content */}
        {loadingDetail ? (
          <View style={styles.centered}>
            <SkeletonBox width="70%" height={16} borderRadius={6} />
          </View>
        ) : detailError ? (
          <View style={styles.centered}>
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{detailError}</Text>
            </View>
          </View>
        ) : !student ? (
          <View style={styles.centered}>
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>Student not found.</Text>
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "info" && <InfoTab student={student} />}
            {activeTab === "contacts" && (
              <ContactsTab
                contacts={contacts}
                loading={loadingContacts}
              />
            )}
            {activeTab === "notes" && (
              <NotesTab
                notes={notes}
                loading={loadingNotes}
                onAdd={openAddNote}
                onEdit={openEditNote}
                onDelete={handleDeleteNote}
              />
            )}
            {activeTab === "attendance" && (
              <AttendanceTab
                records={attendanceRecords}
                loading={loadingAttendance}
                userMap={userMap}
              />
            )}
            {activeTab === "portfolio" && (
              <PlaceholderTab label="Portfolio" />
            )}
            {activeTab === "progress" && (
              <PlaceholderTab label="Progress" />
            )}
            {activeTab === "messages" && (
              <MessagesTab
                contacts={contacts}
                loadingContacts={loadingContacts}
                studentId={studentId}
              />
            )}
            {activeTab === "pickup" && <PlaceholderTab label="Pickup" />}
          </ScrollView>
        )}
        </View>
      </SafeAreaView>

      {/* Add/Edit Note Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["75%", "92%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sheetTitle}>
            {editingNote ? "Edit Note" : "Add Note"}
          </Text>

          {/* Note text */}
          <BottomSheetTextInput
            style={styles.noteTextInput}
            placeholder="Write your note here..."
            placeholderTextColor="#9ca3af"
            multiline
            value={noteText}
            onChangeText={setNoteText}
          />

          {/* Category */}
          <Text style={styles.sheetLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {NOTE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  noteCategory === cat && {
                    backgroundColor: CATEGORY_COLORS[cat] + "20",
                    borderColor: CATEGORY_COLORS[cat],
                  },
                ]}
                onPress={() => setNoteCategory(cat)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    noteCategory === cat && {
                      color: CATEGORY_COLORS[cat],
                      fontFamily: FontFamilies.bodySemiBold,
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Shared toggle */}
          <View style={styles.sheetRow}>
            <Text style={styles.sheetLabel}>Share with Parent</Text>
            <Switch
              value={noteShared}
              onValueChange={setNoteShared}
              trackColor={{ true: Brand.sage700, false: "#e5e7eb" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Attachments */}
          {!editingNote && (
            <>
              <Text style={styles.sheetLabel}>Attachments</Text>
              <View style={styles.attachmentButtons}>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={pickImage}
                  activeOpacity={0.75}
                >
                  <Ionicons name="image-outline" size={18} color="#6b7280" />
                  <Text style={styles.attachButtonText}>Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={pickFile}
                  activeOpacity={0.75}
                >
                  <Ionicons name="document-outline" size={18} color="#6b7280" />
                  <Text style={styles.attachButtonText}>File</Text>
                </TouchableOpacity>
              </View>

              {pendingAttachments.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
                  {pendingAttachments.map((att, i) =>
                    att.isImage ? (
                      <View key={i} style={{ marginRight: 8 }}>
                        <Image
                          source={{ uri: att.uri }}
                          style={styles.pendingThumb}
                        />
                        <TouchableOpacity
                          style={styles.removeThumb}
                          onPress={() =>
                            setPendingAttachments((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color="#dc2626"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View key={i} style={[styles.fileChip, { marginRight: 8 }]}>
                        <Ionicons
                          name="document-outline"
                          size={14}
                          color="#6b7280"
                        />
                        <Text style={styles.fileChipText} numberOfLines={1}>
                          {att.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            setPendingAttachments((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={16}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                      </View>
                    ),
                  )}
                </ScrollView>
              )}
            </>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!noteText.trim() || savingNote) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveNote}
            disabled={!noteText.trim() || savingNote}
            activeOpacity={0.75}
          >
            <Text style={styles.saveButtonText}>
              {savingNote ? "Saving..." : editingNote ? "Save Changes" : "Add Note"}
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>

    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.sage800 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // Back row
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  backText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },

  // Content area (white background below profile card)
  contentArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // Profile card
  profileCard: {
    backgroundColor: Brand.sage800,
    paddingBottom: 16,
  },

  // Student header strip
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
    gap: 12,
  },
  headerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#ffffff",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 17,
    color: "#ffffff",
  },
  headerBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerBadgeSage: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  headerBadgeText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  headerBadgeTextSage: {
    color: "#ffffff",
  },

  // Tab bar
  tabBarScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tabBarRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "rgba(94,124,104,0.08)",
    borderBottomWidth: 2,
    borderBottomColor: Brand.sage700,
  },
  tabText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
  },
  tabTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },

  // Scroll content
  scrollContent: {
    padding: 16,
    paddingBottom: BottomTabInset,
    gap: 12,
  },

  // Section card
  sectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  sectionCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
    marginBottom: 6,
  },

  // Info row
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
    gap: 2,
  },
  infoLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  linkText: {
    color: Brand.sage700,
    textDecorationLine: "underline",
  },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },

  // Contact card
  contactCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  relationBadge: {
    backgroundColor: "rgba(94,124,104,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relationBadgeText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: Brand.sage700,
  },
  contactName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  copyButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // Notes
  addNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.sage700,
    backgroundColor: "rgba(94,124,104,0.06)",
  },
  addNoteButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  noteCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  noteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  noteDate: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: "auto",
  },
  noteText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },
  attachmentsLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
  },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 8,
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    maxWidth: 160,
  },
  fileChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#374151",
    flex: 1,
  },
  noteActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  noteActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    backgroundColor: "#F2F7F3",
  },
  noteActionText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },

  // Attendance
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  attendanceDate: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
  },
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
  attProgramLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
  },
  attPickupSub: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  // Attendance detail modal
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
  attDetailProgram: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: -8,
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
  attDetailPickupName: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
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

  // Messages / Guardian row
  guardianRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  guardianName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  guardianRel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    backgroundColor: "#F2F7F3",
  },
  messageButtonDisabled: {
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  messageButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },

  // Placeholder
  placeholderCard: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  placeholderHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
  },
  placeholderText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },

  // Error
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
  },

  // Bottom sheet
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 12,
  },
  sheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
    marginBottom: 4,
  },
  sheetLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteTextInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    minHeight: 110,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  categoryChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  attachmentButtons: {
    flexDirection: "row",
    gap: 10,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  attachButtonText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  pendingThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removeThumb: {
    position: "absolute",
    top: -6,
    right: 2,
  },
  saveButton: {
    backgroundColor: Brand.sage700,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
});

