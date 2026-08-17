import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { getStudentDisplayName } from "@/lib/student-display-name";
import { getCurrentSchoolYearMonthIndex } from "@/lib/school-year-attendance";
import { SCHOOL_YEAR_MONTHS } from "@/lib/school-year";
import { buildStudentMonthEnrollment } from "@/lib/student-month-enrollment";
import {
  getTeacherColors,
  groupStudentsByTeacher,
} from "@/lib/group-by-teacher";
import {
  isHomeschoolDropInTeacherAssignment,
  isSchoolYearTeacherAssignment,
} from "@/lib/student-teacher-assignments";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface StudentRowBase {
  id: string;
  student_id: string;
  name: string | null;
  grade: string | null;
  program: string;
  classroom: string | null;
  profile_image_url: string | null;
  has_allergies: string | null;
  isHomeschoolDropIn: boolean;
  dropInProgram: string | null;
  applicationProgram: string | null;
  isPaidForMonth: boolean;
  homeschoolDays: string[];
}

interface StudentRow extends StudentRowBase {}

interface AllStudentRow extends StudentRowBase {
  teacherName: string | null;
}

const PROGRAMS = [
  { key: "school_year_26_27", label: "School Year", icon: "school-outline", color: "#3b82f6" },
  { key: "homeschool_drop_in", label: "Drop-In", icon: "walk-outline", color: "#059669" },
];

const DONT_INCLUDE_TAG = "Don't Include";
const HIDDEN_ALL_STUDENTS_TEACHERS = new Set(["Paige Wood"]);

