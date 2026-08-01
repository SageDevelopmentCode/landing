import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface StudentRow {
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
}

interface AllStudentRow {
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
  teacherName: string | null;
}

const PROGRAMS = [
  { key: "summer_26",          label: "Summer 26",  icon: "sunny-outline",  color: "#d97706" },
  { key: "school_year_26_27",  label: "School Year", icon: "school-outline", color: "#3b82f6" },
  { key: "homeschool_drop_in", label: "Drop-In",    icon: "walk-outline",   color: "#059669" },
];

const TEACHER_COLORS: Record<string, { bg: string; accent: string }> = {
  "Sabrina Obnamia": { bg: "#fce7f3", accent: "#db2777" },
  "Zelinda Melo":    { bg: "#ffedd5", accent: "#ea580c" },
  "Paige Wood":      { bg: "#dcfce7", accent: "#16a34a" },
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

function formatProgram(program: string): string {
  return program.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudentListScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [activeProgram, setActiveProgram] = useState("summer_26");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"my" | "all">("my");
  const [allStudents, setAllStudents] = useState<AllStudentRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);
  const [activeAllProgram, setActiveAllProgram] = useState("summer_26");

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

        const { data: studentProfiles } = await supabase
          .schema("admin")
          .from("students")
          .select("id, child_legal_name, child_grade, profile_image_url")
          .in("id", studentIds)
          .eq("is_deleted", false);

        const { data: applications } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("student_id, has_allergies, program, drop_in_program")
          .in("student_id", studentIds);

        const allergyMap = new Map(
          (applications ?? []).map((a) => [a.student_id, a.has_allergies])
        );
        const appProgramMap = new Map(
          (applications ?? []).map((a: { student_id: string; has_allergies: string | null; program: string | null; drop_in_program: string | null }) => [a.student_id, a.program])
        );
        const dropInProgramMap = new Map(
          (applications ?? []).map((a: { student_id: string; drop_in_program: string | null }) => [a.student_id, a.drop_in_program])
        );

        const profileById: Record<
          string,
          { child_legal_name: string; child_grade: string | null; profile_image_url: string | null }
        > = {};
        for (const s of studentProfiles ?? []) {
          profileById[s.id] = s;
        }

        const rows: StudentRow[] = assignments.map((a) => ({
          id: a.id,
          student_id: a.student_id,
          name: profileById[a.student_id]?.child_legal_name ?? null,
          grade: profileById[a.student_id]?.child_grade ?? null,
          program: a.program,
          classroom: a.classroom,
          profile_image_url: profileById[a.student_id]?.profile_image_url ?? null,
          has_allergies: allergyMap.get(a.student_id) ?? null,
          isHomeschoolDropIn: appProgramMap.get(a.student_id) === "homeschool_drop_in",
          dropInProgram: dropInProgramMap.get(a.student_id) ?? null,
        }));

        if (!cancelled) {
          setStudents(rows);
          setLoading(false);
        }
      }

      async function fetchAllStudents() {
        setAllLoading(true);
        setAllError(null);

        const { data: allAssignments, error: allAssignErr } = await supabase
          .rpc("get_all_teacher_assignments");

        if (allAssignErr || !allAssignments) {
          if (!cancelled) {
            if (allAssignErr) notifyError("staff-students-fetch-all", allAssignErr);
            setAllError(allAssignErr?.message ?? "Failed to load all students.");
            setAllLoading(false);
          }
          return;
        }

        const studentIds = [...new Set((allAssignments as any[]).map((a) => a.student_id))];

        if (studentIds.length === 0) {
          if (!cancelled) {
            setAllStudents([]);
            setAllLoading(false);
          }
          return;
        }

        const [{ data: studentProfiles }, { data: applications }] =
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
              .select("student_id, has_allergies, program, drop_in_program")
              .in("student_id", studentIds),
          ]);

        const profileById: Record<
          string,
          { child_legal_name: string; child_grade: string | null; profile_image_url: string | null }
        > = {};
        for (const s of studentProfiles ?? []) {
          profileById[s.id] = s;
        }

        const allergyMap = new Map(
          (applications ?? []).map((a) => [a.student_id, a.has_allergies])
        );
        const appProgramMap = new Map(
          (applications ?? []).map((a: { student_id: string; program: string | null }) => [a.student_id, a.program])
        );
        const dropInProgramMap = new Map(
          (applications ?? []).map((a: { student_id: string; drop_in_program: string | null }) => [a.student_id, a.drop_in_program])
        );

        const rows: AllStudentRow[] = (allAssignments as any[]).map((a) => ({
          id: a.assignment_id,
          student_id: a.student_id,
          name: profileById[a.student_id]?.child_legal_name ?? null,
          grade: profileById[a.student_id]?.child_grade ?? null,
          program: a.program,
          classroom: a.classroom,
          profile_image_url: profileById[a.student_id]?.profile_image_url ?? null,
          has_allergies: allergyMap.get(a.student_id) ?? null,
          isHomeschoolDropIn: appProgramMap.get(a.student_id) === "homeschool_drop_in",
          dropInProgram: dropInProgramMap.get(a.student_id) ?? null,
          teacherName: a.teacher_name ?? null,
        }));

        rows.sort((a, b) => {
          const tCmp = (a.teacherName ?? "").localeCompare(b.teacherName ?? "");
          if (tCmp !== 0) return tCmp;
          return (a.name ?? "").localeCompare(b.name ?? "");
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

  const filtered = students.filter((s) => {
    if (activeProgram === "homeschool_drop_in") return s.program === "homeschool_drop_in";
    if (s.program === activeProgram) return true;
    if (s.program === "homeschool_drop_in") {
      if (activeProgram === "summer_26")
        return s.dropInProgram === "summer_26" || s.dropInProgram === "both";
      if (activeProgram === "school_year_26_27")
        return s.dropInProgram === "school_year_26_27" || s.dropInProgram === "both";
    }
    return false;
  });

  const allFiltered = allStudents.filter((s) => {
    if (activeAllProgram === "homeschool_drop_in") return s.program === "homeschool_drop_in";
    if (s.program === activeAllProgram) return true;
    if (s.program === "homeschool_drop_in") {
      if (activeAllProgram === "summer_26")
        return s.dropInProgram === "summer_26" || s.dropInProgram === "both";
      if (activeAllProgram === "school_year_26_27")
        return s.dropInProgram === "school_year_26_27" || s.dropInProgram === "both";
    }
    return false;
  });

  const isMyLoading = loading;
  const isAllLoading = allLoading;

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

      {/* View toggle */}
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
          {/* Program filter */}
          <View style={styles.filterScroll}>
            <View style={styles.filterRow}>
            {PROGRAMS.map((p) => {
              const active = p.key === activeProgram;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setActiveProgram(p.key)}
                  style={[
                    styles.filterPill,
                    active && { borderColor: p.color, backgroundColor: p.color + "18" },
                  ]}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={p.icon as "sunny-outline"}
                    size={15}
                    color={active ? p.color : "#9ca3af"}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      active && { color: p.color, fontFamily: FontFamilies.bodySemiBold },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            </View>
          </View>

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
                <TouchableOpacity
                  style={styles.studentRow}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/(staff)/students/[studentId]" as any,
                      params: {
                        studentId: item.student_id,
                        studentName: item.name ?? "",
                        program: item.program,
                        classroom: item.classroom ?? "",
                      },
                    })
                  }
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
                      <Text style={styles.studentName}>
                        {item.name ?? "Unknown Student"}
                      </Text>
                      {item.isHomeschoolDropIn && (
                        <Ionicons name="home" size={13} color="#059669" />
                      )}
                    </View>
                    <View style={styles.studentMeta}>
                      {item.grade && (
                        <Text style={styles.metaChip}>{item.grade}</Text>
                      )}
                      {item.classroom && (
                        <Text style={styles.metaChip}>
                          {item.classroom.includes("_")
                            ? item.classroom.split("_").join(" - ")
                            : item.classroom}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.programLabel}>
                      {item.isHomeschoolDropIn ? "Drop-In" : formatProgram(item.program)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            />
          )}
        </>
      ) : (
        <>
          {isAllLoading ? (
            <>
              <View style={styles.filterScroll}>
                <View style={styles.filterRow}>
                  {PROGRAMS.map((p) => (
                    <SkeletonBox key={p.key} width={100} height={40} borderRadius={9999} />
                  ))}
                </View>
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
            </>
          ) : allError ? (
            <View style={styles.centered}>
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{allError}</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Program filter for All Students */}
              <View style={styles.filterScroll}>
                <View style={styles.filterRow}>
                  {PROGRAMS.map((p) => {
                    const active = p.key === activeAllProgram;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        onPress={() => setActiveAllProgram(p.key)}
                        style={[
                          styles.filterPill,
                          active && { borderColor: p.color, backgroundColor: p.color + "18" },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={p.icon as "sunny-outline"}
                          size={15}
                          color={active ? p.color : "#9ca3af"}
                        />
                        <Text
                          style={[
                            styles.filterPillText,
                            active && { color: p.color, fontFamily: FontFamilies.bodySemiBold },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {allFiltered.length === 0 ? (
                <View style={styles.centered}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyHeading}>No Students</Text>
                    <Text style={styles.emptyBody}>No students in this program.</Text>
                  </View>
                </View>
              ) : (
            <FlatList
              data={allFiltered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const colors = item.teacherName ? TEACHER_COLORS[item.teacherName] : undefined;
                return (
                  <TouchableOpacity
                    style={[styles.studentRow, colors && { backgroundColor: colors.bg }]}
                    activeOpacity={0.75}
                    onPress={() =>
                      router.push({
                        pathname: "/(staff)/students/[studentId]" as any,
                        params: {
                          studentId: item.student_id,
                          studentName: item.name ?? "",
                          program: item.program,
                          classroom: item.classroom ?? "",
                          allStudentsView: "1",
                        },
                      })
                    }
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
                        <Text style={styles.studentName}>
                          {item.name ?? "Unknown Student"}
                        </Text>
                        {item.isHomeschoolDropIn && (
                          <Ionicons name="home" size={13} color="#059669" />
                        )}
                      </View>
                      <View style={styles.studentMeta}>
                        {item.grade && (
                          <Text style={styles.metaChip}>{item.grade}</Text>
                        )}
                        {item.classroom && (
                          <Text style={styles.metaChip}>
                            {item.classroom.includes("_")
                              ? item.classroom.split("_").join(" - ")
                              : item.classroom}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {item.teacherName && (
                          <Text style={[styles.teacherLabel, colors && { color: colors.accent }]}>
                            {item.teacherName}
                          </Text>
                        )}
                        {item.teacherName && (
                          <Text style={styles.teacherLabelDot}>·</Text>
                        )}
                        <Text style={styles.programLabel}>
                          {item.isHomeschoolDropIn ? "Drop-In" : formatProgram(item.program)}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                );
              }}
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
    gap: 3,
  },
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
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
  programLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Brand.sage700,
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
  teacherLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
  },
  teacherLabelDot: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
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