const DAY_KEYS = ["mon", "tue", "wed", "thu"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "Th",
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

function filterByProgram<T extends StudentRowBase>(
  rows: T[],
  activeProgram: string,
): T[] {
  if (activeProgram === "homeschool_drop_in") {
    return rows.filter((s) =>
      isHomeschoolDropInTeacherAssignment(s.program, s.dropInProgram),
    );
  }
  return rows.filter((s) =>
    isSchoolYearTeacherAssignment(s.program, s.dropInProgram),
  );
}

function isStudentEnrolledForMonth(item: StudentRowBase): boolean {
  if (item.isHomeschoolDropIn) {
    return item.homeschoolDays.length > 0 || item.isPaidForMonth;
  }
  return item.isPaidForMonth;
}

function formatStudentMeta(
  grade: string | null,
  classroom: string | null,
): string | null {
  const parts: string[] = [];
  if (grade) parts.push(grade);
  if (classroom) {
    parts.push(
      classroom.includes("_")
        ? classroom.split("_").join(" - ")
        : classroom,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function sortMyStudentsByEnrollment(rows: StudentRow[]): StudentRow[] {
  return [...rows].sort((a, b) => {
    const aDeprioritize = !a.isPaidForMonth || !isStudentEnrolledForMonth(a);
    const bDeprioritize = !b.isPaidForMonth || !isStudentEnrolledForMonth(b);
    if (aDeprioritize !== bDeprioritize) return aDeprioritize ? 1 : -1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
}

async function fetchEnrollmentForStudents(studentIds: string[]) {
  if (studentIds.length === 0) return new Map();

  const monthIndex = getCurrentSchoolYearMonthIndex();
  const { data: txns } = await supabase
    .schema("billing")
    .from("stripe_transactions")
    .select("student_id, payment_type, metadata")
    .in("student_id", studentIds)
    .in("payment_type", [
      "school_year_tuition",
      "homeschool_dropin",
      "homeschool",
      "supply_fee",
    ])
    .eq("status", "completed")
    .eq("is_deleted", false);

  return buildStudentMonthEnrollment(txns ?? [], monthIndex);
}

function AllStudentsRow({
  item,
  monthShort,
  teacherColors,
  onPress,
}: {
  item: AllStudentRow;
  monthShort: string;
  teacherColors: { bg: string; accent: string };
  onPress: () => void;
}) {
  const isEnrolled = isStudentEnrolledForMonth(item);
  const metaLine = formatStudentMeta(item.grade, item.classroom);
  const showDayPills =
    item.isHomeschoolDropIn && item.homeschoolDays.length > 0;
  const needsAttention = !item.isPaidForMonth || !isEnrolled;

  return (
    <TouchableOpacity
      style={[
        styles.allStudentRow,
        { borderLeftColor: teacherColors.accent },
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={{ position: "relative" }}>
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            style={styles.allStudentAvatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.allStudentAvatar}>
            <Text style={styles.allStudentAvatarText}>
              {item.name ? getInitials(item.name) : "?"}
            </Text>
          </View>
        )}
        {item.has_allergies === "yes" && (
          <View style={styles.allergyBadgeSmall}>
            <Ionicons name="medical" size={7} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.studentInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.name ?? "Unknown Student"}
          </Text>
          {item.isHomeschoolDropIn && (
            <Ionicons name="home" size={13} color="#059669" />
          )}
        </View>

        {metaLine ? (
          <Text style={styles.metaLine} numberOfLines={1}>
            {metaLine}
          </Text>
        ) : null}

        {needsAttention ? (
          <View style={styles.attentionRow}>
            {!item.isPaidForMonth && (
              <View style={styles.attentionChip}>
                <Text style={styles.attentionChipText}>Unpaid</Text>
              </View>
            )}
            {!isEnrolled && (
              <View style={styles.attentionChip}>
                <Text style={styles.attentionChipText}>
                  {monthShort} Not Enrolled
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.enrolledHint}>{monthShort} enrolled</Text>
        )}

        {showDayPills && (
          <View style={styles.dayPillRow}>
            {DAY_KEYS.map((dk) => {
              const active = item.homeschoolDays.includes(dk);
              return (
                <View
                  key={dk}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      active && styles.dayPillTextActive,
                    ]}
                  >
                    {DAY_LABELS[dk]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}

function StudentListRow({
  item,
  monthShort,
  onPress,
}: {
  item: StudentRowBase;
  monthShort: string;
  onPress: () => void;
}) {
  const isEnrolled = isStudentEnrolledForMonth(item);

  return (
    <TouchableOpacity
      style={styles.studentRow}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={{ position: "relative" }}>
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name ? getInitials(item.name) : "?"}
            </Text>
          </View>
        )}
        {item.has_allergies === "yes" && (
          <View style={styles.allergyBadge}>
            <Ionicons name="medical" size={10} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.studentInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.name ?? "Unknown Student"}
          </Text>
          {item.isHomeschoolDropIn && (
            <Ionicons name="home" size={13} color="#059669" />
          )}
        </View>

        <View style={styles.studentMeta}>
          {item.grade ? <Text style={styles.metaChip}>{item.grade}</Text> : null}
          {item.classroom ? (
            <Text style={styles.metaChip}>
              {item.classroom.includes("_")
                ? item.classroom.split("_").join(" - ")
                : item.classroom}
            </Text>
          ) : null}
        </View>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              item.isPaidForMonth ? styles.paidBadge : styles.unpaidBadge,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: item.isPaidForMonth ? "#15803d" : "#9ca3af" },
              ]}
            >
              {item.isPaidForMonth ? "Paid" : "Unpaid"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isEnrolled ? styles.paidBadge : styles.unpaidBadge,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isEnrolled ? "#15803d" : "#9ca3af" },
              ]}
            >
              {isEnrolled ? `${monthShort} Enrolled` : `${monthShort} Not Enrolled`}
            </Text>
          </View>
        </View>

        {item.isHomeschoolDropIn && (
          <View style={styles.dayPillRow}>
            {DAY_KEYS.map((dk) => {
              const active = item.homeschoolDays.includes(dk);
              return (
                <View
                  key={dk}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      active && styles.dayPillTextActive,
                    ]}
                  >
                    {DAY_LABELS[dk]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

export default function StudentListScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [activeProgram, setActiveProgram] = useState("school_year_26_27");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"my" | "all">("my");
  const [allStudents, setAllStudents] = useState<AllStudentRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);
  const [activeAllProgram, setActiveAllProgram] = useState("school_year_26_27");

  const monthShort = useMemo(() => {
    const idx = getCurrentSchoolYearMonthIndex();
    return SCHOOL_YEAR_MONTHS.find((m) => m.index === idx)?.short ?? "Month";
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function fetchStudents() {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setError("Not authenticated.");
            setLoading(false);
          }
          return;
        }

        const { data: assignments, error: assignErr } = await supabase
          .schema("teachers")
          .from("teacher_students")
          .select("id, student_id, program, classroom")
          .eq("teacher_id", user.id)
          .eq("is_deleted", false);

        if (assignErr || !assignments) {
          if (!cancelled) {
            if (assignErr) notifyError("staff-students-fetch", assignErr);
            setError(assignErr?.message ?? "Failed to load students.");
            setLoading(false);
          }
          return;
        }

        const studentIds = assignments.map((a) => a.student_id);

        if (studentIds.length === 0) {
          if (!cancelled) {
            setStudents([]);
            setLoading(false);
          }
          return;
        }

        const [{ data: studentProfiles }, { data: applications }, enrollmentMap] =
          await Promise.all([
            supabase
              .schema("admin")
              .from("students")
              .select("id, child_legal_name, child_grade, profile_image_url")
              .in("id", studentIds)
              .eq("is_deleted", false),
            supabase
              .schema("parent_app")
              .from("applications")
              .select(
                "student_id, has_allergies, program, drop_in_program, preferred_name, child_legal_name, admin_tags",
              )
              .in("student_id", studentIds),
            fetchEnrollmentForStudents(studentIds),
          ]);

        const excludedStudentIds = new Set(
          (applications ?? [])
            .filter((a) => (a.admin_tags ?? []).includes(DONT_INCLUDE_TAG))
            .map((a) => a.student_id),
        );
        const includedAssignments = assignments.filter(
          (a) => !excludedStudentIds.has(a.student_id),
        );

        const displayNameMap = new Map(
          (applications ?? []).map(
            (a: {
              student_id: string;
              preferred_name: string | null;
              child_legal_name: string | null;
            }) => [
              a.student_id,
              getStudentDisplayName(a.preferred_name, a.child_legal_name),
            ],
          ),
        );
        const allergyMap = new Map(
          (applications ?? []).map((a) => [a.student_id, a.has_allergies]),
        );
        const appProgramMap = new Map(
          (applications ?? []).map(
            (a: {
              student_id: string;
              program: string | null;
            }) => [a.student_id, a.program],
          ),
        );
        const dropInProgramMap = new Map(
          (applications ?? []).map(
            (a: { student_id: string; drop_in_program: string | null }) => [
              a.student_id,
              a.drop_in_program,
            ],
          ),
        );

        const profileById: Record<
          string,
          {
            child_legal_name: string;
            child_grade: string | null;
            profile_image_url: string | null;
          }
        > = {};
        for (const s of studentProfiles ?? []) {
          profileById[s.id] = s;
        }

        const rows: StudentRow[] = includedAssignments.map((a) => {
          const enrollment = enrollmentMap.get(a.student_id);
          return {
            id: a.id,
            student_id: a.student_id,
            name:
              displayNameMap.get(a.student_id) ??
              profileById[a.student_id]?.child_legal_name ??
              null,
            grade: profileById[a.student_id]?.child_grade ?? null,
            program: a.program,
            classroom: a.classroom,
            profile_image_url:
              profileById[a.student_id]?.profile_image_url ?? null,
            has_allergies: allergyMap.get(a.student_id) ?? null,
            isHomeschoolDropIn:
              appProgramMap.get(a.student_id) === "homeschool_drop_in",
            dropInProgram: dropInProgramMap.get(a.student_id) ?? null,
            applicationProgram: appProgramMap.get(a.student_id) ?? null,
            isPaidForMonth: enrollment?.isPaidForMonth ?? false,
            homeschoolDays: enrollment?.homeschoolDays ?? [],
          };
        });

        if (!cancelled) {
          setStudents(rows);
          setLoading(false);
        }
      }

      async function fetchAllStudents() {
        setAllLoading(true);
        setAllError(null);

        const { data: allAssignments, error: allAssignErr } = await supabase.rpc(
          "get_all_teacher_assignments",
        );

        if (allAssignErr || !allAssignments) {
          if (!cancelled) {
            if (allAssignErr) notifyError("staff-students-fetch-all", allAssignErr);
            setAllError(allAssignErr?.message ?? "Failed to load all students.");
            setAllLoading(false);
          }
          return;
        }

        const studentIds = [
          ...new Set((allAssignments as { student_id: string }[]).map((a) => a.student_id)),
        ];

        if (studentIds.length === 0) {
          if (!cancelled) {
            setAllStudents([]);
            setAllLoading(false);
          }
          return;
        }

        const [{ data: studentProfiles }, { data: applications }, enrollmentMap] =
          await Promise.all([
            supabase
              .schema("admin")
              .from("students")
              .select("id, child_legal_name, child_grade, profile_image_url")
              .in("id", studentIds)
              .eq("is_deleted", false),
            supabase
              .schema("parent_app")
              .from("applications")
              .select(
                "student_id, has_allergies, program, drop_in_program, preferred_name, child_legal_name, admin_tags",
              )
              .in("student_id", studentIds),
            fetchEnrollmentForStudents(studentIds),
          ]);

        const excludedStudentIds = new Set(
          (applications ?? [])
            .filter((a) => (a.admin_tags ?? []).includes(DONT_INCLUDE_TAG))
            .map((a) => a.student_id),
        );
        const includedAssignments = (
          allAssignments as {
            assignment_id: string;
            student_id: string;
            program: string;
            classroom: string | null;
            teacher_name: string | null;
          }[]
        ).filter((a) => !excludedStudentIds.has(a.student_id));

        const profileById: Record<
          string,
          {
            child_legal_name: string;
            child_grade: string | null;
            profile_image_url: string | null;
          }
        > = {};
        for (const s of studentProfiles ?? []) {
          profileById[s.id] = s;
        }

        const displayNameMap = new Map(
          (applications ?? []).map(
            (a: {
              student_id: string;
              preferred_name: string | null;
              child_legal_name: string | null;
            }) => [
              a.student_id,
              getStudentDisplayName(a.preferred_name, a.child_legal_name),
            ],
          ),
        );
        const allergyMap = new Map(
          (applications ?? []).map((a) => [a.student_id, a.has_allergies]),
        );
        const appProgramMap = new Map(
          (applications ?? []).map(
            (a: { student_id: string; program: string | null }) => [
              a.student_id,
              a.program,
            ],
          ),
        );
        const dropInProgramMap = new Map(
          (applications ?? []).map(
            (a: { student_id: string; drop_in_program: string | null }) => [
              a.student_id,
              a.drop_in_program,
            ],
          ),
        );

        const rows: AllStudentRow[] = includedAssignments.map((a) => {
          const enrollment = enrollmentMap.get(a.student_id);
          return {
            id: a.assignment_id,
            student_id: a.student_id,
            name:
              displayNameMap.get(a.student_id) ??
              profileById[a.student_id]?.child_legal_name ??
              null,
            grade: profileById[a.student_id]?.child_grade ?? null,
            program: a.program,
            classroom: a.classroom,
            profile_image_url:
              profileById[a.student_id]?.profile_image_url ?? null,
            has_allergies: allergyMap.get(a.student_id) ?? null,
            isHomeschoolDropIn:
              appProgramMap.get(a.student_id) === "homeschool_drop_in",
            dropInProgram: dropInProgramMap.get(a.student_id) ?? null,
            applicationProgram: appProgramMap.get(a.student_id) ?? null,
            isPaidForMonth: enrollment?.isPaidForMonth ?? false,
            homeschoolDays: enrollment?.homeschoolDays ?? [],
            teacherName: a.teacher_name ?? null,
          };
        });

        if (!cancelled) {
          setAllStudents(rows);
          setAllLoading(false);
        }
      }

      fetchStudents();
      fetchAllStudents();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const filtered = sortMyStudentsByEnrollment(
    filterByProgram(students, activeProgram),
  );
  const allFiltered = filterByProgram(allStudents, activeAllProgram).filter(
    (s) => !HIDDEN_ALL_STUDENTS_TEACHERS.has(s.teacherName ?? ""),
  );

  const allTeacherSections = useMemo(
    () =>
      groupStudentsByTeacher(allFiltered, (s) =>
        !s.isPaidForMonth || !isStudentEnrolledForMonth(s) ? 1 : 0,
      ),
    [allFiltered],
  );

  const isMyLoading = loading;
  const isAllLoading = allLoading;

  function renderProgramFilters(
    active: string,
    onSelect: (key: string) => void,
  ) {
    return (
      <View style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {PROGRAMS.map((p) => {
            const isActive = p.key === active;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => onSelect(p.key)}
                style={[
                  styles.filterPill,
                  isActive && {
                    borderColor: p.color,
                    backgroundColor: p.color + "18",
                  },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={p.icon as "school-outline"}
                  size={15}
                  color={isActive ? p.color : "#9ca3af"}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && {
                      color: p.color,
                      fontFamily: FontFamilies.bodySemiBold,
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (isMyLoading && activeView === "my") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Students</Text>
        </View>
        <View style={styles.viewToggleRow}>
          <SkeletonBox width={120} height={36} borderRadius={9999} />
          <SkeletonBox width={120} height={36} borderRadius={9999} />
        </View>
        <View style={styles.filterRow}>
          {PROGRAMS.map((p) => (
            <SkeletonBox key={p.key} width={100} height={40} borderRadius={9999} />
          ))}
        </View>
        <View style={{ gap: 0 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <SkeletonBox width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBox width="55%" height={14} borderRadius={4} />
                <SkeletonBox width="35%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error && activeView === "my") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Students</Text>
        </View>
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const countBadgeValue = activeView === "my" ? filtered.length : allFiltered.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Students</Text>
        <Text style={styles.countBadge}>{countBadgeValue}</Text>
      </View>

      <View style={styles.viewToggleRow}>
        <TouchableOpacity
          style={[styles.viewTogglePill, activeView === "my" && styles.viewTogglePillActive]}
          onPress={() => setActiveView("my")}
          activeOpacity={0.75}
        >
          <Text style={[styles.viewToggleText, activeView === "my" && styles.viewToggleTextActive]}>
            My Students
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTogglePill, activeView === "all" && styles.viewTogglePillActive]}
          onPress={() => setActiveView("all")}
          activeOpacity={0.75}
        >
          <Text style={[styles.viewToggleText, activeView === "all" && styles.viewToggleTextActive]}>
            All Students
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === "my" ? (
        <>
          {renderProgramFilters(activeProgram, setActiveProgram)}

          {filtered.length === 0 ? (
            <View style={styles.centered}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyHeading}>No Students</Text>
                <Text style={styles.emptyBody}>No students in this program.</Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <StudentListRow
                  item={item}
                  monthShort={monthShort}
                  onPress={() =>
                    router.push({
                      pathname: "/(staff)/students/[studentId]" as never,
                      params: {
                        studentId: item.student_id,
                        studentName: item.name ?? "",
                        program: item.program,
                        classroom: item.classroom ?? "",
                      },
                    })
                  }
                />
              )}
            />
          )}
        </>
      ) : (
        <>
          {isAllLoading ? (
            <>
              <View style={styles.filterRow}>
                {PROGRAMS.map((p) => (
                  <SkeletonBox key={p.key} width={100} height={40} borderRadius={9999} />
                ))}
              </View>
              <View style={styles.teacherSection}>
                <SkeletonBox width="100%" height={40} borderRadius={0} />
                {[1, 2].map((i) => (
                  <View key={i} style={styles.skeletonRow}>
                    <SkeletonBox width={40} height={40} borderRadius={20} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <SkeletonBox width="50%" height={14} borderRadius={4} />
                      <SkeletonBox width="70%" height={11} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : allError ? (
            <View style={styles.centered}>
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{allError}</Text>
              </View>
            </View>
          ) : (
            <>
              {renderProgramFilters(activeAllProgram, setActiveAllProgram)}

              {allFiltered.length === 0 ? (
                <View style={styles.centered}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyHeading}>No Students</Text>
                    <Text style={styles.emptyBody}>No students in this program.</Text>
                  </View>
                </View>
              ) : (
                <SectionList
                  sections={allTeacherSections.map((section) => ({
                    title: section.teacherName,
                    data: section.students,
                  }))}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  stickySectionHeadersEnabled={false}
                  renderSectionHeader={({ section }) => {
                    const colors = getTeacherColors(section.title);
                    return (
                      <View
                        style={[
                          styles.teacherSectionHeader,
                          { backgroundColor: colors.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.teacherSectionTitle,
                            { color: colors.accent },
                          ]}
                        >
                          {section.title}
                        </Text>
                        <Text
                          style={[
                            styles.teacherSectionCount,
                            { color: colors.accent },
                          ]}
                        >
                          {section.data.length}{" "}
                          {section.data.length === 1 ? "student" : "students"}
                        </Text>
                      </View>
                    );
                  }}
                  renderItem={({ item, section }) => (
                    <AllStudentsRow
                      item={item}
                      monthShort={monthShort}
                      teacherColors={getTeacherColors(section.title)}
                      onPress={() =>
                        router.push({
                          pathname: "/(staff)/students/[studentId]" as never,
                          params: {
                            studentId: item.student_id,
                            studentName: item.name ?? "",
                            program: item.program,
                            classroom: item.classroom ?? "",
                            allStudentsView: "1",
                          },
                        })
                      }
                    />
                  )}
                  SectionSeparatorComponent={() => (
                    <View style={styles.teacherSectionSpacer} />
                  )}
                />
              )}
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  pageTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: Brand.sage700,
    flex: 1,
  },
  countBadge: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
    backgroundColor: "rgba(94,124,104,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  filterScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  filterPillText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
  listContent: {
    paddingBottom: BottomTabInset,
  },
  teacherSection: {
    marginBottom: 16,
  },
  teacherSectionSpacer: {
    height: 16,
  },
  teacherSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  teacherSectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
  },
  teacherSectionCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    opacity: 0.85,
  },
  allStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0efed",
    borderLeftWidth: 3,
  },
  allStudentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  allStudentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  allStudentAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  allergyBadgeSmall: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  metaLine: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  attentionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  attentionChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  attentionChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#6b7280",
  },
  enrolledHint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
    opacity: 0.75,
    marginTop: 1,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f0efed",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
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
  allergyBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    flexShrink: 1,
  },
  studentMeta: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  metaChip: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: "#dcfce7",
  },
  unpaidBadge: {
    backgroundColor: "#f3f4f6",
  },
  statusBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
  dayPillRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  dayPill: {
    width: 26,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillActive: {
    backgroundColor: "#dcfce7",
  },
  dayPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
  },
  dayPillTextActive: {
    color: "#15803d",
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f0efed",
  },
  viewToggleRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  viewTogglePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#f3f4f6",
  },
  viewTogglePillActive: {
    backgroundColor: Brand.sage700,
  },
  viewToggleText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
  viewToggleTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#ffffff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyCard: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 20,
    gap: 6,
    width: "100%",
  },
  emptyHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  emptyBody: {
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
    width: "100%",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
  },
});
